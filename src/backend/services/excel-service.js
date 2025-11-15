const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs').promises;
const os = require('os');

class ExcelService {
  async generateReport(comparisons) {
    try {
      // Filtrer uniquement les produits avec changements
      const changedProducts = comparisons.filter(c => c.hasChanges);

      if (changedProducts.length === 0) {
        throw new Error('Aucune variation de prix à exporter');
      }

      // Préparer les données pour Excel
      const data = changedProducts.map(comp => ({
        'Marque': comp.product.brand,
        'Nom du produit': comp.product.name,
        'Ancien prix (€)': comp.before.price.toFixed(2),
        'Nouveau prix (€)': comp.after.price.toFixed(2),
        'Variation (€)': comp.changes.priceChange.toFixed(2),
        'Variation (%)': comp.changes.priceChangePercent + '%',
        'Fournisseur avant': comp.before.supplier,
        'Fournisseur après': comp.after.supplier,
        'Prix LCA': comp.prices.lca ? comp.prices.lca.toFixed(2) : 'N/A',
        'Prix KMLS': comp.prices.kmls ? comp.prices.kmls.toFixed(2) : 'N/A'
      }));

      // Créer le workbook
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(data);

      // Ajuster la largeur des colonnes
      const colWidths = [
        { wch: 15 }, // Marque
        { wch: 35 }, // Nom du produit
        { wch: 15 }, // Ancien prix
        { wch: 15 }, // Nouveau prix
        { wch: 15 }, // Variation €
        { wch: 15 }, // Variation %
        { wch: 18 }, // Fournisseur avant
        { wch: 18 }, // Fournisseur après
        { wch: 12 }, // Prix LCA
        { wch: 12 }  // Prix KMLS
      ];
      ws['!cols'] = colWidths;

      // Ajouter la feuille au workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Variations de prix');

      // Générer le nom de fichier avec timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      const filename = `rapport-prix-${timestamp}.xlsx`;
      
      // Sauvegarder dans le dossier Downloads de l'utilisateur
      const downloadsPath = path.join(os.homedir(), 'Downloads');
      const filePath = path.join(downloadsPath, filename);

      // Écrire le fichier
      XLSX.writeFile(wb, filePath);

      console.log(`✅ Rapport Excel généré: ${filePath}`);

      return filePath;

    } catch (error) {
      console.error('Erreur génération rapport Excel:', error);
      throw error;
    }
  }

  async generateSummaryReport(comparisons, stats) {
    try {
      const wb = XLSX.utils.book_new();

      // Feuille 1: Variations détaillées
      const changedProducts = comparisons.filter(c => c.hasChanges);
      const detailData = changedProducts.map(comp => ({
        'Marque': comp.product.brand,
        'Nom du produit': comp.product.name,
        'Ancien prix (€)': comp.before.price.toFixed(2),
        'Nouveau prix (€)': comp.after.price.toFixed(2),
        'Variation (€)': comp.changes.priceChange.toFixed(2),
        'Variation (%)': comp.changes.priceChangePercent + '%',
        'Fournisseur avant': comp.before.supplier,
        'Fournisseur après': comp.after.supplier
      }));

      const wsDetail = XLSX.utils.json_to_sheet(detailData);
      wsDetail['!cols'] = Array(8).fill({ wch: 18 });
      XLSX.utils.book_append_sheet(wb, wsDetail, 'Détails');

      // Feuille 2: Statistiques
      const statsData = [
        { 'Indicateur': 'Total produits analysés', 'Valeur': stats.total },
        { 'Indicateur': 'Produits avec changements', 'Valeur': stats.withChanges },
        { 'Indicateur': 'Augmentations de prix', 'Valeur': stats.priceIncreases },
        { 'Indicateur': 'Diminutions de prix', 'Valeur': stats.priceDecreases },
        { 'Indicateur': 'Changements de fournisseur', 'Valeur': stats.supplierChanges },
        { 'Indicateur': 'Économies totales (€)', 'Valeur': stats.totalSavings.toFixed(2) },
        { 'Indicateur': 'Variation moyenne (€)', 'Valeur': stats.averageChange }
      ];

      const wsStats = XLSX.utils.json_to_sheet(statsData);
      wsStats['!cols'] = [{ wch: 30 }, { wch: 20 }];
      XLSX.utils.book_append_sheet(wb, wsStats, 'Statistiques');

      // Sauvegarder
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      const filename = `rapport-complet-${timestamp}.xlsx`;
      const downloadsPath = path.join(os.homedir(), 'Downloads');
      const filePath = path.join(downloadsPath, filename);

      XLSX.writeFile(wb, filePath);

      console.log(`✅ Rapport complet généré: ${filePath}`);

      return filePath;

    } catch (error) {
      console.error('Erreur génération rapport complet:', error);
      throw error;
    }
  }
}

module.exports = new ExcelService();