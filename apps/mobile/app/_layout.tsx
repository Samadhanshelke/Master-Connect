import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from 'expo-router/react-navigation';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import Toast from 'react-native-toast-message';
import "../global.css";

import { toastConfig } from '@/components/toast-config';
import { AuthProvider } from '@/context/AuthContext';
import { BannersProvider } from '@/context/BannersContext';
import { ChatProvider } from '@/context/ChatContext';
import { LanguageProvider } from '@/context/LanguageContext';
import { MarketplaceProvider } from '@/context/MarketplaceContext';
import { NotificationsProvider } from '@/context/NotificationsContext';
import { PostsProvider } from '@/context/PostsContext';
import { ThemeProvider, useTheme } from '@/context/ThemeContext';
import { UserProfileProvider } from '@/context/UserProfileContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { LogBox } from 'react-native';

// Ignore specific warnings
LogBox.ignoreLogs([
  'SafeAreaView has been deprecated',
]);

function RootLayoutContent() {
  const colorScheme = useColorScheme();
  const { isDark } = useTheme();

  return (
    <NavigationThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="language-selection" options={{ headerShown: false, presentation: 'modal' }} />
        <Stack.Screen name="welcome" options={{ headerShown: false }} />
        <Stack.Screen name="auth" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="create-shop" options={{ headerShown: false, presentation: 'modal' }} />
        <Stack.Screen name="create-job" options={{ headerShown: false }} />
        <Stack.Screen name="shop-details" options={{ headerShown: false }} />
        <Stack.Screen name="post-details" options={{ headerShown: false }} />
        <Stack.Screen name="notifications" options={{ headerShown: false }} />
        <Stack.Screen name="chat-room" options={{ headerShown: false }} />
        <Stack.Screen name="banner-booking" options={{ headerShown: false }} />
        <Stack.Screen name="user-list" options={{ headerShown: false }} />
        <Stack.Screen name="admin" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Toast config={toastConfig(colorScheme ?? 'light')} />
    </NavigationThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <LanguageProvider>
          <UserProfileProvider>
            <PostsProvider>
              <NotificationsProvider>
                <ChatProvider>
                  <MarketplaceProvider>
                    <BannersProvider>
                      <RootLayoutContent />
                    </BannersProvider>
                  </MarketplaceProvider>
                </ChatProvider>
              </NotificationsProvider>
            </PostsProvider>
          </UserProfileProvider>
        </LanguageProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}


