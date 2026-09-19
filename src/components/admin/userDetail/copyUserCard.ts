export interface CopyUserCardParams {
  user: {
    id: number;
    full_name?: string | null;
    telegram_id?: number | null;
    username?: string | null;
    email?: string | null;
    status?: string | null;
  };
  subscription?: {
    tariff_name?: string | null;
    end_date?: string | null;
    traffic_used_gb?: number | null;
    traffic_limit_gb?: number | null;
    whitelist_traffic_used_gb?: number | null;
    whitelist_traffic_limit_gb?: number | null;
  } | null;
  formatDate?: (date: string | null) => string;
}

export function formatUserCard(params: CopyUserCardParams): string {
  const { user, subscription, formatDate } = params;

  const id = user.id;
  const name = user.full_name?.trim() || '—';
  const telegramId = user.telegram_id ? String(user.telegram_id) : '—';
  const username = user.username?.trim() ? `@${user.username.trim().replace(/^@/, '')}` : '—';
  const email = user.email?.trim() || '—';
  const status = user.status?.trim() || '—';

  const tariffName = subscription?.tariff_name?.trim() || '—';
  let formattedEndDate = '—';
  if (subscription?.end_date) {
    formattedEndDate = formatDate
      ? formatDate(subscription.end_date)
      : subscription.end_date.slice(0, 10);
  }

  const formatGb = (val: number | null | undefined): string => {
    if (val == null) return '—';
    if (Number.isInteger(val)) return String(val);
    return val.toFixed(1);
  };

  const trafficUsed = formatGb(subscription?.traffic_used_gb);
  const trafficLimit = formatGb(subscription?.traffic_limit_gb);
  const lteUsed = formatGb(subscription?.whitelist_traffic_used_gb);
  const lteLimit = formatGb(subscription?.whitelist_traffic_limit_gb);

  return [
    `Invoxy user #${id}`,
    `name: ${name}`,
    `telegram_id: ${telegramId}`,
    `username: ${username}`,
    `email: ${email}`,
    `status: ${status}`,
    `sub: ${tariffName} until ${formattedEndDate}`,
    `traffic: ${trafficUsed}/${trafficLimit} GB`,
    `lte: ${lteUsed}/${lteLimit} GB`,
  ].join('\n');
}
