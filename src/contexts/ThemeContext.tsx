import React, { createContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { getStorageItem, setStorageItem } from '../utils/storage';
import api from '../services/api';

export type ThemePreference = 'SYSTEM' | 'LIGHT' | 'DARK';
export type ThemeMode = 'light' | 'dark';

interface ThemeContextData {
  themePreference: ThemePreference;
  mode: ThemeMode;
  setThemePreference: (pref: ThemePreference) => Promise<void>;
  colors: any; // Poderíamos tipar forte
}

export const ThemeContext = createContext<ThemeContextData>({} as ThemeContextData);

export const lightColors = {
  primary: '#4F46E5', 
  primaryLight: '#818CF8',
  background: '#F9FAFB', 
  surface: '#FFFFFF',
  text: '#111827', 
  textSecondary: '#6B7280',
  border: '#E5E7EB',
  error: '#EF4444',
  success: '#10B981',
  avatarBg: '#E0E7FF',
  avatarText: '#4338CA',
  myMessageBg: '#4F46E5',
  myMessageText: '#FFFFFF',
  otherMessageBg: '#FFFFFF',
  otherMessageText: '#111827',
  cardBg: '#FFFFFF',
  inputBg: '#F3F4F6'
};

export const darkColors = {
  primary: '#6366F1', // Indigo mais claro
  primaryLight: '#818CF8',
  background: '#111827', // Fundo escuro
  surface: '#1F2937',    // Superfície escura
  text: '#F9FAFB', 
  textSecondary: '#9CA3AF',
  border: '#374151',
  error: '#F87171',
  success: '#34D399',
  avatarBg: '#3730A3',
  avatarText: '#E0E7FF',
  myMessageBg: '#4F46E5',
  myMessageText: '#FFFFFF',
  otherMessageBg: '#1F2937',
  otherMessageText: '#F9FAFB',
  cardBg: '#1F2937',
  inputBg: '#374151'
};

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const systemColorScheme = useColorScheme();
  const [themePreference, setPreference] = useState<ThemePreference>('SYSTEM');
  const [mode, setMode] = useState<ThemeMode>('light');

  useEffect(() => {
    loadPreference();
  }, []);

  useEffect(() => {
    if (themePreference === 'SYSTEM') {
      setMode(systemColorScheme === 'dark' ? 'dark' : 'light');
    } else {
      setMode(themePreference === 'DARK' ? 'dark' : 'light');
    }
  }, [themePreference, systemColorScheme]);

  const loadPreference = async () => {
    try {
      const stored = await getStorageItem('themePreference');
      if (stored) {
        setPreference(stored as ThemePreference);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const setThemePreference = async (pref: ThemePreference) => {
    setPreference(pref);
    try {
      await setStorageItem('themePreference', pref);
      // Sincronizar com backend fire and forget
      api.put('/users/me', { themePreference: pref }).catch(console.error);
    } catch (e) {
      console.error(e);
    }
  };

  const colors = mode === 'dark' ? darkColors : lightColors;

  return (
    <ThemeContext.Provider value={{ themePreference, mode, setThemePreference, colors }}>
      {children}
    </ThemeContext.Provider>
  );
};
