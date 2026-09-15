// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Device, DevicesConfig, RenewalOption, Subscription, TrafficPackage } from '@/types';
import LunaActiveDashboard from './LunaActiveDashboard';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback ?? key,
  }),
  initReactI18next: { type: '3rdParty', init: () => {} },
}));

vi.mock('@/hooks/useTheme', () => ({ useTheme: () => ({ isDark: true }) }));

afterEach(cleanup);

const subscription: Subscription = {
  id: 42,
  status: 'active',
  is_trial: false,
  start_date: '2026-09-01T00:00:00Z',
  end_date: '2026-10-01T00:00:00Z',
  days_left: 16,
  hours_left: 0,
  minutes_left: 0,
  time_left_display: '16 days',
  traffic_limit_gb: 100,
  traffic_used_gb: 18,
  traffic_used_percent: 18,
  whitelist_traffic_limit_gb: 50,
  whitelist_traffic_used_gb: 12,
  whitelist_traffic_used_percent: 24,
  device_limit: 5,
  connected_squads: [],
  servers: [],
  autopay_enabled: false,
  autopay_days_before: 3,
  subscription_url: null,
  hide_subscription_link: false,
  is_active: true,
  is_expired: false,
  is_limited: false,
  tariff_id: 7,
  tariff_name: 'Standard',
};

const devices: Device[] = [
  {
    hwid: 'phone',
    platform: 'iOS',
    device_model: 'Phone',
    local_name: 'Personal phone',
    created_at: '2026-09-10T00:00:00Z',
  },
];

const renewalOptions: RenewalOption[] = [
  {
    period_days: 30,
    price_kopeks: 39000,
    price_rubles: 390,
    discount_percent: 0,
    original_price_kopeks: null,
    is_highlighted: false,
  },
];

const regularTrafficPackages: TrafficPackage[] = [
  {
    gb: 100,
    scope: 'regular',
    price_kopeks: 5000,
    price_rubles: 50,
    is_unlimited: false,
  },
];

const lteTrafficPackages: TrafficPackage[] = [
  {
    gb: 50,
    scope: 'whitelist',
    price_kopeks: 15000,
    price_rubles: 150,
    is_unlimited: false,
  },
];

const devicesConfig: DevicesConfig = {
  min: 1,
  max: 10,
  default: 5,
  current: 5,
  price_per_device_kopeks: 3000,
  price_per_device_label: '30 ₽',
};

function renderDashboard(
  overrides: Partial<React.ComponentProps<typeof LunaActiveDashboard>> = {},
) {
  const callbacks = {
    onManageSubscription: vi.fn(),
    onManageDevices: vi.fn(),
    onRemoveDevice: vi.fn(),
    onCopyAccess: vi.fn(),
    onConnectHapp: vi.fn(),
    onConnectIncy: vi.fn(),
    onShowQr: vi.fn(),
    onSelectRenewal: vi.fn(),
    onSubmitRenewal: vi.fn(),
    onOpenRenewalOptions: vi.fn(),
    onOpenDeviceAddon: vi.fn(),
    onOpenTrafficAddon: vi.fn(),
    onOpenLteAddon: vi.fn(),
    onRefreshTraffic: vi.fn(),
  };

  render(
    <LunaActiveDashboard
      subscription={subscription}
      devices={devices}
      regularTraffic={{ usedGb: 18, limitGb: 100, percent: 18, isUnlimited: false }}
      lteTraffic={{ usedGb: 12, limitGb: 50, percent: 24, isUnlimited: false }}
      accessLink="https://example.test/access"
      happLink="happ://import/access"
      incyLink="incy://import/access"
      renewalOptions={renewalOptions}
      selectedRenewalPeriod={30}
      regularTrafficPackages={regularTrafficPackages}
      lteTrafficPackages={lteTrafficPackages}
      devicesConfig={devicesConfig}
      formatPrice={(option) => `${option.price_rubles} credits`}
      formatPackagePrice={(pkg) => `${pkg.price_rubles} credits`}
      formatDate={() => 'dynamic date'}
      {...callbacks}
      {...overrides}
    />,
  );

  return callbacks;
}

