import { useEffect } from 'react';
import { useLocation } from 'react-router';

const SCRIPT_ID = 'invoxy-umami';
const WEBSITE_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const PAGES = new Set([
  '/',
  '/login',
  '/register',
  '/dashboard',
  '/tariffs',
  '/subscriptions',
  '/subscription',
  '/balance',
  '/balance/top-up',
  '/profile',
  '/profile/accounts',
  '/account/security',
  '/referral',
  '/referrals',
  '/support',
  '/connection',
  '/news',
  '/info',
  '/wheel',
]);

type CabinetEvent =
  | 'checkout_opened'
  | 'payment_method_selected'
  | 'invoice_cancel_clicked'
  | 'invoice_pay_clicked';
interface Tracker {
  track: (payload: Record<string, unknown>) => Promise<unknown>;
}

export function analyticsPage(path: string): string | null {
  if (PAGES.has(path)) return path;
  if (/^\/subscriptions\/\d+$/.test(path)) return '/subscriptions/:id';
  return null;
}

function send(websiteId: string, page: string, event?: string) {
  if (navigator.doNotTrack === '1') return;
  const umami = (window as unknown as { umami?: Tracker }).umami;
  // Explicit payload: no query, hash, document title, referrer, identifiers or form values.
  try {
    void umami
      ?.track({
        website: websiteId,
        hostname: window.location.hostname,
        url: page,
        title: 'Invoxy VPN',
        language: navigator.language,
        screen: `${window.screen.width}x${window.screen.height}`,
        referrer: '',
        ...(event ? { name: event } : {}),
      })
      .catch(() => {});
  } catch {
    /* Analytics must not interrupt payments. */
  }
}

export function trackCabinetEvent(event: CabinetEvent) {
  const site = document.getElementById(SCRIPT_ID)?.getAttribute('data-website-id');
  const page = analyticsPage(window.location.pathname);
  if (site && page) send(site, page, event);
}

export function useUmamiAnalytics(websiteId?: string) {
  const { pathname } = useLocation();
  useEffect(() => {
    if (!websiteId || !WEBSITE_ID.test(websiteId) || navigator.doNotTrack === '1') {
      document.getElementById(SCRIPT_ID)?.remove();
      return;
    }
    let script = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    if (script && script.dataset.websiteId !== websiteId) {
      script.remove();
      script = null;
    }
    const page = analyticsPage(pathname);
    const pageview = () => {
      if (page) send(websiteId, page);
    };
    if (!script) {
      script = document.createElement('script');
      script.id = SCRIPT_ID;
      script.src = 'https://cloud.umami.is/script.js';
      script.async = true;
      script.dataset.websiteId = websiteId;
      script.dataset.autoTrack = 'false';
      script.dataset.doNotTrack = 'true';
      script.addEventListener('load', pageview);
      document.head.appendChild(script);
    } else if ((window as unknown as { umami?: Tracker }).umami) {
      pageview();
    } else {
      script.addEventListener('load', pageview);
    }
    const click = (event: MouseEvent) => {
      const link = event.target instanceof Element ? event.target.closest('a[href]') : null;
      if (!link) return;
      const url = new URL(link.getAttribute('href') || '', window.location.origin);
      const target = analyticsPage(url.pathname);
      if (page && target && url.origin === window.location.origin)
        send(websiteId, page, `open_${target}`);
    };
    document.addEventListener('click', click);
    return () => {
      script?.removeEventListener('load', pageview);
      document.removeEventListener('click', click);
    };
  }, [websiteId, pathname]);
}
