import { getSafeHttpUrl } from './safeExternalUrl';

/**
 * Open a payment-provider URL the right way for the current platform.
 *
 * In the Telegram in-app WebView, navigating the SAME container to the provider page
 * (window.location.href) breaks when that page hands off to a bank app via a custom scheme
 * — SBP/RollyPay/YooKassa do this. Android then shows a full-page net::ERR_UNKNOWN_URL_SCHEME
 * and iOS opens nothing ("приложение не определяется"), even though link generation succeeded
 * (Telegram bug #654272). Opening in the EXTERNAL browser (openLink) lets the OS hand off to
 * the bank app, and the provider's return_url brings the user back.
 *
 * On the web platform, the cabinet SPA tab must NEVER be unloaded (no window.location.href).
 * We open the payment gateway in a new tab via window.open(url, '_blank', 'noopener,noreferrer').
 * If popup blockers block the new window, we return false so the caller can display a direct
 * fallback link/button, keeping the user in control and the SPA alive with timer and active invoice.
 *
 * Returns true if opened successfully, or false if blocked by a popup blocker.
 */
export function openPaymentUrl(
  url: string,
  platform: string,
  openLink: (url: string) => void,
): boolean {
  const safeUrl = getSafeHttpUrl(url);
  if (!safeUrl) return false;

  if (platform === 'telegram') {
    openLink(safeUrl);
    return true;
  }

  try {
    const win = window.open(safeUrl, '_blank', 'noopener,noreferrer');
    if (!win || win.closed || typeof win.closed === 'undefined') {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}
