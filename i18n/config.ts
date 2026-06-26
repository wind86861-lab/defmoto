export const locales = ['uz', 'ru', 'en'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'uz';

export const localeNames: Record<Locale, string> = {
  uz: "O'zbek",
  ru: 'Русский',
  en: 'English',
};

export const localeFlags: Record<Locale, string> = {
  uz: '🇺🇿',
  ru: '🇷🇺',
  en: '🇬🇧',
};
