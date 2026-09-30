export function slugifyCity(city: string) {
  return city
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'city';
}

export function cityFromLocation(location: string) {
  return location.split(',')[0]?.trim() || location.trim();
}

export function sameCity(a?: string | null, b?: string | null) {
  if (!a || !b) return false;
  return slugifyCity(cityFromLocation(a)) === slugifyCity(cityFromLocation(b));
}

export function groupRoomId(city: string) {
  return `group_${slugifyCity(city)}`;
}
