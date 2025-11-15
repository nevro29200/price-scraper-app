const { chromium } = require('playwright');
const fs = require('fs').promises;
const path = require('path');
const encryption = require('../utils/encryption');
const antiBot = require('../utils/anti-bot');

class AuthService {
  constructor() {
    this.lcaBrowser = null;
    this.lcaContext = null;
    this.lcaPage = null;
    this.kmlsBrowser = null;
    this.kmlsContext = null;
    this.kmlsPage = null;
    this.cookiesPath = path.join(__dirname, '../../..', '.cookies');
  }

  async ensureCookiesDir() {
    try {
      await fs.mkdir(this.cookiesPath, { recursive: true });
    } catch (error) {
      console.error('Erreur création dossier cookies:', error);
    }
  }

  // ===== LCA DISTRIBUTION =====

  async loginLCA(email, password) {
    try {
      await this.ensureCookiesDir();

      this.lcaBrowser = await chromium.launch({
        headless: true,  // Mode headless pour production
        args: [
          ...antiBot.getBrowserArgs(),
          '--disable-popup-blocking',
          '--disable-blink-features=AutomationControlled'
        ]
      });

      this.lcaContext = await this.lcaBrowser.newContext({
        userAgent: antiBot.getRandomUserAgent(),
        viewport: { width: 1920, height: 1080 },
        locale: 'fr-FR',
        timezoneId: 'Europe/Paris',
        permissions: ['notifications'],
        bypassCSP: true,
        javaScriptEnabled: true,
        ignoreHTTPSErrors: true,
        acceptDownloads: true
      });

      this.lcaPage = await this.lcaContext.newPage();

      // Injection des scripts anti-détection
      await this.lcaPage.addInitScript(antiBot.getStealthScript());

      await this.lcaPage.goto('https://www.lca-distribution.com/authentification?back=index', {
        waitUntil: 'networkidle'
      });

      await antiBot.randomDelay(1000, 2000);

      // Remplir le formulaire de connexion
      await this.lcaPage.fill('#email', email);
      await antiBot.randomDelay(500, 1000);
      
      await this.lcaPage.fill('#passwd', password);
      await antiBot.randomDelay(500, 1000);

      // Gérer une potentielle popup lors du clic
      const popupPromise = this.lcaContext.waitForEvent('page').catch(() => null);
      
      await this.lcaPage.click('#SubmitLogin');

      // Debug: attendre et logger
      await antiBot.randomDelay(3000, 4000);
      
      const currentUrl = this.lcaPage.url();
      const pageTitle = await this.lcaPage.title();
      console.log('📍 URL après login:', currentUrl);
      console.log('📄 Titre de la page:', pageTitle);
      
      // Vérifier s'il y a des messages d'erreur
      const errorMessages = await this.lcaPage.$$eval('.alert, .error, .message', 
        elements => elements.map(el => el.textContent.trim())
      ).catch(() => []);
      
      if (errorMessages.length > 0) {
        console.log('⚠️  Messages d\'erreur:', errorMessages);
      }

      // Attendre une popup ou nouvelle page
      const popup = await popupPromise;
      
      if (popup) {
        console.log('✅ Popup 2FA détectée');
        this.lcaPage = popup;
        await this.lcaPage.waitForLoadState('networkidle');
        
        // Réactualiser l'URL après popup
        const popupUrl = this.lcaPage.url();
        console.log('📍 URL popup:', popupUrl);
      }

      // Détecter si on est déjà connecté (vérifier l'URL finale)
      const finalUrl = this.lcaPage.url();
      console.log('🔍 URL finale pour vérification:', finalUrl);
      
      // Vérifier si on est sur la page d'accueil (donc connecté)
      const isOnHomePage = finalUrl === 'https://www.lca-distribution.com/' || 
                           finalUrl === 'https://www.lca-distribution.com';
      
      // Vérifier aussi qu'on N'EST PAS sur une page de login/auth
      const isNotAuthPage = !finalUrl.includes('authentification') &&
                            !finalUrl.includes('login') &&
                            !finalUrl.includes('2fa');
      
      const isLoggedIn = isOnHomePage && isNotAuthPage;
      
      console.log('🔍 isOnHomePage:', isOnHomePage);
      console.log('🔍 isNotAuthPage:', isNotAuthPage);
      console.log('🔍 isLoggedIn:', isLoggedIn);
      
      if (isLoggedIn) {
        console.log('✅ Connexion LCA réussie sans 2FA (déjà connu)');
        
        // Sauvegarder les cookies immédiatement
        const cookies = await this.lcaContext.cookies();
        const encryptedCookies = encryption.encrypt(JSON.stringify(cookies));
        
        await fs.writeFile(
          path.join(this.cookiesPath, 'lca-cookies.enc'),
          encryptedCookies
        );
        
        // IMPORTANT: Retourner ici, ne pas continuer
        return {
          success: true,
          message: 'Connexion LCA réussie',
          authenticated: true,
          awaiting2FA: false
        };
      }

      // Si on arrive ici, c'est qu'on attend le 2FA
      console.log('⏳ En attente du code 2FA LCA');

      return { 
        success: true, 
        message: 'En attente du code 2FA',
        awaiting2FA: true 
      };

    } catch (error) {
      console.error('Erreur login LCA:', error);
      throw new Error(`Échec connexion LCA: ${error.message}`);
    }
  }

