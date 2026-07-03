'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import {
  Phone,
  MapPin,
  Clock,
  Send,
  Instagram,
  Truck,
  CreditCard,
  Headphones,
  Layers,
  BadgePercent,
} from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import { SocialDot, WhatsAppIcon, ViberIcon } from '@/components/ui/SocialIcons';
import { FooterSmoke } from '@/components/ui/FooterSmoke';
import { telegramHref, telegramLabel } from '@/lib/contactLinks';
import { mockBranches } from '@/mocks/branches';

const catalogLinks = [
  'motorcycles',
  'gear',
  'parts',
  'accessories',
  'oils',
  'tires',
] as const;

const companyLinks = [
  { href: '/', key: 'home' },
  { href: '/branches', key: 'branches' },
  { href: '/service', key: 'service' },
  { href: '/blog', key: 'blog' },
  { href: '/about', key: 'about' },
] as const;

export function Footer() {
  const t = useTranslations('footer');
  const tNav = useTranslations('nav');
  const tContact = useTranslations('contact');
  const tHome = useTranslations('home');
  const headOffice = mockBranches.find((b) => b.isHeadOffice) ?? mockBranches[0];

  const trustItems = [
    { icon: Layers, label: tHome('benefitChoice') },
    { icon: BadgePercent, label: tHome('benefitPrices') },
    { icon: Truck, label: tHome('benefitDelivery') },
    { icon: Headphones, label: tHome('benefitSupport') },
    { icon: CreditCard, label: tHome('benefitPayment') },
  ];

  return (
    <footer className="relative border-t border-brand-surface-border bg-brand-dark">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-yellow/50 to-transparent" />

      {/* Trust strip */}
      <div className="border-b border-brand-surface-border/60 bg-brand-surface/30">
        <div className="mx-auto max-w-[1320px] px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-y-4 py-6 sm:flex sm:flex-wrap sm:items-center sm:justify-between sm:gap-4 sm:py-5">
            {trustItems.map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-yellow/10 text-brand-yellow">
                  <Icon className="h-4 w-4" strokeWidth={2} />
                </span>
                <span className="text-[13px] font-semibold leading-tight text-white/75">
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="relative mx-auto max-w-[1320px] px-4 pb-10 pt-12 sm:px-6 lg:px-8">
        <FooterSmoke />
        <div className="relative z-10 grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-5">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-2">
            <Logo size="md" />
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/55">
              {t('tagline')}
            </p>
            <div className="mt-5 flex items-center gap-2.5">
              <SocialDot color="#229ED9" href="https://t.me/" label="Telegram" className="h-9 w-9">
                <Send className="h-4 w-4" fill="currentColor" />
              </SocialDot>
              <SocialDot color="#25D366" href="https://wa.me/" label="WhatsApp" className="h-9 w-9">
                <WhatsAppIcon className="h-4 w-4" />
              </SocialDot>
              <SocialDot color="#7360F2" href="https://viber.com" label="Viber" className="h-9 w-9">
                <ViberIcon className="h-4 w-4" />
              </SocialDot>
              <SocialDot color="#E1306C" href="https://instagram.com/" label="Instagram" className="h-9 w-9">
                <Instagram className="h-4 w-4" />
              </SocialDot>
            </div>
          </div>

          {/* Catalog */}
          <div>
            <h4 className="mb-4 text-xs font-bold uppercase tracking-wider text-white/40">
              {t('catalogTitle')}
            </h4>
            <ul className="space-y-2.5 text-sm">
              {catalogLinks.map((slug) => (
                <FooterLink key={slug} href={`/catalog?category=${slug}`}>
                  {tNav(slug)}
                </FooterLink>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="mb-4 text-xs font-bold uppercase tracking-wider text-white/40">
              {t('companyTitle')}
            </h4>
            <ul className="space-y-2.5 text-sm">
              {companyLinks.map((item) => (
                <FooterLink key={item.href} href={item.href}>
                  {tNav(item.key)}
                </FooterLink>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="mb-4 text-xs font-bold uppercase tracking-wider text-white/40">
              {t('contactTitle')}
            </h4>
            <ul className="space-y-3 text-sm text-white/70">
              <li className="flex items-start gap-2.5">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-brand-yellow" />
                <a
                  href={`tel:${tContact('phone').replace(/\D/g, '')}`}
                  className="hover:text-brand-yellow"
                >
                  {tContact('phone')}
                </a>
              </li>
              {telegramHref(headOffice.telegram) && (
                <li className="flex items-start gap-2.5">
                  <Send className="mt-0.5 h-4 w-4 shrink-0 text-brand-yellow" />
                  <a
                    href={telegramHref(headOffice.telegram)!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-brand-yellow"
                  >
                    {telegramLabel(headOffice.telegram)}
                  </a>
                </li>
              )}
              <li className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-yellow" />
                <span>
                  {headOffice.address}, {headOffice.city}
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-brand-yellow" />
                <span>{headOffice.workingHours}</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="relative z-10 mt-10 flex flex-col items-start justify-between gap-3 border-t border-brand-surface-border pt-6 text-xs text-white/35 sm:flex-row sm:items-center">
          <p>
            © {new Date().getFullYear()} DEFT MOTO. {t('rightsReserved')}
          </p>
          <p>{t('madeFor')}</p>
        </div>
      </div>
    </footer>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <li>
      <Link href={href} className="text-white/65 transition-colors hover:text-brand-yellow">
        {children}
      </Link>
    </li>
  );
}
