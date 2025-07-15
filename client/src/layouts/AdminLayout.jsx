import React from 'react';
import { Outlet, Navigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './AdminLayout.scss';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';

const AdminLayout = () => {
  const { user } = useAuth();
  const isAdmin = user && user.role === 'admin';

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="admin-layout">
      {/* Navbar không cần onAvatarClick cho admin */}
      <Navbar />
      {/* Sidebar cố định cho admin */}
      <Sidebar />
      {/* Main content */}
      <div className="admin-content">
        <Outlet />
      </div>
    </div>
  );
};

export default AdminLayout; 