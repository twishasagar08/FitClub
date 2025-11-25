import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import LeaderboardPage from './LeaderboardPage';

const Dashboard = () => {
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} onLogout={handleLogout} streak={7} />
      <LeaderboardPage currentUser={user} />
    </div>
  );
};

export default Dashboard;
