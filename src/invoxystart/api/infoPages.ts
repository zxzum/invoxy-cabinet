import apiClient from './client';

export type InfoPageType = 'page' | 'faq';
export type ReplacesTab = 'faq' | 'rules' | 'privacy' | 'offer';
export type InfoPageDisplayMode = 'bot' | 'web' | 'both';

export interface InfoPage {
  id: number;
  slug: string;
  title: Record<string, string>;
  content: Record<string, string>;
  page_type: InfoPageType;
  is_active: boolean;
  sort_order: number;
  icon: string | null;
  replaces_tab: ReplacesTab | null;
  display_mode: InfoPageDisplayMode;
  created_at: string;
  updated_at: string | null;
}

export interface InfoPageListItem extends Omit<InfoPage, 'content' | 'created_at'> {}

export const infoPagesApi = {
  getTabReplacements: (): Promise<Record<ReplacesTab, string | null>> =>
    apiClient.get('/cabinet/info-pages/tab-replacements'),
  getPages: (pageType?: InfoPageType): Promise<InfoPageListItem[]> =>
    apiClient.get('/cabinet/info-pages', {
      params: pageType ? { page_type: pageType } : undefined,
    }),
  getPageBySlug: (slug: string): Promise<InfoPage> =>
    apiClient.get(`/cabinet/info-pages/${encodeURIComponent(slug)}`),
};
