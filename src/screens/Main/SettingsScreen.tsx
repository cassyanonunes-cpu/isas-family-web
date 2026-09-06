import React, { useContext, useState } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, ScrollView, Alert, Platform } from 'react-native';
import { AuthContext } from '../../contexts/AuthContext';
import { ThemeContext, ThemePreference } from '../../contexts/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import api from '../../services/api';
import { ChevronRight, LogOut, Moon, Sun, Monitor, User, Bell, Shield, Info } from 'lucide-react-native';
import Avatar from '../../components/Shared/Avatar';

export default function SettingsScreen() {
  const { user, signOut } = useContext(AuthContext);
  const { themePreference, setThemePreference, colors } = useContext(ThemeContext);
  const navigation = useNavigation<any>();

  const [locationEnabled, setLocationEnabled] = useState(user?.isSharingLocation || false);
  const [notificationPreview, setNotificationPreview] = useState(user?.notificationPreview ?? true);

  const toggleLocation = async (value: boolean) => {
    setLocationEnabled(value);
    try {
      await api.post('/location/toggle', { enabled: value });
    } catch (e) {
      setLocationEnabled(!value);
      Alert.alert('Erro', 'Não foi possível alterar o compartilhamento de localização.');
    }
  };

  const toggleNotificationPreview = async (value: boolean) => {
    setNotificationPreview(value);
    try {
      await api.put('/users/me', { notificationPreview: value });
    } catch (e) {
      setNotificationPreview(!value);
      Alert.alert('Erro', 'Não foi possível salvar a preferência.');
    }
  };

  const renderThemeOption = (pref: ThemePreference, label: string, Icon: any) => (
    <TouchableOpacity 
      style={[
        styles.themeOption, 
        themePreference === pref && { borderColor: colors.primary, backgroundColor: colors.primary + '20' },
        { backgroundColor: colors.surface }
      ]}
      onPress={() => setThemePreference(pref)}
    >
      <Icon color={themePreference === pref ? colors.primary : colors.textSecondary} size={24} />
      <Text style={[styles.themeOptionText, { color: colors.text }]}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      
      {/* MEU PERFIL */}
      <TouchableOpacity 
        style={[styles.profileHeader, { backgroundColor: colors.surface }]}
        onPress={() => navigation.navigate('Profile')}
      >
        <Avatar url={user?.avatarUrl} name={user?.displayName} size={60} />
        <View style={styles.profileInfo}>
          <Text style={[styles.profileName, { color: colors.text }]}>{user?.displayName}</Text>
          <Text style={[styles.profileStatus, { color: colors.textSecondary }]}>{user?.status || 'Sem status'}</Text>
        </View>
        <ChevronRight color={colors.textSecondary} size={24} />
      </TouchableOpacity>

      {/* PRIVACIDADE */}
      <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Privacidade</Text>
      <View style={[styles.sectionContent, { backgroundColor: colors.surface }]}>
        <View style={styles.row}>
          <View style={styles.rowLeft}>
            <Shield color={colors.text} size={20} />
            <Text style={[styles.rowText, { color: colors.text }]}>Compartilhar Localização</Text>
          </View>
          <Switch 
            value={locationEnabled} 
            onValueChange={toggleLocation} 
            trackColor={{ false: '#767577', true: colors.primary }}
          />
        </View>
      </View>

      {/* NOTIFICAÇÕES */}
      <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Notificações</Text>
      <View style={[styles.sectionContent, { backgroundColor: colors.surface }]}>
        <View style={styles.row}>
          <View style={styles.rowLeft}>
            <Bell color={colors.text} size={20} />
            <View>
              <Text style={[styles.rowText, { color: colors.text }]}>Mostrar conteúdo</Text>
              <Text style={[styles.subText, { color: colors.textSecondary }]}>
                {notificationPreview ? 'Exibe o texto da mensagem no push.' : 'Exibe apenas "Nova mensagem".'}
              </Text>
            </View>
          </View>
          <Switch 
            value={notificationPreview} 
            onValueChange={toggleNotificationPreview} 
            trackColor={{ false: '#767577', true: colors.primary }}
          />
        </View>
      </View>

      {/* APARÊNCIA */}
      <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Temas Disponíveis</Text>
      <View style={[styles.themeContainer, { backgroundColor: colors.background }]}>
        {renderThemeOption('INDIGO', 'Índigo', Monitor)}
        {renderThemeOption('PINK', 'Rosa', Sun)}
        {renderThemeOption('BLACK', 'Preto', Moon)}
      </View>

      {/* SOBRE */}
      <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Sobre</Text>
      <View style={[styles.sectionContent, { backgroundColor: colors.surface }]}>
        <View style={styles.row}>
          <View style={styles.rowLeft}>
            <Info color={colors.text} size={20} />
            <Text style={[styles.rowText, { color: colors.text }]}>Isas Family v1.0.0</Text>
          </View>
        </View>
      </View>

      {/* ATUALIZAÇÃO */}
      <TouchableOpacity 
        style={[styles.logoutBtn, { backgroundColor: colors.primary, marginTop: 10, marginBottom: 10 }]}
        onPress={async () => {
          if (Platform.OS === 'web') {
            try {
              if ('serviceWorker' in navigator) {
                const regs = await navigator.serviceWorker.getRegistrations();
                for (let reg of regs) {
                  await reg.unregister();
                }
              }
              const keys = await caches.keys();
              for (let key of keys) {
                await caches.delete(key);
              }
              window.location.reload(true as any);
            } catch (e) {
              window.location.reload();
            }
          } else {
            Alert.alert('Pronto', 'O aplicativo nativo se atualiza automaticamente ao reiniciar.');
          }
        }}
      >
        <Text style={[styles.logoutText, { color: '#FFF' }]}>Buscar Atualizações Agora</Text>
      </TouchableOpacity>

      {/* SESSÃO */}
      <TouchableOpacity 
        style={[styles.logoutBtn, { backgroundColor: colors.surface }]}
        onPress={() => {
          if (Platform.OS === 'web') {
            if (window.confirm('Tem certeza que deseja sair?')) {
              signOut();
            }
          } else {
            Alert.alert('Sair', 'Tem certeza que deseja sair?', [
              { text: 'Cancelar', style: 'cancel' },
              { text: 'Sair', style: 'destructive', onPress: signOut }
            ]);
          }
        }}
      >
        <LogOut color={colors.error} size={20} />
        <Text style={[styles.logoutText, { color: colors.error }]}>Sair da conta</Text>
      </TouchableOpacity>
      
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    marginBottom: 20,
  },
  profileInfo: {
    flex: 1,
    marginLeft: 15,
  },
  profileName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  profileStatus: {
    fontSize: 14,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginLeft: 20,
    marginBottom: 10,
    marginTop: 10,
  },
  sectionContent: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginBottom: 15,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  rowText: {
    fontSize: 16,
    marginLeft: 15,
  },
  subText: {
    fontSize: 12,
    marginLeft: 15,
    marginTop: 2,
  },
  themeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  themeOption: {
    flex: 1,
    alignItems: 'center',
    padding: 15,
    borderRadius: 10,
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  themeOptionText: {
    marginTop: 10,
    fontSize: 14,
    fontWeight: '600',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    marginTop: 20,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  }
});
