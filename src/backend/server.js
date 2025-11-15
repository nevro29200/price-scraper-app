require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const authService = require('./services/auth-service');
const scrapingService = require('./services/scraping-service');
const sheetsService = require('./services/sheets-service');
const comparisonService = require('./services/comparison-service');
const excelService = require('./services/excel-service');
const settingsManager = require('./config/settings');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// ===== ROUTES D'AUTHENTIFICATION =====

// Login LCA - Étape 1
app.post('/api/auth/lca/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await authService.loginLCA(email, password);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Login LCA - Étape 2 (2FA)
app.post('/api/auth/lca/verify-2fa', async (req, res) => {
  try {
    const { code } = req.body;
    const result = await authService.verifyLCA2FA(code);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Login KMLS - Étape 1
app.post('/api/auth/kmls/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await authService.loginKMLS(email, password);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Login KMLS - Étape 2 (2FA)
app.post('/api/auth/kmls/verify-2fa', async (req, res) => {
  try {
    const { code } = req.body;
    const result = await authService.verifyKMLS2FA(code);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Vérifier le statut de connexion
app.get('/api/auth/status', async (req, res) => {
  try {
    const status = await authService.getAuthStatus();
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== ROUTES GOOGLE SHEETS =====

// Récupérer les données du Google Sheet
app.get('/api/sheets/data', async (req, res) => {
  try {
    const data = await sheetsService.getSheetData();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mettre à jour le Google Sheet (après confirmation)
app.post('/api/sheets/update', async (req, res) => {
  try {
    const { updates } = req.body;
    const result = await sheetsService.updateSheet(updates);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== ROUTES DE SCRAPING =====

// Scraper tous les produits
app.post('/api/scrape/all', async (req, res) => {
  try {
    const results = await scrapingService.scrapeAll();
    const comparison = comparisonService.compareResults(results);
    res.json(comparison);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Scraper un seul produit
app.post('/api/scrape/single', async (req, res) => {
  try {
    const { product } = req.body;
    const results = await scrapingService.scrapeSingle(product);
    const comparison = comparisonService.compareSingleProduct(results);
    res.json(comparison);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== ROUTES RAPPORT EXCEL =====

// Générer le rapport Excel
app.post('/api/report/generate', async (req, res) => {
  try {
    const { comparisons } = req.body;
    const filePath = await excelService.generateReport(comparisons);
    res.json({ success: true, filePath });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== ROUTES PARAMÈTRES =====

// Récupérer les paramètres
app.get('/api/settings', (req, res) => {
  try {
    const settings = settingsManager.getSettings();
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mettre à jour les paramètres
app.post('/api/settings', (req, res) => {
  try {
    const settings = req.body;
    settingsManager.saveSettings(settings);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== DÉMARRAGE DU SERVEUR =====

app.listen(PORT, () => {
  console.log(`🚀 Backend démarré sur http://localhost:${PORT}`);
});