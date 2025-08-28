import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useGames } from '../hooks/useGames';

const HomePage: React.FC = () => {
  const { user } = useAuth();
  const { games, loading } = useGames();

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-ut-text mb-4">
            Welcome to Texas Tailgaters
          </h1>
          <p className="text-gray-600 mb-8">
            Manage your UT football tailgate events with ease
          </p>
          <Link
            to="/login"
            className="btn-primary inline-block"
          >
            Sign In to Continue
          </Link>
        </div>
      </div>
    );
  }

  const plannedCount = games.filter(g => g.status === 'planned').length;
  const totalCount = games.length;

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-ut-text mb-2">
          Welcome back, {user.name || 'Tailgater'}! 🤘
        </h1>
        <p className="text-gray-600">
          Ready for another great UT football season?
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-ut-orange">{totalCount}</div>
          <div className="text-sm text-gray-600">Games This Season</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-ut-success">{plannedCount}</div>
          <div className="text-sm text-gray-600">Planned Tailgates</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="space-y-4 mb-6">
        <h2 className="text-lg font-semibold text-ut-text">Quick Actions</h2>
        
        <div className="grid grid-cols-1 gap-3">
          <Link
            to="/games"
            className="card p-4 hover:shadow-ut-hover transition-shadow"
          >
            <div className="flex items-center space-x-3">
              <span className="text-2xl">🏈</span>
              <div>
                <h3 className="font-medium text-ut-text">View Season Schedule</h3>
                <p className="text-sm text-gray-600">See all upcoming games</p>
              </div>
            </div>
          </Link>

          <Link
            to="/potluck"
            className="card p-4 hover:shadow-ut-hover transition-shadow"
          >
            <div className="flex items-center space-x-3">
              <span className="text-2xl">🍖</span>
              <div>
                <h3 className="font-medium text-ut-text">Manage Potluck</h3>
                <p className="text-sm text-gray-600">Sign up for food items</p>
              </div>
            </div>
          </Link>

          {user.isAdmin && (
            <Link
              to="/admin"
              className="card p-4 hover:shadow-ut-hover transition-shadow"
            >
              <div className="flex items-center space-x-3">
                <span className="text-2xl">⚙️</span>
                <div>
                  <h3 className="font-medium text-ut-text">Admin Dashboard</h3>
                  <p className="text-sm text-gray-600">Manage users and settings</p>
                </div>
              </div>
            </Link>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card p-4">
        <h2 className="text-lg font-semibold text-ut-text mb-4">Recent Activity</h2>
        <div className="space-y-3">
          <div className="flex items-center space-x-3 text-sm">
            <span className="text-ut-success">✅</span>
            <span>Schedule synced from UT Athletics</span>
            <span className="text-gray-500">2 hours ago</span>
          </div>
          <div className="flex items-center space-x-3 text-sm">
            <span className="text-ut-warning">⚠️</span>
            <span>{totalCount - plannedCount} games need theme assignment</span>
            <span className="text-gray-500">1 day ago</span>
          </div>
          <div className="flex items-center space-x-3 text-sm">
            <span className="text-ut-success">✅</span>
            <span>John signed up for BBQ Brisket</span>
            <span className="text-gray-500">2 days ago</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
