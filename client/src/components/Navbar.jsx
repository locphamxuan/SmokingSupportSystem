import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from '../contexts/AuthContext.jsx';
import '../style/Navbar.scss';
import logo from "../assets/images/logo.jpg";
import 'bootstrap-icons/font/bootstrap-icons.css';

const Navbar = () => {
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  const isAdmin = user && user.role === 'admin';
  const isCoach = user && user.role === 'coach';
  const isMember = user && (user.role === 'member' || user.role === 'memberVip');
  const isAdminDashboard = location.pathname.startsWith('/admin');

  useEffect(() => {
    if (!isAuthenticated) return;
    async function fetchNotifications() {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/auth/notifications', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const notifications = await res.json();
        const unread = Array.isArray(notifications)
          ? notifications.filter(n => !n.isRead).length
          : 0;
        setUnreadCount(unread);
      } catch (err) {
        setUnreadCount(0);
      }
    }
    fetchNotifications();
  }, [isAuthenticated]);

  const handleLogout = () => {
    logout();
    setShowDropdown(false);
    navigate('/login');
  };

  const handleNavClick = (path) => {
    setShowDropdown(false);
  };

  return (
    <header className="header">
      <div className="header-container">
        <div className="header-left">
          <Link to="/" className="logo" onClick={() => handleNavClick('/')}>
            <img
              src={logo}
              alt="Logo"
              className="logo-img"
            />
          </Link>

          <nav className="nav">
            <Link to="/" className="nav-item" onClick={() => handleNavClick('/')}>Trang chủ</Link>
            <Link to="/about" className="nav-item" onClick={() => handleNavClick('/about')}>Thông tin về thuốc lá</Link>
            <Link to="/blog" className="nav-item" onClick={() => handleNavClick('/blog')}>Cộng đồng</Link>
            <Link to="/leaderboard" className="nav-item" onClick={() => handleNavClick('/leaderboard')}>Bảng xếp hạng</Link>
            {isMember && (
              <Link to="/subscribe" className="nav-item" onClick={() => handleNavClick('/subscribe')}>Mua gói</Link>
            )}
            {isAuthenticated && isMember && (
              <Link to="/achievements" className="nav-item" onClick={() => handleNavClick('/achievements')}> Thành tích</Link>
            )}
          </nav>
        </div>

        <div className="header-right">
          {isAuthenticated ? (
            <div className="user-menu d-flex align-items-center gap-3">
              <Link to="/notifications" className="notification-bell position-relative me-2">
                <i className="bi bi-bell fs-4"></i>
                {unreadCount > 0 && (
                  <span className="notification-badge position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                    {unreadCount}
                  </span>
                )}
              </Link>
              <div
                className="avatar-container"
                onClick={() => setShowDropdown(!showDropdown)}
              >
                <img
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username || 'default'}`}
                  alt="User avatar"
                  className="user-avatar"
                />
              </div>

              <div className="dropdown-menu" style={{ display: showDropdown ? 'flex' : 'none' }}>
                {isMember && (
                  <>
                    <Link to="/profile" className="dropdown-item" onClick={() => handleNavClick('/profile')}>
                      Hồ sơ cá nhân
                    </Link>
                    <Link to="/my-progress" className="dropdown-item" onClick={() => handleNavClick('/my-progress')}>
                      Theo dõi quá trình
                    </Link>
                    <Link to="/create-post" className="dropdown-item" onClick={() => handleNavClick('/create-post')}>
                      Tạo bài đăng mới
                    </Link>
                    <Link to="/booking" className="dropdown-item" onClick={() => handleNavClick('/booking')}>
                      Đặt lịch tư vấn
                    </Link>
                  </>
                )}
                {/* Menu riêng cho Admin */}
                {isAdmin && (
                  <>
                    <Link to="/admin" className="dropdown-item admin-dashboard-link" onClick={() => handleNavClick('/admin')}>
                      <i className="bi bi-speedometer2 me-2"></i>
                      Admin Dashboard
                    </Link>
                    {isAdminDashboard && (
                      <>
                        <Link to="/admin/users" className="dropdown-item" onClick={() => handleNavClick('/admin/users')}>
                          Quản lý tài khoản
                        </Link>
                        <Link to="/admin/packages" className="dropdown-item" onClick={() => handleNavClick('/admin/packages')}>
                          Quản lý gói thành viên
                        </Link>
                        <Link to="/admin/posts" className="dropdown-item" onClick={() => handleNavClick('/admin/posts')}>
                          Duyệt bài viết
                        </Link>
                      </>
                    )}
                  </>
                )}
                {/* Menu riêng cho Coach */}
                {isCoach && (
                  <>
                    <Link to="/coach/dashboard" className="dropdown-item" onClick={() => handleNavClick('/coach/dashboard')}>
                      Lịch tư vấn
                    </Link>
                  </>
                )}
                <button onClick={handleLogout} className="dropdown-item">
                  Đăng xuất
                </button>
              </div>
            </div>
          ) : (
            <div className="auth-buttons">
              <Link to="/login" className="btn-primary" onClick={() => handleNavClick('/login')}>Đăng nhập</Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;