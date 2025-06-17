import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from '../contexts/AuthContext.jsx';
import '../style/Navbar.scss';
import logo from "../assets/images/logo.jpg";

const Navbar = () => {
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();

  const isAdmin = user && user.role === 'admin';
  const isCoach = user && user.role === 'coach';

  const handleLogout = () => {
    logout();
    setShowDropdown(false);
    navigate('/login');
  };

  return (
    <header className="header">
      <div className="header-container">
        <div className="header-left">
          <Link to="/" className="logo">
            <img
              src={logo}
              alt="Logo"
              className="logo-img"
            />
          </Link>

          <nav className="nav">
            <Link to="/" className="nav-item">Trang chủ</Link>
            <Link to="/about" className="nav-item">Thông tin về thuốc lá </Link>
            <Link to="/blog" className="nav-item">Diễn đàn</Link>
            <Link to="/leaderboard" className="nav-item">Bảng xếp hạng</Link>
            {!isAdmin && !isCoach && (
              <Link to="/subscribe" className="nav-item">Mua gói</Link>
            )}
          </nav>
        </div>

        <div className="header-right">
          {isAuthenticated ? (
            <div className="user-menu">
              <div
                className="avatar-container"
                onClick={() => {
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
                <Link to="/profile" className="dropdown-item" onClick={() => setShowDropdown(false)}>
                  Hồ sơ cá nhân
                </Link>
                {/* Chỉ hiển thị "Theo dõi quá trình" cho member và guest, KHÔNG cho admin và coach */}
                {!isAdmin && !isCoach && (
                  <Link to="/my-progress" className="dropdown-item" onClick={() => setShowDropdown(false)}>
                    Theo dõi quá trình
                  </Link>
                )}
                {/* Menu riêng cho Admin */}
                {isAdmin && (
                  <Link to="/admin/users" className="dropdown-item" onClick={() => setShowDropdown(false)}>
                    Quản lý tài khoản
                  </Link>
                )}
                {/* Menu riêng cho Coach */}
                {isCoach && (
                  <Link to="/coach/dashboard" className="dropdown-item" onClick={() => setShowDropdown(false)}>
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
              <Link to="/login" className="btn-primary">Đăng nhập</Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;