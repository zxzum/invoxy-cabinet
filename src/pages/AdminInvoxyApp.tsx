import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '../api/client';
import { usePlatform } from '../platform/hooks/usePlatform';
import { usePermissionStore } from '@/store/permissions';
import { BackIcon } from '@/components/icons';

interface AppStats {
  days: number;
  active_devices: number;
  platforms: { platform: string; app_version: string | null; devices: number }[];
  connect_ok: number;
  connect_failed: number;
  errors: { code: string; count: number }[];
}

interface AppDeviceRow {
  id: number;
  platform: string;
  os_version: string | null;
  app_version: string | null;
  last_seen_at: string | null;
  last_connect_ok: boolean | null;
  last_error_code: string | null;
  user: { id: number; username: string | null; telegram_id: number | null } | null;
}

interface AppRouting {
  version: string;
  normal: { android_packages: string[] };
  restricted: { domains: string[]; android_packages: string[] };
}

const PLATFORMS = ['', 'android', 'ios', 'macos', 'windows'];

const fetchJson = async <T,>(url: string, params?: Record<string, unknown>) =>
  (await apiClient.get<T>(url, { params })).data;

export default function AdminInvoxyApp() {
  const navigate = useNavigate();
  const { capabilities } = usePlatform();
  const canEdit = usePermissionStore((s) => s.hasPermission('settings:edit'));
  const [search, setSearch] = useState('');
  const [platform, setPlatform] = useState('');
  const [failing, setFailing] = useState(false);

  const stats = useQuery({
    queryKey: ['admin-invoxy-app-stats'],
    queryFn: () => fetchJson<AppStats>('/cabinet/admin/app/stats', { days: 7 }),
  });
  const devices = useQuery({
    queryKey: ['admin-invoxy-app-devices', search, platform, failing],
    queryFn: () =>
      fetchJson<{ total: number; items: AppDeviceRow[] }>('/cabinet/admin/app/devices', {
        search,
        platform,
        failing,
      }),
  });

  const s = stats.data;
  const attempts = (s?.connect_ok ?? 0) + (s?.connect_failed ?? 0);
  const successRate = attempts ? Math.round(((s?.connect_ok ?? 0) / attempts) * 100) : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        {!capabilities.hasBackButton && (
          <button
            onClick={() => navigate('/admin')}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-dark-700 bg-dark-800 transition-colors hover:border-dark-600"
            aria-label="Назад"
          >
            <BackIcon className="h-5 w-5 text-dark-400" />
          </button>
        )}
        <h1 className="text-2xl font-bold text-dark-50 sm:text-3xl">Приложение Invoxy VPN</h1>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Активных устройств за 7 дней" value={s?.active_devices} />
        <Stat label="Успешных подключений" value={s?.connect_ok} />
        <Stat label="Ошибок подключения" value={s?.connect_failed} />
        <Stat label="Успешность" value={successRate === null ? '—' : `${successRate}%`} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card p-4">
          <h2 className="mb-3 font-semibold text-dark-100">Платформы и версии</h2>
          <SimpleTable
            rows={(s?.platforms ?? []).map((p) => [p.platform, p.app_version ?? '—', p.devices])}
            headers={['Платформа', 'Версия', 'Устройств']}
          />
        </div>
        <div className="card p-4">
          <h2 className="mb-3 font-semibold text-dark-100">Типы ошибок</h2>
          <SimpleTable
            rows={(s?.errors ?? []).map((e) => [e.code, e.count])}
            headers={['Код', 'Количество']}
          />
        </div>
      </div>

      <div className="card space-y-3 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="mr-auto font-semibold text-dark-100">Устройства</h2>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ID, Telegram ID, username, email"
            className="input w-56"
          />
          <select
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
            className="input w-36"
          >
            {PLATFORMS.map((p) => (
              <option key={p} value={p}>
                {p || 'Все платформы'}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-2 text-sm text-dark-300">
            <input
              type="checkbox"
              checked={failing}
              onChange={(e) => setFailing(e.target.checked)}
            />
            Только с ошибкой
          </label>
        </div>
        <SimpleTable
          headers={['Пользователь', 'Платформа', 'Версия', 'Активность', 'Последнее подключение']}
          rows={(devices.data?.items ?? []).map((d) => [
            d.user ? (
              <Link
                key="u"
                to={`/admin/users/${d.user.id}`}
                className="text-accent-400 hover:underline"
              >
                {d.user.username ? `@${d.user.username}` : `#${d.user.id}`}
              </Link>
            ) : (
              'только ключ'
            ),
            `${d.platform} ${d.os_version ?? ''}`.trim(),
            d.app_version ?? '—',
            d.last_seen_at ? new Date(d.last_seen_at).toLocaleString('ru-RU') : '—',
            d.last_connect_ok === null
              ? '—'
              : d.last_connect_ok
                ? 'успешно'
                : `ошибка: ${d.last_error_code ?? 'unknown'}`,
          ])}
        />
        <p className="text-xs text-dark-500">
          Всего: {devices.data?.total ?? 0}. ID устройства хранится в виде хэша, IP и адреса сайтов
          не собираются; события подключений хранятся 30 дней.
        </p>
      </div>

      <RoutingEditor canEdit={canEdit} />
    </div>
  );
}

const splitList = (value: string) => value.split(/\s+/).filter(Boolean);

function RoutingEditor({ canEdit }: { canEdit: boolean }) {
  const queryClient = useQueryClient();
  const { data } = useQuery({
    queryKey: ['admin-invoxy-app-routing'],
    queryFn: () => fetchJson<AppRouting>('/cabinet/admin/app/routing'),
  });
  const [draft, setDraft] = useState<Record<string, string>>({});
  const fields = {
    normalPackages: draft.normalPackages ?? data?.normal.android_packages.join('\n') ?? '',
    domains: draft.domains ?? data?.restricted.domains.join('\n') ?? '',
    packages: draft.packages ?? data?.restricted.android_packages.join('\n') ?? '',
  };
  const save = useMutation({
    mutationFn: async () =>
      (
        await apiClient.put<AppRouting>('/cabinet/admin/app/routing', {
          normal: { android_packages: splitList(fields.normalPackages) },
          restricted: {
            domains: splitList(fields.domains),
            android_packages: splitList(fields.packages),
          },
        })
      ).data,
    onSuccess: (saved) => {
      queryClient.setQueryData(['admin-invoxy-app-routing'], saved);
      setDraft({});
    },
  });
  const area = (key: keyof typeof fields, label: string) => (
    <label className="space-y-1 text-sm text-dark-300">
      {label}
      <textarea
        value={fields[key]}
        disabled={!canEdit}
        onChange={(e) => setDraft({ ...draft, [key]: e.target.value })}
        rows={8}
        className="input w-full font-mono text-xs"
      />
    </label>
  );

  return (
    <div className="card space-y-3 p-4">
      <div>
        <h2 className="font-semibold text-dark-100">Маршрутизация приложения</h2>
        <p className="text-sm text-dark-400">
          Обычная сеть: перечисленные Android-приложения целиком идут мимо VPN. «Белые списки»:
          кандидаты для прямого доступа — приложение применяет домен только после проверки, что он
          открывается напрямую. Версия: {data?.version ?? '—'}
        </p>
      </div>
      <div className="grid gap-3 lg:grid-cols-3">
        {area('normalPackages', 'Обычная сеть: приложения напрямую')}
        {area('domains', 'Белые списки: домены (поддомены включаются)')}
        {area('packages', 'Белые списки: приложения напрямую')}
      </div>
      {canEdit && (
        <button
          type="button"
          disabled={!Object.keys(draft).length || save.isPending}
          onClick={() => save.mutate()}
          className="btn-primary"
        >
          {save.isPending ? 'Сохраняем…' : 'Сохранить'}
        </button>
      )}
      {save.isError && <p className="text-sm text-error-400">Не удалось сохранить.</p>}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string | undefined }) {
  return (
    <div className="card p-4">
      <div className="text-2xl font-bold text-dark-50">{value ?? '—'}</div>
      <div className="text-xs text-dark-400">{label}</div>
    </div>
  );
}

function SimpleTable({ headers, rows }: { headers: string[]; rows: React.ReactNode[][] }) {
  if (!rows.length) return <p className="text-sm text-dark-500">Нет данных</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="text-xs text-dark-400">
          <tr>
            {headers.map((h) => (
              <th key={h} className="py-1 pr-3 font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="text-dark-200">
          {rows.map((row, i) => (
            <tr key={i} className="border-t border-dark-800">
              {row.map((cell, j) => (
                <td key={j} className="py-1.5 pr-3">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
