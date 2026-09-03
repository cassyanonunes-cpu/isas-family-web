import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

export const setStorageItem = async (key: string, value: string) => {
  if (Platform.OS === 'web') {
    localStorage.setItem(key, value);
  } else {
    await SecureStore.setItemAsync(key, value);
  }
};

export const getStorageItem = async (key: string) => {
  if (Platform.OS === 'web') {
    return localStorage.getItem(key);
  }
  return await SecureStore.getItemAsync(key);
};

export const deleteStorageItem = async (key: string) => {
  if (Platform.OS === 'web') {
    localStorage.removeItem(key);
  } else {
    await SecureStore.deleteItemAsync(key);
  }
};
