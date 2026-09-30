import { ThemedText } from '@/components/themed-text';
import { Button, Divider, Input } from '@/components/ui';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { useUserProfile } from '@/context/UserProfileContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    TouchableOpacity,
    View,
} from 'react-native';
import Toast from 'react-native-toast-message';

export default function AuthScreen() {
  const router = useRouter();
  const { mode } = useLocalSearchParams<{ mode: string }>();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const { i18n } = useLanguage();
  const { setIsNewUser, markWelcomeSeen, hasCompletedOnboarding, isLoading: profileLoading } = useUserProfile();

  // ========== AUTH CONTEXT ==========
  const { signIn, signUp, resetPassword, promptGoogleSignIn, user, googleLoading, googleReady } = useAuth();

  // Initialize isLogin based on "mode" param (default to login if not "signup")
  // If mode is 'signup', isLogin = false.
  const [isLogin, setIsLogin] = useState(mode !== 'signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  // Forgot Password State
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  // Navigate when logged in and the cloud profile has loaded
  useEffect(() => {
    if (!user || profileLoading) return;

    if (!hasCompletedOnboarding) {
      router.replace('/onboarding');
    } else {
      router.replace('/(tabs)');
    }
  }, [user, profileLoading, hasCompletedOnboarding, router]);

  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    Toast.show({
      type,
      text1: message,
      position: 'top',
      visibilityTime: 2500,
      topOffset: 50,
    });
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleEmailAuth = async () => {
    if (password.length < 6) {
      showToast('error', 'Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      const result = isLogin ? await signIn(email, password) : await signUp(email, password);
      if (result.error) {
        showToast('error', result.error.message);
      } else {
        // SUCCESS
        if (!isLogin) {
          await setIsNewUser(true);
          await markWelcomeSeen();
        }
        
        showToast('success', isLogin ? 'Logged in successfully!' : 'Account created successfully!');
      }
    } catch (error) {
      showToast('error', 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!resetEmail.trim()) {
      showToast('error', 'Please enter your email address');
      return;
    }

    if (!validateEmail(resetEmail)) {
      showToast('error', 'Please enter a valid email address');
      return;
    }

    setResetLoading(true);
    try {
      const result = await resetPassword(resetEmail);
      if (result.error) {
        showToast('error', result.error.message);
      } else {
        showToast('success', 'Password reset email sent! Check your inbox.');
        setShowForgotPassword(false);
        setResetEmail('');
      }
    } catch (error) {
      showToast('error', 'Failed to send reset email');
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ backgroundColor: theme.background }}
      className="flex-1"
    >
      <ScrollView contentContainerClassName="flex-grow justify-center p-6">
        <View className="items-center mb-12">
          <ThemedText type="title" style={{ color: theme.primary, fontSize: 32 }}>
            Master Connect
          </ThemedText>
          <ThemedText className="mt-2 text-base" style={{ color: theme.textSecondary }}>
            {isLogin ? i18n.auth.welcomeBack : i18n.auth.createAccount}
          </ThemedText>
        </View>

        <View className="gap-4">
          {/* Email Input */}
          <Input
            leftIcon="mail-outline"
            placeholder={i18n.auth.emailPlaceholder}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            editable={!loading}
          />

          {/* Password Input */}
          <Input
            leftIcon="lock-closed-outline"
            rightIcon={showPassword ? 'eye-off-outline' : 'eye-outline'}
            onRightIconPress={() => setShowPassword(!showPassword)}
            placeholder={i18n.auth.passwordPlaceholder}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            editable={!loading}
          />

          {/* Forgot Password Link - Only show on login */}
          {isLogin && (
            <TouchableOpacity 
              className="self-end -mt-2"
              onPress={() => {
                setResetEmail(email); // Pre-fill with entered email
                setShowForgotPassword(true);
              }}
            >
              <ThemedText className="text-sm" style={{ color: theme.primary }}>
                Forgot Password?
              </ThemedText>
            </TouchableOpacity>
          )}

          {/* Auth Button */}
          <Button
            title={isLogin ? i18n.auth.login : i18n.auth.signup}
            loading={loading}
            fullWidth
            size="lg"
            style={{ marginTop: 8 }}
            onPress={handleEmailAuth}
          />


        </View>

        {/* Toggle Login/Signup */}
        <View className="flex-row justify-center items-center mt-12 gap-2">
          <ThemedText style={{ color: theme.textSecondary }}>
            {isLogin ? i18n.auth.noAccount : i18n.auth.hasAccount}
          </ThemedText>
          <TouchableOpacity onPress={() => setIsLogin(!isLogin)}>
            <ThemedText className="font-bold" style={{ color: theme.primary }}>
              {isLogin ? i18n.auth.signup : i18n.auth.login}
            </ThemedText>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Forgot Password Modal */}
      <Modal 
        visible={showForgotPassword} 
        animationType="fade" 
        transparent 
        onRequestClose={() => setShowForgotPassword(false)}
      >
        <View className="flex-1 justify-center items-center bg-black/50 px-6">
          <View 
            className="w-full rounded-2xl p-6"
            style={{ backgroundColor: theme.background }}
          >
            <View className="items-center mb-6">
              <View 
                className="w-16 h-16 rounded-full items-center justify-center mb-3"
                style={{ backgroundColor: theme.primary + '15' }}
              >
                <Ionicons name="key-outline" size={32} color={theme.primary} />
              </View>
              <ThemedText type="subtitle">Reset Password</ThemedText>
              <ThemedText 
                className="text-center mt-2 text-sm" 
                style={{ color: theme.textSecondary }}
              >
                Enter your email address and we&apos;ll send you a link to reset your password.
              </ThemedText>
            </View>

            <Input
              leftIcon="mail-outline"
              placeholder="Enter your email"
              value={resetEmail}
              onChangeText={setResetEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              editable={!resetLoading}
            />

            <View className="gap-3 mt-6">
              <Button
                title="Send Reset Link"
                loading={resetLoading}
                fullWidth
                onPress={handleForgotPassword}
              />
              <TouchableOpacity
                className="py-3 items-center"
                onPress={() => {
                  setShowForgotPassword(false);
                  setResetEmail('');
                }}
              >
                <ThemedText style={{ color: theme.textSecondary }}>Cancel</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

