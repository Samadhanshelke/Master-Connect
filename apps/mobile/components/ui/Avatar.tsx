import React from 'react';
import { View, ViewStyle, Image, ImageSourcePropType, ImageStyle } from 'react-native';
import { ThemedText } from '../themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface AvatarProps {
  source?: ImageSourcePropType | null;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  style?: ViewStyle;
}

export function Avatar({
  source,
  name,
  size = 'md',
  style,
}: AvatarProps) {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];

  const getSizeClass = () => {
    switch (size) {
      case 'xs': return 'w-6 h-6';
      case 'sm': return 'w-8 h-8';
      case 'md': return 'w-10 h-10';
      case 'lg': return 'w-14 h-14';
      case 'xl': return 'w-20 h-20';
      default: return 'w-10 h-10';
    }
  };

  const getFontSizeClass = () => {
    switch (size) {
      case 'xs': return 'text-[10px]';
      case 'sm': return 'text-[13px]';
      case 'md': return 'text-[16px]';
      case 'lg': return 'text-[22px]';
      case 'xl': return 'text-[32px]';
      default: return 'text-[16px]';
    }
  };

  const sizeConfig = {
    xs: 24,
    sm: 32,
    md: 40,
    lg: 56,
    xl: 80,
  };

  const containerSize = sizeConfig[size];
  const initials = name?.charAt(0).toUpperCase() || '?';

  if (source) {    
    return (
      <Image
        source={source}
        className={`${getSizeClass()} rounded-full`}
      />
    );
  }

  return (
    <View
      className={`${getSizeClass()} rounded-full items-center justify-center`}
      style={[{ backgroundColor: theme.primary }, style]}
    >
      <ThemedText className={`text-white font-bold ${getFontSizeClass()}`}>
        {initials}
      </ThemedText>
    </View>
  );
}
