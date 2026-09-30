import { CityRecord } from '@/types/city';
import { apiFetch, poll, Unsubscribe } from './api';

export function subscribeToCities(
  onChange: (cities: CityRecord[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  return poll(() => apiFetch<CityRecord[]>('/v1/cities'), onChange, onError);
}

export async function createCity(name: string, _createdBy: string): Promise<CityRecord> {
  return apiFetch<CityRecord>('/v1/cities', {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}

export async function deleteCity(cityId: string): Promise<void> {
  await apiFetch(`/v1/cities/${cityId}`, { method: 'DELETE' });
}
