import { getRequestConfig } from 'next-intl/server';
import { cookies, headers } from 'next/headers';
import { defaultLocale, locales, type Locale } from './config';

const COOKIE_NAME = 'NEXT_LOCALE';

function detectLocale(): Locale {
  const cookieLocale = cookies().get(COOKIE_NAME)?.value as Locale | undefined;
  if (cookieLocale && locales.includes(cookieLocale)) return cookieLocale;

  const acceptLanguage = headers().get('accept-language') ?? '';
  const preferred = acceptLanguage
    .split(',')
    .map((part) => part.split(';')[0].trim().toLowerCase().slice(0, 2));
  const match = preferred.find((p): p is Locale =>
    locales.includes(p as Locale),
  );
  return match ?? defaultLocale;
}

export default getRequestConfig(async () => {
  const locale = detectLocale();
  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default,
  };
});
