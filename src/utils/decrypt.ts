import { CryptoJS } from 'crypto-js';

export function decryptDataApi(encryptedData: string, passphrase: string) {
    const bytes = CryptoJS.AES.decrypt(encryptedData, passphrase);
    const decryptedString = bytes.toString(CryptoJS.enc.Utf8); 
  
    try {
      return JSON.parse(decryptedString);
    } catch {
      return decryptedString;
    }
}