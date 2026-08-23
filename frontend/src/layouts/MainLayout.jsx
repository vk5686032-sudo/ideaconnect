import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Lightbulb,
  LayoutDashboard,
  FolderKanban,
  Users,
  Search,
  Settings,
  User,
  LogOut,
  Menu,
  X,
  LogIn,
  UserPlus,
  Bookmark,
  GraduationCap,
  MailWarning,
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import useAuthStore from '../store/authSlice';
import NotificationsBell from '../components/notifications/NotificationsBell';
import useSocket from '../hooks/useSocket';
import { useQueryClient } from '@tanstack/react-query';
import authApi from '../api/auth.api';

// EMAIL VERIFICATION — TEMPORARILY BYPASSED FOR DEVELOPMENT.
// Backend enforcement lives in backend/src/middlewares/auth.js
// (checkVerification). Flip both to true/restored when re-enabling.
const REQUIRE_EMAIL_VERIFICATION = false;

const MainLayout = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const drawerRef = useRef(null);
  const { user, isAuthenticated, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const socket = useSocket();

  // Refresh session user (verification, role, ban status) on mount so the
  // UI doesn't run on stale persisted state. A 401 is handled globally by
  // the axios interceptor.
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

  // Listen for realtime notifications + messages to live-update UI
  useEffect(() => {
    if (!socket?.connected) return;

    const onNotification = () => {
      queryClient.invalidateQueries(['unread-notifications']);
      queryClient.invalidateQueries(['notifications']);
    };

    const onNewMessage = () => {
      queryClient.invalidateQueries(['chats']);
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

  // Close drawer on route change
  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  // Close drawer on outside click
  useEffect(() => {
    const handler = (e) => {
      if (drawerRef.current && !drawerRef.current.contains(e.target)) {
        setDrawerOpen(false);
      }
    };
    if (drawerOpen) {
      document.addEventListener('mousedown', handler);
    }
    return () => document.removeEventListener('mousedown', handler);
  }, [drawerOpen]);

  const guestNav = [
    { name: 'Browse Ideas', href: '/ideas', icon: Lightbulb },
    { name: 'Explore Projects', href: '/projects', icon: FolderKanban },
    { name: 'Search', href: '/search', icon: Search },
  ];

  const authNav = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Browse Ideas', href: '/ideas', icon: Lightbulb },
    { name: 'Saved Ideas', href: '/bookmarks', icon: Bookmark },
    { name: 'Explore Projects', href: '/projects', icon: FolderKanban },
    { name: 'Mentors', href: '/mentors', icon: GraduationCap },
    { name: 'Chat', href: '/chat', icon: Users },
    { name: 'Search', href: '/search', icon: Search },
  ];

  const adminNav = [{ name: 'Admin Panel', href: '/admin', icon: Settings }];

  const navItems = isAuthenticated ? authNav : guestNav;
  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    // Best-effort server-side revocation of this device's refresh token
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      authApi.logout(refreshToken).catch(() => {});
    }
    logout();
    navigate('/');
  };

  const handleNavClick = () => {
    setDrawerOpen(false);
  };

  const NavLinks = ({ showLabels, onNavigate }) => (
    <>
      {navItems.map((item) => (
        <Link
          key={item.name}
          to={item.href}
          onClick={onNavigate}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
            isActive(item.href)
              ? 'bg-primary-50 text-primary-600'
              : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          <item.icon className="w-5 h-5 flex-shrink-0" />
          {showLabels && <span className="font-medium">{item.name}</span>}
        </Link>
      ))}

      {isAuthenticated && user?.role === 'admin' && (
        <>
          <div className="my-4 border-t border-gray-200" />
          {adminNav.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              onClick={onNavigate}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                isActive(item.href)
                  ? 'bg-primary-50 text-primary-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {showLabels && <span className="font-medium">{item.name}</span>}
            </Link>
          ))}
        </>
      )}
    </>
  );

  const BottomSection = ({ showDetails }) => {
    if (!isAuthenticated) {
      return (
        <div className="p-4 border-t border-gray-200 bg-white space-y-2">
          <Link
            to="/login"
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            <LogIn className="w-4 h-4" /> Login
          </Link>
          <Link
            to="/register"
            className="btn-outline w-full flex items-center justify-center gap-2"
          >
            <UserPlus className="w-4 h-4" /> Sign Up
          </Link>
        </div>
      );
    }

    return (
      <div className="p-4 border-t border-gray-200 bg-white">
        <div className="flex items-center gap-3">
          {user?.avatar?.url ? (
            <img src={user.avatar.url} alt={user.name} className="w-10 h-10 rounded-full flex-shrink-0" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
              <User className="w-5 h-5 text-primary-600" />
            </div>
          )}
          {showDetails && (
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{user?.name}</p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
              <Link to="/settings" onClick={handleNavClick} className="text-xs text-primary-600 hover:text-primary-700 flex items-center gap-1 mt-0.5">
                <Settings className="w-3 h-3" /> Settings
              </Link>
            </div>
          )}
          {showDetails && (
            <button
              onClick={handleLogout}
              className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    );
  };

  const drawerContent = (
    <div className="flex flex-col h-full">
      <div className="h-14 flex items-center justify-between px-4 border-b border-gray-200">
        <Link to={isAuthenticated ? '/dashboard' : '/'} onClick={handleNavClick} className="flex items-center gap-2">
          <Lightbulb className="w-7 h-7 text-primary-600" />
          <span className="font-bold text-lg">IdeaConnect</span>
        </Link>
        <button
          onClick={() => setDrawerOpen(false)}
          className="p-2 rounded-lg hover:bg-gray-100"
          aria-label="Close menu"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      <nav className="p-4 space-y-1 flex-1 overflow-y-auto">
        <NavLinks showLabels={true} onNavigate={handleNavClick} />
      </nav>
      <BottomSection showDetails={true} />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop top bar with hamburger + logo */}
      <header className="hidden lg:flex fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-200 h-16 items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setDrawerOpen(true)}
            className="p-2 rounded-lg hover:bg-gray-100"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <Link to={isAuthenticated ? '/dashboard' : '/'} className="flex items-center gap-2">
            <Lightbulb className="w-7 h-7 text-primary-600" />
            <span className="font-bold text-lg">IdeaConnect</span>
          </Link>
        </div>
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <>
              <NotificationsBell />
              <Link to="/profile" className="flex items-center gap-2">
                {user?.avatar?.url ? (
                  <img src={user.avatar.url} alt={user.name} className="w-9 h-9 rounded-full" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center">
                    <User className="w-4 h-4 text-primary-600" />
                  </div>
                )}
              </Link>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login" className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg">
                Login
              </Link>
              <Link to="/register" className="px-4 py-2 text-sm font-medium bg-primary-600 text-white rounded-lg hover:bg-primary-700">
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </header>

      {/* Mobile top bar */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-200 h-14 flex items-center justify-between px-4">
        <button
          onClick={() => setDrawerOpen(true)}
          className="p-2 rounded-lg hover:bg-gray-100"
          aria-label="Open menu"
        >
          <Menu className="w-6 h-6" />
        </button>
        <Link to={isAuthenticated ? '/dashboard' : '/'} className="flex items-center gap-2">
          <Lightbulb className="w-7 h-7 text-primary-600" />
          <span className="font-bold text-lg">IdeaConnect</span>
        </Link>
        {isAuthenticated ? (
          <div className="flex items-center gap-1">
            <NotificationsBell />
            <Link to="/profile">
              {user?.avatar?.url ? (
                <img src={user.avatar.url} alt={user.name} className="w-8 h-8 rounded-full" />
              ) : null}
            </Link>
          </div>
        ) : (
          <Link to="/login" className="p-2 rounded-lg hover:bg-gray-100">
            <LogIn className="w-6 h-6 text-gray-500" />
          </Link>
        )}
      </header>

      {/* Drawer + backdrop (shared for both mobile and desktop) */}
      <div
        className={`fixed inset-0 z-50 transition-opacity duration-300 ${
          drawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="absolute inset-0 bg-black/50" onClick={() => setDrawerOpen(false)} />
        <aside
          ref={drawerRef}
          className={`absolute top-0 bottom-0 left-0 w-72 max-w-[85vw] bg-white shadow-xl transition-transform duration-300 flex flex-col ${
            drawerOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          {drawerContent}
        </aside>
      </div>

      {/* Unverified email banner */}
      {REQUIRE_EMAIL_VERIFICATION && isAuthenticated && user && !user.isVerified && (
        <div className="fixed top-14 lg:top-16 left-0 right-0 z-30 bg-amber-50 border-b border-amber-200 px-4 py-2">
          <div className="max-w-7xl mx-auto flex items-center gap-2 text-sm text-amber-800">
            <MailWarning className="w-4 h-4 flex-shrink-0" />
            <span className="flex-1">
              Please verify your email address to keep your account secure.
            </span>
            <Link
              to="/verify-email"
              className="text-xs font-medium bg-amber-100 hover:bg-amber-200 text-amber-900 px-3 py-1 rounded-lg whitespace-nowrap"
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
