import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { theme } from '../../theme/theme';

export default function SplashScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Isas Family</Text>
      <ActivityIndicator size="large" color={theme.colors.primary} style={styles.loader} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  title: {
    fontSize: theme.typography.sizes.xxl,
    fontWeight: 'bold',
    color: theme.colors.primary,
    letterSpacing: 1,
  },
  loader: {
    marginTop: theme.spacing.lg,
  }
});
