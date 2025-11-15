# 🚀 Démarrage Rapide - Price Scraper

Guide express pour lancer l'application en 5 minutes.

---

## ⚡ Installation ultra-rapide

### 1. Installer les dépendances

```bash
npm install
```

### 2. Créer le fichier .env

Créer `.env` à la racine :

```env
PORT=3000
NODE_ENV=development
GOOGLE_SHEET_ID=VOTRE_ID_ICI
ENCRYPTION_KEY=any-random-string-here
```

### 3. Configuration Google Sheets (1 minute)

1. Aller sur https://console.cloud.google.com
2. Créer un projet
3. Activer "Google Sheets API"
4. Credentials → Create Service Account
5. Télécharger le JSON
6. Renommer en `google-credentials.json` et placer à la racine
7. Copier l'email du service account
8. Ouvrir votre Google Sheet → Partager avec cet email

### 4. Lancer l'application

```bash
npm start
```

---

## 📋 Checklist de configuration

- [ ] `npm install` terminé
- [ ] Fichier `.env` créé avec GOOGLE_SHEET_ID
- [ ] Fichier `google-credentials.json` à la racine
- [ ] Google Sheet partagé avec le service account
- [ ] Comptes LCA et KMLS prêts

---

## 🎯 Premier lancement

### 1. Page de login

- Entrer email/password LCA
- Entrer le code 2FA
- Répéter pour KMLS

### 2. Configuration

- Cliquer sur "⚙️ Paramètres"
- Définir les colonnes de votre Google Sheet
- Sauvegarder

### 3. Premier scraping

- Retour au Dashboard
- Cliquer "🔄 Mettre à jour tous les produits"
- Attendre le résultat
- Confirmer les modifications

---

## 🔍 Structure minimale du Google Sheet

Votre Google Sheet doit avoir au minimum :

| A (Marque) | B (Produit) | C (Lien moins cher) | D (Prix moins cher) | E (Lien LCA) | F (Lien KMLS) |
|------------|-------------|---------------------|---------------------|--------------|---------------|
| Marque1    | Produit1    | https://...         | 99.99               | https://...  | https://...   |
| Marque2    | Produit2    | https://...         | 149.99              | https://...  | https://...   |

**Important :** 
- Ligne 1 = Headers (ignorée par l'app)
- Données à partir de la ligne 2

---

## ⚠️ Problèmes courants

### L'app ne démarre pas

```bash
# Vérifier Node.js
node --version  # Doit être 18+

# Réinstaller
rm -rf node_modules package-lock.json
npm install
```

### Erreur Google Sheets

```
Vérifier :
1. API activée dans Google Cloud Console
2. Sheet partagé avec le service account
3. GOOGLE_SHEET_ID correct dans .env
```

### Scraping ne fonctionne pas

```
1. Vérifier que vous êtes connecté (cookies valides)
2. Si erreur persiste, se reconnecter
3. Les sites peuvent avoir changé leur structure
```

---

## 💡 Astuces

### Trouver l'ID du Google Sheet

Dans l'URL : `https://docs.google.com/spreadsheets/d/[CET_ID_ICI]/edit`

### Générer une clé de chiffrement sécurisée

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Tester la configuration

```bash
npm test
```

---

## 📞 Aide rapide

**L'app crash au démarrage ?**
→ Vérifier les logs dans le terminal

**Impossible de se connecter aux fournisseurs ?**
→ Vérifier identifiants et 2FA

**Google Sheets ne se met pas à jour ?**
→ Vérifier les permissions du service account

**Prix non trouvés lors du scraping ?**
→ Les sélecteurs CSS ont peut-être changé, vérifier les scrapers

---

## 🎓 Prochaines étapes

1. ✅ Lancer l'app
2. ✅ Se connecter aux fournisseurs
3. ✅ Configurer les colonnes
4. ✅ Premier scraping
5. 📊 Consulter le rapport Excel dans Téléchargements

---

**Temps total estimé : 5-10 minutes** ⏱️