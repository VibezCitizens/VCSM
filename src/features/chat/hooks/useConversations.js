// src/hooks/useEncryption.js

export function useEncryption() {
  const encrypt = async (plainText) => plainText;
  const decrypt = async (cipherText) => cipherText;

  return {
    encrypt,
    decrypt,
    loading: false,
    key: 'noop-mode',
  };
}
