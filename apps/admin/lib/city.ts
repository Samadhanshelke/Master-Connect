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

export function groupRoomId(city: string) {
  return `group_${slugifyCity(city)}`;
}

export function nowIso() {
  return new Date().toISOString();
}

export function formatDate(value?: string) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
