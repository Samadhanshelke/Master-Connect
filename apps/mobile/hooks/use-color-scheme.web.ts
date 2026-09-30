import { useEffect, useState } from 'react';

import { useTheme } from '@/context/ThemeContext';

/**
 * App color scheme from ThemeContext (respects light/dark/system preference).
 * Hydrates on the client so static web renders stay consistent.
 */
export function useColorScheme() {
  const { colorScheme } = useTheme();
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  if (hasHydrated) {
    return colorScheme;
  }

  return 'light';
}
