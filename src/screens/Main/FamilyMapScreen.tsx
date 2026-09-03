import React, { useEffect, useState, useRef, useContext } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert, TouchableOpacity, Platform } from 'react-native';
import * as Location from 'expo-location';

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
      <Text>Mapa indisponível na versão Web</Text>
    </View>
  );
  Marker = (props: any) => <View />;
}
import * as TaskManager from 'expo-task-manager';
import { AuthContext } from '../../contexts/AuthContext';
import api from '../../services/api';
import socketService from '../../services/socket';
import { theme } from '../../theme/theme';
import { LocateFixed } from 'lucide-react-native';

const LOCATION_TASK_NAME = 'background-location-task';

type FamilyLocation = {
  user: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
  };
  latitude: number;
  longitude: number;
  accuracy: number | null;
  batteryLevel: number | null;
  updatedAt: string;
};

// Define task de background se não estiver definida
if (!TaskManager.isTaskDefined(LOCATION_TASK_NAME)) {
  TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
    if (error) {
      console.error(error);
      return;
    }
    if (data) {
      const { locations } = data as any;
      const loc = locations[0];
      
      try {
        await api.post('/location', {
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
          accuracy: loc.coords.accuracy,
          batteryLevel: null // background fetch bateria depende de lib extra
        });
      } catch (err) {
        console.error('Falha no background location sync', err);
      }
    }
  });
}

export default function FamilyMapScreen() {
  const { user } = useContext(AuthContext);
  const mapRef = useRef<MapView>(null);
  
  const [locations, setLocations] = useState<Record<string, FamilyLocation>>({});
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Monitora foreground e envia a API periodicamente
  useEffect(() => {
    let foregroundSub: Location.LocationSubscription;

    const startTracking = async () => {
      try {
        const fgStatus = await Location.requestForegroundPermissionsAsync();
        if (fgStatus.status !== 'granted') {
          setErrorMsg('Permissão de localização negada.');
          setLoading(false);
          return;
        }

        // Busca dados iniciais da família
        const res = await api.get('/location');
        const locMap: Record<string, FamilyLocation> = {};
        res.data.locations.forEach((l: any) => {
          locMap[l.user.id] = l;
        });
        setLocations(locMap);
        setLoading(false);

        // Somente quem compartilha reporta.
        if (user?.isSharingLocation) {
          foregroundSub = await Location.watchPositionAsync(
            {
              accuracy: Location.Accuracy.Balanced,
              distanceInterval: 10, // Atualiza a cada 10 metros
              timeInterval: 10000 // ou a cada 10 seg
            },
            (loc) => {
              api.post('/location', {
                latitude: loc.coords.latitude,
                longitude: loc.coords.longitude,
                accuracy: loc.coords.accuracy,
                batteryLevel: null
              }).catch(e => console.error(e));
            }
          );

          // Tenta ativar background
          const bgStatus = await Location.requestBackgroundPermissionsAsync();
          if (bgStatus.status === 'granted') {
            await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
              accuracy: Location.Accuracy.Balanced,
              timeInterval: 3 * 60 * 1000, // 3 min
              distanceInterval: 100, // 100 metros
              foregroundService: {
                notificationTitle: "Isas Family",
                notificationBody: "Compartilhando sua localização com a família.",
                notificationColor: theme.colors.primary,
              },
            });
          }
        }

        // Ouve atualizações de outros membros via Socket
        socketService.onLocationUpdated((data) => {
          setLocations(prev => ({
            ...prev,
            [data.userId]: {
              user: prev[data.userId]?.user || { id: data.userId, displayName: 'Membro' },
              ...data
            }
          }));
        });
      } catch (err) {
        console.error(err);
        setErrorMsg('Erro ao iniciar mapa.');
        setLoading(false);
      }
    };

    startTracking();

    return () => {
      if (foregroundSub) {
        foregroundSub.remove();
      }
      Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME).catch(() => {});
      socketService.offLocationUpdated();
    };
  }, [user?.isSharingLocation]);

  const centerOnMe = async () => {
    const loc = await Location.getLastKnownPositionAsync();
    if (loc && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01
      });
    }
  };

  const getTimeAgo = (dateStr: string) => {
    const diff = Math.floor((new Date().getTime() - new Date(dateStr).getTime()) / 60000);
    if (diff < 1) return 'Agora';
    if (diff < 60) return `${diff} min atrás`;
    return `${Math.floor(diff/60)}h atrás`;
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (errorMsg) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{errorMsg}</Text>
      </View>
    );
  }

  const locationsList = Object.values(locations);

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_DEFAULT}
        initialRegion={locationsList.length > 0 ? {
          latitude: locationsList[0].latitude,
          longitude: locationsList[0].longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05
        } : undefined}
        showsUserLocation={user?.isSharingLocation}
        showsMyLocationButton={false}
      >
        {locationsList.map((loc) => {
          if (loc.user.id === user?.id) return null; // Não desenha pino próprio, showsUserLocation cuida disso

          const isOld = (new Date().getTime() - new Date(loc.updatedAt).getTime()) > 30 * 60000;

          return (
            <Marker
              key={loc.user.id}
              coordinate={{ latitude: loc.latitude, longitude: loc.longitude }}
              title={loc.user.displayName}
              description={`Última atualização: ${getTimeAgo(loc.updatedAt)}`}
            >
              <View style={[styles.avatarMarker, isOld && styles.avatarMarkerOld]}>
                <Text style={styles.avatarText}>{loc.user.displayName.charAt(0).toUpperCase()}</Text>
              </View>
            </Marker>
          );
        })}
      </MapView>

      <TouchableOpacity style={styles.centerButton} onPress={centerOnMe}>
        <LocateFixed color={theme.colors.primary} size={24} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { color: theme.colors.error, fontSize: theme.typography.sizes.md },
  map: { width: '100%', height: '100%' },
  avatarMarker: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  avatarMarkerOld: {
    backgroundColor: theme.colors.textSecondary, // Cinza se for antigo
  },
  avatarText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  centerButton: {
    position: 'absolute',
    bottom: theme.spacing.xl,
    right: theme.spacing.lg,
    backgroundColor: '#FFF',
    padding: theme.spacing.md,
    borderRadius: 30,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
  }
});
