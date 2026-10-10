'use client';

import { useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { useReducedMotion } from 'motion/react';

interface HorizontalMarqueeProps {
  items: React.ReactNode[];
  className?: string;
  duration?: number;
  pauseOnHover?: boolean;
}

export function HorizontalMarquee({ items, className = '', duration = 30, pauseOnHover = true }: HorizontalMarqueeProps) {
  const track = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (reduce || !track.current) return;
    const ctx = gsap.context(() => {
      gsap.to(track.current, {
        xPercent: -100,
        ease: 'none',
        duration,
        repeat: -1,
        modifiers: { xPercent: (x) => `${parseFloat(x) % 100}%` },
      });
    }, track);
    return () => ctx.revert();
  }, [reduce, duration]);

  const handleMouseEnter = () => {
    if (pauseOnHover) gsap.to(track.current, { timeScale: 0, duration: 0.3 });
  };

  const handleMouseLeave = () => {
    if (pauseOnHover) gsap.to(track.current, { timeScale: 1, duration: 0.3 });
  };

  return (
    <div className={`relative overflow-hidden ${className}`} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      <div ref={track} className="flex whitespace-nowrap" style={{ animation: 'none' }}>
        {items.map((item, i) => (
          <div key={i} className="flex-shrink-0 px-8">
            {item}
          </div>
        ))}
        {items.map((item, i) => (
          <div key={`${i}-clone`} className="flex-shrink-0 px-8">
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}

export default HorizontalMarquee;