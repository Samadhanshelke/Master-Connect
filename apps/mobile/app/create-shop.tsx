import React, { useState } from 'react';
import { View, ScrollView, TextInput, TouchableOpacity, Image, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button, IconButton, Divider } from '@/components/ui';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/context/AuthContext';
import { useMarketplace } from '@/context/MarketplaceContext';
import { useUserProfile } from '@/context/UserProfileContext';
import { cityFromLocation } from '@/utils/city';
import { pickImages, uploadFile } from '@/services/media';
import Toast from 'react-native-toast-message';

const CATEGORIES = ['Grocery', 'Services', 'Clothing', 'Electronics', 'Food', 'Health', 'Beauty', 'Other'];

type ServiceProduct = {
  id: string;
  name: string;
  price: string;
  description: string;
  type: 'product' | 'service';
};

export default function CreateShopScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const { profile } = useUserProfile();
  const { user } = useAuth();
  const { createShop } = useMarketplace();
  
  // Form state
  const [shopName, setShopName] = useState('');
  const [shopCategory, setShopCategory] = useState('');
  const [customCategory, setCustomCategory] = useState('');
  const [showCustomCategory, setShowCustomCategory] = useState(false);
  const [shopDescription, setShopDescription] = useState('');
  const city = profile?.location ? cityFromLocation(profile.location) : '';
  const [contactNumber, setContactNumber] = useState('');
  const [bannerImage, setBannerImage] = useState<string | null>(null);
  const [shopImages, setShopImages] = useState<string[]>([]);
  const [openingTime, setOpeningTime] = useState('');
  const [closingTime, setClosingTime] = useState('');
  const [saving, setSaving] = useState(false);

  const [items, setItems] = useState<ServiceProduct[]>([]);
  const [showAddItem, setShowAddItem] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [newItemDescription, setNewItemDescription] = useState('');
  const [newItemType, setNewItemType] = useState<'product' | 'service'>('product');

  const handleAddBanner = async () => {
    try {
      const files = await pickImages(1);
      if (files.length === 0) return;
      setBannerImage(files[0].uri);
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: error instanceof Error ? error.message : 'Could not pick banner',
      });
    }
  };

  const handleAddImage = async () => {
    try {
      const files = await pickImages(4);
      if (files.length === 0) return;
      setShopImages((current) => [...current, ...files.map((file) => file.uri)].slice(0, 8));
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: error instanceof Error ? error.message : 'Could not pick images',
      });
    }
  };

  const handleRemoveImage = (index: number) => {
    setShopImages(shopImages.filter((_, i) => i !== index));
  };

  const handleAddItem = () => {
    if (!newItemName.trim() || !newItemPrice.trim()) {
      Toast.show({ type: 'error', text1: 'Please fill name and price' });
      return;
    }

    const item: ServiceProduct = {
      id: Date.now().toString(),
      name: newItemName,
      price: newItemPrice,
      description: newItemDescription,
      type: newItemType,
    };

    setItems([...items, item]);
    setNewItemName('');
    setNewItemPrice('');
    setNewItemDescription('');
    setShowAddItem(false);
    Toast.show({ type: 'success', text1: `${newItemType === 'product' ? 'Product' : 'Service'} added!` });
  };

  const handleRemoveItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const handleCreateShop = async () => {
    const finalCategory = showCustomCategory ? customCategory : shopCategory;
    
    if (!shopName.trim()) {
      Toast.show({ type: 'error', text1: 'Please enter shop name' });
      return;
    }
    if (!finalCategory.trim()) {
      Toast.show({ type: 'error', text1: 'Please select or enter a category' });
      return;
    }
    if (!city) {
      Toast.show({ type: 'error', text1: 'Your signup city is required to create a shop' });
      return;
    }
    if (!contactNumber.trim()) {
      Toast.show({ type: 'error', text1: 'Please enter contact number' });
      return;
    }

    try {
      setSaving(true);
      if (!user) throw new Error('You must be signed in');

      const uploadedBanner = bannerImage
        ? await uploadFile(user.uid, { uri: bannerImage, name: 'shop-banner.jpg', mimeType: 'image/jpeg' }, 'shops')
        : null;
      const uploadedImages = await Promise.all(
        shopImages.map((uri, index) =>
          uploadFile(user.uid, { uri, name: `shop-${index + 1}.jpg`, mimeType: 'image/jpeg' }, 'shops'),
        ),
      );

      const shopId = await createShop({
        name: shopName.trim(),
        category: finalCategory.trim(),
        description: shopDescription.trim(),
        location: city,
        contactNumber: contactNumber.trim(),
        bannerImage: uploadedBanner,
        images: uploadedImages,
        openingTime,
        closingTime,
        items,
      });
      Toast.show({ type: 'success', text1: 'Shop created successfully!' });
      router.replace(`/shop-details?id=${shopId}`);
    } catch (error) {
      console.error('Error creating shop:', error);
      Toast.show({ type: 'error', text1: 'Could not create shop' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: theme.background }}>
      {/* Header */}
      <View 
        className="flex-row items-center justify-between px-4 py-3 border-b"
        style={{ borderBottomColor: theme.border }}
      >
        <View className="flex-row items-center gap-3">
          <IconButton icon="arrow-back" variant="ghost" onPress={() => router.back()} />
          <ThemedText type="subtitle">Create Your Shop</ThemedText>
        </View>
      </View>

      <ScrollView 
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Banner Image */}
        <ThemedText className="font-semibold mb-2">Shop Banner</ThemedText>
        <TouchableOpacity
          onPress={handleAddBanner}
          className="h-40 rounded-xl items-center justify-center mb-4 overflow-hidden border-2 border-dashed"
          style={{ borderColor: theme.border }}
        >
          {bannerImage ? (
            <Image source={{ uri: bannerImage }} className="w-full h-full" resizeMode="cover" />
          ) : (
            <View className="items-center gap-2">
              <Ionicons name="image-outline" size={40} color={theme.textSecondary} />
              <ThemedText style={{ color: theme.textSecondary }}>Tap to add banner image</ThemedText>
            </View>
          )}
        </TouchableOpacity>

        {/* Shop Name */}
        <ThemedText className="font-semibold mb-2">Shop Name *</ThemedText>
        <TextInput
          className="px-4 py-3 rounded-xl mb-4 border"
          style={{ backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }}
          placeholder="Enter shop name"
          placeholderTextColor={theme.textSecondary}
          value={shopName}
          onChangeText={setShopName}
        />

        {/* Category */}
        <View className="flex-row items-center justify-between mb-2">
          <ThemedText className="font-semibold">Category *</ThemedText>
          <TouchableOpacity onPress={() => setShowCustomCategory(!showCustomCategory)}>
            <ThemedText className="text-sm" style={{ color: theme.primary }}>
              {showCustomCategory ? 'Choose from list' : 'Add custom'}
            </ThemedText>
          </TouchableOpacity>
        </View>
        
        {showCustomCategory ? (
          <TextInput
            className="px-4 py-3 rounded-xl mb-4 border"
            style={{ backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }}
            placeholder="Enter custom category"
            placeholderTextColor={theme.textSecondary}
            value={customCategory}
            onChangeText={setCustomCategory}
          />
        ) : (
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            className="mb-4"
            contentContainerStyle={{ gap: 8 }}
          >
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat}
                className="px-4 py-2 rounded-full border"
                style={{
                  backgroundColor: shopCategory === cat ? theme.primary : theme.surface,
                  borderColor: shopCategory === cat ? theme.primary : theme.border,
                }}
                onPress={() => setShopCategory(cat)}
              >
                <ThemedText style={{ color: shopCategory === cat ? '#fff' : theme.text, fontWeight: '600' }}>
                  {cat}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Description */}
        <ThemedText className="font-semibold mb-2">Description</ThemedText>
        <TextInput
          className="px-4 py-3 rounded-xl mb-4 border"
          style={{ 
            backgroundColor: theme.surface, 
            color: theme.text, 
            borderColor: theme.border,
            minHeight: 80,
            textAlignVertical: 'top',
          }}
          placeholder="Describe your shop..."
          placeholderTextColor={theme.textSecondary}
          multiline
          value={shopDescription}
          onChangeText={setShopDescription}
        />

        {/* Timing */}
        <ThemedText className="font-semibold mb-2">Business Hours</ThemedText>
        <View className="flex-row gap-3 mb-4">
          <View className="flex-1">
            <ThemedText className="text-xs mb-1" style={{ color: theme.textSecondary }}>Opening Time</ThemedText>
            <TextInput
              className="px-4 py-3 rounded-xl border"
              style={{ backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }}
              placeholder="e.g. 9:00 AM"
              placeholderTextColor={theme.textSecondary}
              value={openingTime}
              onChangeText={setOpeningTime}
            />
          </View>
          <View className="flex-1">
            <ThemedText className="text-xs mb-1" style={{ color: theme.textSecondary }}>Closing Time</ThemedText>
            <TextInput
              className="px-4 py-3 rounded-xl border"
              style={{ backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }}
              placeholder="e.g. 8:00 PM"
              placeholderTextColor={theme.textSecondary}
              value={closingTime}
              onChangeText={setClosingTime}
            />
          </View>
        </View>

        {/* City */}
        <ThemedText className="font-semibold mb-2">City</ThemedText>
        <View
          className="px-4 py-3 rounded-xl mb-4 border"
          style={{ backgroundColor: theme.surface, borderColor: theme.border }}
        >
          <ThemedText>{city || 'Complete your profile to set a city'}</ThemedText>
          <ThemedText className="text-xs mt-1" style={{ color: theme.textSecondary }}>
            Shops are created for the city you selected during signup
          </ThemedText>
        </View>

        {/* Contact Number */}
        <ThemedText className="font-semibold mb-2">Contact Number *</ThemedText>
        <TextInput
          className="px-4 py-3 rounded-xl mb-4 border"
          style={{ backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }}
          placeholder="Enter contact number"
          placeholderTextColor={theme.textSecondary}
          keyboardType="phone-pad"
          value={contactNumber}
          onChangeText={setContactNumber}
        />

        <Divider />

        {/* Shop Images */}
        <ThemedText className="font-semibold mb-2 mt-4">Shop Images</ThemedText>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          className="mb-4"
          contentContainerStyle={{ gap: 12 }}
        >
          {shopImages.map((img, index) => (
            <View key={index} className="relative">
              <Image 
                source={{ uri: img }} 
                className="w-24 h-24 rounded-xl"
                resizeMode="cover"
              />
              <TouchableOpacity
                className="absolute -top-2 -right-2 w-6 h-6 rounded-full items-center justify-center"
                style={{ backgroundColor: theme.error }}
                onPress={() => handleRemoveImage(index)}
              >
                <Ionicons name="close" size={14} color="#fff" />
              </TouchableOpacity>
            </View>
          ))}
          <TouchableOpacity
            className="w-24 h-24 rounded-xl items-center justify-center border-2 border-dashed"
            style={{ borderColor: theme.border }}
            onPress={handleAddImage}
          >
            <Ionicons name="add" size={30} color={theme.textSecondary} />
          </TouchableOpacity>
        </ScrollView>

        <Divider />

        {/* Products/Services */}
        <View className="flex-row items-center justify-between mb-3 mt-4">
          <ThemedText className="font-semibold">Products / Services</ThemedText>
          <TouchableOpacity
            className="flex-row items-center gap-1 px-3 py-1.5 rounded-full"
            style={{ backgroundColor: theme.primary + '20' }}
            onPress={() => setShowAddItem(true)}
          >
            <Ionicons name="add" size={16} color={theme.primary} />
            <ThemedText className="text-sm font-medium" style={{ color: theme.primary }}>Add</ThemedText>
          </TouchableOpacity>
        </View>

        {/* Add Item Form */}
        {showAddItem && (
          <ThemedView 
            className="p-4 rounded-xl mb-4 border"
            style={{ backgroundColor: theme.surface, borderColor: theme.border }}
          >
            {/* Type Toggle */}
            <View className="flex-row gap-2 mb-3">
              <TouchableOpacity
                className="flex-1 py-2 rounded-lg items-center"
                style={{ 
                  backgroundColor: newItemType === 'product' ? theme.primary : theme.background,
                  borderWidth: 1,
                  borderColor: newItemType === 'product' ? theme.primary : theme.border,
                }}
                onPress={() => setNewItemType('product')}
              >
                <ThemedText style={{ color: newItemType === 'product' ? '#fff' : theme.text, fontWeight: '600' }}>
                  Product
                </ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 py-2 rounded-lg items-center"
                style={{ 
                  backgroundColor: newItemType === 'service' ? theme.primary : theme.background,
                  borderWidth: 1,
                  borderColor: newItemType === 'service' ? theme.primary : theme.border,
                }}
                onPress={() => setNewItemType('service')}
              >
                <ThemedText style={{ color: newItemType === 'service' ? '#fff' : theme.text, fontWeight: '600' }}>
                  Service
                </ThemedText>
              </TouchableOpacity>
            </View>

            <TextInput
              className="px-3 py-2.5 rounded-lg mb-2 border"
              style={{ backgroundColor: theme.background, color: theme.text, borderColor: theme.border }}
              placeholder={newItemType === 'product' ? 'Product name' : 'Service name'}
              placeholderTextColor={theme.textSecondary}
              value={newItemName}
              onChangeText={setNewItemName}
            />
            <TextInput
              className="px-3 py-2.5 rounded-lg mb-2 border"
              style={{ backgroundColor: theme.background, color: theme.text, borderColor: theme.border }}
              placeholder="Price (₹)"
              placeholderTextColor={theme.textSecondary}
              keyboardType="numeric"
              value={newItemPrice}
              onChangeText={setNewItemPrice}
            />
            <TextInput
              className="px-3 py-2.5 rounded-lg mb-3 border"
              style={{ 
                backgroundColor: theme.background, 
                color: theme.text, 
                borderColor: theme.border,
                minHeight: 60,
                textAlignVertical: 'top',
              }}
              placeholder="Description (optional)"
              placeholderTextColor={theme.textSecondary}
              multiline
              value={newItemDescription}
              onChangeText={setNewItemDescription}
            />
            <View className="flex-row gap-2">
              <TouchableOpacity
                className="flex-1 py-2.5 rounded-lg items-center border"
                style={{ borderColor: theme.border }}
                onPress={() => setShowAddItem(false)}
              >
                <ThemedText>Cancel</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 py-2.5 rounded-lg items-center"
                style={{ backgroundColor: theme.primary }}
                onPress={handleAddItem}
              >
                <ThemedText className="text-white font-semibold">Add</ThemedText>
              </TouchableOpacity>
            </View>
          </ThemedView>
        )}

        {/* Items List */}
        {items.map((item) => (
          <ThemedView 
            key={item.id}
            className="flex-row items-center p-3 rounded-xl mb-2 border"
            style={{ backgroundColor: theme.surface, borderColor: theme.border }}
          >
            <View 
              className="w-10 h-10 rounded-lg items-center justify-center mr-3"
              style={{ backgroundColor: item.type === 'product' ? theme.primary + '20' : theme.secondary + '20' }}
            >
              <Ionicons 
                name={item.type === 'product' ? 'cube-outline' : 'construct-outline'} 
                size={20} 
                color={item.type === 'product' ? theme.primary : theme.secondary} 
              />
            </View>
            <View className="flex-1">
              <ThemedText className="font-semibold">{item.name}</ThemedText>
              {item.description ? (
                <ThemedText className="text-xs" style={{ color: theme.textSecondary }}>{item.description}</ThemedText>
              ) : null}
            </View>
            <ThemedText className="font-bold mr-3" style={{ color: theme.primary }}>₹{item.price}</ThemedText>
            <TouchableOpacity onPress={() => handleRemoveItem(item.id)}>
              <Ionicons name="trash-outline" size={20} color={theme.error} />
            </TouchableOpacity>
          </ThemedView>
        ))}

        {items.length === 0 && !showAddItem && (
          <ThemedText className="text-center py-6" style={{ color: theme.textSecondary }}>
            No products or services added yet
          </ThemedText>
        )}
      </ScrollView>

      {/* Create Button */}
      <View 
        className={`px-4 ${Platform.OS === 'ios' ? 'pb-6' : 'pb-4'} pt-3 border-t`}
        style={{ backgroundColor: theme.background, borderTopColor: theme.border }}
      >
        <Button title="Create Shop" loading={saving} onPress={handleCreateShop} fullWidth />
      </View>
    </SafeAreaView>
  );
}