  async verifyLCA2FA(code) {
    try {
      if (!this.lcaPage) {
        throw new Error('Session LCA non initialisée');
      }

      // Entrer le code 2FA
      await this.lcaPage.fill('input[name="code"], input[name="otp"], input[name="2fa"]', code);
      await antiBot.randomDelay(500, 1000);

      await this.lcaPage.click('button[type="submit"]');

      // Attendre la redirection après 2FA
      await this.lcaPage.waitForLoadState('networkidle');
      await antiBot.randomDelay(2000, 3000);

      // Sauvegarder les cookies
      const cookies = await this.lcaContext.cookies();
      const encryptedCookies = encryption.encrypt(JSON.stringify(cookies));
      
      await fs.writeFile(
        path.join(this.cookiesPath, 'lca-cookies.enc'),
        encryptedCookies
      );

      return { 
        success: true, 
        message: 'Connexion LCA réussie',
        authenticated: true 
      };

    } catch (error) {
      console.error('Erreur 2FA LCA:', error);
      throw new Error(`Échec 2FA LCA: ${error.message}`);
    }
  }

  // ===== KMLS =====

  async loginKMLS(email, password) {
    try {
      await this.ensureCookiesDir();

      this.kmlsBrowser = await chromium.launch({
        headless: true,
        args: antiBot.getBrowserArgs()
      });

      this.kmlsContext = await this.kmlsBrowser.newContext({
        userAgent: antiBot.getRandomUserAgent(),
        viewport: { width: 1920, height: 1080 },
        locale: 'fr-FR',
        timezoneId: 'Europe/Paris'
      });

      this.kmlsPage = await this.kmlsContext.newPage();

      await this.kmlsPage.addInitScript(antiBot.getStealthScript());

      await this.kmlsPage.goto('https://www.kmls.fr/fr/connexion', {
        waitUntil: 'networkidle'
      });

      await antiBot.randomDelay(1000, 2000);

      await this.kmlsPage.fill('input[name="p_Login"]', email);
      await antiBot.randomDelay(500, 1000);
      
      await this.kmlsPage.fill('input[name="p_Pass"]', password);
      await antiBot.randomDelay(500, 1000);

      await this.kmlsPage.click('input[name="p_Connexion"]');

      await this.kmlsPage.waitForLoadState('networkidle');
      await antiBot.randomDelay(1000, 2000);

      // Debug: logger l'URL et le titre
      const currentUrl = this.kmlsPage.url();
      const pageTitle = await this.kmlsPage.title();
      console.log('📍 URL après login KMLS:', currentUrl);
      console.log('📄 Titre de la page KMLS:', pageTitle);

      // Détecter si on est déjà connecté (pas de 2FA nécessaire)
      const isLoggedIn = currentUrl.includes('kmls.fr') && 
                         !currentUrl.includes('connexion') &&
                         !currentUrl.includes('login');
      
      // Vérifier aussi si on voit des éléments du compte utilisateur
      const hasUserAccount = await this.kmlsPage.$('.account, .user-info, [class*="account"], [class*="user"]').then(el => !!el).catch(() => false);
      
      if (isLoggedIn || hasUserAccount) {
        console.log('✅ Connexion KMLS réussie sans 2FA (déjà connu)');
        
        // Sauvegarder les cookies immédiatement
        const cookies = await this.kmlsContext.cookies();
        const encryptedCookies = encryption.encrypt(JSON.stringify(cookies));
        
        await fs.writeFile(
          path.join(this.cookiesPath, 'kmls-cookies.enc'),
          encryptedCookies
        );
        
        return {
          success: true,
          message: 'Connexion KMLS réussie',
          authenticated: true,
          awaiting2FA: false
        };
      }

      // Sinon, on attend le 2FA
      console.log('⏳ En attente du code 2FA KMLS');

      return { 
        success: true, 
        message: 'En attente du code 2FA',
        awaiting2FA: true 
      };

    } catch (error) {
      console.error('Erreur login KMLS:', error);
      throw new Error(`Échec connexion KMLS: ${error.message}`);
    }
  }

