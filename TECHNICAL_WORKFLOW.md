# 🔧 Workflow Technique Détaillé

Documentation technique complète du fonctionnement de l'application.

---

## 🏗️ Architecture Globale

```
┌─────────────────────────────────────────────────────────┐
│                    ELECTRON MAIN PROCESS                 │
│  - Gestion des fenêtres                                 │
│  - Spawning du backend Node.js                          │
│  - IPC Bridge sécurisé                                  │
└─────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┴───────────────────┐
        │                                       │
        ▼                                       ▼
┌──────────────────┐                  ┌─────────────────┐
│  RENDERER PROCESS│                  │  BACKEND SERVER │
│  (Frontend HTML) │◄─────HTTP────────│  (Express API)  │
│  - Login UI      │                  │  - Routes       │
│  - Dashboard UI  │                  │  - Services     │
│  - Settings UI   │                  │  - Scrapers     │
└──────────────────┘                  └─────────────────┘
                                              │
                    ┌─────────────────────────┼─────────────────────────┐
                    │                         │                         │
                    ▼                         ▼                         ▼
            ┌──────────────┐          ┌──────────────┐        ┌──────────────┐
            │  PLAYWRIGHT  │          │ GOOGLE SHEETS│        │  XLSX EXPORT │
            │  - Chromium  │          │     API      │        │   (SheetJS)  │
            │  - Anti-bot  │          │  - Read/Write│        │  - Reports   │
            │  - Sessions  │          └──────────────┘        └──────────────┘
            └──────────────┘
                    │
        ┌───────────┴───────────┐
        │                       │
        ▼                       ▼
┌──────────────┐        ┌──────────────┐
│ LCA WEBSITE  │        │ KMLS WEBSITE │
│  - Login+2FA │        │  - Login+2FA │
│  - Scraping  │        │  - Scraping  │
└──────────────┘        └──────────────┘
```

---

## 🔐 Workflow d'Authentification

### Étape 1 : Login Initial

```javascript
// Frontend (login.js)
User clicks "Se connecter à LCA"
  ↓
api.loginLCA(email, password)
  ↓
// Backend (auth-service.js)
authService.loginLCA()
  ↓
Launch Playwright browser (headless)
  ↓
Navigate to login page
  ↓
Fill email & password
  ↓
Submit form
  ↓
Wait for 2FA page
  ↓
Return { awaiting2FA: true }
```

### Étape 2 : Validation 2FA

```javascript
// Frontend
User enters 2FA code from email
  ↓
api.verifyLCA2FA(code)
  ↓
// Backend
authService.verifyLCA2FA(code)
  ↓
Fill 2FA input
  ↓
Submit
  ↓
Wait for successful login
  ↓
Extract cookies from browser context
  ↓
Encrypt cookies with AES-256
  ↓
Save to .cookies/lca-cookies.enc
  ↓
Return { authenticated: true }
```

### Détails techniques : Chiffrement

```javascript
// utils/encryption.js
const CryptoJS = require('crypto-js');

// Chiffrement
const encrypted = CryptoJS.AES.encrypt(
  JSON.stringify(cookies),
  ENCRYPTION_KEY
).toString();

// Déchiffrement
const decrypted = CryptoJS.AES.decrypt(encrypted, ENCRYPTION_KEY);
const cookies = JSON.parse(decrypted.toString(CryptoJS.enc.Utf8));
```

---

## 🔄 Workflow de Scraping

### Phase 1 : Chargement des données

```javascript
// Frontend clicks "Mettre à jour tous les produits"
api.scrapeAll()
  ↓
// Backend
GET /api/sheets/data
  ↓
sheetsService.getSheetData()
  ↓
// Google Sheets API
sheets.spreadsheets.values.get({
  spreadsheetId: GOOGLE_SHEET_ID,
  range: 'Feuille1!A2:Z1000'
})
  ↓
Parse rows → map to products array
  ↓
Return products[] to frontend
```

### Phase 2 : Scraping séquentiel

