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
