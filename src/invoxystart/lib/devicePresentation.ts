import type { Device } from '../api/types';

/** Keep transport/build identifiers out of the user-facing device summary. */
export function devicePresentation(device: Partial<Device>) {
  const userAgent = device.user_agent || '';
  const isInvoxy = /(?:^|[\s(;])InvoxyVPN\//i.test(userAgent);
  const clientName = userAgent.match(/^([a-z][a-z0-9 ._-]{0,30})\//i)?.[1]?.trim();
  const client = isInvoxy
    ? 'Invoxy VPN'
    : clientName && !/^(mozilla|curl|https?)$/i.test(clientName)
      ? clientName
      : 'Неизвестный клиент';
  const platform =
    device.platform && !/^unknown$/i.test(device.platform) ? device.platform : 'ОС неизвестна';
  const version = device.os_version?.match(/(?:^|\s)(\d+)(?:\.(\d+))?/);
  const shortVersion = version
    ? version[1] + (/^(macos|ios)$/i.test(platform) && version[2] ? '.' + version[2] : '')
    : '';
  const os = [platform, shortVersion].filter(Boolean).join(' ');
  // created_at historically contains a fallback registration date, not last activity.
  const seen = device.last_seen_at ? new Date(device.last_seen_at) : null;
  const lastSeen =
    seen && Number.isFinite(seen.getTime())
      ? seen.toLocaleString('ru-RU', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      : null;
  return { client, isInvoxy, os, lastSeen };
}
