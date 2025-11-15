const fs = require('fs');
const path = require('path');

class SettingsManager {
  constructor() {
    this.settingsPath = path.join(__dirname, '../../..', '.settings.json');
    this.defaultSettings = {
      sheetName: 'Feuille1',
      sheetRange: 'A2:Z1000',
      columns: {
        brand: 'A',
        productName: 'B',
        cheapestBuyLink: 'C',
        cheapestBuyPrice: 'D',
        lcaLink: 'E',
        kmlsLink: 'F',
        estimatedSalePrice: 'G',
        actualSalePrice: 'H'
      }
    };
    this.ensureSettings();
  }

  ensureSettings() {
    try {
      if (!fs.existsSync(this.settingsPath)) {
        this.saveSettings(this.defaultSettings);
        console.log('✅ Fichier de paramètres créé avec valeurs par défaut');
      }
    } catch (error) {
      console.error('Erreur initialisation paramètres:', error);
    }
  }

  getSettings() {
    try {
      const data = fs.readFileSync(this.settingsPath, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Erreur lecture paramètres:', error);
      return this.defaultSettings;
    }
  }

  saveSettings(settings) {
    try {
      // Valider les paramètres
      if (!settings.columns) {
        throw new Error('Configuration des colonnes manquante');
      }

      fs.writeFileSync(
        this.settingsPath, 
        JSON.stringify(settings, null, 2),
        'utf-8'
      );

      console.log('✅ Paramètres sauvegardés');
      return true;
    } catch (error) {
      console.error('Erreur sauvegarde paramètres:', error);
      throw error;
    }
  }

  resetSettings() {
    try {
      this.saveSettings(this.defaultSettings);
      console.log('✅ Paramètres réinitialisés');
      return true;
    } catch (error) {
      console.error('Erreur réinitialisation paramètres:', error);
      throw error;
    }
  }

  validateSettings(settings) {
    const required = [
      'brand',
      'productName',
      'cheapestBuyLink',
      'cheapestBuyPrice',
      'lcaLink',
      'kmlsLink'
    ];

    for (const field of required) {
      if (!settings.columns[field]) {
        throw new Error(`Champ requis manquant: ${field}`);
      }
    }

    return true;
  }
}

module.exports = new SettingsManager();