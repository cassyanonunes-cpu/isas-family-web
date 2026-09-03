import React, { useState } from 'react';
import { View, Image, TouchableOpacity, Modal, StyleSheet, Dimensions } from 'react-native';
import { theme } from '../../theme/theme';

interface ImageAttachmentProps {
  url: string;
  width?: number;
  height?: number;
}

export default function ImageAttachment({ url, width, height }: ImageAttachmentProps) {
  const [modalVisible, setModalVisible] = useState(false);

  // Calcula tamanho proporcional
  const aspect = width && height ? width / height : 1;
  const renderWidth = 200;
  const renderHeight = renderWidth / aspect;

  return (
    <View>
      <TouchableOpacity onPress={() => setModalVisible(true)}>
        <Image 
          source={{ uri: url }} 
          style={[styles.thumbnail, { width: renderWidth, height: renderHeight }]} 
          resizeMode="cover"
        />
      </TouchableOpacity>

      <Modal visible={modalVisible} transparent={true} animationType="fade">
        <View style={styles.modalContainer}>
          <TouchableOpacity 
            style={styles.closeArea} 
            onPress={() => setModalVisible(false)} 
            activeOpacity={1}
          >
            <Image 
              source={{ uri: url }} 
              style={styles.fullImage} 
              resizeMode="contain" 
            />
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  thumbnail: {
    borderRadius: theme.border.radius.sm,
    backgroundColor: theme.colors.surface,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeArea: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullImage: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  }
});
