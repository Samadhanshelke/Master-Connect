export type ShopItem = {
  id: string;
  name: string;
  price: string;
  description: string;
  type: 'product' | 'service';
};

export type ShopRecord = {
  id: string;
  ownerId: string;
  ownerName: string;
  name: string;
  category: string;
  description: string;
  location: string;
  city: string;
  contactNumber: string;
  bannerImage: string | null;
  images: string[];
  openingTime: string;
  closingTime: string;
  items: ShopItem[];
  createdAt: string;
};

export type JobStatus = 'active' | 'closed';

export type JobRecord = {
  id: string;
  ownerId: string;
  orgName: string;
  position: string;
  contact: string;
  address: string;
  city: string;
  status: JobStatus;
  createdAt: string;
};
