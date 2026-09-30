export type UserRole = 'citizen' | 'shop_owner' | 'admin';

export type UserProfile = {
  name: string;
  email: string;
  location: string;
  bio: string;
  createdAt: string;
  role: UserRole;
};

export type UserRecord = UserProfile & {
  onboardingCompleted: boolean;
  updatedAt: string;
};
