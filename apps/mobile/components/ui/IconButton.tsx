import React from 'react';
import { 
  TouchableOpacity, 
  TouchableOpacityProps, 
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

type IconButtonVariant = 'default' | 'primary' | 'outline' | 'ghost';
type IconButtonSize = 'sm' | 'md' | 'lg';

interface IconButtonProps extends Omit<TouchableOpacityProps, 'style'> {
  icon: keyof typeof Ionicons.glyphMap;
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  color?: string;
  disabled?: boolean;
  style?: ViewStyle;
}

export function IconButton({
  icon,
  variant = 'ghost',
  size = 'md',
  color,
  disabled = false,
  style,
  ...props
}: IconButtonProps) {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];

  const getSizeClass = () => {
    switch (size) {
      case 'sm': return 'w-8 h-8';
      case 'md': return 'w-10 h-10';
      case 'lg': return 'w-12 h-12';
      default: return 'w-10 h-10';
    }
  };

  const getIconSize = () => {
    switch (size) {
      case 'sm': return 18;
      case 'md': return 22;
      case 'lg': return 26;
      default: return 22;
    }
  };

  const getVariantStyles = (): { container: ViewStyle; iconColor: string } => {
    switch (variant) {
      case 'primary':
        return {
          container: {
            backgroundColor: disabled ? theme.border : theme.primary,
          },
          iconColor: '#FFFFFF',
        };
      case 'outline':
        return {
          container: {
            backgroundColor: 'transparent',
            borderWidth: 1.5,
            borderColor: disabled ? theme.border : theme.primary,
          },
          iconColor: disabled ? theme.textSecondary : theme.primary,
        };
      case 'ghost':
        return {
          container: {
            backgroundColor: 'transparent',
          },
          iconColor: color || (disabled ? theme.textSecondary : theme.text),
        };
      default:
        return {
          container: {
            backgroundColor: theme.surface,
          },
          iconColor: color || (disabled ? theme.textSecondary : theme.text),
        };
    }
  };

  const variantStyles = getVariantStyles();

  return (
    <TouchableOpacity
      disabled={disabled}
      activeOpacity={0.7}
      className={`${getSizeClass()} rounded-full items-center justify-center`}
      style={[variantStyles.container, style]}
      {...props}
    >
      <Ionicons 
        name={icon} 
        size={getIconSize()} 
        color={color || variantStyles.iconColor} 
      />
    </TouchableOpacity>
  );
}
