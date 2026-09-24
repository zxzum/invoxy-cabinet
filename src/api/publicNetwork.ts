import apiClient from './client';
import {
  NETWORK_SNAPSHOT_NODES,
  NETWORK_SUMMARY,
  type NetworkNode,
  type NetworkSummary,
} from '@/data/networkSnapshot';

export interface PublicNetworkStatusResponse {
  nodes: NetworkNode[];
  summary: NetworkSummary;
}

export async function fetchPublicNetworkStatus(): Promise<PublicNetworkStatusResponse> {
  try {
    const response = await apiClient.get<{
      nodes?: Array<{
        id?: string;
        country?: string;
        countryName?: string;
        flagEmoji?: string;
        label?: string;
        mode?: 'reality' | 'lte';
        ping?: number;
        load?: number;
        status?: 'online' | 'busy' | 'maintenance';
        description?: string;
        recommendation?: string;
      }>;
      summary?: Partial<NetworkSummary>;
    }>('/cabinet/public/network-status');

    const data = response.data;
    if (data && Array.isArray(data.nodes) && data.nodes.length > 0) {
      const nodes: NetworkNode[] = data.nodes.map((n, idx) => ({
        id: n.id || `node-${idx}`,
        country: n.country || 'EU',
        countryName: n.countryName || 'Европа',
        flagEmoji: n.flagEmoji || '🌐',
        label: n.label || `NODE-0${idx + 1}`,
        mode: n.mode === 'lte' ? 'lte' : 'reality',
        ping: typeof n.ping === 'number' ? Math.round(n.ping) : 25 + idx * 3,
        load:
          typeof n.load === 'number'
            ? Math.min(100, Math.max(5, Math.round(n.load)))
            : 30 + idx * 5,
        status: n.status || 'online',
        description: n.description || 'Высокоскоростной защищенный узел',
        recommendation:
          n.recommendation ||
          (n.mode === 'lte'
            ? 'Режим LTE — для обхода фильтров'
            : 'Рекомендуем для стриминга и Wi-Fi'),
      }));

      const summary: NetworkSummary = {
        onlineNodes: data.summary?.onlineNodes || `${nodes.length}/${nodes.length}`,
        medianPing: typeof data.summary?.medianPing === 'number' ? data.summary.medianPing : 28,
        packetLoss: data.summary?.packetLoss || '<0.1%',
        encryption: data.summary?.encryption || 'XTLS-Vision',
      };

      return { nodes, summary };
    }
  } catch {
    // Silent fallback to local snapshot
  }

  return {
    nodes: NETWORK_SNAPSHOT_NODES,
    summary: NETWORK_SUMMARY,
  };
}
