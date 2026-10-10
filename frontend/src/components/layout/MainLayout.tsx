import { Outlet, Link, useLocation } from 'react-router-dom';
import {
  Lightbulb,
  X,
  MailWarning,
} from '@phosphor-icons/react';
import { useState, useEffect, useRef } from 'react';
import useAuthStore from '../../store/authSlice';
import useSocket from '../../hooks/useSocket';
import { useQueryClient } from '@tanstack/react-query';
import authApi from '../../api/auth.api';
import { MagneticNav } from '../cinematic/MagneticNav';

const REQUIRE_EMAIL_VERIFICATION = false;

const MainLayout = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);
  const { user, isAuthenticated } = useAuthStore();
  const location = useLocation();
  const queryClient = useQueryClient();
  const socket = useSocket();

  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    authApi
      .getMe()
      .then((res) => {
        if (!cancelled && res?.data?.data) {
          useAuthStore.getState().updateUser(res.data.data);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  useEffect(() => {
    if (!socket?.connected) return;

    const onNotification = () => {
      queryClient.invalidateQueries({ queryKey: ['unread-notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    };

    const onNewMessage = () => {
      queryClient.invalidateQueries({ queryKey: ['chats'] });
    };

    socket.on('notification', onNotification);
    socket.on('message:received', onNewMessage);

    if (user?._id) {
      socket.emit('join', user._id);
    }

    return () => {
      socket.off('notification', onNotification);
      socket.off('message:received', onNewMessage);
    };
  }, [socket, user?._id, queryClient]);

  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) {
        setDrawerOpen(false);
      }
    };
    if (drawerOpen) {
      document.addEventListener('mousedown', handler);
    }
    return () => document.removeEventListener('mousedown', handler);
  }, [drawerOpen]);

  const guestNav = [
    { name: 'Browse Ideas', href: '/ideas', label: 'Browse Ideas' },
    { name: 'Explore Projects', href: '/projects', label: 'Explore Projects' },
    { name: 'Search', href: '/search', label: 'Search' },
  ];

  const authNav = [
    { name: 'Dashboard', href: '/dashboard', label: 'Dashboard' },
    { name: 'Browse Ideas', href: '/ideas', label: 'Browse Ideas' },
    { name: 'Saved Ideas', href: '/bookmarks', label: 'Saved Ideas' },
    { name: 'Explore Projects', href: '/projects', label: 'Explore Projects' },
    { name: 'Mentors', href: '/mentors', label: 'Mentors' },
    { name: 'Chat', href: '/chat', label: 'Chat' },
    { name: 'Search', href: '/search', label: 'Search' },
  ];

  const navLinksForMagnetic = isAuthenticated ? authNav : guestNav;

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950">
      {/* Magnetic Navigation */}
      <MagneticNav
        links={navLinksForMagnetic.map(l => ({ label: l.label, href: l.href }))}
        brand={{ label: 'IdeaConnect', href: isAuthenticated ? '/dashboard' : '/' }}
      />

      {/* Drawer for mobile (fallback) */}
      <div
        className={`fixed inset-0 z-50 transition-opacity duration-300 ${
          drawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        } lg:hidden`}
      >
        <div className="absolute inset-0 bg-black/50" onClick={() => setDrawerOpen(false)} />
        <aside
          ref={drawerRef}
          className={`absolute top-0 bottom-0 left-0 w-72 max-w-[85vw] bg-white dark:bg-zinc-950 shadow-xl transition-transform duration-300 flex flex-col ${
            drawerOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="h-14 flex items-center justify-between px-4 border-b border-zinc-200 dark:border-zinc-800">
            <Link to={isAuthenticated ? '/dashboard' : '/'} onClick={handleNavClick} className="flex items-center gap-2">
              <Lightbulb className="w-7 h-7 text-primary-600" />
              <span className="font-bold text-lg">IdeaConnect</span>
            </Link>
            <button
              onClick={() => setDrawerOpen(false)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <nav className="p-4 space-y-1 flex-1 overflow-y-auto">
            {navLinksForMagnetic.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                onClick={handleNavClick}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                  location.pathname === item.href
                    ? 'bg-primary-50 text-primary-600 dark:bg-primary-950/20 dark:text-primary-400'
                    : 'text-gray-600 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800'
                }`}
              >
                {item.icon && <item.icon className="w-5 h-5 flex-shrink-0" />}
                <span className="font-medium">{item.label}</span>
              </Link>
            ))}
          </nav>
        </aside>
      </div>

      {/* Unverified email banner */}
      {REQUIRE_EMAIL_VERIFICATION && isAuthenticated && user && !user.isVerified && (
        <div className="fixed top-14 lg:top-16 left-0 right-0 z-30 bg-amber-50 dark:bg-amber-950/20 border-b border-amber-200 dark:border-amber-800 px-4 py-2">
          <div className="max-w-7xl mx-auto flex items-center gap-2 text-sm text-amber-800 dark:text-amber-200">
            <MailWarning className="w-4 h-4 flex-shrink-0" />
            <span className="flex-1">
              Please verify your email address to keep your account secure.
            </span>
            <Link
              to="/verify-email"
              className="text-xs font-medium bg-amber-100 hover:bg-amber-200 dark:bg-amber-900/30 dark:hover:bg-amber-800/30 text-amber-900 dark:text-amber-100 px-3 py-1 rounded-lg whitespace-nowrap"
            >
              Resend link
            </Link>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className={`min-h-screen ${REQUIRE_EMAIL_VERIFICATION && isAuthenticated && user && !user.isVerified ? 'pt-24 lg:pt-28' : 'pt-14 lg:pt-16'}`}>
        <div className="p-4 sm:p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default MainLayout;