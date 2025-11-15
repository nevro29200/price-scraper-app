const BaseScraper = require('./base-scraper');
const authService = require('../services/auth-service');

class LCAScraper extends BaseScraper {
  constructor() {
    super('LCA');
  }

  async scrapeProduct(url) {
    let page;
    try {
      const context = await authService.getLCAContext();
      page = await context.newPage();

      await this.applyAntiBot(page);

      await page.goto(url, { 
        waitUntil: 'networkidle',
        timeout: 30000 
      });

      await this.randomDelay(1500, 2500);

      // Vérifier si on est bien connecté
      const isLoggedIn = await page.evaluate(() => {
        const loginText = document.body.textContent || '';
        return !loginText.includes('Connexion') && !loginText.includes('authentification');
      });

      if (!isLoggedIn) {
        await page.screenshot({ path: 'lca-not-logged-in.png' });
        
        // Supprimer le cookie expiré
        const fs = require('fs').promises;
        const path = require('path');
        const cookiesPath = path.join(__dirname, '../../..', '.cookies/lca-cookies.enc');
        try {
          await fs.unlink(cookiesPath);
          console.log('🗑️  Cookie LCA expiré supprimé');
        } catch (e) {
          // Ignore
        }
        
        throw new Error('SESSION_EXPIRED:LCA');
      }

      // Extraire le prix - LCA utilise #our_price_display avec attribut content
      const price = await page.evaluate(() => {
        // Méthode 1 : ID spécifique LCA avec attribut content
        const ourPrice = document.querySelector('#our_price_display[itemprop="price"]');
        if (ourPrice) {
          const content = ourPrice.getAttribute('content');
          if (content) {
            const parsed = parseFloat(content);
            if (!isNaN(parsed) && parsed > 0) return parsed;
          }
          // Fallback sur le texte si pas de content
          const text = ourPrice.textContent;
          if (text) {
            const match = text.match(/[\d\s]+[,.]?\d*/);
            if (match) {
              const cleaned = match[0].replace(/\s/g, '').replace(',', '.');
              const parsed = parseFloat(cleaned);
              if (!isNaN(parsed) && parsed > 0) return parsed;
            }
          }
        }

        // Méthode 2 : Autres sélecteurs génériques
        const selectors = [
          '.our_price_display .price',
          '[itemprop="price"]',
          '.product-price',
          '.current-price'
        ];

        for (const selector of selectors) {
          const element = document.querySelector(selector);
          if (element) {
            // Essayer l'attribut content d'abord
            const content = element.getAttribute('content');
            if (content) {
              const parsed = parseFloat(content);
              if (!isNaN(parsed) && parsed > 0) return parsed;
            }
            
            // Sinon le texte
            const text = element.textContent || element.innerText;
            if (text) {
              const match = text.match(/[\d\s]+[,.]?\d*/);
              if (match) {
                const cleaned = match[0].replace(/\s/g, '').replace(',', '.');
                const parsed = parseFloat(cleaned);
                if (!isNaN(parsed) && parsed > 0) return parsed;
              }
            }
          }
        }

        return null;
      });

      if (price === null || isNaN(price)) {
        throw new Error('Prix introuvable sur la page');
      }

      console.log(`✅ LCA - Prix trouvé: ${price}€`);

      await page.close();

      return {
        supplier: 'LCA',
        price,
        url,
        scrapedAt: new Date().toISOString()
      };

    } catch (error) {
      if (page) await page.close();
      console.error('Erreur scraping LCA:', error);
      throw error;
    }
  }
}

module.exports = LCAScraper;