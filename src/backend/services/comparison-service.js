class ComparisonService {
  compareResults(scrapingResults) {
    const comparisons = [];

    for (const result of scrapingResults) {
      if (!result.success) {
        comparisons.push({
          product: result.product,
          error: result.error,
          hasChanges: false
        });
        continue;
      }

      const comparison = this.compareSingleProduct(result);
      comparisons.push(comparison);
    }

    return {
      total: comparisons.length,
      withChanges: comparisons.filter(c => c.hasChanges).length,
      comparisons
    };
  }

  compareSingleProduct(result) {
    const { product, lca, kmls } = result;

    // Prix actuels (du Google Sheet)
    const currentPrice = parseFloat(product.currentPrice) || 0;
    const currentSupplier = product.currentSupplier || 'Inconnu';
    const currentUrl = product.currentUrl || '';

    // Nouveaux prix (scraped)
    const lcaPrice = lca?.price || null;
    const kmlsPrice = kmls?.price || null;

    // Déterminer le nouveau fournisseur le moins cher
    let newSupplier = null;
    let newPrice = null;
    let newUrl = null;

    if (lcaPrice !== null && kmlsPrice !== null) {
      if (lcaPrice <= kmlsPrice) {
        newSupplier = 'LCA';
        newPrice = lcaPrice;
        newUrl = product.lcaUrl;
      } else {
        newSupplier = 'KMLS';
        newPrice = kmlsPrice;
        newUrl = product.kmlsUrl;
      }
    } else if (lcaPrice !== null) {
      newSupplier = 'LCA';
      newPrice = lcaPrice;
      newUrl = product.lcaUrl;
    } else if (kmlsPrice !== null) {
      newSupplier = 'KMLS';
      newPrice = kmlsPrice;
      newUrl = product.kmlsUrl;
    }

    // Calculer les variations
    const priceChange = newPrice !== null ? newPrice - currentPrice : 0;
    const priceChangePercent = currentPrice > 0 
      ? ((priceChange / currentPrice) * 100).toFixed(2)
      : 0;

    const hasChanges = Math.abs(priceChange) > 0.01 || currentSupplier !== newSupplier;

    return {
      product: {
        brand: product.brand,
        name: product.name,
        rowIndex: product.rowIndex
      },
      before: {
        price: currentPrice,
        supplier: currentSupplier,
        url: currentUrl
      },
      after: {
        price: newPrice,
        supplier: newSupplier,
        url: newUrl
      },
      changes: {
        priceChange,
        priceChangePercent,
        supplierChanged: currentSupplier !== newSupplier
      },
      prices: {
        lca: lcaPrice,
        kmls: kmlsPrice
      },
      hasChanges,
      timestamp: new Date().toISOString()
    };
  }

  calculateStats(comparisons) {
    const stats = {
      total: comparisons.length,
      withChanges: 0,
      priceIncreases: 0,
      priceDecreases: 0,
      supplierChanges: 0,
      totalSavings: 0,
      averageChange: 0
    };

    let totalChange = 0;

    for (const comp of comparisons) {
      if (comp.hasChanges) {
        stats.withChanges++;

        if (comp.changes.priceChange > 0) {
          stats.priceIncreases++;
        } else if (comp.changes.priceChange < 0) {
          stats.priceDecreases++;
          stats.totalSavings += Math.abs(comp.changes.priceChange);
        }

        if (comp.changes.supplierChanged) {
          stats.supplierChanges++;
        }

        totalChange += comp.changes.priceChange;
      }
    }

    stats.averageChange = stats.withChanges > 0 
      ? (totalChange / stats.withChanges).toFixed(2) 
      : 0;

    return stats;
  }
}

module.exports = new ComparisonService();