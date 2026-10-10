'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Link from 'next/link';

interface NavLink {
  label: string;
  href: string;
}

interface MagneticNavProps {
  links: NavLink[];
  brand?: {
    label: string;
    href: string;
  };
}

export function MagneticNav({ links, brand }: MagneticNavProps) {
  const [open, setOpen] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);

  

  return (
    <>
      {/* Closed State - Floating Glass Pill */}
      <AnimatePresence>
        {!open && (
          <motion.nav
            ref={navRef}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
            className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 
              w-max rounded-full px-6 py-3
              bg-white/80 dark:bg-zinc-950/80
              backdrop-blur-2xl ring-1 ring-black/5 dark:ring-white/10
              shadow-[0_8px_32px_rgba(0,0,0,0.12)]`}
            style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}
          >
            <div className="flex items-center gap-4 px-2">
              <Link href={brand?.href || '/'} className="flex items-center gap-2 font-bold text-lg">
                <span className="text-primary-600">Idea</span><span className="text-gray-900 dark:text-white">Connect</span>
              </Link>
              <div className="hidden md:flex items-center gap-1">
                {links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="px-3 py-1.5 rounded-full text-sm font-medium
                      text-gray-600 hover:text-primary-600 hover:bg-primary-50
                      dark:text-gray-300 dark:hover:text-primary-400 dark:hover:bg-primary-950/20
                      transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setOpen(true)}
                className="md:hidden p-2 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800"
                aria-label="Open menu"
              >
                <HamburgerMorph isOpen={false} />
              </motion.button>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
      
      {/* Open State - Full Screen Modal */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
              className="fixed inset-0 z-50 bg-black/80 backdrop-blur-3xl"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-full max-w-2xl bg-white/95 dark:bg-zinc-950/95 backdrop-blur-3xl rounded-3xl shadow-[0_32px_64px_rgba(0,0,0,0.3)] overflow-hidden">
                <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-zinc-800">
                  <h2 className="text-xl font-bold">Navigation</h2>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setOpen(false)}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800"
                    aria-label="Close menu"
                  >
                    <HamburgerMorph isOpen={true} />
                  </motion.button>
                </div>
                <nav className="p-6 space-y-4">
                  {links.map((link, i) => (
                    <motion.link
                      key={link.href}
                      href={link.href}
                      onClick={() => setOpen(false)}
                      initial={false}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ 
                        delay: i * 0.06, 
                        duration: 0.5, 
                        ease: [0.16, 1, 0.3, 1] 
                      }}
                      className="block px-4 py-3 text-lg font-medium text-gray-700 dark:text-gray-200
                        hover:text-primary-600 dark:hover:text-primary-400
                        rounded-xl hover:bg-primary-50 dark:hover:bg-primary-950/20
                        transition-colors"
                    >
                      {link.label}
                    </motion.link>
                  ))}
                </nav>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

// Hamburger Morph - fluid X formation
function HamburgerMorph({ isOpen }: { isOpen: boolean }) {
  return (
    <svg width={24} height={24} viewBox="0 0 24 24" className="text-gray-700 dark:text-gray-200">
      <motion.path
        d={isOpen ? "M6 6l12 12M18 6l-12 12" : "M4 6h16M4 12h16M4 18h16"}
        initial={false}
        animate={isOpen ? { pathLength: 1 } : { pathLength: 1 }}
        transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default MagneticNav;