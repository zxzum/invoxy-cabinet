import { describe, expect, it } from 'vitest';
import { formatUserCard } from './copyUserCard';

describe('formatUserCard', () => {
  it('formats full user card with active subscription and LTE', () => {
    const card = formatUserCard({
      user: {
        id: 123,
        full_name: 'Ivan Ivanov',
        telegram_id: 99887766,
        username: 'ivan_vpn',
        email: 'ivan@example.com',
        status: 'active',
      },
      subscription: {
        tariff_name: 'Premium 1M',
        end_date: '2026-10-15T12:00:00Z',
        traffic_used_gb: 12.5,
        traffic_limit_gb: 50,
        whitelist_traffic_used_gb: 2.3,
        whitelist_traffic_limit_gb: 10,
      },
      formatDate: (d) => (d ? '15.10.2026' : '—'),
    });

    const expected = [
      'Invoxy user #123',
      'name: Ivan Ivanov',
      'telegram_id: 99887766',
      'username: @ivan_vpn',
      'email: ivan@example.com',
      'status: active',
      'sub: Premium 1M until 15.10.2026',
      'traffic: 12.5/50 GB',
      'lte: 2.3/10 GB',
    ].join('\n');

    expect(card).toBe(expected);
  });

  it('handles missing/empty fields with dashes', () => {
    const card = formatUserCard({
      user: {
        id: 456,
        full_name: '',
        telegram_id: null,
        username: null,
        email: '',
        status: 'active',
      },
      subscription: null,
    });

    const expected = [
      'Invoxy user #456',
      'name: —',
      'telegram_id: —',
      'username: —',
      'email: —',
      'status: active',
      'sub: — until —',
      'traffic: —/— GB',
      'lte: —/— GB',
    ].join('\n');

    expect(card).toBe(expected);
  });

  it('does not duplicate @ if username already has leading @', () => {
    const card = formatUserCard({
      user: {
        id: 789,
        full_name: 'Anna',
        telegram_id: 112233,
        username: '@annavpn',
        email: 'anna@test.com',
        status: 'trial',
      },
      subscription: {
        tariff_name: 'Basic',
        end_date: '2026-12-01',
        traffic_used_gb: 0,
        traffic_limit_gb: 100,
        whitelist_traffic_used_gb: 0,
        whitelist_traffic_limit_gb: 0,
      },
    });

    expect(card).toContain('username: @annavpn');
    expect(card).not.toContain('username: @@annavpn');
    expect(card).toContain('traffic: 0/100 GB');
    expect(card).toContain('lte: 0/0 GB');
  });

  it('never contains passwords, uuid or subscription urls', () => {
    const card = formatUserCard({
      user: {
        id: 100,
        full_name: 'Secret User',
        telegram_id: 445566,
      },
      subscription: {
        tariff_name: 'Unlimited',
        end_date: '2026-11-11',
        traffic_used_gb: 5,
        traffic_limit_gb: 50,
      },
    });

    expect(card).not.toMatch(/vless:/i);
    expect(card).not.toMatch(/uuid/i);
    expect(card).not.toMatch(/happ/i);
    expect(card).not.toMatch(/password/i);
  });
});
