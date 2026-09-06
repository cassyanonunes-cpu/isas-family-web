import React, { useContext, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, SafeAreaView, Platform } from 'react-native';
import { CallContext } from '../../contexts/CallContext';

let RTCView: any;
if (Platform.OS === 'web') {
  RTCView = (props: any) => {
    const videoRef = React.useRef<HTMLVideoElement>(null);
    React.useEffect(() => {
      if (videoRef.current && props.streamURL) {
        // Na Web, streamURL é na verdade o objeto MediaStream nativo passado pelo CallContext
        try {
          videoRef.current.srcObject = props.streamURL;
        } catch (error) {
          console.error("Erro ao definir srcObject no vídeo Web", error);
        }
      }
    }, [props.streamURL]);
    return <video ref={videoRef} autoPlay playsInline style={props.style as any} muted={props.muted} />;
  };
} else {
  RTCView = require('react-native-webrtc').RTCView;
}

import { PhoneOff, MicOff, Mic, Camera, CameraOff, FlipHorizontal } from 'lucide-react-native';
import { theme } from '../../theme/theme';
import { useNavigation } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');

export default function CallScreen() {
  const { callState, endCall, toggleMute, toggleVideo, switchCamera, acceptCall, declineCall } = useContext(CallContext);
  const navigation = useNavigation();

  useEffect(() => {
    // Se a chamada acabou, pode fechar ou tratar navegação.
    // Aqui usamos apenas sobreposição global se necessário, mas como tela, se ficar IDLE deve voltar.
  }, [callState.status]);

  if (callState.status === 'IDLE' && !callState.incomingCall) {
    return null; // ou voltar
  }

  const renderCalling = () => (
    <View style={styles.centerContainer}>
      <Text style={styles.title}>Ligando...</Text>
      <TouchableOpacity style={[styles.roundButton, styles.endButton]} onPress={endCall}>
        <PhoneOff color="white" size={32} />
      </TouchableOpacity>
    </View>
  );

  const renderRinging = () => (
    <View style={styles.centerContainer}>
      <Text style={styles.title}>Chamada Recebida</Text>
      <Text style={styles.subtitle}>{callState.incomingCall?.type === 'VIDEO' ? '📹 Vídeo' : '📞 Voz'}</Text>
      <View style={styles.actionRow}>
        <TouchableOpacity style={[styles.roundButton, styles.endButton]} onPress={declineCall}>
          <PhoneOff color="white" size={32} />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.roundButton, styles.acceptButton]} onPress={acceptCall}>
          <PhoneOff color="white" size={32} style={{ transform: [{ rotate: '135deg' }] }} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderConnected = () => {
    const isVideo = callState.type === 'VIDEO';
    return (
      <View style={styles.flexContainer}>
        {isVideo && callState.remoteStream && (
          <RTCView
            streamURL={Platform.OS === 'web' ? callState.remoteStream : (callState.remoteStream as any).toURL()}
            style={styles.remoteVideo}
            objectFit="cover"
          />
        )}
        
        {isVideo && callState.localStream && (
          <RTCView
            streamURL={Platform.OS === 'web' ? callState.localStream : (callState.localStream as any).toURL()}
            style={styles.localVideo}
            objectFit="cover"
            muted={true}
          />
        )}

        {!isVideo && (
          <View style={styles.centerContainer}>
            <Text style={styles.title}>Chamada de Voz em Andamento</Text>
          </View>
        )}

        <View style={styles.controlsContainer}>
          <TouchableOpacity style={[styles.roundButton, styles.controlButton, callState.isMuted && styles.controlActive]} onPress={toggleMute}>
            {callState.isMuted ? <MicOff color="white" size={24} /> : <Mic color="white" size={24} />}
          </TouchableOpacity>

          {isVideo && (
            <TouchableOpacity style={[styles.roundButton, styles.controlButton, !callState.isVideoEnabled && styles.controlActive]} onPress={toggleVideo}>
              {!callState.isVideoEnabled ? <CameraOff color="white" size={24} /> : <Camera color="white" size={24} />}
            </TouchableOpacity>
          )}

          {isVideo && (
            <TouchableOpacity style={[styles.roundButton, styles.controlButton]} onPress={switchCamera}>
              <FlipHorizontal color="white" size={24} />
            </TouchableOpacity>
          )}

          <TouchableOpacity style={[styles.roundButton, styles.endButton]} onPress={endCall}>
            <PhoneOff color="white" size={24} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {callState.status === 'CALLING' && renderCalling()}
      {callState.incomingCall && renderRinging()}
      {callState.status === 'CONNECTED' && renderConnected()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0, bottom: 0, left: 0, right: 0,
    backgroundColor: '#1E1E1E',
    zIndex: 9999,
  },
  flexContainer: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    color: 'white',
    fontWeight: 'bold',
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 18,
    color: '#CCC',
    marginBottom: 40,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 40,
  },
  roundButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
  },
  endButton: {
    backgroundColor: theme.colors.error,
  },
  acceptButton: {
    backgroundColor: '#4CAF50', // Verde vibrante
  },
  controlButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  controlActive: {
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  controlsContainer: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
  },
  remoteVideo: {
    width: width,
    height: height,
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 0,
  },
  localVideo: {
    width: 100,
    height: 150,
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 1,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#000',
  }
});
