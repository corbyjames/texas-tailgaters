import React from 'react';
import { useAuth } from '../../hooks/useAuth';

const Header: React.FC = () => {
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <header className="bg-gradient-to-r from-ut-orange to-orange-600 text-white shadow-lg">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">🔥</span>
            <h1 className="text-xl font-bold">Texas Tailgaters</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            {user && (
              <>
                <span className="text-sm hidden sm:block">
                  Welcome, {user.name || user.email}
                </span>
                {user.isAdmin && (
                  <span className="bg-white bg-opacity-20 px-2 py-1 rounded text-xs">
                    Admin
                  </span>
                )}
                <button
                  onClick={handleSignOut}
                  className="text-sm hover:text-orange-200 transition-colors"
                >
                  Sign Out
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;

