import apiClient from './client';
import { resolveApiBaseUrl } from '../../config/apiUrl';
import type {
  PaginatedResponse,
  Ticket,
  TicketDetail,
  TicketMediaItem,
  TicketMessage,
} from './types';

interface MediaParams {
  media_type?: string;
  media_file_id?: string;
  media_caption?: string;
  media_items?: TicketMediaItem[];
}

export interface MediaUploadResponse {
  media_type: string;
  file_id: string;
  file_unique_id: string | null;
  media_url: string;
}

export const ticketsApi = {
  getTickets: (params?: {
    page?: number;
    per_page?: number;
    status?: string;
  }): Promise<PaginatedResponse<Ticket>> => apiClient.get('/cabinet/tickets', { params }),
  createTicket: (title: string, message: string, media?: MediaParams): Promise<TicketDetail> =>
    apiClient.post('/cabinet/tickets', { title, message, ...media }),
  getTicket: (ticketId: number): Promise<TicketDetail> =>
    apiClient.get(`/cabinet/tickets/${ticketId}`),
  addMessage: (ticketId: number, message: string, media?: MediaParams): Promise<TicketMessage> =>
    apiClient.post(`/cabinet/tickets/${ticketId}/messages`, { message, ...media }),
  uploadMedia: async (file: File, mediaType = 'photo'): Promise<MediaUploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('media_type', mediaType);
    return apiClient.post('/cabinet/media/upload', formData);
  },
  getMediaUrl: (fileId: string, token?: string | null): string => {
    const suffix = token ? `?token=${encodeURIComponent(token)}` : '';
    return `${resolveApiBaseUrl(import.meta.env.VITE_API_URL).replace(/\/$/, '')}/cabinet/media/${encodeURIComponent(fileId)}${suffix}`;
  },
};
