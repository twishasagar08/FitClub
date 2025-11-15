import React, { useState, useEffect } from 'react';
import { getUsers, getStepsByUserId } from '../api/api';

const StepHistoryPage = () => {
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [stepHistory, setStepHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const data = await getUsers();
      setUsers(data);
    } catch (err) {
      setError('Failed to fetch users: ' + err.message);
    }
  };

  const handleUserChange = async (e) => {
    const userId = e.target.value;
    setSelectedUserId(userId);
    setStepHistory([]);
    setError('');

    if (!userId) return;

    try {
      setLoading(true);
      const data = await getStepsByUserId(userId);
      setStepHistory(data);
    } catch (err) {
      setError('Failed to fetch step history: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const selectedUser = users.find((u) => u.id === selectedUserId);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">📊 Step History</h2>
          <p className="text-gray-600 mb-6">
            View the complete step count history for any user.
          </p>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select User
            </label>
            <select
              value={selectedUserId}
              onChange={handleUserChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">-- Select a user to view history --</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name} ({user.email})
                </option>
              ))}
            </select>
          </div>

          {selectedUser && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">
                    {selectedUser.name}
                  </h3>
                  <p className="text-sm text-gray-600">{selectedUser.email}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Total Steps</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {selectedUser.totalSteps.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          )}

          {loading && <p className="text-gray-600">Loading history...</p>}

          {error && (
            <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          {!loading && selectedUserId && stepHistory.length === 0 && !error && (
            <p className="text-gray-600 text-center py-8">
              No step records found for this user.
            </p>
          )}

          {!loading && stepHistory.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Steps
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {stepHistory.map((record, index) => (
                    <tr
                      key={record.id}
                      className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                        {formatDate(record.date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-blue-600 text-right">
                        {record.steps.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-100">
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-800">
                      Total
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-blue-600 text-right">
                      {stepHistory
                        .reduce((sum, record) => sum + record.steps, 0)
                        .toLocaleString()}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>

        {/* Statistics */}
        {stepHistory.length > 0 && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg shadow-md p-6">
              <p className="text-sm text-gray-600">Total Days</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">
                {stepHistory.length}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <p className="text-sm text-gray-600">Average Daily Steps</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">
                {Math.round(
                  stepHistory.reduce((sum, record) => sum + record.steps, 0) /
                    stepHistory.length
                ).toLocaleString()}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <p className="text-sm text-gray-600">Highest Day</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">
                {Math.max(...stepHistory.map((r) => r.steps)).toLocaleString()}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StepHistoryPage;
