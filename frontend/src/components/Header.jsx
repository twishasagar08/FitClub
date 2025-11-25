import React from 'react';

const Header = ({ user, onLogout, streak = 7 }) => {
  // Get initials from user name
  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="container mx-auto px-6 py-4">
        <div className="flex justify-between items-center">
          {/* Left side - Logo and welcome message */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl">🏃</span>
              <h1 className="text-xl font-semibold text-gray-800">Wellness Tracker</h1>
            </div>
            {user && (
              <p className="text-sm text-gray-600">Welcome back, {user.name}</p>
            )}
          </div>

          {/* Right side - Streak, Avatar, and Logout */}
          <div className="flex items-center gap-4">
            {/* Streak indicator */}
            <div className="flex items-center gap-2 bg-orange-50 px-3 py-1.5 rounded-full">
              <span className="text-lg">🔥</span>
              <span className="text-sm font-medium text-orange-600">{streak} Day Streak</span>
            </div>

            {/* User avatar */}
            {user && (
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                {getInitials(user.name)}
              </div>
            )}

            {/* Logout button */}
            <button
              onClick={onLogout}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
