import React, { useState, useEffect } from "react";
import axios from "axios";

const NotificationStats = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get("/api/auth/notifications/stats", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setStats(response.data);
      } catch (error) {
        console.error("Error fetching notification stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return <div className="text-center">Đang tải thống kê...</div>;
  }

  if (!stats) {
    return null;
  }

  return (
    <div className="notification-stats mb-4">
      <div className="row">
        <div className="col-md-3">
          <div className="card text-center">
            <div className="card-body">
              <h5 className="card-title">{stats.TotalNotifications || 0}</h5>
              <p className="card-text">Tổng thông báo</p>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card text-center">
            <div className="card-body">
              <h5 className="card-title text-success">
                {stats.ReadNotifications || 0}
              </h5>
              <p className="card-text">Đã đọc</p>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card text-center">
            <div className="card-body">
              <h5 className="card-title text-warning">
                {stats.UnreadNotifications || 0}
              </h5>
              <p className="card-text">Chưa đọc</p>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card text-center">
            <div className="card-body">
              <h5 className="card-title text-primary">
                {stats.AchievementNotifications || 0}
              </h5>
              <p className="card-text">Thành tích</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationStats;
