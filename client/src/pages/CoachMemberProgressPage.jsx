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
  const [success, setSuccess] = useState('');
  const [allBadges, setAllBadges] = useState([]);
  const [memberBadges, setMemberBadges] = useState([]);
  const [awardingBadgeId, setAwardingBadgeId] = useState(null);

  const fetchMemberProgress = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
      
      console.log('Fetching member progress for memberId:', memberId);
      const response = await axios.get(`http://localhost:5000/api/hlv/member/${memberId}/progress`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('Member progress response:', response.data);
      setMemberData(response.data);
    } catch (err) {
      console.error('Lỗi khi tải tiến trình của thành viên:', err);
      console.error('Error details:', {
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data,
        headers: err.response?.headers
      });
      setError(err.response?.data?.message || 'Không thể tải tiến trình của thành viên.');
    }
  };

  const fetchAllBadges = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/auth/all-badges', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAllBadges(response.data.badges || []);
    } catch (err) {
      console.error('Lỗi khi tải danh sách huy hiệu:', err);
    }
  };

  const fetchMemberBadges = async () => {
    try {
      console.log('🔍 Fetching member badges for memberId:', memberId);
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:5000/api/auth/user-badges/${memberId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('✅ Member badges response:', response.data);
      setMemberBadges(response.data.badges || []);
    } catch (err) {
      console.error('❌ Error fetching member badges:', err);
      console.error('Error details:', {
        status: err.response?.status,
        data: err.response?.data,
        message: err.response?.data?.message
      });
      // Don't set error for this as it's not critical
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      if (memberId) {
        setLoading(true);
        await Promise.all([
          fetchMemberProgress(),
          fetchAllBadges(),
          fetchMemberBadges()
        ]);
        setLoading(false);
      } else {
        setError('Không tìm thấy ID thành viên.');
        setLoading(false);
      }
    };

    fetchData();
  }, [memberId, navigate]);

  const handleCloseAlert = () => {
    setError('');
    setSuccess('');
  };

  const handleBack = () => {
    navigate('/coach/dashboard');
  };

  const handleAwardBadge = async (badgeId, badgeName) => {
    const reason = prompt(`Nhập lý do trao huy hiệu "${badgeName}" (tùy chọn):`);
    if (reason === null) return; // User cancelled

    try {
      console.log('🎖️ Awarding badge:', { badgeId, badgeName, memberId, reason });
      setAwardingBadgeId(badgeId);
      const token = localStorage.getItem('token');
      const response = await axios.post('http://localhost:5000/api/hlv/award-badge', {
        memberId: parseInt(memberId),
        badgeId: badgeId,
        reason: reason.trim()
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('✅ Badge awarded successfully:', response.data);
      setSuccess(response.data.message);
      
      // Refresh member badges
      console.log('🔄 Refreshing member badges...');
      await fetchMemberBadges();
    } catch (err) {
      console.error('❌ Error awarding badge:', err);
      console.error('Error details:', {
        status: err.response?.status,
        data: err.response?.data,
        message: err.response?.data?.message
      });
      setError(err.response?.data?.message || 'Lỗi khi trao huy hiệu');
    } finally {
      setAwardingBadgeId(null);
    }
  };

  const isBadgeAwarded = (badgeId) => {
    return memberBadges.some(badge => badge.Id === badgeId);
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

  if (error && !memberData) {
    return (
      <div className="container mt-4" style={{ paddingTop: '100px' }}>
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          {error || 'Không tìm thấy dữ liệu tiến trình cho thành viên này.'}
          <button type="button" className="btn-close" data-bs-dismiss="alert" aria-label="Close" onClick={handleCloseAlert}></button>
        </div>
      </div>
    );
  }

  const { smokingProfile, latestProgress, quitPlan } = memberData || {};

  return (
    <div className="coach-member-progress-wrapper" style={{ paddingTop: '100px' }}>
      <div className="container mt-4 mb-4">
        {/* Success/Error Messages */}
        {success && (
          <div className="alert alert-success alert-dismissible fade show" role="alert">
            {success}
            <button type="button" className="btn-close" onClick={handleCloseAlert}></button>
          </div>
        )}
        
        {error && (
          <div className="alert alert-danger alert-dismissible fade show" role="alert">
            {error}
            <button type="button" className="btn-close" onClick={handleCloseAlert}></button>
          </div>
        )}

        <div className="d-flex justify-content-between align-items-center mb-4">
          <button onClick={handleBack} className="btn btn-outline-secondary">
            <i className="fas fa-arrow-left me-2"></i>
            Quay lại dashboard
          </button>
          <h2 className="section-title mb-0">
            Tiến trình của thành viên: {memberData?.username || `ID: ${memberId}`}
          </h2>
          <div style={{ width: '150px' }}></div>
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
                  <p><b>Lý do cai thuốc:</b> {smokingProfile.quitReason || 'Chưa cập nhật'}</p>
                </div>
              </div>
            ) : (
              <p className="text-secondary">Chưa có thông tin tình trạng hút thuốc.</p>
            )}
          </div>
        </div>

        {/* Nhật ký tiến trình mới nhất */}
        <div className="card my-4">
          <div className="card-header d-flex justify-content-between align-items-center">
            <h5 className="mb-0">📈 Nhật ký tiến trình mới nhất</h5>
            {latestProgress && (
              <small className="text-light">
                ID: #{latestProgress.id} | Cập nhật gần nhất
              </small>
            )}
          </div>
          <div className="card-body">
            {latestProgress ? (
              <div className="row mt-2">
                <div className="col-md-6">
                  <p><b>Ngày ghi nhận:</b> {latestProgress.date ? new Date(latestProgress.date).toLocaleDateString('vi-VN') : 'Chưa có'}</p>
                  <p><b>Số điếu hút:</b> 
                    <span className={`badge ms-2 ${latestProgress.cigarettes === 0 ? 'bg-success' : latestProgress.cigarettes <= 5 ? 'bg-warning' : 'bg-danger'}`}>
                      {latestProgress.cigarettes || 0} điếu
                    </span>
                  </p>
                </div>
                <div className="col-md-6">
                  <p><b>Cảm nhận:</b> {latestProgress.feeling || 'Không có ghi chú'}</p>
                  <p><b>Trạng thái:</b> 
                    <span className={`badge ms-2 ${latestProgress.cigarettes === 0 ? 'bg-success' : 'bg-primary'}`}>
                      {latestProgress.cigarettes === 0 ? '🎉 Không hút thuốc' : '📝 Có hút thuốc'}
                    </span>
                  </p>
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
                    <p><b>Trạng thái:</b> <span className={`badge ${quitPlan.status === 'active' ? 'bg-success' : 'bg-secondary'}`}>{quitPlan.status}</span></p>
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

        {/* Huy hiệu và trao thưởng */}
        <div className="card my-4">
          <div className="card-header d-flex justify-content-between align-items-center">
            <h5 className="mb-0">🎖️ Huy hiệu và trao thưởng</h5>
            <small className="text-muted">Trao huy hiệu để khuyến khích thành viên</small>
          </div>
          <div className="card-body">
            {/* Huy hiệu đã có */}
            <div className="mb-4">
              <h6 className="text-success">✅ Huy hiệu đã có ({memberBadges.length})</h6>
              {memberBadges.length > 0 ? (
                <div className="row">
                  {memberBadges.map((badge) => (
                    <div key={badge.Id} className="col-md-6 col-lg-4 mb-3">
                      <div className="card border-success">
                        <div className="card-body text-center">
                          <div className="badge-icon mb-2" style={{ fontSize: '2rem' }}>
                            🏆
                          </div>
                          <h6 className="card-title text-success">{badge.Name}</h6>
                          <p className="card-text small text-muted">{badge.Description}</p>
                          <small className="text-muted">
                            Nhận: {new Date(badge.AwardedAt).toLocaleDateString()}
                          </small>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted">Thành viên chưa có huy hiệu nào.</p>
              )}
            </div>

            {/* Tất cả huy hiệu có thể trao */}
            <div>
              <h6 className="text-primary">🎯 Tất cả huy hiệu có thể trao ({allBadges.length})</h6>
              {allBadges.length > 0 ? (
                <div className="row">
                  {allBadges.map((badge) => {
                    const isAwarded = isBadgeAwarded(badge.Id);
                    const isAwarding = awardingBadgeId === badge.Id;
                    
                    return (
                      <div key={badge.Id} className="col-md-6 col-lg-4 mb-3">
                        <div className={`card ${isAwarded ? 'border-success bg-light' : 'border-primary'}`}>
                          <div className="card-body text-center">
                            <div className="badge-icon mb-2" style={{ fontSize: '2rem' }}>
                              {isAwarded ? '✅' : '🎖️'}
                            </div>
                            <h6 className={`card-title ${isAwarded ? 'text-success' : 'text-primary'}`}>
                              {badge.Name}
                            </h6>
                            <p className="card-text small text-muted">{badge.Description}</p>
                            <div className="mb-2">
                              <span className="badge bg-info">
                                Yêu cầu: {badge.Requirement} ngày
                              </span>
                            </div>
                            
                            {isAwarded ? (
                              <button className="btn btn-success btn-sm" disabled>
                                ✅ Đã trao
                              </button>
                            ) : (
                              <button 
                                className="btn btn-warning btn-sm"
                                onClick={() => handleAwardBadge(badge.Id, badge.Name)}
                                disabled={isAwarding}
                              >
                                {isAwarding ? (
                                  <>
                                    <span className="spinner-border spinner-border-sm me-1"></span>
                                    Đang trao...
                                  </>
                                ) : (
                                  <>🎖️ Trao huy hiệu</>
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-muted">Không có huy hiệu nào để trao.</p>
              )}
            </div>
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