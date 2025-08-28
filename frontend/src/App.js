import React, { useState } from 'react';
import Navigation from './components/Navigation';
import HomePage from './components/HomePage';
import IdentifyPage from './components/IdentifyPage';
import SpeciesPage from './components/SpeciesPage';
import GalleryPage from './components/GalleryPage';

function App() {
  const [currentPage, setCurrentPage] = useState('home');

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage setCurrentPage={setCurrentPage} />;
      case 'identify':
        return <IdentifyPage />;
      case 'species':
        return <SpeciesPage />;
      case 'gallery':
        return <GalleryPage />;
      case 'search':
        return <SearchPage />;
      case 'stats':
        return <StatsPage />;
      default:
        return <HomePage setCurrentPage={setCurrentPage} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation currentPage={currentPage} setCurrentPage={setCurrentPage} />
      {renderPage()}
    </div>
  );
}

function SearchPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h2 className="text-3xl font-bold text-gray-800 mb-4">Advanced Search</h2>
      <p className="text-gray-600">Advanced search feature coming soon...</p>
    </div>
  );
}

function StatsPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h2 className="text-3xl font-bold text-gray-800 mb-4">Statistics & Analytics</h2>
      <p className="text-gray-600">Statistics dashboard coming soon...</p>
    </div>
  );
}

export default App;
