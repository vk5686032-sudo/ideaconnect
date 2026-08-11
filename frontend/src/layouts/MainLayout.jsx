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
  ChevronLeft,
  Menu,
  X,
  LogIn,
  UserPlus,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import useAuthStore from '../store/authSlice';
import NotificationsBell from '../components/notifications/NotificationsBell';
import useSocket from '../hooks/useSocket';
import { useQueryClient } from '@tanstack/react-query';

const MainLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const socket = useSocket();

  // Listen for realtime notifications + messages to live-update UI
  useEffect(() => {
    if (!socket?.connected) return;

    const onNotification = (data) => {
      queryClient.invalidateQueries(['unread-notifications']);
      queryClient.invalidateQueries(['notifications']);
    };

    const onNewMessage = (data) => {
      queryClient.invalidateQueries(['chats']);
    };

    socket.on('notification', onNotification);
    socket.on('message:received', onNewMessage);

    // Join personal room for notifications
    if (user?._id) {
      socket.emit('join', user._id);
    }

    return () => {
      socket.off('notification', onNotification);
      socket.off('message:received', onNewMessage);
    };
  }, [socket, user?._id, queryClient]);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const guestNav = [
    { name: 'Browse Ideas', href: '/ideas', icon: Lightbulb },
    { name: 'Explore Projects', href: '/projects', icon: FolderKanban },
    { name: 'Search', href: '/search', icon: Search },
  ];

  const authNav = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Browse Ideas', href: '/ideas', icon: Lightbulb },
    { name: 'Explore Projects', href: '/projects', icon: FolderKanban },
    { name: 'Chat', href: '/chat', icon: Users },
    { name: 'Search', href: '/search', icon: Search },
    { name: 'Profile', href: '/profile', icon: User },
  ];

  const adminNav = [{ name: 'Admin Panel', href: '/admin', icon: Settings }];

  const navItems = isAuthenticated ? authNav : guestNav;
  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    logout();
    navigate('/');
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
        {showDetails && (
          <button
            onClick={handleLogout}
            className="mt-2 w-full flex items-center justify-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors lg:hidden"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-sm">Logout</span>
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop sidebar (lg+) */}
      <aside
        className={`hidden lg:flex ${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-white border-r border-gray-200 transition-all duration-300 fixed top-0 bottom-0 left-0 z-40 flex-col`}
      >
        <div className="h-16 flex items-center gap-1 px-3 sm:px-4 border-b border-gray-200">
          {sidebarOpen && (
            <Link to="/" className="flex items-center gap-2 min-w-0 flex-1">
              <Lightbulb className="w-7 h-7 sm:w-8 sm:h-8 text-primary-600 flex-shrink-0" />
              <span className="font-bold text-lg truncate">IdeaConnect</span>
            </Link>
          )}
          <div className="ml-auto flex items-center gap-1 flex-shrink-0">
            {isAuthenticated && sidebarOpen && <NotificationsBell />}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg hover:bg-gray-100"
              aria-label="Toggle sidebar"
            >
              <ChevronLeft
                className={`w-5 h-5 transition-transform ${!sidebarOpen && 'rotate-180'}`}
              />
            </button>
          </div>
        </div>

        <nav className="p-4 space-y-1 flex-1 overflow-y-auto">
          <NavLinks showLabels={sidebarOpen} />
        </nav>

        <BottomSection showDetails={sidebarOpen} />
      </aside>

      {/* Mobile top bar (hamburger + logo only — no nav links) */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-200 h-14 flex items-center justify-between px-4">
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 rounded-lg hover:bg-gray-100"
          aria-label="Open menu"
        >
          <Menu className="w-6 h-6" />
        </button>
        <Link to="/" className="flex items-center gap-2">
          <Lightbulb className="w-7 h-7 text-primary-600" />
          <span className="font-bold text-lg">IdeaConnect</span>
        </Link>
        {isAuthenticated ? (
          <div className="flex items-center gap-1">
            <NotificationsBell />
            {user?.avatar?.url ? (
              <img src={user.avatar.url} alt={user.name} className="w-8 h-8 rounded-full" />
            ) : null}
          </div>
        ) : (
          <Link to="/login" className="p-2 rounded-lg hover:bg-gray-100">
            <LogIn className="w-6 h-6 text-gray-500" />
          </Link>
        )}
      </header>

      {/* Mobile drawer + backdrop */}
      <div
        className={`lg:hidden fixed inset-0 z-50 transition-opacity duration-300 ${
          mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
        <aside
          className={`absolute top-0 bottom-0 left-0 w-72 max-w-[85vw] bg-white shadow-xl transition-transform duration-300 flex flex-col ${
            mobileOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="h-14 flex items-center justify-between px-4 border-b border-gray-200">
            <Link to="/" className="flex items-center gap-2">
              <Lightbulb className="w-7 h-7 text-primary-600" />
              <span className="font-bold text-lg">IdeaConnect</span>
            </Link>
            <button
              onClick={() => setMobileOpen(false)}
              className="p-2 rounded-lg hover:bg-gray-100"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <nav className="p-4 space-y-1 flex-1 overflow-y-auto">
            <NavLinks showLabels={true} onNavigate={() => setMobileOpen(false)} />
          </nav>
          <BottomSection showDetails={true} />
        </aside>
      </div>

      {/* Main content */}
      <main
        className={`transition-all duration-300 ${
          sidebarOpen ? 'lg:ml-64' : 'lg:ml-20'
        } pt-14 lg:pt-0 min-h-screen`}
      >
        <div className="p-4 sm:p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default MainLayout;
