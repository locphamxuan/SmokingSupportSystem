import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css'; // Import Bootstrap CSS
import '../style/MyProgressPage.scss'; // Assuming you'll create this file for custom styles
import facebookImage from '../assets/images/facebook.jpg'; // Import Facebook image for footer
import instagramImage from '../assets/images/instragram.jpg'; // Import Instagram image for footer

const MyProgressPage = () => {
  const [userData, setUserData] = useState({
    username: '',
    email: '',
    phoneNumber: '',
    address: '',
    smokingStatus: {
      cigarettesPerDay: 0,
      costPerPack: 0,
      smokingFrequency: '',
      healthStatus: '',
      cigaretteType: '',
      quitReason: '',
      dailyLog: {
        cigarettes: 0,
        feeling: ''
      }
    },
    quitPlan: null,
    achievements: [],
    role: 'guest',
    isMember: false,
    coach: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();
  
  // Safely parse user from localStorage
  let user = null;
  try {
    const userStr = localStorage.getItem("user");
    if (userStr && userStr !== 'undefined') {
      user = JSON.parse(userStr);
    }
  } catch (error) {
    console.error("Error parsing user from localStorage:", error);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
  }

  const fetchUserData = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await axios.get('http://localhost:5000/api/auth/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const fetchedUserData = {
        ...response.data,
        smokingStatus: {
          cigarettesPerDay: response.data.smokingStatus?.cigarettesPerDay || 0,
          costPerPack: response.data.smokingStatus?.costPerPack || 0,
          smokingFrequency: response.data.smokingStatus?.smokingFrequency || '',
          healthStatus: response.data.smokingStatus?.healthStatus || '',
          cigaretteType: response.data.smokingStatus?.cigaretteType || '',
          quitReason: response.data.smokingStatus?.quitReason || '',
          dailyLog: {
            cigarettes: response.data.smokingStatus?.dailyLog?.cigarettes || 0,
            feeling: response.data.smokingStatus?.dailyLog?.feeling || ''
          }
        },
        quitPlan: response.data.quitPlan || null,
        achievements: response.data.achievements || [],
        isMember: response.data.isMember || false,
        coach: response.data.coach || null,
      };
      
      setUserData(fetchedUserData);
    } catch (error) {
      console.error("Lỗi khi tải thông tin người dùng:", error);
      console.error("Error details:", error.response?.data || error.message);
      setError('Không thể tải thông tin người dùng. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  useEffect(() => {
    if (user && (user.role === "admin" || user.role === "coach")) {
      navigate("/"); // Redirect admin/coach to home or their respective dashboards
    }
  }, [user, navigate]);

  const handleUpdateSmokingStatus = async (field, value) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put('http://localhost:5000/api/auth/smoking-status', { [field]: value }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUserData(prev => ({ ...prev, smokingStatus: { ...prev.smokingStatus, [field]: value } }));
      setSuccess('Cập nhật thành công!');
    } catch (error) {
      setError(error.response?.data?.message || 'Cập nhật thất bại.');
    }
  };

  const handleUpdateDailyLog = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.put('http://localhost:5000/api/auth/daily-log', userData.smokingStatus.dailyLog, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess('Nhật ký đã được cập nhật!');
    } catch (error) {
      setError(error.response?.data?.message || 'Cập nhật nhật ký thất bại.');
    }
  };

  const handleCloseSnackbar = () => {
    setError('');
    setSuccess('');
  };

  const handleRequestCoach = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/users/request-coach', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess('Yêu cầu hỗ trợ từ huấn luyện viên đã được gửi!');
      fetchUserData();
    } catch (error) {
      setError(error.response?.data?.message || 'Gửi yêu cầu thất bại.');
    }
  };

  const handleCancelCoachRequest = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/users/cancel-coach-request', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess('Đã hủy yêu cầu hỗ trợ từ huấn luyện viên.');
      fetchUserData();
    } catch (error) {
      setError(error.response?.data?.message || 'Hủy yêu cầu thất bại.');
    }
  };

  const handleJoinQuitPlan = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/auth/join-quit-plan', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess('Bạn đã tham gia kế hoạch cai thuốc!');
      fetchUserData();
    } catch (error) {
      setError(error.response?.data?.message || 'Tham gia kế hoạch thất bại.');
    }
  };



  const handleUpdateQuitPlan = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.put('http://localhost:5000/api/auth/quit-plan', userData.quitPlan, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess('Kế hoạch cai thuốc đã được cập nhật!');
      fetchUserData();
    } catch (error) {
      setError(error.response?.data?.message || 'Cập nhật kế hoạch thất bại.');
    }
  };

  const handleAddMilestone = async () => {
    try {
      const token = localStorage.getItem('token');
      const newMilestoneTitle = prompt("Nhập tiêu đề mốc quan trọng mới:");
      if (newMilestoneTitle) {
        await axios.post('http://localhost:5000/api/auth/quit-plan/milestones', { title: newMilestoneTitle }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSuccess('Mốc quan trọng đã được thêm!');
        fetchUserData();
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Thêm mốc quan trọng thất bại.');
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border text-success" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="my-progress-wrapper">
      <div className="my-progress-container">
        <div className="d-flex align-items-center mb-3">
          <button
            onClick={() => navigate('/')}
            className="btn btn-outline-success me-2"
          >
            <i className="fas fa-arrow-left me-2"></i> Quay lại trang chủ
          </button>
        </div>

        <h4 className="mb-3 fw-bold text-success">Quá trình cai thuốc của bạn</h4>

        {/* Alert for messages - Fixed positioning */}
        {error && (
          <div className="alert alert-danger alert-dismissible fade show" role="alert">
            {error}
            <button 
              type="button" 
              className="btn-close" 
              onClick={handleCloseSnackbar}
              aria-label="Close"
            ></button>
          </div>
        )}
        {success && (
          <div className="alert alert-success alert-dismissible fade show" role="alert">
            {success}
            <button 
              type="button" 
              className="btn-close" 
              onClick={handleCloseSnackbar}
              aria-label="Close"
            ></button>
          </div>
        )}

        <div className="row">
          {/* Thông tin tài khoản */}
          <div className="col-md-6 mb-4">
            <div className="card shadow-sm h-100">
              <div className="card-header bg-success text-white fw-bold">Thông tin tài khoản</div>
              <div className="card-body">
                <p><strong>Tên đăng nhập:</strong> {userData.username}</p>
                <p><strong>Email:</strong> {userData.email}</p>
                <p><strong>Số điện thoại:</strong> {userData.phoneNumber || 'Chưa cập nhật'}</p>
                <p><strong>Địa chỉ:</strong> {userData.address || 'Chưa cập nhật'}</p>
                <p>
                  <strong>Vai trò:</strong>
                  <span className={`badge ms-2 
                    ${userData.role === 'admin' ? 'bg-danger' : 
                     userData.role === 'coach' ? 'bg-info' : 
                     userData.role === 'member' ? 'bg-primary' : 'bg-secondary'}`}
                  >
                    {userData.role === 'member' ? 'Thành viên' : userData.role === 'guest' ? 'Khách' : userData.role === 'coach' ? 'Huấn luyện viên' : userData.role}
                  </span>
                </p>
                {userData.role !== 'coach' && userData.role !== 'admin' && (
                  <p>
                    <strong>Gói thành viên:</strong>
                    <span className={`badge ms-2 ${userData.isMember ? 'bg-success' : 'bg-warning text-dark'}`}>
                      {userData.isMember ? 'Premium' : 'Miễn phí'}
                    </span>
                    {!userData.isMember && (
                      <button onClick={() => navigate('/subscribe')} className="btn btn-sm btn-outline-success ms-2">Nâng cấp</button>
                    )}
                  </p>
                )}
                
                {/* Coach Request/Chat */}
                {userData.isMember && userData.role !== 'coach' && userData.role !== 'admin' && (
                  <div className="mt-3">
                    {userData.coach ? (
                      <div className="alert alert-info">
                        <p className="mb-1"><strong>Huấn luyện viên của bạn:</strong> {userData.coach.username}</p>
                        <button onClick={() => navigate(`/chat-coach/${userData.coach._id}`)} className="btn btn-success me-2">Nhắn tin với Coach</button>
                        <button onClick={handleCancelCoachRequest} className="btn btn-outline-danger">Hủy yêu cầu Coach</button>
                      </div>
                    ) : (
                      <button onClick={handleRequestCoach} className="btn btn-success">Yêu cầu hỗ trợ từ Coach</button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Kế hoạch Cai thuốc */}
          <div className="col-md-6 mb-4">
            <div className="card shadow-sm h-100">
              <div className="card-header bg-success text-white fw-bold">Kế hoạch Cai thuốc</div>
              <div className="card-body">
                {!userData.quitPlan ? (
                  <div className="text-center p-3 border border-dashed rounded-3 bg-light">
                    <p className="text-secondary mb-3">Bạn chưa có kế hoạch cai thuốc. Hãy tạo một kế hoạch để bắt đầu hành trình của mình!</p>
                    <button onClick={handleJoinQuitPlan} className="btn btn-success me-2">Tham gia Kế hoạch Cai thuốc</button>
                    <button onClick={() => setUserData(prev => ({ ...prev, quitPlan: { startDate: '', targetDate: '', milestones: [], currentProgress: 0, initialCigarettes: 0 } }))} className="btn btn-outline-success">Tạo Kế hoạch mới</button>
                  </div>
                ) : (
                  <div>
                    <div className="mb-3">
                      <label htmlFor="startDate" className="form-label">Ngày bắt đầu</label>
                      <input
                        type="date"
                        className="form-control"
                        id="startDate"
                        value={userData.quitPlan.startDate}
                        onChange={(e) => setUserData(prev => ({
                          ...prev,
                          quitPlan: { ...prev.quitPlan, startDate: e.target.value }
                        }))}
                      />
                    </div>
                    <div className="mb-3">
                      <label htmlFor="targetDate" className="form-label">Ngày mục tiêu</label>
                      <input
                        type="date"
                        className="form-control"
                        id="targetDate"
                        value={userData.quitPlan.targetDate}
                        onChange={(e) => setUserData(prev => ({
                          ...prev,
                          quitPlan: { ...prev.quitPlan, targetDate: e.target.value }
                        }))}
                      />
                    </div>
                    <div className="mb-3">
                      <label htmlFor="initialCigarettes" className="form-label">Số điếu ban đầu</label>
                      <input
                        type="number"
                        className="form-control"
                        id="initialCigarettes"
                        value={userData.quitPlan.initialCigarettes}
                        onChange={(e) => setUserData(prev => ({
                          ...prev,
                          quitPlan: { ...prev.quitPlan, initialCigarettes: Number(e.target.value) }
                        }))}
                        min="0"
                      />
                    </div>
                    <p className="fw-bold mt-3 mb-1">Tiến độ hiện tại: {userData.quitPlan.currentProgress.toFixed(2)}%</p>
                    <div className="progress" style={{ height: '10px' }}>
                      <div 
                        className="progress-bar bg-success"
                        role="progressbar"
                        style={{ width: `${userData.quitPlan.currentProgress}%` }}
                        aria-valuenow={userData.quitPlan.currentProgress}
                        aria-valuemin="0"
                        aria-valuemax="100"
                      ></div>
                    </div>

                    <h6 className="mt-4 mb-2">Các mốc quan trọng:</h6>
                    <ul className="list-group mb-3">
                      {userData.quitPlan.milestones.length === 0 ? (
                        <li className="list-group-item text-secondary">Chưa có mốc quan trọng nào.</li>
                      ) : (
                        userData.quitPlan.milestones.map((milestone, index) => (
                          <li key={index} className="list-group-item d-flex justify-content-between align-items-center">
                            {milestone.title}
                            <span className="badge bg-secondary">{milestone.date}</span>
                          </li>
                        ))
                      )}
                    </ul>
                    <button onClick={handleAddMilestone} className="btn btn-outline-success btn-sm me-2">Thêm Mốc mới</button>
                    <button onClick={handleUpdateQuitPlan} className="btn btn-success btn-sm">Cập nhật Kế hoạch</button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Nhật ký và Thành tích */}
          <div className="col-md-6 mb-4">
            <div className="card shadow-sm h-100">
              <div className="card-header bg-success text-white fw-bold">Nhật ký và Thành tích</div>
              <div className="card-body">
                {/* Daily Log */}
                <h6 className="mb-2">Nhật ký hàng ngày</h6>
                <div className="mb-3">
                  <label htmlFor="cigarettesDaily" className="form-label">Số điếu hút hôm nay</label>
                  <input
                    type="number"
                    className="form-control"
                    id="cigarettesDaily"
                    value={userData.smokingStatus.dailyLog.cigarettes}
                    onChange={(e) => setUserData(prev => ({ ...prev, smokingStatus: { ...prev.smokingStatus, dailyLog: { ...prev.smokingStatus.dailyLog, cigarettes: Number(e.target.value) } } }))}
                    min="0"
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="feeling" className="form-label">Cảm nhận của bạn</label>
                  <textarea
                    className="form-control"
                    id="feeling"
                    rows="3"
                    value={userData.smokingStatus.dailyLog.feeling}
                    onChange={(e) => setUserData(prev => ({ ...prev, smokingStatus: { ...prev.smokingStatus, dailyLog: { ...prev.smokingStatus.dailyLog, feeling: e.target.value } } }))}
                  ></textarea>
                </div>
                <button onClick={handleUpdateDailyLog} className="btn btn-success btn-sm">Cập nhật Nhật ký</button>

                <hr className="my-4" />

                {/* Achievements */}
                <h6 className="mb-2">Thành tích của bạn</h6>
                <ul className="list-group">
                  {userData.achievements.length === 0 ? (
                    <li className="list-group-item text-secondary">Bạn chưa có thành tích nào. Hãy tiếp tục cố gắng!</li>
                  ) : (
                    userData.achievements.map((achievement, index) => (
                      <li key={index} className="list-group-item d-flex justify-content-between align-items-center">
                        {achievement.title}
                        <span className="badge bg-success">{achievement.date}</span>
                      </li>
                    ))
                  )}
                </ul>
              </div>
            </div>
          </div>

          {/* Thông tin Cai thuốc */}
          <div className="col-md-6 mb-4">
            <div className="card shadow-sm h-100">
              <div className="card-header bg-success text-white fw-bold">Thông tin Cai thuốc</div>
              <div className="card-body">
                <div className="mb-3">
                  <label htmlFor="cigarettesPerDay" className="form-label">Số điếu thuốc/ngày</label>
                  <input
                    type="number"
                    className="form-control"
                    id="cigarettesPerDay"
                    value={userData.smokingStatus.cigarettesPerDay}
                    onChange={(e) => handleUpdateSmokingStatus('cigarettesPerDay', Number(e.target.value))}
                    min="0"
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="costPerPack" className="form-label">Giá mỗi gói thuốc (VNĐ)</label>
                  <input
                    type="number"
                    className="form-control"
                    id="costPerPack"
                    value={userData.smokingStatus.costPerPack}
                    onChange={(e) => handleUpdateSmokingStatus('costPerPack', Number(e.target.value))}
                    min="0"
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="smokingFrequency" className="form-label">Tần suất hút thuốc</label>
                  <select
                    className="form-select"
                    id="smokingFrequency"
                    value={userData.smokingStatus.smokingFrequency}
                    onChange={(e) => handleUpdateSmokingStatus('smokingFrequency', e.target.value)}
                  >
                    <option value="">Chọn tần suất</option>
                    <option value="daily">Hàng ngày</option>
                    <option value="weekly">Hàng tuần</option>
                    <option value="occasionally">Thỉnh thoảng</option>
                  </select>
                </div>
                <div className="mb-3">
                  <label htmlFor="healthStatus" className="form-label">Tình trạng sức khỏe liên quan</label>
                  <textarea
                    className="form-control"
                    id="healthStatus"
                    rows="3"
                    value={userData.smokingStatus.healthStatus}
                    onChange={(e) => handleUpdateSmokingStatus('healthStatus', e.target.value)}
                  ></textarea>
                </div>
                <div className="mb-3">
                  <label htmlFor="cigaretteType" className="form-label">Loại thuốc lá</label>
                  <input
                    type="text"
                    className="form-control"
                    id="cigaretteType"
                    value={userData.smokingStatus.cigaretteType}
                    onChange={(e) => handleUpdateSmokingStatus('cigaretteType', e.target.value)}
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="quitReason" className="form-label">Lý do cai thuốc</label>
                  <textarea
                    className="form-control"
                    id="quitReason"
                    rows="3"
                    value={userData.smokingStatus.quitReason}
                    onChange={(e) => handleUpdateSmokingStatus('quitReason', e.target.value)}
                  ></textarea>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer from HomePage */}
      <footer className="footer">
        <div className="container">
          <div className="social-icons">
            <a href="#" aria-label="Twitter" target="_blank" rel="noopener noreferrer"><i className="fab fa-twitter" style={{ fontSize: '36px' }}></i></a>
            <a href="https://www.facebook.com/loccphamxuan?locale=vi_VN" target="_blank" rel="noopener noreferrer" aria-label="Facebook"><img src={facebookImage} alt="Facebook" style={{ width: '36px', height: '36px' }} /></a>
            <a href="https://www.instagram.com/xlocpham/" target="_blank" rel="noopener noreferrer" aria-label="Instagram"><img src={instagramImage} alt="Instagram" style={{ width: '36px', height: '36px' }} /></a>
            <a href="#" aria-label="YouTube" target="_blank" rel="noopener noreferrer"><i className="fab fa-youtube" style={{ fontSize: '36px' }}></i></a>
          </div>
          <p className="copyright">
            &copy; 2024 Hỗ trợ cai nghiện. Đã đăng ký bản quyền.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default MyProgressPage;