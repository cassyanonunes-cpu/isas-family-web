import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, TextInput, ActivityIndicator } from 'react-native';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../../navigation/AppNavigator';
import api from '../../services/api';
import Avatar from '../../components/Shared/Avatar';
import { theme } from '../../theme/theme';
import { AuthContext } from '../../contexts/AuthContext';
import { Camera, Edit2, UserPlus, UserMinus } from 'lucide-react-native';

type GroupInfoRouteProp = RouteProp<RootStackParamList, 'GroupInfo'>;

export default function GroupInfoScreen() {
  const route = useRoute<GroupInfoRouteProp>();
  const navigation = useNavigation();
  const { conversationId } = route.params;
  const { user } = useContext(AuthContext);

  const [group, setGroup] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState('');

  useEffect(() => {
    loadGroupInfo();
  }, []);

  const loadGroupInfo = async () => {
    try {
      // Usar a rota getConversations para pegar a lista e achar
      const res = await api.get('/chat/conversations');
      const current = res.data.find((c: any) => c.id === conversationId);
      if (current) {
        setGroup(current);
        setNewName(current.name || '');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const myMembership = group?.members?.find((m: any) => m.userId === user?.id);
  const isAdmin = myMembership?.role === 'ADMIN';

  const handleSaveName = async () => {
    try {
      await api.put(`/chat/conversations/group/${conversationId}/profile`, { name: newName });
      setGroup({ ...group, name: newName });
      setEditingName(false);
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível alterar o nome.');
    }
  };

  const handleRemoveMember = (memberId: string) => {
    Alert.alert('Remover Membro', 'Tem certeza que deseja remover este membro do grupo?', [
      { text: 'Cancelar', style: 'cancel' },
      { 
        text: 'Remover', 
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/chat/conversations/group/${conversationId}/members/${memberId}`);
            loadGroupInfo();
          } catch (e) {
            Alert.alert('Erro', 'Não foi possível remover o membro.');
          }
        }
      }
    ]);
  };

  if (loading || !group) {
    return <View style={styles.centered}><ActivityIndicator color={theme.colors.primary} /></View>;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Avatar url={group.avatarUrl} name={group.name} size={80} />
        {isAdmin && (
          <TouchableOpacity style={styles.cameraIcon}>
            <Camera color="#FFF" size={16} />
          </TouchableOpacity>
        )}
        
        {editingName ? (
          <View style={styles.editNameRow}>
            <TextInput 
              style={styles.nameInput}
              value={newName}
              onChangeText={setNewName}
              autoFocus
            />
            <TouchableOpacity onPress={handleSaveName} style={styles.saveBtn}>
              <Text style={styles.saveBtnText}>Salvar</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.nameRow}>
            <Text style={styles.groupName}>{group.name}</Text>
            {isAdmin && (
              <TouchableOpacity onPress={() => setEditingName(true)}>
                <Edit2 color={theme.colors.primary} size={20} />
              </TouchableOpacity>
            )}
          </View>
        )}
        <Text style={styles.groupInfoText}>{group.members.length} membros</Text>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Participantes</Text>
          {isAdmin && (
            <TouchableOpacity style={styles.addBtn}>
              <UserPlus color={theme.colors.primary} size={20} />
              <Text style={styles.addBtnText}>Adicionar</Text>
            </TouchableOpacity>
          )}
        </View>

        <FlatList 
          data={group.members}
          keyExtractor={(item) => item.userId}
          renderItem={({ item }) => (
            <View style={styles.memberRow}>
              <Avatar url={item.user.avatarUrl} name={item.user.displayName} size={40} />
              <View style={styles.memberInfo}>
                <Text style={styles.memberName}>{item.user.displayName}</Text>
                <Text style={styles.memberRole}>{item.role === 'ADMIN' ? 'Admin' : 'Membro'}</Text>
              </View>
              {isAdmin && item.userId !== user?.id && (
                <TouchableOpacity onPress={() => handleRemoveMember(item.userId)}>
                  <UserMinus color="#FF4444" size={24} />
                </TouchableOpacity>
              )}
            </View>
          )}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E1E1E',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
  },
  header: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#2A2A2A',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  cameraIcon: {
    position: 'absolute',
    top: 80,
    right: '40%',
    backgroundColor: theme.colors.primary,
    padding: 6,
    borderRadius: 15,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 15,
    gap: 10,
  },
  editNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 15,
    gap: 10,
  },
  nameInput: {
    backgroundColor: '#1E1E1E',
    color: '#FFF',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
    width: 200,
  },
  saveBtn: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveBtnText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  groupName: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: 'bold',
  },
  groupInfoText: {
    color: '#AAA',
    fontSize: 14,
    marginTop: 5,
  },
  section: {
    flex: 1,
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  addBtnText: {
    color: theme.colors.primary,
    fontSize: 16,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    backgroundColor: '#2A2A2A',
    padding: 10,
    borderRadius: 10,
  },
  memberInfo: {
    flex: 1,
    marginLeft: 15,
  },
  memberName: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  memberRole: {
    color: '#AAA',
    fontSize: 12,
  }
});
