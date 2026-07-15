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
import { useSiteSettings, DEFAULT_CONTACT } from '@/lib/stores/siteSettings';
import { useContentStore } from '@/lib/stores/content';
import { categoryName as resolveCategoryName } from '@/lib/categoryName';
import { mockCategories } from '@/mocks/categories';
import { useMounted } from '@/hooks/useMounted';

// Turn an admin-entered handle/number into a full URL for each platform.
function socialHref(kind: 'telegram' | 'whatsapp' | 'instagram' | 'viber', v?: string): string | null {
  const s = (v || '').trim();
  if (!s) return null;
  if (/^https?:\/\//i.test(s)) return s;
  const handle = s.replace(/^@/, '');
  const digits = s.replace(/\D/g, '');
  switch (kind) {
    case 'telegram':
      return `https://t.me/${handle}`;
    case 'instagram':
      return `https://instagram.com/${handle}`;
    case 'whatsapp':
      return digits ? `https://wa.me/${digits}` : null;
    case 'viber':
      return digits ? `viber://chat?number=%2B${digits}` : s;
  }
}

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
  const tHome = useTranslations('home');
  const tCategories = useTranslations('categories');
  const mounted = useMounted();
  // Catalog links follow the live admin categories (first 6), mock as fallback.
  const storeCategories = useContentStore((s) => s.categories);
  const categories = (mounted && storeCategories.length ? storeCategories : mockCategories).slice(0, 6);
  const storedContact = useSiteSettings((s) => s.contact);
  const contact = mounted && storedContact ? { ...DEFAULT_CONTACT, ...storedContact } : DEFAULT_CONTACT;
  // Translatable prose (tagline / address / hours) falls back to the localized
  // i18n string when the admin hasn't set a custom value — so it stays correct
  // in all 3 languages. Phone & socials are universal → admin single-value.
  const tagline = contact.tagline?.trim() || t('tagline');
  const address = contact.address?.trim() || t('addressText');
  const workingHours = contact.workingHours?.trim() || t('hoursText');
  const socials = [
    { kind: 'telegram' as const, color: '#229ED9', label: 'Telegram', href: socialHref('telegram', contact.telegram), icon: <Send className="h-4 w-4" fill="currentColor" /> },
    { kind: 'whatsapp' as const, color: '#25D366', label: 'WhatsApp', href: socialHref('whatsapp', contact.whatsapp), icon: <WhatsAppIcon className="h-4 w-4" /> },
    { kind: 'viber' as const, color: '#7360F2', label: 'Viber', href: socialHref('viber', contact.viber), icon: <ViberIcon className="h-4 w-4" /> },
    { kind: 'instagram' as const, color: '#E1306C', label: 'Instagram', href: socialHref('instagram', contact.instagram), icon: <Instagram className="h-4 w-4" /> },
  ].filter((s) => s.href);

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
              {tagline}
            </p>
            {socials.length > 0 && (
              <div className="mt-5 flex items-center gap-2.5">
                {socials.map((s) => (
                  <SocialDot key={s.kind} color={s.color} href={s.href!} label={s.label} className="h-9 w-9">
                    {s.icon}
                  </SocialDot>
                ))}
              </div>
            )}
          </div>

          {/* Catalog */}
          <div>
            <h4 className="mb-4 text-xs font-bold uppercase tracking-wider text-white/40">
              {t('catalogTitle')}
            </h4>
            <ul className="space-y-2.5 text-sm">
              {categories.map((c) => (
                <FooterLink key={c.id} href={`/catalog?category=${c.slug}`}>
                  {c.slug ? resolveCategoryName(tCategories, c) : c.name}
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
              {contact.phone && (
                <li className="flex items-start gap-2.5">
                  <Phone className="mt-0.5 h-4 w-4 shrink-0 text-brand-yellow" />
                  <a href={`tel:${contact.phone.replace(/\s/g, '')}`} className="hover:text-brand-yellow">
                    {contact.phone}
                  </a>
                </li>
              )}
              {address && (
                <li className="flex items-start gap-2.5">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-yellow" />
                  <span>{address}</span>
                </li>
              )}
              {workingHours && (
                <li className="flex items-start gap-2.5">
                  <Clock className="mt-0.5 h-4 w-4 shrink-0 text-brand-yellow" />
                  <span>{workingHours}</span>
                </li>
              )}
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
