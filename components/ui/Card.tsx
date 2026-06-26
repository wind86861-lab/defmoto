import { forwardRef, type HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
  glow?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, interactive, glow, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'card-surface relative rounded-2xl overflow-hidden',
        interactive &&
          'cursor-pointer transition-all duration-300 ease-spring hover:-translate-y-1 hover:border-brand-yellow/30 hover:shadow-card-hover',
        glow && 'shadow-glow-sm',
        className,
      )}
      {...props}
    />
  ),
);
Card.displayName = 'Card';

export const CardBody = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-4', className)} {...props} />
  ),
);
CardBody.displayName = 'CardBody';

export const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('px-4 pt-4 pb-2', className)} {...props} />
  ),
);
CardHeader.displayName = 'CardHeader';

export const CardFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('px-4 pb-4 pt-2', className)} {...props} />
  ),
);
CardFooter.displayName = 'CardFooter';
