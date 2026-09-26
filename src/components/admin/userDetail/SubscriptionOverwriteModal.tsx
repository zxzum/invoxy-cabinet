import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { XIcon } from '@/components/icons';
import type { UserSubscriptionInfo } from '../../../api/adminUsers';

export interface SubscriptionOverwriteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  loading: boolean;
  currentSubscription: UserSubscriptionInfo | null;
  newTariffName: string;
  newDays: number;
  newEndDate?: string;
  newDeviceLimit: number;
  formatDate: (dateStr: string | null | undefined) => string;
}

export function SubscriptionOverwriteModal({
  isOpen,
  onClose,
  onConfirm,
  loading,
  currentSubscription,
  newTariffName,
  newDays,
  newEndDate,
  newDeviceLimit,
  formatDate,
}: SubscriptionOverwriteModalProps) {
  const { t } = useTranslation();
  const [step, setStep] = useState<1 | 2>(1);
  const [confirmChecked, setConfirmChecked] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setConfirmChecked(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFinalConfirm = async () => {
    if (!confirmChecked || loading) return;
    try {
      await onConfirm();
      onClose();
    } catch {
      // Error handled by caller
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-dark-950/70 backdrop-blur-xs"
        onClick={() => !loading && onClose()}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="overwrite-modal-title"
        className="relative w-full max-w-lg rounded-xl border border-dark-700 bg-dark-800 p-6 shadow-2xl transition-all"
      >
        <button
          onClick={() => !loading && onClose()}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-dark-400 hover:bg-dark-700 hover:text-dark-200 transition-colors"
          disabled={loading}
        >
          <XIcon className="h-5 w-5" />
        </button>

        {step === 1 ? (
          <div>
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-warning-500/20 text-warning-400 font-bold">
                ⚠️
              </div>
              <div>
                <h3 id="overwrite-modal-title" className="text-base font-semibold text-dark-100">
                  {t(
                    'admin.users.detail.subscription.overwriteTitle',
                    'Перезапись активной подписки',
                  )}
                </h3>
                <p className="text-xs text-dark-400">
                  {t(
                    'admin.users.detail.subscription.overwriteStep1Subtitle',
                    'Шаг 1 из 2: Проверка параметров перед заменой',
                  )}
                </p>
              </div>
            </div>

            <div className="mb-4 rounded-lg border border-warning-500/30 bg-warning-500/10 p-3 text-xs text-warning-300">
              {t(
                'admin.users.detail.subscription.overwriteWarning',
                'У пользователя уже есть активная подписка. Выдача новой подписки полностью перезапишет текущую. Привязка в Remnawave сохранится.',
              )}
            </div>

            <div className="space-y-3 mb-6">
              {/* Current Subscription Box */}
              <div className="rounded-lg border border-dark-700/60 bg-dark-900/60 p-3.5">
                <div className="text-xs font-medium text-dark-400 mb-2">
                  {t(
                    'admin.users.detail.subscription.currentSubHeader',
                    'Текущая подписка (будет аннулирована):',
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-dark-400">
                      {t('admin.users.detail.subscription.tariff', 'Тариф')}:
                    </span>{' '}
                    <span className="font-medium text-dark-100">
                      {currentSubscription?.tariff_name || '#'}
                    </span>
                  </div>
                  <div>
                    <span className="text-dark-400">
                      {t('admin.users.detail.subscription.devices', 'Устройств')}:
                    </span>{' '}
                    <span className="font-medium text-dark-100">
                      {currentSubscription?.device_limit ?? '—'}
                    </span>
                  </div>
                  <div>
                    <span className="text-dark-400">
                      {t('admin.users.detail.subscription.validUntil', 'Действует до')}:
                    </span>{' '}
                    <span className="font-medium text-dark-100">
                      {currentSubscription?.end_date
                        ? formatDate(currentSubscription.end_date)
                        : '—'}
                    </span>
                  </div>
                  <div>
                    <span className="text-dark-400">
                      {t('admin.users.detail.subscription.daysRemaining', 'Осталось')}:
                    </span>{' '}
                    <span className="font-medium text-warning-400">
                      {currentSubscription?.days_remaining ?? 0}{' '}
                      {t('admin.users.detail.subscription.days', 'дн.')}
                    </span>
                  </div>
                </div>
              </div>

              {/* New Subscription Box */}
              <div className="rounded-lg border border-accent-500/30 bg-accent-500/5 p-3.5">
                <div className="text-xs font-medium text-accent-400 mb-2">
                  {t('admin.users.detail.subscription.newSubHeader', 'Новая выдаваемая подписка:')}
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-dark-400">
                      {t('admin.users.detail.subscription.tariff', 'Тариф')}:
                    </span>{' '}
                    <span className="font-medium text-dark-100">{newTariffName}</span>
                  </div>
                  <div>
                    <span className="text-dark-400">
                      {t('admin.users.detail.subscription.devices', 'Устройств')}:
                    </span>{' '}
                    <span className="font-medium text-accent-300">{newDeviceLimit}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-dark-400">
                      {t('admin.users.detail.subscription.period', 'Срок')}:
                    </span>{' '}
                    <span className="font-medium text-dark-100">
                      {newDays} {t('admin.users.detail.subscription.days', 'дн.')}{' '}
                      {newEndDate
                        ? `(${t('admin.users.detail.subscription.validUntil', 'до')} ${newEndDate})`
                        : ''}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="btn-secondary flex-1"
              >
                {t('common.cancel', 'Отмена')}
              </button>
              <button type="button" onClick={() => setStep(2)} className="btn-primary flex-1">
                {t('admin.users.detail.subscription.nextStep', 'Далее к подтверждению')} &rarr;
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-error-500/20 text-error-400 font-bold">
                🛑
              </div>
              <div>
                <h3 id="overwrite-modal-title" className="text-base font-semibold text-dark-100">
                  {t(
                    'admin.users.detail.subscription.overwriteFinalTitle',
                    'Финальное подтверждение перезаписи',
                  )}
                </h3>
                <p className="text-xs text-dark-400">
                  {t(
                    'admin.users.detail.subscription.overwriteStep2Subtitle',
                    'Шаг 2 из 2: Подтвердите аннулирование текущего доступа',
                  )}
                </p>
              </div>
            </div>

            <div className="mb-5 rounded-lg border border-error-500/30 bg-error-500/10 p-3.5 text-xs text-error-300">
              <p className="font-medium mb-1">
                {t(
                  'admin.users.detail.subscription.overwriteIrreversible',
                  'Внимание: действие необратимо!',
                )}
              </p>
              <p className="text-dark-300">
                {t(
                  'admin.users.detail.subscription.overwriteIrreversibleHint',
                  'Текущие дни подписки и накопленный трафик будут аннулированы. Пользователю будет предоставлена новая подписка с указанными параметрами.',
                )}
              </p>
            </div>

            <div className="mb-6 rounded-lg bg-dark-900/60 p-3.5">
              <label className="flex items-start gap-2.5 cursor-pointer select-none text-xs text-dark-200">
                <input
                  type="checkbox"
                  checked={confirmChecked}
                  onChange={(e) => setConfirmChecked(e.target.checked)}
                  className="checkbox mt-0.5"
                  disabled={loading}
                />
                <span>
                  {t(
                    'admin.users.detail.subscription.overwriteCheckboxLabel',
                    'Я подтверждаю, что хочу перезаписать текущую активную подписку пользователя новой подпиской',
                  )}
                </span>
              </label>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                disabled={loading}
                className="btn-secondary flex-1"
              >
                &larr; {t('common.back', 'Назад')}
              </button>
              <button
                type="button"
                onClick={handleFinalConfirm}
                disabled={!confirmChecked || loading}
                className="flex-1 rounded-lg bg-error-600 px-4 py-2 text-sm font-medium text-white hover:bg-error-500 disabled:opacity-40 transition-colors shadow-sm"
              >
                {loading
                  ? t('admin.users.detail.subscription.overwriting', 'Перезапись...')
                  : t('admin.users.detail.subscription.overwriteConfirmBtn', 'Да, перезаписать')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
