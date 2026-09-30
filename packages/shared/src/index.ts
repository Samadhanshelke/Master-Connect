export const BANNER_PRICE = 499;

export type UserRole = 'citizen' | 'shop_owner' | 'admin';
export type PostVisibility = 'local' | 'global';
export type BannerStatus = 'pending' | 'approved' | 'rejected';
export type BannerPaymentStatus = 'unpaid' | 'paid';
export type JobStatus = 'active' | 'closed';
export type NotificationType = 'like' | 'comment' | 'follow' | 'mention' | 'system';
export type ReportStatus = 'open' | 'resolved';

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  location: string;
  bio: string;
  onboardingCompleted: boolean;
  createdAt: string;
};

export type AuthResponse = {
  token: string;
  user: AuthUser;
};

export type CityRecord = {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  createdBy: string;
};

export type PostCommentRecord = {
  id: string;
  authorId: string;
  user: string;
  text: string;
  createdAt: string;
};

export type PostRecord = {
  id: string;
  authorId: string;
  authorName: string;
  content: string;
  visibility: PostVisibility;
  location: string;
  likesCount: number;
  likedBy: string[];
  comments: PostCommentRecord[];
  createdAt: string;
  attachment?: {
    type: 'image' | 'images' | 'poll' | 'document';
    url?: string;
    urls?: string[];
    pollOptions?: { text: string; votes: number }[];
    fileName?: string;
  } | null;
};

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

export type ChatGroup = {
  id: string;
  name: string;
  city: string;
  type: string;
  memberCount: number;
};

export type ChatMember = {
  id: string;
  name: string;
};

export type ChatMessageRecord = {
  id: string;
  authorId: string;
  authorName: string;
  text: string;
  createdAt: string;
};

export type ReportRecord = {
  id: string;
  postId: string;
  reporterId: string;
  authorId: string;
  content: string;
  status: ReportStatus;
  createdAt: string;
};

export type NotificationRecord = {
  id: string;
  type: NotificationType;
  recipientId: string;
  actorId: string;
  actorName: string;
  message: string;
  postId: string | null;
  isRead: boolean;
  createdAt: string;
};

export type NewsArticle = {
  id: string;
  title: string;
  description: string;
  url: string;
  urlToImage: string | null;
  publishedAt: string;
  source: { name: string };
  author: string | null;
};

export type OverviewStats = {
  cities: number;
  users: number;
  posts: number;
  rooms: number;
  shops: number;
  jobs: number;
  pendingBanners: number;
  openReports: number;
};

export function slugifyCity(city: string) {
  return (
    city
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'city'
  );
}

export function groupRoomId(city: string) {
  return `group_${slugifyCity(city)}`;
}

export const apiPaths = {
  health: '/health',
  register: '/v1/auth/register',
  login: '/v1/auth/login',
  firebase: '/v1/auth/firebase',
  me: ' /v1/auth/me'.trim(),
  overview: '/v1/admin/overview',
  users: '/v1/users',
  cities: '/v1/cities',
  posts: '/v1/posts',
  shops: '/v1/shops',
  jobs: '/v1/jobs',
  banners: '/v1/banners',
  rooms: '/v1/chat/rooms',
  reports: '/v1/reports',
  notifications: '/v1/notifications',
  news: '/v1/news',
} as const;
