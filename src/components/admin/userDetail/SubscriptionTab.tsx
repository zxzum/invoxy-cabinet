import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import {
  BackIcon,
  CheckIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  EditIcon,
  MinusIcon,
  PlusIcon,
  RefreshIcon,
  XIcon,
} from '@/components/icons';
import { DEVICE_ALIAS_MAX_LENGTH } from '../../../constants/devices';
import { createNumberInputHandler } from '../../../utils/inputHelpers';
import { getFlagEmoji } from '../../../utils/subscriptionHelpers';
import { Skeleton, SkeletonGroup } from '@/components/ui/skeleton';
import { DateField } from '@/components/DateField';
import TrafficProgressBar from '../../dashboard/TrafficProgressBar';
import type {
  UserAvailableTariff,
  UserPanelInfo,
  UserSubscriptionInfo,
  UserNodeUsageItem,
  SubscriptionRequestRecord,
} from '../../../api/adminUsers';

// ──────────────────────────────────────────────────────────────────
// Local helpers / icons. Each is small enough to live inline; the
// equivalents in the parent are kept because they're consumed by
// other code paths there.
// ──────────────────────────────────────────────────────────────────

const getCountryFlag = (code: string | null | undefined): string => getFlagEmoji(code);

function StatusBadge({ status }: { status: string }) {
  const { t } = useTranslation();
  const styles: Record<string, string> = {
    active: 'bg-success-500/20 text-success-400 border-success-500/30',
    blocked: 'bg-error-500/20 text-error-400 border-error-500/30',
    expired: 'bg-warning-500/20 text-warning-400 border-warning-500/30',
    trial: 'bg-accent-500/20 text-accent-400 border-accent-500/30',
    limited: 'bg-warning-500/20 text-warning-400 border-warning-500/30',
    deleted: 'bg-dark-600 text-dark-400 border-dark-500',
  };
  return (
    <span
      className={`rounded-full border px-2 py-0.5 text-xs font-medium ${styles[status] || styles.deleted}`}
    >
      {t(`admin.users.status.${status}`, status)}
    </span>
  );
}

// Local device row type (matches the parent's inline type)
type DeviceRow = {
  hwid: string;
  platform: string;
  device_model: string;
  created_at: string | null;
  local_name?: string | null;
};

// ──────────────────────────────────────────────────────────────────
// Subscription tab — single-sub detail view OR multi-sub list +
// detail. Many of the inputs (panelInfo, devices, tariffs, etc.)
// live in the parent because they're shared with the Info tab; this
// is a view facade.
// ──────────────────────────────────────────────────────────────────

export interface SubscriptionTabProps {
  // Selection
  userSubscriptions: UserSubscriptionInfo[];
  selectedSub: UserSubscriptionInfo | null;
  activeSubscriptionId: number | null;
  onActiveSubscriptionChange: (id: number) => void;
  subscriptionDetailView: boolean;
  onSubscriptionDetailViewChange: (open: boolean) => void;

  // Tariffs / current tariff
  tariffs: UserAvailableTariff[];
  currentTariff: UserAvailableTariff | null;

  // Action form (extend/shorten/create/etc.)
  subAction: string;
  subDays: number | '';
  subEndDate?: string;
  onSubActionChange: (s: string) => void;
  onSubDaysChange: (d: number | '') => void;
  onSubEndDateChange?: (date: string) => void;
  selectedTariffId: number | null;
  onSelectedTariffIdChange: (id: number | null) => void;
  subReason: string;
  subSilent: boolean;
  onSubReasonChange: (s: string) => void;
  onSubSilentChange: (b: boolean) => void;

  // Traffic add form
  selectedTrafficGb: string;
  onSelectedTrafficGbChange: (gb: string) => void;

  // Panel info
  panelInfo: UserPanelInfo | null;
  panelInfoLoading: boolean;
  copyToClipboard: (text: string) => void | Promise<void>;
  formatBytes: (bytes: number) => string;

  // Node usage
  nodeUsageDays: number;
  onNodeUsageDaysChange: (d: number) => void;
  nodeUsageForPeriod: (UserNodeUsageItem & { total_bytes: number })[];

  // Devices
  devices: DeviceRow[];
  devicesLoading: boolean;
  devicesTotal: number;
  deviceLimit: number;
  editingDeviceHwid: string | null;
  editingDeviceName: string;
  onEditingDeviceHwidChange: (hwid: string | null) => void;
  onEditingDeviceNameChange: (name: string) => void;
  renameSaving: boolean;

  // Request history
  requestHistory: SubscriptionRequestRecord[];
  requestHistoryLoading: boolean;
  requestHistoryTotal: number;
  requestHistoryOffset: number;
  requestHistorySubId: number | null;
  requestHistoryExpanded: boolean;
  onRequestHistoryExpandedChange: (open: boolean) => void;
  onRequestHistorySubIdChange: (id: number | null) => void;

  // Mutation handlers (all parent-owned)
  actionLoading: boolean;
  confirmingAction: string | null;
  onInlineConfirm: (key: string, fn: () => Promise<void>) => void;
  onUpdateSubscription: (overrideAction?: string) => Promise<void>;
  onSetDeviceLimit: (newLimit: number) => Promise<void>;
  onSetTrafficLimit?: (newLimitGb: number) => Promise<void>;
  onSetWhitelistTrafficLimit?: (newLimitGb: number) => Promise<void>;
  onAddTraffic: (gb: number) => Promise<void>;
  onRemoveTraffic: (purchaseId: number) => Promise<void>;
  onResetMainTraffic?: () => Promise<void>;
  onAddWhitelistTraffic?: (gb: number) => Promise<void>;
  onRemoveWhitelistTraffic?: (purchaseId: number) => Promise<void>;
  onResetWhitelistUsed?: () => Promise<void>;
  onAdjustWhitelistTraffic?: (params: { usedGb?: number; deltaGb?: number }) => Promise<void>;
  onResetDevices: () => Promise<void>;
  onCancelSbpRecurring: () => Promise<void>;
  onDeleteSubscription: () => Promise<void>;
  onDeleteDevice: (hwid: string) => Promise<void>;
  onRenameDevice: (hwid: string) => Promise<void>;
  onLoadDevices: () => Promise<void>;
  onLoadSubscriptionData: () => Promise<void>;
  onLoadRequestHistory: (offset: number, append?: boolean) => Promise<void>;

  // Misc
  hasPermission: (perm: string) => boolean;
  formatDate: (date: string | null) => string;
  locale: string;
  /** Ссылка на VLESS-тест конфигов этого пользователя; null — раздел недоступен. */
  reachabilityLink?: string | null;
}

