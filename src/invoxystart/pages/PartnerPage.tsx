import { useState, type FormEvent } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router';
import {
  ArrowRight,
  CalendarDays,
  Check,
  Send,
  Sparkles,
  Wallet,
  Zap,
} from '@/invoxystart/components/ui/RuneIcon';
import { PageHeader } from '@/invoxystart/components/layout/PageHeader';
import { useToast } from '@/invoxystart/components/layout/ToastProvider';
import {
  partnerApi,
  withdrawalApi,
  type PartnerApplicationRequest,
  type PartnerCampaignInfo,
} from '@/invoxystart/api';
import { formatDate, formatMoney } from '@/invoxystart/components/account/AccountPrimitives';
import { LivelyCopyButton } from '@/invoxystart/components/ui/LivelyCopyButton';

export default function PartnerPage() {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [reapplyMode, setReapplyMode] = useState(false);

  // Form state
  const [form, setForm] = useState<PartnerApplicationRequest>({
    company_name: '',
    telegram_channel: '',
    website_url: '',
    expected_monthly_referrals: undefined,
    desired_commission_percent: 30,
    description: '',
  });

  const {
    data: partnerData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['partner-status'],
    queryFn: partnerApi.getStatus,
    staleTime: 30_000,
  });

  const { data: withdrawalBalance } = useQuery({
    queryKey: ['withdrawal-balance'],
    queryFn: withdrawalApi.getBalance,
    enabled: partnerData?.partner_status === 'approved',
    staleTime: 30_000,
  });

  const applyMutation = useMutation({
    mutationFn: (payload: PartnerApplicationRequest) => partnerApi.apply(payload),
    onSuccess: () => {
      showToast('Заявка успешно отправлена! Мы свяжемся с вами.', 'success');
      setReapplyMode(false);
      void queryClient.invalidateQueries({ queryKey: ['partner-status'] });
    },
    onError: () => {
      showToast('Не удалось отправить заявку. Проверьте данные и попробуйте позже.', 'error');
    },
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!form.company_name?.trim()) {
      showToast('Укажите название проекта или компании', 'error');
      return;
    }
    if (!form.telegram_channel?.trim()) {
      showToast('Укажите Telegram канал или контакт', 'error');
      return;
    }
    if (!form.description?.trim()) {
      showToast('Опишите ваши источники трафика и аудиторию', 'error');
      return;
    }

    const payload: PartnerApplicationRequest = {
      company_name: form.company_name.trim(),
      telegram_channel: form.telegram_channel.trim(),
      website_url: form.website_url?.trim() || undefined,
      description: form.description.trim(),
      expected_monthly_referrals: form.expected_monthly_referrals
        ? Number(form.expected_monthly_referrals)
        : undefined,
      desired_commission_percent: form.desired_commission_percent
        ? Number(form.desired_commission_percent)
        : undefined,
    };

    applyMutation.mutate(payload);
  };

  const status = partnerData?.partner_status ?? 'none';
  const isApproved = status === 'approved';
  const isPending = status === 'pending';
  const isRejected = status === 'rejected';
  const showForm = status === 'none' || (isRejected && reapplyMode);

  if (isLoading) {
    return (
      <div className="flex min-w-0 max-w-full flex-col gap-5 pb-28 lg:gap-6 lg:pb-0">
        <PageHeader
          title="Партнёрская программа"
          subtitle="Сотрудничайте с Invoxy и зарабатывайте на рекомендациях"
        />
        <div className="grid min-w-0 max-w-full gap-5">
          <div className="glass-panel h-56 animate-pulse rounded-[30px]" />
          <div className="glass-panel h-96 animate-pulse rounded-[30px]" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-w-0 max-w-full flex-col gap-5 pb-28 lg:gap-6 lg:pb-0">
        <PageHeader
          title="Партнёрская программа"
          subtitle="Сотрудничайте с Invoxy и зарабатывайте на рекомендациях"
        />
        <div className="glass-panel rounded-[30px] p-8 text-center">
          <p className="text-muted">Не удалось загрузить статус партнёрской программы.</p>
          <button
            type="button"
            onClick={() => void refetch()}
            className="button-lift mt-4 rounded-full bg-mint px-5 py-2.5 text-xs font-bold text-bg"
          >
            Повторить попытку
          </button>
        </div>
      </div>
    );
  }

  const latestApp = partnerData?.latest_application;

  return (
    <div className="flex min-w-0 max-w-full flex-col gap-5 pb-28 lg:gap-6 lg:pb-0">
      <PageHeader
        title="Партнёрская программа"
        subtitle="Сотрудничайте с Invoxy и зарабатывайте на рекомендациях"
      />

      {/* Hero Banner with Program Highlights */}
      <section className="glass-panel motion-card relative min-w-0 max-w-full overflow-hidden rounded-[30px] border border-white/12 p-6 sm:p-8 lg:rounded-[32px] lg:p-9">
        <img
          src="/images/referral-network-bg.png"
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-60"
          decoding="async"
        />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(110deg,rgba(11,12,14,.95),rgba(11,12,14,.45)),radial-gradient(circle_at_85%_15%,rgba(165,232,196,.18),transparent_40%)]" />

        <div className="relative z-10 max-w-3xl">
          <p className="flex items-center gap-2 text-[10px] font-bold tracking-[.18em] text-mint sm:text-[11px]">
            <Sparkles size={14} /> ОФИЦИАЛЬНОЕ СОТРУДНИЧЕСТВО
          </p>
          <h1 className="mt-2.5 text-2xl font-medium tracking-tight text-ink sm:text-3xl lg:text-4xl">
            Зарабатывайте вместе с Invoxy
            <br />
            <span className="text-mint">до 50% с каждой оплаты навсегда</span>
          </h1>
          <p className="mt-3 text-xs leading-relaxed text-muted sm:text-sm">
            Индивидуальные условия для блогеров, Telegram-каналов, медиа и вебмастеров. Персональные
            промокоды, ссылки с подробной аналитикой и гарантированные выплаты.
          </p>

          <div className="mt-6 grid grid-cols-1 gap-2.5 sm:grid-cols-3 sm:gap-3">
            <div className="glass-control flex items-center gap-3 rounded-2xl p-3.5">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-mint/10 text-mint">
                <Zap size={18} />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-bold text-ink">До 50% отчислений</p>
                <p className="text-[10px] text-muted">Пожизненный доход</p>
              </div>
            </div>

            <div className="glass-control flex items-center gap-3 rounded-2xl p-3.5">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-mint/10 text-mint">
                <Send size={18} />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-bold text-ink">Личные кампании</p>
                <p className="text-[10px] text-muted">Промокоды и deep-link</p>
              </div>
            </div>

            <div className="glass-control flex items-center gap-3 rounded-2xl p-3.5">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-mint/10 text-mint">
                <Wallet size={18} />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-bold text-ink">Быстрые выплаты</p>
                <p className="text-[10px] text-muted">Карты РФ, СБП и USDT</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* State 1: Approved Partner Dashboard */}
      {isApproved && (
        <div className="flex flex-col gap-5">
          {/* Status Badge Card */}
          <section className="glass-panel motion-card rounded-[30px] border border-mint/25 p-5 sm:p-7">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3.5">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-mint/15 text-mint">
                  <Check size={24} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-ink">Партнёрский статус активен</h2>
                    <span className="rounded-full bg-mint px-2.5 py-0.5 text-[10px] font-bold text-bg">
                      ПАРТНЁР
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-muted">
                    Ваша персональная ставка:{' '}
                    <strong className="text-mint">
                      {partnerData?.commission_percent ?? 30}% от каждой оплаты
                    </strong>
                  </p>
                </div>
              </div>

              {withdrawalBalance && (
                <div className="flex items-center gap-3 rounded-2xl bg-white/5 p-3 sm:px-4">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted">
                      Баланс к выводу
                    </p>
                    <p className="text-base font-bold text-ink sm:text-lg">
                      {formatMoney(withdrawalBalance.available_total)}
                    </p>
                  </div>
                  <Link
                    to="/referrals"
                    className="button-lift ml-2 rounded-full bg-mint px-3.5 py-2 text-xs font-bold text-bg"
                  >
                    Вывести
                  </Link>
                </div>
              )}
            </div>
          </section>

          {/* Partner Campaigns */}
          <section className="glass-panel motion-card rounded-[30px] p-5 sm:p-7">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-medium text-ink">Ваши рекламные кампании</h2>
                <p className="mt-0.5 text-xs text-muted">
                  Используйте ссылки для привлечения трафика и отслеживания статистики
                </p>
              </div>
              <span className="rounded-full bg-white/8 px-3 py-1 text-xs font-medium text-muted">
                {partnerData?.campaigns?.length ?? 0} шт.
              </span>
            </div>

            {partnerData?.campaigns && partnerData.campaigns.length > 0 ? (
              <div className="mt-5 grid gap-4">
                {partnerData.campaigns.map((camp: PartnerCampaignInfo) => (
                  <div
                    key={camp.id}
                    className="glass-control flex flex-col gap-4 rounded-2xl p-4 sm:p-5"
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h3 className="text-base font-bold text-ink">{camp.name}</h3>
                        <p className="text-xs text-muted font-mono">
                          Код кампании: {camp.start_parameter}
                        </p>
                      </div>

                      <div className="flex items-center gap-4 text-xs">
                        <div>
                          <span className="text-muted">Регистраций:</span>{' '}
                          <strong className="text-ink">{camp.registrations_count}</strong>
                        </div>
                        <div>
                          <span className="text-muted">Оплат:</span>{' '}
                          <strong className="text-mint">{camp.referrals_count}</strong>
                        </div>
                        <div>
                          <span className="text-muted">Доход:</span>{' '}
                          <strong className="text-mint">{formatMoney(camp.earnings_kopeks)}</strong>
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-2 sm:grid-cols-2">
                      {camp.web_link && (
                        <div className="flex items-center justify-between gap-2 rounded-xl bg-white/5 px-3 py-2 text-xs">
                          <div className="min-w-0 flex-1 truncate font-mono text-ink/80">
                            {camp.web_link}
                          </div>
                          <LivelyCopyButton
                            text={camp.web_link}
                            label="Копировать веб-ссылку"
                            variant="glass"
                          />
                        </div>
                      )}
                      {camp.deep_link && (
                        <div className="flex items-center justify-between gap-2 rounded-xl bg-white/5 px-3 py-2 text-xs">
                          <div className="min-w-0 flex-1 truncate font-mono text-ink/80">
                            {camp.deep_link}
                          </div>
                          <LivelyCopyButton
                            text={camp.deep_link}
                            label="Копировать Telegram-ссылку"
                            variant="glass"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-5 rounded-2xl bg-white/5 p-6 text-center">
                <p className="text-sm font-medium text-ink">Кампании формируются администратором</p>
                <p className="mt-1 text-xs text-muted">
                  Персональные ссылки и рекламные кампании появятся здесь сразу после назначения
                  модератором.
                </p>
              </div>
            )}
          </section>
        </div>
      )}

      {/* State 2: Pending Application */}
      {isPending && (
        <section className="glass-panel motion-card rounded-[30px] border border-amber-400/25 p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-amber-400/15 text-amber-300">
              <CalendarDays size={24} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl font-bold text-ink">Заявка на рассмотрении</h2>
                <span className="rounded-full bg-amber-400/15 px-3 py-0.5 text-[10px] font-bold text-amber-300">
                  ПРОВЕРКА
                </span>
              </div>
              <p className="mt-1.5 text-xs text-muted leading-relaxed sm:text-sm">
                Ваша заявка принята и проверяется модератором. Обычно рассмотрение занимает до 24
                часов. Мы свяжемся с вами в Telegram или обновим статус здесь в кабинете.
              </p>

              {latestApp && (
                <div className="mt-5 grid gap-2.5 rounded-2xl bg-white/5 p-4 text-xs sm:grid-cols-2">
                  <div>
                    <span className="text-muted">Проект / Канал:</span>{' '}
                    <span className="font-medium text-ink">{latestApp.company_name || '—'}</span>
                  </div>
                  <div>
                    <span className="text-muted">Telegram:</span>{' '}
                    <span className="font-medium text-ink">
                      {latestApp.telegram_channel || '—'}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted">Дата подачи:</span>{' '}
                    <span className="font-medium text-ink">{formatDate(latestApp.created_at)}</span>
                  </div>
                  <div>
                    <span className="text-muted">Желаемая ставка:</span>{' '}
                    <span className="font-medium text-mint">
                      {latestApp.desired_commission_percent
                        ? `${latestApp.desired_commission_percent}%`
                        : 'Стандартная'}
                    </span>
                  </div>
                  {latestApp.description && (
                    <div className="sm:col-span-2">
                      <span className="text-muted">Источники трафика:</span>{' '}
                      <p className="mt-1 text-ink/85">{latestApp.description}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* State 3: Rejected Application */}
      {isRejected && !reapplyMode && (
        <section className="glass-panel motion-card rounded-[30px] border border-red-500/25 p-6 sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <div className="flex-1">
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl font-bold text-ink">Заявка отклонена</h2>
                <span className="rounded-full bg-red-500/15 px-3 py-0.5 text-[10px] font-bold text-red-300">
                  ОТКЛОНЕНО
                </span>
              </div>
              <p className="mt-2 text-xs text-muted sm:text-sm">
                {latestApp?.admin_comment ||
                  'К сожалению, ваша заявка на участие в партнёрской программе не была одобрена администратором.'}
              </p>
              <p className="mt-2 text-xs text-muted">
                Вы можете уточнить данные о вашем канале или источниках трафика и подать заявку
                повторно.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setForm({
                  company_name: latestApp?.company_name || '',
                  telegram_channel: latestApp?.telegram_channel || '',
                  website_url: latestApp?.website_url || '',
                  expected_monthly_referrals: latestApp?.expected_monthly_referrals ?? undefined,
                  desired_commission_percent: latestApp?.desired_commission_percent ?? 30,
                  description: latestApp?.description || '',
                });
                setReapplyMode(true);
              }}
              className="button-lift rounded-full bg-mint px-5 py-2.5 text-xs font-bold text-bg"
            >
              Подать заявку снова
            </button>
          </div>
        </section>
      )}

      {/* State 4: Application Form */}
      {showForm && (
        <section className="glass-panel motion-card rounded-[30px] p-6 sm:p-8 lg:p-9">
          <div className="max-w-2xl">
            <h2 className="text-xl font-bold text-ink sm:text-2xl">Подать заявку на партнерство</h2>
            <p className="mt-1.5 text-xs text-muted leading-relaxed sm:text-sm">
              Заполните информацию о вашем ресурсе или опыте работы с трафиком. Мы подготовим для
              вас персональное предложение.
            </p>

            <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
              <div>
                <label
                  htmlFor="company_name"
                  className="mb-1.5 block text-xs font-medium text-ink/90"
                >
                  Название проекта, компании или канала *
                </label>
                <input
                  id="company_name"
                  type="text"
                  required
                  value={form.company_name}
                  onChange={(e) => setForm({ ...form, company_name: e.target.value })}
                  placeholder="Например: Блог об интернет-безопасности или IT Канал"
                  className="glass-control h-12 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-sm text-ink outline-none transition-colors focus:border-mint/60"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="telegram_channel"
                    className="mb-1.5 block text-xs font-medium text-ink/90"
                  >
                    Telegram-канал или контакт *
                  </label>
                  <input
                    id="telegram_channel"
                    type="text"
                    required
                    value={form.telegram_channel}
                    onChange={(e) => setForm({ ...form, telegram_channel: e.target.value })}
                    placeholder="@channel или @username"
                    className="glass-control h-12 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-sm text-ink outline-none transition-colors focus:border-mint/60"
                  />
                </div>

                <div>
                  <label
                    htmlFor="website_url"
                    className="mb-1.5 block text-xs font-medium text-ink/90"
                  >
                    Веб-сайт или ресурс (опционально)
                  </label>
                  <input
                    id="website_url"
                    type="url"
                    value={form.website_url}
                    onChange={(e) => setForm({ ...form, website_url: e.target.value })}
                    placeholder="https://example.com"
                    className="glass-control h-12 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-sm text-ink outline-none transition-colors focus:border-mint/60"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="expected_referrals"
                    className="mb-1.5 block text-xs font-medium text-ink/90"
                  >
                    Ожидаемое количество клиентов в месяц
                  </label>
                  <input
                    id="expected_referrals"
                    type="number"
                    min="1"
                    value={form.expected_monthly_referrals ?? ''}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        expected_monthly_referrals: e.target.value
                          ? Number(e.target.value)
                          : undefined,
                      })
                    }
                    placeholder="Например: 50"
                    className="glass-control h-12 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-sm text-ink outline-none transition-colors focus:border-mint/60"
                  />
                </div>

                <div>
                  <label
                    htmlFor="desired_commission"
                    className="mb-1.5 block text-xs font-medium text-ink/90"
                  >
                    Желаемый процент комиссии (%)
                  </label>
                  <input
                    id="desired_commission"
                    type="number"
                    min="1"
                    max="100"
                    value={form.desired_commission_percent ?? ''}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        desired_commission_percent: e.target.value
                          ? Number(e.target.value)
                          : undefined,
                      })
                    }
                    placeholder="От 25 до 50%"
                    className="glass-control h-12 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-sm text-ink outline-none transition-colors focus:border-mint/60"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="description"
                  className="mb-1.5 block text-xs font-medium text-ink/90"
                >
                  Источники трафика и формат сотрудничества *
                </label>
                <textarea
                  id="description"
                  required
                  rows={4}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Расскажите о тематике вашей аудитории, географии пользователей и планируемых форматах размещения рекламы..."
                  className="glass-control w-full resize-none rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-ink outline-none transition-colors focus:border-mint/60"
                />
              </div>

              <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
                <button
                  type="submit"
                  disabled={applyMutation.isPending}
                  className="button-lift flex h-12 items-center justify-center gap-2 rounded-full bg-mint px-8 font-bold text-sm text-bg transition-transform hover:-translate-y-0.5 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {applyMutation.isPending ? 'Отправка заявки…' : 'Отправить заявку'}
                  <ArrowRight size={16} />
                </button>

                {reapplyMode && (
                  <button
                    type="button"
                    onClick={() => setReapplyMode(false)}
                    className="h-12 rounded-full px-5 text-sm font-medium text-muted hover:text-ink"
                  >
                    Отмена
                  </button>
                )}
              </div>
            </form>
          </div>
        </section>
      )}
    </div>
  );
}

export { PartnerPage };
