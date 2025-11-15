// Dashboard principal

let products = [];
let currentComparisons = null;

// === CHARGEMENT INITIAL ===

window.addEventListener('DOMContentLoaded', async () => {
  await loadProducts();
  setupSearch();
});

async function loadProducts() {
  try {
    showLoading('Chargement des produits...');
    products = await api.getSheetData();
    
    renderProductsTable();
    document.getElementById('productCount').textContent = products.length;
    
    showToast(`${products.length} produits chargés`, 'success');
  } catch (error) {
    showToast('Erreur chargement des produits: ' + error.message, 'error');
  } finally {
    hideLoading();
  }
}

function renderProductsTable() {
  const tbody = document.getElementById('productsTable');
  
  if (products.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; padding: 2rem; color: var(--text-muted);">
          Aucun produit trouvé
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = products.map(product => `
    <tr>
      <td>${product.brand || 'N/A'}</td>
      <td>${product.name}</td>
      <td><strong>${product.currentPrice.toFixed(2)}€</strong></td>
      <td>
        <span class="badge badge-info">${product.currentSupplier}</span>
      </td>
      <td>
        ${product.lcaPrice ? 
          `<strong>${product.lcaPrice.toFixed(2)}€</strong>` : 
          '<small style="color: var(--text-muted);">N/A</small>'
        }
      </td>
      <td>
        ${product.kmlsPrice ? 
          `<strong>${product.kmlsPrice.toFixed(2)}€</strong>` : 
          '<small style="color: var(--text-muted);">N/A</small>'
        }
      </td>
      <td>
        <button class="btn btn-primary" onclick="scrapeSingleProduct('${product.name.replace(/'/g, "\\'")}')">
          🔄 Mettre à jour
        </button>
      </td>
    </tr>
  `).join('');
}

// === RECHERCHE ET AUTOCOMPLÉTION ===

function setupSearch() {
  const searchInput = document.getElementById('searchInput');
  const resultsDiv = document.getElementById('autocompleteResults');

  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase().trim();

    if (query.length < 2) {
      resultsDiv.style.display = 'none';
      return;
    }

    const filtered = products.filter(p => 
      p.name.toLowerCase().includes(query) || 
      p.brand.toLowerCase().includes(query)
    );

    if (filtered.length === 0) {
      resultsDiv.style.display = 'none';
      return;
    }

    resultsDiv.innerHTML = filtered.slice(0, 10).map(product => `
      <div class="autocomplete-item" onclick="selectProduct('${product.name.replace(/'/g, "\\'")}')">
        <strong>${product.brand}</strong> - ${product.name}
        <br>
        <small style="color: var(--text-muted);">${product.currentPrice.toFixed(2)}€ - ${product.currentSupplier}</small>
      </div>
    `).join('');

    resultsDiv.style.display = 'block';
  });

  // Fermer l'autocomplétion en cliquant ailleurs
  document.addEventListener('click', (e) => {
    if (!searchInput.contains(e.target) && !resultsDiv.contains(e.target)) {
      resultsDiv.style.display = 'none';
    }
  });
}

function selectProduct(productName) {
  document.getElementById('autocompleteResults').style.display = 'none';
  scrapeSingleProduct(productName);
}

// === SCRAPING ===

// Variable globale pour contrôler l'annulation
let cancelScraping = false;

document.getElementById('scrapeAllBtn').addEventListener('click', async () => {
  if (!confirm('Mettre à jour tous les produits ? Cela peut prendre plusieurs minutes.')) {
    return;
  }

  cancelScraping = false;

  try {
    // Afficher la barre de progression
    showProgressBar(products.length);
    
    const results = [];
    
    for (let i = 0; i < products.length; i++) {
      if (cancelScraping) {
        showToast('⚠️ Scraping annulé par l\'utilisateur', 'warning');
        hideProgressBar();
        return;
      }
      
      const product = products[i];
      updateProgress(i + 1, products.length, `Scraping de ${product.name}...`);
      
      try {
        const result = await api.scrapeSingle(product);
        results.push(result);
      } catch (error) {
        console.error(`Erreur scraping ${product.name}:`, error);
        
        // Si session expirée, ARRÊTER et forcer la reconnexion
        if (error.message && (error.message.includes('SESSION_EXPIRED') || error.message.includes('Session') && error.message.includes('expirée'))) {
          hideProgressBar();
          
          const supplier = error.message.includes('LCA') ? 'LCA' : 'KMLS';
          
          alert(`❌ Session ${supplier} expirée\n\n⚠️ La comparaison des prix nécessite les deux fournisseurs.\n\nVous allez être redirigé vers la page de connexion.`);
          
          window.electronAPI.navigate('login');
          return;
        }
        
        // Autres erreurs : continuer avec un résultat vide
        results.push({
          product,
          error: error.message,
          success: false,
          hasChanges: false,
          prices: {
            lca: null,
            kmls: null
          }
        });
      }
    }
    
    hideProgressBar();
    
    currentComparisons = results;
    
    const withChanges = results.filter(r => r.hasChanges).length;
    
    if (withChanges === 0) {
      showToast('Scraping terminé - Aucune modification de prix détectée', 'info');
    }
    
    showConfirmModal({
      total: results.length,
      withChanges,
      comparisons: results
    });
    
  } catch (error) {
    hideProgressBar();
    showToast('Erreur scraping: ' + error.message, 'error');
  }
});

