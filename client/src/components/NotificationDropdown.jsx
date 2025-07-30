import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

const NotificationDropdown = ({ show, onMarkAsRead }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (show) {
      fetchNotifications();
    }
  }, [show]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("/api/auth/notifications", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications(res.data);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `/api/auth/notifications/${id}/read`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      fetchNotifications();
      onMarkAsRead();
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  if (!show) return null;

  return (
    <div
      className="notification-dropdown card shadow-lg"
      style={{
        position: "absolute",
        top: "100%",
        right: "0",
        width: "350px",
        maxHeight: "400px",
        overflowY: "auto",
        borderRadius: "0.5rem",
        zIndex: 1000,
      }}
    >
      <div
        className="card-header d-flex justify-content-between align-items-center"
        style={{
          backgroundColor: "#f8f9fa",
          borderBottom: "1px solid #dee2e6",
        }}
      >
        <h6 className="mb-0">Thông báo</h6>
        <Link to="/notifications" className="btn btn-sm btn-outline-primary">
          Xem tất cả
        </Link>
      </div>
      <div className="card-body p-0">
        {loading ? (
          <div className="text-center p-3">Đang tải...</div>
        ) : (
          <ul className="list-group list-group-flush">
            {notifications.length === 0 ? (
              <li className="list-group-item">Không có thông báo mới</li>
            ) : (
              notifications.slice(0, 5).map((n) => (
                <li
                  key={n.id}
                  className={`list-group-item ${!n.isRead ? "fw-bold" : ""}`}
                  style={{
                    backgroundColor: !n.isRead ? "#e9f5ff" : "transparent",
                  }}
                >
                  <div className="d-flex justify-content-between">
                    <div>
                      <small className="text-muted">
                        {new Date(n.createdAt).toLocaleString()}
                      </small>
                      <p className="mb-0" style={{ fontSize: "0.9rem" }}>
                        {n.message}
                      </p>
                    </div>
                    {!n.isRead && (
                      <button
                        className="btn btn-sm btn-link"
                        onClick={() => handleMarkAsRead(n.id)}
                        title="Đánh dấu đã đọc"
                        style={{ color: "#0d6efd" }}
                      >
                        <i className="fas fa-check-circle"></i>
                      </button>
                    )}
                  </div>
                </li>
              ))
            )}
          </ul>
        )}
      </div>
    </div>
  );
};

export default NotificationDropdown;
