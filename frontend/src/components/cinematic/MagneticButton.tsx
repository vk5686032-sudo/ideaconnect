'use client';

import { useRef, useEffect } from 'react';
import { motion, useMotionValue, useTransform, useReducedMotion } from 'motion/react';

interface MagneticButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  trailingIcon?: React.ReactNode;
  magneticRadius?: number;
  maxOffset?: number;
}

export function MagneticButton({
  children,
  trailingIcon,
  magneticRadius = 80,
  maxOffset = 12,
  className = '',
  onClick,
  disabled,
  ...props
}: MagneticButtonProps) {
  const ref = useRef<HTMLButtonElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (reduce || !ref.current) return;
    const el = ref.current;

    const onMouseMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = (e.clientX - cx) / magneticRadius;
      const dy = (e.clientY - cy) / magneticRadius;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 1) {
        x.set(dx * maxOffset);
        y.set(dy * maxOffset);
      } else {
        x.set(0);
        y.set(0);
      }
    };

    const onMouseLeave = () => {
      x.set(0);
      y.set(0);
    };

    el.addEventListener('mousemove', onMouseMove);
    el.addEventListener('mouseleave', onMouseLeave);
    return () => {
      el.removeEventListener('mousemove', onMouseMove);
      el.removeEventListener('mouseleave', onMouseLeave);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduce, magneticRadius, maxOffset]);

  const tx = useTransform(x, (v) => `${v}px`);
  const ty = useTransform(y, (v) => `${v}px`);
  const iconTx = useTransform(x, (v) => `${v * 1.5}px`);
  const iconTy = useTransform(y, (v) => `${v * 1.5}px`);
  const iconScale = useTransform(x, (v) => 1 + Math.abs(v) * 0.05);

  return (
    <motion.button
      ref={ref}
      style={{ x: tx, y: ty }}
      onClick={onClick}
      disabled={disabled}
      whileTap={{ scale: 0.98 }}
      className={`
        group relative overflow-hidden rounded-full px-6 py-3
        bg-primary-600 text-white font-medium
        active:scale-[0.98] transition-transform duration-75
        ${className}
      `}
      {...props}
    >
      <span className="relative z-10 flex items-center gap-2">
        {children}
        {trailingIcon && (
          <motion.span
            style={{ x: iconTx, y: iconTy, scale: iconScale }}
            className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center"
          >
            {trailingIcon}
          </motion.span>
        )}
      </span>
    </motion.button>
  );
}

export default MagneticButton;