const URL_WITH_SCHEME = /^[a-z][a-z\d+.-]*:\/\//i;
const BLOCKED_SCHEMES = /^(?:javascript|data|vbscript|file|blob|about|intent|content|filesystem):/i;

export function getSafeExternalUrl(value: unknown): string | null {
  if (typeof value !== 'string') return null;

  const url = value.trim();
  if (!url || BLOCKED_SCHEMES.test(url) || !URL_WITH_SCHEME.test(url)) return null;

  try {
    new URL(url);
    return url;
  } catch {
    return null;
  }
}
