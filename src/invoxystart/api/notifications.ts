import apiClient from './client';
import type { NotificationSettings } from './types';

export const notificationsApi = {
  getSettings: (): Promise<NotificationSettings> => apiClient.get('/cabinet/notifications'),
  updateSettings: (settings: Partial<NotificationSettings>): Promise<NotificationSettings> =>
    apiClient.patch('/cabinet/notifications', settings),
  sendTestNotification: (): Promise<{ success: boolean; message: string }> =>
    apiClient.post('/cabinet/notifications/test'),
  getHistory: (
    limit = 20,
    offset = 0,
  ): Promise<{ notifications: unknown[]; total: number; limit: number; offset: number }> =>
    apiClient.get('/cabinet/notifications/history', { params: { limit, offset } }),
  markAsRead: (id: number): Promise<{ success: boolean; id: number; read_at: string }> =>
    apiClient.post(`/cabinet/notifications/${id}/read`),
  markAllAsRead: (): Promise<{ success: boolean; updated_count: number }> =>
    apiClient.post('/cabinet/notifications/read-all'),
};
