import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PiGift,
  PiShieldCheck,
  PiArrowsClockwise,
  PiCheckCircleFill,
  PiWarningCircleFill,
  PiX,
  PiHardDrives,
  PiDeviceMobile,
  PiCalendarBlank,
  PiSparkleFill,
} from 'react-icons/pi';
import {
  migrationApi,
  type MigrationCandidate,
  type MigrationExecuteResult,
} from '@/api/migrationApi';
import { lockBodyScroll } from '@/utils/scrollLock';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { useHaptic } from '@/platform';
import { getApiErrorMessage } from '@/utils/api-error';

export interface LazeikaMigrationModalProps {
  isOpen: boolean;
  candidate: MigrationCandidate;
  onClose: () => void;
  onMigrated: (result: MigrationExecuteResult) => void;
}

type MigrationStatus = 'prompt' | 'migrating' | 'success' | 'error';

export function LazeikaMigrationModal({
  isOpen,
  candidate,
  onClose,
  onMigrated,
}: LazeikaMigrationModalProps) {
  const { t } = useTranslation();
  const haptic = useHaptic();
  const modalRef = useFocusTrap<HTMLDivElement>(isOpen, { lockScroll: false });

  const [status, setStatus] = useState<MigrationStatus>('prompt');
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [activeStep, setActiveStep] = useState<number>(1);
  const [result, setResult] = useState<MigrationExecuteResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Lock scroll when modal is open
  useEffect(() => {
    if (!isOpen) return;
    return lockBodyScroll();
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    if (!isOpen || status === 'migrating') return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, status, onClose]);

  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, []);

  const handleStartMigration = async () => {
    setStatus('migrating');
    setProgressPercent(15);
    setActiveStep(1);
    setErrorMessage(null);

    // Simulate steady progress steps while waiting for backend
    progressIntervalRef.current = setInterval(() => {
      setProgressPercent((prev) => {
        if (prev < 40) {
          setActiveStep(1);
          return prev + 5;
        }
        if (prev < 70) {
          setActiveStep(2);
          return prev + 4;
        }
        if (prev < 90) {
          setActiveStep(3);
          return prev + 2;
        }
        return prev;
      });
    }, 200);

    try {
      const response = await migrationApi.execute();
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }

      setActiveStep(4);
      setProgressPercent(100);

      // Brief delay to let the user see 100% completion
      setTimeout(() => {
        setResult(response.result);
        setStatus('success');
        haptic.notification('success');
      }, 500);
    } catch (err: unknown) {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      const msg = getApiErrorMessage(
        err,
        t('lazeikaMigration.error.description', { error: 'Unknown error' }),
      );
      setErrorMessage(msg);
      setStatus('error');
      haptic.notification('error');
    }
  };

  const handleDone = () => {
    if (result) {
      onMigrated(result);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-dark-950/80 backdrop-blur-sm"
        onClick={() => {
          if (status !== 'migrating') onClose();
        }}
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <motion.div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="migration-modal-title"
        initial={{ scale: 0.92, opacity: 0, y: 16 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.92, opacity: 0, y: 16 }}
        transition={{ type: 'spring', duration: 0.4, bounce: 0.15 }}
        className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-dark-700/80 bg-dark-900/95 p-6 shadow-2xl backdrop-blur-xl"
      >
        {/* Close Button (disabled during migration) */}
        {status !== 'migrating' && (
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 rounded-xl p-2 text-dark-400 hover:bg-dark-800 hover:text-dark-200 transition-colors"
            aria-label={t('common.close')}
          >
            <PiX className="h-5 w-5" />
          </button>
        )}

        <AnimatePresence mode="wait">
          {/* STEP 1: INITIAL PROMPT */}
          {status === 'prompt' && (
            <motion.div
              key="prompt"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-5"
            >
              <div className="flex items-center gap-3.5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-brand-500/20 to-brand-400/10 text-brand-400 ring-1 ring-brand-500/30">
                  <PiSparkleFill className="h-6 w-6 text-brand-400 animate-pulse" />
                </div>
                <div>
                  <h2
                    id="migration-modal-title"
                    className="text-lg font-bold text-white tracking-tight"
                  >
                    {t('lazeikaMigration.title')}
                  </h2>
                  <p className="text-xs text-dark-400 mt-0.5">{t('lazeikaMigration.subtitle')}</p>
                </div>
              </div>

              {/* Bonus Highlight Card */}
              <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-brand-600/20 via-purple-600/15 to-brand-500/10 p-3.5 border border-brand-500/30">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-500 text-white shadow-md">
                    <PiGift className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <div className="text-xs font-semibold text-brand-300">
                      {t('lazeikaMigration.bonus')}
                    </div>
                    <div className="text-sm font-bold text-white">
                      {t('lazeikaMigration.bonusValue', { count: candidate.bonus_days })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Tariff / Parameter Comparison */}
              <div className="rounded-xl border border-dark-700/60 bg-dark-800/60 p-4 space-y-3">
                <div className="flex items-center justify-between text-sm border-b border-dark-700/40 pb-2.5">
                  <span className="text-dark-400">{t('lazeikaMigration.tariff')}</span>
                  <span className="font-semibold text-white">
                    {candidate.lazeika_tariff_name} ➔{' '}
                    <span className="text-brand-400">{candidate.target_tariff_name}</span>
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm border-b border-dark-700/40 pb-2.5">
                  <span className="text-dark-400 flex items-center gap-1.5">
                    <PiCalendarBlank className="h-4 w-4 text-dark-400" />
                    {t('lazeikaMigration.totalDays')}
                  </span>
                  <div className="text-right">
                    <span className="font-semibold text-white">
                      {candidate.total_days}{' '}
                      {t('lazeikaMigration.daysCount', { count: candidate.total_days })}
                    </span>
                    <span className="text-xs text-emerald-400 ml-1.5 font-medium">
                      (+{candidate.bonus_days})
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm border-b border-dark-700/40 pb-2.5">
                  <span className="text-dark-400 flex items-center gap-1.5">
                    <PiDeviceMobile className="h-4 w-4 text-dark-400" />
                    {t('lazeikaMigration.devices')}
                  </span>
                  <span className="font-semibold text-white">{candidate.device_limit}</span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-dark-400 flex items-center gap-1.5">
                    <PiHardDrives className="h-4 w-4 text-dark-400" />
                    {t('lazeikaMigration.traffic')}
                  </span>
                  <span className="font-semibold text-white">
                    {candidate.traffic_limit_gb} ГБ
                    {candidate.whitelist_traffic_limit_gb > 0 && (
                      <span className="text-xs text-brand-300 ml-1">
                        (+{candidate.whitelist_traffic_limit_gb} ГБ LTE)
                      </span>
                    )}
                  </span>
                </div>
              </div>

              {/* Seamless Guarantee Note */}
              <div className="flex items-start gap-2.5 rounded-lg bg-dark-800/40 p-3 text-xs text-dark-400 border border-dark-700/30">
                <PiShieldCheck className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" />
                <span>{t('lazeikaMigration.seamlessNote')}</span>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col-reverse sm:flex-row gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-1/3 rounded-xl border border-dark-700 bg-dark-800 py-3 text-sm font-medium text-dark-300 hover:bg-dark-700 hover:text-white transition-colors"
                >
                  {t('lazeikaMigration.laterBtn')}
                </button>
                <button
                  type="button"
                  onClick={handleStartMigration}
                  className="w-full sm:w-2/3 rounded-xl bg-gradient-to-r from-brand-600 via-brand-500 to-indigo-600 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-500/25 hover:opacity-95 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  <PiGift className="h-4 w-4" />
                  <span>{t('lazeikaMigration.migrateBtn')}</span>
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 2: PROGRESS ANIMATION */}
          {status === 'migrating' && (
            <motion.div
              key="migrating"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="py-6 space-y-6 text-center"
            >
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-500/20 text-brand-400 ring-1 ring-brand-500/30">
                <PiArrowsClockwise className="h-8 w-8 animate-spin text-brand-400" />
              </div>

              <div className="space-y-1.5">
                <h3 className="text-lg font-bold text-white">
                  {t('lazeikaMigration.progress.title')}
                </h3>
                <p className="text-xs text-dark-400">{t('lazeikaMigration.progress.warning')}</p>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-dark-800 ring-1 ring-dark-700/50">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-brand-500 to-indigo-500"
                    style={{ width: `${progressPercent}%` }}
                    transition={{ ease: 'easeInOut', duration: 0.3 }}
                  />
                </div>
                <div className="text-right text-xs font-mono text-dark-400">{progressPercent}%</div>
              </div>

              {/* Step checklist */}
              <div className="rounded-xl border border-dark-700/60 bg-dark-800/50 p-3.5 text-left space-y-2 text-xs">
                <div
                  className={`flex items-center gap-2 transition-colors ${
                    activeStep >= 1 ? 'text-white' : 'text-dark-500'
                  }`}
                >
                  <span
                    className={`h-2 w-2 rounded-full ${
                      activeStep > 1
                        ? 'bg-emerald-400'
                        : activeStep === 1
                          ? 'bg-brand-400 animate-ping'
                          : 'bg-dark-600'
                    }`}
                  />
                  <span>{t('lazeikaMigration.progress.step1')}</span>
                </div>
                <div
                  className={`flex items-center gap-2 transition-colors ${
                    activeStep >= 2 ? 'text-white' : 'text-dark-500'
                  }`}
                >
                  <span
                    className={`h-2 w-2 rounded-full ${
                      activeStep > 2
                        ? 'bg-emerald-400'
                        : activeStep === 2
                          ? 'bg-brand-400 animate-ping'
                          : 'bg-dark-600'
                    }`}
                  />
                  <span>{t('lazeikaMigration.progress.step2')}</span>
                </div>
                <div
                  className={`flex items-center gap-2 transition-colors ${
                    activeStep >= 3 ? 'text-white' : 'text-dark-500'
                  }`}
                >
                  <span
                    className={`h-2 w-2 rounded-full ${
                      activeStep > 3
                        ? 'bg-emerald-400'
                        : activeStep === 3
                          ? 'bg-brand-400 animate-ping'
                          : 'bg-dark-600'
                    }`}
                  />
                  <span>{t('lazeikaMigration.progress.step3')}</span>
                </div>
                <div
                  className={`flex items-center gap-2 transition-colors ${
                    activeStep >= 4 ? 'text-white' : 'text-dark-500'
                  }`}
                >
                  <span
                    className={`h-2 w-2 rounded-full ${
                      activeStep === 4 ? 'bg-emerald-400' : 'bg-dark-600'
                    }`}
                  />
                  <span>{t('lazeikaMigration.progress.step4')}</span>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 3: SUCCESS */}
          {status === 'success' && result && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="py-4 space-y-5 text-center"
            >
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/30">
                <PiCheckCircleFill className="h-10 w-10 text-emerald-400" />
              </div>

              <div className="space-y-1">
                <h3 className="text-xl font-bold text-white">
                  {t('lazeikaMigration.success.title')}
                </h3>
                <p className="text-xs text-dark-300 max-w-sm mx-auto">
                  {t('lazeikaMigration.success.description')}
                </p>
              </div>

              {/* Updated Parameters */}
              <div className="rounded-xl border border-dark-700/60 bg-dark-800/60 p-4 text-left space-y-2.5 text-sm">
                <div className="flex items-center justify-between border-b border-dark-700/40 pb-2">
                  <span className="text-dark-400">{t('lazeikaMigration.success.newTariff')}</span>
                  <span className="font-semibold text-emerald-400">{result.tariff_name}</span>
                </div>

                <div className="flex items-center justify-between border-b border-dark-700/40 pb-2">
                  <span className="text-dark-400">{t('lazeikaMigration.success.newExpiry')}</span>
                  <span className="font-semibold text-white">
                    {result.end_date_str} ({result.total_days} дн.)
                  </span>
                </div>

                <div className="flex items-center justify-between border-b border-dark-700/40 pb-2">
                  <span className="text-dark-400">{t('lazeikaMigration.success.newDevices')}</span>
                  <span className="font-semibold text-white">{result.device_limit}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-dark-400">{t('lazeikaMigration.success.newTraffic')}</span>
                  <span className="font-semibold text-white">
                    {result.traffic_limit_gb} ГБ
                    {result.whitelist_traffic_limit_gb > 0 && (
                      <span className="text-xs text-brand-300 ml-1">
                        (+{result.whitelist_traffic_limit_gb} ГБ LTE)
                      </span>
                    )}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleDone}
                className="w-full rounded-xl bg-emerald-500 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 hover:bg-emerald-600 transition-colors"
              >
                {t('lazeikaMigration.success.okBtn')}
              </button>
            </motion.div>
          )}

          {/* STEP 4: ERROR */}
          {status === 'error' && (
            <motion.div
              key="error"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="py-4 space-y-5 text-center"
            >
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/20 text-rose-400 ring-1 ring-rose-500/30">
                <PiWarningCircleFill className="h-8 w-8 text-rose-400" />
              </div>

              <div className="space-y-1">
                <h3 className="text-lg font-bold text-white">
                  {t('lazeikaMigration.error.title')}
                </h3>
                <p className="text-xs text-rose-300">
                  {errorMessage ||
                    t('lazeikaMigration.error.description', { error: 'Unknown error' })}
                </p>
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-1/2 rounded-xl border border-dark-700 bg-dark-800 py-2.5 text-sm font-medium text-dark-300 hover:bg-dark-700 hover:text-white transition-colors"
                >
                  {t('lazeikaMigration.error.close')}
                </button>
                <button
                  type="button"
                  onClick={handleStartMigration}
                  className="w-1/2 rounded-xl bg-brand-500 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 transition-colors"
                >
                  {t('lazeikaMigration.error.retry')}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
