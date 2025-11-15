// Page des paramètres

window.addEventListener('DOMContentLoaded', async () => {
  await loadSettings();
});

async function loadSettings() {
  try {
    showLoading('Chargement des paramètres...');
    const settings = await api.getSettings();

    // Remplir les champs
    document.getElementById('sheetName').value = settings.sheetName || 'Feuille1';
    document.getElementById('sheetRange').value = settings.sheetRange || 'A2:Z1000';

    document.getElementById('colBrand').value = settings.columns.brand || 'A';
    document.getElementById('colProductName').value = settings.columns.productName || 'B';
    document.getElementById('colCheapestBuyLink').value = settings.columns.cheapestBuyLink || 'C';
    document.getElementById('colCheapestBuyPrice').value = settings.columns.cheapestBuyPrice || 'D';
    document.getElementById('colLcaLink').value = settings.columns.lcaLink || 'E';
    document.getElementById('colKmlsLink').value = settings.columns.kmlsLink || 'F';
    document.getElementById('colEstimatedSalePrice').value = settings.columns.estimatedSalePrice || 'G';
    document.getElementById('colActualSalePrice').value = settings.columns.actualSalePrice || 'H';

    showToast('Paramètres chargés', 'success');
  } catch (error) {
    showToast('Erreur chargement paramètres: ' + error.message, 'error');
  } finally {
    hideLoading();
  }
}

// === SAUVEGARDE ===

document.getElementById('saveBtn').addEventListener('click', async () => {
  try {
    const settings = {
      sheetName: document.getElementById('sheetName').value.trim(),
      sheetRange: document.getElementById('sheetRange').value.trim(),
      columns: {
        brand: document.getElementById('colBrand').value.trim().toUpperCase(),
        productName: document.getElementById('colProductName').value.trim().toUpperCase(),
        cheapestBuyLink: document.getElementById('colCheapestBuyLink').value.trim().toUpperCase(),
        cheapestBuyPrice: document.getElementById('colCheapestBuyPrice').value.trim().toUpperCase(),
        lcaLink: document.getElementById('colLcaLink').value.trim().toUpperCase(),
        kmlsLink: document.getElementById('colKmlsLink').value.trim().toUpperCase(),
        estimatedSalePrice: document.getElementById('colEstimatedSalePrice').value.trim().toUpperCase(),
        actualSalePrice: document.getElementById('colActualSalePrice').value.trim().toUpperCase()
      }
    };

    // Validation
    if (!settings.sheetName || !settings.sheetRange) {
      showToast('Nom de feuille et plage requis', 'error');
      return;
    }

    const requiredColumns = [
      'brand', 'productName', 'cheapestBuyLink', 
      'cheapestBuyPrice', 'lcaLink', 'kmlsLink'
    ];

    for (const col of requiredColumns) {
      if (!settings.columns[col]) {
        showToast(`Colonne "${col}" requise`, 'error');
        return;
      }
    }

    showLoading('Sauvegarde des paramètres...');
    
    const result = await api.saveSettings(settings);

    if (result.success) {
      showToast('✅ Paramètres sauvegardés avec succès', 'success');
    } else {
      showToast('Erreur sauvegarde paramètres', 'error');
    }

  } catch (error) {
    showToast('Erreur: ' + error.message, 'error');
  } finally {
    hideLoading();
  }
});

// === RÉINITIALISATION ===

document.getElementById('resetBtn').addEventListener('click', async () => {
  if (!confirm('Réinitialiser les paramètres par défaut ?')) {
    return;
  }

  try {
    // Valeurs par défaut
    document.getElementById('sheetName').value = 'Feuille1';
    document.getElementById('sheetRange').value = 'A2:Z1000';
    
    document.getElementById('colBrand').value = 'A';
    document.getElementById('colProductName').value = 'B';
    document.getElementById('colCheapestBuyLink').value = 'C';
    document.getElementById('colCheapestBuyPrice').value = 'D';
    document.getElementById('colLcaLink').value = 'E';
    document.getElementById('colKmlsLink').value = 'F';
    document.getElementById('colEstimatedSalePrice').value = 'G';
    document.getElementById('colActualSalePrice').value = 'H';

    showToast('Paramètres réinitialisés (non sauvegardés)', 'warning');
  } catch (error) {
    showToast('Erreur: ' + error.message, 'error');
  }
});

// === AUTO-UPPERCASE POUR LES COLONNES ===

const columnInputs = [
  'colBrand', 'colProductName', 'colCheapestBuyLink', 'colCheapestBuyPrice',
  'colLcaLink', 'colKmlsLink', 'colEstimatedSalePrice', 'colActualSalePrice'
];

columnInputs.forEach(id => {
  const input = document.getElementById(id);
  input.addEventListener('input', (e) => {
    e.target.value = e.target.value.toUpperCase();
  });
});