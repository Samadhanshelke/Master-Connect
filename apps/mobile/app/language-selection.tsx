import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { Language, Translations } from '@/constants/Translations';
import { useLanguage } from '@/context/LanguageContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';

import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { TouchableOpacity, View } from 'react-native';

const LANGUAGES: { code: Language; name: string; nativeName: string }[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिंदी' },
];

export default function LanguageSelectionScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const { setLanguage, language: currentLanguage, i18n } = useLanguage();
  const [selected, setSelected] = useState<Language>(currentLanguage);



  const params = useLocalSearchParams();
  const fromSettings = params.fromSettings === 'true';

  const handleContinue = () => {
    setLanguage(selected);
    if (fromSettings) {
      router.back();
    } else {
      router.replace('/welcome');
    }
  };

  return (
    <View style={{ backgroundColor: theme.background }} className="flex-1 p-6">
      <View className="flex-1 justify-center">
        <View className="items-center mb-16 gap-2">
          <Ionicons name="language" size={64} color={theme.primary} />
          <ThemedText type="title" className="!text-center">
            {i18n.language.selectLanguage}
          </ThemedText>
        </View>

        <View className="gap-4">
          {LANGUAGES.map((item) => (
            <TouchableOpacity
              key={item.code}
              className="flex-row items-center justify-between p-5 rounded-2xl shadow-sm elevation-2"
              style={{ 
                backgroundColor: theme.surface,
                borderColor: selected === item.code ? theme.primary : theme.border,
                borderWidth: selected === item.code ? 2 : 1,
              }}
              onPress={() => setSelected(item.code)}
            >
              <View>
                <ThemedText type="defaultSemiBold" className="text-lg">
                  {item.nativeName}
                </ThemedText>
                <ThemedText style={{ color: theme.textSecondary }}>
                  {item.name}
                </ThemedText>
              </View>
              {selected === item.code && (
                <Ionicons name="checkmark-circle" size={24} color={theme.primary} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View className="py-6">
        <TouchableOpacity
          className="h-14 rounded-xl items-center justify-center shadow-md elevation-3"
          style={{ backgroundColor: theme.primary }}
          onPress={handleContinue}
        >
          <ThemedText className="text-white text-lg font-bold" style={{ color: '#ffffff' }}>
            {Translations[selected].language.continue}
          </ThemedText>
        </TouchableOpacity>
      </View>
    </View>
  );
}
