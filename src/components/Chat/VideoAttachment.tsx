import React, { useState } from 'react';
import { View, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { theme } from '../../theme/theme';
import { Play } from 'lucide-react-native';

interface VideoAttachmentProps {
  url: string;
}

export default function VideoAttachment({ url }: VideoAttachmentProps) {
  const video = React.useRef<Video>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <View style={styles.container}>
      <Video
        ref={video}
        style={styles.video}
        source={{ uri: url }}
        useNativeControls
        resizeMode={ResizeMode.CONTAIN}
        isLooping={false}
        onPlaybackStatusUpdate={status => {
          if (status.isLoaded) {
            setIsPlaying(status.isPlaying);
          }
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: theme.border.radius.sm,
    overflow: 'hidden',
    backgroundColor: 'black',
    width: 250,
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
  },
  video: {
    width: '100%',
    height: '100%',
  }
});
