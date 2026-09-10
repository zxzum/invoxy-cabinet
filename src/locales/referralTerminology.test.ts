import { describe, expect, it } from 'vitest';
import ru from './ru.json';

describe('русские названия приглашенных пользователей', () => {
  it('используются в пользовательской навигации и referral-странице', () => {
    expect(ru.nav.referral).toBe('Приглашенные');
    expect(ru.dashboard.stats.referrals).toBe('Приглашенные');
    expect(ru.referral.stats.totalReferrals).toBe('Всего приглашенных пользователей');
    expect(ru.referral.yourReferrals).toBe('Ваши приглашенные пользователи');
    expect(ru.referral.anonymousReferral).toBe('Приглашенный пользователь');
  });
});
