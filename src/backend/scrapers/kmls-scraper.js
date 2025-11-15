const BaseScraper = require('./base-scraper');
const authService = require('../services/auth-service');

class KMLSScraper extends BaseScraper {
  constructor() {
    super('KMLS');
  }

  async scrapeProduct(url) {
    let page;
    try {
      const context = await authService.getKMLSContext();
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
        return !loginText.includes('Se connecter') && !loginText.includes('Site réservé aux professionnels');
      });

      if (!isLoggedIn) {
        await page.screenshot({ path: 'kmls-not-logged-in.png' });
        
        // Supprimer le cookie expiré
        const fs = require('fs').promises;
        const path = require('path');
        const cookiesPath = path.join(__dirname, '../../..', '.cookies/kmls-cookies.enc');
        try {
          await fs.unlink(cookiesPath);
          console.log('🗑️  Cookie KMLS expiré supprimé');
        } catch (e) {
          // Ignore si le fichier n'existe pas
        }
        
        throw new Error('SESSION_EXPIRED:KMLS');
      }

      // Attendre que le prix soit chargé (JavaScript dynamique)
      try {
        await page.waitForSelector('.product-price-special, .product-price, [class*="price"]', {
          timeout: 10000,
          state: 'visible'
        });
      } catch (e) {
        console.log('⚠️  KMLS - Timeout en attendant le prix, tentative quand même...');
      }

      await this.randomDelay(1000, 2000);

      const price = await page.evaluate(() => {
        // Méthode 1 : Prix en promotion (.price-new)
        const priceNew = document.querySelector('.product-price-special.active .price-new');
        if (priceNew) {
          const text = priceNew.textContent || priceNew.innerText;
          if (text) {
            const match = text.replace('€', '').trim().match(/[\d\s]+[,.]?\d*/);
            if (match) {
              const cleaned = match[0].replace(/\s/g, '').replace(',', '.');
              const parsed = parseFloat(cleaned);
              if (!isNaN(parsed) && parsed > 0) {
                return parsed;
              }
            }
          }
        }

        // Méthode 2 : Sans .active
        const priceNew2 = document.querySelector('.product-price-special .price-new');
        if (priceNew2) {
          const text = priceNew2.textContent || priceNew2.innerText;
          if (text) {
            const match = text.replace('€', '').trim().match(/[\d\s]+[,.]?\d*/);
            if (match) {
              const cleaned = match[0].replace(/\s/g, '').replace(',', '.');
              const parsed = parseFloat(cleaned);
              if (!isNaN(parsed) && parsed > 0) {
                return parsed;
              }
            }
          }
        }

        // Méthode 3 : Prix normal
        const normalPrice = document.querySelector('.product-price .price');
        if (normalPrice) {
          const text = normalPrice.textContent || normalPrice.innerText;
          if (text) {
            const match = text.replace('€', '').trim().match(/[\d\s]+[,.]?\d*/);
            if (match) {
              const cleaned = match[0].replace(/\s/g, '').replace(',', '.');
              const parsed = parseFloat(cleaned);
              if (!isNaN(parsed) && parsed > 0) {
                return parsed;
              }
            }
          }
        }

        // Debug: logger ce qui existe
        const priceElements = document.querySelectorAll('[class*="price"]');
        const found = [];
        for (const el of priceElements) {
          found.push({
            tag: el.tagName,
            class: el.className,
            text: el.textContent?.substring(0, 30)
          });
        }
        console.log('KMLS Debug - Éléments trouvés:', JSON.stringify(found, null, 2));

        return null;
      });

      if (price === null || isNaN(price)) {
        await page.screenshot({ path: 'kmls-debug.png' });
        console.log('📸 Screenshot sauvegardée: kmls-debug.png');
        throw new Error('Prix introuvable sur la page');
      }

      console.log(`✅ KMLS - Prix trouvé: ${price}€`);

      await page.close();

      return {
        supplier: 'KMLS',
        price,
        url,
        scrapedAt: new Date().toISOString()
      };

    } catch (error) {
      if (page) await page.close();
      console.error('Erreur scraping KMLS:', error);
      throw error;
    }
  }
}

module.exports = KMLSScraper;