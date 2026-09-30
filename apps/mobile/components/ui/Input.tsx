import React from 'react';
import { 
  TextInput as RNTextInput, 
  TextInputProps as RNTextInputProps,
  View,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '../themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface InputProps extends RNTextInputProps {
  label?: string;
  error?: string;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
  containerStyle?: ViewStyle;
}

export function Input({
  label,
  error,
  leftIcon,
  rightIcon,
  onRightIconPress,
  containerStyle,
  style,
  ...props
}: InputProps) {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];

  return (
    <View style={containerStyle}>
      {label && (
        <ThemedText className="text-sm font-medium mb-2" style={{ color: theme.text }}>
          {label}
        </ThemedText>
      )}
      
      <View
        className="flex-row items-center rounded-xl px-3.5 h-[52px] border"
        style={{
          backgroundColor: theme.surface,
          borderColor: error ? theme.error : theme.border,
        }}
      >
        {leftIcon && (
          <Ionicons 
            name={leftIcon} 
            size={20} 
            color={theme.textSecondary} 
            style={{ marginRight: 10 }} 
          />
        )}
        
        <RNTextInput
          placeholderTextColor={theme.textSecondary}
          className="flex-1 text-[16px] h-full"
          style={[{ color: theme.text }, style]}
          {...props}
        />
        
        {rightIcon && (
          <Ionicons 
            name={rightIcon} 
            size={20} 
            color={theme.textSecondary}
            onPress={onRightIconPress}
            style={{ marginLeft: 10 }} 
          />
        )}
      </View>
      
      {error && (
        <ThemedText className="text-xs mt-1" style={{ color: theme.error }}>
          {error}
        </ThemedText>
      )}
    </View>
  );
}
