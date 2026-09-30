import React from 'react';
import { View, Text } from 'react-native';
import { BaseToast, ErrorToast, InfoToast, ToastConfig } from 'react-native-toast-message';
import { Colors } from '@/constants/theme';

export const toastConfig = (colorScheme: 'light' | 'dark'): ToastConfig => {
  const theme = Colors[colorScheme];
  
  return {
    success: (props) => (
      <BaseToast
        {...props}
        style={{
          borderLeftColor: theme.success || '#10B981',
          backgroundColor: theme.surface,
          borderLeftWidth: 4,
          height: 50,
          borderRadius: 8,
        }}
        contentContainerStyle={{ paddingHorizontal: 12 }}
        text1Style={{
          fontSize: 14,
          fontWeight: '600',
          color: theme.text,
        }}
        text2Style={{
          fontSize: 12,
          color: theme.textSecondary,
        }}
      />
    ),
    error: (props) => (
      <ErrorToast
        {...props}
        style={{
          borderLeftColor: theme.error || '#EF4444',
          backgroundColor: theme.surface,
          borderLeftWidth: 4,
          height: 50,
          borderRadius: 8,
        }}
        contentContainerStyle={{ paddingHorizontal: 12 }}
        text1Style={{
          fontSize: 14,
          fontWeight: '600',
          color: theme.text,
        }}
        text2Style={{
          fontSize: 12,
          color: theme.textSecondary,
        }}
      />
    ),
    info: (props) => (
      <InfoToast
        {...props}
        style={{
          borderLeftColor: theme.primary,
          backgroundColor: theme.surface,
          borderLeftWidth: 4,
          height: 50,
          borderRadius: 8,
        }}
        contentContainerStyle={{ paddingHorizontal: 12 }}
        text1Style={{
          fontSize: 14,
          fontWeight: '600',
          color: theme.text,
        }}
        text2Style={{
          fontSize: 12,
          color: theme.textSecondary,
        }}
      />
    ),
  };
};
