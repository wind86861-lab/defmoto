import type { Metadata, Viewport } from 'next';
import { Inter, Sora } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import { TelegramProvider } from '@/components/providers/TelegramProvider';
import { Toaster } from '@/components/ui/Toaster';
import { CursorSmoke } from '@/components/ui/CursorSmoke';
import './globals.css';

const inter = Inter({
  subsets: ['latin', 'cyrillic', 'cyrillic-ext', 'latin-ext'],
  variable: '--font-inter',
  display: 'swap',
});

const sora = Sora({
  subsets: ['latin'],
  weight: ['600', '700', '800'],
  variable: '--font-sora',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'DEFT MOTO — Moto-texnika va ehtiyot qismlar',
    template: '%s · DEFT MOTO',
  },
  description:
    'DEFT MOTO — Telegram Mini App: mototsikllar, skuterlar, ehtiyot qismlar va aksessuarlar. Bozordan arzon narxlar, rasmiy kafolat, 3+ filial.',
  manifest: '/manifest.json',
  applicationName: 'DEFT MOTO',
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: '#0A0A0A',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} className={`${inter.variable} ${sora.variable} dark`}>
      <head>
        <script src="https://telegram.org/js/telegram-web-app.js" async />
      </head>
      <body className="font-sans">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <TelegramProvider>{children}</TelegramProvider>
          <Toaster />
          <CursorSmoke />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
