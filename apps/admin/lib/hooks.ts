'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from './api';
import { useAuth } from './auth';

export function useApiList<T>(path: string | null) {
  const { token } = useAuth();
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(Boolean(path));
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!path) {
      setItems([]);
      setLoading(false);
      return;
    }
    if (!token) return;
    setLoading(true);
    try {
      const data = await apiFetch<T[]>(path);
      setItems(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
    } finally {
      setLoading(false);
    }
  }, [path, token]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { items, loading, error, reload };
}
