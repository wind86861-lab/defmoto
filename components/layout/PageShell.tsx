import { Header } from './Header';
import { BottomNav } from './BottomNav';
import { Footer } from './Footer';
import { DemoBadge } from '@/components/features/DemoBadge';
import { cn } from '@/lib/cn';

export function PageShell({
  children,
  hideHeader,
  hideFooter,
  hideBottomNav,
}: {
  children: React.ReactNode;
  hideHeader?: boolean;
  hideFooter?: boolean;
  hideBottomNav?: boolean;
}) {
  return (
    <>
      {!hideHeader && <Header />}
      <main
        className={cn(
          // overflow-x-clip contains horizontal slide-in reveal animations so
          // they can't push the page wider than the viewport (no h-scroll on
          // mobile). clip — not hidden — so sticky descendants keep working.
          'overflow-x-clip',
          hideHeader
            ? 'min-h-[var(--tg-viewport-height,100vh)]'
            : 'min-h-[calc(var(--tg-viewport-height,100vh)-3.5rem)]',
          !hideBottomNav && 'pb-20 xl:pb-0',
        )}
      >
        {children}
      </main>
      {!hideFooter && <Footer />}
      {!hideBottomNav && <BottomNav />}
      <DemoBadge />
    </>
  );
}
