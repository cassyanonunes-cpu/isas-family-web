import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';

interface AvatarProps {
  url?: string;
  name?: string;
  size?: number;
}

export default function Avatar({ url, name = 'User', size = 50 }: AvatarProps) {
  const getInitials = (n: string) => {
    const parts = n.split(' ');
    if (parts.length > 1) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return n.substring(0, 2).toUpperCase();
  };

  return (
    <View style={[styles.container, { width: size, height: size, borderRadius: size / 2 }]}>
      {url ? (
        <Image source={{ uri: url }} style={{ width: size, height: size, borderRadius: size / 2 }} />
      ) : (
        <Text style={[styles.text, { fontSize: size * 0.4 }]}>{getInitials(name)}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#4F46E5', // default bg
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  text: {
    color: '#FFF',
    fontWeight: 'bold',
  }
});
