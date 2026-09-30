export const BANNER_PRICE = 499;

export type BannerStatus = 'pending' | 'approved' | 'rejected';
export type BannerPaymentStatus = 'unpaid' | 'paid';

export type BannerRecord = {
  id: string;
  ownerId: string;
  ownerName: string;
  date: string;
  imageUri: string;
  status: BannerStatus;
  paymentStatus: BannerPaymentStatus;
  price: number;
  createdAt: string;
  paidAt: string | null;
};
