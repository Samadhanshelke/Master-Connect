import { JobRecord, JobStatus, ShopRecord } from '@/types/marketplace';
import { apiFetch, poll, Unsubscribe } from './api';

export { cityFromLocation } from '@/utils/city';

export function subscribeToShops(
  onChange: (shops: ShopRecord[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  return poll(() => apiFetch<ShopRecord[]>('/v1/shops'), onChange, onError);
}

export function subscribeToJobs(
  onChange: (jobs: JobRecord[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  return poll(() => apiFetch<JobRecord[]>('/v1/jobs'), onChange, onError);
}

export function subscribeToShop(
  shopId: string,
  onChange: (shop: ShopRecord | null) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  return poll(async () => apiFetch<ShopRecord | null>(`/v1/shops/${shopId}`), onChange, onError);
}

export async function getShopRecord(shopId: string): Promise<ShopRecord | null> {
  return apiFetch<ShopRecord | null>(`/v1/shops/${shopId}`);
}

export async function createShop(input: Omit<ShopRecord, 'id' | 'createdAt'>): Promise<string> {
  const shop = await apiFetch<ShopRecord>('/v1/shops', {
    method: 'POST',
    body: JSON.stringify({
      name: input.name,
      city: input.city,
      category: input.category,
      description: input.description,
      contactNumber: input.contactNumber,
      openingTime: input.openingTime,
      closingTime: input.closingTime,
      ownerName: input.ownerName,
      location: input.location,
      bannerImage: input.bannerImage,
      images: input.images,
      items: input.items.map((item) => ({
        name: item.name,
        price: item.price,
        description: item.description,
        type: item.type,
      })),
    }),
  });
  return shop.id;
}

export async function deleteShop(shopId: string): Promise<void> {
  await apiFetch(`/v1/shops/${shopId}`, { method: 'DELETE' });
}

export async function createJob(input: Omit<JobRecord, 'id' | 'createdAt' | 'status'>): Promise<string> {
  const job = await apiFetch<JobRecord>('/v1/jobs', {
    method: 'POST',
    body: JSON.stringify({
      orgName: input.orgName,
      position: input.position,
      city: input.city,
      contact: input.contact,
    }),
  });
  return job.id;
}

export async function updateJobStatus(jobId: string, status: JobStatus): Promise<void> {
  await apiFetch(`/v1/jobs/${jobId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

export async function deleteJob(jobId: string): Promise<void> {
  await apiFetch(`/v1/jobs/${jobId}`, { method: 'DELETE' });
}
