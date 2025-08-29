import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const BottomNav: React.FC = () => {
  const { user } = useAuth();

  if (!user) return null;

  const navItems = [
    { path: '/', icon: '📱', label: 'Home' },
    { path: '/games', icon: '🏈', label: 'Games' },
    { path: '/potluck', icon: '🍖', label: 'Potluck' },
    { path: '/profile', icon: '👤', label: 'Profile' },
  ];

  // Add admin link if user is admin (check multiple conditions for compatibility)
  const isAdmin = user.role === 'admin' || user.isAdmin || 
                  user.email === 'admin@texastailgaters.com' || 
                  user.email === 'corbyjames@gmail.com' ||
                  user.email === 'test@texastailgaters.com';
                  
  if (isAdmin) {
    navItems.push({ path: '/admin', icon: '⚙️', label: 'Admin' });
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg">
      <div className="flex justify-around">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex flex-col items-center py-2 px-4 transition-colors ${
                isActive
                  ? 'text-ut-orange'
                  : 'text-gray-500 hover:text-ut-orange'
              }`
            }
          >
            <span className="text-xl mb-1">{item.icon}</span>
            <span className="text-xs font-medium">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default BottomNav;

