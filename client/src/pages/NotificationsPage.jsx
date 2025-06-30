import React, { useEffect, useState } from 'react';
import '../style/NotificationsPage.scss';

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchNotifications() {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/auth/notifications', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        setNotifications(Array.isArray(data) ? data : []);
      } catch (err) {
        setNotifications([]);
      } finally {
        setLoading(false);
      }
    }
    fetchNotifications();
  }, []);

  if (loading) return <div className="text-center py-5">Đang tải thông báo...</div>;

  return (
    <div className="notifications-page container py-5">
      <h2 className="mb-4">Thông báo của bạn</h2>
      {notifications.length === 0 ? (
        <div className="alert alert-info">Bạn chưa có thông báo nào.</div>
      ) : (
        <ul className="list-group notifications-list">
          {notifications.map((n) => (
            <li
              key={n.id}
              className={`list-group-item d-flex justify-content-between align-items-center notification-item ${n.isRead ? '' : 'fw-bold unread'}`}
            >
              <span>{n.message || 'Không có nội dung thông báo'}</span>
              <span className="badge bg-secondary notification-date">
                {n.createdAt ? new Date(n.createdAt).toLocaleString() : 'Không rõ thời gian'}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default NotificationsPage;
