import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import BottomNav from './BottomNav';

interface LayoutProps {
  children?: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-ut-light-gray">
      <Header />
      <main className="pb-20">
        {children || <Outlet />}
      </main>
      <BottomNav />
    </div>
  );
};

export default Layout;

