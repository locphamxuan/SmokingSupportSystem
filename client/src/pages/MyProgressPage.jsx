import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css'; // Import Bootstrap CSS
import '../style/MyProgressPage.scss'; // Assuming you'll create this file for custom styles
import facebookImage from '../assets/images/facebook.jpg'; // Import Facebook image for footer
import instagramImage from '../assets/images/instragram.jpg'; // Import Instagram image for footer
import { 
  getUserStatistics, 
  getUserNotifications, 
  getDailyLog, 
  addDailyLog,
  getRankings 
} from '../services/extraService';

import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

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
    isMemberVip: false,
    coach: null,
  });
  const [smokingHistory, setSmokingHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();
  const [suggestedPlans, setSuggestedPlans] = useState([]);
  
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

      // Fetch user profile
      const profileResponse = await axios.get('http://localhost:5000/api/auth/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log("MyProgressPage - Raw User Profile Response:", profileResponse.data); // DEBUG: Log raw data

      const fetchedUserData = {
        ...profileResponse.data,
        smokingStatus: profileResponse.data.smokingStatus || {},
        quitPlan: null,
        achievements: profileResponse.data.achievements || [],
        isMemberVip: profileResponse.data.isMemberVip || false,
        coach: profileResponse.data.coach || null,
      };

      // Explicitly set default values for smokingStatus properties
      fetchedUserData.smokingStatus = {
        cigarettesPerDay: fetchedUserData.smokingStatus.cigarettesPerDay || 0,
        costPerPack: fetchedUserData.smokingStatus.costPerPack || 0,
        smokingFrequency: fetchedUserData.smokingStatus.smokingFrequency || '',
        healthStatus: fetchedUserData.smokingStatus.healthStatus || '',
        cigaretteType: fetchedUserData.smokingStatus.cigaretteType || '',
        quitReason: fetchedUserData.smokingStatus.quitReason || '',
        dailyLog: fetchedUserData.smokingStatus.dailyLog || {},
      };

      // Explicitly set default values for dailyLog properties
      fetchedUserData.smokingStatus.dailyLog = {
        cigarettes: fetchedUserData.smokingStatus.dailyLog.cigarettes || 0,
        feeling: fetchedUserData.smokingStatus.dailyLog.feeling || '',
      };

      // Fetch quit plan if available
      try {
        const quitPlanResponse = await axios.get('http://localhost:5000/api/auth/quit-plan', {
          headers: { Authorization: `Bearer ${token}` }
        });
        fetchedUserData.quitPlan = {
          id: quitPlanResponse.data.quitPlan.id || 0,
          startDate: quitPlanResponse.data.quitPlan.startDate || '',
          targetDate: quitPlanResponse.data.quitPlan.targetDate || '',
          planType: quitPlanResponse.data.quitPlan.planType || '',
          initialCigarettes: quitPlanResponse.data.quitPlan.initialCigarettes || 0,
          dailyReduction: quitPlanResponse.data.quitPlan.dailyReduction || 0,
          milestones: quitPlanResponse.data.quitPlan.milestones || [],
          currentProgress: quitPlanResponse.data.quitPlan.currentProgress || 0,
          planDetail: quitPlanResponse.data.quitPlan.planDetail || '',
          status: quitPlanResponse.data.quitPlan.status || 'active',
          createdAt: quitPlanResponse.data.quitPlan.createdAt || null,
        };
      } catch (quitPlanError) {
        // It's okay if no quit plan exists (404), log other errors
        if (quitPlanError.response && quitPlanError.response.status !== 404) {
          console.error("Lỗi khi tải kế hoạch cai thuốc:", quitPlanError);
        }
        fetchedUserData.quitPlan = null; // Ensure it's null if not found or error
      }

      // Fetch user badges
      try {
        const badgesResponse = await axios.get('http://localhost:5000/api/auth/badges', {
          headers: { Authorization: `Bearer ${token}` }
        });
        fetchedUserData.achievements = badgesResponse.data.badges || [];
      } catch (badgesError) {
        console.error("Lỗi khi tải huy hiệu:", badgesError);
        fetchedUserData.achievements = [];
      }

      // Fetch smoking progress history
      try {
        const historyResponse = await axios.get('http://localhost:5000/api/auth/progress/history', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSmokingHistory(historyResponse.data.history || []);
      } catch (historyError) {
        console.error("Lỗi khi tải lịch sử hút thuốc:", historyError);
        setSmokingHistory([]);
      }
      
      setUserData(fetchedUserData);
      console.log("MyProgressPage - fetchedUserData after setState:", fetchedUserData);
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

  useEffect(() => {
    const fetchSuggestedPlans = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('http://localhost:5000/api/auth/quit-plan/suggested', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSuggestedPlans(res.data);
      } catch (err) {
        setSuggestedPlans([]);
      }
    };
    fetchSuggestedPlans();
  }, []);

  const handleUpdateSmokingStatus = async (field, value) => {
    // Cập nhật trạng thái cục bộ trước
    const updatedSmokingStatus = { ...userData.smokingStatus, [field]: value };
    setUserData(prev => ({ ...prev, smokingStatus: updatedSmokingStatus }));

    try {
      const token = localStorage.getItem('token');
      // Gửi toàn bộ đối tượng đã cập nhật
      await axios.put('http://localhost:5000/api/auth/smoking-status', updatedSmokingStatus, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess('Cập nhật thành công!');
    } catch (error) {
      setError(error.response?.data?.message || 'Cập nhật thất bại.');
    }
  };

  const handleUpdateDailyLog = async () => {
    try {
      // Sử dụng API mới từ extraService
      const response = await addDailyLog({
        cigarettes: userData.smokingStatus.dailyLog.cigarettes,
        feeling: userData.smokingStatus.dailyLog.feeling,
        logDate: new Date().toISOString().slice(0, 10)
      });
      
      setSuccess('Nhật ký đã được cập nhật!');
      // If new badges were awarded, update the achievements state
      if (response.newBadges && response.newBadges.length > 0) {
        setUserData(prev => ({
          ...prev,
          achievements: [...prev.achievements, ...response.newBadges]
        }));
      }
      fetchUserData(); // Re-fetch all user data including updated progress and potentially new badges
    } catch (error) {
      setError(error.message || 'Cập nhật nhật ký thất bại.');
    }
  };

  const handleCloseSnackbar = () => {
    setError('');
    setSuccess('');
  };

  const handleRequestCoach = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('http://localhost:5000/api/auth/request-coach', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess('Yêu cầu hỗ trợ từ huấn luyện viên đã được gửi!');
      await fetchUserData();
      // Navigate to chat interface if coach is assigned
      if (response.data.coach) {
        navigate(`/chat-coach/${response.data.coach.Id}`);
      }
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
      // Gửi yêu cầu POST để tạo kế hoạch cai thuốc mặc định
      await axios.post('http://localhost:5000/api/auth/quit-plan', {
        startDate: new Date().toISOString().slice(0, 10),
        targetDate: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().slice(0, 10), // 1 month from now
        planType: 'suggested',
        initialCigarettes: userData.smokingStatus.cigarettesPerDay || 0,
        dailyReduction: 0, // Default to 0, user can change later
        milestones: [],
        planDetail: 'Kế hoạch cai thuốc mặc định do hệ thống gợi ý'
      }, {
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
      // Gửi yêu cầu POST để cập nhật kế hoạch cai thuốc
      await axios.post('http://localhost:5000/api/auth/quit-plan', {
        startDate: userData.quitPlan?.startDate || '',
        targetDate: userData.quitPlan?.targetDate || '',
        planType: userData.quitPlan?.planType || 'custom',
        initialCigarettes: Number(userData.quitPlan?.initialCigarettes || 0), // Ensure it's a number
        dailyReduction: Number(userData.quitPlan?.dailyReduction || 0),
        milestones: userData.quitPlan?.milestones || [],
        planDetail: userData.quitPlan?.planDetail || ''
      }, {
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
                    <strong>Gói:</strong>
                    <span className={`badge ms-2 ${userData.isMemberVip || userData.role === 'memberVip' ? 'bg-success' : 'bg-warning text-dark'}`}>
                      {userData.isMemberVip || userData.role === 'memberVip' ? 'Premium' : 'Miễn phí'}
                    </span>
                    {!(userData.isMemberVip || userData.role === 'memberVip') && (
                      <button onClick={() => navigate('/subscribe')} className="btn btn-sm btn-outline-success ms-2">Nâng cấp</button>
                    )}
                  </p>
                )}
                
                {/* Coach Request/Chat */}
                {(userData.isMemberVip || userData.role === 'memberVip') && userData.role !== 'coach' && userData.role !== 'admin' && (
                  <div className="mt-3">
                    {userData.coach ? (
                      <div className="alert alert-info">
                        <p className="mb-1"><strong>Huấn luyện viên của bạn:</strong> {userData.coach.Username}</p>
                        <button onClick={() => navigate(`/chat-coach/${userData.coach.Id}`)} className="btn btn-success me-2">Nhắn tin với Coach</button>
                        {!userData.coach.bookingStatus && (
                          <button onClick={() => navigate('/booking')} className="btn btn-info">Đặt lịch</button>
                        )}
                        {userData.coach.bookingStatus && (
                          <p className="mt-2 mb-0">Trạng thái lịch hẹn: <strong>{userData.coach.bookingStatus}</strong></p>
                        )}
                      </div>
                    ) : (
                      <div className="alert alert-warning">
                        <p className="mb-1">Bạn chưa được phân công huấn luyện viên.</p>
                        {!(userData.isMemberVip || userData.role === 'memberVip') ? (
                          <p className="mb-0">Vui lòng nâng cấp tài khoản để yêu cầu huấn luyện viên.</p>
                        ) : (
                          <button onClick={() => navigate('/booking')} className="btn btn-info">Đặt lịch</button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Thông tin Cai thuốc (Smoking Profile) */}
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
                  <select
                    className="form-select"
                    id="cigaretteType"
                    value={userData.smokingStatus.cigaretteType}
                    onChange={(e) => handleUpdateSmokingStatus('cigaretteType', e.target.value)}
                  >
                    <option value="">Chọn loại thuốc lá</option>
                    <option value="Thuốc lá 555">Thuốc lá 555</option>
                    <option value="Thuốc lá Richmond">Thuốc lá Richmond</option>
                    <option value="Thuốc lá Esse">Thuốc lá Esse</option>
                    <option value="Thuốc lá Craven">Thuốc lá Craven</option>
                    <option value="Thuốc lá Marlboro">Thuốc lá Marlboro</option>
                    <option value="Thuốc lá Camel">Thuốc lá Camel</option>
                    <option value="Thuốc lá SG bạc">Thuốc lá SG bạc</option>
                    <option value="Thuốc lá Jet">Thuốc lá Jet</option>
                    <option value="Thuốc lá Thăng Long">Thuốc lá Thăng Long</option>
                    <option value="Thuốc lá Hero">Thuốc lá Hero</option>
                  </select>
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
        </div> {/* End of first row (Account Info & Smoking Profile) */}

        <div className="row">
          {/* Kế hoạch Cai thuốc */}
          <div className="col-md-6 mb-4">
            <div className="card shadow-sm h-100">
              <div className="card-header bg-success text-white fw-bold">Kế hoạch Cai thuốc</div>
              <div className="card-body">
                {!userData.quitPlan ? (
                  <div className="text-center p-3 border border-dashed rounded-3 bg-light">
                    <p className="text-secondary mb-3">Bạn chưa có kế hoạch cai thuốc. Hãy tạo một kế hoạch để bắt đầu hành trình của mình!</p>
                    <h6 className="mb-2">Chọn kế hoạch mẫu:</h6>
                    <div>
                      {suggestedPlans.length === 0 ? (
                        <p>Không có kế hoạch mẫu.</p>
                      ) : (
                        suggestedPlans.map((plan, idx) => (
                          <div key={plan.Id} className="card mb-2">
                            <div className="card-body">
                              <h6>{plan.Title}</h6>
                              <p>{plan.Description}</p>
                              <button
                                className="btn btn-outline-primary btn-sm"
                                onClick={() => setUserData(prev => ({
                                  ...prev,
                                  quitPlan: {
                                    startDate: new Date().toISOString().slice(0, 10),
                                    targetDate: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().slice(0, 10),
                                    milestones: [],
                                    currentProgress: 0,
                                    initialCigarettes: 0,
                                    dailyReduction: 0,
                                    planDetail: plan.PlanDetail || '',
                                    planType: 'suggested',
                                  }
                                }))}
                              >
                                Áp dụng kế hoạch này
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                    <button onClick={handleJoinQuitPlan} className="btn btn-success me-2">Tham gia Kế hoạch Cai thuốc</button>
                    <button onClick={() => setUserData(prev => ({ ...prev, quitPlan: { startDate: '', targetDate: '', milestones: [], currentProgress: 0, initialCigarettes: 0, dailyReduction: 0, planDetail: '', planType: 'custom' } }))} className="btn btn-outline-success">Tạo Kế hoạch mới</button>
                  </div>
                ) : (
                  <div>
                    <div className="mb-3">
                      <label htmlFor="startDate" className="form-label">Ngày bắt đầu</label>
                      <input
                        type="date"
                        className="form-control"
                        id="startDate"
                        value={userData.quitPlan?.startDate || ''}
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
                        value={userData.quitPlan?.targetDate || ''}
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
                        value={userData.quitPlan?.initialCigarettes || 0}
                        onChange={(e) => setUserData(prev => ({
                          ...prev,
                          quitPlan: { ...prev.quitPlan, initialCigarettes: Number(e.target.value) }
                        }))}
                        min="0"
                      />
                    </div>
                    <div className="mb-3">
                      <label htmlFor="dailyReduction" className="form-label">Số điếu giảm mỗi ngày (dự kiến)</label>
                      <input
                        type="number"
                        className="form-control"
                        id="dailyReduction"
                        value={userData.quitPlan?.dailyReduction || 0}
                        onChange={(e) => setUserData(prev => ({
                          ...prev,
                          quitPlan: { ...prev.quitPlan, dailyReduction: Number(e.target.value) }
                        }))}
                        min="0"
                      />
                    </div>
                    <div className="mb-3">
                      <label htmlFor="planDetail" className="form-label">Chi tiết kế hoạch</label>
                      <textarea
                        className="form-control"
                        id="planDetail"
                        rows="3"
                        value={userData.quitPlan?.planDetail || ''}
                        onChange={(e) => setUserData(prev => ({
                          ...prev,
                          quitPlan: { ...prev.quitPlan, planDetail: e.target.value }
                        }))}
                      ></textarea>
                    </div>
                    <p className="fw-bold mt-3 mb-1">Tiến độ hiện tại: {(typeof userData.quitPlan?.currentProgress === 'number' ? userData.quitPlan.currentProgress : 0).toFixed(2)}%</p>
                    <div className="progress" style={{ height: '10px' }}>
                      <div 
                        className="progress-bar bg-success"
                        role="progressbar"
                        style={{ width: `${(typeof userData.quitPlan?.currentProgress === 'number' ? userData.quitPlan.currentProgress : 0)}%` }}
                        aria-valuenow={(typeof userData.quitPlan?.currentProgress === 'number' ? userData.quitPlan.currentProgress : 0)}
                        aria-valuemin="0"
                        aria-valuemax="100"
                      ></div>
                    </div>

                    <h6 className="mt-4 mb-2">Các mốc quan trọng:</h6>
                    <ul className="list-group mb-3">
                      {(userData.quitPlan?.milestones || []).length === 0 ? (
                        <li className="list-group-item text-secondary">Chưa có mốc quan trọng nào.</li>
                      ) : (
                        (userData.quitPlan?.milestones || []).map((milestone, index) => (
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

          {/* Nhật ký hàng ngày (Daily Log) */}
          <div className="col-md-6 mb-4">
            <div className="card shadow-sm h-100">
              <div className="card-header bg-success text-white fw-bold">Nhật ký hàng ngày</div>
              <div className="card-body">
                {/* Daily Log Inputs */}
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
              </div>
            </div>
          </div>
        </div> {/* End of second row (Quit Plan & Daily Log) */}

        <div className="row">
          {/* Biểu đồ tiến độ hút thuốc */}
          <div className="col-md-6 mb-4">
            <div className="card shadow-sm h-100">
              <div className="card-header bg-success text-white fw-bold">Biểu đồ tiến độ hút thuốc</div>
              <div className="card-body">
                {(() => {
                  // Tạo mảng ngày liên tục từ ngày bắt đầu đến hôm nay hoặc ngày kết thúc
                  let chartLabels = [];
                  let chartData = [];
                  let targetData = [];
                  if (userData.quitPlan && userData.quitPlan.startDate) {
                    const startDate = new Date(userData.quitPlan.startDate);
                    const endDate = userData.quitPlan.targetDate ? new Date(userData.quitPlan.targetDate) : new Date();
                    const today = new Date();
                    // Nếu chưa đến ngày kết thúc thì lấy đến hôm nay
                    const lastDate = endDate > today ? today : endDate;
                    for (let d = new Date(startDate); d <= lastDate; d.setDate(d.getDate() + 1)) {
                      const dateStr = d.toISOString().slice(0, 10);
                      chartLabels.push(new Date(dateStr).toLocaleDateString());
                      // Tìm entry trong smokingHistory
                      const entry = smokingHistory.find(e => e.Date.slice(0, 10) === dateStr);
                      chartData.push(entry ? entry.Cigarettes : 0);
                      // Mục tiêu giảm dần
                      if (userData.quitPlan.dailyReduction > 0) {
                        const daysPassed = Math.floor((d.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
                        targetData.push(Math.max(0, userData.quitPlan.initialCigarettes - (userData.quitPlan.dailyReduction * daysPassed)));
                      }
                    }
                  }
                  return chartLabels.length > 0 ? (
                    <Line
                      data={{
                        labels: chartLabels,
                        datasets: [
                          {
                            label: 'Số điếu hút mỗi ngày',
                            data: chartData,
                            borderColor: 'rgb(75, 192, 192)',
                            tension: 0.1,
                          },
                          userData.quitPlan && userData.quitPlan.dailyReduction > 0 && {
                            label: 'Mục tiêu giảm dần',
                            data: targetData,
                            borderColor: 'rgb(255, 99, 132)',
                            tension: 0.1,
                            borderDash: [5, 5],
                          },
                        ].filter(Boolean),
                      }}
                      options={{
                        responsive: true,
                        plugins: {
                          legend: {
                            position: 'top',
                          },
                          title: {
                            display: true,
                            text: 'Lịch sử số điếu thuốc hút hàng ngày',
                          },
                        },
                        scales: {
                          x: {
                            title: {
                              display: true,
                              text: 'Ngày',
                            },
                          },
                          y: {
                            title: {
                              display: true,
                              text: 'Số điếu thuốc',
                            },
                            min: 0,
                          },
                        },
                      }}
                    />
                  ) : (
                    <p className="text-secondary">Chưa có dữ liệu lịch sử hút thuốc để hiển thị biểu đồ.</p>
                  );
                })()}
              </div>
            </div>
          </div>

          {/* Thành tích của bạn */}
          <div className="col-md-6 mb-4">
            <div className="card shadow-sm h-100">
              <div className="card-header bg-success text-white fw-bold">Thành tích của bạn</div>
              <div className="card-body">
                <ul className="list-group">
                  {userData.achievements.length === 0 ? (
                    <li className="list-group-item text-secondary">Bạn chưa có thành tích nào. Hãy tiếp tục cố gắng!</li>
                  ) : (
                    userData.achievements.map((achievement, index) => (
                      <li key={index} className="list-group-item d-flex justify-content-between align-items-center">
                        {achievement.Name}
                        <span className="badge bg-success">{new Date(achievement.AwardedAt).toLocaleDateString()}</span>
                      </li>
                    ))
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div> {/* End of third row (Chart & Achievements) */}

      </div> {/* End of my-progress-container */}

      {/* Footer from HomePage */}
      <footer className="footer">
        <div className="container">
          <div className="social-icons">
            <a href="https://www.facebook.com/loccphamxuan?locale=vi_VN" target="_blank" rel="noopener noreferrer" aria-label="Facebook"><img src={facebookImage} alt="Facebook" style={{ width: '36px', height: '36px' }} /></a>
            <a href="https://www.instagram.com/xlocpham/" target="_blank" rel="noopener noreferrer" aria-label="Instagram"><img src={instagramImage} alt="Instagram" style={{ width: '36px', height: '36px' }} /></a>
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