import React from 'react';
import { Home, Camera, Fish, Image, Search, BarChart3 } from 'lucide-react';

function Navigation({ currentPage, setCurrentPage }) {
  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'identify', label: 'Identify', icon: Camera },
    { id: 'species', label: 'Species', icon: Fish },
    { id: 'gallery', label: 'Gallery', icon: Image },
    { id: 'search', label: 'Search', icon: Search },
    { id: 'stats', label: 'Stats', icon: BarChart3 },
  ];

  return (
    <nav className="bg-blue-600 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <h1 className="text-xl font-bold mr-8">🐠 Marine Life ID</h1>
            <div className="flex space-x-4">
              {navItems.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setCurrentPage(id)}
                  className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    currentPage === id
                      ? 'bg-blue-700 text-white'
                      : 'text-blue-100 hover:bg-blue-500 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navigation;