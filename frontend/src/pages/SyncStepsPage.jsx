import React, { useState, useEffect } from 'react';
import { getUsers, syncStepsFromGoogleFit } from '../api/api';

const SyncStepsPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await getUsers();
      setUsers(data);
    } catch (err) {
      setError('Failed to fetch users: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async (userId) => {
    try {
      setSyncing(true);
      setError('');
      setSuccess('');
      await syncStepsFromGoogleFit(userId);
      setSuccess('Steps synced successfully from Google Fit!');
      fetchUsers(); // Refresh to show updated totals
    } catch (err) {
      setError('Failed to sync steps: ' + (err.response?.data?.message || err.message));
    } finally {
      setSyncing(false);
    }
  };

  const usersWithToken = users.filter((user) => user.googleAccessToken);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Sync Steps from Google Fit
          </h2>
          <p className="text-gray-600 mb-6">
            Automatically fetch today's step count from Google Fit for users with connected tokens.
          </p>

          {loading && <p className="text-gray-600">Loading users...</p>}

          {!loading && usersWithToken.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-600 mb-2">
                No users have Google Fit access tokens configured.
              </p>
              <p className="text-sm text-gray-500">
                Add a Google Access Token when creating a user to enable sync.
              </p>
            </div>
          )}

          {!loading && usersWithToken.length > 0 && (
            <div className="space-y-4">
              {usersWithToken.map((user) => (
                <div
                  key={user.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-center">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-800">{user.name}</h3>
                      <p className="text-gray-600 text-sm">{user.email}</p>
                      <p className="text-sm text-gray-500 mt-1">
                        Current Total Steps:{' '}
                        <span className="font-semibold text-blue-600">
                          {user.totalSteps.toLocaleString()}
                        </span>
                      </p>
                    </div>
                    <div>
                      <button
                        onClick={() => handleSync(user.id)}
                        disabled={syncing}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors font-medium"
                      >
                        {syncing ? 'Syncing...' : 'Sync Now'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {success && (
            <div className="mt-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg">
              {success}
            </div>
          )}
          {error && (
            <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
              {error}
            </div>
          )}
        </div>

        {/* Info Box */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">📱 How It Works</h3>
          <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
            <li>Each user needs a valid Google Fit access token</li>
            <li>Click "Sync Now" to fetch today's steps from Google Fit</li>
            <li>Steps are automatically synced daily at midnight via cron job</li>
            <li>If a record exists for today, it will be updated with new data</li>
          </ul>
        </div>

        {/* Show all users */}
        {!loading && users.filter((u) => !u.googleAccessToken).length > 0 && (
          <div className="mt-6 bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">
              Users Without Google Fit Token
            </h3>
            <div className="space-y-2">
              {users
                .filter((u) => !u.googleAccessToken)
                .map((user) => (
                  <div
                    key={user.id}
                    className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-gray-800">{user.name}</p>
                      <p className="text-sm text-gray-600">{user.email}</p>
                    </div>
                    <span className="text-sm text-gray-500 italic">No token configured</span>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SyncStepsPage;
