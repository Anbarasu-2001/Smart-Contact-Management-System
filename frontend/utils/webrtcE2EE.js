// utils/webrtcE2EE.js
// WebRTC Insertable Streams E2EE helpers

// This uses the Web Crypto API and TransformStreams to encrypt/decrypt encoded frames
// Key must be a CryptoKey (AES-GCM, 256 bits)

export function createEncryptor(key) {
  return new TransformStream({
    async transform(chunk, controller) {
      // chunk is an EncodedVideoChunk or EncodedAudioChunk
      const iv = window.crypto.getRandomValues(new Uint8Array(12));
      const data = new Uint8Array(chunk.data);
      const ciphertext = new Uint8Array(
        await window.crypto.subtle.encrypt(
          { name: "AES-GCM", iv },
          key,
          data
        )
      );
      // Prepend IV to ciphertext
      const encrypted = new Uint8Array(iv.length + ciphertext.length);
      encrypted.set(iv, 0);
      encrypted.set(ciphertext, iv.length);
      // Create a new chunk with encrypted data
      controller.enqueue(new chunk.constructor({
        type: chunk.type,
        timestamp: chunk.timestamp,
        data: encrypted,
        duration: chunk.duration,
        ...(chunk.type === 'key' ? { keyId: chunk.keyId } : {})
      }));
    }
  });
}

export function createDecryptor(key) {
  return new TransformStream({
    async transform(chunk, controller) {
      // chunk is an EncodedVideoChunk or EncodedAudioChunk
      const data = new Uint8Array(chunk.data);
      const iv = data.slice(0, 12);
      const ciphertext = data.slice(12);
      const plaintext = new Uint8Array(
        await window.crypto.subtle.decrypt(
          { name: "AES-GCM", iv },
          key,
          ciphertext
        )
      );
      controller.enqueue(new chunk.constructor({
        type: chunk.type,
        timestamp: chunk.timestamp,
        data: plaintext,
        duration: chunk.duration,
        ...(chunk.type === 'key' ? { keyId: chunk.keyId } : {})
      }));
    }
  });
}
