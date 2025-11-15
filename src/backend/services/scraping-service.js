const LCAScraper = require('../scrapers/lca-scraper');
const KMLSScraper = require('../scrapers/kmls-scraper');
const sheetsService = require('./sheets-service');

class ScrapingService {
  constructor() {
    this.lcaScraper = new LCAScraper();
    this.kmlsScraper = new KMLSScraper();
  }

  async scrapeAll() {
    try {
      console.log('🔄 Début du scraping de tous les produits...');

      // Récupérer les données du Google Sheet
      const sheetData = await sheetsService.getSheetData();

      const results = [];

      for (const product of sheetData) {
        try {
          const productResult = await this.scrapeSingle(product);
          results.push(productResult);
        } catch (error) {
          console.error(`Erreur scraping produit ${product.name}:`, error);
          results.push({
            product,
            error: error.message,
            success: false
          });
        }
      }

      console.log(`✅ Scraping terminé: ${results.length} produits traités`);

      return results;

    } catch (error) {
      console.error('Erreur scraping global:', error);
      throw error;
    }
  }

  async scrapeSingle(product) {
    try {
      console.log(`🔍 Scraping du produit: ${product.name}`);

      const results = {
        product,
        lca: null,
        kmls: null,
        success: true
      };

      // Scraper LCA si URL fournie
      if (product.lcaUrl) {
        try {
          results.lca = await this.lcaScraper.scrapeProduct(product.lcaUrl);
        } catch (error) {
          console.error(`Erreur LCA pour ${product.name}:`, error);
          results.lca = { error: error.message, price: null };
        }
      }

      // Scraper KMLS si URL fournie
      if (product.kmlsUrl) {
        try {
          results.kmls = await this.kmlsScraper.scrapeProduct(product.kmlsUrl);
        } catch (error) {
          console.error(`Erreur KMLS pour ${product.name}:`, error);
          results.kmls = { error: error.message, price: null };
        }
      }

      return results;

    } catch (error) {
      console.error('Erreur scraping produit:', error);
      throw error;
    }
  }

  async cleanup() {
    await this.lcaScraper.cleanup();
    await this.kmlsScraper.cleanup();
  }
}

module.exports = new ScrapingService();