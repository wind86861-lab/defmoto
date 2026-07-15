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
  };
});
