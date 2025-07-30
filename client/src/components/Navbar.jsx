import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.jsx";
import "../style/Navbar.scss";

import logo from "../assets/images/logo.jpg";
import "bootstrap-icons/font/bootstrap-icons.css";
import NotificationDropdown from "./NotificationDropdown";

const Navbar = ({ onAvatarClick }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  console.log("Navbar user:", user);
  console.log("Navbar user.role:", user?.role);

  const isAdmin = user && user.role === "admin";
  const isCoach = user && user.role === "coach";
  const isMember =
    user && (user.role === "member" || user.role === "memberVip");
  const isSidebarUser =
    user &&
    (user.role === "member" ||
      user.role === "memberVip" ||
      user.role === "coach");
  const isAdminDashboard = location.pathname.startsWith("/admin");

  // Close notification dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        setShowNotifications(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    async function fetchNotifications() {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch("/api/auth/notifications", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.status === 401 || res.status === 403) {
          // Token expired or invalid
          logout();
          navigate("/login");
          return;
        }
        const notifications = await res.json();
        const unread = Array.isArray(notifications)
          ? notifications.filter((n) => !n.isRead).length
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
    navigate("/login");
  };

  const handleNavClick = (path) => {
    setShowDropdown(false);
  };

  return (
    <header className="header">
      <div className="header-container">
        <div className="header-left">
          <Link to="/" className="logo" onClick={() => handleNavClick("/")}>
            <img src={logo} alt="Logo" className="logo-img" />
          </Link>

          <nav className="nav">
            <Link
              to="/"
              className="nav-item"
              onClick={() => handleNavClick("/")}
            >
              Trang chủ
            </Link>
            <Link
              to="/about"
              className="nav-item"
              onClick={() => handleNavClick("/about")}
            >
              Thông tin về thuốc lá
            </Link>
            <Link
              to="/blog"
              className="nav-item"
              onClick={() => handleNavClick("/blog")}
            >
              Cộng đồng
            </Link>
            <Link
              to="/leaderboard"
              className="nav-item"
              onClick={() => handleNavClick("/leaderboard")}
            >
              Bảng xếp hạng
            </Link>
            <Link
              to="/subscribe"
              className="nav-item"
              onClick={() => handleNavClick("/subscribe")}
            >
              Mua gói
            </Link>
          </nav>
        </div>

        <div className="header-right">
          {isAuthenticated ? (
            <div className="user-menu d-flex align-items-center gap-3">
              <div className="position-relative" ref={notificationRef}>
                <button
                  className="notification-bell position-relative me-2 btn btn-link btn-outline-success"
                  style={{ boxShadow: "none", border: "none", padding: "0" }}
                  onClick={() => setShowNotifications((v) => !v)}
                  tabIndex={0}
                  aria-label="Thông báo"
                >
                  <i className="bi bi-bell fs-4"></i>
                  {unreadCount > 0 && (
                    <span className="notification-badge position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                      {unreadCount}
                    </span>
                  )}
                </button>
                <NotificationDropdown
                  show={showNotifications}
                  onMarkAsRead={() => {
                    // Refresh unread count
                    setUnreadCount((prev) => Math.max(0, prev - 1));
                  }}
                />
              </div>
              <button
                className="avatar-container"
                type="button"
                tabIndex={0}
                style={{
                  cursor: "pointer",
                  background: "none",
                  border: "none",
                  padding: 0,
                  zIndex: 999999,
                  position: "relative",
                }}
                onClick={() => {
                  if ((isMember || isCoach) && onAvatarClick) {
                    onAvatarClick();
                  }
                }}
                onKeyDown={(e) => {
                  if (
                    (isMember || isCoach) &&
                    (e.key === "Enter" || e.key === " ")
                  ) {
                    onAvatarClick && onAvatarClick();
                  }
                }}
                aria-label="Mở menu cá nhân"
              >
                <img
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username || "default"}`}
                  alt="User avatar"
                  className="user-avatar"
                  style={{ pointerEvents: "auto" }}
                />
              </button>

              {/* Không render dropdown-menu nữa */}
            </div>
          ) : (
            <div className="auth-buttons">
              <Link
                to="/login"
                className="btn-primary"
                onClick={() => handleNavClick("/login")}
              >
                Đăng nhập
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
