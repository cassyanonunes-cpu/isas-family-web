import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../../navigation/AppNavigator';
import api from '../../services/api';
import Avatar from '../../components/Shared/Avatar';
import { ThemeContext } from '../../contexts/ThemeContext';
import { AuthContext } from '../../contexts/AuthContext';
import { CallContext } from '../../contexts/CallContext';
import { MessageSquare, Phone, Video, MapPin } from 'lucide-react-native';

type MemberProfileRouteProp = RouteProp<RootStackParamList, 'MemberProfile'>;

export default function MemberProfileScreen() {
  const route = useRoute<MemberProfileRouteProp>();
  const navigation = useNavigation<any>();
  const { userId } = route.params;
  const { colors } = useContext(ThemeContext);
  const { user } = useContext(AuthContext);
  const { initiateCall } = useContext(CallContext);

  const [member, setMember] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Buscar membros da família para achar o perfil
    // Para simplificar, vou usar o getFamily (assumindo que o back o tenha ou eu possa simular)
    // Opcionalmente podemos criar um endpoint GET /users/:id
    loadMemberProfile();
  }, []);

  const loadMemberProfile = async () => {
    try {
      // Como não criamos GET /users/:id ainda, podemos varrer as conversas ou criar uma listagem de família 
      // Por simplicidade, assumirei a existência de um GET /family/members 
      // (caso não exista, simularemos por enquanto até o backend ter isso pronto)
      
      const res = await api.get('/family'); // endpoint genérico da família
      const familyUser = res.data.users?.find((u: any) => u.id === userId);
      
      if (familyUser) {
        setMember(familyUser);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleMessage = async () => {
    try {
      const res = await api.post('/chat/conversations/direct', { targetUserId: userId });
      navigation.navigate('Chat', { conversationId: res.data.conversation.id });
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return <View style={[styles.centered, { backgroundColor: colors.background }]}><ActivityIndicator color={colors.primary} /></View>;
  }

  if (!member) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.textSecondary }}>Familiar não encontrado.</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Avatar url={member.avatarUrl} name={member.displayName} size={100} />
        <Text style={[styles.name, { color: colors.text }]}>{member.displayName}</Text>
        <Text style={[styles.status, { color: colors.textSecondary }]}>{member.status || 'Disponível'}</Text>
      </View>

      <View style={styles.actionsContainer}>
        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.surface }]} onPress={handleMessage}>
          <MessageSquare color={colors.primary} size={24} />
          <Text style={[styles.actionText, { color: colors.text }]}>Mensagem</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.surface }]} onPress={() => initiateCall(userId, 'VOICE')}>
          <Phone color={colors.primary} size={24} />
          <Text style={[styles.actionText, { color: colors.text }]}>Ligar</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.surface }]} onPress={() => initiateCall(userId, 'VIDEO')}>
          <Video color={colors.primary} size={24} />
          <Text style={[styles.actionText, { color: colors.text }]}>Vídeo</Text>
        </TouchableOpacity>

        {member.isSharingLocation && (
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.surface }]} onPress={() => navigation.navigate('Map')}>
            <MapPin color={colors.primary} size={24} />
            <Text style={[styles.actionText, { color: colors.text }]}>Mapa</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    padding: 30,
    borderBottomWidth: 1,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 15,
  },
  status: {
    fontSize: 16,
    marginTop: 5,
  },
  actionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    padding: 20,
    gap: 15,
  },
  actionBtn: {
    width: '45%',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    borderRadius: 15,
    marginBottom: 10,
  },
  actionText: {
    marginTop: 10,
    fontWeight: '600',
  }
});
