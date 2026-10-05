import { useEffect, useState } from 'react';

export type InvoxyPlatform = 'android' | 'windows' | 'macos';

export interface InvoxyReleaseAsset {
  name: string;
  downloadUrl: string;
}

interface InvoxyRelease {
  version: string;
  assets: InvoxyReleaseAsset[];
}

const LATEST_URL = 'https://invoxy-updater.invoxy.workers.dev/latest';
const UPDATES_ORIGIN = new URL(LATEST_URL).origin;

function isReleaseAsset(value: unknown): value is InvoxyReleaseAsset {
  if (!value || typeof value !== 'object') return false;
  const asset = value as Record<string, unknown>;
  if (typeof asset.name !== 'string' || typeof asset.downloadUrl !== 'string') return false;

  try {
    const url = new URL(asset.downloadUrl);
    return url.origin === UPDATES_ORIGIN && /^\/download\/\d+(?:\/|$)/.test(url.pathname);
  } catch {
    return false;
  }
}

export function findInvoxyAsset(assets: InvoxyReleaseAsset[], platform: InvoxyPlatform) {
  const extensions = {
    android: ['.apk'],
    windows: ['.exe', '.msi', '.zip'],
    macos: ['.dmg', '.pkg', '.zip'],
  }[platform];
  const matching = assets.filter((asset) =>
    extensions.some((extension) => asset.name.toLowerCase().endsWith(extension)),
  );

  return platform === 'android'
    ? matching.find((asset) => asset.name.toLowerCase().includes('arm64')) || matching[0]
    : matching[0];
}

export function useLatestInvoxyRelease(enabled: boolean) {
  const [release, setRelease] = useState<InvoxyRelease | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (!enabled) return;

    const controller = new AbortController();
    const url = new URL(LATEST_URL);
    if (retryCount) url.searchParams.set('retry', String(retryCount));
    setStatus('loading');
    fetch(url, { cache: 'no-store', signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error('Release lookup failed');
        return response.json() as Promise<unknown>;
      })
      .then((payload) => {
        if (!payload || typeof payload !== 'object') throw new Error('Invalid release metadata');
        const data = payload as { version?: unknown; assets?: unknown };
        setRelease({
          version: typeof data.version === 'string' ? data.version : '',
          assets: Array.isArray(data.assets) ? data.assets.filter(isReleaseAsset) : [],
        });
        setStatus('ready');
      })
      .catch(() => {
        if (!controller.signal.aborted) setStatus('error');
      });

    return () => controller.abort();
  }, [enabled, retryCount]);

  return { release, status, retry: () => setRetryCount((count) => count + 1) };
}
