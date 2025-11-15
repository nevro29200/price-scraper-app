const CryptoJS = require('crypto-js');

// Clé de chiffrement (devrait être dans .env en production)
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-secret-key-change-in-production';

class Encryption {
  encrypt(text) {
    try {
      return CryptoJS.AES.encrypt(text, ENCRYPTION_KEY).toString();
    } catch (error) {
      console.error('Erreur chiffrement:', error);
      throw error;
    }
  }

  decrypt(ciphertext) {
    try {
      const bytes = CryptoJS.AES.decrypt(ciphertext, ENCRYPTION_KEY);
      return bytes.toString(CryptoJS.enc.Utf8);
    } catch (error) {
      console.error('Erreur déchiffrement:', error);
      throw error;
    }
  }
}

module.exports = new Encryption();