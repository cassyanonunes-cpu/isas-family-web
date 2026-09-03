import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import api from '../../services/api';
import { theme } from '../../theme/theme';
import { RootStackParamList } from '../../navigation/AppNavigator';

type Member = {
  id: string;
  name: string;
  displayName: string;
  role: string;
};

type NavProp = NativeStackNavigationProp<RootStackParamList, 'NewConversation'>;

export default function NewConversationScreen() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation<NavProp>();

  useEffect(() => {
    loadMembers();
  }, []);

  const loadMembers = async () => {
    try {
      // Usar a rota de listagem de membros (que já isola pelo familyId no backend)
      const res = await api.get('/family/members');
      setMembers(res.data.members);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const startChat = async (targetUserId: string) => {
    try {
      const res = await api.post('/chat/conversations/direct', { targetUserId });
      const conversation = res.data.conversation;
      
      navigation.replace('Chat', { 
        conversationId: conversation.id
      });
    } catch (error: any) {
      alert(error.response?.data?.error || 'Erro ao iniciar conversa');
    }
  };

  const renderItem = ({ item }: { item: Member }) => (
    <TouchableOpacity style={styles.memberItem} onPress={() => startChat(item.id)}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{item.displayName.charAt(0).toUpperCase()}</Text>
      </View>
      <View>
        <Text style={styles.memberName}>{item.displayName}</Text>
        <Text style={styles.memberRole}>{item.role === 'ADMIN' ? 'Administrador' : 'Membro'}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.center}><ActivityIndicator color={theme.colors.primary} size="large" /></View>
      ) : (
        <FlatList
          data={members}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    padding: theme.spacing.md,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.border.radius.md,
    marginBottom: theme.spacing.sm,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 2,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.avatarBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  avatarText: {
    color: theme.colors.avatarText,
    fontWeight: 'bold',
    fontSize: theme.typography.sizes.md,
  },
  memberName: {
    fontSize: theme.typography.sizes.md,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  memberRole: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
  }
});
