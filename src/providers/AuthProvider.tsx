/* eslint-disable react-hooks/exhaustive-deps */
'use client';

import { createContext, useEffect, useState, ReactNode } from 'react';
import { jwtStorage } from '@/utils/jwtStorage';
import { apiAuth } from '@/utils/apiAuth';
import { useRouter } from 'next/navigation';

interface UserProfile {
  id_user: string;
  nama: string;
  email: string;
  role: string;
  tanggal_lahir: string;
  jenis_kelamin: string;
  no_telepon: string;
  alamat: string;
  createdAt: string;
  updatedAt: string;
  layanan?: {
    id_layanan: string;
    nama_layanan: string;
  } | null;
  tanggungan?: {
    id_tanggungan: string;
    nama_tanggungan: string;
  } | null;
}

interface AuthContextProps {
  token: string | null;
  isLoggedIn: boolean;
  userProfile: UserProfile | null;
  isLoading: boolean;
  login: (token: string, expiresIn?: number) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextProps | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export default function AuthProvider({ children }: AuthProviderProps) {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const router = useRouter();

  useEffect(() => {
    const loadToken = async () => {
      const savedToken = await jwtStorage.retrieveToken(() => setIsLoading(false));
      if (savedToken) {
        setToken(savedToken);
        await fetchUserData();
      } else {
        setIsLoading(false);
      }
    };
    loadToken();
  }, []);

  const fetchUserData = async () => {
    try {
      const data = await apiAuth.getDataPrivate('/api/auth/getdataprivate');

      if (data?.user) {
        if (data.user.role !== 'ADMIN') {
          console.warn('❌ Akses ditolak: bukan ADMIN');
          await logout();
          router.push('/login');
          return;
        }

        setUserProfile(data.user);
        setIsLoggedIn(true);
        router.push('/admin/dashboard');
      } else {
        await logout();
      }
    } catch (err) {
      console.error('❌ Gagal fetch user:', err);
      await logout();
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (token: string, expiresIn: number = 60 * 60 * 24) => {
    setToken(token);
    await jwtStorage.storeToken(token, expiresIn);
    setIsLoading(true);
    await fetchUserData();
  };

  const logout = async () => {
    await jwtStorage.removeToken();
    setToken(null);
    setUserProfile(null);
    setIsLoggedIn(false);
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        isLoggedIn,
        userProfile,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
