import { forwardRef } from 'react';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  (
    {
      children,
      padding = 'md',
      className = '',
      ...props
    },
    ref
  ) => {
    const paddings = {
      none: '',
      sm: 'p-3',
      md: 'p-6',
      lg: 'p-8',
    };

    return (
      <div
        ref={ref}
        className={`
          relative bg-white/80 dark:bg-zinc-950/80 backdrop-blur-2xl
          ring-1 ring-black/5 dark:ring-white/10 rounded-2xl shadow-glass
          ${paddings[padding] || 'p-6'} ${className}
        `}
        {...props}
      >
        {children}
      </div>
    );
  }
);

GlassCard.displayName = 'GlassCard';

export default GlassCard;