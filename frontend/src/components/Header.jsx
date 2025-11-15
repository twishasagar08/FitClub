import React from 'react';

const Header = ({ currentPage, onPageChange }) => {
  const pages = [
    { id: 'users', name: 'Users' },
    { id: 'add-steps', name: 'Add Steps' },
    { id: 'sync-steps', name: 'Sync Steps' },
    { id: 'leaderboard', name: 'Leaderboard' },
    { id: 'history', name: 'Step History' },
  ];

  return (
    <header className="bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg">
      <div className="container mx-auto px-4 py-4">
        <h1 className="text-3xl font-bold mb-4">🏃 FitClub Step Tracker</h1>
        <nav className="flex flex-wrap gap-2">
          {pages.map((page) => (
            <button
              key={page.id}
              onClick={() => onPageChange(page.id)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                currentPage === page.id
                  ? 'bg-white text-blue-600 shadow-md'
                  : 'bg-blue-500 hover:bg-blue-400 text-white'
              }`}
            >
              {page.name}
            </button>
          ))}
        </nav>
      </div>
    </header>
  );
};

export default Header;
