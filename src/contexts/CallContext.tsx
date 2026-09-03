import React, { createContext, useState, useEffect, ReactNode, useContext } from 'react';
import { AuthContext } from './AuthContext';
import socketService from '../services/socket';
import { Platform, Alert } from 'react-native';

let RTCPeerConnection: any, RTCSessionDescription: any, RTCIceCandidate: any, MediaStream: any, mediaDevices: any;

if (Platform.OS !== 'web') {
  const webrtc = require('react-native-webrtc');
  RTCPeerConnection = webrtc.RTCPeerConnection;
  RTCSessionDescription = webrtc.RTCSessionDescription;
  RTCIceCandidate = webrtc.RTCIceCandidate;
  MediaStream = webrtc.MediaStream;
  mediaDevices = webrtc.mediaDevices;
} else {
  RTCPeerConnection = window.RTCPeerConnection || (window as any).webkitRTCPeerConnection || function() {};
  RTCSessionDescription = window.RTCSessionDescription || function() {};
  RTCIceCandidate = window.RTCIceCandidate || function() {};
  MediaStream = window.MediaStream || function() {};
  mediaDevices = navigator.mediaDevices || {};
}

import api from '../services/api';
import CallKeepService from '../services/CallKeepService';
import { ICE_SERVERS } from '../config/env';

export type CallStatus = 'IDLE' | 'CALLING' | 'RINGING' | 'CONNECTED';

interface CallState {
  status: CallStatus;
  callId: string | null;
  remoteUserId: string | null;
  type: 'VOICE' | 'VIDEO' | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isMuted: boolean;
  isVideoEnabled: boolean;
  incomingCall: { callId: string, from: string, type: 'VOICE' | 'VIDEO' } | null;
}

interface CallContextData {
  callState: CallState;
  initiateCall: (calleeId: string, type: 'VOICE' | 'VIDEO') => Promise<void>;
  acceptCall: () => Promise<void>;
  declineCall: () => Promise<void>;
  endCall: () => Promise<void>;
  toggleMute: () => void;
  toggleVideo: () => void;
  switchCamera: () => void;
}

export const CallContext = createContext<CallContextData>({} as CallContextData);

