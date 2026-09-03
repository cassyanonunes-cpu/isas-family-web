import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { theme } from '../../theme/theme';
import api from '../../services/api';
import { Phone, Video, PhoneOff, PhoneMissed } from 'lucide-react-native';

type CallHistory = {
  id: string;
  type: string;
  status: string;
  createdAt: string;
  caller: { id: string, name: string, displayName: string };
  callee: { id: string, name: string, displayName: string };
  callerId: string;
  calleeId: string;
};

export default function CallsListScreen() {
  const [calls, setCalls] = useState<CallHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCalls();
  }, []);

  const loadCalls = async () => {
    try {
      setLoading(true);
      const res = await api.get('/calls');
      setCalls(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string, type: string) => {
    if (status === 'MISSED') return <PhoneMissed color={theme.colors.error} size={20} />;
    if (status === 'DECLINED') return <PhoneOff color={theme.colors.error} size={20} />;
    if (type === 'VIDEO') return <Video color={theme.colors.primary} size={20} />;
    return <Phone color={theme.colors.primary} size={20} />;
  };

  const getStatusText = (status: string) => {
    const map: any = {
      MISSED: 'Não atendida',
      DECLINED: 'Recusada',
      ENDED: 'Encerrada',
      ANSWERED: 'Atendida',
      FAILED: 'Falhou',
      RINGING: 'Chamando'
    };
    return map[status] || status;
  };

  const renderItem = ({ item }: { item: CallHistory }) => {
    // Definir com quem foi a chamada
    // Se eu for o caller, foi com o callee
    // (A API poderia retornar quem é o outro, mas podemos deduzir na UI ou usar os dados do caller/callee)
    const otherUser = item.callee; // Simplificado para demonstração. O ideal seria verificar quem sou eu.

    const time = new Date(item.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' });

    return (
      <View style={styles.item}>
        <View style={styles.iconContainer}>
          {getStatusIcon(item.status, item.type)}
        </View>
        <View style={styles.infoContainer}>
          <Text style={styles.name}>{item.caller.displayName} → {item.callee.displayName}</Text>
          <Text style={styles.details}>{item.type === 'VIDEO' ? 'Vídeo' : 'Voz'} - {getStatusText(item.status)}</Text>
        </View>
        <Text style={styles.time}>{time}</Text>
      </View>
    );
  };

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color={theme.colors.primary} /></View>;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={calls}
        keyExtractor={i => i.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>Nenhuma chamada recente.</Text>}
        onRefresh={loadCalls}
        refreshing={loading}
      />
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
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.border.radius.md,
    marginBottom: theme.spacing.sm,
  },
  iconContainer: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoContainer: {
    flex: 1,
    marginLeft: theme.spacing.sm,
  },
  name: {
    fontSize: theme.typography.sizes.md,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  details: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  time: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textSecondary,
  },
  empty: {
    textAlign: 'center',
    marginTop: 40,
    color: theme.colors.textSecondary,
  }
});
