// API Client pour communiquer avec le backend

const API_BASE = 'http://localhost:3000/api';

const api = {
  // === AUTHENTIFICATION ===
  
  async loginLCA(email, password) {
    const response = await fetch(`${API_BASE}/auth/lca/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    return response.json();
  },

  async verifyLCA2FA(code) {
    const response = await fetch(`${API_BASE}/auth/lca/verify-2fa`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code })
    });
    return response.json();
  },

  async loginKMLS(email, password) {
    const response = await fetch(`${API_BASE}/auth/kmls/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    return response.json();
  },

  async verifyKMLS2FA(code) {
    const response = await fetch(`${API_BASE}/auth/kmls/verify-2fa`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code })
    });
    return response.json();
  },

  async getAuthStatus() {
    const response = await fetch(`${API_BASE}/auth/status`);
    return response.json();
  },

  // === GOOGLE SHEETS ===

  async getSheetData() {
    const response = await fetch(`${API_BASE}/sheets/data`);
    return response.json();
  },

  async updateSheet(updates) {
    const response = await fetch(`${API_BASE}/sheets/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ updates })
    });
    return response.json();
  },

  // === SCRAPING ===

  async scrapeAll() {
    const response = await fetch(`${API_BASE}/scrape/all`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    return response.json();
  },

  async scrapeSingle(product) {
    const response = await fetch(`${API_BASE}/scrape/single`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product })
    });
    return response.json();
  },

  // === RAPPORT ===

  async generateReport(comparisons) {
    const response = await fetch(`${API_BASE}/report/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ comparisons })
    });
    return response.json();
  },

  // === PARAMÈTRES ===

  async getSettings() {
    const response = await fetch(`${API_BASE}/settings`);
    return response.json();
  },

  async saveSettings(settings) {
    const response = await fetch(`${API_BASE}/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    });
    return response.json();
  }
};

// === UTILITAIRES UI ===

function showLoading(text = 'Chargement...') {
  const overlay = document.getElementById('loadingOverlay');
  const loadingText = document.getElementById('loadingText');
  if (overlay) {
    overlay.style.display = 'flex';
    if (loadingText) loadingText.textContent = text;
  }
}

function hideLoading() {
  const overlay = document.getElementById('loadingOverlay');
  if (overlay) overlay.style.display = 'none';
}

function showToast(message, type = 'success') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;

  container.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 5000);
}

async function goToLogin() {
  await window.electronAPI.navigate('login');
}

async function goToDashboard() {
  await window.electronAPI.navigate('dashboard');
}

async function goToSettings() {
  await window.electronAPI.navigate('settings');
}