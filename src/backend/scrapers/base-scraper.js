const antiBot = require('../utils/anti-bot');

class BaseScraper {
  constructor(name) {
    this.name = name;
    this.browser = null;
  }

  async applyAntiBot(page) {
    await page.addInitScript(antiBot.getStealthScript());
    
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1'
    });
  }

  async randomDelay(min = 1000, max = 3000) {
    await antiBot.randomDelay(min, max);
  }

  parsePrice(text) {
    if (!text) return null;
    
    // Nettoyer le texte
    text = text.replace(/[^\d,.\s]/g, '').trim();
    
    // Remplacer virgule par point
    text = text.replace(',', '.');
    
    // Supprimer les espaces
    text = text.replace(/\s/g, '');
    
    const price = parseFloat(text);
    
    return isNaN(price) ? null : price;
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}

module.exports = BaseScraper;