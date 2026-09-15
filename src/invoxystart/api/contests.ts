import apiClient from './client';
import type { ContestGameData, ContestInfo, ContestResult } from './types';

export const contestsApi = {
  getCount: (): Promise<{ count: number }> => apiClient.get('/cabinet/contests/count'),
  getContests: (): Promise<ContestInfo[]> => apiClient.get('/cabinet/contests'),
  getContestGame: (roundId: number): Promise<ContestGameData> =>
    apiClient.get(`/cabinet/contests/${roundId}`),
  submitAnswer: (roundId: number, answer: string): Promise<ContestResult> =>
    apiClient.post(`/cabinet/contests/${roundId}/answer`, { round_id: roundId, answer }),
};
