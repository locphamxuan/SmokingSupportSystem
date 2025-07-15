import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../contexts/AuthContext';
import './MainLayout.scss';

const MainLayout = () => {
  const { user } = useAuth();
  const location = useLocation();
  const isAdmin = user && user.role === 'admin';
  const isAdminDashboard = location.pathname.startsWith('/admin');
  const showSidebar = isAdmin && isAdminDashboard;

  return (
    <div className="main-layout">
      <Navbar />
      {showSidebar && <Sidebar />}
      <main className={`main-content ${showSidebar ? 'with-sidebar' : ''}`}>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default MainLayout;