async function scrapeSingleProduct(productName) {
  const product = products.find(p => p.name === productName);
  
  if (!product) {
    showToast('Produit introuvable', 'error');
    return;
  }

  try {
    showLoading(`Scraping de ${product.name}...`);
    const result = await api.scrapeSingle(product);
    
    currentComparisons = [result];
    
    // Même sans changement de prix, on affiche la modal pour mettre à jour LCA/KMLS
    hideLoading();
    showConfirmModal({ 
      total: 1, 
      withChanges: result.hasChanges ? 1 : 0,
      comparisons: [result] 
    });
    
  } catch (error) {
    hideLoading();
    showToast('Erreur scraping: ' + error.message, 'error');
  }
}

// === MODAL DE CONFIRMATION ===

function showConfirmModal(result) {
  const modal = document.getElementById('confirmModal');
  const statsDiv = document.getElementById('confirmStats');
  const tableBody = document.getElementById('confirmTable');

  // Statistiques
  const changedProducts = result.comparisons.filter(c => c.hasChanges);
  const totalSavings = changedProducts.reduce((sum, c) => 
    sum + (c.changes.priceChange < 0 ? Math.abs(c.changes.priceChange) : 0), 0
  );

  statsDiv.innerHTML = `
    <div class="stat-card">
      <div class="stat-value">${result.withChanges}</div>
      <div class="stat-label">Modifications de prix</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${result.total}</div>
      <div class="stat-label">Produits scrapés</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${totalSavings.toFixed(2)}€</div>
      <div class="stat-label">Économies</div>
    </div>
  `;

  // Tableau : afficher TOUS les produits (avec ou sans changement)
  tableBody.innerHTML = result.comparisons.map(comp => {
    const changeClass = comp.changes.priceChange < 0 ? 'price-decrease' : 'price-increase';
    const changeIcon = comp.changes.priceChange < 0 ? '↓' : '↑';

    return `
      <tr>
        <td>
          <strong>${comp.product.brand}</strong><br>
          <small style="color: var(--text-muted);">${comp.product.name}</small>
        </td>
        <td>${comp.before.price.toFixed(2)}€</td>
        <td>${comp.after.price.toFixed(2)}€</td>
        <td class="${changeClass}">
          ${changeIcon} ${comp.changes.priceChange.toFixed(2)}€
          (${comp.changes.priceChangePercent}%)
        </td>
        <td><span class="badge badge-info">${comp.before.supplier}</span></td>
        <td><span class="badge badge-success">${comp.after.supplier}</span></td>
        <td>
          <small style="display: block;">
            LCA: ${comp.prices.lca ? comp.prices.lca.toFixed(2) + '€' : 'N/A'}
          </small>
          <small style="display: block;">
            KMLS: ${comp.prices.kmls ? comp.prices.kmls.toFixed(2) + '€' : 'N/A'}
          </small>
        </td>
      </tr>
    `;
  }).join('');

  modal.style.display = 'flex';

  // Afficher les stats et le bouton d'export
  document.getElementById('statsSection').style.display = 'block';
  document.getElementById('exportReportBtn').style.display = 'inline-flex';

  updateStats(result);
}

function closeConfirmModal() {
  document.getElementById('confirmModal').style.display = 'none';
}

function updateStats(result) {
  const changedProducts = result.comparisons.filter(c => c.hasChanges);
  const totalSavings = changedProducts.reduce((sum, c) => 
    sum + (c.changes.priceChange < 0 ? Math.abs(c.changes.priceChange) : 0), 0
  );
  const avgChange = changedProducts.length > 0 
    ? changedProducts.reduce((sum, c) => sum + c.changes.priceChange, 0) / changedProducts.length 
    : 0;

  document.getElementById('statTotal').textContent = result.total;
  document.getElementById('statChanges').textContent = result.withChanges;
  document.getElementById('statSavings').textContent = totalSavings.toFixed(2) + '€';
  document.getElementById('statAverage').textContent = avgChange.toFixed(2) + '€';
}

