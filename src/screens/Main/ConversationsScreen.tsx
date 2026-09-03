import React, { useEffect, useState, useCallback, useContext } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, Platform } from 'react-native';

let MapView: any = View;
let Marker: any = View;
let PROVIDER_DEFAULT: any = null;

if (Platform.OS !== 'web') {
  const maps = require('react-native-maps');
  MapView = maps.default;
  Marker = maps.Marker;
  PROVIDER_DEFAULT = maps.PROVIDER_DEFAULT;
} else {
  MapView = (props: any) => (
    <View style={props.style || { flex: 1, backgroundColor: '#e0e0e0', justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontSize: 10, textAlign: 'center' }}>Mapa indisponível na Web</Text>
    </View>
  );
  Marker = (props: any) => <View />;
}

import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Plus, User, MapPin, MessageCircle } from 'lucide-react-native';
import api from '../../services/api';
import socketService from '../../services/socket';
import { ThemeContext } from '../../contexts/ThemeContext';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Avatar from '../../components/Shared/Avatar';

type Conversation = {
  id: string;
  type: string;
  name: string;
  lastMessage: { content: string; createdAt: string } | null;
  updatedAt: string;
  unreadCount?: number;
  avatarUrl?: string; // para grupos, ou do user para direct
  members: any[];
};

type NavProp = NativeStackNavigationProp<RootStackParamList, 'Main'>;

export default function ConversationsScreen() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [familyLocations, setFamilyLocations] = useState<any[]>([]);
  
  const navigation = useNavigation<NavProp>();
  const { colors } = useContext(ThemeContext);

  const loadConversations = async () => {
    try {
      const res = await api.get('/chat/conversations');
      setConversations(res.data.conversations);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadFamilyLocations = async () => {
    try {
      const res = await api.get('/location/family');
      setFamilyLocations(res.data.locations);
    } catch (e) {
      console.error(e);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadConversations();
      loadFamilyLocations();
    }, [])
  );

  useEffect(() => {
    const handleConversationUpdated = (data: any) => {
      loadConversations(); // recarrega p/ pegar badges
    };

    socketService.onConversationUpdated(handleConversationUpdated);

    return () => {
      socketService.offConversationUpdated(handleConversationUpdated);
    };
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadConversations();
    loadFamilyLocations();
  };

  const renderItem = ({ item }: { item: Conversation }) => {
    const time = item.lastMessage ? new Date(item.lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
    let avatarUrl = item.avatarUrl;
    
    if (item.type === 'DIRECT') {
      // Tentar pegar do first member que não é a gente (o backend deveria mandar mas podemos deduzir)
      // Como o nome já vem tratado do backend, o avatar não vem diretamente no topo do obj, mas no array members.
      // O backend agora envia members.
      const otherUser = item.members?.find((m: any) => m.user?.displayName === item.name);
      if (otherUser) avatarUrl = otherUser.user.avatarUrl;
    }

    return (
      <TouchableOpacity 
        style={[styles.chatItem, { backgroundColor: colors.surface, borderBottomColor: colors.border }]} 
        onPress={() => navigation.navigate('Chat', { conversationId: item.id })}
      >
        <Avatar url={avatarUrl} name={item.name} size={50} />
        
        <View style={styles.chatInfo}>
          <View style={styles.chatHeader}>
            <Text style={[styles.chatName, { color: colors.text }]} numberOfLines={1}>{item.name}</Text>
            {!!time && <Text style={[styles.chatTime, { color: colors.textSecondary }]}>{time}</Text>}
          </View>
          
          <View style={styles.lastMessageRow}>
            <Text style={[styles.chatLastMessage, { color: colors.textSecondary, flex: 1 }]} numberOfLines={1}>
              {item.lastMessage?.content || 'Nova conversa'}
            </Text>
            
            {(item.unreadCount || 0) > 0 && (
              <View style={[styles.unreadBadge, { backgroundColor: colors.primary }]}>
                <Text style={styles.unreadBadgeText}>{item.unreadCount}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderMiniMap = () => {
    if (familyLocations.length === 0) return null;

    return (
      <TouchableOpacity activeOpacity={0.9} onPress={() => navigation.navigate('Map')}>
        <View style={[styles.miniMapContainer, { borderColor: colors.border }]}>
          <MapView
            style={styles.miniMap}
            provider={PROVIDER_DEFAULT}
            initialRegion={{
              latitude: familyLocations[0].latitude,
              longitude: familyLocations[0].longitude,
              latitudeDelta: 0.02,
              longitudeDelta: 0.02,
            }}
            pitchEnabled={false}
            rotateEnabled={false}
            zoomEnabled={false}
            scrollEnabled={false}
          >
            {familyLocations.map((loc, i) => (
              <Marker key={i} coordinate={{ latitude: loc.latitude, longitude: loc.longitude }}>
                <View style={[styles.miniAvatarMarker, { borderColor: colors.primary }]} />
              </Marker>
            ))}
          </MapView>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {loading ? (
        <View style={styles.center}><Text style={{ color: colors.textSecondary }}>Carregando...</Text></View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListHeaderComponent={renderMiniMap}
          ListEmptyComponent={
            <View style={styles.center}>
              <MessageCircle size={48} color={colors.border} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Nenhuma conversa iniciada</Text>
            </View>
          }
        />
      )}
      
      <TouchableOpacity 
        style={[styles.fab, { backgroundColor: colors.primary }]} 
        onPress={() => navigation.navigate('NewConversation')}
      >
        <Plus color="#FFF" size={24} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 50,
  },
  emptyText: {
    marginTop: 15,
    fontSize: 16,
  },
  chatItem: {
    flexDirection: 'row',
    padding: 15,
    borderBottomWidth: 1,
  },
  chatInfo: {
    flex: 1,
    justifyContent: 'center',
    marginLeft: 15,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  chatName: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
  },
  chatTime: {
    fontSize: 12,
  },
  lastMessageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chatLastMessage: {
    fontSize: 14,
  },
  unreadBadge: {
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    marginLeft: 10,
  },
  unreadBadgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  fab: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    right: 20,
    bottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 5,
  },
  miniMapContainer: {
    height: 120,
    margin: 15,
    borderRadius: 15,
    overflow: 'hidden',
    borderWidth: 1,
  },
  miniMap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  miniAvatarMarker: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFF',
    borderWidth: 3,
  }
});
