import React, { useState, useContext } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Platform, Alert } from 'react-native';
import { AuthContext } from '../../contexts/AuthContext';
import { theme } from '../../theme/theme';
import api from '../../services/api';
import { User } from 'lucide-react-native';

export default function LoginScreen() {
  const { signIn } = useContext(AuthContext);
  const [loadingName, setLoadingName] = useState<string | null>(null);

  const handleLogin = async (name: string) => {
    setLoadingName(name);
    try {
      const response = await api.post('/auth/name-login', {
        name,
        platform: Platform.OS,
        identifier: 'app-isas-family'
      });

      await signIn(response.data);
    } catch (error: any) {
      const msg = error.response?.data?.error || 'Erro ao conectar. Tente novamente.';
      Alert.alert('Erro no Acesso', msg);
      setLoadingName(null);
    }
  };

  const names = ['Cassyano', 'Isadora', 'Isabella'];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Isas Family</Text>
        <Text style={styles.subtitle}>Quem está acessando?</Text>
      </View>

      <View style={styles.form}>
        {names.map(name => (
          <TouchableOpacity 
            key={name}
            style={styles.button} 
            onPress={() => handleLogin(name)}
            disabled={loadingName !== null}
          >
            {loadingName === name ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <User color="#FFF" size={24} style={styles.icon} />
                <Text style={styles.buttonText}>{name}</Text>
              </>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    padding: theme.spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing.xxl,
  },
  title: {
    fontSize: theme.typography.sizes.xxl,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  subtitle: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.sm,
  },
  form: {
    width: '100%',
    gap: 15, // Apenas react-native-web e novas versões aceitam gap, mas vamos usar margin bottom no botão para segurança
  },
  button: {
    flexDirection: 'row',
    backgroundColor: theme.colors.primary,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16, // Fallback do gap
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  icon: {
    marginRight: 10,
  },
  buttonText: {
    color: '#FFF', // Força branco para contraste
    fontWeight: 'bold',
    fontSize: 20, // Maior para ser premium
  }
});
