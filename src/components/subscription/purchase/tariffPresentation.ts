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

/** Sentences like «LTE не входит в тариф» move to a dedicated badge on the card. */
const stripNoLteSentences = (text: string, whiteInternetLabel: string) => {
  const label = whiteInternetLabel.toLowerCase();
  return text
    .split('\n')
    .map((line) =>
      (line.match(/[^.!?]+[.!?]*/g) ?? [])
        .filter(
          (sentence) => !(sentence.toLowerCase().includes(label) && /не\s+вход/i.test(sentence)),
        )
        .join('')
        .trim(),
    )
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
};

/** Keep marketing copy, remove dynamic fact bullets, and hide legacy internals. */
export function getTariffMarketingDescription(
  description: string | null,
  whiteInternetLabel = 'LTE',
): string | null {
  if (!description?.trim()) return null;

  const marketingCopy = description
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((line) => line.split(/[•·]/, 1)[0].replace(/\s+/g, ' ').trim())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  if (!marketingCopy) return null;
  const withCustomerTerms = replaceCustomerFacingTerms(marketingCopy, whiteInternetLabel);
  return stripNoLteSentences(withCustomerTerms, whiteInternetLabel) || null;
}

export function getTariffCustomerFacingName(name: string, whiteInternetLabel = 'LTE'): string {
  return replaceCustomerFacingTerms(name.trim(), whiteInternetLabel);
}
