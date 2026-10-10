import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CaretDown } from '@phosphor-icons/react';

interface DropdownProps {
  trigger: React.ReactNode;
  items: Array<{
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
    disabled?: boolean;
    danger?: boolean;
  }>;
  align?: 'left' | 'right';
  className?: string;
}

export function Dropdown({ trigger, items, align = 'right', className = '' }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        if (triggerRef.current && !triggerRef.current.contains(e.target as Node)) {
          setOpen(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleItemClick = (item: typeof items[0]) => {
    if (!item.disabled) {
      item.onClick();
      setOpen(false);
    }
  };

  return (
    <div className={`relative inline-block ${className}`}>
      <button
        ref={triggerRef}
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
        aria-haspopup="true"
        aria-expanded={open}
      >
        {typeof trigger === 'string' ? trigger : trigger}
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 200, ease: [0.32, 0.72, 0, 1] }}
        >
          <CaretDown className="w-4 h-4" />
        </motion.span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 150, ease: [0.16, 1, 0.3, 1] }}
            className={`absolute ${open ? 'opacity-100' : 'opacity-0'} ${align === 'right' ? 'right-0' : 'left-0'} mt-2 w-56 origin-top-right`}
            style={{ zIndex: 50 }}
          >
            <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-lg border border-zinc-200 dark:border-zinc-800 py-1 overflow-hidden">
              {items.map((item, index) => (
                <motion.button
                  key={index}
                  onClick={() => handleItemClick(item)}
                  disabled={item.disabled}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ delay: index * 0.03, duration: 150, ease: [0.16, 1, 0.3, 1] }}
                  className={`w-full px-4 py-2.5 text-left text-sm font-medium text-left flex items-center gap-2 
                    ${item.danger ? 'text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20' : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800'}
                    ${item.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                  `}
                >
                  {item.icon && <span className="w-4 h-4 flex-shrink-0">{item.icon}</span>}
                  <span className="flex-1">{item.label}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default Dropdown;