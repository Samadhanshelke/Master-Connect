import React from 'react';
import { View, ViewStyle } from 'react-native';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface DividerProps {
  direction?: 'horizontal' | 'vertical';
  spacing?: number;
  thickness?: number;
  color?: string;
  style?: ViewStyle;
}

export function Divider({
  direction = 'horizontal',
  spacing = 16,
  thickness = 1,
  color,
  style,
}: DividerProps) {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];

  const dividerColor = color || theme.border;

  if (direction === 'vertical') {
    return (
      <View
        className="self-stretch"
        style={[
          {
            width: thickness,
            backgroundColor: dividerColor,
            marginHorizontal: spacing / 2,
          },
          style,
        ]}
      />
    );
  }

  return (
    <View
      className="w-full"
      style={[
        {
          height: thickness,
          backgroundColor: dividerColor,
          marginVertical: spacing / 2,
        },
        style,
      ]}
    />
  );
}
