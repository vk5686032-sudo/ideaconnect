import { forwardRef } from 'react';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'primary' | 'success' | 'warning' | 'error' | 'neutral';
  size?: 'sm' | 'md';
  dot?: boolean;
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      dot = false,
      className = '',
      ...props
    },
    ref
  ) => {
    const variants = {
      primary: 'bg-primary text-white',
      success: 'bg-emerald-500 text-white',
      warning: 'bg-amber-500 text-black',
      error: 'bg-rose-500 text-white',
      neutral: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
    };

    const sizes = {
      sm: 'px-2 py-0.5 text-[10px]',
      md: 'px-2.5 py-0.5 text-xs',
    };

    const variantStyle = variants[variant] || variants.primary;
    const sizeStyle = sizes[size] || sizes.md;

    return (
      <span
        ref={ref}
        className={`
          inline-flex items-center gap-1.5 rounded-full font-medium
          ${sizeStyle} ${variantStyle} ${className}
        `}
        {...props}
      >
        {dot && <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />}
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';

export default Badge;