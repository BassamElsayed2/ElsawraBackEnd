"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.decryptDataApi = decryptDataApi;
const crypto_js_1 = require("crypto-js");
function decryptDataApi(encryptedData, passphrase) {
    const bytes = crypto_js_1.CryptoJS.AES.decrypt(encryptedData, passphrase);
    const decryptedString = bytes.toString(crypto_js_1.CryptoJS.enc.Utf8);
    try {
        return JSON.parse(decryptedString);
    }
    catch {
        return decryptedString;
    }
}
//# sourceMappingURL=decrypt.js.map