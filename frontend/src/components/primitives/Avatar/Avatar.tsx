import { forwardRef } from 'react';
import { motion } from 'motion/react';

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string;
  alt?: string;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  status?: 'online' | 'offline' | 'busy' | 'away';
  statusPosition?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
}

const sizes = {
  xs: 'w-6 h-6',
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-12 h-12',
  xl: 'w-14 h-14',
  '2xl': 'w-16 h-16',
};

const statusSizes = {
  xs: 'w-2 h-2',
  sm: 'w-2.5 h-2.5',
  md: 'w-3 h-3',
  lg: 'w-3.5 h-3.5',
  xl: 'w-4 h-4',
  '2xl': 'w-5 h-5',
};

const statusColors = {
  online: 'bg-emerald-500',
  offline: 'bg-zinc-400',
  busy: 'bg-rose-500',
  away: 'bg-amber-500',
};

const statusPositions = {
  'bottom-right': 'bottom-0 right-0',
  'bottom-left': 'bottom-0 left-0',
  'top-right': 'top-0 right-0',
  'top-left': 'top-0 left-0',
};

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string;
  alt?: string;
  name?: string;
  size?: keyof typeof sizes;
  status?: 'online' | 'offline' | 'busy' | 'away';
  statusPosition?: keyof typeof statusPositions;
}

export const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
  (
    {
      src,
      alt,
      name,
      size = 'md',
      status,
      statusPosition = 'bottom-right',
      className = '',
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={`relative inline-flex shrink-0 ${className}`}
        {...props}
      >
        <div className={`${sizes[size] || sizes.md} rounded-full overflow-hidden bg-zinc-100 dark:bg-zinc-800 ring-2 ring-white dark:ring-zinc-800`}>
          {src ? (
            <img
              src={src}
              alt={alt || name || 'Avatar'}
              className="w-full h-full object-cover"
            />
          ) : name ? (
            <div className="w-full h-full flex items-center justify-center bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 font-medium">
              {name
                .split(' ')
                .map((n) => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2)}
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-zinc-100 dark:bg-zinc-800">
              <svg className="w-1/2 h-1/2 text-zinc-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.67-5.33-4-8-4z" />
              </svg>
            </div>
          )}
        </div>
        {status && (
          <motion.span
            className={`absolute ${statusPositions[statusPosition]} ${statusColors[status]} rounded-full border-2 border-white dark:border-zinc-900`}
            style={{ width: statusSizes[size], height: statusSizes[size] }}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          />
        )}
      </div>
    );
  }
);

Avatar.displayName = 'Avatar';

export default Avatar;