export const CallProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useContext(AuthContext);
  const [peerConnection, setPeerConnection] = useState<RTCPeerConnection | null>(null);
  
  const [callState, setCallState] = useState<CallState>({
    status: 'IDLE',
    callId: null,
    remoteUserId: null,
    type: null,
    localStream: null,
    remoteStream: null,
    isMuted: false,
    isVideoEnabled: true,
    incomingCall: null,
  });

  // ICE Servers STUN/TURN — configuração centralizada em src/config/env.ts
  const iceServers = { iceServers: ICE_SERVERS };

  useEffect(() => {
    if (!user) return;

    socketService.onIncomingCall((data) => {
      // { id, callerId, type, callerName }
      if (callState.status !== 'IDLE') {
        return;
      }
      setCallState(prev => ({
        ...prev,
        incomingCall: { callId: data.id, from: data.callerId, type: data.type }
      }));
      // Exibe nativamente também (mesmo se foreground)
      CallKeepService.displayIncomingCall(data.id, data.callerName || 'Contato', data.type);
    });

    // Eventos do CallKeep (quando atende ou recusa pela tela bloqueada)
    CallKeepService.onAnswerCallAction(({ callUUID }) => {
      // Chama o accept call local se bater o ID
      if (callUUID && callState.incomingCall && callState.incomingCall.callId === callUUID) {
        acceptCallFromCallKeep(callState.incomingCall);
      }
    });

    CallKeepService.onEndCallAction(({ callUUID }) => {
      if (callUUID && callState.incomingCall && callState.incomingCall.callId === callUUID) {
        declineCall();
      } else if (callState.callId === callUUID) {
        endCall();
      }
    });

    socketService.onCallAccept(async (data) => {
      if (callState.status === 'CALLING') {
        setCallState(prev => ({ ...prev, status: 'CONNECTED' }));
        // Criar Offer
        if (peerConnection) {
          try {
            const offer = await peerConnection.createOffer();
            await peerConnection.setLocalDescription(offer);
            socketService.emitCallOffer({ callId: callState.callId!, to: callState.remoteUserId!, offer });
          } catch (e) {
            console.error('Error creating offer', e);
          }
        }
      }
    });

    socketService.onCallDecline((data) => {
      cleanupCall();
      Alert.alert('Chamada Recusada', 'O contato recusou a chamada.');
    });

    socketService.onCallEnd((data) => {
      cleanupCall();
    });

    socketService.onCallMissed((data) => {
      cleanupCall();
    });

    socketService.onCallOffer(async (data) => {
      if (peerConnection) {
        try {
          await peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer));
          const answer = await peerConnection.createAnswer();
          await peerConnection.setLocalDescription(answer);
          socketService.emitCallAnswer({ callId: data.callId, to: data.from, answer });
        } catch (e) {
          console.error('Error creating answer', e);
        }
      }
    });

    socketService.onCallAnswer(async (data) => {
      if (peerConnection) {
        try {
          await peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
        } catch (e) {
          console.error('Error setting remote description', e);
        }
      }
    });

    socketService.onCallIceCandidate(async (data) => {
      if (peerConnection && data.candidate) {
        try {
          await peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
        } catch (e) {
          console.error('Error adding ICE candidate', e);
        }
      }
    });

    return () => {
      socketService.offCallEvents();
    };
  }, [user, callState.status, peerConnection]);

  const setupMediaAndPC = async (type: 'VOICE' | 'VIDEO', isCaller: boolean) => {
    try {
      let isFront = true;
      const devices: any = await mediaDevices.enumerateDevices();
      const videoSourceId = devices.find((device: any) => device.kind === 'videoinput' && device.facing === (isFront ? 'front' : 'environment'))?.deviceId;

      const stream: any = await mediaDevices.getUserMedia({
        audio: true,
        video: type === 'VIDEO' ? {
          facingMode: (isFront ? 'user' : 'environment'),
          deviceId: videoSourceId ? { exact: videoSourceId } : undefined,
        } : false
      });

      const pc = new RTCPeerConnection(iceServers);

      pc.onicecandidate = (event: any) => {
        if (event.candidate) {
          socketService.emitIceCandidate({
            callId: callState.callId || callState.incomingCall?.callId!,
            to: callState.remoteUserId || callState.incomingCall?.from!,
            candidate: event.candidate
          });
        }
      };

      pc.ontrack = (event: any) => {
        if (event.streams && event.streams[0]) {
          setCallState(prev => ({ ...prev, remoteStream: event.streams[0] }));
        }
      };

      // Adiciona as tracks locais ao PC
      stream.getTracks().forEach((track: any) => pc.addTrack(track, stream));

      setPeerConnection(pc);
      setCallState(prev => ({
        ...prev,
        localStream: stream,
        type,
        isVideoEnabled: type === 'VIDEO'
      }));

      return pc;
    } catch (e) {
      console.error('Failed to setup media', e);
      throw e;
    }
  };

  const initiateCall = async (calleeId: string, type: 'VOICE' | 'VIDEO') => {
    try {
      setCallState(prev => ({ ...prev, status: 'CALLING', remoteUserId: calleeId, type }));
      const res = await api.post('/calls', { calleeId, type });
      const callId = res.data.id;
      setCallState(prev => ({ ...prev, callId }));
      
      CallKeepService.setup();
      await setupMediaAndPC(type, true);
    } catch (error) {
      console.error('Initiate call error', error);
      cleanupCall();
    }
  };

  const acceptCallFromCallKeep = async (incoming: any) => {
    try {
      const { callId, from, type } = incoming;
      setCallState(prev => ({
        ...prev,
        status: 'CONNECTED',
        callId,
        remoteUserId: from,
        incomingCall: null,
      }));

      await setupMediaAndPC(type, false);
      socketService.emitCallAccept({ callId, to: from });
    } catch (error) {
      console.error('Accept call error', error);
      cleanupCall();
    }
  };

  const acceptCall = async () => {
    if (!callState.incomingCall) return;
    CallKeepService.setup();
    await acceptCallFromCallKeep(callState.incomingCall);
  };

  const declineCall = async () => {
    if (callState.incomingCall) {
      socketService.emitCallDecline({ callId: callState.incomingCall.callId, to: callState.incomingCall.from });
      setCallState(prev => ({ ...prev, incomingCall: null }));
    }
  };

  const endCall = async () => {
    if (callState.callId && callState.remoteUserId) {
      socketService.emitCallEnd({ callId: callState.callId, to: callState.remoteUserId });
    }
    cleanupCall();
  };

  const cleanupCall = () => {
    if (callState.localStream) {
      callState.localStream.getTracks().forEach(t => t.stop());
    }
    if (peerConnection) {
      peerConnection.close();
    }
    setPeerConnection(null);
    setCallState({
      status: 'IDLE',
      callId: null,
      remoteUserId: null,
      type: null,
      localStream: null,
      remoteStream: null,
      isMuted: false,
      isVideoEnabled: true,
      incomingCall: null,
    });
    CallKeepService.endAllCalls();
  };

  const toggleMute = () => {
    if (callState.localStream) {
      const audioTrack = callState.localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setCallState(prev => ({ ...prev, isMuted: !audioTrack.enabled }));
      }
    }
  };

  const toggleVideo = () => {
    if (callState.localStream) {
      const videoTrack = callState.localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setCallState(prev => ({ ...prev, isVideoEnabled: videoTrack.enabled }));
      }
    }
  };

  const switchCamera = () => {
    if (callState.localStream) {
      const videoTrack = callState.localStream.getVideoTracks()[0];
      if (videoTrack && typeof videoTrack._switchCamera === 'function') {
        videoTrack._switchCamera();
      }
    }
  };

  return (
    <CallContext.Provider value={{
      callState,
      initiateCall,
      acceptCall,
      declineCall,
      endCall,
      toggleMute,
      toggleVideo,
      switchCamera
    }}>
      {children}
    </CallContext.Provider>
  );
};
