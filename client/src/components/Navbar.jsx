import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from '../contexts/AuthContext.jsx';
import '../style/Navbar.scss';
import logo from "../assets/images/logo.jpg";

const Navbar = () => {
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();

  console.log('Navbar render:', { user, isAuthenticated, showDropdown });

  const isAdmin = user && user.role === 'admin';
  const isCoach = user && user.role === 'coach';
  const isMember = user && (user.role === 'member' || user.role === 'memberVip');

  const handleLogout = () => {
    console.log('Logout clicked');
    logout();
    setShowDropdown(false);
    navigate('/login');
  };

  const handleNavClick = (path) => {
    console.log('Navigation clicked:', path);
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
            <div className="user-menu">
              <div
                className="avatar-container"
                onClick={() => {
                  console.log('Avatar clicked, current dropdown state:', showDropdown);
                  setShowDropdown(!showDropdown);
                }}
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
                  <Link to="/admin/users" className="dropdown-item" onClick={() => handleNavClick('/admin/users')}>
                    Quản lý tài khoản
                  </Link>
                )}
                {/* Menu riêng cho Coach */}
                {isCoach && (
                  <Link to="/coach/dashboard" className="dropdown-item" onClick={() => handleNavClick('/coach/dashboard')}>
                    Lịch tư vấn
                  </Link>
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