# 📝 Exemples de Configuration

## 🗂️ Structure Google Sheet recommandée

### Exemple 1 : Configuration basique

```
| A      | B             | C                    | D      | E                    | F                    | G       | H       |
|--------|---------------|----------------------|--------|----------------------|----------------------|---------|---------|
| Marque | Nom Produit   | Lien Achat moins cher| Prix € | Lien LCA            | Lien KMLS            | Prix HT | Prix TTC|
| Apple  | iPhone 15 Pro | https://lca.com/...  | 1099   | https://lca.com/... | https://kmls.fr/...  | 950     | 1149    |
| Samsung| Galaxy S24    | https://kmls.fr/...  | 899    | https://lca.com/... | https://kmls.fr/...  | 780     | 949     |
```

**Paramètres correspondants :**
- Marque : `A`
- Nom Produit : `B`
- Lien achat moins cher : `C`
- Prix achat moins cher : `D`
- Lien LCA : `E`
- Lien KMLS : `F`
- Prix vente estimé : `G`
- Prix vente réel : `H`

---

### Exemple 2 : Configuration avec plus de colonnes

```
| A  | B   | C             | D     | E                    | F      | G                    | H                    | I       | J       | K      |
|----|-----|---------------|-------|----------------------|--------|----------------------|----------------------|---------|---------|--------|
| ID | Cat | Marque        | Model | Nom Complet          | Prix € | Lien LCA            | Lien KMLS            | Marge % | Prix HT | Prix TTC|
| 1  | Tel | Apple         | 15Pro | iPhone 15 Pro 256GB  | 1099   | https://lca.com/... | https://kmls.fr/...  | 15%     | 950     | 1149    |
| 2  | Tel | Samsung       | S24   | Galaxy S24 Ultra     | 1199   | https://lca.com/... | https://kmls.fr/...  | 12%     | 1070    | 1299    |
```

**Paramètres correspondants :**
- Marque : `C`
- Nom Produit : `E`
- Lien achat moins cher : `F`
- Prix achat moins cher : `F` (même colonne, le lien contient le prix actuel)
- Lien LCA : `G`
- Lien KMLS : `H`
- Prix vente estimé : `J`
- Prix vente réel : `K`

---

## ⚙️ Exemples de fichiers de configuration

### .env de développement

```env
PORT=3000
NODE_ENV=development
GOOGLE_SHEET_ID=1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms
ENCRYPTION_KEY=dev-encryption-key-not-secure
```

### .env de production

```env
PORT=3000
NODE_ENV=production
GOOGLE_SHEET_ID=1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms
ENCRYPTION_KEY=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
```

---

## 🔑 Exemple de google-credentials.json

```json
{
  "type": "service_account",
  "project_id": "price-scraper-123456",
  "private_key_id": "abc123def456...",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhki...\n-----END PRIVATE KEY-----\n",
  "client_email": "price-scraper@price-scraper-123456.iam.gserviceaccount.com",
  "client_id": "123456789012345678901",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/..."
}
```

**⚠️ Important :** Remplacer par vos vraies credentials téléchargées depuis Google Cloud Console.

---

## 📊 Exemple de rapport Excel généré

Le rapport Excel contiendra :

### Feuille "Variations de prix"

| Marque | Nom du produit | Ancien prix (€) | Nouveau prix (€) | Variation (€) | Variation (%) | Fournisseur avant | Fournisseur après | Prix LCA | Prix KMLS |
|--------|----------------|-----------------|------------------|---------------|---------------|-------------------|-------------------|----------|-----------|
| Apple  | iPhone 15 Pro  | 1099.00         | 1049.00          | -50.00        | -4.55%        | LCA               | KMLS              | 1049.00  | 1049.00   |
| Samsung| Galaxy S24     | 899.00          | 919.00           | +20.00        | +2.22%        | KMLS              | LCA               | 919.00   | 929.00    |

---

## 🎨 Personnalisation de l'interface

### Changer les couleurs principales

Éditer `src/frontend/css/styles.css` :

```css
:root {
  --primary: #2563eb;        /* Bleu principal → Changer ici */
  --primary-dark: #1d4ed8;   /* Bleu foncé */
  --success: #10b981;        /* Vert succès */
  --danger: #ef4444;         /* Rouge erreur */
  --warning: #f59e0b;        /* Orange warning */
}
```

### Modifier les polices

```css
body {
  font-family: 'Your Font', -apple-system, BlinkMacSystemFont, sans-serif;
}
```

---

## 🔧 Configuration avancée

### Modifier les délais anti-bot

`src/backend/utils/anti-bot.js` :

```javascript
async randomDelay(min = 1000, max = 3000) {
  // Augmenter pour être plus "humain"
  const delay = Math.floor(Math.random() * (max - min + 1)) + min;
  await new Promise(resolve => setTimeout(resolve, delay));
}
```

### Ajouter des sélecteurs CSS personnalisés

`src/backend/scrapers/lca-scraper.js` :

```javascript
const price = await page.evaluate(() => {
  const selectors = [
    '.price',
    '.product-price',
    '[class*="price"]',
    '.votre-selecteur-personnalise'  // ← Ajouter ici
  ];
  // ...
});
```

---

## 📱 Build personnalisé

### Changer l'icône de l'app

1. Créer `build/icon.png` (1024x1024)
2. Utiliser https://www.electron.build/icons pour générer les icônes
3. Placer `icon.ico` (Windows) et `icon.icns` (macOS) dans `build/`

### Modifier les métadonnées

`package.json` :

```json
{
  "build": {
    "appId": "com.votreentreprise.pricescraper",
    "productName": "Votre Price Scraper",
    "copyright": "Copyright © 2025 Votre Entreprise"
  }
}
```

---

## 🐛 Debug & Logs

### Activer les logs détaillés

`src/backend/server.js` :

```javascript
// Ajouter au début du fichier
const DEBUG = process.env.DEBUG === 'true';

if (DEBUG) {
  console.log('🔍 Mode debug activé');
}
```

Puis dans `.env` :

```env
DEBUG=true
```

### Logs Playwright

Pour voir les logs de navigation :

```javascript
const browser = await chromium.launch({
  headless: false,  // Voir le navigateur
  slowMo: 100      // Ralentir les actions
});
```

---

## 📦 Exemples de scripts npm personnalisés

Ajouter dans `package.json` :

```json
{
  "scripts": {
    "start": "electron .",
    "dev": "NODE_ENV=development electron .",
    "build": "electron-builder",
    "clean": "rm -rf dist node_modules",
    "fresh": "npm run clean && npm install",
    "backup": "cp .env .env.backup && cp google-credentials.json google-credentials.json.backup",
    "logs": "tail -f *.log"
  }
}
```

---

## 💾 Sauvegarde recommandée

### Fichiers à sauvegarder

```
✅ .env
✅ google-credentials.json
✅ .settings.json (créé automatiquement)
❌ .cookies/ (ne pas sauvegarder, contient des sessions temporaires)
❌ node_modules/ (peut être régénéré)
```

### Script de backup

```bash
#!/bin/bash
mkdir -p backups
cp .env backups/.env.$(date +%Y%m%d)
cp google-credentials.json backups/google-credentials.json.$(date +%Y%m%d)
cp .settings.json backups/.settings.json.$(date +%Y%m%d)
echo "✅ Backup créé dans backups/"
```

---

**📌 Tip :** Créer un fichier `config.local.js` pour vos paramètres locaux et l'ajouter à `.gitignore`