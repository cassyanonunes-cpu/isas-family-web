// @ts-ignore
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import api from './api';

class PushService {
  async requestPermission() {
    if (Platform.OS === 'ios') {
      const messaging = require('@react-native-firebase/messaging').default;
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;
      return enabled;
    }
    return true; // No Android a permissão nativa deve ser solicitada se for API 33+ (via PermissionsAndroid ou Expo)
  }

  async registerDevice() {
    if (Platform.OS === 'web') {
      console.log('[PushService] Web push mock');
      return;
    }
    
    try {
      const hasPermission = await this.requestPermission();
      if (!hasPermission) {
        console.log('[PushService] Permissão negada');
        return;
      }

      const messaging = require('@react-native-firebase/messaging').default;
      const fcmToken = await messaging().getToken();
      if (fcmToken) {
        console.log('[PushService] FCM Token:', fcmToken);
        // Envia para o backend
        await api.post('/devices/register', {
          identifier: 'unique_device_id', // Na prática, usar expo-device ou expo-application pra pegar ID fixo
          platform: Platform.OS.toUpperCase(),
          pushToken: fcmToken,
          voipToken: null // Se for usar react-native-voip-push-notification, atualizaríamos aqui depois
        });
      }
    } catch (error) {
      console.error('[PushService] Falha ao registrar device', error);
    }
  }

  async unregisterDevice() {
    try {
      await api.post('/devices/unregister', {
        identifier: 'unique_device_id'
      });
      const messaging = require('@react-native-firebase/messaging').default;
      await messaging().deleteToken();
    } catch (error) {
      console.error('[PushService] Falha ao desregistrar', error);
    }
  }
}

export default new PushService();
