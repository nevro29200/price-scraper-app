const { google } = require('googleapis');
const settingsManager = require('../config/settings');
const path = require('path');

class SheetsService {
  constructor() {
    this.sheets = null;
    this.auth = null;
    this.spreadsheetId = process.env.GOOGLE_SHEET_ID;
  }

  async initialize() {
    if (this.sheets) return;

    try {
      const credentialsPath = path.join(__dirname, '../../../google-credentials.json');
      
      this.auth = new google.auth.GoogleAuth({
        keyFile: credentialsPath,
        scopes: ['https://www.googleapis.com/auth/spreadsheets']
      });

      this.sheets = google.sheets({ version: 'v4', auth: this.auth });
      console.log('✅ Google Sheets API initialisée');
    } catch (error) {
      console.error('Erreur initialisation Google Sheets:', error);
      throw error;
    }
  }

  async getSheetData() {
    await this.initialize();

    try {
      const settings = settingsManager.getSettings();
      const range = settings.sheetRange || 'A2:Z1000';

      const [valuesResponse, formulasResponse] = await Promise.all([
        this.sheets.spreadsheets.values.get({
          spreadsheetId: this.spreadsheetId,
          range: settings.sheetName ? `${settings.sheetName}!${range}` : range,
          valueRenderOption: 'FORMATTED_VALUE'
        }),
        this.sheets.spreadsheets.get({
          spreadsheetId: this.spreadsheetId,
          ranges: [settings.sheetName ? `${settings.sheetName}!${range}` : range],
          fields: 'sheets.data.rowData.values.hyperlink,sheets.data.rowData.values.formattedValue'
        })
      ]);

      const rows = valuesResponse.data.values || [];
      const sheetData = formulasResponse.data.sheets[0].data[0].rowData || [];

      const products = rows.map((row, index) => {
        const rowData = sheetData[index]?.values || [];
        
        const product = {
          rowIndex: index + 2,
          brand: row[this.getColumnIndex(settings.columns.brand)] || '',
          name: row[this.getColumnIndex(settings.columns.productName)] || '',
          currentUrl: this.extractHyperlink(rowData, this.getColumnIndex(settings.columns.cheapestBuyLink)) || 
                      row[this.getColumnIndex(settings.columns.cheapestBuyLink)] || '',
          currentPrice: this.parsePrice(row[this.getColumnIndex(settings.columns.cheapestBuyPrice)]),
          currentSupplier: '',
          lcaUrl: this.extractHyperlink(rowData, this.getColumnIndex(settings.columns.lcaLink)) || 
                  row[this.getColumnIndex(settings.columns.lcaLink)] || '',
          kmlsUrl: this.extractHyperlink(rowData, this.getColumnIndex(settings.columns.kmlsLink)) || 
                   row[this.getColumnIndex(settings.columns.kmlsLink)] || '',
          estimatedSalePrice: this.parsePrice(row[this.getColumnIndex(settings.columns.estimatedSalePrice)]),
          actualSalePrice: this.parsePrice(row[this.getColumnIndex(settings.columns.actualSalePrice)]),
          lcaPrice: this.parsePrice(row[this.getColumnIndex('I')]),
          kmlsPrice: this.parsePrice(row[this.getColumnIndex('J')])
        };
        
        product.currentSupplier = this.extractSupplier(product.currentUrl);
        
        // Debug: afficher ce qui est lu
        console.log(`📦 Produit: ${product.name}`);
        console.log(`   Prix actuel brut: "${row[this.getColumnIndex(settings.columns.cheapestBuyPrice)]}" → parsé: ${product.currentPrice}`);
        console.log(`   Prix LCA brut: "${row[this.getColumnIndex('I')]}" → parsé: ${product.lcaPrice}`);
        console.log(`   Prix KMLS brut: "${row[this.getColumnIndex('J')]}" → parsé: ${product.kmlsPrice}`);
        console.log(`   LCA URL: ${product.lcaUrl}`);
        console.log(`   KMLS URL: ${product.kmlsUrl}`);
        
        return product;
      }).filter(p => p.name);

      console.log(`📊 ${products.length} produits chargés depuis Google Sheets`);

      return products;

    } catch (error) {
      console.error('Erreur lecture Google Sheet:', error);
      throw error;
    }
  }

