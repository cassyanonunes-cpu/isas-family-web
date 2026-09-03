import React, { createContext, useState, useEffect, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import api from '../services/api';
import PushService from '../services/PushService';
import socketService from '../services/socket';

const setStorageItem = async (key: string, value: string) => {
  if (Platform.OS === 'web') localStorage.setItem(key, value);
  else await SecureStore.setItemAsync(key, value);
};

const getStorageItem = async (key: string) => {
  if (Platform.OS === 'web') return localStorage.getItem(key);
  return await SecureStore.getItemAsync(key);
};

const deleteStorageItem = async (key: string) => {
  if (Platform.OS === 'web') localStorage.removeItem(key);
  else await SecureStore.deleteItemAsync(key);
};

type UserData = {
  id: string;
  name: string;
  displayName: string;
  email: string;
  role: string;
  familyId: string;
  avatarUrl?: string;
  isSharingLocation: boolean;
  status?: string;
  notificationPreview?: boolean;
};

type AuthContextData = {
  user: UserData | null;
  setUser: (user: UserData | null) => void;
  loading: boolean;
  signIn: (data: any) => Promise<void>;
  signOut: () => Promise<void>;
  updateLocationSharing: (isSharing: boolean) => void;
};

export const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStorageData() {
      try {
        const storedUser = await getStorageItem('user');
        const token = await getStorageItem('accessToken');

        if (storedUser && token) {
          setUser(JSON.parse(storedUser));
          await socketService.connect();
        }
      } catch (e) {
        console.error('Erro ao carregar dados do storage', e);
      } finally {
        setLoading(false);
      }
    }

    loadStorageData();
  }, []);

  const signIn = async (data: any) => {
    const { user, accessToken, refreshToken } = data;
    
    await setStorageItem('accessToken', accessToken);
    await setStorageItem('refreshToken', refreshToken);
    await setStorageItem('user', JSON.stringify(user));
    
    setUser(user);
    await socketService.connect();
    await PushService.registerDevice();
  };

  const updateLocationSharing = (isSharing: boolean) => {
    if (user) {
      setUser({ ...user, isSharingLocation: isSharing });
    }
  };

  const signOut = async () => {
    try {
      await PushService.unregisterDevice();
    } catch (e) {}

    try {
      await api.post('/auth/logout');
    } catch (e) {
      console.error('Erro ao fazer logout na API', e);
    }
    socketService.disconnect();
    await deleteStorageItem('accessToken');
    await deleteStorageItem('refreshToken');
    await deleteStorageItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, signIn, signOut, updateLocationSharing }}>
      {children}
    </AuthContext.Provider>
  );
};
