import { io, Socket } from 'socket.io-client';
import { getStorageItem } from '../utils/storage';
import { SOCKET_URL } from '../config/env';

class SocketService {
  public socket: Socket | null = null;

  async connect() {
    if (this.socket?.connected) return;

    const token = await getStorageItem('accessToken');
    if (!token) return;

    this.socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket'],
    });

    this.socket.on('connect', () => {
      console.log('[Socket] Conectado:', this.socket?.id);
    });

    this.socket.on('connect_error', (err) => {
      console.error('[Socket] Erro de conexão:', err.message);
    });

    this.socket.on('disconnect', () => {
      console.log('[Socket] Desconectado');
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  joinConversation(conversationId: string) {
    this.socket?.emit('join_conversation', conversationId);
  }

  leaveConversation(conversationId: string) {
    this.socket?.emit('leave_conversation', conversationId);
  }

  onNewMessage(callback: (message: any) => void) {
    this.socket?.on('message:new', callback);
  }

  offNewMessage(callback?: (message: any) => void) {
    this.socket?.off('message:new', callback);
  }

  onConversationUpdated(callback: (data: any) => void) {
    this.socket?.on('conversation:updated', callback);
  }

  offConversationUpdated(callback?: (data: any) => void) {
    this.socket?.off('conversation:updated', callback);
  }

  emitTyping(conversationId: string) {
    this.socket?.emit('chat:typing', { conversationId });
  }

  onTyping(callback: (data: { conversationId: string, userId: string }) => void) {
    this.socket?.on('chat:typing', callback);
  }

  offTyping(callback?: (data: any) => void) {
    this.socket?.off('chat:typing', callback);
  }

  onReadReceipt(callback: (data: { conversationId: string, userId: string, messageIds: string[] }) => void) {
    this.socket?.on('chat:read_receipt', callback);
  }

  offReadReceipt(callback?: (data: any) => void) {
    this.socket?.off('chat:read_receipt', callback);
  }

  onUserPresence(callback: (data: { userId: string, isOnline: boolean, lastSeen?: string }) => void) {
    this.socket?.on('user:presence', callback);
  }

  offUserPresence(callback?: (data: any) => void) {
    this.socket?.off('user:presence', callback);
  }


  onLocationUpdated(callback: (data: any) => void) {
    this.socket?.on('location:updated', callback);
  }

  offLocationUpdated(callback?: (data: any) => void) {
    this.socket?.off('location:updated', callback);
  }

  // --- WEBRTC SIGNALING ---
  
  onIncomingCall(callback: (data: any) => void) {
    this.socket?.on('call:incoming', callback);
  }
  
  onCallAccept(callback: (data: any) => void) {
    this.socket?.on('call:accept', callback);
  }
  
  onCallDecline(callback: (data: any) => void) {
    this.socket?.on('call:decline', callback);
  }
  
  onCallEnd(callback: (data: any) => void) {
    this.socket?.on('call:end', callback);
  }
  
  onCallMissed(callback: (data: any) => void) {
    this.socket?.on('call:missed', callback);
  }
  
  onCallOffer(callback: (data: any) => void) {
    this.socket?.on('call:offer', callback);
  }
  
  onCallAnswer(callback: (data: any) => void) {
    this.socket?.on('call:answer', callback);
  }
  
  onCallIceCandidate(callback: (data: any) => void) {
    this.socket?.on('call:ice-candidate', callback);
  }
  
  emitCallAccept(data: { callId: string, to: string }) {
    this.socket?.emit('call:accept', data);
  }
  
  emitCallDecline(data: { callId: string, to: string }) {
    this.socket?.emit('call:decline', data);
  }
  
  emitCallEnd(data: { callId: string, to: string }) {
    this.socket?.emit('call:end', data);
  }
  
  emitCallOffer(data: { callId: string, to: string, offer: any }) {
    this.socket?.emit('call:offer', data);
  }
  
  emitCallAnswer(data: { callId: string, to: string, answer: any }) {
    this.socket?.emit('call:answer', data);
  }
  
  emitIceCandidate(data: { callId: string, to: string, candidate: any }) {
    this.socket?.emit('call:ice-candidate', data);
  }

  offCallEvents() {
    this.socket?.off('call:incoming');
    this.socket?.off('call:accept');
    this.socket?.off('call:decline');
    this.socket?.off('call:end');
    this.socket?.off('call:missed');
    this.socket?.off('call:offer');
    this.socket?.off('call:answer');
    this.socket?.off('call:ice-candidate');
  }
}

export default new SocketService();
