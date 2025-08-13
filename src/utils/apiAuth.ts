import { jwtStorage } from './jwtStorage';

type OnExpiredCallback = () => void;
type ApiResponse<T = any> = T | { isExpiredJWT: true };

export const apiAuth = {
  async post<T = any>(url: string, body: unknown): Promise<T> {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Gagal mengirim data');
    return data;
  },

  async getDataPrivate<T = any>(
    url: string,
    onExpired: OnExpiredCallback = () => {
      window.location.href = '/login';
    }
  ): Promise<ApiResponse<T>> {
    const token = await jwtStorage.retrieveToken(onExpired);
    if (!token) return { isExpiredJWT: true };

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Gagal fetch data (auth)');
    return data;
  },

  async postDataPrivate<T = any>(
    url: string,
    body: unknown,
    onExpired: OnExpiredCallback = () => {
      window.location.href = '/login';
    }
  ): Promise<ApiResponse<T>> {
    const token = await jwtStorage.retrieveToken(onExpired);
    if (!token) return { isExpiredJWT: true };

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Gagal mengirim data (auth)');
    return data;
  },

  async putDataPrivate<T = any>(
    url: string,
    body: unknown,
    onExpired: OnExpiredCallback = () => {
      window.location.href = '/login';
    }
  ): Promise<ApiResponse<T>> {
    const token = await jwtStorage.retrieveToken(onExpired);
    if (!token) return { isExpiredJWT: true };

    const res = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Gagal mengubah data (auth)');
    return data;
  },

  async deleteDataPrivate<T = any>(
    url: string,
    onExpired: OnExpiredCallback = () => {
      window.location.href = '/login';
    }
  ): Promise<ApiResponse<T>> {
    const token = await jwtStorage.retrieveToken(onExpired);
    if (!token) return { isExpiredJWT: true };

    const res = await fetch(url, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Gagal menghapus data (auth)');
    return data;
  },
};
