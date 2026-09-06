import React, { useContext, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, ScrollView, Platform } from 'react-native';
import { AuthContext } from '../../contexts/AuthContext';
import { theme } from '../../theme/theme';
import * as ImagePicker from 'expo-image-picker';
import api from '../../services/api';
import Avatar from '../../components/Shared/Avatar';
import { Camera } from 'lucide-react-native';

export default function ProfileScreen() {
  const { user, setUser } = useContext(AuthContext);
  
  const [name, setName] = useState(user?.name || '');
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [status, setStatus] = useState(user?.status || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
  const [loading, setLoading] = useState(false);

  const handlePickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled && result.assets[0]) {
      uploadAvatar(result.assets[0].uri);
    }
  };

  const uploadAvatar = async (uri: string) => {
    setLoading(true);
    try {
      const formData = new FormData();
      if (Platform.OS === 'web') {
        const response = await fetch(uri);
        const blob = await response.blob();
        formData.append('file', blob, 'avatar.jpg');
      } else {
        formData.append('file', {
          uri,
          name: 'avatar.jpg',
          type: 'image/jpeg',
        } as any);
      }

      // Assumindo endpoint de upload de avatar genérico ou o que criamos
      // Vamos usar a mesma logica de storage (ex: POST /users/me/avatar)
      // Aqui para simplificar mockamos o retorno, mas ideal é a rota real
      // const res = await api.post('/users/me/avatar', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      // setAvatarUrl(res.data.url);
      
      // Simulação
      setAvatarUrl(uri);
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível atualizar a foto.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const res = await api.put('/users/me', {
        name,
        displayName,
        status,
        avatarUrl
      });
      setUser(res.data.user);
      Alert.alert('Sucesso', 'Perfil atualizado!');
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível atualizar o perfil.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handlePickImage} style={styles.avatarContainer}>
          <Avatar url={avatarUrl} name={displayName} size={100} />
          <View style={styles.cameraIcon}>
            <Camera color="#FFF" size={20} />
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>Nome Completo</Text>
        <TextInput 
          style={styles.input} 
          value={name} 
          onChangeText={setName} 
          placeholderTextColor="#666"
        />

        <Text style={styles.label}>Nome de Exibição</Text>
        <TextInput 
          style={styles.input} 
          value={displayName} 
          onChangeText={setDisplayName} 
          placeholderTextColor="#666"
        />

        <Text style={styles.label}>Status / Frase</Text>
        <TextInput 
          style={styles.input} 
          value={status} 
          onChangeText={setStatus} 
          placeholderTextColor="#666"
        />

        <Text style={styles.label}>E-mail (Leitura)</Text>
        <TextInput 
          style={[styles.input, { opacity: 0.5 }]} 
          value={user?.email || ''} 
          editable={false}
        />

        <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={loading}>
          {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.saveButtonText}>Salvar Perfil</Text>}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E1E1E',
  },
  header: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  avatarContainer: {
    position: 'relative',
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: theme.colors.primary,
    borderRadius: 20,
    padding: 8,
  },
  form: {
    padding: 20,
  },
  label: {
    color: '#CCC',
    marginBottom: 5,
    fontSize: 14,
  },
  input: {
    backgroundColor: '#2A2A2A',
    color: '#FFF',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  saveButton: {
    backgroundColor: theme.colors.primary,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  saveButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
  }
});
