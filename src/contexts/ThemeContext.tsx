import React, { createContext, useState, useEffect } from 'react';
import { getStorageItem, setStorageItem } from '../utils/storage';
import api from '../services/api';

export type ThemePreference = 'INDIGO' | 'PINK' | 'BLACK';

interface ThemeContextData {
  themePreference: ThemePreference;
  setThemePreference: (pref: ThemePreference) => Promise<void>;
  colors: any;
}

export const ThemeContext = createContext<ThemeContextData>({} as ThemeContextData);

export const indigoColors = {
  primary: '#6366F1', // Indigo 500
  primaryLight: '#818CF8',
  background: '#0F172A',
  surface: '#1E293B',
  surfaceHighlight: '#334155',
  text: '#F8FAFC',
  textSecondary: '#94A3B8',
  border: '#334155',
  error: '#F43F5E',
  success: '#10B981',
  avatarBg: '#312E81',
  avatarText: '#E0E7FF',
  myMessageBg: '#6366F1',
  myMessageText: '#FFFFFF',
  otherMessageBg: '#1E293B',
  otherMessageText: '#F8FAFC',
  cardBg: '#1E293B',
  inputBg: '#334155'
};

export const pinkColors = {
  primary: '#EC4899', // Pink 500
  primaryLight: '#F472B6',
  background: '#FFF1F2', // Rose 50
  surface: '#FFFFFF',
  surfaceHighlight: '#FFE4E6',
  text: '#4C1D95', 
  textSecondary: '#831843',
  border: '#FECDD3',
  error: '#E11D48',
  success: '#059669',
  avatarBg: '#FBCFE8',
  avatarText: '#BE185D',
  myMessageBg: '#EC4899',
  myMessageText: '#FFFFFF',
  otherMessageBg: '#FFFFFF',
  otherMessageText: '#4C1D95',
  cardBg: '#FFFFFF',
  inputBg: '#FFF1F2'
};

export const blackColors = {
  primary: '#F59E0B', // Amber
  primaryLight: '#FBBF24',
  background: '#000000', // Pitch Black
  surface: '#111111',
  surfaceHighlight: '#222222',
  text: '#FFFFFF',
  textSecondary: '#A3A3A3',
  border: '#333333',
  error: '#EF4444',
  success: '#10B981',
  avatarBg: '#262626',
  avatarText: '#F59E0B',
  myMessageBg: '#F59E0B',
  myMessageText: '#000000',
  otherMessageBg: '#111111',
  otherMessageText: '#FFFFFF',
  cardBg: '#111111',
  inputBg: '#222222'
};

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [themePreference, setPreference] = useState<ThemePreference>('INDIGO');

  useEffect(() => {
    loadPreference();
  }, []);

  const loadPreference = async () => {
    try {
      const stored = await getStorageItem('themePreference');
      if (stored && (stored === 'INDIGO' || stored === 'PINK' || stored === 'BLACK')) {
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
      api.put('/users/me', { themePreference: pref }).catch(console.error);
    } catch (e) {
      console.error(e);
    }
  };

  let colors = indigoColors;
  if (themePreference === 'PINK') colors = pinkColors;
  if (themePreference === 'BLACK') colors = blackColors;

  return (
    <ThemeContext.Provider value={{ themePreference, setThemePreference, colors }}>
      {children}
    </ThemeContext.Provider>
  );
};
