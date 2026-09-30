import { NewsArticle, NewsCategory } from '@/types/news';
import { apiFetch } from './api';

export async function fetchNews(
  category: NewsCategory = 'general',
  options: { query?: string; signal?: AbortSignal } = {},
): Promise<NewsArticle[]> {
  const articles = await apiFetch<NewsArticle[]>(`/v1/news?category=${encodeURIComponent(category)}`);
  const query = options.query?.trim().toLowerCase();
  if (!query) return articles;
  return articles.filter((article) =>
    `${article.title} ${article.description || ''}`.toLowerCase().includes(query),
  );
}
