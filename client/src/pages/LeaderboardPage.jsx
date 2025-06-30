import React, { useState, useEffect } from 'react';
import { getRankings } from '../services/extraService';
import '../style/LeaderboardPage.scss';

const LeaderboardPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setLoading(true);
        const response = await getRankings();
        setUsers(response || []);
      } catch (error) {
        setError('Không thể tải bảng xếp hạng');
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, []);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="spinner-border text-success" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="alert alert-danger text-center" role="alert">{error}</div>
      </div>
    );
  }

  return (
    <div className="leaderboard-page-bg min-vh-100 d-flex flex-column">
      <div className="container py-5 flex-grow-1">
        <h1 className="text-center text-success fw-bold mb-4">Bảng xếp hạng thành viên</h1>
        <div className="card shadow-sm">
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-striped align-middle mb-0">
                <thead className="table-success">
                  <tr>
                    <th scope="col">#</th>
                    <th scope="col">Tên người dùng</th>
                    <th scope="col" className="text-end">Số ngày không hút thuốc</th>
                    <th scope="col" className="text-end">Tiền tiết kiệm (VNĐ)</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user, index) => (
                    <tr key={user.id || user.Id}>
                      <th scope="row">{index + 1}</th>
                      <td>{user.username || user.Username}</td>
                      <td className="text-end">{user.totalDaysWithoutSmoking || user.TotalDaysWithoutSmoking}</td>
                      <td className="text-end">{(user.totalMoneySaved || user.TotalMoneySaved || 0).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      {/* Footer giữ nguyên như giao diện ảnh, dùng Bootstrap và SCSS */}
      <footer className="footer-custom mt-auto bg-light text-dark pt-5 pb-3">
        <div className="container">
          <div className="row text-center text-md-start">
            <div className="col-12 col-md-3 mb-4 mb-md-0">
              <h5 className="fw-bold mb-2">Về chúng tôi</h5>
              <div className="footer-underline mb-2 mx-auto mx-md-0"></div>
              <p className="mb-0 small">Hỗ trợ cai nghiện thuốc lá là sứ mệnh của chúng tôi. Chúng tôi cam kết đồng hành cùng bạn trên hành trình hướng tới một cuộc sống khỏe mạnh hơn.</p>
            </div>
            <div className="col-12 col-md-3 mb-4 mb-md-0">
              <h5 className="fw-bold mb-2">Liên kết nhanh</h5>
              <div className="footer-underline mb-2 mx-auto mx-md-0"></div>
              <ul className="list-unstyled small mb-0">
                <li><a href="#" className="footer-link">→ Giới thiệu</a></li>
                <li><a href="#" className="footer-link">→ Dịch vụ</a></li>
                <li><a href="#" className="footer-link">→ Blog</a></li>
                <li><a href="#" className="footer-link">→ Liên hệ</a></li>
              </ul>
            </div>
            <div className="col-12 col-md-3 mb-4 mb-md-0">
              <h5 className="fw-bold mb-2">Dịch vụ hỗ trợ</h5>
              <div className="footer-underline mb-2 mx-auto mx-md-0"></div>
              <ul className="list-unstyled small mb-0">
                <li><a href="#" className="footer-link">→ Tư vấn trực tuyến</a></li>
                <li><a href="#" className="footer-link">→ Cộng đồng</a></li>
                <li><a href="#" className="footer-link">→ Tài nguyên</a></li>
                <li><a href="#" className="footer-link">→ FAQ</a></li>
              </ul>
            </div>
            <div className="col-12 col-md-3">
              <h5 className="fw-bold mb-2">Liên hệ</h5>
              <div className="footer-underline mb-2 mx-auto mx-md-0"></div>
              <ul className="list-unstyled small mb-0">
                <li><i className="bi bi-telephone-fill me-2 text-success"></i>Hotline: 1800-xxxx</li>
                <li><i className="bi bi-envelope-fill me-2 text-success"></i>Email: support@smokingsupport.com</li>
                <li><i className="bi bi-clock-fill me-2 text-success"></i>Hỗ trợ 24/7</li>
              </ul>
            </div>
          </div>
          <hr className="my-4" />
          <div className="row justify-content-center mb-3">
            <div className="col-auto">
              <div className="footer-hotline d-flex align-items-center rounded-pill px-4 py-3 mx-auto">
                <i className="bi bi-headset me-2 fs-4 text-success"></i>
                <span className="fw-bold me-2">Cần hỗ trợ khẩn cấp?</span>
                <span>Gọi ngay: <span className="text-success fw-bold">1800-xxxx</span></span>
              </div>
            </div>
          </div>
          <div className="row justify-content-center mb-2">
            <div className="col-auto">
              <a href="#" className="footer-social mx-2"><i className="bi bi-facebook fs-3"></i></a>
              <a href="#" className="footer-social mx-2"><i className="bi bi-instagram fs-3"></i></a>
              <a href="#" className="footer-social mx-2"><i className="bi bi-youtube fs-3"></i></a>
              <a href="#" className="footer-social mx-2"><i className="bi bi-linkedin fs-3"></i></a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LeaderboardPage;
