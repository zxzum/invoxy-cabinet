import { describe, expect, it } from 'vitest';
import { getTariffCustomerFacingName, getTariffMarketingDescription } from './tariffPresentation';

describe('getTariffMarketingDescription', () => {
  it('keeps the marketing copy and removes dynamic bullet facts', () => {
    expect(
      getTariffMarketingDescription(
        'Полный туннель: весь трафик идёт через VPN. • 350 ГБ в месяц • 3 устройства • 30 дней — 120 ₽',
      ),
    ).toBe('Полный туннель: весь трафик идёт через VPN.');
  });

  it('returns null for an empty description', () => {
    expect(getTariffMarketingDescription('   ')).toBe(null);
    expect(getTariffMarketingDescription(null)).toBe(null);
  });

  it('keeps trailing marketing copy and hides legacy technical terms', () => {
    expect(
      getTariffMarketingDescription(
        'С белыми списками: трафик через WHITELIST-ноды учитывается отдельно, остальное — по лимиту RemnaWave.\n\n• 50 ГБ WHITELIST-трафика\n\nОптимальный выбор на каждый день.',
        'LTE',
      ),
    ).toBe(
      'LTE: трафик через LTE учитывается отдельно, остальное — по лимиту VPN.\n\nОптимальный выбор на каждый день.',
    );
  });

  it('normalizes legacy tariff names for customers', () => {
    expect(getTariffCustomerFacingName('Премиум · WHITELIST')).toBe('Премиум · LTE');
  });
});
