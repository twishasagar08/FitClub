import React, { useState, useEffect } from 'react';
import { getLeaderboard } from '../api/api';

const LeaderboardPage = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

  const getMedalEmoji = (rank) => {
    switch (rank) {
      case 1:
        return '🥇';
      case 2:
        return '🥈';
      case 3:
        return '🥉';
      default:
        return '🏅';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">🏆 Leaderboard</h2>
            <button
              onClick={fetchLeaderboard}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Refresh
            </button>
          </div>

          {loading && <p className="text-gray-600">Loading leaderboard...</p>}

          {error && (
            <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          {!loading && leaderboard.length === 0 && !error && (
            <p className="text-gray-600 text-center py-8">
              No users found. Create users and add steps to see the leaderboard!
            </p>
          )}

          {!loading && leaderboard.length > 0 && (
            <div className="space-y-3">
              {leaderboard.map((user, index) => {
                const rank = index + 1;
                const isTopThree = rank <= 3;
                return (
                  <div
                    key={user.id}
                    className={`border rounded-lg p-4 transition-all ${
                      isTopThree
                        ? 'border-yellow-400 bg-gradient-to-r from-yellow-50 to-orange-50 shadow-md'
                        : 'border-gray-200 hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div
                          className={`text-3xl font-bold ${
                            isTopThree ? 'text-yellow-600' : 'text-gray-400'
                          }`}
                        >
                          {getMedalEmoji(rank)}
                        </div>
                        <div className="flex items-center space-x-3">
                          <span
                            className={`text-2xl font-bold ${
                              isTopThree ? 'text-yellow-700' : 'text-gray-500'
                            }`}
                          >
                            #{rank}
                          </span>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-800">
                              {user.name}
                            </h3>
                            <p className="text-sm text-gray-600">{user.email}</p>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-blue-600">
                          {user.totalSteps.toLocaleString()}
                        </p>
                        <p className="text-sm text-gray-500">steps</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Summary Stats */}
        {leaderboard.length > 0 && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg shadow-md p-6">
              <p className="text-sm opacity-90">Total Participants</p>
              <p className="text-3xl font-bold mt-2">{leaderboard.length}</p>
            </div>
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-lg shadow-md p-6">
              <p className="text-sm opacity-90">Total Steps</p>
              <p className="text-3xl font-bold mt-2">
                {leaderboard.reduce((sum, user) => sum + user.totalSteps, 0).toLocaleString()}
              </p>
            </div>
            <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg shadow-md p-6">
              <p className="text-sm opacity-90">Average Steps</p>
              <p className="text-3xl font-bold mt-2">
                {Math.round(
                  leaderboard.reduce((sum, user) => sum + user.totalSteps, 0) /
                    leaderboard.length
                ).toLocaleString()}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LeaderboardPage;