  async verifyKMLS2FA(code) {
    try {
      if (!this.kmlsPage) {
        throw new Error('Session KMLS non initialisée');
      }

      await this.kmlsPage.fill('input[name="p_Code"]', code);
      await antiBot.randomDelay(500, 1000);

      await this.kmlsPage.click('input[name="p_ValideCode"]');

      await this.kmlsPage.waitForLoadState('networkidle');
      await antiBot.randomDelay(2000, 3000);

      const cookies = await this.kmlsContext.cookies();
      const encryptedCookies = encryption.encrypt(JSON.stringify(cookies));
      
      await fs.writeFile(
        path.join(this.cookiesPath, 'kmls-cookies.enc'),
        encryptedCookies
      );

      return { 
        success: true, 
        message: 'Connexion KMLS réussie',
        authenticated: true 
      };

    } catch (error) {
      console.error('Erreur 2FA KMLS:', error);
      throw new Error(`Échec 2FA KMLS: ${error.message}`);
    }
  }

  // ===== VÉRIFICATION STATUT =====

  async getAuthStatus() {
    try {
      const lcaCookiesExist = await this.cookiesExist('lca-cookies.enc');
      const kmlsCookiesExist = await this.cookiesExist('kmls-cookies.enc');

      return {
        lca: lcaCookiesExist,
        kmls: kmlsCookiesExist,
        both: lcaCookiesExist && kmlsCookiesExist
      };
    } catch (error) {
      return { lca: false, kmls: false, both: false };
    }
  }

  async cookiesExist(filename) {
    try {
      await fs.access(path.join(this.cookiesPath, filename));
      return true;
    } catch {
      return false;
    }
  }

  // ===== RÉCUPÉRATION DES CONTEXTES =====

  async getLCAContext() {
    if (this.lcaContext) return this.lcaContext;

    const cookiesFile = path.join(this.cookiesPath, 'lca-cookies.enc');
    const encryptedCookies = await fs.readFile(cookiesFile, 'utf-8');
    const cookies = JSON.parse(encryption.decrypt(encryptedCookies));

    this.lcaBrowser = await chromium.launch({ headless: true });
    this.lcaContext = await this.lcaBrowser.newContext({
      userAgent: antiBot.getRandomUserAgent()
    });
    
    await this.lcaContext.addCookies(cookies);
    
    return this.lcaContext;
  }

  async getKMLSContext() {
    if (this.kmlsContext) return this.kmlsContext;

    const cookiesFile = path.join(this.cookiesPath, 'kmls-cookies.enc');
    const encryptedCookies = await fs.readFile(cookiesFile, 'utf-8');
    const cookies = JSON.parse(encryption.decrypt(encryptedCookies));

    this.kmlsBrowser = await chromium.launch({ headless: true });
    this.kmlsContext = await this.kmlsBrowser.newContext({
      userAgent: antiBot.getRandomUserAgent()
    });
    
    await this.kmlsContext.addCookies(cookies);
    
    return this.kmlsContext;
  }

  // ===== CLEANUP =====

  async cleanup() {
    if (this.lcaBrowser) await this.lcaBrowser.close();
    if (this.kmlsBrowser) await this.kmlsBrowser.close();
  }
}

module.exports = new AuthService();