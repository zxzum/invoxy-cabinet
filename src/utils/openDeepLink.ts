import { isInTelegramWebApp } from '@/hooks/useTelegramSDK';
import { openLink as sdkOpenLink } from '@telegram-apps/sdk-react';
import { openAppScheme } from './openAppScheme';

/**
 * Open a custom-scheme deep link (happ://, incy://, v2rayng://, etc.) or http(s) link.
 *
 * In Telegram Mini App WebView, custom URI schemes are either ignored or trigger an
 * ERR_UNKNOWN_URL_SCHEME error. To reliably open Happ, INCY, or other clients, we route
 * custom schemes through an external browser redirect:
 * `${origin}/miniapp/redirect.html?url=...` using Telegram SDK's `openLink(target, { tryInstantView: false })`.
 * This forces Telegram to launch the device's default web browser (Safari / Chrome),
 * which can then successfully invoke the installed VPN application.
 *
 * In standard web browsers, openAppScheme is used directly.
 */
export function openDeepLink(url: string | null | undefined, language: string = 'ru'): void {
  if (!url) return;

  const isHttp = /^https?:\/\//i.test(url);

  if (isInTelegramWebApp()) {
    if (isHttp) {
      try {
        sdkOpenLink(url, { tryInstantView: false });
        return;
      } catch {
        const tg = (
          window as unknown as {
            Telegram?: { WebApp?: { openLink?: (u: string, o?: unknown) => void } };
          }
        ).Telegram?.WebApp;
        if (tg?.openLink) {
          tg.openLink(url, { try_instant_view: false });
          return;
        }
        window.location.href = url;
        return;
      }
    }

    // Custom scheme: happ://, incy://, vless://, etc.
    const redirectUrl = `${window.location.origin}/miniapp/redirect.html?url=${encodeURIComponent(url)}&lang=${language || 'ru'}`;
    try {
      sdkOpenLink(redirectUrl, { tryInstantView: false });
      return;
    } catch {
      const tg = (
        window as unknown as {
          Telegram?: { WebApp?: { openLink?: (u: string, o?: unknown) => void } };
        }
      ).Telegram?.WebApp;
      if (tg?.openLink) {
        tg.openLink(redirectUrl, { try_instant_view: false });
        return;
      }
    }
  }

  // Regular browser
  openAppScheme(url);
}
