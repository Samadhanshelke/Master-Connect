import { BannerRecord } from '@/types/banner';
import { apiFetch, poll, Unsubscribe } from './api';

export function todayDateKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function parseDateKey(dateStr: string) {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, (month || 1) - 1, day || 1);
}

export function isBannerBlockingDate(banner: BannerRecord) {
  return banner.status !== 'rejected';
}

export function subscribeToBanners(
  onChange: (banners: BannerRecord[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  return poll(() => apiFetch<BannerRecord[]>('/v1/banners'), onChange, onError);
}

export async function createBanner(input: {
  ownerId: string;
  ownerName: string;
  date: string;
  imageUri: string;
  autoApprove?: boolean;
}): Promise<string> {
  const banner = await apiFetch<BannerRecord>('/v1/banners', {
    method: 'POST',
    body: JSON.stringify({
      date: input.date,
      imageUri: input.imageUri,
      ownerName: input.ownerName,
    }),
  });
  return banner.id;
}

export async function payForBanner(bannerId: string): Promise<void> {
  await apiFetch(`/v1/banners/${bannerId}/pay`, { method: 'POST', body: '{}' });
}

export async function updateBannerStatus(bannerId: string, status: BannerRecord['status']): Promise<void> {
  if (status === 'pending') return;
  await apiFetch(`/v1/banners/${bannerId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}
