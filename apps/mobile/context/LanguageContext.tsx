import { Language, Translations } from '@/constants/Translations';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';

type LanguageContextType = {
  language: Language;
  setLanguage: (lang: Language) => void;
  i18n: typeof Translations['en'];
  hasSelectedLanguage: boolean;
  isLoading: boolean;
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const LANGUAGE_KEY = '@app:language';
const LANGUAGE_SELECTED_KEY = '@app:language_selected';

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');
  const [hasSelectedLanguage, setHasSelectedLanguage] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load language preference on mount
  useEffect(() => {
    const loadLanguage = async () => {
      try {
        const [savedLanguage, languageSelected] = await Promise.all([
          AsyncStorage.getItem(LANGUAGE_KEY),
          AsyncStorage.getItem(LANGUAGE_SELECTED_KEY),
        ]);
        
        if (savedLanguage && ['en', 'mr', 'hi'].includes(savedLanguage)) {
          setLanguageState(savedLanguage as Language);
        }
        
        setHasSelectedLanguage(languageSelected === 'true');
      } catch (error) {
        console.error('Error loading language:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadLanguage();
  }, []);

  // Persist language change
  const setLanguage = async (lang: Language) => {
    try {
      await AsyncStorage.setItem(LANGUAGE_KEY, lang);
      await AsyncStorage.setItem(LANGUAGE_SELECTED_KEY, 'true');
      setLanguageState(lang);
      setHasSelectedLanguage(true);
    } catch (error) {
      console.error('Error saving language:', error);
    }
  };

  const value = {
    language,
    setLanguage,
    i18n: Translations[language],
    hasSelectedLanguage,
    isLoading,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
