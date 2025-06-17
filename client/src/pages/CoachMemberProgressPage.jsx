import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../style/CoachMemberProgressPage.scss';
import facebookImage from '../assets/images/facebook.jpg';
import instagramImage from '../assets/images/instragram.jpg';

const CoachMemberProgressPage = () => {
  const { memberId } = useParams();
  const navigate = useNavigate();
  const [memberData, setMemberData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchMemberProgress = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }
        const response = await axios.get(`http://localhost:5000/api/hlv/member/${memberId}/progress`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setMemberData(response.data);
      } catch (err) {
        console.error('Lỗi khi tải tiến trình của thành viên:', err);
        setError(err.response?.data?.message || 'Không thể tải tiến trình của thành viên.');
      } finally {
        setLoading(false);
      }
    };

    fetchMemberProgress();
  }, [memberId, navigate]);

  const handleCloseSnackbar = () => {
    setError('');
  };

  const handleBack = () => {
    navigate('/coach/dashboard'); // Sửa đường dẫn để quay về trang CoachDashboardPage
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100" style={{ paddingTop: '100px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error || !memberData) {
    return (
      <div className="container mt-4" style={{ paddingTop: '100px' }}>
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          {error || 'Không tìm thấy dữ liệu tiến trình cho thành viên này.'}
          <button type="button" className="btn-close" data-bs-dismiss="alert" aria-label="Close" onClick={handleCloseSnackbar}></button>
        </div>
      </div>
    );
  }

  const { smokingProfile, latestProgress, quitPlan } = memberData;

  return (
    <div className="coach-member-progress-wrapper" style={{ paddingTop: '100px' }}>
      <div className="container mt-4 mb-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <button onClick={handleBack} className="btn btn-outline-secondary">
            <i className="fas fa-arrow-left me-2"></i>
            Quay lại lịch tư vấn
          </button>
          <h2 className="section-title mb-0">
            Tiến trình của thành viên: {memberData.username || memberId}
          </h2>
          <div style={{ width: '150px' }}></div> {/* Spacer để căn giữa tiêu đề */}
        </div>

        {/* Thông tin tình trạng hút thuốc */}
        <div className="card my-4">
          <div className="card-header">
            <h5>📊 Thông tin tình trạng hút thuốc</h5>
          </div>
          <div className="card-body">
            {smokingProfile ? (
              <div className="row mt-2">
                <div className="col-md-6">
                  <p><b>Số điếu thuốc/ngày:</b> {smokingProfile.cigarettesPerDay || 0}</p>
                  <p><b>Chi phí/gói:</b> {smokingProfile.costPerPack || 0} VNĐ</p>
                  <p><b>Loại thuốc lá:</b> {smokingProfile.cigaretteType || 'Chưa cập nhật'}</p>
                </div>
                <div className="col-md-6">
                  <p><b>Tần suất hút thuốc:</b> {smokingProfile.smokingFrequency || 'Chưa cập nhật'}</p>
                  <p><b>Tình trạng sức khỏe:</b> {smokingProfile.healthStatus || 'Chưa cập nhật'}</p>
                  <p><b>Lý do cai thuốc:</b> {smokingProfile.QuitReason || 'Chưa cập nhật'}</p>
                </div>
              </div>
            ) : (
              <p className="text-secondary">Chưa có thông tin tình trạng hút thuốc.</p>
            )}
          </div>
        </div>

        {/* Nhật ký tiến trình mới nhất */}
        <div className="card my-4">
          <div className="card-header">
            <h5>📈 Nhật ký tiến trình mới nhất</h5>
          </div>
          <div className="card-body">
            {latestProgress ? (
              <div className="row mt-2">
                <div className="col-md-6">
                  <p><b>Ngày:</b> {new Date(latestProgress.Date).toLocaleDateString()}</p>
                  <p><b>Số điếu hút:</b> {latestProgress.Cigarettes || 0}</p>
                </div>
                <div className="col-md-6">
                  <p><b>Ghi chú:</b> {latestProgress.Note || 'Không có'}</p>
                </div>
              </div>
            ) : (
              <p className="text-secondary">Chưa có nhật ký tiến trình nào.</p>
            )}
          </div>
        </div>

        {/* Kế hoạch cai thuốc */}
        <div className="card my-4">
          <div className="card-header">
            <h5>🎯 Kế hoạch cai thuốc</h5>
          </div>
          <div className="card-body">
            {quitPlan ? (
              <>
                <div className="row mt-2">
                  <div className="col-md-6">
                    <p><b>Ngày bắt đầu:</b> {quitPlan.startDate}</p>
                    <p><b>Ngày mục tiêu:</b> {quitPlan.targetDate}</p>
                    <p><b>Loại kế hoạch:</b> {quitPlan.planType}</p>
                  </div>
                  <div className="col-md-6">
                    <p><b>Số điếu ban đầu:</b> {quitPlan.initialCigarettes}</p>
                    <p><b>Giảm mỗi ngày:</b> {quitPlan.dailyReduction}</p>
                  </div>
                </div>
                <p className="mt-2"><b>Chi tiết kế hoạch:</b> {quitPlan.planDetail || 'Không có'}</p>
                <h6 className="mt-2 fw-bold">Các mốc kế hoạch:</h6>
                {Array.isArray(quitPlan.milestones) && quitPlan.milestones.length > 0 ? (
                  <ul className="list-group">
                    {quitPlan.milestones.map((milestone, index) => (
                      typeof milestone === 'string' ? (
                        <li key={index} className="list-group-item">{milestone}</li>
                      ) : (
                        <li key={index} className="list-group-item d-flex justify-content-between align-items-center">
                          {milestone.title}
                          <span className="badge bg-secondary">{milestone.date}</span>
                        </li>
                      )
                    ))}
                  </ul>
                ) : (
                  <p className="text-secondary ms-2">Chưa có mốc nào.</p>
                )}
              </>
            ) : (
              <p className="text-secondary">Chưa có kế hoạch cai thuốc nào.</p>
            )}
          </div>
        </div>
      </div>

      <footer className="footer">
        <div className="container">
          <div className="social-icons">
            <a
              href="https://www.facebook.com/loccphamxuan?locale=vi_VN"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
            >
              <img
                src={facebookImage}
                alt="Facebook"
                style={{ width: "36px", height: "36px" }}
              />
            </a>
            <a
              href="https://www.instagram.com/xlocpham/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
            >
              <img
                src={instagramImage}
                alt="Instagram"
                style={{ width: "36px", height: "36px" }}
              />
            </a>
          </div>
          <p className="copyright">
            &copy; 2024 Hỗ trợ cai nghiện. Đã đăng ký bản quyền.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default CoachMemberProgressPage; 