```javascript
For each product in products:
  ↓
  scrapingService.scrapeSingle(product)
    ↓
    // LCA Scraping
    If product.lcaUrl exists:
      ↓
      Get authenticated browser context
      ↓
      Create new page with anti-bot measures
      ↓
      Navigate to product.lcaUrl
      ↓
      Wait for price selector
      ↓
      Extract price with multiple selectors:
        - '.price'
        - '.product-price'
        - '[class*="price"]'
        - etc.
      ↓
      Parse price string → float
      ↓
      Store { supplier: 'LCA', price: X }
    
    // KMLS Scraping (même process)
    If product.kmlsUrl exists:
      ↓
      [Same process as LCA]
      ↓
      Store { supplier: 'KMLS', price: Y }
  
  ↓
  Return { product, lca, kmls }

All products scraped
  ↓
Return results[] to frontend
```

### Phase 3 : Comparaison

```javascript
// Backend
comparisonService.compareResults(results)
  ↓
For each result:
  ↓
  Get current price from Google Sheet
  Get current supplier from URL
  ↓
  Compare LCA vs KMLS prices
  ↓
  Determine cheapest supplier:
    If lcaPrice < kmlsPrice:
      newSupplier = 'LCA'
      newPrice = lcaPrice
    Else:
      newSupplier = 'KMLS'
      newPrice = kmlsPrice
  ↓
  Calculate changes:
    priceChange = newPrice - currentPrice
    priceChangePercent = (priceChange / currentPrice) * 100
    supplierChanged = (currentSupplier !== newSupplier)
  ↓
  hasChanges = (Math.abs(priceChange) > 0.01 || supplierChanged)
  ↓
  Return comparison object

Return comparisons[] with statistics
```

---

## ✅ Workflow de Confirmation

```javascript
// Frontend displays modal with:
- Statistics (total, changes, savings)
- Table of all changes
- "Confirmer" and "Annuler" buttons

User clicks "Confirmer"
  ↓
api.updateSheet(comparisons)
  ↓
// Backend
POST /api/sheets/update
  ↓
sheetsService.updateSheet(comparisons)
  ↓
For each comparison with changes:
  ↓
  Create batch update request:
    {
      range: 'Feuille1!D2',  // Prix achat moins cher
      values: [[newPrice]]
    },
    {
      range: 'Feuille1!C2',  // Lien achat moins cher
      values: [[newUrl]]
    }
  ↓
  Add to updates[]

Execute batch update:
  ↓
sheets.spreadsheets.values.batchUpdate({
  spreadsheetId: GOOGLE_SHEET_ID,
  resource: {
    valueInputOption: 'USER_ENTERED',
    data: updates
  }
})
  ↓
Return { success: true, updated: N }
  ↓
Frontend shows success toast
Frontend reloads products
```

---

## 📊 Workflow de Génération du Rapport

```javascript
User clicks "Exporter le rapport Excel"
  ↓
api.generateReport(comparisons)
  ↓
// Backend
excelService.generateReport(comparisons)
  ↓
Filter only products with changes
  ↓
Prepare data array:
  [{
    'Marque': product.brand,
    'Nom du produit': product.name,
    'Ancien prix (€)': before.price,
    'Nouveau prix (€)': after.price,
    'Variation (€)': change.amount,
    'Variation (%)': change.percent,
    'Fournisseur avant': before.supplier,
    'Fournisseur après': after.supplier
  }, ...]
  ↓
Create workbook:
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data);
  ↓
Set column widths
  ↓
Add sheet to workbook
  ↓
Generate filename with timestamp:
  'rapport-prix-2025-01-15-14-30.xlsx'
  ↓
Save to Downloads folder:
  XLSX.writeFile(wb, filePath)
  ↓
Return { success: true, filePath }
  ↓
Frontend shows success toast with file path
```

---

## ⚙️ Workflow de Paramètres

### Chargement

```javascript
Page loads
  ↓
api.getSettings()
  ↓
settingsManager.getSettings()
  ↓
Read .settings.json from disk
  ↓
If not exists:
  Create with default values
  ↓
Parse JSON
  ↓
Return settings object
  ↓
Frontend populates form fields
```

### Sauvegarde