export function SubscriptionTab(props: SubscriptionTabProps) {
  const { t } = useTranslation();
  const {
    userSubscriptions,
    selectedSub,
    activeSubscriptionId,
    onActiveSubscriptionChange,
    subscriptionDetailView,
    onSubscriptionDetailViewChange,
    tariffs,
    currentTariff,
    subAction,
    subDays,
    subEndDate,
    onSubActionChange,
    onSubDaysChange,
    onSubEndDateChange,
    selectedTariffId,
    onSelectedTariffIdChange,
    subReason,
    subSilent,
    onSubReasonChange,
    onSubSilentChange,
    selectedTrafficGb,
    onSelectedTrafficGbChange,
    panelInfo,
    panelInfoLoading,
    copyToClipboard,
    formatBytes,
    nodeUsageDays,
    onNodeUsageDaysChange,
    nodeUsageForPeriod,
    devices,
    devicesLoading,
    devicesTotal,
    deviceLimit,
    editingDeviceHwid,
    editingDeviceName,
    onEditingDeviceHwidChange,
    onEditingDeviceNameChange,
    renameSaving,
    requestHistory,
    requestHistoryLoading,
    requestHistoryTotal,
    requestHistoryOffset,
    requestHistorySubId,
    requestHistoryExpanded,
    onRequestHistoryExpandedChange,
    onRequestHistorySubIdChange,
    actionLoading,
    confirmingAction,
    onInlineConfirm,
    onUpdateSubscription,
    onSetDeviceLimit,
    onSetTrafficLimit,
    onSetWhitelistTrafficLimit,
    onAddTraffic,
    onRemoveTraffic,
    onResetMainTraffic,
    onAddWhitelistTraffic,
    onRemoveWhitelistTraffic,
    onResetWhitelistUsed,
    onAdjustWhitelistTraffic,
    onResetDevices,
    onCancelSbpRecurring,
    onDeleteSubscription,
    onDeleteDevice,
    onRenameDevice,
    onLoadDevices,
    onLoadSubscriptionData,
    onLoadRequestHistory,
    hasPermission,
    formatDate,
    locale,
  } = props;
  // Suppress activeSubscriptionId-unused; the parent uses it for query keys.
  void activeSubscriptionId;
  const todayIso = new Date().toISOString().slice(0, 10);

  const [selectedWhitelistTrafficGb, setSelectedWhitelistTrafficGb] = useState<string>('');
  const [manualWhitelistGb, setManualWhitelistGb] = useState<number | ''>('');
  const [adjustWhitelistVal, setAdjustWhitelistVal] = useState<string>('');
  const [editingTrafficLimit, setEditingTrafficLimit] = useState(false);
  const [trafficLimitInput, setTrafficLimitInput] = useState<number | ''>('');
  const [editingWhitelistLimit, setEditingWhitelistLimit] = useState(false);
  const [whitelistLimitInput, setWhitelistLimitInput] = useState<number | ''>('');
  const [customTrafficLimitVal, setCustomTrafficLimitVal] = useState<number | ''>('');
  const [customWhitelistLimitVal, setCustomWhitelistLimitVal] = useState<number | ''>('');

  return (
    <div className="space-y-4">
      {/* Multi-subscription: Level 1 — subscription list */}
      {userSubscriptions.length > 1 && !subscriptionDetailView && (
        <>
          <div className="space-y-3">
            {userSubscriptions.map((sub) => (
              <button
                key={sub.id}
                onClick={() => {
                  onActiveSubscriptionChange(sub.id);
                  onSubscriptionDetailViewChange(true);
                }}
                className="w-full rounded-xl border border-dark-700/50 bg-dark-800/50 p-4 text-left transition-all hover:border-dark-600"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-dark-100">
                      {sub.tariff_name || `#${sub.id}`}
                    </span>
                    <StatusBadge status={sub.status} />
                    {sub.sbp_recurring_status && (
                      <span
                        title={t('admin.users.detail.subscription.sbpTitle')}
                        className="rounded-full bg-accent-500/15 px-2 py-0.5 text-[10px] font-medium text-accent-400"
                      >
                        SBP
                      </span>
                    )}
                  </div>
                  <ChevronRightIcon className="h-4 w-4 text-dark-500" />
                </div>
                <div className="mt-2 flex items-center gap-4 text-xs text-dark-400">
                  <span>
                    {sub.traffic_used_gb.toFixed(1)} / {sub.traffic_limit_gb} {t('common.units.gb')}
                  </span>
                  {sub.whitelist_traffic_limit_gb != null && sub.whitelist_traffic_limit_gb > 0 && (
                    <span>
                      LTE {(sub.whitelist_traffic_used_gb ?? 0).toFixed(1)} /{' '}
                      {sub.whitelist_traffic_limit_gb} {t('common.units.gb')}
                    </span>
                  )}
                  <span>{formatDate(sub.end_date)}</span>
                  <span>
                    {sub.device_limit} {t('admin.users.detail.subscription.devices', 'устройств')}
                  </span>
                </div>
              </button>
            ))}
          </div>

          {/* Create new subscription — at list level */}
          {hasPermission('users:subscription') && (
            <div className="rounded-xl bg-dark-800/50 p-4">
              <div className="mb-3 text-sm font-medium text-dark-200">
                {t('admin.users.detail.subscription.createNew', 'Создать подписку')}
              </div>
              <div className="space-y-3">
                <select
                  value={selectedTariffId || ''}
                  onChange={(e) =>
                    onSelectedTariffIdChange(e.target.value ? parseInt(e.target.value) : null)
                  }
                  className="input"
                >
                  <option value="">{t('admin.users.detail.subscription.selectTariff')}</option>
                  {tariffs
                    .filter((tariffItem) => {
                      const purchasedIds = new Set(
                        userSubscriptions
                          .filter(
                            (s) => s.is_active || s.status === 'trial' || s.status === 'limited',
                          )
                          .map((s) => s.tariff_id),
                      );
                      return !purchasedIds.has(tariffItem.id);
                    })
                    .map((tariffItem) => (
                      <option key={tariffItem.id} value={tariffItem.id}>
                        {tariffItem.name}
                      </option>
                    ))}
                </select>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-dark-400 mb-1 block">
                      {t('admin.users.detail.subscription.days')}
                    </label>
                    <input
                      type="number"
                      value={subDays}
                      onChange={createNumberInputHandler(onSubDaysChange, 1)}
                      placeholder={t('admin.users.detail.subscription.days')}
                      className="input w-full"
                      min={1}
                      max={3650}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-dark-400 mb-1 block">
                      {t('admin.users.detail.subscription.endDate')}
                    </label>
                    <DateField
                      value={subEndDate || ''}
                      onChange={(date) => onSubEndDateChange?.(date)}
                      placeholder={t('admin.users.detail.subscription.selectEndDate')}
                      min={todayIso}
                      className="input flex w-full items-center justify-start gap-2 text-left"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-dark-400 mb-1 block">
                    {t('admin.users.detail.subscription.reason', 'Причина / Примечание')}
                  </label>
                  <input
                    type="text"
                    value={subReason}
                    onChange={(e) => onSubReasonChange(e.target.value)}
                    placeholder={t(
                      'admin.users.detail.subscription.reasonPlaceholder',
                      'Необязательно, отображается клиенту',
                    )}
                    className="input w-full"
                    maxLength={500}
                  />
                </div>
                <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-dark-300">
                  <input
                    type="checkbox"
                    checked={subSilent}
                    onChange={(e) => onSubSilentChange(e.target.checked)}
                    className="checkbox"
                  />
                  <span>
                    {t(
                      'admin.users.detail.subscription.silent',
                      'Не отправлять уведомление клиенту',
                    )}
                  </span>
                </label>
                <button
                  onClick={() => onUpdateSubscription('create')}
                  disabled={actionLoading}
                  className="btn-primary w-full"
                >
                  {actionLoading
                    ? t('admin.users.detail.subscription.creating')
                    : t('admin.users.detail.subscription.create')}
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Level 2 — subscription detail (or single subscription) */}
      {(subscriptionDetailView || userSubscriptions.length <= 1) && selectedSub ? (
        <>
          {/* Back to list (multi-subscription) */}
          {subscriptionDetailView && userSubscriptions.length > 1 && (
            <button
              onClick={() => onSubscriptionDetailViewChange(false)}
              className="flex items-center gap-1.5 text-sm text-dark-400 transition-colors hover:text-dark-200"
            >
              <BackIcon className="h-4 w-4" />
              {t('admin.users.detail.subscription.backToList', 'Все подписки')}
            </button>
          )}

          {/* Current subscription */}
          <div className="rounded-xl bg-dark-800/50 p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="font-medium text-dark-200">
                {t('admin.users.detail.subscription.current')}
                {userSubscriptions.length > 1 && (
                  <span className="ml-2 text-xs text-dark-500">#{selectedSub.id}</span>
                )}
              </span>
              <StatusBadge status={selectedSub.status} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-xs text-dark-500">
                  {t('admin.users.detail.subscription.tariff')}
                </div>
                <div className="text-dark-100">
                  {selectedSub.tariff_name || t('admin.users.detail.subscription.notSpecified')}
                </div>
              </div>
              <div>
                <div className="text-xs text-dark-500">
                  {t('admin.users.detail.subscription.validUntil')}
                </div>
                <div className="text-dark-100">{formatDate(selectedSub.end_date)}</div>
              </div>
              <div>
                <div className="text-xs text-dark-500">
                  {t('admin.users.detail.subscription.traffic')}
                </div>
                {editingTrafficLimit ? (
                  <div className="mt-1 flex items-center gap-1.5">
                    <input
                      type="number"
                      min={0}
                      max={100000}
                      value={trafficLimitInput}
                      onChange={(e) => {
                        const val = e.target.value === '' ? '' : parseInt(e.target.value, 10);
                        setTrafficLimitInput(Number.isNaN(val) ? '' : val);
                      }}
                      className="input h-7 w-20 px-2 text-xs"
                      autoFocus
                    />
                    <span className="text-xs text-dark-400">{t('common.units.gb')}</span>
                    <button
                      onClick={async () => {
                        if (
                          trafficLimitInput !== '' &&
                          trafficLimitInput >= 0 &&
                          onSetTrafficLimit
                        ) {
                          await onSetTrafficLimit(Number(trafficLimitInput));
                          setEditingTrafficLimit(false);
                        }
                      }}
                      disabled={actionLoading || trafficLimitInput === '' || trafficLimitInput < 0}
                      className="rounded bg-accent-500 p-1 text-on-accent hover:bg-accent-600 disabled:opacity-50"
                      title={t('common.save', 'Сохранить')}
                    >
                      <CheckIcon className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setEditingTrafficLimit(false)}
                      className="rounded bg-dark-700 p-1 text-dark-400 hover:text-dark-200"
                      title={t('common.cancel', 'Отмена')}
                    >
                      <XIcon className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <span className="text-dark-100">
                      {panelInfo?.found
                        ? (panelInfo.used_traffic_bytes / (1024 * 1024 * 1024)).toFixed(1)
                        : selectedSub.traffic_used_gb.toFixed(1)}{' '}
                      / {selectedSub.traffic_limit_gb} {t('common.units.gb')}
                    </span>
                    {onSetTrafficLimit && hasPermission('users:subscription') && (
                      <button
                        onClick={() => {
                          setTrafficLimitInput(selectedSub.traffic_limit_gb);
                          setEditingTrafficLimit(true);
                        }}
                        className="rounded p-1 text-dark-400 hover:bg-dark-700 hover:text-accent-400"
                        title={t(
                          'admin.users.detail.subscription.editTrafficLimit',
                          'Изменить лимит трафика',
                        )}
                      >
                        <EditIcon className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                )}
              </div>
              <div>
                <div className="text-xs text-dark-500">
                  {t('admin.users.detail.subscription.devices')}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onSetDeviceLimit(selectedSub.device_limit - 1)}
                    disabled={actionLoading || selectedSub.device_limit <= 1}
                    className="flex h-6 w-6 items-center justify-center rounded-md bg-dark-700 text-dark-300 transition-colors hover:bg-dark-600 disabled:opacity-30"
                  >
                    <MinusIcon className="h-3 w-3" />
                  </button>
                  <span className="min-w-[2ch] text-center text-dark-100">
                    {selectedSub.device_limit}
                  </span>
                  <button
                    onClick={() => onSetDeviceLimit(selectedSub.device_limit + 1)}
                    disabled={
                      actionLoading ||
                      (currentTariff?.max_device_limit != null &&
                        selectedSub.device_limit >= currentTariff.max_device_limit)
                    }
                    className="flex h-6 w-6 items-center justify-center rounded-md bg-dark-700 text-dark-300 transition-colors hover:bg-dark-600 disabled:opacity-30"
                  >
                    <PlusIcon className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>

            {/* Dual progress bars: Main traffic + White Internet (LTE) */}
            <div className="mt-4 space-y-3 border-t border-dark-700/60 pt-4">
              <TrafficProgressBar
                usedGb={
                  panelInfo?.found
                    ? panelInfo.used_traffic_bytes / (1024 * 1024 * 1024)
                    : selectedSub.traffic_used_gb
                }
                limitGb={selectedSub.traffic_limit_gb}
                percent={
                  selectedSub.traffic_limit_gb > 0
                    ? Math.min(
                        100,
                        ((panelInfo?.found
                          ? panelInfo.used_traffic_bytes / (1024 * 1024 * 1024)
                          : selectedSub.traffic_used_gb) /
                          selectedSub.traffic_limit_gb) *
                          100,
                      )
                    : 0
                }
                isUnlimited={selectedSub.traffic_limit_gb <= 0}
                compact
                label={t('dashboard.mainTraffic', 'Основной трафик')}
              />

              {(selectedSub.whitelist_traffic_limit_gb ?? 0) > 0 ||
              (selectedSub.whitelist_traffic_purchases &&
                selectedSub.whitelist_traffic_purchases.length > 0) ? (
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-dark-50/55">
                      {t('subscription.whiteInternetServers', 'LTE сервера')}
                    </span>
                    <div className="flex items-center gap-2">
                      {selectedSub.whitelist_exhausted && (
                        <span className="rounded-full border border-warning-500/30 bg-warning-500/20 px-2 py-0.5 text-[10px] font-medium text-warning-400">
                          {t(
                            'admin.users.detail.subscription.lteExhausted',
                            'квота исчерпана, squad снят',
                          )}
                        </span>
                      )}
                      {editingWhitelistLimit ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min={0}
                            max={10000}
                            value={whitelistLimitInput}
                            onChange={(e) => {
                              const val = e.target.value === '' ? '' : parseInt(e.target.value, 10);
                              setWhitelistLimitInput(Number.isNaN(val) ? '' : val);
                            }}
                            className="input h-6 w-16 px-1.5 text-[11px]"
                            autoFocus
                          />
                          <button
                            onClick={async () => {
                              if (
                                whitelistLimitInput !== '' &&
                                whitelistLimitInput >= 0 &&
                                onSetWhitelistTrafficLimit
                              ) {
                                await onSetWhitelistTrafficLimit(Number(whitelistLimitInput));
                                setEditingWhitelistLimit(false);
                              }
                            }}
                            disabled={
                              actionLoading || whitelistLimitInput === '' || whitelistLimitInput < 0
                            }
                            className="rounded bg-accent-500 p-0.5 text-on-accent hover:bg-accent-600 disabled:opacity-50"
                            title={t('common.save', 'Сохранить')}
                          >
                            <CheckIcon className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => setEditingWhitelistLimit(false)}
                            className="rounded bg-dark-700 p-0.5 text-dark-400 hover:text-dark-200"
                            title={t('common.cancel', 'Отмена')}
                          >
                            <XIcon className="h-3 w-3" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <span className="font-mono text-[11px] text-dark-400">
                            {(selectedSub.whitelist_traffic_used_gb ?? 0).toFixed(1)} /{' '}
                            {selectedSub.whitelist_traffic_limit_gb ?? 0} {t('common.units.gb')}
                          </span>
                          {onSetWhitelistTrafficLimit && hasPermission('users:subscription') && (
                            <button
                              onClick={() => {
                                setWhitelistLimitInput(selectedSub.whitelist_traffic_limit_gb ?? 0);
                                setEditingWhitelistLimit(true);
                              }}
                              className="rounded p-0.5 text-dark-400 hover:bg-dark-700 hover:text-accent-400"
                              title={t(
                                'admin.users.detail.subscription.editWhitelistLimit',
                                'Изменить лимит LTE',
                              )}
                            >
                              <EditIcon className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <TrafficProgressBar
                    usedGb={selectedSub.whitelist_traffic_used_gb ?? 0}
                    limitGb={selectedSub.whitelist_traffic_limit_gb ?? 0}
                    percent={selectedSub.whitelist_traffic_used_percent ?? 0}
                    isUnlimited={false}
                    compact
                  />
                </div>
              ) : (
                <div className="text-xs italic text-dark-400">
                  {t(
                    'admin.users.detail.subscription.lteNotEnabled',
                    'Белый интернет не включён в этой подписке',
                  )}
                </div>
              )}
            </div>
          </div>

          {/* SBP (Platega) recurring auto-payment — status comes from the admin
              detail response; cancel is idempotent on the backend. */}
          {selectedSub.sbp_recurring_status && (
            <div className="rounded-xl bg-dark-800/50 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-dark-200">
                    {t('admin.users.detail.subscription.sbpTitle')}
                  </div>
                  <div className="mt-0.5 text-xs text-dark-400">
                    {t(
                      `admin.users.detail.subscription.sbpStatus_${selectedSub.sbp_recurring_status}`,
                      selectedSub.sbp_recurring_status,
                    )}
                  </div>
                </div>
                {hasPermission('users:subscription') && (
                  <button
                    // Per-subscription confirm key: an armed confirm must not
                    // survive switching to another subscription in the picker.
                    onClick={() =>
                      onInlineConfirm(`cancelSbpRecurring_${selectedSub.id}`, onCancelSbpRecurring)
                    }
                    disabled={actionLoading}
                    className={`rounded-lg px-3 py-2 text-sm font-medium transition-all disabled:opacity-50 ${
                      confirmingAction === `cancelSbpRecurring_${selectedSub.id}`
                        ? 'bg-warning-500 text-white'
                        : 'bg-warning-500/15 text-warning-400 hover:bg-warning-500/25'
                    }`}
                  >
                    {confirmingAction === `cancelSbpRecurring_${selectedSub.id}`
                      ? t('admin.users.detail.actions.areYouSure')
                      : t('admin.users.detail.subscription.sbpCancel')}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Delete this subscription — in multi-tariff mode spent trials
              pile up in the card, and removing one used to be possible
              only through the bulk-actions screen. */}
          {hasPermission('users:subscription') && (
            <div className="rounded-xl bg-dark-800/50 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-medium text-dark-200">
                    {t('admin.users.detail.subscription.deleteTitle')}
                  </div>
                  <div className="mt-0.5 text-xs text-dark-400">
                    {t('admin.users.detail.subscription.deleteHint')}
                  </div>
                </div>
                <button
                  // Per-subscription confirm key: an armed confirm must not
                  // survive switching to another subscription in the picker.
                  onClick={() =>
                    onInlineConfirm(`deleteSubscription_${selectedSub.id}`, onDeleteSubscription)
                  }
                  disabled={actionLoading}
                  className={`shrink-0 rounded-lg px-3 py-2 text-sm font-medium transition-all disabled:opacity-50 ${
                    confirmingAction === `deleteSubscription_${selectedSub.id}`
                      ? 'bg-error-500 text-white'
                      : 'bg-error-500/15 text-error-400 hover:bg-error-500/25'
                  }`}
                >
                  {confirmingAction === `deleteSubscription_${selectedSub.id}`
                    ? t('admin.users.detail.actions.areYouSure')
                    : t('admin.users.detail.subscription.deleteButton')}
                </button>
              </div>
              <div className="mt-3 space-y-2 border-t border-white/5 pt-3">
                <input
                  type="text"
                  value={subReason}
                  onChange={(e) => onSubReasonChange(e.target.value)}
                  placeholder={t(
                    'admin.users.detail.subscription.deleteReasonPlaceholder',
                    'Причина удаления (необязательно)',
                  )}
                  className="input w-full text-xs"
                  maxLength={500}
                />
                <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-dark-300">
                  <input
                    type="checkbox"
                    checked={subSilent}
                    onChange={(e) => onSubSilentChange(e.target.checked)}
                    className="checkbox"
                  />
                  <span>
                    {t(
                      'admin.users.detail.subscription.silent',
                      'Не отправлять уведомление клиенту',
                    )}
                  </span>
                </label>
              </div>
            </div>
          )}

          {/* Traffic Packages */}
          {selectedSub.traffic_purchases && selectedSub.traffic_purchases.length > 0 && (
            <div className="rounded-xl bg-dark-800/50 p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-medium text-dark-200">
                  {t('admin.users.detail.subscription.trafficPackages')}
                  {selectedSub.purchased_traffic_gb > 0 && (
                    <span className="ml-2 text-xs text-dark-400">
                      ({selectedSub.purchased_traffic_gb} {t('common.units.gb')})
                    </span>
                  )}
                </span>
              </div>
              <div className="space-y-2">
                {selectedSub.traffic_purchases.map((tp) => (
                  <div
                    key={tp.id}
                    className={`flex items-center justify-between rounded-lg px-3 py-2 ${
                      tp.is_expired ? 'bg-dark-700/30 opacity-60' : 'bg-dark-700/50'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 text-sm text-dark-200">
                        <span className="font-medium">
                          {tp.traffic_gb} {t('common.units.gb')}
                        </span>
                        {tp.is_expired ? (
                          <span className="rounded-full bg-error-500/20 px-1.5 py-0.5 text-[10px] text-error-400">
                            {t('admin.users.detail.subscription.expired')}
                          </span>
                        ) : (
                          <span className="text-xs text-dark-400">
                            {tp.days_remaining} {t('admin.users.detail.subscription.daysLeft')}
                          </span>
                        )}
                      </div>
                    </div>
                    {!tp.is_expired && (
                      <button
                        onClick={() =>
                          onInlineConfirm(`removeTraffic_${tp.id}`, () => onRemoveTraffic(tp.id))
                        }
                        disabled={actionLoading}
                        className={`ml-2 shrink-0 rounded-lg px-2 py-1 text-xs transition-all disabled:opacity-50 ${
                          confirmingAction === `removeTraffic_${tp.id}`
                            ? 'bg-error-500 text-white'
                            : 'text-dark-500 hover:bg-error-500/15 hover:text-error-400'
                        }`}
                      >
                        {confirmingAction === `removeTraffic_${tp.id}` ? '?' : '×'}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add Traffic */}
          {hasPermission('users:subscription') &&
            (onResetMainTraffic ||
              onSetTrafficLimit ||
              (currentTariff &&
                currentTariff.traffic_topup_enabled &&
                Object.keys(currentTariff.traffic_topup_packages).length > 0)) && (
              <div className="rounded-xl bg-dark-800/50 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm font-medium text-dark-200">
                    {t('admin.users.detail.subscription.addTraffic')}
                  </span>
                  {onResetMainTraffic && (
                    <button
                      onClick={() =>
                        onInlineConfirm(`resetMainTraffic_${selectedSub.id}`, onResetMainTraffic)
                      }
                      disabled={actionLoading}
                      className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-all disabled:opacity-50 ${
                        confirmingAction === `resetMainTraffic_${selectedSub.id}`
                          ? 'bg-warning-500 text-white'
                          : 'bg-warning-500/15 text-warning-400 hover:bg-warning-500/25'
                      }`}
                    >
                      {confirmingAction === `resetMainTraffic_${selectedSub.id}`
                        ? t('admin.users.detail.actions.areYouSure')
                        : t(
                            'admin.users.detail.subscription.resetMainTraffic',
                            'Сбросить расход трафика',
                          )}
                    </button>
                  )}
                </div>

                {onSetTrafficLimit && (
                  <div className="mb-3">
                    <div className="mb-1 text-xs text-dark-400">
                      {t(
                        'admin.users.detail.subscription.setTrafficLimit',
                        'Задать лимит трафика:',
                      )}
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        min={0}
                        max={100000}
                        value={customTrafficLimitVal}
                        onChange={(e) => {
                          const val = e.target.value === '' ? '' : parseInt(e.target.value, 10);
                          setCustomTrafficLimitVal(Number.isNaN(val) ? '' : val);
                        }}
                        placeholder={t(
                          'admin.users.detail.subscription.setTrafficLimitPlaceholder',
                          'Лимит в ГБ (0 = безлимит)',
                        )}
                        className="input flex-1"
                      />
                      <button
                        onClick={async () => {
                          if (customTrafficLimitVal !== '' && customTrafficLimitVal >= 0) {
                            await onSetTrafficLimit(Number(customTrafficLimitVal));
                            setCustomTrafficLimitVal('');
                          }
                        }}
                        disabled={
                          actionLoading || customTrafficLimitVal === '' || customTrafficLimitVal < 0
                        }
                        className="shrink-0 rounded-lg bg-accent-500 px-4 py-2 text-sm text-on-accent transition-colors hover:bg-accent-600 disabled:opacity-50"
                      >
                        {t('common.save', 'Сохранить')}
                      </button>
                    </div>
                  </div>
                )}
                {currentTariff &&
                  currentTariff.traffic_topup_enabled &&
                  Object.keys(currentTariff.traffic_topup_packages).length > 0 && (
                    <>
                      <div className="flex gap-2">
                        <select
                          value={selectedTrafficGb}
                          onChange={(e) => onSelectedTrafficGbChange(e.target.value)}
                          className="input flex-1"
                        >
                          <option value="">
                            {t('admin.users.detail.subscription.selectPackage')}
                          </option>
                          {Object.entries(currentTariff.traffic_topup_packages)
                            .sort(([a], [b]) => Number(a) - Number(b))
                            .map(([gb]) => (
                              <option key={gb} value={gb}>
                                {gb} {t('common.units.gb')}
                              </option>
                            ))}
                        </select>
                        <button
                          onClick={() =>
                            selectedTrafficGb && onAddTraffic(Number(selectedTrafficGb))
                          }
                          disabled={actionLoading || !selectedTrafficGb}
                          className="shrink-0 rounded-lg bg-accent-500 px-4 py-2 text-sm text-on-accent transition-colors hover:bg-accent-600 disabled:opacity-50"
                        >
                          {t('admin.users.detail.subscription.addButton')}
                        </button>
                      </div>
                      <div className="mt-2 text-xs text-dark-500">
                        {t('admin.users.detail.subscription.addTrafficNote')}
                      </div>
                    </>
                  )}
              </div>
            )}

          {/* White Internet (LTE) Packages */}
          {selectedSub.whitelist_traffic_purchases &&
            selectedSub.whitelist_traffic_purchases.length > 0 && (
              <div className="rounded-xl bg-dark-800/50 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm font-medium text-dark-200">
                    {t(
                      'admin.users.detail.subscription.whiteInternetPackages',
                      'Пакеты Белого интернета (LTE)',
                    )}
                    {(selectedSub.whitelist_traffic_purchased_gb ?? 0) > 0 && (
                      <span className="ml-2 text-xs text-dark-400">
                        ({selectedSub.whitelist_traffic_purchased_gb} {t('common.units.gb')})
                      </span>
                    )}
                  </span>
                </div>
                <div className="space-y-2">
                  {selectedSub.whitelist_traffic_purchases.map((wtp) => (
                    <div
                      key={wtp.id}
                      className={`flex items-center justify-between rounded-lg px-3 py-2 ${
                        wtp.is_expired ? 'bg-dark-700/30 opacity-60' : 'bg-dark-700/50'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 text-sm text-dark-200">
                          <span className="font-medium">
                            {wtp.traffic_gb} {t('common.units.gb')}
                          </span>
                          {wtp.is_expired ? (
                            <span className="rounded-full bg-error-500/20 px-1.5 py-0.5 text-[10px] text-error-400">
                              {t('admin.users.detail.subscription.expired')}
                            </span>
                          ) : (
                            <span className="text-xs text-dark-400">
                              {wtp.days_remaining} {t('admin.users.detail.subscription.daysLeft')}
                            </span>
                          )}
                        </div>
                      </div>
                      {!wtp.is_expired &&
                        onRemoveWhitelistTraffic &&
                        hasPermission('users:subscription') && (
                          <button
                            onClick={() =>
                              onInlineConfirm(`removeWhitelistTraffic_${wtp.id}`, () =>
                                onRemoveWhitelistTraffic(wtp.id),
                              )
                            }
                            disabled={actionLoading}
                            className={`ml-2 shrink-0 rounded-lg px-2 py-1 text-xs transition-all disabled:opacity-50 ${
                              confirmingAction === `removeWhitelistTraffic_${wtp.id}`
                                ? 'bg-error-500 text-white'
                                : 'text-dark-500 hover:bg-error-500/15 hover:text-error-400'
                            }`}
                          >
                            {confirmingAction === `removeWhitelistTraffic_${wtp.id}` ? '?' : '×'}
                          </button>
                        )}
                    </div>
                  ))}
                </div>
              </div>
            )}

          {/* Add White Internet Traffic (LTE) & Adjust Usage */}
          {hasPermission('users:subscription') &&
            (onAddWhitelistTraffic ||
              onSetWhitelistTrafficLimit ||
              onResetWhitelistUsed ||
              onAdjustWhitelistTraffic) && (
              <div className="rounded-xl bg-dark-800/50 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm font-medium text-dark-200">
                    {t(
                      'admin.users.detail.subscription.addWhitelistTraffic',
                      'Белый интернет (LTE)',
                    )}
                  </span>
                  {onResetWhitelistUsed && (
                    <button
                      onClick={() =>
                        onInlineConfirm(
                          `resetWhitelistUsed_${selectedSub.id}`,
                          onResetWhitelistUsed,
                        )
                      }
                      disabled={actionLoading}
                      className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-all disabled:opacity-50 ${
                        confirmingAction === `resetWhitelistUsed_${selectedSub.id}`
                          ? 'bg-warning-500 text-white'
                          : 'bg-warning-500/15 text-warning-400 hover:bg-warning-500/25'
                      }`}
                    >
                      {confirmingAction === `resetWhitelistUsed_${selectedSub.id}`
                        ? t('admin.users.detail.actions.areYouSure')
                        : t(
                            'admin.users.detail.subscription.resetWhitelistUsed',
                            'Сбросить расход LTE',
                          )}
                    </button>
                  )}
                </div>

                {onSetWhitelistTrafficLimit && (
                  <div className="mb-3">
                    <div className="mb-1 text-xs text-dark-400">
                      {t(
                        'admin.users.detail.subscription.setWhitelistLimit',
                        'Задать лимит Белого интернета:',
                      )}
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        min={0}
                        max={10000}
                        value={customWhitelistLimitVal}
                        onChange={(e) => {
                          const val = e.target.value === '' ? '' : parseInt(e.target.value, 10);
                          setCustomWhitelistLimitVal(Number.isNaN(val) ? '' : val);
                        }}
                        placeholder={t(
                          'admin.users.detail.subscription.setWhitelistLimitPlaceholder',
                          'Лимит в ГБ',
                        )}
                        className="input flex-1"
                      />
                      <button
                        onClick={async () => {
                          if (customWhitelistLimitVal !== '' && customWhitelistLimitVal >= 0) {
                            await onSetWhitelistTrafficLimit(Number(customWhitelistLimitVal));
                            setCustomWhitelistLimitVal('');
                          }
                        }}
                        disabled={
                          actionLoading ||
                          customWhitelistLimitVal === '' ||
                          customWhitelistLimitVal < 0
                        }
                        className="shrink-0 rounded-lg bg-accent-500 px-4 py-2 text-sm text-on-accent transition-colors hover:bg-accent-600 disabled:opacity-50"
                      >
                        {t('common.save', 'Сохранить')}
                      </button>
                    </div>
                  </div>
                )}

                {onAddWhitelistTraffic &&
                  (currentTariff?.whitelist_traffic_topup_enabled &&
                  Object.keys(currentTariff.whitelist_traffic_topup_packages || {}).length > 0 ? (
                    <div className="flex gap-2">
                      <select
                        value={selectedWhitelistTrafficGb}
                        onChange={(e) => setSelectedWhitelistTrafficGb(e.target.value)}
                        className="input flex-1"
                      >
                        <option value="">
                          {t('admin.users.detail.subscription.selectPackage')}
                        </option>
                        {Object.entries(currentTariff.whitelist_traffic_topup_packages || {})
                          .sort(([a], [b]) => Number(a) - Number(b))
                          .map(([gb]) => (
                            <option key={gb} value={gb}>
                              {gb} {t('common.units.gb')}
                            </option>
                          ))}
                      </select>
                      <button
                        onClick={async () => {
                          if (!selectedWhitelistTrafficGb) return;
                          await onAddWhitelistTraffic(Number(selectedWhitelistTrafficGb));
                          setSelectedWhitelistTrafficGb('');
                        }}
                        disabled={actionLoading || !selectedWhitelistTrafficGb}
                        className="shrink-0 rounded-lg bg-accent-500 px-4 py-2 text-sm text-on-accent transition-colors hover:bg-accent-600 disabled:opacity-50"
                      >
                        {t('admin.users.detail.subscription.addButton')}
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        type="number"
                        min={1}
                        max={500}
                        value={manualWhitelistGb}
                        onChange={(e) => {
                          const val = e.target.value === '' ? '' : parseInt(e.target.value, 10);
                          setManualWhitelistGb(Number.isNaN(val) ? '' : val);
                        }}
                        placeholder={t(
                          'admin.users.detail.subscription.addWhitelistTrafficManualPlaceholder',
                          'Количество ГБ (1…500)',
                        )}
                        className="input flex-1"
                      />
                      <button
                        onClick={async () => {
                          if (!manualWhitelistGb || manualWhitelistGb < 1) return;
                          await onAddWhitelistTraffic(Number(manualWhitelistGb));
                          setManualWhitelistGb('');
                        }}
                        disabled={
                          actionLoading ||
                          !manualWhitelistGb ||
                          manualWhitelistGb < 1 ||
                          manualWhitelistGb > 500
                        }
                        className="shrink-0 rounded-lg bg-accent-500 px-4 py-2 text-sm text-on-accent transition-colors hover:bg-accent-600 disabled:opacity-50"
                      >
                        {t('admin.users.detail.subscription.addButton')}
                      </button>
                    </div>
                  ))}

                {/* Adjust used LTE traffic UI */}
                {onAdjustWhitelistTraffic && (
                  <div className="mt-4 border-t border-dark-700/60 pt-3">
                    <div className="mb-2 flex items-center justify-between text-xs">
                      <span className="font-medium text-dark-300">
                        {t(
                          'admin.users.detail.subscription.adjustWhitelistTraffic',
                          'Корректировка расхода LTE',
                        )}
                      </span>
                      <span className="font-mono text-dark-400">
                        {t('admin.users.detail.subscription.currentUsed', 'Текущий расход')}:{' '}
                        <span className="font-semibold text-dark-200">
                          {(selectedSub.whitelist_traffic_used_gb ?? 0).toFixed(2)}{' '}
                          {t('common.units.gb')}
                        </span>
                      </span>
                    </div>

                    {/* Quick buttons */}
                    <div className="mb-3 flex flex-wrap items-center gap-1.5">
                      <span className="mr-1 text-[11px] text-dark-400">
                        {t('admin.users.detail.subscription.quickAdjust', 'Быстро')}:
                      </span>
                      {[
                        { label: '+10 ГБ', delta: 10 },
                        { label: '+50 ГБ', delta: 50 },
                        { label: '-10 ГБ', delta: -10 },
                        { label: '-50 ГБ', delta: -50 },
                      ].map((btn) => (
                        <button
                          key={btn.label}
                          type="button"
                          onClick={() => onAdjustWhitelistTraffic({ deltaGb: btn.delta })}
                          disabled={actionLoading}
                          className="rounded-lg border border-dark-600/70 bg-dark-700/60 px-2.5 py-1 text-xs font-medium text-dark-200 transition-colors hover:border-dark-500 hover:bg-dark-600 disabled:opacity-50"
                        >
                          {btn.label}
                        </button>
                      ))}
                    </div>

                    {/* Custom value input and action buttons */}
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                      <input
                        type="number"
                        step="any"
                        min={0}
                        value={adjustWhitelistVal}
                        onChange={(e) => setAdjustWhitelistVal(e.target.value)}
                        placeholder={t(
                          'admin.users.detail.subscription.adjustWhitelistPlaceholder',
                          'Значение в ГБ (напр. 15.5)',
                        )}
                        disabled={actionLoading}
                        className="input min-w-[130px] flex-1"
                      />
                      <div className="flex flex-wrap gap-1.5">
                        <button
                          type="button"
                          onClick={async () => {
                            const val = parseFloat(adjustWhitelistVal);
                            if (Number.isNaN(val) || val <= 0) return;
                            await onAdjustWhitelistTraffic({ deltaGb: val });
                            setAdjustWhitelistVal('');
                          }}
                          disabled={
                            actionLoading ||
                            !adjustWhitelistVal ||
                            Number.isNaN(parseFloat(adjustWhitelistVal)) ||
                            parseFloat(adjustWhitelistVal) <= 0
                          }
                          className="rounded-lg border border-dark-600 bg-dark-700 px-2.5 py-2 text-xs font-medium text-dark-200 transition-colors hover:bg-dark-600 disabled:opacity-50"
                          title={t(
                            'admin.users.detail.subscription.addUsageHint',
                            'Увеличить расход на указанное количество ГБ',
                          )}
                        >
                          {t('admin.users.detail.subscription.addUsage', 'Добавить расход (+)')}
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            const val = parseFloat(adjustWhitelistVal);
                            if (Number.isNaN(val) || val <= 0) return;
                            await onAdjustWhitelistTraffic({ deltaGb: -val });
                            setAdjustWhitelistVal('');
                          }}
                          disabled={
                            actionLoading ||
                            !adjustWhitelistVal ||
                            Number.isNaN(parseFloat(adjustWhitelistVal)) ||
                            parseFloat(adjustWhitelistVal) <= 0
                          }
                          className="rounded-lg border border-dark-600 bg-dark-700 px-2.5 py-2 text-xs font-medium text-dark-200 transition-colors hover:bg-dark-600 disabled:opacity-50"
                          title={t(
                            'admin.users.detail.subscription.deductUsageHint',
                            'Уменьшить расход на указанное количество ГБ',
                          )}
                        >
                          {t('admin.users.detail.subscription.deductUsage', 'Списать расход (-)')}
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            const val = parseFloat(adjustWhitelistVal);
                            if (Number.isNaN(val) || val < 0) return;
                            await onAdjustWhitelistTraffic({ usedGb: val });
                            setAdjustWhitelistVal('');
                          }}
                          disabled={
                            actionLoading ||
                            adjustWhitelistVal === '' ||
                            Number.isNaN(parseFloat(adjustWhitelistVal)) ||
                            parseFloat(adjustWhitelistVal) < 0
                          }
                          className="rounded-lg bg-accent-500 px-3 py-2 text-xs font-medium text-on-accent transition-colors hover:bg-accent-600 disabled:opacity-50"
                          title={t(
                            'admin.users.detail.subscription.setExactHint',
                            'Установить точное значение расхода в ГБ',
                          )}
                        >
                          {t('admin.users.detail.subscription.setExact', 'Установить точно')}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

          {props.reachabilityLink && (
            <Link to={props.reachabilityLink} className="btn-secondary w-full text-center">
              {t('admin.reachability.shortcuts.checkSubscription')}
            </Link>
          )}

          {/* Actions */}
          {hasPermission('users:subscription') && (
            <div className="rounded-xl bg-dark-800/50 p-4">
              <div className="mb-3 font-medium text-dark-200">
                {t('admin.users.detail.subscription.actions')}
              </div>
              <div className="space-y-3">
                <select
                  value={subAction}
                  onChange={(e) => onSubActionChange(e.target.value)}
                  className="input"
                >
                  <option value="extend">{t('admin.users.detail.subscription.extend')}</option>
                  <option value="shorten">{t('admin.users.detail.subscription.shorten')}</option>
                  <option value="set_end_date">
                    {t('admin.users.detail.subscription.setEndDate', 'Установить дату окончания')}
                  </option>
                  {userSubscriptions.length <= 1 && (
                    <option value="change_tariff">
                      {t('admin.users.detail.subscription.changeTariff')}
                    </option>
                  )}
                  <option value="cancel">{t('admin.users.detail.subscription.cancel')}</option>
                  <option value="activate">{t('admin.users.detail.subscription.activate')}</option>
                </select>

                {(subAction === 'extend' || subAction === 'shorten') && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-dark-400 mb-1 block">
                        {t('admin.users.detail.subscription.days')}
                      </label>
                      <input
                        type="number"
                        value={subDays}
                        onChange={createNumberInputHandler(onSubDaysChange, 1)}
                        placeholder={t('admin.users.detail.subscription.days')}
                        className="input w-full"
                        min={1}
                        max={3650}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-dark-400 mb-1 block">
                        {t('admin.users.detail.subscription.endDate')}
                      </label>
                      <DateField
                        value={subEndDate || ''}
                        onChange={(date) => onSubEndDateChange?.(date)}
                        placeholder={t('admin.users.detail.subscription.selectEndDate')}
                        min={todayIso}
                        className="input flex w-full items-center justify-start gap-2 text-left"
                      />
                    </div>
                  </div>
                )}

                {subAction === 'set_end_date' && (
                  <div>
                    <label className="text-xs text-dark-400 mb-1 block">
                      {t('admin.users.detail.subscription.endDate')}
                    </label>
                    <DateField
                      value={subEndDate || ''}
                      onChange={(date) => onSubEndDateChange?.(date)}
                      placeholder={t('admin.users.detail.subscription.selectEndDate')}
                      className="input flex w-full items-center justify-start gap-2 text-left"
                    />
                  </div>
                )}

                {subAction === 'change_tariff' && (
                  <select
                    value={selectedTariffId || ''}
                    onChange={(e) =>
                      onSelectedTariffIdChange(e.target.value ? parseInt(e.target.value) : null)
                    }
                    className="input"
                  >
                    <option value="">{t('admin.users.detail.subscription.selectTariff')}</option>
                    {tariffs.map((tariffItem) => (
                      <option key={tariffItem.id} value={tariffItem.id}>
                        {tariffItem.name}{' '}
                        {!tariffItem.is_available &&
                          t('admin.users.detail.subscription.unavailable')}
                      </option>
                    ))}
                  </select>
                )}

                <div>
                  <label className="text-xs text-dark-400 mb-1 block">
                    {t('admin.users.detail.subscription.reason', 'Причина / Примечание')}
                  </label>
                  <input
                    type="text"
                    value={subReason}
                    onChange={(e) => onSubReasonChange(e.target.value)}
                    placeholder={t(
                      'admin.users.detail.subscription.reasonPlaceholder',
                      'Необязательно, отображается клиенту',
                    )}
                    className="input w-full"
                    maxLength={500}
                  />
                </div>
                <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-dark-300">
                  <input
                    type="checkbox"
                    checked={subSilent}
                    onChange={(e) => onSubSilentChange(e.target.checked)}
                    className="checkbox"
                  />
                  <span>
                    {t(
                      'admin.users.detail.subscription.silent',
                      'Не отправлять уведомление клиенту',
                    )}
                  </span>
                </label>

                <button
                  onClick={() => onUpdateSubscription()}
                  disabled={actionLoading}
                  className="btn-primary w-full"
                >
                  {actionLoading
                    ? t('admin.users.actions.applying')
                    : t('admin.users.actions.apply')}
                </button>
              </div>
            </div>
          )}
        </>
      ) : null}

      {/* Create new subscription — only for single-sub users or no subs */}
      {hasPermission('users:subscription') && userSubscriptions.length <= 1 && (
        <div className="rounded-xl bg-dark-800/50 p-4">
          {userSubscriptions.length === 0 && (
            <div className="mb-4 text-center text-dark-400">
              {t('admin.users.detail.subscription.noActive')}
            </div>
          )}
          <div className="mb-3 text-sm font-medium text-dark-200">
            {t('admin.users.detail.subscription.createNew', 'Создать подписку')}
          </div>
          <div className="space-y-3">
            <select
              value={selectedTariffId || ''}
              onChange={(e) =>
                onSelectedTariffIdChange(e.target.value ? parseInt(e.target.value) : null)
              }
              className="input"
            >
              <option value="">{t('admin.users.detail.subscription.selectTariff')}</option>
              {tariffs
                .filter((tariffItem) => {
                  if (userSubscriptions.length > 0) {
                    const purchasedIds = new Set(
                      userSubscriptions
                        .filter((s) => s.is_active || s.status === 'trial')
                        .map((s) => s.tariff_id),
                    );
                    return !purchasedIds.has(tariffItem.id);
                  }
                  return true;
                })
                .map((tariffItem) => (
                  <option key={tariffItem.id} value={tariffItem.id}>
                    {tariffItem.name}
                  </option>
                ))}
            </select>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-dark-400 mb-1 block">
                  {t('admin.users.detail.subscription.days')}
                </label>
                <input
                  type="number"
                  value={subDays}
                  onChange={createNumberInputHandler(onSubDaysChange, 1)}
                  placeholder={t('admin.users.detail.subscription.days')}
                  className="input w-full"
                  min={1}
                  max={3650}
                />
              </div>
              <div>
                <label className="text-xs text-dark-400 mb-1 block">
                  {t('admin.users.detail.subscription.endDate')}
                </label>
                <DateField
                  value={subEndDate || ''}
                  onChange={(date) => onSubEndDateChange?.(date)}
                  placeholder={t('admin.users.detail.subscription.selectEndDate')}
                  min={todayIso}
                  className="input flex w-full items-center justify-start gap-2 text-left"
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-dark-400 mb-1 block">
                {t('admin.users.detail.subscription.reason', 'Причина / Примечание')}
              </label>
              <input
                type="text"
                value={subReason}
                onChange={(e) => onSubReasonChange(e.target.value)}
                placeholder={t(
                  'admin.users.detail.subscription.reasonPlaceholder',
                  'Необязательно, отображается клиенту',
                )}
                className="input w-full"
                maxLength={500}
              />
            </div>
            <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-dark-300">
              <input
                type="checkbox"
                checked={subSilent}
                onChange={(e) => onSubSilentChange(e.target.checked)}
                className="checkbox"
              />
              <span>
                {t('admin.users.detail.subscription.silent', 'Не отправлять уведомление клиенту')}
              </span>
            </label>
            <button
              onClick={() => onUpdateSubscription('create')}
              disabled={actionLoading}
              className="btn-primary w-full"
            >
              {actionLoading
                ? t('admin.users.detail.subscription.creating')
                : t('admin.users.detail.subscription.create')}
            </button>
          </div>
        </div>
      )}

      {/* Panel Info, Traffic, Devices — only inside subscription detail */}
      {(subscriptionDetailView || userSubscriptions.length <= 1) && (
        <>
          {panelInfoLoading ? (
            <SkeletonGroup className="space-y-3">
              <Skeleton variant="card" count={3} className="h-16" />
            </SkeletonGroup>
          ) : panelInfo && !panelInfo.found ? (
            <div className="rounded-xl border border-dark-700 bg-dark-800/50 p-4 text-center text-sm text-dark-400">
              {t('admin.users.detail.panelNotFound')}
            </div>
          ) : panelInfo && panelInfo.found ? (
            <>
              {/* Links */}
              {(panelInfo.subscription_url || panelInfo.happ_link) && (
                <div className="rounded-xl bg-dark-800/50 p-4">
                  <div className="mb-3 text-sm font-medium text-dark-200">
                    {t('admin.users.detail.subscriptionUrl')} / {t('admin.users.detail.happLink')}
                  </div>
                  <div className="space-y-2">
                    {panelInfo.subscription_url && (
                      <button
                        onClick={() => copyToClipboard(panelInfo.subscription_url!)}
                        className="w-full rounded-lg bg-dark-700/50 p-2 text-left transition-colors hover:bg-dark-700"
                      >
                        <div className="mb-0.5 text-xs text-dark-500">
                          {t('admin.users.detail.subscriptionUrl')}
                        </div>
                        <div className="truncate font-mono text-xs text-dark-200">
                          {panelInfo.subscription_url}
                        </div>
                      </button>
                    )}
                    {panelInfo.happ_link && (
                      <button
                        onClick={() => copyToClipboard(panelInfo.happ_link!)}
                        className="w-full rounded-lg bg-dark-700/50 p-2 text-left transition-colors hover:bg-dark-700"
                      >
                        <div className="mb-0.5 text-xs text-dark-500">
                          {t('admin.users.detail.happLink')}
                        </div>
                        <div className="truncate font-mono text-xs text-dark-200">
                          {panelInfo.happ_link}
                        </div>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Config */}
              {(panelInfo.trojan_password || panelInfo.vless_uuid || panelInfo.ss_password) && (
                <div className="rounded-xl bg-dark-800/50 p-4">
                  <div className="mb-3 text-sm font-medium text-dark-200">
                    {t('admin.users.detail.panelConfig')}
                  </div>
                  <div className="space-y-2">
                    {panelInfo.trojan_password && (
                      <button
                        onClick={() => copyToClipboard(panelInfo.trojan_password!)}
                        className="w-full rounded-lg bg-dark-700/50 p-2 text-left transition-colors hover:bg-dark-700"
                      >
                        <div className="mb-0.5 text-xs text-dark-500">
                          {t('admin.users.detail.trojanPassword')}
                        </div>
                        <div className="truncate font-mono text-xs text-dark-200">
                          {panelInfo.trojan_password}
                        </div>
                      </button>
                    )}
                    {panelInfo.vless_uuid && (
                      <button
                        onClick={() => copyToClipboard(panelInfo.vless_uuid!)}
                        className="w-full rounded-lg bg-dark-700/50 p-2 text-left transition-colors hover:bg-dark-700"
                      >
                        <div className="mb-0.5 text-xs text-dark-500">
                          {t('admin.users.detail.vlessUuid')}
                        </div>
                        <div className="truncate font-mono text-xs text-dark-200">
                          {panelInfo.vless_uuid}
                        </div>
                      </button>
                    )}
                    {panelInfo.ss_password && (
                      <button
                        onClick={() => copyToClipboard(panelInfo.ss_password!)}
                        className="w-full rounded-lg bg-dark-700/50 p-2 text-left transition-colors hover:bg-dark-700"
                      >
                        <div className="mb-0.5 text-xs text-dark-500">
                          {t('admin.users.detail.ssPassword')}
                        </div>
                        <div className="truncate font-mono text-xs text-dark-200">
                          {panelInfo.ss_password}
                        </div>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Connection info */}
              <div className="rounded-xl bg-dark-800/50 p-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-xs text-dark-500">
                      {t('admin.users.detail.firstConnected')}
                    </div>
                    <div className="text-sm text-dark-100">
                      {formatDate(panelInfo.first_connected_at)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-dark-500">
                      {t('admin.users.detail.lastOnline')}
                    </div>
                    <div className="text-sm text-dark-100">{formatDate(panelInfo.online_at)}</div>
                  </div>
                  {panelInfo.last_connected_node_name && (
                    <div className="col-span-2">
                      <div className="text-xs text-dark-500">
                        {t('admin.users.detail.lastNode')}
                      </div>
                      <div className="text-sm text-dark-100">
                        {panelInfo.last_connected_node_name}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Live traffic */}
              <div className="rounded-xl bg-dark-800/50 p-4">
                <div className="mb-3 text-sm font-medium text-dark-200">
                  {t('admin.users.detail.panelTraffic', 'Трафик панели RemnaWave')}
                </div>
                <div className="mb-2">
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="text-dark-400">
                      {formatBytes(panelInfo.used_traffic_bytes)}
                    </span>
                    <span className="text-dark-500">
                      {panelInfo.traffic_limit_bytes > 0
                        ? formatBytes(panelInfo.traffic_limit_bytes)
                        : '∞'}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-dark-700">
                    <div
                      className="h-full rounded-full bg-accent-500 transition-all"
                      style={{
                        width:
                          panelInfo.traffic_limit_bytes > 0
                            ? `${Math.min(100, (panelInfo.used_traffic_bytes / panelInfo.traffic_limit_bytes) * 100)}%`
                            : '0%',
                      }}
                    />
                  </div>
                </div>
                <div className="text-xs text-dark-500">
                  {t('admin.users.detail.lifetime')}:{' '}
                  {formatBytes(panelInfo.lifetime_used_traffic_bytes)}
                </div>
              </div>

              {/* Node usage */}
              <div className="rounded-xl bg-dark-800/50 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm font-medium text-dark-200">
                    {t('admin.users.detail.nodeUsage')}
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      {[1, 3, 7, 14, 30].map((d) => (
                        <button
                          key={d}
                          onClick={() => onNodeUsageDaysChange(d)}
                          className={`rounded-lg px-2 py-1 text-xs transition-colors ${
                            nodeUsageDays === d
                              ? 'bg-accent-500/20 text-accent-400'
                              : 'text-dark-500 hover:text-dark-300'
                          }`}
                        >
                          {d}d
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={() => onLoadSubscriptionData()}
                      className="rounded-lg p-1 text-dark-500 transition-colors hover:text-dark-300"
                      title={t('common.refresh')}
                    >
                      <RefreshIcon className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                {nodeUsageForPeriod.length > 0 ? (
                  <div className="space-y-2">
                    {nodeUsageForPeriod.map((item) => {
                      const maxBytes = nodeUsageForPeriod[0].total_bytes;
                      const pct = maxBytes > 0 ? (item.total_bytes / maxBytes) * 100 : 0;
                      return (
                        <div key={item.node_uuid}>
                          <div className="mb-1 flex justify-between text-xs">
                            <span className="text-dark-300">
                              {item.country_code && (
                                <span className="mr-1">{getCountryFlag(item.country_code)}</span>
                              )}
                              {item.node_name}
                            </span>
                            <span className="text-dark-400">{formatBytes(item.total_bytes)}</span>
                          </div>
                          <div className="h-1.5 overflow-hidden rounded-full bg-dark-700">
                            <div
                              className="h-full rounded-full bg-accent-500/60"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-2 text-center text-xs text-dark-500">-</div>
                )}
              </div>
            </>
          ) : null}

          {/* Devices */}
          <div className="rounded-xl bg-dark-800/50 p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-medium text-dark-200">
                {t('admin.users.detail.devices.title')} ({devicesTotal}/{deviceLimit})
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onLoadDevices()}
                  className="rounded-lg p-1 text-dark-500 transition-colors hover:text-dark-300"
                  title={t('common.refresh')}
                >
                  <RefreshIcon className="h-3.5 w-3.5" />
                </button>
                {devices.length > 0 && (
                  <button
                    onClick={() => onInlineConfirm('resetDevices', onResetDevices)}
                    disabled={actionLoading}
                    className={`rounded-lg px-2 py-1 text-xs font-medium transition-all disabled:opacity-50 ${
                      confirmingAction === 'resetDevices'
                        ? 'bg-error-500 text-white'
                        : 'bg-error-500/15 text-error-400 hover:bg-error-500/25'
                    }`}
                  >
                    {confirmingAction === 'resetDevices'
                      ? t('admin.users.detail.actions.areYouSure')
                      : t('admin.users.detail.devices.resetAll')}
                  </button>
                )}
              </div>
            </div>
            {devicesLoading ? (
              <SkeletonGroup className="space-y-3">
                <Skeleton variant="card" count={3} className="h-16" />
              </SkeletonGroup>
            ) : devices.length > 0 ? (
              <div className="space-y-2">
                {devices.map((device) => {
                  const isEditing = editingDeviceHwid === device.hwid;
                  const displayName =
                    (device.local_name && device.local_name.trim()) ||
                    device.platform ||
                    device.device_model ||
                    device.hwid.slice(0, 12);
                  return (
                    <div
                      key={device.hwid}
                      className="flex items-center justify-between rounded-lg bg-dark-700/50 px-3 py-2"
                    >
                      <div className="min-w-0 flex-1">
                        {isEditing ? (
                          <input
                            type="text"
                            autoFocus
                            value={editingDeviceName}
                            maxLength={DEVICE_ALIAS_MAX_LENGTH}
                            placeholder={
                              device.platform || device.device_model || device.hwid.slice(0, 12)
                            }
                            onChange={(e) => onEditingDeviceNameChange(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                onRenameDevice(device.hwid);
                              } else if (e.key === 'Escape') {
                                e.preventDefault();
                                onEditingDeviceHwidChange(null);
                                onEditingDeviceNameChange('');
                              }
                            }}
                            className="w-full rounded-md bg-dark-900/70 px-2 py-1 text-xs font-medium text-dark-50 outline-none ring-1 ring-dark-600/60 focus:ring-accent-500/50"
                          />
                        ) : (
                          <div className="truncate text-xs font-medium text-dark-200">
                            {displayName}
                          </div>
                        )}
                        <div className="mt-0.5 flex items-center gap-2 text-[10px] text-dark-500">
                          {device.device_model && device.platform && (
                            <span>{device.device_model}</span>
                          )}
                          <span className="font-mono">{device.hwid.slice(0, 8)}...</span>
                          {device.created_at && (
                            <span>{new Date(device.created_at).toLocaleDateString(locale)}</span>
                          )}
                        </div>
                      </div>
                      <div className="ml-2 flex shrink-0 items-center gap-1">
                        {isEditing ? (
                          <>
                            <button
                              type="button"
                              onClick={() => onRenameDevice(device.hwid)}
                              disabled={renameSaving}
                              className="rounded-lg px-2 py-1 text-success-400 transition-all hover:bg-success-500/15 disabled:opacity-50"
                              title={t(
                                'admin.users.detail.devices.renameSave',
                                t('common.save', 'Сохранить'),
                              )}
                              aria-label={t('admin.users.detail.devices.renameSave', 'Сохранить')}
                            >
                              <CheckIcon className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                onEditingDeviceHwidChange(null);
                                onEditingDeviceNameChange('');
                              }}
                              disabled={renameSaving}
                              className="rounded-lg px-2 py-1 text-dark-500 transition-all hover:bg-dark-700 disabled:opacity-50"
                              title={t('common.cancel', 'Отмена')}
                              aria-label={t('common.cancel', 'Отмена')}
                            >
                              <XIcon className="h-3.5 w-3.5" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                onEditingDeviceHwidChange(device.hwid);
                                onEditingDeviceNameChange(device.local_name || '');
                              }}
                              className="rounded-lg px-2 py-1 text-dark-500 transition-all hover:bg-accent-500/15 hover:text-accent-400"
                              title={t('admin.users.detail.devices.rename', 'Переименовать')}
                              aria-label={t('admin.users.detail.devices.rename', 'Переименовать')}
                            >
                              <EditIcon className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() =>
                                onInlineConfirm(`deleteDevice_${device.hwid}`, () =>
                                  onDeleteDevice(device.hwid),
                                )
                              }
                              disabled={actionLoading}
                              className={`rounded-lg px-2 py-1 text-xs transition-all disabled:opacity-50 ${
                                confirmingAction === `deleteDevice_${device.hwid}`
                                  ? 'bg-error-500 text-white'
                                  : 'text-dark-500 hover:bg-error-500/15 hover:text-error-400'
                              }`}
                            >
                              {confirmingAction === `deleteDevice_${device.hwid}` ? '?' : '×'}
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-2 text-center text-xs text-dark-500">
                {t('admin.users.detail.devices.none')}
              </div>
            )}
          </div>

          {/* Subscription Request History */}
          <div className="rounded-xl bg-dark-800/50">
            <button
              onClick={() => {
                const next = !requestHistoryExpanded;
                onRequestHistoryExpandedChange(next);
                if (next && requestHistory.length === 0) {
                  onLoadRequestHistory(0);
                }
              }}
              className="flex w-full items-center justify-between p-4 text-left"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-dark-200">
                  {t('admin.users.detail.requestHistory')}
                </span>
                {requestHistoryTotal > 0 && (
                  <span className="rounded-full bg-accent-500/15 px-2 py-0.5 text-xs font-medium text-accent-400">
                    {requestHistoryTotal}
                  </span>
                )}
              </div>
              <ChevronDownIcon
                className={`h-4 w-4 text-dark-500 transition-transform ${requestHistoryExpanded ? 'rotate-180' : ''}`}
              />
            </button>

            {requestHistoryExpanded && (
              <div className="border-t border-dark-700/50 px-4 pb-4 pt-3">
                {/* Subscription selector for multi-tariff */}
                {userSubscriptions.length > 1 && (
                  <div className="mb-3">
                    <select
                      value={requestHistorySubId || ''}
                      onChange={(e) => onRequestHistorySubIdChange(Number(e.target.value) || null)}
                      className="w-full rounded-lg border border-dark-600 bg-dark-700 px-3 py-2 text-sm text-dark-100"
                    >
                      {userSubscriptions.map((sub) => (
                        <option key={sub.id} value={sub.id}>
                          {sub.tariff_name || `#${sub.id}`} — {sub.status}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {requestHistoryLoading && requestHistory.length === 0 ? (
                  <div className="flex justify-center py-6">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-accent-500 border-t-transparent" />
                  </div>
                ) : requestHistory.length === 0 && !requestHistoryLoading ? (
                  <div className="py-6 text-center text-sm text-dark-500">
                    {t('admin.users.detail.noRequests')}
                  </div>
                ) : (
                  <>
                    <div className="mb-2 text-xs text-dark-500">
                      {t('admin.users.detail.requestHistoryTotal')}: {requestHistoryTotal}
                    </div>

                    {/* Table */}
                    <div className="-mx-4 overflow-x-auto px-4">
                      <table className="w-full min-w-[480px] text-left text-sm">
                        <thead>
                          <tr className="border-b border-dark-700/50 text-xs text-dark-500">
                            <th className="pb-2 pr-3 font-medium">
                              {t('admin.users.detail.requestAt')}
                            </th>
                            <th className="pb-2 pr-3 font-medium">
                              {t('admin.users.detail.requestIp')}
                            </th>
                            <th className="pb-2 font-medium">
                              {t('admin.users.detail.requestUserAgent')}
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {requestHistory.map((record, idx) => (
                            <tr
                              key={record.id}
                              className={`border-b border-dark-700/30 ${idx % 2 === 0 ? 'bg-dark-800/30' : ''}`}
                            >
                              <td className="whitespace-nowrap py-2.5 pr-3 text-dark-200">
                                {formatDate(record.requestAt)}
                              </td>
                              <td className="whitespace-nowrap py-2.5 pr-3 font-mono text-xs text-dark-300">
                                {record.requestIp || '—'}
                              </td>
                              <td
                                className="max-w-[200px] truncate py-2.5 text-xs text-dark-400"
                                title={record.userAgent || ''}
                              >
                                {record.userAgent
                                  ? record.userAgent.length > 60
                                    ? `${record.userAgent.slice(0, 60)}...`
                                    : record.userAgent
                                  : '—'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Load more */}
                    {requestHistory.length < requestHistoryTotal && (
                      <button
                        onClick={() => onLoadRequestHistory(requestHistoryOffset, true)}
                        disabled={requestHistoryLoading}
                        className="mt-3 flex min-h-[44px] w-full items-center justify-center rounded-lg bg-dark-700/50 py-2.5 text-sm text-dark-300 transition-colors hover:bg-dark-700 disabled:opacity-50"
                      >
                        {requestHistoryLoading ? (
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-accent-500 border-t-transparent" />
                        ) : (
                          t('admin.users.detail.loadMore')
                        )}
                      </button>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
