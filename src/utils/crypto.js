// src/utils/crypto.js

export async function encryptAESMessage(message, key) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(message);
  const cryptoKey = await crypto.subtle.importKey('raw', key, 'AES-GCM', false, ['encrypt']);
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, cryptoKey, encoded);
  return {
    ciphertext: btoa(String.fromCharCode(...new Uint8Array(ciphertext))),
    iv: JSON.stringify(Array.from(iv)),
  };
}

export async function decryptAESMessage(ciphertext, ivArray, key) {
  const iv = new Uint8Array(ivArray);
  const cryptoKey = await crypto.subtle.importKey('raw', key, 'AES-GCM', false, ['decrypt']);
  const binary = Uint8Array.from(atob(ciphertext), c => c.charCodeAt(0));
  const decoded = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, cryptoKey, binary);
  return new TextDecoder().decode(decoded);
}
