import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { FileText, Download } from 'lucide-react-native';
import { theme } from '../../theme/theme';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

interface DocumentAttachmentProps {
  url: string;
  originalName: string;
  size: number;
}

export default function DocumentAttachment({ url, originalName, size }: DocumentAttachmentProps) {
  const handleDownload = async () => {
    try {
      const downloadRes = await FileSystem.downloadAsync(
        url,
        (FileSystem as any).documentDirectory + originalName
      );
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(downloadRes.uri);
      } else {
        Alert.alert('Sucesso', 'Arquivo baixado: ' + downloadRes.uri);
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Erro', 'Não foi possível baixar o documento.');
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  };

  return (
    <TouchableOpacity style={styles.container} onPress={handleDownload}>
      <FileText color={theme.colors.text} size={32} />
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{originalName}</Text>
        <Text style={styles.size}>{formatSize(size)}</Text>
      </View>
      <Download color={theme.colors.primary} size={24} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: theme.border.radius.sm,
    width: 250,
  },
  info: {
    flex: 1,
    marginLeft: theme.spacing.sm,
    marginRight: theme.spacing.sm,
  },
  name: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.text,
    fontWeight: 'bold',
  },
  size: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    marginTop: 2,
  }
});
