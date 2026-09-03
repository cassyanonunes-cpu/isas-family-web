import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Play, Pause } from 'lucide-react-native';
import { theme } from '../../theme/theme';
import { Audio } from 'expo-av';

interface AudioAttachmentProps {
  url: string;
  duration?: number;
}

export default function AudioAttachment({ url, duration }: AudioAttachmentProps) {
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1.0);

  useEffect(() => {
    return sound
      ? () => {
          sound.unloadAsync();
        }
      : undefined;
  }, [sound]);

  const togglePlayPause = async () => {
    if (sound) {
      if (isPlaying) {
        await sound.pauseAsync();
      } else {
        await sound.playAsync();
      }
      return;
    }

    try {
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: url },
        { shouldPlay: true, rate: speed, shouldCorrectPitch: true },
        (status) => {
          if (status.isLoaded) {
            setIsPlaying(status.isPlaying);
            if (status.didJustFinish) {
              setIsPlaying(false);
              newSound.setPositionAsync(0);
            }
          }
        }
      );
      setSound(newSound);
    } catch (e) {
      console.log('Error loading sound', e);
    }
  };

  const changeSpeed = async () => {
    const nextSpeed = speed === 1.0 ? 1.5 : speed === 1.5 ? 2.0 : 1.0;
    setSpeed(nextSpeed);
    if (sound) {
      await sound.setRateAsync(nextSpeed, true);
    }
  };

  const formatDuration = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={togglePlayPause} style={styles.playButton}>
        {isPlaying ? <Pause color="white" size={20} /> : <Play color="white" size={20} />}
      </TouchableOpacity>
      
      <View style={styles.progressLine} />

      <Text style={styles.duration}>
        {duration ? formatDuration(duration) : '0:00'}
      </Text>

      <TouchableOpacity onPress={changeSpeed} style={styles.speedButton}>
        <Text style={styles.speedText}>{speed}x</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 20,
    width: 220,
  },
  playButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressLine: {
    flex: 1,
    height: 2,
    backgroundColor: theme.colors.border,
    marginHorizontal: theme.spacing.sm,
  },
  duration: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textSecondary,
    marginRight: theme.spacing.sm,
  },
  speedButton: {
    backgroundColor: 'rgba(0,0,0,0.1)',
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 8,
  },
  speedText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: theme.colors.text,
  }
});