describe('Luna active dashboard', () => {
  it('renders the source anatomy with API-shaped props and routes actions through callbacks', () => {
    const callbacks = renderDashboard();

    expect(screen.getByRole('heading', { name: 'Standard' })).toBeTruthy();
    expect(screen.getByText(/dynamic date/)).toBeTruthy();
    expect(screen.getByText('18 / 100 GB')).toBeTruthy();
    expect(screen.getByText('12 / 50 GB')).toBeTruthy();
    expect(screen.getByText('Personal phone')).toBeTruthy();
    expect(screen.getByText('https://example.test/access')).toBeTruthy();
    expect(screen.getByText('30 days')).toBeTruthy();
    expect(screen.getByText('100 GB')).toBeTruthy();
    expect(screen.getByText('50 GB')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Manage subscription' }));
    fireEvent.click(screen.getByRole('button', { name: 'Manage devices' }));
    fireEvent.click(screen.getByRole('button', { name: 'Copy access link' }));
    fireEvent.click(screen.getByRole('button', { name: 'Connect in HAPP' }));
    fireEvent.click(screen.getByRole('button', { name: 'Connect in INCY' }));
    fireEvent.click(screen.getByRole('button', { name: 'Show QR code' }));
    fireEvent.click(screen.getByRole('button', { name: /30 days/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Renew subscription' }));
    fireEvent.click(screen.getByRole('button', { name: 'Add devices' }));
    fireEvent.click(screen.getByRole('button', { name: 'Add main traffic' }));
    fireEvent.click(screen.getByRole('button', { name: 'Add LTE traffic' }));

    expect(callbacks.onManageSubscription).toHaveBeenCalledOnce();
    expect(callbacks.onManageDevices).toHaveBeenCalledOnce();
    expect(callbacks.onCopyAccess).toHaveBeenCalledOnce();
    expect(callbacks.onConnectHapp).toHaveBeenCalledOnce();
    expect(callbacks.onConnectIncy).toHaveBeenCalledOnce();
    expect(callbacks.onShowQr).toHaveBeenCalledOnce();
    expect(callbacks.onSelectRenewal).toHaveBeenCalledWith(renewalOptions[0]);
    expect(callbacks.onSubmitRenewal).toHaveBeenCalledWith(renewalOptions[0]);
    expect(callbacks.onOpenDeviceAddon).toHaveBeenCalledOnce();
    expect(callbacks.onOpenTrafficAddon).toHaveBeenCalledWith(regularTrafficPackages[0]);
    expect(callbacks.onOpenLteAddon).toHaveBeenCalledWith(lteTrafficPackages[0]);
  });

  it('exposes loading and empty states without rendering business placeholders', () => {
    const { rerender } = render(
      <LunaActiveDashboard
        subscription={null}
        devices={[]}
        regularTraffic={null}
        lteTraffic={null}
        accessLink={null}
        happLink={null}
        incyLink={null}
        renewalOptions={[]}
        regularTrafficPackages={[]}
        lteTrafficPackages={[]}
        devicesConfig={null}
        isLoading
        emptyMessage="No active subscription"
      />,
    );

    expect(screen.getByRole('status', { name: 'Loading active subscription' })).toBeTruthy();
    expect(screen.queryByText(/Standard|credits|dynamic date/)).toBeNull();

    rerender(
      <LunaActiveDashboard
        subscription={null}
        devices={[]}
        regularTraffic={null}
        lteTraffic={null}
        accessLink={null}
        happLink={null}
        incyLink={null}
        renewalOptions={[]}
        regularTrafficPackages={[]}
        lteTrafficPackages={[]}
        devicesConfig={null}
        emptyMessage="No active subscription"
      />,
    );

    expect(screen.getByRole('status', { name: 'No active subscription' })).toBeTruthy();
    expect(screen.getByText('No active subscription')).toBeTruthy();
  });

  it('keeps child empty states accessible and disables unavailable actions', () => {
    renderDashboard({
      devices: [],
      lteTraffic: null,
      accessLink: null,
      happLink: null,
      incyLink: null,
      renewalOptions: [],
      regularTrafficPackages: [],
      lteTrafficPackages: [],
      devicesConfig: null,
    });

    expect(screen.getByText('No connected devices')).toBeTruthy();
    expect(screen.getByText('LTE traffic unavailable')).toBeTruthy();
    expect(screen.getByText('No renewal options')).toBeTruthy();
    expect(screen.getByText('No add-ons available')).toBeTruthy();
    expect(screen.getByText('Access link unavailable')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Connect in HAPP' })).toHaveProperty(
      'disabled',
      true,
    );
    expect(screen.getByRole('button', { name: 'Connect in INCY' })).toHaveProperty(
      'disabled',
      true,
    );
    expect(screen.getByRole('button', { name: 'Copy access link' })).toHaveProperty(
      'disabled',
      true,
    );
  });

  it('keeps target INCY and QR actions available when the connection page owns the link', () => {
    const callbacks = renderDashboard({
      accessLink: null,
      happLink: null,
      incyLink: null,
      incyAvailable: true,
      qrAvailable: true,
    });

    const incyButton = screen.getByRole('button', { name: 'Connect in INCY' });
    const qrButton = screen.getByRole('button', { name: 'Show QR code' });
    expect(incyButton).toHaveProperty('disabled', false);
    expect(qrButton).toHaveProperty('disabled', false);

    fireEvent.click(incyButton);
    fireEvent.click(qrButton);
    expect(callbacks.onConnectIncy).toHaveBeenCalledOnce();
    expect(callbacks.onShowQr).toHaveBeenCalledOnce();
  });

  it('passes copied state through to the connection action', () => {
    renderDashboard({ isCopied: true });

    expect(screen.getByRole('button', { name: 'Access link copied' })).toBeTruthy();
  });

  it('exposes the manual traffic refresh and respects its cooldown', () => {
    const callbacks = renderDashboard();
    const refreshButton = screen.getByRole('button', { name: 'Refresh traffic' });

    fireEvent.click(refreshButton);
    expect(callbacks.onRefreshTraffic).toHaveBeenCalledOnce();

    cleanup();
    renderDashboard({ trafficRefreshCooldown: 12 });
    const cooldownButton = screen.getByRole('button', { name: 'Refresh traffic (12s)' });
    expect(cooldownButton).toHaveProperty('disabled', true);
  });

  it('uses an honest renewal navigation CTA when no inline submit flow is provided', () => {
    const callbacks = renderDashboard({
      onSubmitRenewal: undefined,
      submitRenewalLabel: 'Open renewal options',
    });

    fireEvent.click(screen.getByRole('button', { name: 'Open renewal options' }));
    expect(callbacks.onOpenRenewalOptions).toHaveBeenCalledOnce();
  });
});
