// Page de login

let lcaAuthenticated = false;
let kmlsAuthenticated = false;

// === LCA LOGIN ===

document.getElementById('lcaLoginBtn').addEventListener('click', async () => {
  const email = document.getElementById('lcaEmail').value;
  const password = document.getElementById('lcaPassword').value;

  if (!email || !password) {
    showToast('Veuillez remplir tous les champs', 'error');
    return;
  }

  try {
    showLoading('Connexion à LCA en cours...');
    const result = await api.loginLCA(email, password);

    console.log('🔍 Réponse LCA:', result);  // ← DEBUG

    // CAS 1 : Déjà connecté sans 2FA
    if (result.success && result.authenticated && !result.awaiting2FA) {
      console.log('✅ Frontend: Connexion directe LCA');
      lcaAuthenticated = true;
      document.getElementById('lcaLoginForm').style.display = 'none';
      document.getElementById('lcaSuccess').style.display = 'block';
      showToast('✅ Connecté à LCA Distribution', 'success');
      checkBothAuthenticated();
    } 
    // CAS 2 : En attente du 2FA
    else if (result.success && result.awaiting2FA) {
      console.log('⏳ Frontend: En attente 2FA LCA');
      document.getElementById('lcaLoginForm').style.display = 'none';
      document.getElementById('lca2FAForm').style.display = 'block';
      showToast('Code 2FA envoyé par email', 'success');
    } 
    else {
      console.log('❌ Frontend: Erreur LCA');
      showToast('Erreur de connexion LCA', 'error');
    }
  } catch (error) {
    showToast('Erreur: ' + error.message, 'error');
  } finally {
    hideLoading();
  }
});

document.getElementById('lca2FABtn').addEventListener('click', async () => {
  const code = document.getElementById('lca2FACode').value;

  if (!code || code.length < 4) {
    showToast('Code 2FA invalide', 'error');
    return;
  }

  try {
    showLoading('Validation du code 2FA...');
    const result = await api.verifyLCA2FA(code);

    if (result.success && result.authenticated) {
      lcaAuthenticated = true;
      document.getElementById('lca2FAForm').style.display = 'none';
      document.getElementById('lcaSuccess').style.display = 'block';
      showToast('✅ Connecté à LCA Distribution', 'success');
      checkBothAuthenticated();
    } else {
      showToast('Code 2FA incorrect', 'error');
    }
  } catch (error) {
    showToast('Erreur: ' + error.message, 'error');
  } finally {
    hideLoading();
  }
});

// === KMLS LOGIN ===

document.getElementById('kmlsLoginBtn').addEventListener('click', async () => {
  const email = document.getElementById('kmlsEmail').value;
  const password = document.getElementById('kmlsPassword').value;

  if (!email || !password) {
    showToast('Veuillez remplir tous les champs', 'error');
    return;
  }

  try {
    showLoading('Connexion à KMLS en cours...');
    const result = await api.loginKMLS(email, password);

    // CAS 1 : Déjà connecté sans 2FA
    if (result.success && result.authenticated && !result.awaiting2FA) {
      kmlsAuthenticated = true;
      document.getElementById('kmlsLoginForm').style.display = 'none';
      document.getElementById('kmlsSuccess').style.display = 'block';
      showToast('✅ Connecté à KMLS', 'success');
      checkBothAuthenticated();
    } 
    // CAS 2 : En attente du 2FA
    else if (result.success && result.awaiting2FA) {
      document.getElementById('kmlsLoginForm').style.display = 'none';
      document.getElementById('kmls2FAForm').style.display = 'block';
      showToast('Code 2FA envoyé par email', 'success');
    } 
    else {
      showToast('Erreur de connexion KMLS', 'error');
    }
  } catch (error) {
    showToast('Erreur: ' + error.message, 'error');
  } finally {
    hideLoading();
  }
});

document.getElementById('kmls2FABtn').addEventListener('click', async () => {
  const code = document.getElementById('kmls2FACode').value;

  if (!code || code.length < 4) {
    showToast('Code 2FA invalide', 'error');
    return;
  }

  try {
    showLoading('Validation du code 2FA...');
    const result = await api.verifyKMLS2FA(code);

    if (result.success && result.authenticated) {
      kmlsAuthenticated = true;
      document.getElementById('kmls2FAForm').style.display = 'none';
      document.getElementById('kmlsSuccess').style.display = 'block';
      showToast('✅ Connecté à KMLS', 'success');
      checkBothAuthenticated();
    } else {
      showToast('Code 2FA incorrect', 'error');
    }
  } catch (error) {
    showToast('Erreur: ' + error.message, 'error');
  } finally {
    hideLoading();
  }
});

// === NAVIGATION ===

function checkBothAuthenticated() {
  if (lcaAuthenticated && kmlsAuthenticated) {
    document.getElementById('goToDashboard').style.display = 'block';
  }
}

document.getElementById('goToDashboard').addEventListener('click', async () => {
  await goToDashboard();
});

// === VÉRIFICATION AU CHARGEMENT ===

window.addEventListener('DOMContentLoaded', async () => {
  try {
    showLoading('Vérification des sessions...');
    const status = await api.getAuthStatus();
    
    if (status.lca) {
      lcaAuthenticated = true;
      document.getElementById('lcaLoginForm').style.display = 'none';
      document.getElementById('lcaSuccess').style.display = 'block';
      console.log('✅ Session LCA active');
    }

    if (status.kmls) {
      kmlsAuthenticated = true;
      document.getElementById('kmlsLoginForm').style.display = 'none';
      document.getElementById('kmlsSuccess').style.display = 'block';
      console.log('✅ Session KMLS active');
    }

    checkBothAuthenticated();
    
    if (status.both) {
      showToast('✅ Sessions actives détectées', 'success');
    }
    
    hideLoading();
  } catch (error) {
    console.error('Erreur vérification statut:', error);
    hideLoading();
  }
});