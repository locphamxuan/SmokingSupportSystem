import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const ChatCoachListPage = () => {
  const [coaches, setCoaches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    const fetchCoaches = async () => {
      setLoading(true);
      setError("");
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(
          "http://localhost:5000/api/booking/accepted-coaches",
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        setCoaches(
          res.data && Array.isArray(res.data.coaches) ? res.data.coaches : [],
        );
      } catch (err) {
        console.error("Lỗi khi lấy danh sách coach:", err, err?.response?.data);
        setError(
          err?.response?.data?.message ||
            "Không thể tải danh sách huấn luyện viên đã nhận lịch.",
        );
      } finally {
        setLoading(false);
      }
    };
    fetchCoaches();
  }, []);

  if (loading)
    return (
      <div className="container py-5 text-center">Đang tải danh sách...</div>
    );
  if (error)
    return (
      <div className="container py-5 text-center text-danger">{error}</div>
    );

  return (
    <div className="container py-4 mt-5">
      <h3 className="mb-4">Chọn huấn luyện viên để chat</h3>
      {coaches.length === 0 ? (
        <div className="alert alert-info">
          Bạn chưa có huấn luyện viên nào đã nhận lịch.
        </div>
      ) : (
        <ul className="list-group">
          {coaches.map((coach) => (
            <li
              key={coach.id}
              className="list-group-item d-flex align-items-center justify-content-between"
            >
              <div className="d-flex align-items-center">
                {coach.avatar ? (
                  <img
                    src={coach.avatar}
                    alt="avatar"
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: "50%",
                      marginRight: 12,
                    }}
                  />
                ) : (
                  <i
                    className="bi bi-person-circle"
                    style={{ fontSize: 36, marginRight: 12 }}
                  ></i>
                )}
                <span className="fw-bold">
                  {coach.name ||
                    coach.fullName ||
                    coach.username ||
                    `Coach #${coach.id}`}
                </span>
              </div>
              <button
                className="btn btn-primary"
                onClick={() => navigate(`/chat-coach/${coach.id}`)}
              >
                Chat
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ChatCoachListPage;
