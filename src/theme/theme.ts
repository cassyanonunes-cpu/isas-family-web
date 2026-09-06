import { Platform } from 'react-native';

const darkColors = {
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
};

const pinkColors = {
  primary: '#EC4899', // Pink 500
  primaryLight: '#F472B6',
  background: '#FFF1F2', // Rose 50
  surface: '#FFFFFF',
  surfaceHighlight: '#FFE4E6',
  text: '#4C1D95', // Deep purple text for contrast
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
};

const blackColors = {
  primary: '#F59E0B', // Amber/Gold accent
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
};

const defaultSpacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 };
const defaultBorder = { radius: { sm: 4, md: 8, lg: 16, xl: 24, round: 9999 } };
const defaultTypography = {
  sizes: { xs: 12, sm: 14, md: 16, lg: 18, xl: 24, xxl: 32 },
  weights: { regular: '400', medium: '500', bold: '700' }
};

// Default is dark (Indigo)
let activeColors = darkColors;

// Na Web, tenta carregar do localStorage imediatamente para evitar flash de cor errada
if (Platform.OS === 'web') {
  try {
    const saved = localStorage.getItem('isas_theme');
    if (saved === 'PINK') activeColors = pinkColors;
    else if (saved === 'BLACK') activeColors = blackColors;
  } catch(e) {}
}

export const theme = {
  get colors() { return activeColors; },
  spacing: defaultSpacing,
  border: defaultBorder,
  typography: defaultTypography,
};

export const switchTheme = (themeName: 'INDIGO' | 'PINK' | 'BLACK') => {
  if (themeName === 'PINK') activeColors = pinkColors;
  else if (themeName === 'BLACK') activeColors = blackColors;
  else activeColors = darkColors;
  
  if (Platform.OS === 'web') {
    localStorage.setItem('isas_theme', themeName);
    window.location.reload(); // Recarrega para aplicar a todos os componentes estáticos
  }
};
