import { apiClient } from './client';

export interface MigrationCandidate {
  lazeika_tariff_name: string;
  target_tariff_name: string;
  remaining_days: number;
  bonus_days: number;
  total_days: number;
  device_limit: number;
  traffic_limit_gb: number;
  whitelist_traffic_limit_gb: number;
  expires_at: string;
  balance_rub?: number;
}

export interface MigrationCheckResponse {
  eligible: boolean;
  candidate?: MigrationCandidate;
  reason?: string;
  error?: string;
}

export interface MigrationExecuteResult {
  tariff_name: string;
  total_days: number;
  device_limit: number;
  end_date_str: string;
  traffic_limit_gb: number;
  whitelist_traffic_limit_gb: number;
  subscription_url: string;
  balance_transferred_rub?: number;
  balance_kopeks?: number;
  message: string;
}

export interface MigrationExecuteResponse {
  success: boolean;
  result: MigrationExecuteResult;
}

export const migrationApi = {
  check: async (): Promise<MigrationCheckResponse> => {
    const response = await apiClient.get<MigrationCheckResponse>('/cabinet/migration/check');
    return response.data;
  },

  execute: async (): Promise<MigrationExecuteResponse> => {
    const response = await apiClient.post<MigrationExecuteResponse>('/cabinet/migration/execute');
    return response.data;
  },
};
