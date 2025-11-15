import React, { useState } from 'react';
import Header from './components/Header';
import UserListPage from './pages/UserListPage';
import AddStepsPage from './pages/AddStepsPage';
import SyncStepsPage from './pages/SyncStepsPage';
import LeaderboardPage from './pages/LeaderboardPage';
import StepHistoryPage from './pages/StepHistoryPage';

function App() {
  const [currentPage, setCurrentPage] = useState('users');

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
        return <UserListPage />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Header currentPage={currentPage} onPageChange={setCurrentPage} />
      <main>{renderPage()}</main>
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="container mx-auto px-4 py-6 text-center text-gray-600 text-sm">
          <p>FitClub Step Tracking System © 2025</p>
          <p className="mt-1">Built with NestJS, React, PostgreSQL & TailwindCSS</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
