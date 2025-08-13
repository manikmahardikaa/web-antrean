import type { EncryptStorage as EncryptStorageType } from 'encrypt-storage';

let storage: EncryptStorageType | null = null;

if (typeof window !== 'undefined') {
  const { EncryptStorage } = require('encrypt-storage');
  const SECRET_KEY = process.env.NEXT_PUBLIC_SECRET_KEY_STORE || 'dev_secret_key';

  storage = new EncryptStorage(SECRET_KEY, {
    storageType: 'localStorage',
  });
}

const TOKEN_KEY = 'token_auth';
const EXPIRES_KEY = 'token_expiration';

export const jwtStorage = {
  /**
   * Simpan token & waktu kadaluarsa (dalam detik)
   */
  async storeToken(token: string, expiresInSeconds: number): Promise<void> {
    if (!storage) return;
    const expirationTime = Date.now() + expiresInSeconds * 1000;
    await storage.setItem(TOKEN_KEY, token);
    await storage.setItem(EXPIRES_KEY, expirationTime);
  },

  /**
   * Ambil token jika belum expired, jika expired, hapus & jalankan onExpired
   */
  async retrieveToken(onExpired: () => void = () => (window.location.href = '/login')): Promise<string | null> {
    if (!storage) return null;
    const token = await storage.getItem<string>(TOKEN_KEY);
    const expiration = await storage.getItem<number>(EXPIRES_KEY);

    if (token && expiration) {
      const now = Date.now();
      if (now > expiration) {
        await this.removeToken();
        if (typeof onExpired === 'function') onExpired();
        return null;
      }
      return token;
    }

    return null;
  },

  /**
   * Hapus semua token & data terkait
   */
  async removeToken(): Promise<void> {
    if (!storage) return;
    await storage.removeItem(TOKEN_KEY);
    await storage.removeItem(EXPIRES_KEY);
    await storage.removeItem('token');
    await storage.removeItem('user');
  },
};

Object.freeze(jwtStorage);
