import { useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { LazyMotion, domAnimation } from 'framer-motion';
import { fetchPublicCatalog, type PublicCatalog } from '@/api/publicCatalog';
import { fallbackBotUrl, hasWhitelist, minMonthlyKopeks, ruCount } from './catalogView';
import { Configurator } from './Configurator';
import { ScrollProgress, SiteFooter, SiteHeader, StickyCta } from './Chrome';
import {
  CabinetSection,
  FaqSection,
  FinalCta,
  HeroBackdrop,
  HeroShield,
  HowItWorks,
  LazeikaSection,
  TariffSection,
  TrialBand,
  ValueStrip,
  WhitelistSection,
  type StripItem,
} from './Sections';
import { BotLink, BuyLink, CabinetLink, Check, SplitTitle, primaryButton, quietButton } from './ui';
import { useLandingAuth } from './useLandingAuth';
import { useLandingMotion } from './motion';
import './landing.css';

const SUPPORT_FALLBACK = 'https://t.me/invoxy_support_bot';

function valueItems(catalog: PublicCatalog | undefined): StripItem[] {
  if (!catalog) return [];
  const items: StripItem[] = [];
  const min = minMonthlyKopeks(catalog.tariffs);
  if (min) {
    items.push({
      prefix: 'от ',
      value: Math.round(min / 100),
      suffix: ' ₽',
      label: 'в месяц · низкая цена для старта',
    });
  }
  const trial = catalog.trial;
  if (trial) {
    items.push({
      value: trial.duration_days,
      suffix: ` ${ruCount(trial.duration_days, 'день', 'дня', 'дней')}`,
      label: trial.requires_payment ? 'пробный доступ' : 'пробного доступа бесплатно',
    });
  }
  const maxDevices = Math.max(
    0,
    ...catalog.tariffs.map((tariff) => tariff.max_device_limit || tariff.base_device_limit || 0),
  );
  if (maxDevices > 0) {
    items.push({
      prefix: 'до ',
      value: maxDevices,
      label: ruCount(maxDevices, 'устройство на ключ', 'устройства на ключ', 'устройств на ключ'),
    });
  }
  if (hasWhitelist(catalog)) items.push({ text: 'Отдельный', label: 'запас белого интернета' });
  return items.slice(0, 4);
}

export default function LiveLanding() {
  const root = useRef<HTMLDivElement>(null);
  const auth = useLandingAuth();
  const catalogQuery = useQuery({
    queryKey: ['public-catalog'],
    queryFn: fetchPublicCatalog,
    staleTime: 30_000,
  });
  const catalog = catalogQuery.data;
  const botUrl = catalog?.bot_url || fallbackBotUrl();
  const supportUrl = catalog?.support_url || SUPPORT_FALLBACK;
  const showWhitelist = hasWhitelist(catalog);
  const loading = catalogQuery.isLoading;
  const failed = catalogQuery.isError;
  const retry = () => void catalogQuery.refetch();
  const freeTrial = catalog?.trial && !catalog.trial.requires_payment ? catalog.trial : null;

  useLandingMotion(root, Boolean(catalog));

  return (
    <LazyMotion features={domAnimation}>
      <div
        ref={root}
        data-testid="landing-page"
        className="landing-root min-h-[100dvh] bg-bg text-ink"
      >
        <ScrollProgress />
        <SiteHeader auth={auth} showWhitelist={showWhitelist} />

        <main>
          <section className="relative isolate overflow-x-clip">
            <HeroBackdrop />
            <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 pb-16 pt-10 sm:px-6 lg:min-h-[calc(100dvh-4rem)] lg:grid-cols-[minmax(0,1fr)_minmax(0,0.95fr)] lg:gap-14 lg:py-14">
              <div>
                <a
                  data-hero-badge
                  href="#lazeika"
                  className="inline-flex items-center gap-2 rounded-full border border-line bg-surface/70 px-3.5 py-1.5 text-xs text-muted backdrop-blur transition-colors hover:border-mint/60 hover:text-ink"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-mint" aria-hidden="true" />
                  Invoxy — новый проект после Lazeika VPN
                </a>
                <SplitTitle
                  as="h1"
                  mode="hero"
                  className="mt-6 max-w-[16ch] font-display-landing text-[2.6rem] font-semibold leading-[1.04] tracking-tight sm:text-6xl"
                  parts={[
                    { text: 'VPN и' },
                    { text: 'белый интернет', aurora: true },
                    { text: 'в одной подписке' },
                  ]}
                />
                <p
                  data-hero-sub
                  className="mt-6 max-w-[44ch] text-base leading-relaxed text-muted sm:text-lg"
                >
                  {auth.status === 'user'
                    ? `${auth.name ? `${auth.name}, ` : ''}вы уже в системе. Откройте кабинет или выберите новый тариф. Цены ниже — те же, что на оплате.`
                    : 'Начните с базового тарифа по низкой цене. Создайте аккаунт за минуту и подключите устройства. Цены ниже — те же, что на оплате.'}
                </p>
                <div data-hero-cta className="mt-8 flex flex-col gap-3 sm:flex-row">
                  {auth.status === 'user' ? (
                    <>
                      <CabinetLink auth={auth} className={primaryButton} arrow>
                        Открыть кабинет
                      </CabinetLink>
                      <BuyLink auth={auth} className={quietButton}>
                        Выбрать тариф
                      </BuyLink>
                    </>
                  ) : (
                    <>
                      <BuyLink auth={auth} className={primaryButton} arrow>
                        {freeTrial ? 'Попробовать бесплатно' : 'Создать аккаунт'}
                      </BuyLink>
                      <CabinetLink auth={auth} className={quietButton}>
                        Войти
                      </CabinetLink>
                    </>
                  )}
                </div>
                <div data-hero-trust className="mt-6 space-y-2 text-sm text-muted">
                  {freeTrial && auth.status !== 'user' ? (
                    <p className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-mint" />
                      {freeTrial.duration_days}{' '}
                      {ruCount(freeTrial.duration_days, 'день', 'дня', 'дней')} пробного доступа без
                      оплаты
                    </p>
                  ) : null}
                  {botUrl ? (
                    <p>
                      Или в{' '}
                      <BotLink
                        href={botUrl}
                        className="underline underline-offset-4 hover:text-ink"
                      >
                        Telegram-боте
                      </BotLink>
                    </p>
                  ) : null}
                </div>
              </div>

              <div data-hero-card className="relative">
                <HeroShield />
                <Configurator
                  catalog={catalog}
                  loading={loading}
                  failed={failed}
                  onRetry={retry}
                  botUrl={botUrl}
                  auth={auth}
                />
              </div>
            </div>
          </section>

          <ValueStrip items={valueItems(catalog)} />

          <TariffSection
            catalog={catalog}
            loading={loading}
            failed={failed}
            onRetry={retry}
            auth={auth}
          />

          <TrialBand catalog={catalog} auth={auth} />

          <HowItWorks auth={auth} />

          <CabinetSection auth={auth} />

          {showWhitelist ? <WhitelistSection catalog={catalog} /> : null}

          <LazeikaSection botUrl={botUrl} auth={auth} />

          <FaqSection catalog={catalog} supportUrl={supportUrl} showWhitelist={showWhitelist} />

          <FinalCta catalog={catalog} auth={auth} />
        </main>

        <SiteFooter botUrl={botUrl} supportUrl={supportUrl} auth={auth} />
        <StickyCta auth={auth} />
      </div>
    </LazyMotion>
  );
}
