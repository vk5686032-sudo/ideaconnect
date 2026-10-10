import { forwardRef } from 'react';
import { motion } from 'motion/react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      className = '',
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

    return (
      <div className={`w-full ${className}`}>
        {label && (
          <motion.label
            htmlFor={inputId}
            className={`absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 dark:text-zinc-400 pointer-events-none transition-all duration-200 ease-spring
              peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-base
              peer-focus:top-1 peer:-translate-y-1.5 peer-focus:text-xs peer-focus:text-primary
              peer-not-placeholder-shown:top-1 peer:-translate-y-1.5 peer-not-placeholder-shown:text-xs peer-not-placeholder-shown:text-primary
              data-[error]:text-rose-500`}
            style={{ transformOrigin: 'top left' }}
          >
            {label}
          </motion.label>
        )}

        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            className={`
              w-full px-4 py-3 bg-white dark:bg-zinc-950
              border border-zinc-300 dark:border-zinc-700
              rounded-lg
              placeholder:text-zinc-400
              text-zinc-900 dark:text-white
              placeholder:text-zinc-400
              text-base leading-normal
              transition-all duration-200 ease-spring
              focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
              peer
              ${props.className}
            `}
            {...props}
          />

          {error && (
            <div className="absolute -bottom-5 left-0 text-xs text-rose-500" role="alert">
              {error}
            </div>
          )}
        </div>
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;