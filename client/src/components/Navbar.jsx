import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from '../contexts/AuthContext.jsx';
import '../style/Navbar.scss';
import logo from "../assets/images/logo.jpg";
import 'bootstrap-icons/font/bootstrap-icons.css';

const Navbar = ({ onAvatarClick }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [showAdminSidebar, setShowAdminSidebar] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  console.log('Navbar user:', user);
  console.log('Navbar user.role:', user?.role);

  const isAdmin = user && user.role === 'admin';
  const isCoach = user && user.role === 'coach';
  const isMember = user && (user.role === 'member' || user.role === 'memberVip');
  const isSidebarUser = user && (user.role === 'member' || user.role === 'memberVip' || user.role === 'coach');
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

  // Đóng sidebar khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showAdminSidebar && !event.target.closest('.user-menu') && !event.target.closest('.admin-sidebar-overlay')) {
        setShowAdminSidebar(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showAdminSidebar]);

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
              <button
                className="avatar-container"
                type="button"
                tabIndex={0}
                style={{
                  cursor: "pointer",
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  zIndex: 999999,
                  position: 'relative'
                }}
                onClick={() => {
                  if (isAdmin) {
                    setShowAdminSidebar(!showAdminSidebar);
                  } else if ((isMember || isCoach) && onAvatarClick) {
                    onAvatarClick();
                  }
                }}
                onKeyDown={e => {
                  if (isAdmin && (e.key === 'Enter' || e.key === ' ')) {
                    setShowAdminSidebar(!showAdminSidebar);
                  } else if ((isMember || isCoach) && (e.key === 'Enter' || e.key === ' ')) {
                    onAvatarClick && onAvatarClick();
                  }
                }}
                aria-label="Mở menu cá nhân"
              >
                <img
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username || 'default'}`}
                  alt="User avatar"
                  className="user-avatar"
                  style={{ pointerEvents: 'auto' }}
                />
              </button>

              {/* Admin Sidebar Overlay */}
              {isAdmin && showAdminSidebar && (
                <>
                  {/* Overlay */}
                  <div 
                    className="admin-sidebar-overlay"
                    style={{
                      position: 'fixed',
                      top: 0,
                      left: 0,
                      width: '100vw',
                      height: '100vh',
                      backgroundColor: 'rgba(0, 0, 0, 0.5)',
                      zIndex: 9998,
                    }}
                    onClick={() => setShowAdminSidebar(false)}
                  />
                  
                  {/* Admin Sidebar */}
                  <div 
                    className="admin-sidebar"
                    style={{
                      position: 'fixed',
                      top: 0,
                      left: 0,
                      width: '280px',
                      height: '100vh',
                      backgroundColor: '#2c3e50',
                      color: 'white',
                      zIndex: 9999,
                      boxShadow: '2px 0 10px rgba(0,0,0,0.3)',
                      overflowY: 'auto'
                    }}
                  >
                    {/* Header */}
                    <div style={{
                      padding: '2rem 1.5rem',
                      borderBottom: '1px solid #34495e',
                      textAlign: 'center'
                    }}>
                      <i className="bi bi-shield-lock" style={{ fontSize: '2rem', marginBottom: '1rem', display: 'block' }}></i>
                      <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Admin Dashboard</h3>
                    </div>

                    {/* Navigation */}
                    <nav style={{ padding: '1rem 0' }}>
                      <Link 
                        to="/admin/users" 
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          padding: '1rem 1.5rem',
                          color: 'white',
                          textDecoration: 'none',
                          transition: 'background-color 0.2s',
                          borderLeft: location.pathname === '/admin/users' ? '4px solid #3498db' : '4px solid transparent'
                        }}
                        onClick={() => setShowAdminSidebar(false)}
                        onMouseEnter={(e) => e.target.style.backgroundColor = '#34495e'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                      >
                        <i className="bi bi-people" style={{ marginRight: '1rem', fontSize: '1.1rem' }}></i>
                        <span>Quản lý tài khoản</span>
                      </Link>

                      <Link 
                        to="/admin/packages" 
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          padding: '1rem 1.5rem',
                          color: 'white',
                          textDecoration: 'none',
                          transition: 'background-color 0.2s',
                          borderLeft: location.pathname === '/admin/packages' ? '4px solid #3498db' : '4px solid transparent'
                        }}
                        onClick={() => setShowAdminSidebar(false)}
                        onMouseEnter={(e) => e.target.style.backgroundColor = '#34495e'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                      >
                        <i className="bi bi-box" style={{ marginRight: '1rem', fontSize: '1.1rem' }}></i>
                        <span>Quản lý gói thành viên</span>
                      </Link>

                      <Link 
                        to="/admin/posts" 
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          padding: '1rem 1.5rem',
                          color: 'white',
                          textDecoration: 'none',
                          transition: 'background-color 0.2s',
                          borderLeft: location.pathname === '/admin/posts' ? '4px solid #3498db' : '4px solid transparent'
                        }}
                        onClick={() => setShowAdminSidebar(false)}
                        onMouseEnter={(e) => e.target.style.backgroundColor = '#34495e'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                      >
                        <i className="bi bi-file-text" style={{ marginRight: '1rem', fontSize: '1.1rem' }}></i>
                        <span>Duyệt bài viết</span>
                      </Link>

                      <Link 
                        to="/admin/statistics" 
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          padding: '1rem 1.5rem',
                          color: 'white',
                          textDecoration: 'none',
                          transition: 'background-color 0.2s',
                          borderLeft: location.pathname === '/admin/statistics' ? '4px solid #3498db' : '4px solid transparent'
                        }}
                        onClick={() => setShowAdminSidebar(false)}
                        onMouseEnter={(e) => e.target.style.backgroundColor = '#34495e'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                      >
                        <i className="bi bi-bar-chart-line" style={{ marginRight: '1rem', fontSize: '1.1rem' }}></i>
                        <span>Thống kê hệ thống</span>
                      </Link>

                      <Link 
                        to="/admin/feedback" 
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          padding: '1rem 1.5rem',
                          color: 'white',
                          textDecoration: 'none',
                          transition: 'background-color 0.2s',
                          borderLeft: location.pathname === '/admin/feedback' ? '4px solid #ffc107' : '4px solid transparent',
                          background: location.pathname === '/admin/feedback' ? 'rgba(255, 193, 7, 0.08)' : 'transparent'
                        }}
                        onClick={() => setShowAdminSidebar(false)}
                        onMouseEnter={(e) => e.target.style.backgroundColor = '#34495e'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = location.pathname === '/admin/feedback' ? 'rgba(255, 193, 7, 0.08)' : 'transparent'}
                      >
                        <i className="bi bi-star" style={{ marginRight: '1rem', fontSize: '1.1rem', color: '#ffc107' }}></i>
                        <span style={{ color: '#ffc107', fontWeight: 500 }}>Đánh giá của khách hàng</span>
                      </Link>

                      <div style={{ borderTop: '1px solid #34495e', margin: '1rem 0' }}></div>

                      <button 
                        onClick={() => {
                          handleLogout();
                          setShowAdminSidebar(false);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          width: '100%',
                          padding: '1rem 1.5rem',
                          color: '#e74c3c',
                          background: 'none',
                          border: 'none',
                          textAlign: 'left',
                          transition: 'background-color 0.2s',
                          cursor: 'pointer'
                        }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = '#34495e'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                      >
                        <i className="bi bi-box-arrow-right" style={{ marginRight: '1rem', fontSize: '1.1rem' }}></i>
                        <span>Đăng xuất</span>
                      </button>
                    </nav>

                    {/* Footer */}
                    <div style={{
                      padding: '1rem 1.5rem',
                      borderTop: '1px solid #34495e',
                      textAlign: 'center',
                      position: 'absolute',
                      bottom: 0,
                      width: '100%',
                      boxSizing: 'border-box'
                    }}>
                      <div style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>Smoking Support System</div>
                      <small style={{ color: '#95a5a6' }}>Admin Panel v1.0</small>
                    </div>
                  </div>
                </>
              )}
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