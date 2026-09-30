import { useTheme } from '@/context/ThemeContext';

/**
 * App color scheme from ThemeContext (respects light/dark/system preference).
 */
export function useColorScheme() {
  const { colorScheme } = useTheme();
  return colorScheme;
}
