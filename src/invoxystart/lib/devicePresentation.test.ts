import { describe, expect, it } from 'vitest';
import { devicePresentation } from './devicePresentation';

describe('devicePresentation', () => {
  it.each([
    ['Android', '16', 'Happ/2.18.3/Android/2606241603501', 'Android 16', 'Happ'],
    ['Windows', '11_10.0.26200', 'Happ/2.18.3/Windows/2606241603501', 'Windows 11', 'Happ'],
    ['macOS', '14.8.5__23.6.0', 'Happ/4.3.0/macOS/2609151456603', 'macOS 14.8', 'Happ'],
    [
      'macOS',
      '15.0',
      'Happ/3.6.0 InvoxyVPN/1.0.0 (macOS 15.0; MacBookPro)',
      'macOS 15.0',
      'Invoxy VPN',
    ],
    ['Android', '16', 'v2rayNG/1.10.4', 'Android 16', 'v2rayNG'],
    ['iOS', '18.5', 'Shadowrocket/2.2.1', 'iOS 18.5', 'Shadowrocket'],
  ])(
    'summarizes %s without client/build numbers',
    (platform, os_version, user_agent, os, client) => {
      expect(devicePresentation({ platform, os_version, user_agent })).toMatchObject({
        os,
        client,
      });
    },
  );
  it('does not invent last activity from registration or invalid dates', () => {
    expect(devicePresentation({ created_at: '2026-10-09T10:00:00Z' }).lastSeen).toBeNull();
    expect(devicePresentation({ last_seen_at: 'invalid' }).lastSeen).toBeNull();
    expect(devicePresentation({ last_seen_at: '2026-10-09T10:00:00Z' }).lastSeen).toContain(
      '09.10.2026',
    );
  });
  it('handles missing data and ignores unrelated browser agents', () => {
    expect(devicePresentation({})).toMatchObject({
      os: 'ОС неизвестна',
      client: 'Неизвестный клиент',
    });
    expect(devicePresentation({ user_agent: 'Mozilla/5.0 (Android)' }).client).toBe(
      'Неизвестный клиент',
    );
    expect(devicePresentation({ user_agent: 'NotInvoxyVPN/1.0' }).isInvoxy).toBe(false);
  });
});
