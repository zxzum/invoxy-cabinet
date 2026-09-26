// @vitest-environment jsdom
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { LazeikaMigrationModal } from './LazeikaMigrationModal';
import { migrationApi } from '@/api/migrationApi';

vi.mock('@/api/migrationApi', () => ({
  migrationApi: {
    check: vi.fn(),
    execute: vi.fn(),
  },
}));

vi.mock('@/platform', () => ({
  useHaptic: () => ({
    notification: vi.fn(),
    impact: vi.fn(),
    selection: vi.fn(),
  }),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, unknown>) => {
      if (params && params.count !== undefined) {
        return `${key}:${params.count}`;
      }
      return key;
    },
    i18n: { language: 'ru' },
  }),
}));

describe('LazeikaMigrationModal', () => {
  const candidate = {
    lazeika_tariff_name: 'Премиум',
    target_tariff_name: 'Премиум LTE',
    remaining_days: 18,
    bonus_days: 5,
    total_days: 23,
    device_limit: 10,
    traffic_limit_gb: 1000,
    whitelist_traffic_limit_gb: 150,
    expires_at: '19.10.2026',
  };

  const onClose = vi.fn();
  const onMigrated = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders nothing when isOpen is false', () => {
    const { container } = render(
      <LazeikaMigrationModal
        isOpen={false}
        candidate={candidate}
        onClose={onClose}
        onMigrated={onMigrated}
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders migration prompt with candidate details when isOpen is true', () => {
    render(
      <LazeikaMigrationModal
        isOpen={true}
        candidate={candidate}
        onClose={onClose}
        onMigrated={onMigrated}
      />,
    );

    expect(screen.getByText('lazeikaMigration.title')).toBeTruthy();
    expect(screen.getByText('Премиум LTE')).toBeTruthy();
    expect(screen.getByText('10')).toBeTruthy(); // device limit
    expect(screen.getByText('lazeikaMigration.migrateBtn')).toBeTruthy();
    expect(screen.getByText('lazeikaMigration.laterBtn')).toBeTruthy();
  });

  it('calls onClose when "Later" button is clicked', () => {
    render(
      <LazeikaMigrationModal
        isOpen={true}
        candidate={candidate}
        onClose={onClose}
        onMigrated={onMigrated}
      />,
    );

    fireEvent.click(screen.getByText('lazeikaMigration.laterBtn'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('executes migration and transitions to success', async () => {
    vi.mocked(migrationApi.execute).mockResolvedValueOnce({
      success: true,
      result: {
        tariff_name: 'Премиум LTE',
        total_days: 23,
        device_limit: 10,
        end_date_str: '19.10.2026',
        traffic_limit_gb: 1000,
        whitelist_traffic_limit_gb: 150,
        subscription_url: 'https://panel.lazeika.xyz/sub/fixture',
        message: 'Подписка успешно перенесена!',
      },
    });

    render(
      <LazeikaMigrationModal
        isOpen={true}
        candidate={candidate}
        onClose={onClose}
        onMigrated={onMigrated}
      />,
    );

    fireEvent.click(screen.getByText('lazeikaMigration.migrateBtn'));

    // Migrating state
    await waitFor(() => {
      expect(screen.getByText('lazeikaMigration.progress.title')).toBeTruthy();
    });
    expect(migrationApi.execute).toHaveBeenCalledTimes(1);

    // Transitions to success
    await waitFor(
      () => {
        expect(screen.getByText('lazeikaMigration.success.title')).toBeTruthy();
      },
      { timeout: 3000 },
    );

    expect(screen.getByText('19.10.2026 (23 дн.)')).toBeTruthy();

    // Click finish button
    fireEvent.click(screen.getByText('lazeikaMigration.success.okBtn'));
    expect(onMigrated).toHaveBeenCalledWith(
      expect.objectContaining({
        tariff_name: 'Премиум LTE',
        total_days: 23,
      }),
    );
    expect(onClose).toHaveBeenCalled();
  });

  it('shows error state when execution fails', async () => {
    vi.mocked(migrationApi.execute).mockRejectedValueOnce(
      new Error('Network error or server unavailable'),
    );

    render(
      <LazeikaMigrationModal
        isOpen={true}
        candidate={candidate}
        onClose={onClose}
        onMigrated={onMigrated}
      />,
    );

    fireEvent.click(screen.getByText('lazeikaMigration.migrateBtn'));

    await waitFor(() => {
      expect(screen.getByText('lazeikaMigration.error.title')).toBeTruthy();
    });

    expect(screen.getByText('lazeikaMigration.error.retry')).toBeTruthy();
    expect(screen.getByText('lazeikaMigration.error.close')).toBeTruthy();
  });
});
