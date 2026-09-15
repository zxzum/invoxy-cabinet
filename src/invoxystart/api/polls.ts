import apiClient from './client';
import type { PollAnswerResponse, PollInfo, PollStartResponse } from './types';

export const pollsApi = {
  getCount: (): Promise<{ count: number }> => apiClient.get('/cabinet/polls/count'),
  getPolls: (): Promise<PollInfo[]> => apiClient.get('/cabinet/polls'),
  getPollDetails: (responseId: number): Promise<PollInfo> =>
    apiClient.get(`/cabinet/polls/${responseId}`),
  startPoll: (responseId: number): Promise<PollStartResponse> =>
    apiClient.post(`/cabinet/polls/${responseId}/start`),
  answerQuestion: (
    responseId: number,
    questionId: number,
    optionId: number,
  ): Promise<PollAnswerResponse> =>
    apiClient.post(`/cabinet/polls/${responseId}/questions/${questionId}/answer`, {
      option_id: optionId,
    }),
};
