import React from 'react';
import { 
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '../themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  containerStyle?: ViewStyle;
}

export function Checkbox({
  checked,
  onChange,
  label,
  disabled = false,
  size = 'md',
  containerStyle,
}: CheckboxProps) {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];

  const getSizeConfig = () => {
    switch (size) {
      case 'sm': return { boxClass: 'w-[18px] h-[18px]', iconSize: 14, fontSize: 'text-[13px]' };
      case 'md': return { boxClass: 'w-[22px] h-[22px]', iconSize: 16, fontSize: 'text-[15px]' };
      case 'lg': return { boxClass: 'w-[26px] h-[26px]', iconSize: 20, fontSize: 'text-[17px]' };
      default: return { boxClass: 'w-[22px] h-[22px]', iconSize: 16, fontSize: 'text-[15px]' };
    }
  };

  const { boxClass, iconSize, fontSize } = getSizeConfig();

  return (
    <TouchableOpacity
      onPress={() => !disabled && onChange(!checked)}
      activeOpacity={0.7}
      disabled={disabled}
      className={`flex-row items-center gap-2.5 ${disabled ? 'opacity-50' : 'opacity-100'}`}
      style={containerStyle}
    >
      <View
        className={`${boxClass} rounded-md items-center justify-center border-2`}
        style={{
          borderColor: checked ? theme.primary : theme.border,
          backgroundColor: checked ? theme.primary : 'transparent',
        }}
      >
        {checked && (
          <Ionicons name="checkmark" size={iconSize} color="#FFFFFF" />
        )}
      </View>
      
      {label && (
        <ThemedText className={fontSize} style={{ color: theme.text }}>
          {label}
        </ThemedText>
      )}
    </TouchableOpacity>
  );
}
