// utils/e2ee.js
// Simple E2EE helpers using Web Crypto API (AES-GCM)

export async function generateKey() {
  return window.crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
}

export async function exportKey(key) {
  return window.crypto.subtle.exportKey("raw", key);
}

export async function importKey(rawKey) {
  return window.crypto.subtle.importKey(
    "raw",
    rawKey,
    { name: "AES-GCM" },
    true,
    ["encrypt", "decrypt"]
  );
}

export async function encryptMessage(key, message) {
  const enc = new TextEncoder();
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    enc.encode(message)
  );
  return { ciphertext: new Uint8Array(ciphertext), iv };
}

export async function decryptMessage(key, ciphertext, iv) {
  const dec = new TextDecoder();
  const plaintext = await window.crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    ciphertext
  );
  return dec.decode(plaintext);
}
