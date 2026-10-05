import { useState } from 'react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Bell, ChevronRight } from '@/invoxystart/components/ui/RuneIcon';
import {
  PartnerPromoCard,
  ReferralPromoCard,
  SupportStrip,
} from '@/invoxystart/components/dashboard/WelcomeCards';

/** Второстепенное (рефералы, партнёрка, поддержка, новости) — под сворачиваемым «Ещё». */
export function MoreSection({ showReferral = true }: { showReferral?: boolean }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  return (
    <section className="flex w-full flex-col gap-4">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="glass-panel flex min-h-12 w-full cursor-pointer items-center justify-between rounded-[22px] px-4 text-sm font-semibold text-ink"
      >
        {t('invoxy.dashboard.more')}
        <ChevronRight
          size={16}
          className={`text-muted transition-transform ${open ? 'rotate-90' : ''}`}
        />
      </button>
      {open && (
        <div className="flex flex-col gap-4">
          {showReferral && <ReferralPromoCard />}
          <PartnerPromoCard />
          <SupportStrip />
          <Link
            to="/news"
            className="glass-panel flex items-center gap-3 rounded-[22px] p-4 text-sm transition-colors hover:border-mint/30"
          >
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-mint/10 text-mint">
              <Bell size={18} />
            </span>
            <span className="min-w-0 flex-1">
              <strong className="block">{t('invoxy.dashboard.newsTitle')}</strong>
              <span className="mt-1 block text-xs text-muted">
                {t('invoxy.dashboard.newsSubtitle')}
              </span>
            </span>
            <span className="text-mint">→</span>
          </Link>
        </div>
      )}
    </section>
  );
}
