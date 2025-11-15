const comparisonService = require('../src/backend/services/comparison-service');

describe('Comparison Service Tests', () => {
  describe('compareSingleProduct', () => {
    test('devrait détecter une baisse de prix', () => {
      const result = {
        product: {
          brand: 'TestBrand',
          name: 'Test Product',
          currentPrice: 100,
          currentSupplier: 'LCA',
          currentUrl: 'http://lca.com/product',
          lcaUrl: 'http://lca.com/product',
          kmlsUrl: 'http://kmls.com/product',
          rowIndex: 2
        },
        lca: { price: 90 },
        kmls: { price: 95 }
      };

      const comparison = comparisonService.compareSingleProduct(result);

      expect(comparison.hasChanges).toBe(true);
      expect(comparison.after.price).toBe(90);
      expect(comparison.after.supplier).toBe('LCA');
      expect(comparison.changes.priceChange).toBe(-10);
      expect(comparison.changes.priceChangePercent).toBe('-10.00');
    });

    test('devrait détecter une augmentation de prix', () => {
      const result = {
        product: {
          brand: 'TestBrand',
          name: 'Test Product',
          currentPrice: 100,
          currentSupplier: 'LCA',
          currentUrl: 'http://lca.com/product',
          lcaUrl: 'http://lca.com/product',
          kmlsUrl: 'http://kmls.com/product',
          rowIndex: 2
        },
        lca: { price: 110 },
        kmls: { price: 115 }
      };

      const comparison = comparisonService.compareSingleProduct(result);

      expect(comparison.hasChanges).toBe(true);
      expect(comparison.after.price).toBe(110);
      expect(comparison.changes.priceChange).toBe(10);
      expect(comparison.changes.priceChangePercent).toBe('10.00');
    });

    test('devrait détecter un changement de fournisseur', () => {
      const result = {
        product: {
          brand: 'TestBrand',
          name: 'Test Product',
          currentPrice: 100,
          currentSupplier: 'LCA',
          currentUrl: 'http://lca.com/product',
          lcaUrl: 'http://lca.com/product',
          kmlsUrl: 'http://kmls.com/product',
          rowIndex: 2
        },
        lca: { price: 105 },
        kmls: { price: 95 }
      };

      const comparison = comparisonService.compareSingleProduct(result);

      expect(comparison.hasChanges).toBe(true);
      expect(comparison.after.supplier).toBe('KMLS');
      expect(comparison.changes.supplierChanged).toBe(true);
    });

    test('ne devrait pas détecter de changement si prix identique', () => {
      const result = {
        product: {
          brand: 'TestBrand',
          name: 'Test Product',
          currentPrice: 100,
          currentSupplier: 'LCA',
          currentUrl: 'http://lca.com/product',
          lcaUrl: 'http://lca.com/product',
          kmlsUrl: 'http://kmls.com/product',
          rowIndex: 2
        },
        lca: { price: 100 },
        kmls: { price: 105 }
      };

      const comparison = comparisonService.compareSingleProduct(result);

      expect(comparison.hasChanges).toBe(false);
    });
  });

  describe('calculateStats', () => {
    test('devrait calculer les statistiques correctement', () => {
      const comparisons = [
        {
          hasChanges: true,
          changes: { priceChange: -10, supplierChanged: false }
        },
        {
          hasChanges: true,
          changes: { priceChange: 5, supplierChanged: true }
        },
        {
          hasChanges: false,
          changes: { priceChange: 0, supplierChanged: false }
        },
        {
          hasChanges: true,
          changes: { priceChange: -5, supplierChanged: false }
        }
      ];

      const stats = comparisonService.calculateStats(comparisons);

      expect(stats.total).toBe(4);
      expect(stats.withChanges).toBe(3);
      expect(stats.priceIncreases).toBe(1);
      expect(stats.priceDecreases).toBe(2);
      expect(stats.supplierChanges).toBe(1);
      expect(stats.totalSavings).toBe(15);
      expect(parseFloat(stats.averageChange)).toBe(-3.33);
    });
  });
});