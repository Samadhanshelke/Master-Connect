import React from 'react';
import { View, ViewStyle } from 'react-native';
import { ThemedText } from '../themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface BadgeProps {
  label: string;
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'error';
  size?: 'sm' | 'md';
  style?: ViewStyle;
}

export function Badge({
  label,
  variant = 'default',
  size = 'sm',
  style,
}: BadgeProps) {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];

  const getSizeClass = () => {
    switch (size) {
      case 'sm': return 'px-2 py-1 text-[11px]';
      case 'md': return 'px-3 py-1.5 text-[13px]';
      default: return 'px-2 py-1 text-[11px]';
    }
  };

  const getVariantStyles = (): { bg: string; text: string } => {
    switch (variant) {
      case 'primary':
        return { bg: theme.primary + '20', text: theme.primary };
      case 'secondary':
        return { bg: theme.secondary + '30', text: theme.secondary };
      case 'success':
        return { bg: theme.success + '20', text: theme.success };
      case 'error':
        return { bg: theme.error + '20', text: theme.error };
      default:
        return { bg: theme.border, text: theme.textSecondary };
    }
  };

  const variantStyles = getVariantStyles();

  return (
    <View
      className={`rounded-xl self-start ${size === 'sm' ? 'px-2 py-1' : 'px-3 py-1.5'}`}
      style={[{ backgroundColor: variantStyles.bg }, style]}
    >
      <ThemedText
        className={`font-semibold ${size === 'sm' ? 'text-[11px]' : 'text-[13px]'}`}
        style={{ color: variantStyles.text }}
      >
        {label}
      </ThemedText>
    </View>
  );
}
