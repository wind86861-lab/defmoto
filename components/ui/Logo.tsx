import { cn } from '@/lib/cn';

interface LogoProps {
  className?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const sizeMap = {
  sm: { icon: 36, text: 'text-base' },
  md: { icon: 44, text: 'text-xl' },
  lg: { icon: 56, text: 'text-2xl' },
};

export function Logo({ className, showText = true, size = 'md' }: LogoProps) {
  const { icon, text } = sizeMap[size];
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <LogoMark size={icon} />
      {showText && (
        <span
          className={cn(
            'font-display font-extrabold tracking-tight text-gradient-yellow',
            text,
          )}
        >
          DEFT MOTO
        </span>
      )}
    </div>
  );
}

// Logo PNG is 279×181 (~1.54 aspect ratio)
const LOGO_ASPECT = 279 / 181;

function LogoMark({ size = 36 }: { size?: number }) {
  return (
    <img
      src="/images/logo-mark.png"
      alt="DEFT MOTO"
      width={Math.round(size * LOGO_ASPECT)}
      height={size}
      className="shrink-0 object-contain drop-shadow-[0_0_12px_rgba(255,184,0,0.55)]"
    />
  );
}
