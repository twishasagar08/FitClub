import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import UserListPage from './UserListPage';
import AddStepsPage from './AddStepsPage';
import SyncStepsPage from './SyncStepsPage';
import LeaderboardPage from './LeaderboardPage';
import StepHistoryPage from './StepHistoryPage';

const Dashboard = () => {
  const [currentPage, setCurrentPage] = useState('leaderboard');
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user data is in URL params (from OAuth callback)
    const params = new URLSearchParams(window.location.search);
    const userId = params.get('userId');
    const userName = params.get('name');
    const success = params.get('success');

    if (success === 'true' && userId) {
      setUser({
        id: userId,
        name: decodeURIComponent(userName || 'User'),
      });
      // Clean up URL
      window.history.replaceState({}, '', '/dashboard');
    } else if (success === 'false') {
      const error = params.get('error');
      alert(`Login failed: ${decodeURIComponent(error || 'Unknown error')}`);
      navigate('/');
    }
  }, [navigate]);

  const handleLogout = () => {
    setUser(null);
    navigate('/');
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'users':
        return <UserListPage />;
      case 'add-steps':
        return <AddStepsPage />;
      case 'sync-steps':
        return <SyncStepsPage />;
      case 'leaderboard':
        return <LeaderboardPage />;
      case 'history':
        return <StepHistoryPage />;
      default:
        return <LeaderboardPage />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Header currentPage={currentPage} onPageChange={setCurrentPage} />
      
      {/* User Info Bar */}
      {user && (
        <div className="bg-white border-b border-gray-200 shadow-sm">
          <div className="container mx-auto px-4 py-3 flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-800">Welcome back!</p>
                <p className="text-xs text-gray-600">{user.name}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="text-sm text-red-600 hover:text-red-800 font-medium"
            >
              Logout
            </button>
          </div>
        </div>
      )}

      <main>{renderPage()}</main>

      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="container mx-auto px-4 py-6 text-center text-gray-600 text-sm">
          <p>FitClub Step Tracking System © 2025</p>
          <p className="mt-1">Built with NestJS, React, PostgreSQL & TailwindCSS</p>
        </div>
      </footer>
    </div>
  );
};

export default Dashboard;
