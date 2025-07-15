import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import '../style/Sidebar.scss';
import { useAuth } from '../contexts/AuthContext';

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const isAdmin = user && user.role === 'admin';

  if (!isAdmin) return null;

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const menuItems = [
    {
      path: '/admin/users',
      icon: 'bi-people',
      label: 'Quản lý tài khoản'
    },
    {
      path: '/admin/packages',
      icon: 'bi-box',
      label: 'Quản lý gói thành viên'
    },
    {
      path: '/admin/posts',
      icon: 'bi-file-text',
      label: 'Duyệt bài viết'
    },
    {
      path: '/admin/statistics',
      icon: 'bi-bar-chart-line',
      label: 'Thống kê hệ thống'
    }
  ];

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <i className="bi bi-shield-lock"></i>
        <h3>Admin Dashboard</h3>
      </div>
      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`sidebar-item ${location.pathname === item.path ? 'active' : ''}`}
          >
            <i className={`bi ${item.icon}`}></i>
            <span>{item.label}</span>
          </Link>
        ))}
        <button onClick={handleLogout} className="sidebar-item logout-button">
          <i className="bi bi-box-arrow-right"></i>
          <span>Đăng xuất</span>
        </button>
      </nav>
      <div className="sidebar-footer">
        <span>Smoking Support System</span>
        <small>Admin Panel v1.0</small>
      </div>
    </div>
  );
};

export default Sidebar; 