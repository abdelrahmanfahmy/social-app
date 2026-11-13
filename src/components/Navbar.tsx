import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar: React.FC = () => {
  const { token, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const defaultAvatar = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80';

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-xs">
      <div className="max-w-212.5 mx-auto px-4 h-14 flex items-center justify-between">
        <Link to="/" className="text-lg font-bold text-blue-600 tracking-tight hover:text-blue-700">
          SocialApp
        </Link>

        <div className="flex items-center gap-3 text-sm">
          {token ? (
            <>
              <Link
                to="/"
                className="px-3 py-1.5 rounded-md text-slate-700 hover:text-blue-600 hover:bg-slate-100 transition font-medium"
              >
                Home
              </Link>

              <Link
                to="/profile"
                className="flex items-center gap-2 px-2.5 py-1 rounded-md text-slate-700 hover:bg-slate-100 transition font-medium"
              >
                <img
                  src={user?.photo || defaultAvatar}
                  alt={user?.name || 'User'}
                  className="w-7 h-7 rounded-full object-cover border border-slate-300"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = defaultAvatar;
                  }}
                />
                <span className="hidden sm:inline">{user?.name?.split(' ')[0] || 'Profile'}</span>
              </Link>

              <Link
                to="/change-password"
                className="px-3 py-1.5 rounded-md text-slate-700 hover:text-blue-600 hover:bg-slate-100 transition font-medium"
              >
                Password
              </Link>

              <button
                onClick={handleLogout}
                className="px-3 py-1.5 rounded-md bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 transition font-medium text-xs cursor-pointer"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="px-3 py-1.5 rounded-md text-slate-700 hover:text-blue-600 hover:bg-slate-100 transition font-medium"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="px-3.5 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white transition font-medium"
              >
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
