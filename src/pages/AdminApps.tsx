import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { adminAppsApi, type AppBanner } from '../api/adminApps';
import { usePlatform } from '../platform/hooks/usePlatform';
import { useNativeDialog } from '../platform/hooks/useNativeDialog';
import { useNotify } from '@/platform';
import { getApiErrorMessage } from '@/utils/api-error';
import { usePermissionStore } from '@/store/permissions';
import { BackIcon, PlusIcon, PencilIcon, TrashIcon } from '@/components/icons';
import { Skeleton, SkeletonGroup } from '@/components/ui/skeleton';

export default function AdminApps() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { capabilities } = usePlatform();
  const dialog = useNativeDialog();
  const notify = useNotify();
  const canEditBanners = usePermissionStore((state) => state.hasPermission('settings:edit'));

  // Remnawave status
  const { data: status } = useQuery({
    queryKey: ['remnawave-status'],
    queryFn: adminAppsApi.getRemnaWaveStatus,
    staleTime: 60000,
  });

  // Available configs
  const { data: configs, isLoading: isLoadingConfigs } = useQuery({
    queryKey: ['remnawave-configs-list'],
    queryFn: adminAppsApi.listRemnaWaveConfigs,
    staleTime: 30000,
  });

  // Set UUID mutation
  const setUuidMutation = useMutation({
    mutationFn: adminAppsApi.setRemnaWaveUuid,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['remnawave-status'] });
      queryClient.invalidateQueries({ queryKey: ['remnawave-config'] });
      queryClient.invalidateQueries({ queryKey: ['appConfig'] });
    },
  });

  const currentUuid = status?.config_uuid || '';

  // In-App Banners
  const { data: banners, isLoading: isLoadingBanners } = useQuery({
    queryKey: ['admin-app-banners'],
    queryFn: adminAppsApi.listAppBanners,
    staleTime: 10000,
  });

  const [isBannerModalOpen, setIsBannerModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<AppBanner | null>(null);
  const [bannerForm, setBannerForm] = useState({
    title: '',
    text: '',
    type: 'promo',
    action_url: '',
    is_active: true,
    sort_order: 0,
  });

  const handleOpenBannerModal = (banner?: AppBanner) => {
    if (banner) {
      setEditingBanner(banner);
      setBannerForm({
        title: banner.title,
        text: banner.text || '',
        type: banner.type || 'promo',
        action_url: banner.action_url || '',
        is_active: banner.is_active,
        sort_order: banner.sort_order ?? 0,
      });
    } else {
      setEditingBanner(null);
      setBannerForm({
        title: '',
        text: '',
        type: 'promo',
        action_url: '',
        is_active: true,
        sort_order: banners?.length || 0,
      });
    }
    setIsBannerModalOpen(true);
  };

  const saveBannerMutation = useMutation({
    mutationFn: async () => {
      if (editingBanner) {
        return await adminAppsApi.updateAppBanner(editingBanner.id, bannerForm);
      } else {
        return await adminAppsApi.createAppBanner(bannerForm);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-app-banners'] });
      setIsBannerModalOpen(false);
    },
    onError: (error) => {
      notify.error(getApiErrorMessage(error, 'Не удалось сохранить баннер'));
    },
  });

  const toggleBannerMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      return await adminAppsApi.updateAppBanner(id, { is_active });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-app-banners'] });
    },
    onError: (error) => {
      notify.error(getApiErrorMessage(error, 'Не удалось изменить баннер'));
    },
  });

  const deleteBannerMutation = useMutation({
    mutationFn: adminAppsApi.deleteAppBanner,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-app-banners'] });
    },
    onError: (error) => {
      notify.error(getApiErrorMessage(error, 'Не удалось удалить баннер'));
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        {!capabilities.hasBackButton && (
          <button
            onClick={() => navigate('/admin')}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-dark-700 bg-dark-800 transition-colors hover:border-dark-600"
          >
            <BackIcon className="h-5 w-5 text-dark-400" />
          </button>
        )}
        <h1 className="text-2xl font-bold text-dark-50 sm:text-3xl">{t('admin.apps.title')}</h1>
      </div>

      {/* Status card */}
      <div className="card p-4">
        <div className="flex items-center gap-3">
          <div
            className={`h-3 w-3 rounded-full ${status?.enabled ? 'bg-success-400' : 'bg-dark-600'}`}
          />
          <span className="text-sm font-medium text-dark-200">
            {status?.enabled
              ? t('admin.apps.remnaWaveConnected', 'Remnawave connected')
              : t('admin.apps.remnaWaveDisconnected', 'Remnawave not connected')}
          </span>
        </div>
        {status?.config_uuid && (
          <div className="mt-2 truncate font-mono text-xs text-dark-500">
            UUID: {status.config_uuid}
          </div>
        )}
      </div>

      {/* Available configs */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-dark-300">
          {t('admin.apps.availableConfigs', 'Available configs')}
        </h2>
        {isLoadingConfigs ? (
          <SkeletonGroup className="space-y-3">
            <Skeleton variant="card" count={3} className="h-16" />
          </SkeletonGroup>
        ) : configs && configs.length > 0 ? (
          <div className="space-y-2">
            {configs.map((config) => (
              <button
                key={config.uuid}
                onClick={() => {
                  if (config.uuid !== currentUuid) {
                    setUuidMutation.mutate(config.uuid);
                  }
                }}
                className={`w-full rounded-lg border p-4 text-left transition-colors ${
                  currentUuid === config.uuid
                    ? 'border-accent-500 bg-accent-500/10'
                    : 'border-dark-700 bg-dark-800/50 hover:border-dark-600'
                }`}
              >
                <div className="font-medium text-dark-100">{config.name}</div>
                <div className="mt-1 font-mono text-xs text-dark-500">{config.uuid}</div>
              </button>
            ))}
          </div>
        ) : (
          <div className="card py-8 text-center text-sm text-dark-500">
            {t('admin.apps.noConfigs', 'No configs available')}
          </div>
        )}
      </div>

      {/* In-App Banners for Invoxy Mobile & Desktop App */}
      <div className="space-y-4 pt-4 border-t border-dark-700/60">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-dark-50">In-App баннеры приложений</h2>
            <p className="text-xs text-dark-400 mt-0.5">
              Управление акциями, предупреждениями и объявлениями на главном экране Invoxy App
            </p>
          </div>
          {canEditBanners ? (
            <button
              onClick={() => handleOpenBannerModal()}
              className="flex items-center gap-1.5 rounded-xl bg-accent-500 px-3.5 py-2 text-xs font-semibold text-white transition-all hover:bg-accent-600 active:scale-95"
            >
              <PlusIcon className="h-4 w-4" />
              Добавить баннер
            </button>
          ) : (
            <span className="text-xs text-dark-500">Требуется право settings:edit</span>
          )}
        </div>

        {isLoadingBanners ? (
          <SkeletonGroup className="space-y-3">
            <Skeleton variant="card" count={2} className="h-20" />
          </SkeletonGroup>
        ) : banners && banners.length > 0 ? (
          <div className="space-y-3">
            {banners.map((b) => {
              const isPromo = b.type === 'promo' || b.type === 'mint';
              const isWarn = b.type === 'warning';
              return (
                <div
                  key={b.id}
                  className={`card relative p-4 transition-all ${!b.is_active ? 'opacity-50' : ''}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                            isPromo
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                              : isWarn
                                ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                                : 'bg-dark-700 text-dark-300 border border-dark-600'
                          }`}
                        >
                          {b.type.toUpperCase()}
                        </span>
                        <span className="text-xs text-dark-400 font-mono">#{b.id}</span>
                        <span className="text-xs text-dark-400">Порядок: {b.sort_order}</span>
                      </div>
                      <h4 className="font-semibold text-dark-100 text-sm">{b.title}</h4>
                      {b.text && <p className="text-xs text-dark-300 leading-relaxed">{b.text}</p>}
                      {b.action_url && (
                        <div className="mt-1 flex items-center gap-1 text-[11px] text-accent-400 truncate">
                          <span>Ссылка:</span>
                          <a
                            href={b.action_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline truncate hover:text-accent-300"
                          >
                            {b.action_url}
                          </a>
                        </div>
                      )}
                    </div>

                    {canEditBanners && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() =>
                            toggleBannerMutation.mutate({ id: b.id, is_active: !b.is_active })
                          }
                          className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${
                            b.is_active
                              ? 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30'
                              : 'bg-dark-700 text-dark-400 hover:bg-dark-600'
                          }`}
                        >
                          {b.is_active ? 'Активен' : 'Скрыт'}
                        </button>
                        <button
                          onClick={() => handleOpenBannerModal(b)}
                          className="p-1.5 rounded-lg text-dark-400 hover:text-dark-200 hover:bg-dark-700 transition-colors"
                          title="Редактировать"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={async () => {
                            const confirmed = await dialog.confirm(`Удалить баннер "${b.title}"?`);
                            if (confirmed) {
                              deleteBannerMutation.mutate(b.id);
                            }
                          }}
                          className="p-1.5 rounded-lg text-error-400 hover:text-error-300 hover:bg-error-500/10 transition-colors"
                          title="Удалить"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="card py-8 text-center text-sm text-dark-400">
            Нет созданных баннеров для приложения. Нажмите «Добавить баннер», чтобы создать.
          </div>
        )}
      </div>

      {/* Banner Create/Edit Modal */}
      {isBannerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-dark-700 bg-dark-900 p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-dark-50">
              {editingBanner ? 'Редактировать баннер' : 'Новый баннер приложения'}
            </h3>

            <div className="space-y-3 text-sm">
              <div>
                <label className="block text-xs font-medium text-dark-300 mb-1">
                  Заголовок баннера *
                </label>
                <input
                  type="text"
                  value={bannerForm.title}
                  onChange={(e) => setBannerForm({ ...bannerForm, title: e.target.value })}
                  placeholder="Скидка 30% на годовую подписку!"
                  className="w-full rounded-xl border border-dark-700 bg-dark-800 px-3 py-2 text-dark-100 placeholder-dark-500 focus:border-accent-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-dark-300 mb-1">
                  Описание / Текст
                </label>
                <textarea
                  value={bannerForm.text}
                  onChange={(e) => setBannerForm({ ...bannerForm, text: e.target.value })}
                  rows={3}
                  placeholder="Успейте продлить тариф по выгодной цене до конца недели."
                  className="w-full rounded-xl border border-dark-700 bg-dark-800 px-3 py-2 text-dark-100 placeholder-dark-500 focus:border-accent-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-dark-300 mb-1">
                    Стиль оформления
                  </label>
                  <select
                    value={bannerForm.type}
                    onChange={(e) => setBannerForm({ ...bannerForm, type: e.target.value })}
                    className="w-full rounded-xl border border-dark-700 bg-dark-800 px-3 py-2 text-dark-100 focus:border-accent-500 focus:outline-none"
                  >
                    <option value="promo">Promo (Мятный рупор)</option>
                    <option value="mint">Mint (Акцент)</option>
                    <option value="warning">Warning (Оранжевое предупреждение)</option>
                    <option value="info">Info (Нейтральный)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-dark-300 mb-1">
                    Порядок (0 = первый)
                  </label>
                  <input
                    type="number"
                    value={bannerForm.sort_order}
                    onChange={(e) =>
                      setBannerForm({
                        ...bannerForm,
                        sort_order: parseInt(e.target.value, 10) || 0,
                      })
                    }
                    className="w-full rounded-xl border border-dark-700 bg-dark-800 px-3 py-2 text-dark-100 focus:border-accent-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-dark-300 mb-1">
                  URL перехода по клику (опционально)
                </label>
                <input
                  type="url"
                  value={bannerForm.action_url}
                  onChange={(e) => setBannerForm({ ...bannerForm, action_url: e.target.value })}
                  placeholder="https://t.me/invoxy_news"
                  className="w-full rounded-xl border border-dark-700 bg-dark-800 px-3 py-2 text-dark-100 placeholder-dark-500 focus:border-accent-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="banner_active"
                  checked={bannerForm.is_active}
                  onChange={(e) => setBannerForm({ ...bannerForm, is_active: e.target.checked })}
                  className="h-4 w-4 rounded border-dark-600 bg-dark-800 text-accent-500 focus:ring-accent-500"
                />
                <label
                  htmlFor="banner_active"
                  className="text-xs font-medium text-dark-200 cursor-pointer"
                >
                  Отображать баннер в приложении (Активен)
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-dark-800">
              <button
                type="button"
                onClick={() => setIsBannerModalOpen(false)}
                className="rounded-xl border border-dark-700 px-4 py-2 text-xs font-medium text-dark-300 hover:bg-dark-800 transition-colors"
              >
                Отмена
              </button>
              <button
                type="button"
                disabled={!bannerForm.title.trim() || saveBannerMutation.isPending}
                onClick={() => saveBannerMutation.mutate()}
                className="rounded-xl bg-accent-500 px-4 py-2 text-xs font-semibold text-white hover:bg-accent-600 disabled:opacity-50 transition-all"
              >
                {saveBannerMutation.isPending ? 'Сохранение...' : 'Сохранить'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
