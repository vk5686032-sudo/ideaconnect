import { forwardRef } from 'react';
import { motion } from 'motion/react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  trailingIcon?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      loading = false,
      trailingIcon,
      className = '',
      disabled,
      ...props
    },
    ref
  ) => {
    const variants = {
      primary: 'bg-primary text-white hover:bg-primary-hover shadow-sm hover:shadow-md',
      secondary: 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700',
      accent: 'bg-cyan-500 text-black hover:bg-cyan-600 shadow-sm hover:shadow-md',
      ghost: 'text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800',
      destructive: 'bg-rose-600 text-white hover:bg-rose-700 shadow-sm hover:shadow-md',
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-sm gap-1.5',
      md: 'px-6 py-3 text-base gap-2',
      lg: 'px-8 py-4 text-lg gap-2.5',
    };

    const variantStyles = variants[variant] || variants.primary;
    const sizeStyles = sizes[size] || sizes.md;

    return (
      <motion.button
        ref={ref}
        className={`relative inline-flex items-center justify-center gap-2 font-medium rounded-full font-medium
          focus:outline-none focus:ring-2 focus:ring-offset-2
          disabled:opacity-50 disabled:cursor-not-allowed
          active:scale-[0.98] transition-transform duration-75
          ${sizeStyles} ${variantStyles} ${className}`}
        whileTap={{ scale: 0.98 }}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <>
            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span>Loading...</span>
          </>
        ) : (
          <>
            {children}
            {trailingIcon && (
              <span className="relative z-10 w-8 h-8 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center">
                {trailingIcon}
              </span>
            )}
          </>
        )}
      </motion.button>
    );
  }
);

Button.displayName = 'Button';

export default Button;