import { forwardRef } from 'react';
import { motion } from 'motion/react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'hover' | 'premium' | 'glass';
  hover?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      children,
      variant = 'default',
      hover = false,
      padding = 'md',
      className = '',
      ...props
    },
    ref
  ) => {
    const baseStyles = 'rounded-2xl transition-all duration-300 ease-spring';

    const variants = {
      default: 'bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-sm',
      hover: 'bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-lg hover:border-violet-300 dark:hover:border-violet-700 hover:scale-[1.01] cursor-pointer',
      premium: 'relative',
      glass: 'bg-white/80 dark:bg-zinc-950/80 backdrop-blur-2xl ring-1 ring-black/5 dark:ring-white/10 rounded-2xl shadow-glass',
    };

    const paddingStyles = padding === 'none' ? '' : padding === 'sm' ? 'p-3' : padding === 'md' ? 'p-6' : 'p-8';

    if (variant === 'premium') {
      return (
        <div
          ref={ref}
          className={`relative rounded-[2rem] overflow-hidden ${className}`}
          {...props}
        >
          {/* Outer shell */}
          <div className="absolute inset-0 rounded-[2rem] bg-black/5 dark:bg-white/5 ring-1 ring-black/5 dark:ring-white/10 p-1.5">
            <div
              ref={ref}
              className={`relative rounded-[calc(2rem-0.375rem)] bg-white/80 dark:bg-zinc-950/80 shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] p-6`}
            >
              {children}
            </div>
          </div>
        </div>
      );
    }

    const variantStyles = variants[variant] || variants.default;

    if (hover && variant === 'hover') {
      return (
        <motion.div
          ref={ref}
          className={`${baseStyles} ${variantStyles} ${paddingStyles} ${className}`}
          whileHover={{ scale: 1.01, boxShadow: '0 12px 32px rgba(0,0,0,0.12)' }}
          transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
          {...props}
        >
          {children}
        </motion.div>
      );
    }

    return (
      <div
        ref={ref}
        className={`${baseStyles} ${variantStyles} ${paddingStyles} ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

export default Card;