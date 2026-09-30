import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui';
import { Colors } from '@/constants/theme';
import { useLanguage } from '@/context/LanguageContext';
import { useMarketplace } from '@/context/MarketplaceContext';
import { useUserProfile } from '@/context/UserProfileContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Linking, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const CATEGORIES = ['All', 'Grocery', 'Services', 'Clothing', 'Electronics', 'Food', 'Health'];

type Tab = 'shops' | 'jobs';

export default function ShopsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const { i18n } = useLanguage();
  const { shops, jobs, loading } = useMarketplace();
  const { profile } = useUserProfile();
  
  const [activeTab, setActiveTab] = useState<Tab>('shops');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredShops = useMemo(() => {
    return shops.filter(shop => {
      const matchesCategory = selectedCategory === 'All' || shop.category === selectedCategory;
      const matchesSearch = shop.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           shop.ownerName.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [shops, selectedCategory, searchQuery]);

  const activeJobs = useMemo(
    () => jobs.filter((job) => job.status === 'active'),
    [jobs],
  );

  const handleCallJob = (contact: string) => {
    Linking.openURL(`tel:${contact}`);
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: theme.background }} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View className="px-4 py-3 border-b" style={{ borderBottomColor: theme.border }}>
        <View className="flex-row justify-between items-center">
           <View className="flex-row gap-4">
              <TouchableOpacity 
                onPress={() => setActiveTab('shops')}
                className="pb-1 border-b-2"
                style={{ borderColor: activeTab === 'shops' ? theme.primary : 'transparent' }}
              >
                  <ThemedText 
                    className={`text-xl font-bold ${activeTab === 'shops' ? '' : 'opacity-50'}`}
                    style={{ color: activeTab === 'shops' ? theme.text : theme.textSecondary }}
                  >
                    {i18n.shops?.title || 'Shops'}
                  </ThemedText>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={() => setActiveTab('jobs')}
                className="pb-1 border-b-2"
                style={{ borderColor: activeTab === 'jobs' ? theme.primary : 'transparent' }}
              >
                  <ThemedText 
                    className={`text-xl font-bold ${activeTab === 'jobs' ? '' : 'opacity-50'}`}
                    style={{ color: activeTab === 'jobs' ? theme.text : theme.textSecondary }}
                  >
                    {i18n.jobs?.title || 'Jobs'}
                  </ThemedText>
              </TouchableOpacity>
           </View>

          {activeTab === 'shops' ? (
            <TouchableOpacity
              className="flex-row items-center gap-1 px-3 py-2 rounded-full"
              style={{ backgroundColor: theme.primary }}
              onPress={() => router.push('/create-shop')}
            >
              <Ionicons name="add" size={18} color="#fff" />
              <ThemedText className="font-semibold text-[13px]" style={{ color: '#ffffff' }}>{i18n.shops?.createShop || 'Create Shop'}</ThemedText>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              className="flex-row items-center gap-1 px-3 py-2 rounded-full"
              style={{ backgroundColor: theme.primary }}
              onPress={() => router.push('/create-job')}
            >
               <Ionicons name="add" size={18} color="#fff" />
              <ThemedText className="font-semibold text-[13px]" style={{ color: '#ffffff' }}>{i18n.jobs?.createJob || 'Create Job'}</ThemedText>
            </TouchableOpacity>
          )}
        </View>
        
        {/* Search */}
        {activeTab === 'shops' && (
          <View 
            className="flex-row items-center px-2.5 py-1.5 mt-3 rounded-lg border"
            style={{ backgroundColor: theme.surface, borderColor: theme.border }}
          >
            <Ionicons name="search" size={18} color={theme.textSecondary} />
            <TextInput
              className="flex-1 ml-2 text-[15px]"
              style={{ color: theme.text }}
              placeholder={i18n.shops?.searchShops || 'Search shops...'}
              placeholderTextColor={theme.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color={theme.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {/* Content */}
      {activeTab === 'shops' ? (
        <>
          {/* Categories */}
          <View style={{ height: 56, borderBottomWidth: 1, borderBottomColor: theme.border }}>
            <FlatList
              horizontal
              data={CATEGORIES}
              keyExtractor={(item) => item}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16, alignItems: 'center' }}
              renderItem={({ item: cat }) => (
                <TouchableOpacity
                  className="px-4 py-2 mr-2 rounded-full"
                  style={{
                    backgroundColor: selectedCategory === cat ? theme.primary : theme.surface,
                    borderWidth: 1,
                    borderColor: selectedCategory === cat ? theme.primary : theme.border,
                  }}
                  onPress={() => setSelectedCategory(cat)}
                >
                  <ThemedText 
                    className="font-semibold text-[13px]"
                    style={{ color: selectedCategory === cat ? '#fff' : theme.text }}
                  >
                    {cat}
                  </ThemedText>
                </TouchableOpacity>
              )}
            />
          </View>

          {/* Shops List */}
          <FlatList
            data={filteredShops}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: 16 }}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View className="items-center py-12">
                {loading ? (
                  <ActivityIndicator color={theme.primary} />
                ) : (
                  <>
                    <Ionicons name="storefront-outline" size={60} color={theme.textSecondary} />
                    <ThemedText className="mt-4 text-center" style={{ color: theme.textSecondary }}>
                      {i18n.shops?.noShopsFound || 'No shops found'}
                    </ThemedText>
                    <ThemedText className="text-sm text-center mt-1" style={{ color: theme.textSecondary }}>
                      Showing shops in {profile?.location || 'your city'}
                    </ThemedText>
                  </>
                )}
              </View>
            }
            renderItem={({ item }) => (
              <TouchableOpacity
                className="mb-4 rounded-xl overflow-hidden border"
                style={{ backgroundColor: theme.surface, borderColor: theme.border }}
                onPress={() => router.push(`/shop-details?id=${item.id}`)}
              >
                {item.bannerImage ? (
                  <Image source={{ uri: item.bannerImage }} className="w-full h-32" resizeMode="cover" />
                ) : (
                  <View 
                    className="h-32 items-center justify-center"
                    style={{ backgroundColor: theme.primary + '15' }}
                  >
                    <Ionicons name="storefront" size={40} color={theme.primary} />
                  </View>
                )}
                <View className="p-4">
                  <View className="flex-row justify-between items-start">
                    <View className="flex-1 pr-3">
                      <ThemedText type="defaultSemiBold" className="text-[16px]">{item.name}</ThemedText>
                      <ThemedText className="text-[13px]" style={{ color: theme.textSecondary }}>
                        by {item.ownerName}
                      </ThemedText>
                    </View>
                    <View 
                      className="px-2 py-1 rounded-full"
                      style={{ backgroundColor: theme.secondary + '30' }}
                    >
                      <ThemedText className="text-[11px] font-semibold" style={{ color: theme.secondary }}>
                        {item.category}
                      </ThemedText>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            )}
          />
        </>
      ) : (
        /* Jobs List */
        <FlatList
          data={activeJobs}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View className="items-center py-12">
              {loading ? (
                <ActivityIndicator color={theme.primary} />
              ) : (
                <>
                  <Ionicons name="briefcase-outline" size={60} color={theme.textSecondary} />
                  <ThemedText className="mt-4 text-center" style={{ color: theme.textSecondary }}>
                    {i18n.jobs?.noJobsFound || 'No jobs found'}
                  </ThemedText>
                  <ThemedText className="text-sm text-center mt-1" style={{ color: theme.textSecondary }}>
                    Showing jobs in {profile?.location || 'your city'}
                  </ThemedText>
                </>
              )}
            </View>
          }
          renderItem={({ item }) => (
            <View
              className="mb-4 rounded-xl p-4 border"
              style={{ backgroundColor: theme.surface, borderColor: theme.border }}
            >
              <View className="flex-row justify-between items-start mb-3">
                <View className="flex-1">
                  <ThemedText type="defaultSemiBold" className="text-lg">{item.position}</ThemedText>
                  <ThemedText className="font-medium" style={{ color: theme.primary }}>{item.orgName}</ThemedText>
                </View>
                <View 
                  className="w-10 h-10 rounded-full items-center justify-center"
                  style={{ backgroundColor: theme.primary + '15' }}
                >
                  <Ionicons name="briefcase" size={20} color={theme.primary} />
                </View>
              </View>

              <View className="gap-2 mb-4">
                <View className="flex-row items-center gap-2">
                  <Ionicons name="location-outline" size={16} color={theme.textSecondary} />
                  <ThemedText style={{ color: theme.textSecondary }} className="flex-1 text-sm">{item.address}</ThemedText>
                </View>
                <View className="flex-row items-center gap-2">
                  <Ionicons name="call-outline" size={16} color={theme.textSecondary} />
                  <ThemedText style={{ color: theme.textSecondary }} className="text-sm">{item.contact}</ThemedText>
                </View>
              </View>

              <Button
                title={i18n.jobs?.callNow || 'Call Now'}
                onPress={() => handleCallJob(item.contact)}
                style={{ backgroundColor: theme.success, marginTop: 4 }}
                fullWidth
                textStyle={{ color: '#fff' }}
                icon={<Ionicons name="call" size={18} color="#fff" />}
              />
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}
