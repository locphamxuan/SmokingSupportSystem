import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import '../style/Navbar.scss';
import logo from "../assets/images/logo.png";

const Navbar = () => {
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const isLoggedIn = !!token;
  const userStr = localStorage.getItem('user');
  let user = null;

  try {
    if (userStr && userStr !== 'undefined') {
      user = JSON.parse(userStr);
    }
  } catch (e) {
    user = null;
  }

  const isAdmin = user && user.role === 'admin';
  const isCoach = user && user.role === 'coach';

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
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
            <Link to="/blog" className="nav-item">Blog</Link>
            <Link to="/leaderboard" className="nav-item">Bảng xếp hạng</Link>
          </nav>
        </div>

        <div className="header-right">
          {isLoggedIn ? (
            <div className="user-menu">
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
              {showDropdown && (
                <div className="dropdown-menu">
                  {!isAdmin && (
                    <Link to="/profile" className="dropdown-item">
                      Hồ sơ cá nhân
                    </Link>
                  )}
                  {isAdmin && (
                    <Link to="/admin/users" className="dropdown-item">
                      Quản lý tài khoản
                    </Link>
                  )}
                  {!isAdmin && !isCoach && (
                    <Link to="/my-progress" className="dropdown-item">
                      Theo dõi quá trình
                    </Link>
                  )}
                  {isCoach && (
                    <Link to="/coach/dashboard" className="dropdown-item">
                      Lịch tư vấn
                    </Link>
                  )}
                  <button onClick={handleLogout} className="dropdown-item">
                    Đăng xuất
                  </button>
                </div>
              )}
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