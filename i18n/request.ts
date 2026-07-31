import { getRequestConfig } from 'next-intl/server';
import { cookies } from 'next/headers';
import { defaultLocale, locales, type Locale } from './config';

const COOKIE_NAME = 'NEXT_LOCALE';

function detectLocale(): Locale {
  // First open (no cookie) always defaults to Uzbek — we intentionally ignore
  // the browser's Accept-Language (most local phones report ru) so the site
  // opens in uz. Once the user picks a language the NEXT_LOCALE cookie wins.
  const cookieLocale = cookies().get(COOKIE_NAME)?.value as Locale | undefined;
  if (cookieLocale && locales.includes(cookieLocale)) return cookieLocale;
  return defaultLocale;
}

export default getRequestConfig(async () => {
  const locale = detectLocale();
  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default,
    // Safety net: a missing/unknown key must never crash a page render (an
    // admin-created category slug that isn't in the i18n namespace used to throw
    // MISSING_MESSAGE during SSR). Log in dev, render a readable fallback.
    onError(error) {
      if (process.env.NODE_ENV !== 'production') console.warn('[i18n]', error.message);
    },
    getMessageFallback({ key, namespace }) {
      // Show the last path segment (e.g. the slug) rather than the full key.
      const leaf = key.split('.').pop() || key;
      return namespace ? leaf : key;
    },
  };
});
