import React from 'react';
import { 
  TouchableOpacity, 
  TouchableOpacityProps, 
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { ThemedText } from '../themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends Omit<TouchableOpacityProps, 'style'> {
  title: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
}

export function Button({
  title,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  style,
  textStyle,
  icon,
  ...props
}: ButtonProps) {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];

  const getSizeClass = () => {
    switch (size) {
      case 'sm': return 'py-2 px-4';
      case 'md': return 'py-3 px-5';
      case 'lg': return 'py-4 px-6';
      default: return 'py-3 px-5';
    }
  };

  const getFontSizeClass = () => {
    switch (size) {
      case 'sm': return 'text-[13px]';
      case 'md': return 'text-[15px]';
      case 'lg': return 'text-[17px]';
      default: return 'text-[15px]';
    }
  };

  const getVariantStyles = (): { container: ViewStyle; text: TextStyle } => {
    const isDisabled = disabled || loading;
    
    switch (variant) {
      case 'primary':
        return {
          container: {
            backgroundColor: isDisabled ? theme.border : theme.primary,
          },
          text: { color: '#FFFFFF' },
        };
      case 'secondary':
        return {
          container: {
            backgroundColor: isDisabled ? theme.border : theme.secondary,
          },
          text: { color: theme.text },
        };
      case 'outline':
        return {
          container: {
            backgroundColor: 'transparent',
            borderWidth: 1.5,
            borderColor: isDisabled ? theme.border : theme.primary,
          },
          text: { color: isDisabled ? theme.textSecondary : theme.primary },
        };
      case 'ghost':
        return {
          container: {
            backgroundColor: 'transparent',
          },
          text: { color: isDisabled ? theme.textSecondary : theme.primary },
        };
      default:
        return {
          container: { backgroundColor: theme.primary },
          text: { color: '#FFFFFF' },
        };
    }
  };

  const variantStyles = getVariantStyles();

  return (
    <TouchableOpacity
      disabled={disabled || loading}
      activeOpacity={0.7}
      className={`rounded-xl items-center justify-center flex-row gap-2 ${getSizeClass()} ${fullWidth ? 'w-full' : ''}`}
      style={[variantStyles.container, style]}
      {...props}
    >
      {loading ? (
        <ActivityIndicator 
          color={variant === 'primary' || variant === 'secondary' ? '#fff' : theme.primary} 
          size="small" 
        />
      ) : (
        <>
          {icon}

        <ThemedText
          className={`font-semibold ${getFontSizeClass()}`}
          style={[variantStyles.text, textStyle]}
        >
          {title}
        </ThemedText>
        </>
      )}
    </TouchableOpacity>
  );
}
