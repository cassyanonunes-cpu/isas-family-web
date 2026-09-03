/**
 * Configuração centralizada de ambiente do Isas Family.
 *
 * Para rodar em dispositivo físico, defina EXPO_PUBLIC_API_URL no arquivo .env:
 *   EXPO_PUBLIC_API_URL=http://<SEU_IP_LOCAL>:3000/api
 *
 * Para o emulador Android padrão (AVD), o endereço 10.0.2.2 aponta
 * para o localhost do computador hospedeiro.
 *
 * NUNCA use 'localhost' em dispositivos físicos.
 */

// Base URL do backend REST
export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:3000/api';

// URL do servidor Socket.IO (remove o /api do final)
export const SOCKET_URL = API_BASE_URL.replace('/api', '');

// Timeout padrão para requisições HTTP (ms)
export const HTTP_TIMEOUT = 15000;

// Tempo máximo de espera por frame de stream WebRTC antes de encerrar (ms)
export const WEBRTC_TIMEOUT = 30000;

// Configuração STUN/TURN para WebRTC
// Em produção, adicionar TURN servers aqui via variáveis de ambiente
export const ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  // TURN server de produção - necessário para redes 4G/5G e NATs restritos
  // Descomentar e preencher com credenciais TURN quando disponíveis:
  // {
  //   urls: 'turn:seu-turn-server.com:3478',
  //   username: process.env.EXPO_PUBLIC_TURN_USER,
  //   credential: process.env.EXPO_PUBLIC_TURN_PASS,
  // }
];

// Versão do app
export const APP_VERSION = '1.0.0';

// Ambiente atual (pode ser 'development' | 'production')
export const ENV = __DEV__ ? 'development' : 'production';
