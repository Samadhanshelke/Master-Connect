import { useAuth } from '@/context/AuthContext';
import { useUserProfile } from '@/context/UserProfileContext';
import {
  createBanner as createBannerDoc,
  isBannerBlockingDate,
  payForBanner as payForBannerDoc,
  subscribeToBanners,
  todayDateKey,
  updateBannerStatus,
} from '@/services/banners';
import { BannerRecord } from '@/types/banner';
import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';

type BannersContextType = {
  banners: BannerRecord[];
  myBanners: BannerRecord[];
  pendingBanners: BannerRecord[];
  bookedDates: Set<string>;
  todayBanner: BannerRecord | null;
  loading: boolean;
  isAdmin: boolean;
  createBanner: (input: { date: string; imageUri: string }) => Promise<string>;
  payForBanner: (bannerId: string) => Promise<void>;
  approveBanner: (bannerId: string) => Promise<void>;
  rejectBanner: (bannerId: string) => Promise<void>;
  isDateBooked: (date: string) => boolean;
};

const BannersContext = createContext<BannersContextType | undefined>(undefined);

export function BannersProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const [banners, setBanners] = useState<BannerRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setBanners([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = subscribeToBanners(
      (next) => {
        setBanners(next);
        setLoading(false);
      },
      (error) => {
        console.error('Error loading banners:', error);
        setLoading(false);
      },
    );

    return unsubscribe;
  }, [user]);

  const myBanners = useMemo(
    () => banners.filter((banner) => banner.ownerId === user?.uid),
    [banners, user?.uid],
  );

  const bookedDates = useMemo(
    () => new Set(banners.filter(isBannerBlockingDate).map((banner) => banner.date)),
    [banners],
  );

  const todayBanner = useMemo(() => {
    const today = todayDateKey();
    return banners.find(
      (banner) => banner.date === today && banner.status === 'approved' && banner.paymentStatus === 'paid',
    ) ?? null;
  }, [banners]);

  const pendingBanners = useMemo(
    () => banners.filter((banner) => banner.status === 'pending'),
    [banners],
  );

  const isAdmin = profile?.role === 'admin';
  const isDateBooked = (date: string) => bookedDates.has(date);

  const createBanner = async (input: { date: string; imageUri: string }) => {
    if (!user) throw new Error('You must be signed in');
    if (isDateBooked(input.date)) {
      throw new Error('This date is already booked');
    }

    return createBannerDoc({
      ownerId: user.uid,
      ownerName: profile?.name || user.email?.split('@')[0] || 'User',
      date: input.date,
      imageUri: input.imageUri,
      autoApprove: isAdmin,
    });
  };

  const payForBanner = async (bannerId: string) => {
    if (!user) throw new Error('You must be signed in');
    const banner = banners.find((item) => item.id === bannerId);
    if (!banner || banner.ownerId !== user.uid) {
      throw new Error('You can only pay for your own banner');
    }
    if (banner.status !== 'approved') {
      throw new Error('Banner is not approved yet');
    }
    if (banner.paymentStatus === 'paid') {
      return;
    }
    await payForBannerDoc(bannerId);
  };

  const approveBanner = async (bannerId: string) => {
    if (!isAdmin) throw new Error('Only admins can approve banners');
    await updateBannerStatus(bannerId, 'approved');
  };

  const rejectBanner = async (bannerId: string) => {
    if (!isAdmin) throw new Error('Only admins can reject banners');
    await updateBannerStatus(bannerId, 'rejected');
  };

  return (
    <BannersContext.Provider
      value={{
        banners,
        myBanners,
        pendingBanners,
        bookedDates,
        todayBanner,
        loading,
        isAdmin,
        createBanner,
        payForBanner,
        approveBanner,
        rejectBanner,
        isDateBooked,
      }}
    >
      {children}
    </BannersContext.Provider>
  );
}

export function useBanners() {
  const context = useContext(BannersContext);
  if (context === undefined) {
    throw new Error('useBanners must be used within a BannersProvider');
  }
  return context;
}
