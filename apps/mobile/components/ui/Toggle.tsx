import React from 'react';
import { 
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { ThemedText } from '../themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface ToggleProps {
  value: boolean;
  onChange: (value: boolean) => void;
  label?: string;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  containerStyle?: ViewStyle;
}

export function Toggle({
  value,
  onChange,
  label,
  disabled = false,
  size = 'md',
  containerStyle,
}: ToggleProps) {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];

  const getSizeConfig = () => {
    switch (size) {
      case 'sm': return { trackWidth: 40, trackHeight: 22, thumbSize: 18, fontSize: 'text-[13px]' };
      case 'md': return { trackWidth: 50, trackHeight: 28, thumbSize: 24, fontSize: 'text-[15px]' };
      case 'lg': return { trackWidth: 60, trackHeight: 34, thumbSize: 30, fontSize: 'text-[17px]' };
      default: return { trackWidth: 50, trackHeight: 28, thumbSize: 24, fontSize: 'text-[15px]' };
    }
  };

  const { trackWidth, trackHeight, thumbSize, fontSize } = getSizeConfig();
  const thumbOffset = trackWidth - thumbSize - 4;

  return (
    <TouchableOpacity
      onPress={() => !disabled && onChange(!value)}
      activeOpacity={0.8}
      disabled={disabled}
      className={`flex-row items-center justify-between ${disabled ? 'opacity-50' : 'opacity-100'}`}
      style={containerStyle}
    >
      {label && (
        <ThemedText className={`${fontSize} mr-3`} style={{ color: theme.text }}>
          {label}
        </ThemedText>
      )}
      
      <View
        className="justify-center p-0.5"
        style={{
          width: trackWidth,
          height: trackHeight,
          borderRadius: trackHeight / 2,
          backgroundColor: value ? theme.primary : theme.border,
        }}
      >
        <View
          className="bg-white shadow-md"
          style={{
            width: thumbSize,
            height: thumbSize,
            borderRadius: thumbSize / 2,
            transform: [{ translateX: value ? thumbOffset : 0 }],
          }}
        />
      </View>
    </TouchableOpacity>
  );
}
