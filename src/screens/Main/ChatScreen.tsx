import React, { useEffect, useState, useRef, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { Send, Paperclip, Mic, Phone, Video, ArrowDown } from 'lucide-react-native';
import { RootStackParamList } from '../../navigation/AppNavigator';
import api, { API_URL } from '../../services/api';
import socketService from '../../services/socket';
import { ThemeContext } from '../../contexts/ThemeContext';
import { AuthContext } from '../../contexts/AuthContext';
import { CallContext } from '../../contexts/CallContext';
import * as Crypto from 'expo-crypto';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { Audio } from 'expo-av';
import ImageAttachment from '../../components/Chat/ImageAttachment';
import VideoAttachment from '../../components/Chat/VideoAttachment';
import AudioAttachment from '../../components/Chat/AudioAttachment';
import DocumentAttachment from '../../components/Chat/DocumentAttachment';

type ChatRouteProp = RouteProp<RootStackParamList, 'Chat'>;

export type Message = {
  id: string;
  content: string;
  senderId: string;
  clientMessageId?: string;
  createdAt: string;
  status?: string;
  type?: string;
  attachment?: any;
  receipts?: { userId: string, status: string }[];
};

export default function ChatScreen() {
  const route = useRoute<ChatRouteProp>();
  const { conversationId } = route.params;
  const { user } = useContext(AuthContext);
  const { colors } = useContext(ThemeContext);
  const { initiateCall } = useContext(CallContext);
  const navigation = useNavigation();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const recordingTimer = useRef<any>(null);

  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [remotePresence, setRemotePresence] = useState<{ isOnline: boolean, lastSeen?: string }>({ isOnline: false });
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);

  const flatListRef = useRef<FlatList>(null);
  const typingTimeoutRef = useRef<any>(null);

  useEffect(() => {
    loadInitialMessages();
    markMessagesAsRead();
    
    socketService.joinConversation(conversationId);
    
    const handleNewMessage = (msg: Message) => {
      if (msg.senderId === user?.id) return;
      setMessages(prev => [msg, ...prev]);
      api.post(`/chat/conversations/${conversationId}/read`).catch(() => {});
    };

    const handleTyping = (data: { conversationId: string, userId: string }) => {
      if (data.conversationId === conversationId && data.userId !== user?.id) {
        setTypingUsers(prev => prev.includes(data.userId) ? prev : [...prev, data.userId]);
        setTimeout(() => {
          setTypingUsers(prev => prev.filter(id => id !== data.userId));
        }, 3000);
      }
    };

    const handleReadReceipt = (data: { conversationId: string, userId: string, messageIds: string[] }) => {
      if (data.conversationId === conversationId) {
        setMessages(prev => prev.map(m => {
          if (data.messageIds.includes(m.id)) {
            const receipts = m.receipts || [];
            if (!receipts.find(r => r.userId === data.userId)) {
              return { ...m, receipts: [...receipts, { userId: data.userId, status: 'READ' }] };
            }
          }
          return m;
        }));
      }
    };

    const handlePresence = (data: { userId: string, isOnline: boolean, lastSeen?: string }) => {
      // Idealmente precisaríamos saber quem é o target user para DMs
      // Por simplicidade, assume-se que foi mapeado.
      setRemotePresence({ isOnline: data.isOnline, lastSeen: data.lastSeen });
    };

    socketService.onNewMessage(handleNewMessage);
    socketService.onTyping(handleTyping);
    socketService.onReadReceipt(handleReadReceipt);
    socketService.onUserPresence(handlePresence);

    return () => {
      socketService.leaveConversation(conversationId);
      socketService.offNewMessage(handleNewMessage);
      socketService.offTyping(handleTyping);
      socketService.offReadReceipt(handleReadReceipt);
      socketService.offUserPresence(handlePresence);
    };
  }, [conversationId]);

  const markMessagesAsRead = async () => {
    try {
      await api.post(`/chat/conversations/${conversationId}/read`);
    } catch (e) {
      console.error(e);
    }
  };

  const loadInitialMessages = async () => {
    try {
      const res = await api.get(`/chat/conversations/${conversationId}/messages?limit=30`);
      setMessages(res.data.messages);
      
      const convRes = await api.get(`/chat/conversations`);
      const currentConv = convRes.data.find((c: any) => c.id === conversationId);
      
      if (currentConv) {
        if (currentConv.type === 'DIRECT') {
          const otherMember = currentConv.members.find((m: any) => m.userId !== user?.id);
          if (otherMember) {
            setRemotePresence({ isOnline: otherMember.user.isOnline, lastSeen: otherMember.user.lastSeen });
            
            navigation.setOptions({
              title: otherMember.user.displayName,
              headerRight: () => (
                <View style={{ flexDirection: 'row', gap: 15, marginRight: 10 }}>
                  <TouchableOpacity onPress={() => initiateCall(otherMember.userId, 'VOICE')}>
                    <Phone color={colors.primary} size={24} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => initiateCall(otherMember.userId, 'VIDEO')}>
                    <Video color={colors.primary} size={24} />
                  </TouchableOpacity>
                </View>
              )
            });
          }
        } else {
          navigation.setOptions({
            title: currentConv.name || 'Grupo',
          });
        }
      }

      setNextCursor(res.data.nextCursor);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const loadMoreMessages = async () => {
    if (!nextCursor || loadingMore) return;
    
    setLoadingMore(true);
    try {
      const res = await api.get(`/chat/conversations/${conversationId}/messages?limit=30&cursor=${nextCursor}`);
      setMessages(prev => [...prev, ...res.data.messages]);
      setNextCursor(res.data.nextCursor);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleInputTextChange = (text: string) => {
    setInputText(text);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    socketService.emitTyping(conversationId);
    typingTimeoutRef.current = setTimeout(() => {}, 1000); // debounce
  };

  const handleSend = async () => {
    if (!inputText.trim()) return;

    const content = inputText.trim();
    setInputText('');

    const clientMessageId = Crypto.randomUUID();
    
    const tempMessage: Message = {
      id: clientMessageId,
      clientMessageId,
      content,
      senderId: user!.id,
      createdAt: new Date().toISOString(),
      status: 'SENDING',
      type: 'TEXT'
    };

    setMessages(prev => [tempMessage, ...prev]);

    try {
      const res = await api.post(`/chat/conversations/${conversationId}/messages`, {
        content,
        clientMessageId
      });
      setMessages(prev => prev.map(m => m.clientMessageId === clientMessageId ? { ...res.data.message, status: 'SENT' } : m));
    } catch (error) {
      setMessages(prev => prev.map(m => m.clientMessageId === clientMessageId ? { ...m, status: 'FAILED' } : m));
    }
  };

  const startRecording = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status === 'granted') {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
        });
        const { recording } = await Audio.Recording.createAsync(
          Audio.RecordingOptionsPresets.HIGH_QUALITY
        );
        setRecording(recording);
        setIsRecording(true);
        setRecordingDuration(0);
        
        recordingTimer.current = setInterval(() => {
          setRecordingDuration(prev => prev + 1);
        }, 1000);
      }
    } catch (err) {
      console.error('Failed to start recording', err);
    }
  };

  const stopRecording = async (send: boolean) => {
    if (!recording) return;
    
    setIsRecording(false);
    if (recordingTimer.current) {
      clearInterval(recordingTimer.current);
    }

    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      
      if (send && uri) {
        const formData = new FormData();
        formData.append('type', 'AUDIO');
        formData.append('clientMessageId', Crypto.randomUUID());
        formData.append('duration', (recordingDuration * 1000).toString());
        formData.append('file', { uri, name: 'audio.m4a', type: 'audio/m4a' } as any);

        await api.post(`/chat/conversations/${conversationId}/messages/upload`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }
    } catch (error) {
      console.error(error);
    }
    setRecording(null);
  };

  const handleAttachment = async (type: 'image' | 'video' | 'document') => {
    let result: any = null;
    let uploadType = 'DOCUMENT';

    try {
      if (type === 'image' || type === 'video') {
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: type === 'image' ? ImagePicker.MediaTypeOptions.Images : ImagePicker.MediaTypeOptions.Videos,
          allowsEditing: false,
          quality: 0.7,
        });
        uploadType = type === 'image' ? 'IMAGE' : 'VIDEO';
      } else {
        result = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true });
        uploadType = 'DOCUMENT';
      }

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        
        const formData = new FormData();
        formData.append('type', uploadType);
        formData.append('clientMessageId', Crypto.randomUUID());
        if (asset.width) formData.append('width', asset.width.toString());
        if (asset.height) formData.append('height', asset.height.toString());
        if (asset.duration) formData.append('duration', asset.duration.toString());

        const fileName = asset.fileName || asset.name || 'file';
        const mimeType = asset.mimeType || 'application/octet-stream';
        
        formData.append('file', { uri: asset.uri, name: fileName, type: mimeType } as any);
        
        await api.post(`/chat/conversations/${conversationId}/messages/upload`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }
    } catch (e) {
      console.log('Error picking file', e);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isMyMessage = item.senderId === user?.id;
    const time = new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const hasRead = (item.receipts?.length || 0) > 0;
    
    return (
      <View style={[styles.messageBubble, isMyMessage ? { alignSelf: 'flex-end', backgroundColor: colors.myMessageBg, borderBottomRightRadius: 0 } : { alignSelf: 'flex-start', backgroundColor: colors.otherMessageBg, borderBottomLeftRadius: 0 }]}>
        {item.type === 'TEXT' ? null : item.type === 'IMAGE' && item.attachment ? (
          <ImageAttachment url={`${API_URL}/chat/attachments/${item.attachment.id}`} width={item.attachment.width} height={item.attachment.height} />
        ) : item.type === 'VIDEO' && item.attachment ? (
          <VideoAttachment url={`${API_URL}/chat/attachments/${item.attachment.id}`} />
        ) : item.type === 'DOCUMENT' && item.attachment ? (
          <DocumentAttachment url={`${API_URL}/chat/attachments/${item.attachment.id}`} originalName={item.attachment.originalName} size={item.attachment.size} />
        ) : item.type === 'AUDIO' && item.attachment ? (
          <AudioAttachment url={`${API_URL}/chat/attachments/${item.attachment.id}`} duration={item.attachment.duration} />
        ) : null}

        {!!item.content && (
          <Text style={[{ fontSize: 16 }, isMyMessage ? { color: colors.myMessageText } : { color: colors.otherMessageText }, { marginTop: item.type === 'TEXT' ? 0 : 4 }]}>
            {item.content}
          </Text>
        )}
        <View style={styles.timeRow}>
          <Text style={[styles.messageTime, isMyMessage ? { color: 'rgba(255,255,255,0.7)' } : { color: colors.textSecondary }]}>
            {time}
          </Text>
          {isMyMessage && (
            <Text style={[styles.readReceipt, hasRead ? { color: '#00BFFF' } : { color: 'rgba(255,255,255,0.7)' }]}>
              {item.status === 'SENDING' ? ' ⏳' : item.status === 'FAILED' ? ' ❌' : hasRead ? ' ✓✓' : ' ✓'}
            </Text>
          )}
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View style={[styles.presenceHeader, { backgroundColor: colors.surface }]}>
        <Text style={[styles.presenceText, { color: colors.textSecondary }]}>
          {typingUsers.length > 0 ? 'digitando...' : remotePresence.isOnline ? 'Online' : remotePresence.lastSeen ? `Visto por último: ${new Date(remotePresence.lastSeen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''}
        </Text>
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View>
      ) : (
        <>
          {messages.length === 0 ? (
            <View style={styles.center}>
              <Text style={{ color: colors.textSecondary, fontSize: 16 }}>Comece uma conversa com alguém da família.</Text>
            </View>
          ) : (
            <FlatList
              ref={flatListRef}
              data={messages}
              keyExtractor={item => item.id}
              renderItem={renderMessage}
              inverted
              contentContainerStyle={styles.messageList}
              onEndReached={loadMoreMessages}
              onEndReachedThreshold={0.5}
              onScroll={(e) => {
                if (e.nativeEvent.contentOffset.y > 100) setShowScrollToBottom(true);
                else setShowScrollToBottom(false);
              }}
              ListFooterComponent={loadingMore ? <ActivityIndicator color={colors.primary} /> : null}
            />
          )}

          {showScrollToBottom && (
            <TouchableOpacity style={styles.scrollToBottom} onPress={() => flatListRef.current?.scrollToOffset({ offset: 0, animated: true })}>
              <ArrowDown color="#FFF" size={20} />
            </TouchableOpacity>
          )}
        </>
      )}

      <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        {isRecording ? (
          <View style={styles.recordingContainer}>
            <Text style={styles.recordingText}>Gravando... {recordingDuration}s</Text>
            <TouchableOpacity style={styles.cancelRecordBtn} onPress={() => stopRecording(false)}>
              <Text style={styles.cancelRecordText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.sendRecordBtn} onPress={() => stopRecording(true)}>
              <Send color={colors.primary} size={24} />
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <TouchableOpacity style={styles.attachButton} onPress={() => handleAttachment('image')}>
              <Paperclip color={colors.textSecondary} size={24} />
            </TouchableOpacity>
            <TextInput
              style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text }]}
              placeholder="Digite uma mensagem..."
              placeholderTextColor={colors.textSecondary}
              value={inputText}
              onChangeText={handleInputTextChange}
              multiline
            />
            {inputText.trim() ? (
              <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
                <Send color={colors.primary} size={24} />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.sendButton} onLongPress={startRecording} delayLongPress={200}>
                <Mic color={colors.textSecondary} size={24} />
              </TouchableOpacity>
            )}
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  presenceHeader: {
    paddingVertical: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  presenceText: {
    fontSize: 12,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageList: {
    padding: 10,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 10,
    borderRadius: 15,
    marginBottom: 10,
  },
  timeRow: {
    flexDirection: 'row',
    alignSelf: 'flex-end',
    alignItems: 'center',
    marginTop: 4,
  },
  messageTime: {
    fontSize: 11,
  },
  readReceipt: {
    fontSize: 11,
    marginLeft: 4,
  },
  scrollToBottom: {
    position: 'absolute',
    bottom: 80,
    right: 20,
    backgroundColor: '#000',
    opacity: 0.7,
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 10,
    borderTopWidth: 1,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    maxHeight: 100,
    fontSize: 16,
  },
  attachButton: {
    padding: 5,
    marginRight: 5,
  },
  sendButton: {
    padding: 10,
    marginLeft: 5,
  },
  recordingContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
  },
  recordingText: {
    color: '#FF4444',
    fontWeight: 'bold',
    flex: 1,
  },
  cancelRecordBtn: {
    padding: 10,
    marginRight: 10,
  },
  cancelRecordText: {
    color: '#888',
  },
  sendRecordBtn: {
    padding: 10,
  }
});
