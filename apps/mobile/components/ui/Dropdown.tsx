import React, { useState } from 'react';
import { 
  TouchableOpacity, 
  View,
  Modal,
  FlatList,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '../themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface DropdownOption {
  label: string;
  value: string;
  icon?: keyof typeof Ionicons.glyphMap;
}

interface DropdownProps {
  options: DropdownOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  disabled?: boolean;
  bordered?: boolean;
  containerStyle?: ViewStyle;
}

export function Dropdown({
  options,
  value,
  onChange,
  placeholder = 'Select an option',
  label,
  error,
  disabled = false,
  bordered = true,
  containerStyle,
}: DropdownProps) {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const [isOpen, setIsOpen] = useState(false);

  const selectedOption = options.find(opt => opt.value === value);

  return (
    <View style={containerStyle}>
      {label && (
        <ThemedText className="text-sm font-medium mb-2" style={{ color: theme.text }}>
          {label}
        </ThemedText>
      )}

      <TouchableOpacity
        disabled={disabled}
        onPress={() => setIsOpen(true)}
        activeOpacity={0.7}
        className={`flex-row items-center justify-between ${bordered ? 'rounded-xl px-3.5 py-3.5 border' : 'rounded-2xl px-2.5 py-1.5'} ${disabled ? 'opacity-50' : 'opacity-100'}`}
        style={{
          backgroundColor: bordered ? theme.surface : 'transparent',
          borderColor: error ? theme.error : theme.border,
        }}
      >
        <View className="flex-row items-center gap-2">
          {selectedOption?.icon && (
            <Ionicons name={selectedOption.icon} size={18} color={theme.primary} />
          )}
          <ThemedText 
            className="text-[15px]"
            style={{ color: selectedOption ? theme.text : theme.textSecondary }}
          >
            {selectedOption?.label || placeholder}
          </ThemedText>
        </View>
        <Ionicons name="chevron-down" size={18} color={theme.textSecondary} />
      </TouchableOpacity>

      {error && (
        <ThemedText className="text-xs mt-1" style={{ color: theme.error }}>
          {error}
        </ThemedText>
      )}

      {/* Dropdown Modal */}
      <Modal visible={isOpen} transparent animationType="fade">
        <TouchableOpacity 
          className="flex-1 bg-black/50 justify-center p-6"
          activeOpacity={1}
          onPress={() => setIsOpen(false)}
        >
          <View 
            className="rounded-2xl max-h-[300px] overflow-hidden"
            style={{ backgroundColor: theme.background }}
          >
            <FlatList
              data={options}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => {
                    onChange(item.value);
                    setIsOpen(false);
                  }}
                  className="flex-row items-center p-4 gap-3"
                  style={{
                    backgroundColor: item.value === value ? theme.primary + '15' : 'transparent',
                  }}
                >
                  {item.icon && (
                    <Ionicons 
                      name={item.icon} 
                      size={20} 
                      color={item.value === value ? theme.primary : theme.text} 
                    />
                  )}
                  <ThemedText 
                    className={`text-[16px] ${item.value === value ? 'font-semibold' : 'font-normal'}`}
                    style={{ color: item.value === value ? theme.primary : theme.text }}
                  >
                    {item.label}
                  </ThemedText>
                  {item.value === value && (
                    <Ionicons 
                      name="checkmark" 
                      size={20} 
                      color={theme.primary} 
                      style={{ marginLeft: 'auto' }}
                    />
                  )}
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => (
                <View className="h-px" style={{ backgroundColor: theme.border }} />
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}