```javascript
User edits settings
User clicks "Sauvegarder"
  ↓
Validate required fields
  ↓
api.saveSettings(newSettings)
  ↓
settingsManager.saveSettings(newSettings)
  ↓
Validate column configuration
  ↓
Write to .settings.json:
  fs.writeFileSync(
    '.settings.json',
    JSON.stringify(settings, null, 2)
  )
  ↓
Return { success: true }
  ↓
Frontend shows success toast
```

---

## 🛡️ Mesures Anti-Bot

### 1. User-Agent Rotation

```javascript
const userAgents = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120...',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X) Safari/...',
  // etc.
];

const ua = userAgents[Math.floor(Math.random() * userAgents.length)];
```

### 2. Délais Aléatoires

```javascript
async randomDelay(min = 1000, max = 3000) {
  const delay = Math.floor(Math.random() * (max - min + 1)) + min;
  await new Promise(resolve => setTimeout(resolve, delay));
}

// Usage
await page.fill('input', value);
await randomDelay(500, 1500);
await page.click('button');
```

### 3. Script Stealth

```javascript
await page.addInitScript(() => {
  // Masquer webdriver
  Object.defineProperty(navigator, 'webdriver', {
    get: () => undefined
  });

  // Ajouter chrome object
  window.chrome = { runtime: {} };

  // Masquer automation
  delete navigator.__proto__.webdriver;
});
```

### 4. Simulation Comportement Humain

```javascript
// Scroll aléatoire
for (let i = 0; i < 3; i++) {
  await page.evaluate(() => window.scrollBy(0, 300));
  await randomDelay(800, 1500);
}

// Mouvement de souris
await page.mouse.move(x, y);
await randomDelay(100, 300);
```

---

## 🔒 Sécurité

### Context Isolation (Electron)

```javascript
// main.js
webPreferences: {
  nodeIntegration: false,      // ❌ Pas de Node dans renderer
  contextIsolation: true,      // ✅ Isolation du contexte
  preload: path.join(__dirname, 'preload.js')
}

// preload.js
contextBridge.exposeInMainWorld('electronAPI', {
  navigate: (page) => ipcRenderer.invoke('navigate', page)
});
```

### Stockage Sécurisé

```
✅ Cookies chiffrés (AES-256)
✅ Clé dans .env (non versionnée)
✅ Credentials Google non versionnées
✅ Sessions browser isolées
```

---

## 📈 Performance

### Optimisations

1. **Scraping séquentiel** (pas parallèle) pour éviter la détection
2. **Réutilisation des contextes** browser authentifiés
3. **Batch updates** Google Sheets (1 appel pour N produits)
4. **Cache des paramètres** en mémoire

### Timeouts

```javascript
// Navigation
await page.goto(url, { 
  timeout: 30000,
  waitUntil: 'networkidle'
});

// Sélecteurs
await page.waitForSelector('.price', { 
  timeout: 10000 
});
```

---

## 🐛 Gestion d'Erreurs

### Niveaux de Fallback

```javascript
try {
  // Niveau 1: Scraping normal
  price = await scrapePage(url);
} catch (error) {
  try {
    // Niveau 2: Retry avec délai
    await randomDelay(5000, 10000);
    price = await scrapePage(url);
  } catch (retryError) {
    // Niveau 3: Log et skip
    console.error('Failed after retry:', retryError);
    return { error: retryError.message, price: null };
  }
}
```

### Logging

```javascript
console.log('✅ Success:', message);
console.warn('⚠️ Warning:', message);
console.error('❌ Error:', message);
```

---

## 🔄 Lifecycle de l'Application

```
1. Electron starts
   ↓
2. Spawn backend server (port 3000)
   ↓
3. Wait 2s for backend ready
   ↓
4. Create browser window
   ↓
5. Load login.html
   ↓
6. User authenticates
   ↓
7. Navigate to dashboard.html
   ↓
8. Load products from Google Sheets
   ↓
9. User triggers scraping
   ↓
10. Display confirmation modal
   ↓
11. User confirms → Update Google Sheets
   ↓
12. Generate Excel report
   ↓
13. Display success

On close:
   ↓
Kill backend process
   ↓
Close browser contexts
   ↓
Exit app
```

---

**✨ Cette documentation est maintenue à jour avec chaque version majeure**