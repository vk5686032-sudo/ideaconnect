'use client';

import { motion, useReducedMotion } from 'motion/react';

interface ScrollRevealStaggerProps {
  children: React.ReactNode[];
  className?: string;
  duration?: number;
  delay?: number;
  stagger?: number;
  initialY?: number;
}

export function ScrollRevealStagger({
  children,
  className = '',
  duration = 800,
  delay = 100,
  stagger = 80,
  initialY = 16,
}: ScrollRevealStaggerProps) {
  const reduce = useReducedMotion();

  return (
    <div className={className}>
      {children.map((child, i) => (
        <motion.div
          key={i}
          initial={reduce ? false : { opacity: 0, y: initialY, filter: 'blur(8px)' }}
          whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{
            duration: duration / 1000,
            delay: delay / 1000 + i * (stagger / 1000),
            ease: [0.16, 1, 0.3, 1],
          }}
        >
          {child}
        </motion.div>
      ))}
    </div>
  );
}

export default ScrollRevealStagger;