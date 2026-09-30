export type NewsCategory =
  | 'general'
  | 'business'
  | 'technology'
  | 'sports'
  | 'entertainment'
  | 'health';

export type NewsArticle = {
  id: string;
  title: string;
  description: string;
  url: string;
  urlToImage: string | null;
  publishedAt: string;
  source: {
    name: string;
  };
  author: string | null;
};
