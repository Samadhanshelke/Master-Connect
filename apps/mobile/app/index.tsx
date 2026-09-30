import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { useUserProfile } from '@/context/UserProfileContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { Animated, View } from 'react-native';

import Svg, { Path, Rect } from 'react-native-svg';

export default function SplashScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const { user, loading: authLoading } = useAuth();
  const { hasSelectedLanguage, isLoading: languageLoading } = useLanguage();
  const { hasCompletedOnboarding, hasSeenWelcome, isLoading: profileLoading, isNewUser } = useUserProfile();
  
  const fadeAnim = new Animated.Value(0);
  const scaleAnim = new Animated.Value(0.8);

  const [isAnimationDone, setIsAnimationDone] = React.useState(false);

  useEffect(() => {
    // Parallel animation for fade and scale
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    // Minimum display time for splash
    const timer = setTimeout(() => {
       setIsAnimationDone(true);
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const checkStateAndNavigate = async () => {
      // Must wait for all loading states AND animation to complete
      if (authLoading || languageLoading || profileLoading || !isAnimationDone) return; 

      console.log('SplashScreen Check:', {
        authLoading,
        languageLoading,
        profileLoading,
        isAnimationDone,
        user: user ? user.email : 'null',
        hasSelectedLanguage,
        hasSeenWelcome,
        hasCompletedOnboarding,
        isNewUser,
      });
      
      // Step 1: Check if language has been selected (first time setup)
      if (!hasSelectedLanguage) {
        console.log('Navigating to Language Selection (first time)');
        router.replace('/language-selection');
        return;
      }

      // Step 2: Check if user is authenticated
      if (user) {
        // User is logged in
        if (!hasCompletedOnboarding) {
          console.log('Navigating to Onboarding (incomplete profile)');
          router.replace('/onboarding');
        } else {
          console.log('Navigating to Home');
          router.replace('/(tabs)');
        }
      } else {
        // User is not authenticated
        if (!hasSeenWelcome) {
          // First time user who hasn't seen welcome -> show welcome
          console.log('Navigating to Welcome (new visitor)');
          router.replace('/welcome');
        } else {
          // Returning visitor who has seen welcome -> show auth
          console.log('Navigating to Auth');
          router.replace('/auth');
        }
      }
    };
    
    checkStateAndNavigate();
  }, [user, authLoading, languageLoading, profileLoading, isAnimationDone, hasSelectedLanguage, hasSeenWelcome, hasCompletedOnboarding, isNewUser]);

  return (
    <View style={{ backgroundColor: theme.background }} className="flex-1 items-center justify-center">
      <Animated.View 
        className="items-center gap-6"
        style={{ 
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }] 
        }}
      >
        <Svg width="150" height="150" viewBox="0 0 200 200" fill="none">
          <Rect width="200" height="200" rx="40" fill={theme.surface} />
          {/* M Shape */}
          <Path d="M60 140V60L100 100L140 60V140" stroke={theme.primary} strokeWidth="20" strokeLinecap="round" strokeLinejoin="round"/>
          {/* Accent on right leg */}
          <Path d="M140 60V140" stroke={theme.secondary} strokeWidth="20" strokeLinecap="round" strokeLinejoin="round"/>
        </Svg>
        
        <ThemedText type="title" className="text-4xl font-bold tracking-[4px] uppercase">Master Connect</ThemedText>
      </Animated.View>
    </View>
  );
}

