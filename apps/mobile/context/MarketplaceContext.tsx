import { useAuth } from '@/context/AuthContext';
import { useUserProfile } from '@/context/UserProfileContext';
import {
  cityFromLocation,
  createJob as createJobDoc,
  createShop as createShopDoc,
  deleteJob as deleteJobDoc,
  deleteShop as deleteShopDoc,
  subscribeToJobs,
  subscribeToShops,
  updateJobStatus as updateJobStatusDoc,
} from '@/services/marketplace';
import { JobRecord, JobStatus, ShopItem, ShopRecord } from '@/types/marketplace';
import { sameCity } from '@/utils/city';
import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';

type CreateShopInput = {
  name: string;
  category: string;
  description: string;
  location: string;
  contactNumber: string;
  bannerImage: string | null;
  images: string[];
  openingTime: string;
  closingTime: string;
  items: ShopItem[];
};

type CreateJobInput = {
  orgName: string;
  position: string;
  contact: string;
  address: string;
};

type MarketplaceContextType = {
  shops: ShopRecord[];
  jobs: JobRecord[];
  myShops: ShopRecord[];
  myJobs: JobRecord[];
  loading: boolean;
  createShop: (input: CreateShopInput) => Promise<string>;
  createJob: (input: CreateJobInput) => Promise<string>;
  deleteShop: (shopId: string) => Promise<void>;
  deleteJob: (jobId: string) => Promise<void>;
  updateJobStatus: (jobId: string, status: JobStatus) => Promise<void>;
  getShop: (shopId: string) => ShopRecord | undefined;
};

const MarketplaceContext = createContext<MarketplaceContextType | undefined>(undefined);

export function MarketplaceProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const [shops, setShops] = useState<ShopRecord[]>([]);
  const [jobs, setJobs] = useState<JobRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setShops([]);
      setJobs([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const unsubShops = subscribeToShops(
      (next) => {
        setShops(next);
        setLoading(false);
      },
      (error) => {
        console.error('Error loading shops:', error);
        setLoading(false);
      },
    );

    const unsubJobs = subscribeToJobs(setJobs, (error) => {
      console.error('Error loading jobs:', error);
    });

    return () => {
      unsubShops();
      unsubJobs();
    };
  }, [user]);

  const profileCity = profile?.location ? cityFromLocation(profile.location) : '';

  const cityShops = useMemo(
    () => shops.filter((shop) => !profileCity || sameCity(shop.city || shop.location, profileCity)),
    [shops, profileCity],
  );

  const cityJobs = useMemo(
    () => jobs.filter((job) => !profileCity || sameCity(job.city || job.address, profileCity)),
    [jobs, profileCity],
  );

  const myShops = useMemo(
    () => shops.filter((shop) => shop.ownerId === user?.uid),
    [shops, user?.uid],
  );

  const myJobs = useMemo(
    () => jobs.filter((job) => job.ownerId === user?.uid),
    [jobs, user?.uid],
  );

  const getShop = (shopId: string) => shops.find((shop) => shop.id === shopId) ?? cityShops.find((shop) => shop.id === shopId);

  const createShop = async (input: CreateShopInput) => {
    if (!user) throw new Error('You must be signed in');
    const city = profileCity || cityFromLocation(input.location);
    return createShopDoc({
      ownerId: user.uid,
      ownerName: profile?.name || user.email?.split('@')[0] || 'Owner',
      name: input.name.trim(),
      category: input.category.trim(),
      description: input.description.trim(),
      location: input.location.trim() || city,
      city,
      contactNumber: input.contactNumber.trim(),
      bannerImage: input.bannerImage,
      images: input.images,
      openingTime: input.openingTime.trim(),
      closingTime: input.closingTime.trim(),
      items: input.items,
    });
  };

  const createJob = async (input: CreateJobInput) => {
    if (!user) throw new Error('You must be signed in');
    const city = profileCity || cityFromLocation(input.address);
    return createJobDoc({
      ownerId: user.uid,
      orgName: input.orgName.trim(),
      position: input.position.trim(),
      contact: input.contact.trim(),
      address: input.address.trim() || city,
      city,
    });
  };

  const deleteShop = async (shopId: string) => {
    if (!user) throw new Error('You must be signed in');
    const shop = getShop(shopId);
    if (!shop || shop.ownerId !== user.uid) {
      throw new Error('You can only delete your own shops');
    }
    await deleteShopDoc(shopId);
  };

  const deleteJob = async (jobId: string) => {
    if (!user) throw new Error('You must be signed in');
    const job = jobs.find((item) => item.id === jobId);
    if (!job || job.ownerId !== user.uid) {
      throw new Error('You can only delete your own jobs');
    }
    await deleteJobDoc(jobId);
  };

  const updateJobStatus = async (jobId: string, status: JobStatus) => {
    if (!user) throw new Error('You must be signed in');
    const job = jobs.find((item) => item.id === jobId);
    if (!job || job.ownerId !== user.uid) {
      throw new Error('You can only update your own jobs');
    }
    await updateJobStatusDoc(jobId, status);
  };

  return (
    <MarketplaceContext.Provider
      value={{
        shops: cityShops,
        jobs: cityJobs,
        myShops,
        myJobs,
        loading,
        createShop,
        createJob,
        deleteShop,
        deleteJob,
        updateJobStatus,
        getShop,
      }}
    >
      {children}
    </MarketplaceContext.Provider>
  );
}

export function useMarketplace() {
  const context = useContext(MarketplaceContext);
  if (context === undefined) {
    throw new Error('useMarketplace must be used within a MarketplaceProvider');
  }
  return context;
}
