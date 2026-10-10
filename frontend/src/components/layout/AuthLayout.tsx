import { Outlet, Link } from 'react-router-dom';
import { Lightbulb, X } from '@phosphor-icons/react';
import { useState } from 'react';

const AuthLayout = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950">
      {/* Top bar */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Lightbulb className="w-7 h-7 text-primary-600" />
            <span className="font-bold text-lg hidden sm:block">IdeaConnect</span>
          </Link>

          <nav className="hidden md:flex items-center gap-4">
            <Link to="/login" className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg">
              Login
            </Link>
            <Link to="/register" className="px-4 py-2 text-sm font-medium bg-primary-600 text-white rounded-lg hover:bg-primary-700">
              Sign Up
            </Link>
          </nav>

          <button
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </header>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileMenuOpen(false)} />
          <aside className="absolute top-0 bottom-0 right-0 w-72 max-w-[85vw] bg-white dark:bg-zinc-950 shadow-xl flex flex-col">
            <div className="h-14 flex items-center justify-between px-4 border-b border-zinc-200 dark:border-zinc-800">
              <Link to="/" className="flex items-center gap-2">
                <Lightbulb className="w-7 h-7 text-primary-600" />
                <span className="font-bold text-lg">IdeaConnect</span>
              </Link>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="p-4 space-y-2 flex-1 overflow-y-auto">
              <Link
                to="/login"
                className="block px-4 py-3 text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg"
                onClick={() => setMobileMenuOpen(false)}
              >
                Login
              </Link>
              <Link
                to="/register"
                className="block px-4 py-3 text-primary-600 dark:text-primary-400 font-medium hover:bg-primary-50 dark:hover:bg-primary-950/20 rounded-lg"
                onClick={() => setMobileMenuOpen(false)}
              >
                Sign Up
              </Link>
            </nav>
          </aside>
        </div>
      )}

      <main className="pt-14 lg:pt-16">
        <div className="p-4 sm:p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AuthLayout;