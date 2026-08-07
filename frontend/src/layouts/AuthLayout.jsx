import { Outlet, Link } from 'react-router-dom';
import { Lightbulb } from 'lucide-react';

const AuthLayout = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-purple-50 flex flex-col">
      {/* Header */}
      <header className="p-6">
        <Link to="/" className="inline-flex items-center gap-2">
          <Lightbulb className="w-8 h-8 text-primary-600" />
          <span className="text-xl font-bold text-gray-900">IdeaConnect</span>
        </Link>
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center p-6">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="p-6 text-center text-sm text-gray-500">
        &copy; {new Date().getFullYear()} IdeaConnect. All rights reserved.
      </footer>
    </div>
  );
};

export default AuthLayout;
