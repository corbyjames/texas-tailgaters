import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Home } from 'lucide-react';

interface PublicLayoutProps {
  children: React.ReactNode;
  title?: string;
  showBackToHome?: boolean;
}

const PublicLayout: React.FC<PublicLayoutProps> = ({ 
  children, 
  title = "Texas Tailgaters",
  showBackToHome = true 
}) => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Public Header */}
      <header className="bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <span className="text-2xl">🔥</span>
              <h1 className="text-xl font-bold">{title}</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              {showBackToHome && (
                <Link
                  to="/games"
                  className="flex items-center gap-2 text-sm hover:text-orange-200 transition-colors px-3 py-2 rounded-lg bg-white bg-opacity-20"
                >
                  <Home className="w-4 h-4" />
                  <span className="hidden sm:inline">Go to App</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="min-h-screen">
        {children}
      </main>

      {/* Public Footer */}
      <footer className="bg-gray-800 text-white py-8 mt-12">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <span className="text-2xl">🔥</span>
            <h2 className="text-xl font-bold">Texas Tailgaters</h2>
          </div>
          <p className="text-gray-400 mb-4">
            The ultimate Texas Longhorns tailgating community
          </p>
          <div className="flex justify-center space-x-6 text-sm">
            <Link to="/updates" className="hover:text-orange-400 transition-colors">
              Updates
            </Link>
            <Link to="/games" className="hover:text-orange-400 transition-colors">
              Games
            </Link>
            <a href="mailto:admin@texastailgaters.com" className="hover:text-orange-400 transition-colors">
              Contact
            </a>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-700 text-xs text-gray-500">
            <p>&copy; 2024 Texas Tailgaters. Hook 'em Horns! 🤘</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PublicLayout;