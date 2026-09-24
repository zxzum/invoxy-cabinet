import { describe, expect, it } from 'vitest';
import { findInvoxyAsset } from './invoxyDownloads';

describe('findInvoxyAsset', () => {
  it('selects the platform installer and prefers arm64 on Android', () => {
    const assets = [
      {
        name: 'universal.apk',
        downloadUrl: 'https://invoxy-updater.invoxy.workers.dev/download/1/universal.apk',
      },
      {
        name: 'app-arm64-v8a-release.apk',
        downloadUrl: 'https://invoxy-updater.invoxy.workers.dev/download/2/arm64.apk',
      },
      {
        name: 'Invoxy-Setup.exe',
        downloadUrl: 'https://invoxy-updater.invoxy.workers.dev/download/3/setup.exe',
      },
      {
        name: 'Invoxy_VPN_macOS.dmg',
        downloadUrl: 'https://invoxy-updater.invoxy.workers.dev/download/4/app.dmg',
      },
    ];

    expect(findInvoxyAsset(assets, 'android')).toBe(assets[1]);
    expect(findInvoxyAsset(assets, 'windows')).toBe(assets[2]);
    expect(findInvoxyAsset(assets, 'macos')).toBe(assets[3]);
  });
});
