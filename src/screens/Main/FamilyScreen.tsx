import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, Share, Platform } from 'react-native';
import api from '../../services/api';
import { theme } from '../../theme/theme';

type Member = {
  id: string;
  name: string;
  displayName: string;
  role: string;
  email: string;
};

type Location = {
  id: string;
  userId: string;
  latitude: number;
  longitude: number;
  updatedAt: string;
  user: {
    displayName: string;
  }
};

export default function FamilyScreen() {
  const [members, setMembers] = useState<Member[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const resMembers = await api.get('/family/members');
      setMembers(resMembers.data.members);
      
      const resLocations = await api.get('/locations');
      setLocations(resLocations.data.locations);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const renderMiniMap = () => {
    if (Platform.OS !== 'web' || locations.length === 0) return null;
    
    // Calcula o centro do mapa com base na primeira localização disponível
    const centerLat = locations[0].latitude;
    const centerLng = locations[0].longitude;
    
    // Constrói os marcadores para o OSM
    // Formato: marker=lat,lon&marker=lat2,lon2
    const markers = locations.map(l => `marker=${l.latitude},${l.longitude}`).join('&');

    return (
      <View style={styles.mapContainer}>
        <Text style={styles.mapTitle}>Localização da Família</Text>
        <iframe
          width="100%"
          height="200"
          frameBorder="0"
          scrolling="no"
          src={`https://www.openstreetmap.org/export/embed.html?bbox=${centerLng-0.05}%2C${centerLat-0.05}%2C${centerLng+0.05}%2C${centerLat+0.05}&layer=mapnik&${markers}`}
          style={{ borderRadius: 12, marginTop: 10, border: '1px solid #333' }}
        />
      </View>
    );
  };

  const renderItem = ({ item }: { item: Member }) => (
    <View style={styles.memberItem}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{item.displayName.charAt(0).toUpperCase()}</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.memberName}>{item.displayName}</Text>
        <Text style={styles.memberEmail}>{item.email}</Text>
      </View>
      <View style={styles.roleBadge}>
        <Text style={styles.roleText}>{item.role}</Text>
      </View>
    </View>
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
          ListHeaderComponent={
            <View>
              <View style={styles.headerContainer}>
                <Text style={styles.headerTitle}>Membros da Família</Text>
                <TouchableOpacity style={styles.inviteButton} onPress={async () => {
                  try {
                    const res = await api.post('/invitations');
                    const code = res.data.invitation.code;
                    
                    try {
                      await Share.share({
                        message: `Junte-se à minha família no app Isas Family!\nUse o código de convite: ${code}`,
                        title: 'Convite para Isas Family'
                      });
                    } catch (shareError) {
                      prompt('Convite gerado! Copie o código abaixo:', code);
                    }
                  } catch (e: any) {
                    alert(e.response?.data?.error || 'Erro ao gerar convite');
                  }
                }}>
                  <Text style={styles.inviteButtonText}>+ Novo Convite</Text>
                </TouchableOpacity>
              </View>
              {renderMiniMap()}
            </View>
          }
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
  mapContainer: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.border.radius.lg,
    marginBottom: theme.spacing.md,
    elevation: 2,
  },
  mapTitle: {
    fontSize: theme.typography.sizes.md,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  headerTitle: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  inviteButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.border.radius.md,
  },
  inviteButtonText: {
    color: theme.colors.surface,
    fontWeight: 'bold',
    fontSize: theme.typography.sizes.sm,
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
    elevation: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.avatarBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  avatarText: {
    color: theme.colors.avatarText,
    fontWeight: 'bold',
    fontSize: theme.typography.sizes.lg,
  },
  info: {
    flex: 1,
  },
  memberName: {
    fontSize: theme.typography.sizes.md,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  memberEmail: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  roleBadge: {
    backgroundColor: theme.colors.border,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: theme.colors.textSecondary,
  }
});
