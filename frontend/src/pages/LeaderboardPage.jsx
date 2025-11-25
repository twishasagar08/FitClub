import React, { useState, useEffect } from 'react';
import { getLeaderboard, syncAllUsersFromGoogleFit } from '../api/api';

const LeaderboardPage = ({ currentUser }) => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState('');
  const [syncMessage, setSyncMessage] = useState('');
  const [timeFilter, setTimeFilter] = useState('week'); // 'week' or 'all'
  const [activeTab, setActiveTab] = useState('leaderboard'); // 'overview', 'statistics', 'leaderboard'

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const data = await getLeaderboard();
      setLeaderboard(data);
      setError('');
    } catch (err) {
      setError('Failed to fetch leaderboard: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSyncNow = async () => {
    try {
      setSyncing(true);
      setSyncMessage('');
      setError('');
      
      // Call the sync API
      await syncAllUsersFromGoogleFit();
      
      setSyncMessage('✅ Sync completed! Refreshing leaderboard...');
      
      // Wait a moment for the backend to finish processing
      setTimeout(async () => {
        await fetchLeaderboard();
        setSyncMessage('✅ Leaderboard updated with latest data from Google Fit!');
        
        // Clear message after 5 seconds
        setTimeout(() => {
          setSyncMessage('');
        }, 5000);
      }, 2000);
      
    } catch (err) {
      setError('Failed to sync: ' + err.message);
      setSyncMessage('');
    } finally {
      setSyncing(false);
    }
  };

  const getMedalEmoji = (rank) => {
    switch (rank) {
      case 1:
        return '🥇';
      case 2:
        return '🥈';
      case 3:
        return '🥉';
      default:
        return null;
    }
  };

  // Get initials from name
  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  // Generate avatar color based on index
  const getAvatarColor = (index) => {
    const colors = [
      'bg-green-500', // DM
      'bg-green-500', // TS
      'bg-green-500', // SI
      'bg-green-500', // DB
      'bg-green-500', // VC
      'bg-green-500', // S
      'bg-green-500', // SK
    ];
    return colors[index % colors.length];
  };

  // Calculate streak (mock for now - in real app would come from API)
  const getStreak = (index) => {
    const streaks = [15, 12, 10, 8, 7, 5, 3];
    return streaks[index] || 0;
  };

  // Determine if goal is met (10,000 steps)
  const isGoalMet = (steps) => {
    return steps >= 10000;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-6">
          <nav className="flex gap-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 px-1 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'overview'
                  ? 'border-green-500 text-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('statistics')}
              className={`py-4 px-1 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'statistics'
                  ? 'border-green-500 text-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Statistics
            </button>
            <button
              onClick={() => setActiveTab('leaderboard')}
              className={`py-4 px-1 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'leaderboard'
                  ? 'border-green-500 text-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Leaderboard
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        {activeTab === 'leaderboard' && (
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-6">
              {/* Header with filters */}
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-800">Company Leaderboard</h2>
                <div className="flex gap-2">
                  <button
                    onClick={handleSyncNow}
                    disabled={syncing}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                      syncing
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-blue-500 text-white hover:bg-blue-600'
                    }`}
                  >
                    {syncing ? (
                      <>
                        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Syncing...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Sync Now
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => setTimeFilter('week')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      timeFilter === 'week'
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    This Week
                  </button>
                  <button
                    onClick={() => setTimeFilter('all')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      timeFilter === 'all'
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    All Time
                  </button>
                </div>
              </div>

              {/* Sync success message */}
              {syncMessage && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg flex items-center gap-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  {syncMessage}
                </div>
              )}

              {loading && <p className="text-gray-600 py-8 text-center">Loading leaderboard...</p>}

              {error && (
                <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg mb-4">
                  {error}
                </div>
              )}

              {!loading && leaderboard.length === 0 && !error && (
                <p className="text-gray-600 text-center py-8">
                  No users found. Create users and add steps to see the leaderboard!
                </p>
              )}

              {!loading && leaderboard.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Rank
                        </th>
                        <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Employee
                        </th>
                        <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Steps
                        </th>
                        <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Streak
                        </th>
                        <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {leaderboard.map((user, index) => {
                        const rank = index + 1;
                        const medal = getMedalEmoji(rank);
                        const streak = getStreak(index);
                        const goalMet = isGoalMet(user.totalSteps);
                        const isCurrentUser = currentUser && user.id === currentUser.id;

                        return (
                          <tr
                            key={user.id}
                            className={`${
                              rank <= 3 ? 'bg-green-50' : 'hover:bg-gray-50'
                            } ${isCurrentUser ? 'bg-blue-50' : ''}`}
                          >
                            {/* Rank */}
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-2">
                                {medal && <span className="text-2xl">{medal}</span>}
                                {!medal && (
                                  <span className="text-gray-600 font-medium">{rank}</span>
                                )}
                              </div>
                            </td>

                            {/* Employee */}
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-3">
                                <div
                                  className={`w-10 h-10 ${getAvatarColor(index)} rounded-full flex items-center justify-center text-white font-semibold text-sm`}
                                >
                                  {getInitials(user.name)}
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-gray-900">{user.name}</span>
                                    {isCurrentUser && (
                                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                                        You
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* Steps */}
                            <td className="py-4 px-4">
                              <span className="font-semibold text-gray-900">
                                {user.totalSteps.toLocaleString()}
                              </span>
                            </td>

                            {/* Streak */}
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-1.5">
                                <span className="text-lg">🔥</span>
                                <span className="font-medium text-gray-900">{streak}</span>
                              </div>
                            </td>

                            {/* Status */}
                            <td className="py-4 px-4">
                              {goalMet ? (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-100 text-green-700 rounded-md text-sm font-medium">
                                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path
                                      fillRule="evenodd"
                                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                  Goal Met
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-600 rounded-md text-sm font-medium">
                                  In Progress
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'overview' && (
          <div className="bg-white rounded-lg shadow-sm p-8">
            <div className="text-center text-gray-500">
              <p className="text-lg">Overview section - Coming soon</p>
              <p className="text-sm mt-2">This section will show your personal stats and progress</p>
            </div>
          </div>
        )}

        {activeTab === 'statistics' && (
          <div className="bg-white rounded-lg shadow-sm p-8">
            <div className="text-center text-gray-500">
              <p className="text-lg">Statistics section - Coming soon</p>
              <p className="text-sm mt-2">This section will show detailed analytics and trends</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LeaderboardPage;
