import React from 'react';
import { 
  TextInput as RNTextInput, 
  TextInputProps as RNTextInputProps,
  View,
  ViewStyle,
} from 'react-native';
import { ThemedText } from '../themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface TextAreaProps extends RNTextInputProps {
  label?: string;
  error?: string;
  minHeight?: number;
  maxHeight?: number;
  bordered?: boolean;
  containerStyle?: ViewStyle;
}

export function TextArea({
  label,
  error,
  minHeight = 100,
  maxHeight,
  bordered = true,
  containerStyle,
  style,
  ...props
}: TextAreaProps) {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];

  return (
    <View style={containerStyle}>
      {label && (
        <ThemedText className="text-sm font-medium mb-2" style={{ color: theme.text }}>
          {label}
        </ThemedText>
      )}
      
      <RNTextInput
        multiline
        textAlignVertical="top"
        placeholderTextColor={theme.textSecondary}
        className={`rounded-xl p-3.5 text-[16px] ${bordered ? 'border' : ''}`}
        style={[
          {
            minHeight,
            maxHeight,
            backgroundColor: bordered ? theme.surface : 'transparent',
            borderColor: error ? theme.error : theme.border,
            color: theme.text,
          },
          style,
        ]}
        {...props}
      />
      
      {error && (
        <ThemedText className="text-xs mt-1" style={{ color: theme.error }}>
          {error}
        </ThemedText>
      )}
    </View>
  );
}
