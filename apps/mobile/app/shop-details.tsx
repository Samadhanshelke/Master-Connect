import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button, Divider } from '@/components/ui';
import { Colors } from '@/constants/theme';
import { useMarketplace } from '@/context/MarketplaceContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { subscribeToShop } from '@/services/marketplace';
import { ShopRecord } from '@/types/marketplace';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, Linking, Platform, ScrollView, Share, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

export default function ShopDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const { getShop } = useMarketplace();

  const shopId = Array.isArray(id) ? id[0] : id;
  const cachedShop = shopId ? getShop(shopId) : undefined;
  const [shop, setShop] = useState<ShopRecord | null>(cachedShop ?? null);
  const [loading, setLoading] = useState(!cachedShop);

  useEffect(() => {
    if (!shopId) {
      setShop(null);
      setLoading(false);
      return;
    }

    const existing = getShop(shopId);
    if (existing) {
      setShop(existing);
      setLoading(false);
    } else {
      setLoading(true);
    }

    const unsubscribe = subscribeToShop(
      shopId,
      (next) => {
        setShop(next);
        setLoading(false);
      },
      (error) => {
        console.error('Error loading shop:', error);
        setLoading(false);
        Toast.show({ type: 'error', text1: 'Could not load shop' });
      },
    );

    return unsubscribe;
  }, [shopId]);

  const timing = useMemo(() => {
    if (!shop) return '';
    if (shop.openingTime && shop.closingTime) {
      return `${shop.openingTime} - ${shop.closingTime}`;
    }
    return shop.openingTime || shop.closingTime;
  }, [shop]);

  const products = shop?.items.filter((item) => item.type === 'product') ?? [];
  const services = shop?.items.filter((item) => item.type === 'service') ?? [];

  const handleCall = () => {
    if (!shop?.contactNumber) return;
    Linking.openURL(`tel:${shop.contactNumber}`);
  };

  const handleShare = async () => {
    if (!shop) return;
    try {
      await Share.share({
        message: `${shop.name} by ${shop.ownerName}\n${shop.location}\n${shop.contactNumber}`,
      });
    } catch (error) {
      console.error('Error sharing shop:', error);
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center" style={{ backgroundColor: theme.background }}>
        <ActivityIndicator color={theme.primary} />
      </SafeAreaView>
    );
  }

  if (!shop) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center" style={{ backgroundColor: theme.background }}>
        <Ionicons name="storefront-outline" size={60} color={theme.textSecondary} />
        <ThemedText className="mt-4" style={{ color: theme.textSecondary }}>Shop not found</ThemedText>
        <Button title="Go Back" variant="outline" onPress={() => router.back()} style={{ marginTop: 16 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: theme.background }}>
      <View 
        className="absolute top-12 left-0 right-0 z-10 flex-row justify-between px-4"
      >
        <TouchableOpacity
          className="w-10 h-10 rounded-full items-center justify-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity
          className="w-10 h-10 rounded-full items-center justify-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          onPress={handleShare}
        >
          <Ionicons name="share-outline" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {shop.bannerImage ? (
          <Image 
            source={{ uri: shop.bannerImage }} 
            className="w-full h-56"
            resizeMode="cover"
          />
        ) : (
          <View 
            className="w-full h-56 items-center justify-center"
            style={{ backgroundColor: theme.primary + '20' }}
          >
            <Ionicons name="storefront" size={60} color={theme.primary} />
          </View>
        )}

        <View className="p-4">
          <View className="flex-row justify-between items-start">
            <View className="flex-1 pr-4">
              <ThemedText type="title" className="text-2xl">{shop.name}</ThemedText>
              <ThemedText style={{ color: theme.textSecondary }}>by {shop.ownerName}</ThemedText>
            </View>
            <View 
              className="px-3 py-1.5 rounded-full"
              style={{ backgroundColor: theme.secondary + '20' }}
            >
              <ThemedText className="text-xs font-semibold" style={{ color: theme.secondary }}>
                {shop.category}
              </ThemedText>
            </View>
          </View>

          {timing ? (
            <View className="flex-row items-center mt-3 gap-2">
              <Ionicons name="time-outline" size={18} color={theme.primary} />
              <ThemedText style={{ color: theme.primary, fontWeight: '500' }}>{timing}</ThemedText>
            </View>
          ) : null}

          {shop.description ? (
            <ThemedText className="mt-4 leading-6">{shop.description}</ThemedText>
          ) : null}
        </View>

        <Divider spacing={0} />

        <View className="p-4">
          <ThemedText type="defaultSemiBold" className="mb-3">Location & Contact</ThemedText>
          
          <TouchableOpacity
            className="flex-row items-start gap-3 mb-3"
            onPress={() => Linking.openURL(`https://maps.google.com/?q=${encodeURIComponent(shop.location)}`)}
          >
            <View 
              className="w-10 h-10 rounded-full items-center justify-center"
              style={{ backgroundColor: theme.primary + '20' }}
            >
              <Ionicons name="location" size={20} color={theme.primary} />
            </View>
            <View className="flex-1">
              <ThemedText style={{ color: theme.textSecondary, fontSize: 12 }}>Address</ThemedText>
              <ThemedText>{shop.location}</ThemedText>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-row items-start gap-3"
            onPress={handleCall}
          >
            <View 
              className="w-10 h-10 rounded-full items-center justify-center"
              style={{ backgroundColor: theme.success + '20' }}
            >
              <Ionicons name="call" size={20} color={theme.success} />
            </View>
            <View className="flex-1">
              <ThemedText style={{ color: theme.textSecondary, fontSize: 12 }}>Phone</ThemedText>
              <ThemedText>{shop.contactNumber}</ThemedText>
            </View>
          </TouchableOpacity>
        </View>

        <Divider spacing={0} />

        {shop.images.length > 0 && (
          <>
            <View className="p-4">
              <ThemedText type="defaultSemiBold" className="mb-3">Photos</ThemedText>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 12 }}
              >
                {shop.images.map((img, index) => (
                  <Image 
                    key={`${img}-${index}`}
                    source={{ uri: img }} 
                    className="w-32 h-32 rounded-xl"
                    resizeMode="cover"
                  />
                ))}
              </ScrollView>
            </View>
            <Divider spacing={0} />
          </>
        )}

        {products.length > 0 && (
          <View className="p-4">
            <ThemedText type="defaultSemiBold" className="mb-3">Products</ThemedText>
            {products.map((product) => (
              <ThemedView 
                key={product.id}
                className="flex-row items-center p-4 mb-3 rounded-xl border"
                style={{ backgroundColor: theme.surface, borderColor: theme.border }}
              >
                <View 
                  className="w-12 h-12 rounded-lg items-center justify-center mr-3"
                  style={{ backgroundColor: theme.primary + '20' }}
                >
                  <Ionicons name="cube" size={24} color={theme.primary} />
                </View>
                <View className="flex-1">
                  <ThemedText type="defaultSemiBold">{product.name}</ThemedText>
                  {product.description ? (
                    <ThemedText className="text-xs" style={{ color: theme.textSecondary }}>
                      {product.description}
                    </ThemedText>
                  ) : null}
                </View>
                <ThemedText className="text-lg font-bold" style={{ color: theme.primary }}>
                  ₹{product.price}
                </ThemedText>
              </ThemedView>
            ))}
          </View>
        )}

        {services.length > 0 && (
          <View className="p-4">
            <ThemedText type="defaultSemiBold" className="mb-3">Services</ThemedText>
            {services.map((service) => (
              <ThemedView 
                key={service.id}
                className="flex-row items-center p-4 mb-3 rounded-xl border"
                style={{ backgroundColor: theme.surface, borderColor: theme.border }}
              >
                <View 
                  className="w-12 h-12 rounded-lg items-center justify-center mr-3"
                  style={{ backgroundColor: theme.secondary + '20' }}
                >
                  <Ionicons name="construct" size={24} color={theme.secondary} />
                </View>
                <View className="flex-1">
                  <ThemedText type="defaultSemiBold">{service.name}</ThemedText>
                  {service.description ? (
                    <ThemedText className="text-xs" style={{ color: theme.textSecondary }}>
                      {service.description}
                    </ThemedText>
                  ) : null}
                </View>
                <ThemedText className="text-lg font-bold" style={{ color: theme.primary }}>
                  ₹{service.price}
                </ThemedText>
              </ThemedView>
            ))}
          </View>
        )}

        <View className="h-24" />
      </ScrollView>

      <View 
        className={`absolute bottom-0 left-0 right-0 px-4 pt-3 ${Platform.OS === 'ios' ? 'pb-8' : 'pb-4'} border-t`}
        style={{ backgroundColor: theme.background, borderTopColor: theme.border }}
      >
        <TouchableOpacity
          className="flex-row items-center justify-center gap-2 py-3.5 rounded-xl"
          style={{ backgroundColor: theme.primary }}
          onPress={handleCall}
        >
          <Ionicons name="call" size={20} color="#fff" />
          <ThemedText className="text-white font-semibold" style={{ color: '#ffffff' }}>Call Now</ThemedText>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
