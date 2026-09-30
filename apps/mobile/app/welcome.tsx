import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useLanguage } from '@/context/LanguageContext';
import { useUserProfile } from '@/context/UserProfileContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import {
    FlatList,
    NativeScrollEvent,
    NativeSyntheticEvent,
    Text,
    TouchableOpacity,
    useWindowDimensions,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';



export default function WelcomeScreen() {
  const { width, height } = useWindowDimensions();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const flatListRef = useRef<FlatList>(null);
  const { i18n } = useLanguage();
  const { markWelcomeSeen } = useUserProfile();
  const [currentIndex, setCurrentIndex] = useState(0);

  const slides = [
    {
      id: '1',
      title: i18n.welcome.slide1Title,
      description: i18n.welcome.slide1Desc,
      icon: 'people-circle-outline',
    },
    {
      id: '2',
      title: i18n.welcome.slide2Title,
      description: i18n.welcome.slide2Desc,
      icon: 'chatbubbles-outline',
    },
    {
      id: '3',
      title: i18n.welcome.slide3Title,
      description: i18n.welcome.slide3Desc,
      icon: 'storefront-outline',
    },
  ];

  const handleNext = async () => {
    if (currentIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
    } else {
      await markWelcomeSeen();
      router.replace('/auth?mode=signup');
    }
  };

  const handleSkip = async () => {
    await markWelcomeSeen();
    router.replace('/auth?mode=signup');
  };

  const onMomentumScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / width);
    setCurrentIndex(index);
  };

  return (
    <SafeAreaView style={{ backgroundColor: theme.background, flex: 1 }}>
      {/* Skip button header */}
      <View style={{ padding: 20, alignItems: 'flex-end' }}>
        <TouchableOpacity onPress={handleSkip} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <ThemedText style={{ color: theme.textSecondary }}>{i18n.common.skip}</ThemedText>
        </TouchableOpacity>
      </View>
      
      {/* Slides */}
      <View style={{ flex: 1 }}>
        <FlatList
          ref={flatListRef}
          data={slides}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={onMomentumScrollEnd}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={{ width, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 }}>
              <View style={{ marginBottom: 40, padding: 20, borderRadius: 999, backgroundColor: 'rgba(0,150,136,0.1)' }}>
                <Ionicons name={item.icon as any} size={120} color={theme.primary} />
              </View>
              <ThemedText type="title" style={{ textAlign: 'center', marginBottom: 16, fontSize: 28, color: theme.text }}>
                {item.title}
              </ThemedText>
              <ThemedText style={{ textAlign: 'center', fontSize: 16, lineHeight: 24, color: theme.textSecondary }}>
                {item.description}
              </ThemedText>
            </View>
          )}
        />
      </View>
      
      {/* Footer with dots and button */}
      <View style={{ padding: 20, paddingBottom: 40 }}>
        {/* Pagination dots */}
        <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 30 }}>
          {slides.map((_, index) => (
            <View
              key={index}
              style={{
                height: 8,
                width: currentIndex === index ? 24 : 8,
                borderRadius: 4,
                marginHorizontal: 4,
                backgroundColor: currentIndex === index ? theme.primary : theme.border,
              }}
            />
          ))}
        </View>

        {/* Next/Get Started Button */}
        <TouchableOpacity
          style={{
            backgroundColor: theme.primary,
            paddingVertical: 16,
            borderRadius: 12,
            alignItems: 'center',
          }}
          onPress={() => {
            console.log('Button pressed, currentIndex:', currentIndex);
            handleNext();
          }}
          activeOpacity={0.7}
        >
          <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: '600' }}>
            {currentIndex === slides.length - 1 ? i18n.common.getStarted : i18n.common.next}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
