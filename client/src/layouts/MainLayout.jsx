import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Sidebar from '../components/Sidebar';
import SidebarUser from '../components/SidebarUser';
import { useAuth } from '../contexts/AuthContext';
import './MainLayout.scss';

const MainLayout = () => {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();
  const isAdmin = user && user.role === 'admin';
  const isAdminDashboard = location.pathname.startsWith('/admin');
  const showSidebar = isAdmin && isAdminDashboard;

  // State cho sidebar-user của member/coach
  const [showSidebarUser, setShowSidebarUser] = useState(false);

  return (
    <div className="main-layout">
      <Navbar onAvatarClick={() => setShowSidebarUser(true)} />
      {showSidebar && <Sidebar />}
      {/* SidebarUser render cho member/memberVip/coach */}
      {isAuthenticated && (user?.role === 'member' || user?.role === 'memberVip' || user?.role === 'coach') && (
        <SidebarUser show={showSidebarUser} onClose={() => setShowSidebarUser(false)} user={user} />
      )}
      <main className={`main-content ${showSidebar ? 'with-sidebar' : ''}`}>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default MainLayout;