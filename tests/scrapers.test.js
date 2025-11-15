const LCAScraper = require('../src/backend/scrapers/lca-scraper');
const KMLSScraper = require('../src/backend/scrapers/kmls-scraper');

describe('Scrapers Tests', () => {
  describe('LCA Scraper', () => {
    let scraper;

    beforeEach(() => {
      scraper = new LCAScraper();
    });

    afterEach(async () => {
      await scraper.cleanup();
    });

    test('devrait parser correctement un prix', () => {
      expect(scraper.parsePrice('123.45€')).toBe(123.45);
      expect(scraper.parsePrice('123,45 €')).toBe(123.45);
      expect(scraper.parsePrice('1 234,56')).toBe(1234.56);
      expect(scraper.parsePrice('Prix: 99.99')).toBe(99.99);
    });

    test('devrait retourner null pour un prix invalide', () => {
      expect(scraper.parsePrice('')).toBeNull();
      expect(scraper.parsePrice('abc')).toBeNull();
      expect(scraper.parsePrice(null)).toBeNull();
    });

    test('devrait scraper une URL avec succès', async () => {
      // Mock d'une vraie URL (nécessite authentification)
      const mockUrl = 'https://www.lca-distribution.fr/product/test';
      
      // Note: Ce test nécessiterait un mock ou une URL de test
      // En production, utilisez un environnement de test isolé
    }, 30000);
  });

  describe('KMLS Scraper', () => {
    let scraper;

    beforeEach(() => {
      scraper = new KMLSScraper();
    });

    afterEach(async () => {
      await scraper.cleanup();
    });

    test('devrait parser correctement un prix', () => {
      expect(scraper.parsePrice('456.78€')).toBe(456.78);
      expect(scraper.parsePrice('456,78')).toBe(456.78);
    });
  });

  describe('Anti-Bot Utils', () => {
    const antiBot = require('../src/backend/utils/anti-bot');

    test('devrait générer un User-Agent aléatoire', () => {
      const ua = antiBot.getRandomUserAgent();
      expect(ua).toBeTruthy();
      expect(typeof ua).toBe('string');
      expect(ua).toContain('Mozilla');
    });

    test('devrait générer des arguments de navigateur', () => {
      const args = antiBot.getBrowserArgs();
      expect(Array.isArray(args)).toBe(true);
      expect(args.length).toBeGreaterThan(0);
      expect(args).toContain('--no-sandbox');
    });

    test('devrait générer un script stealth', () => {
      const script = antiBot.getStealthScript();
      expect(script).toBeTruthy();
      expect(typeof script).toBe('string');
      expect(script).toContain('webdriver');
    });
  });
});