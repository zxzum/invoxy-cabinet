import apiClient from './client';
import type { NewsArticle, NewsListResponse } from './types';

export const newsApi = {
  getNews: (params?: {
    category?: string;
    limit?: number;
    offset?: number;
  }): Promise<NewsListResponse> => apiClient.get('/cabinet/news', { params }),
  getArticle: (slug: string): Promise<NewsArticle> =>
    apiClient.get(`/cabinet/news/${encodeURIComponent(slug)}`),
};
