import CryptoJS from 'crypto-js';

const SECRET_KEY = 'MESSENGER_SECRET_2026';

export const hashPassword = (password: string): string => {
  return CryptoJS.SHA256(password).toString();
};

export const verifyPassword = (password: string, hash: string): boolean => {
  return hashPassword(password) === hash;
};

export const encryptMessage = (message: string): string => {
  return CryptoJS.AES.encrypt(message, SECRET_KEY).toString();
};

export const decryptMessage = (encryptedMessage: string): string => {
  const bytes = CryptoJS.AES.decrypt(encryptedMessage, SECRET_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
};

export const generateToken = (): string => {
  return CryptoJS.lib.WordArray.random(16).toString();
};

export const generateId = (): string => {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};
// 2FA/TOTP removed — functions were intentionally removed per project request
