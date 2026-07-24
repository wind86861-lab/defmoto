export const locales = ['uz', 'ru', 'en'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'uz';

export const localeNames: Record<Locale, string> = {
  uz: "O'zbek",
  ru: 'Русский',
  en: 'English',
};

// NOTE: no flag emojis — a flag is a country, not a language (🇬🇧 renders as
// "GB" and misrepresents English). The UI shows the locale CODE instead.
