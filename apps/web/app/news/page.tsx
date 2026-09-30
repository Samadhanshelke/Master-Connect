'use client';

import { Shell } from '@/components/Shell';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { NewsArticle } from '@master-connect/shared';
import { useEffect, useState } from 'react';

export default function NewsPage() {
  const { token } = useAuth();
  const [articles, setArticles] = useState<NewsArticle[]>([]);

  useEffect(() => {
    if (!token) return;
    apiFetch<NewsArticle[]>('/v1/news').then(setArticles).catch(() => setArticles([]));
  }, [token]);

  return (
    <Shell>
      <h1 className="mb-4 text-2xl font-semibold">News</h1>
      <div className="space-y-3">
        {articles.map((article) => (
          <article key={article.id} className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="font-semibold">{article.title}</p>
            <p className="mt-1 text-sm text-slate-600">{article.description}</p>
            <p className="mt-2 text-xs text-slate-500">{article.source.name}</p>
          </article>
        ))}
      </div>
    </Shell>
  );
}
