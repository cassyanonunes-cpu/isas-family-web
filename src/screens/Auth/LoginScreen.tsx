import React, { useState, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { AuthContext } from '../../contexts/AuthContext';
import { theme } from '../../theme/theme';
import api from '../../services/api';

export default function LoginScreen() {
  const { signIn } = useContext(AuthContext);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!code || !name) {
      Alert.alert('Erro', 'Preencha todos os campos');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/auth/invite-login', {
        code: code.trim(),
        name: name.trim(),
        platform: 'NATIVE', // Identificador simples para a API
        identifier: 'app-mobile'
      });

      await signIn(response.data);
    } catch (error: any) {
      const msg = error.response?.data?.error || 'Erro de conexão ou convite inválido';
      Alert.alert('Falha ao Entrar', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Isas Family</Text>
        <Text style={styles.subtitle}>Insira o convite para acessar</Text>
      </View>

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Código de Convite"
          autoCapitalize="none"
          value={code}
          onChangeText={setCode}
        />
        <TextInput
          style={styles.input}
          placeholder="Seu Nome"
          value={name}
          onChangeText={setName}
        />

        <TouchableOpacity 
          style={styles.button} 
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.buttonText}>ENTRAR</Text>
          )}
        </TouchableOpacity>
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
  },
  input: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.border.radius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    fontSize: theme.typography.sizes.md,
  },
  button: {
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.md,
    borderRadius: theme.border.radius.md,
    alignItems: 'center',
    marginTop: theme.spacing.sm,
  },
  buttonText: {
    color: theme.colors.surface,
    fontWeight: 'bold',
    fontSize: theme.typography.sizes.md,
  }
});