// === CONFIRMATION ET MISE À JOUR ===

document.getElementById('confirmUpdateBtn').addEventListener('click', async () => {
  if (!currentComparisons) {
    showToast('Aucune donnée à mettre à jour', 'error');
    return;
  }

  try {
    closeConfirmModal();
    showLoading('Mise à jour de Google Sheets...');

    const result = await api.updateSheet(currentComparisons);

    if (result.success) {
      showToast(`✅ ${result.updated} produits mis à jour dans Google Sheets`, 'success');
      
      // Recharger les données depuis Google Sheets
      await loadProducts();
      
      // Réinitialiser les comparaisons
      currentComparisons = null;
    } else {
      showToast('Erreur mise à jour: ' + result.message, 'error');
    }

  } catch (error) {
    showToast('Erreur: ' + error.message, 'error');
  } finally {
    hideLoading();
  }
});

// === EXPORT RAPPORT ===

document.getElementById('exportReportBtn').addEventListener('click', async () => {
  if (!currentComparisons || currentComparisons.length === 0) {
    showToast('Aucune donnée à exporter', 'error');
    return;
  }

  try {
    showLoading('Génération du rapport Excel...');
    
    const result = await api.generateReport(currentComparisons);

    if (result.success) {
      showToast(`✅ Rapport Excel généré: ${result.filePath}`, 'success');
    } else {
      showToast('Erreur génération rapport', 'error');
    }

  } catch (error) {
    showToast('Erreur: ' + error.message, 'error');
  } finally {
    hideLoading();
  }
});

// === BARRE DE PROGRESSION ===

function showProgressBar(total) {
  const overlay = document.getElementById('loadingOverlay');
  overlay.innerHTML = `
    <div style="background: white; padding: 2rem; border-radius: 12px; min-width: 500px; box-shadow: 0 10px 40px rgba(0,0,0,0.2);">
      <h3 style="margin: 0 0 1rem 0; text-align: center; color: #1e293b;">Scraping en cours...</h3>
      <div id="progressText" style="text-align: center; margin-bottom: 1rem; color: #64748b; font-size: 0.95rem; min-height: 24px;">
        Démarrage...
      </div>
      <div style="background: #e2e8f0; height: 24px; border-radius: 12px; overflow: hidden; position: relative;">
        <div id="progressBar" style="background: linear-gradient(90deg, #2563eb, #3b82f6); height: 100%; width: 0%; transition: width 0.8s ease-out; display: flex; align-items: center; justify-content: flex-end; padding-right: 8px;"></div>
        <div id="progressPercent" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-weight: 600; font-size: 0.75rem; color: #1e293b; z-index: 10;">0%</div>
      </div>
      <div id="progressCount" style="text-align: center; margin-top: 0.75rem; font-size: 0.875rem; color: #64748b;">
        0 / ${total} produits
      </div>
      <button onclick="cancelScrapingProcess()" class="btn btn-danger" style="margin-top: 1.5rem; width: 100%;">
        ❌ Annuler le scraping
      </button>
    </div>
  `;
  overlay.style.display = 'flex';
}

function updateProgress(current, total, text) {
  const progressBar = document.getElementById('progressBar');
  const progressText = document.getElementById('progressText');
  const progressCount = document.getElementById('progressCount');
  const progressPercent = document.getElementById('progressPercent');
  
  if (progressBar && progressPercent) {
    const percent = Math.round((current / total) * 100);
    progressBar.style.width = `${percent}%`;
    progressPercent.textContent = `${percent}%`;
    
    // Changer la couleur du texte selon la progression
    if (percent > 50) {
      progressPercent.style.color = 'white';
    }
  }
  
  if (progressText) {
    progressText.textContent = text;
  }
  
  if (progressCount) {
    progressCount.textContent = `${current} / ${total} produits`;
  }
}

function hideProgressBar() {
  const overlay = document.getElementById('loadingOverlay');
  overlay.style.display = 'none';
}

function cancelScrapingProcess() {
  if (confirm('Êtes-vous sûr de vouloir annuler le scraping ?')) {
    cancelScraping = true;
  }
}

window.cancelScrapingProcess = cancelScrapingProcess;