const replaceCustomerFacingTerms = (text: string, whiteInternetLabel: string) =>
  text
    .replace(/\bremnawave\b/gi, 'VPN')
    .replace(
      /\bwhitelist(?:[-\s]+(?:traffic|трафик(?:а|ом|у|е)?|nodes?|ноды?))?/gi,
      () => whiteInternetLabel,
    )
    .replace(/white\s+lists?/gi, () => whiteInternetLabel)
    .replace(/с\s+бел(?:ыми|ым)\s+спис(?:ками|ком)/gi, () => whiteInternetLabel)
    .replace(
      /бел(?:ый|ого|ому|ым|ом|ые|ых|ыми|ой|ое)?\s+спис(?:ок|ки|ков|ками|ках|ком|ку|ке)/gi,
      () => whiteInternetLabel,
    );

/** Keep marketing copy, remove dynamic fact bullets, and hide legacy internals. */
export function getTariffMarketingDescription(
  description: string | null,
  whiteInternetLabel = 'Белый интернет',
): string | null {
  if (!description?.trim()) return null;

  const marketingCopy = description
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((line) => line.split(/[•·]/, 1)[0].replace(/\s+/g, ' ').trim())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return marketingCopy ? replaceCustomerFacingTerms(marketingCopy, whiteInternetLabel) : null;
}

export function getTariffCustomerFacingName(
  name: string,
  whiteInternetLabel = 'Белый интернет',
): string {
  return replaceCustomerFacingTerms(name.trim(), whiteInternetLabel);
}
