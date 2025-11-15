# 📊 Price Scraper App

Application Electron complète pour scraper les prix sur LCA Distribution et KMLS, avec mise à jour automatique de Google Sheets et génération de rapports Excel.

## 🎯 Fonctionnalités

- ✅ **Authentification 2FA** pour LCA Distribution et KMLS
- 🔄 **Scraping automatique** des prix avec protection anti-bot
- 📊 **Mise à jour Google Sheets** avec confirmation préalable
- 📈 **Rapport Excel** des variations de prix
- ⚙️ **Configuration interface graphique** des colonnes Google Sheets
- 🔍 **Recherche et autocomplétion** des produits
- 🎨 **Interface moderne et responsive**

---

## 📦 Installation

### Prérequis

- Node.js 18+ et npm
- Un compte Google avec accès à Google Sheets API
- Comptes LCA Distribution et KMLS

### 1. Cloner et installer

```bash
git clone <votre-repo>
cd price-scraper-app
npm install
```

### 2. Configuration Google Sheets API

1. Aller sur [Google Cloud Console](https://console.cloud.google.com)
2. Créer un nouveau projet
3. Activer "Google Sheets API"
4. Créer un "Service Account"
5. Télécharger le fichier JSON des credentials
6. Renommer le fichier en `google-credentials.json` et le placer à la racine du projet
7. Partager votre Google Sheet avec l'email du Service Account

### 3. Configuration de l'environnement

Créer un fichier `.env` à la racine :

```env
PORT=3000
NODE_ENV=production
GOOGLE_SHEET_ID=votre-id-google-sheet
ENCRYPTION_KEY=votre-clé-de-chiffrement-sécurisée
```

**Comment trouver l'ID du Google Sheet :**
Dans l'URL de votre sheet : `https://docs.google.com/spreadsheets/d/[ID_ICI]/edit`

**Générer une clé de chiffrement :**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 🚀 Démarrage

### Mode développement

```bash
npm run dev
```

### Mode production

```bash
npm start
```

---

## 🏗️ Build de l'application

### Windows

```bash
npm run build:win
```

L'installateur sera dans `dist/Price Scraper Setup.exe`

### macOS

```bash
npm run build:mac
```

L'application sera dans `dist/Price Scraper.dmg`

### Les deux plateformes

```bash
npm run build:all
```

---

## 📖 Utilisation

### 1. Première connexion

1. Lancer l'application
2. Entrer vos identifiants **LCA Distribution**
3. Entrer le code 2FA reçu par email
4. Répéter pour **KMLS**
5. Cliquer sur "Accéder au Dashboard"

### 2. Configuration des colonnes

1. Cliquer sur "⚙️ Paramètres" dans le header
2. Définir la correspondance des colonnes :
   - **Marque** : A
   - **Nom du produit** : B
   - **Lien achat moins cher** : C
   - **Prix achat moins cher** : D
   - **Lien LCA** : E
   - **Lien KMLS** : F
   - Etc.
3. Cliquer sur "💾 Sauvegarder"

### 3. Scraping des prix

#### Option 1 : Tous les produits

1. Cliquer sur "🔄 Mettre à jour tous les produits"
2. Attendre le scraping (peut prendre plusieurs minutes)
3. **Vérifier les modifications** dans la modale de confirmation
4. Cliquer sur "✅ Confirmer et mettre à jour Google Sheets"

#### Option 2 : Un seul produit

1. Utiliser la **barre de recherche** pour trouver un produit
2. Cliquer sur le bouton "🔄 Mettre à jour" du produit
3. Confirmer les modifications

### 4. Export du rapport Excel

Après une mise à jour, cliquer sur "📊 Exporter le rapport Excel"

Le fichier sera automatiquement sauvegardé dans votre dossier **Téléchargements** avec :
- Nom du produit
- Ancien prix vs nouveau prix
- Variation en € et %
- Fournisseur avant vs après

---

## 🧪 Tests

### Lancer tous les tests

```bash
npm test
```

### Tests en mode watch

```bash
npm run test:watch
```

### Tests disponibles

- ✅ Tests unitaires des scrapers
- ✅ Tests de parsing des prix
- ✅ Tests du service de comparaison
- ✅ Tests anti-bot
- ✅ Tests d'intégration (workflow complet)

---

## 📂 Structure du projet

```
price-scraper-app/
├── main.js                     # Point d'entrée Electron
├── preload.js                  # Bridge IPC sécurisé
├── package.json
├── .env
├── google-credentials.json
├── src/
│   ├── backend/
│   │   ├── server.js          # Serveur Express
│   │   ├── config/
│   │   │   └── settings.js    # Gestionnaire de paramètres
│   │   ├── scrapers/
│   │   │   ├── base-scraper.js
│   │   │   ├── lca-scraper.js
│   │   │   └── kmls-scraper.js
│   │   ├── services/
│   │   │   ├── auth-service.js
│   │   │   ├── scraping-service.js
│   │   │   ├── sheets-service.js
│   │   │   ├── comparison-service.js
│   │   │   └── excel-service.js
│   │   └── utils/
│   │       ├── encryption.js
│   │       └── anti-bot.js
│   └── frontend/
│       ├── login.html
│       ├── dashboard.html
│       ├── settings.html
│       ├── css/
│       │   └── styles.css
│       └── js/
│           ├── api.js
│           ├── login.js
│           ├── dashboard.js
│           └── settings.js
└── tests/
    ├── scrapers.test.js
    ├── comparison.test.js
    └── integration.test.js
```

---

## ⚙️ Workflow détaillé

### 1. Authentification

```
Utilisateur entre credentials
    ↓
Backend lance Playwright
    ↓
Login sur LCA/KMLS
    ↓
Attente 2FA utilisateur
    ↓
Validation 2FA
    ↓
Cookies cryptés et sauvegardés
```

### 2. Scraping

```
Demande de scraping
    ↓
Chargement des données Google Sheets
    ↓
Pour chaque produit:
  - Récupération des URLs LCA et KMLS
  - Scraping avec anti-bot
  - Parsing du prix
    ↓
Comparaison avant/après
    ↓
Affichage modale de confirmation
```

### 3. Mise à jour

```
Utilisateur confirme
    ↓
Mise à jour Google Sheets (batch update)
    ↓
Génération du rapport Excel
    ↓
Sauvegarde dans Téléchargements
    ↓
Notification succès
```

---

## 🔒 Sécurité

- ✅ **Cookies chiffrés** avec AES-256
- ✅ **Clé de chiffrement** dans .env (non versionnée)
- ✅ **Context isolation** dans Electron
- ✅ **Pas de nodeIntegration** dans le renderer
- ✅ **Credentials Google** non versionnés

---

## 🐛 Troubleshooting

### Erreur "Google Sheets API not enabled"

→ Activer l'API dans Google Cloud Console

### Erreur "Permission denied" sur Google Sheets

→ Partager le sheet avec l'email du Service Account

### Scraping échoue (prix introuvable)

→ Les sites ont peut-être changé leur structure HTML
→ Vérifier les sélecteurs dans `lca-scraper.js` et `kmls-scraper.js`

### Application ne démarre pas

```bash
# Vérifier les logs
npm run dev
# Les erreurs s'afficheront dans le terminal
```

### Cookies expirés

→ Se reconnecter via la page de login

---

## 🔧 Développement

### Ajouter un nouveau fournisseur

1. Créer `src/backend/scrapers/nouveau-fournisseur-scraper.js`
2. Étendre `BaseScraper`
3. Implémenter `scrapeProduct(url)`
4. Ajouter la route dans `server.js`
5. Mettre à jour le frontend

### Modifier les sélecteurs CSS

Éditer les fichiers scrapers :
- `src/backend/scrapers/lca-scraper.js`
- `src/backend/scrapers/kmls-scraper.js`

### Personnaliser l'interface

Éditer `src/frontend/css/styles.css` pour changer les couleurs, polices, etc.

---

## 📝 Notes importantes

- **Délais anti-bot** : Des delays aléatoires sont appliqués pour éviter la détection
- **Limitations** : Le scraping peut prendre du temps pour beaucoup de produits
- **Cookies** : Persistent tant que l'app n'est pas fermée
- **Google Sheets** : Mise à jour uniquement après confirmation utilisateur

---

## 🤝 Support

Pour toute question ou problème :
1. Vérifier la section Troubleshooting
2. Consulter les logs dans le terminal
3. Vérifier les DevTools Electron (F12 en mode dev)

---

## 📄 Licence

MIT

---

**Développé avec ❤️ pour automatiser le suivi des prix**