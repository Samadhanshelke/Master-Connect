import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class NewsService {
  constructor(private config: ConfigService) {}

  async list(category = 'general') {
    const key = this.config.get<string>('NEWS_API_KEY');
    if (!key) {
      return [
        {
          id: 'sample-1',
          title: 'Welcome to Master Connect',
          description: 'Configure NEWS_API_KEY on the API to load live headlines.',
          url: 'https://newsapi.org',
          urlToImage: null,
          publishedAt: new Date().toISOString(),
          source: { name: 'Master Connect' },
          author: 'System',
        },
      ];
    }

    const url = `https://newsapi.org/v2/top-headlines?country=in&category=${encodeURIComponent(category)}&pageSize=20&apiKey=${key}`;
    const response = await fetch(url);
    const data = (await response.json()) as {
      articles?: Array<{
        title: string;
        description: string;
        url: string;
        urlToImage: string | null;
        publishedAt: string;
        source: { name: string };
        author: string | null;
      }>;
    };
    return (data.articles || []).map((article, index) => ({
      id: `${category}-${index}-${article.publishedAt}`,
      title: article.title,
      description: article.description,
      url: article.url,
      urlToImage: article.urlToImage,
      publishedAt: article.publishedAt,
      source: article.source,
      author: article.author,
    }));
  }
}