  async updateSheet(comparisons) {
    await this.initialize();

    try {
      const settings = settingsManager.getSettings();
      const updates = [];

      for (const comp of comparisons) {
        const rowIndex = comp.product.rowIndex;

        console.log(`📝 Mise à jour ligne ${rowIndex}:`);
        
        // Toujours mettre à jour les prix LCA et KMLS (colonnes I et J)
        if (comp.prices.lca !== null) {
          updates.push({
            range: this.getCellRange(rowIndex, 'I'),
            values: [[comp.prices.lca]]
          });
          console.log(`   Prix LCA: ${comp.prices.lca}€ dans ${this.getCellRange(rowIndex, 'I')}`);
        }

        if (comp.prices.kmls !== null) {
          updates.push({
            range: this.getCellRange(rowIndex, 'J'),
            values: [[comp.prices.kmls]]
          });
          console.log(`   Prix KMLS: ${comp.prices.kmls}€ dans ${this.getCellRange(rowIndex, 'J')}`);
        }

        // Mettre à jour le prix et l'URL seulement s'il y a un changement
        if (!comp.hasChanges) continue;

        console.log(`   Prix: ${comp.after.price}€ dans ${this.getCellRange(rowIndex, settings.columns.cheapestBuyPrice)}`);
        console.log(`   URL: ${comp.after.url} dans ${this.getCellRange(rowIndex, settings.columns.cheapestBuyLink)}`);

        updates.push({
          range: this.getCellRange(rowIndex, settings.columns.cheapestBuyPrice),
          values: [[comp.after.price]]
        });

        updates.push({
          range: this.getCellRange(rowIndex, settings.columns.cheapestBuyLink),
          values: [[comp.after.url]]
        });
      }

      if (updates.length === 0) {
        return { success: true, updated: 0, message: 'Aucune modification à appliquer' };
      }

      await this.sheets.spreadsheets.values.batchUpdate({
        spreadsheetId: this.spreadsheetId,
        resource: {
          valueInputOption: 'USER_ENTERED',
          data: updates
        }
      });

      console.log(`✅ ${Math.floor(updates.length / 2)} produits mis à jour dans Google Sheets`);

      return {
        success: true,
        updated: Math.floor(updates.length / 2),
        message: `${Math.floor(updates.length / 2)} produits mis à jour avec succès`
      };

    } catch (error) {
      console.error('Erreur mise à jour Google Sheet:', error);
      throw error;
    }
  }

  parsePrice(value) {
    if (!value) return 0;
    
    // Si c'est déjà un nombre
    if (typeof value === 'number') return value;
    
    // Si c'est une chaîne
    if (typeof value === 'string') {
      // Supprimer les espaces, € et convertir virgule en point
      const cleaned = value.replace(/[^\d,.-]/g, '').replace(',', '.');
      const parsed = parseFloat(cleaned);
      return isNaN(parsed) ? 0 : parsed;
    }
    
    return 0;
  }

  extractHyperlink(rowData, columnIndex) {
    if (!rowData || !rowData[columnIndex]) return null;
    
    const cell = rowData[columnIndex];
    
    if (cell.hyperlink) {
      return cell.hyperlink;
    }
    
    return null;
  }

  extractValue(cell) {
    if (!cell || typeof cell !== 'string') return '';
    return cell;
  }

  extractUrl(cell) {
    if (!cell || typeof cell !== 'string') return '';
    
    if (cell.startsWith('http://') || cell.startsWith('https://')) {
      return cell;
    }
    
    return cell;
  }

  getColumnIndex(columnLetter) {
    if (!columnLetter) return 0;
    
    let index = 0;
    for (let i = 0; i < columnLetter.length; i++) {
      index = index * 26 + (columnLetter.charCodeAt(i) - 64);
    }
    return index - 1;
  }

  getCellRange(rowIndex, columnLetter) {
    const settings = settingsManager.getSettings();
    const sheetName = settings.sheetName || 'Feuille1';
    return `${sheetName}!${columnLetter}${rowIndex}`;
  }

  extractSupplier(url) {
    if (!url) return 'Inconnu';
    
    if (url.includes('lca-distribution')) return 'LCA';
    if (url.includes('kmls')) return 'KMLS';
    
    return 'Autre';
  }
}

module.exports = new SheetsService();