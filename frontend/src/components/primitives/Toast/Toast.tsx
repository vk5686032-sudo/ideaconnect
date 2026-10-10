import { useState, useEffect, useCallback, createContext, useContext, createPortal } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, CheckCircle, WarningCircle, Warning, Info } from '@phosphor-icons/react';

export interface Toast {
  id: string;
  type?: 'success' | 'error' | 'warning' | 'info' | 'default';
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastContextValue {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => string;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

interface ToastProviderProps {
  children: React.ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast: Toast = { ...toast, id };
    setToasts((prev) => [...prev, newToast]);
    return id;
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

function ToastContainer({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: string) => void }) {
  if (typeof window === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </AnimatePresence>,
    document.body
  );
}

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  useEffect(() => {
    if (toast.duration !== 0) {
      const timer = setTimeout(() => {
        onRemove(toast.id);
      }, toast.duration || 5000);
      return () => clearTimeout(timer);
    }
  }, [toast.id, toast.duration, onRemove]);

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-emerald-500" />,
    error: <WarningCircle className="w-5 h-5 text-rose-500" />,
    warning: <Warning className="w-5 h-5 text-amber-500" />,
    info: <Info className="w-5 h-5 text-cyan-500" />,
    default: <Info className="w-5 h-5 text-primary-500" />,
  };

  const borderColors = {
    success: 'border-emerald-500',
    error: 'border-rose-500',
    warning: 'border-amber-500',
    info: 'border-cyan-500',
    default: 'border-primary',
  };

  const bgColors = {
    success: 'bg-emerald-50 dark:bg-emerald-950/20',
    error: 'bg-rose-50 dark:bg-rose-950/20',
    warning: 'bg-amber-50 dark:bg-amber-950/20',
    info: 'bg-cyan-50 dark:bg-cyan-950/20',
    default: 'bg-primary-50 dark:bg-primary-950/20',
  };

  const type = toast.type || 'default';

  return (
    <motion.div
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 100 }}
      transition={{ duration: 300, ease: [0.32, 0.72, 0, 1] }}
      className={`fixed bottom-6 right-6 z-50 w-96 max-w-[90vw] ${bgColors[type]} ${borderColors[type]} border-l-4 rounded-xl shadow-lg p-4 flex items-start gap-3 animate-slide-right`}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => {
        if (toast.duration !== 0) {
          setVisible(false);
          setTimeout(() => onRemove(toast.id), 300);
        }
      }}
    >
      <div className="flex-shrink-0 mt-0.5">{icons[type]}</div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-zinc-900 dark:text-white">{toast.title}</p>
        {toast.message && (
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{toast.message}</p>
        )}
        {toast.action && (
          <button
            onClick={() => {
              toast.action.onClick();
              onRemove(toast.id);
            }}
            className="mt-2 text-sm font-medium text-primary-600 dark:text-primary-400 hover:underline"
          >
            {toast.action.label}
          </button>
        )}
      </div>
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => {
          setVisible(false);
          setTimeout(() => onRemove(toast.id), 150);
        }}
        className="flex-shrink-0 p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 rounded-lg hover:bg-black/5 dark:hover:bg-white/5"
        aria-label="Dismiss"
      >
        <X className="w-4 h-4" />
      </motion.button>
    </motion.div>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

export default ToastProvider;