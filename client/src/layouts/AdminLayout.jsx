import React from 'react';
import { Outlet, Navigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './AdminLayout.scss';

const AdminLayout = () => {
  const { user } = useAuth();
  const isAdmin = user && user.role === 'admin';

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <div className="admin-sidebar">
        <div className="sidebar-header">
          <i className="bi bi-shield-lock"></i>
          <h3>Admin Dashboard</h3>
        </div>
        <nav className="sidebar-nav">
          <Link to="/admin/users" className="sidebar-item">
            <i className="bi bi-people"></i>
            <span>Quản lý tài khoản</span>
          </Link>
          <Link to="/admin/posts" className="sidebar-item">
            <i className="bi bi-file-text"></i>
            <span>Quản lý bài viết</span>
          </Link>
          <Link to="/admin/packages" className="sidebar-item">
            <i className="bi bi-box"></i>
            <span>Quản lý gói thành viên</span>
          </Link>
          
          <div className="sidebar-footer">
            <Link to="/" className="sidebar-item home-button">
              <i className="bi bi-house-door"></i>
              <span>Quay về trang chủ</span>
            </Link>
          </div>
        </nav>
      </div>

      {/* Main content */}
      <div className="admin-content">
        <Outlet />
      </div>
    </div>
  );
};

export default AdminLayout; 