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
  const [chartView, setChartView] = useState('plan');
  const [currentWeek, setCurrentWeek] = useState(1);
  const [selectedPlanId, setSelectedPlanId] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newPlan, setNewPlan] = useState({
    startDate: '',
    targetDate: '',
    planDetail: '',
    initialCigarettes: 0,
    dailyReduction: 0,
    milestones: ''
  });
  const [showDateForm, setShowDateForm] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [planDates, setPlanDates] = useState({ startDate: '', targetDate: '' });
  
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
      
      if (profileResponse.data.currentUserSuggestedPlan) {
        setUserData(prev => ({
          ...prev,
          currentUserSuggestedPlan: profileResponse.data.currentUserSuggestedPlan
        }));
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
      let payload = {
        cigarettes: userData.smokingStatus.dailyLog.cigarettes,
        feeling: userData.smokingStatus.dailyLog.feeling,
        logDate: new Date().toISOString().slice(0, 10)
      };
      if (userData.currentUserSuggestedPlan) {
        payload.suggestedPlanId = userData.currentUserSuggestedPlan.id;
      } else if (userData.quitPlan && userData.quitPlan.id) {
        payload.planId = userData.quitPlan.id;
      }
      const response = await addDailyLog(payload);
      setSuccess('Nhật ký đã được cập nhật!');
      if (response.newBadges && response.newBadges.length > 0) {
        setUserData(prev => ({
          ...prev,
          achievements: [...prev.achievements, ...response.newBadges]
        }));
      }
      await fetchUserData();
      await fetchSmokingHistory();
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
      const response = await axios.post('http://localhost:5000/api/users/request-coach', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess('Huấn luyện viên đã được phân công cho bạn!');
      await fetchUserData();
      // Navigate to chat interface if coach is assigned
      if (response.data.coachId) {
        navigate(`/chat-coach/${response.data.coachId}`);
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

  // Helper functions for chart calculations
  const calculateCurrentStreak = (history) => {
    if (!history || history.length === 0) return 0;
    
    const sortedHistory = [...history].sort((a, b) => new Date(b.Date) - new Date(a.Date));
    let streak = 0;
    
    for (const entry of sortedHistory) {
      if ((entry.Cigarettes || 0) === 0) {
        streak++;
      } else {
        break;
      }
    }
    
    return streak;
  };

  const calculateLongestStreak = (history) => {
    if (!history || history.length === 0) return 0;
    
    const sortedHistory = [...history].sort((a, b) => new Date(a.Date) - new Date(b.Date));
    let longestStreak = 0;
    let currentStreak = 0;
    
    for (const entry of sortedHistory) {
      if ((entry.Cigarettes || 0) === 0) {
        currentStreak++;
        longestStreak = Math.max(longestStreak, currentStreak);
      } else {
        currentStreak = 0;
      }
    }
    
    return longestStreak;
  };

  const groupByWeek = (history) => {
    const weeklyData = {};
    
    history.forEach(entry => {
      const date = new Date(entry.Date);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay()); // Start of week (Sunday)
      const weekKey = weekStart.toISOString().slice(0, 10);
      
      if (!weeklyData[weekKey]) {
        weeklyData[weekKey] = {
          weekNumber: Math.ceil((date.getTime() - new Date(date.getFullYear(), 0, 1).getTime()) / (1000 * 60 * 60 * 24 * 7)),
          totalCigarettes: 0,
          totalMoneySaved: 0,
          days: 0
        };
      }
      
      weeklyData[weekKey].totalCigarettes += entry.Cigarettes || 0;
      weeklyData[weekKey].days++;
    });
    
    // Calculate money saved for each week
    Object.values(weeklyData).forEach(week => {
      const costPerCigarette = userData.smokingStatus.costPerPack ? userData.smokingStatus.costPerPack / 20 : 0;
      week.totalMoneySaved = week.totalCigarettes * costPerCigarette;
    });
    
    return Object.values(weeklyData).sort((a, b) => a.weekNumber - b.weekNumber);
  };

  const groupByMonth = (history) => {
    const monthlyData = {};
    
    history.forEach(entry => {
      const date = new Date(entry.Date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          monthLabel: date.toLocaleDateString('vi-VN', { year: 'numeric', month: 'long' }),
          totalCigarettes: 0,
          totalMoneySaved: 0,
          days: 0
        };
      }
      
      monthlyData[monthKey].totalCigarettes += entry.Cigarettes || 0;
      monthlyData[monthKey].days++;
    });
    
    // Calculate money saved for each month
    Object.values(monthlyData).forEach(month => {
      const costPerCigarette = userData.smokingStatus.costPerPack ? userData.smokingStatus.costPerPack / 20 : 0;
      month.totalMoneySaved = month.totalCigarettes * costPerCigarette;
    });
    
    return Object.values(monthlyData).sort((a, b) => {
      const [yearA, monthA] = Object.keys(monthlyData).find(key => monthlyData[key] === a).split('-');
      const [yearB, monthB] = Object.keys(monthlyData).find(key => monthlyData[key] === b).split('-');
      return new Date(yearA, monthA - 1) - new Date(yearB, monthB - 1);
    });
  };

  // Helper functions for quit plan weekly view
  const getQuitPlanWeeks = () => {
    if (!userData.quitPlan || !userData.quitPlan.startDate || !userData.quitPlan.targetDate) {
      return [];
    }

    const startDate = new Date(userData.quitPlan.startDate);
    const endDate = new Date(userData.quitPlan.targetDate);
    const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
    const totalWeeks = Math.ceil(totalDays / 7);

    const weeks = [];
    for (let week = 1; week <= totalWeeks; week++) {
      const weekStartDate = new Date(startDate);
      weekStartDate.setDate(startDate.getDate() + (week - 1) * 7);
      
      const weekEndDate = new Date(weekStartDate);
      weekEndDate.setDate(weekStartDate.getDate() + 6);
      
      // Don't exceed the target date
      if (weekEndDate > endDate) {
        weekEndDate.setTime(endDate.getTime());
      }

      weeks.push({
        weekNumber: week,
        startDate: weekStartDate,
        endDate: weekEndDate,
        startDateStr: weekStartDate.toISOString().slice(0, 10),
        endDateStr: weekEndDate.toISOString().slice(0, 10),
        label: `Tuần ${week} (${weekStartDate.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })} - ${weekEndDate.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })})`
      });
    }

    return weeks;
  };

  const getWeekData = (weekInfo) => {
    if (!weekInfo || !smokingHistory.length) return { labels: [], data: [], targetData: [], moneySavedData: [] };

    const labels = [];
    const data = [];
    const targetData = [];
    const moneySavedData = [];

    // Generate data for each day in the week
    for (let d = new Date(weekInfo.startDate); d <= weekInfo.endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().slice(0, 10);
      labels.push(d.toLocaleDateString('vi-VN', { 
        weekday: 'short',
        day: '2-digit',
        month: '2-digit'
      }));

      // Find smoking data for this date
      const entry = smokingHistory.find(e => e.Date.slice(0, 10) === dateStr);
      const cigarettes = entry ? entry.Cigarettes : 0;
      data.push(cigarettes);

      // Calculate money saved
      const costPerCigarette = userData.smokingStatus.costPerPack ? userData.smokingStatus.costPerPack / 20 : 0;
      moneySavedData.push(cigarettes * costPerCigarette);

      // Calculate target based on quit plan
      if (userData.quitPlan && userData.quitPlan.dailyReduction > 0) {
        const daysPassed = Math.floor((d.getTime() - new Date(userData.quitPlan.startDate).getTime()) / (1000 * 60 * 60 * 24));
        targetData.push(Math.max(0, userData.quitPlan.initialCigarettes - (userData.quitPlan.dailyReduction * daysPassed)));
      }
    }

    return { labels, data, targetData, moneySavedData };
  };

  const getCurrentWeekInfo = () => {
    const weeks = getQuitPlanWeeks();
    return weeks.find(week => week.weekNumber === currentWeek) || null;
  };

  const getWeekStatistics = (weekInfo) => {
    if (!weekInfo) return { totalCigarettes: 0, averagePerDay: 0, daysWithoutSmoking: 0, moneySaved: 0 };

    const weekData = getWeekData(weekInfo);
    const totalCigarettes = weekData.data.reduce((sum, val) => sum + val, 0);
    const averagePerDay = weekData.data.length > 0 ? (totalCigarettes / weekData.data.length).toFixed(1) : 0;
    const daysWithoutSmoking = weekData.data.filter(val => val === 0).length;
    const moneySaved = weekData.moneySavedData.reduce((sum, val) => sum + val, 0);

    return { totalCigarettes, averagePerDay, daysWithoutSmoking, moneySaved };
  };

  const getCurrentProgress = (plan) => {
    if (!plan || !plan.startDate || !plan.targetDate) return 0;
    const start = new Date(plan.startDate);
    const end = new Date(plan.targetDate);
    const now = new Date();
    if (now < start) return 0;
    if (now > end) return 100;
    const total = end - start;
    const done = now - start;
    return Math.round((done / total) * 100);
  };

  const fetchSmokingHistory = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const historyResponse = await axios.get('http://localhost:5000/api/auth/progress/history', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSmokingHistory(historyResponse.data.history || []);
    } catch (historyError) {
      setSmokingHistory([]);
    }
  }, []);

  if (loading) {
    return (
      <div className="my-progress-wrapper">
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
          <div className="spinner-border text-success" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
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
                    {userData.coach || userData.coachId ? (
                      <div className="alert alert-info">
                        <h6 className="alert-heading mb-2">
                          <i className="fas fa-user-tie me-2"></i>Huấn luyện viên của bạn
                        </h6>
                        <p className="mb-2">
                          <strong>Tên:</strong> {userData.coach?.Username || userData.coach?.Name || `Coach ID: ${userData.coachId}`}
                        </p>
                        <div className="d-flex flex-wrap gap-2">
                          <button 
                            onClick={() => navigate(`/chat-coach/${userData.coach?.Id || userData.coach?.id || userData.coachId}`)} 
                            className="btn btn-success"
                          >
                            <i className="fas fa-comments me-2"></i>Nhắn tin với Coach
                          </button>
                          <button onClick={() => navigate('/booking')} className="btn btn-info">
                            <i className="fas fa-calendar-plus me-2"></i>Đặt lịch hẹn
                          </button>
                          <button onClick={handleCancelCoachRequest} className="btn btn-outline-danger">
                            <i className="fas fa-times me-2"></i>Hủy yêu cầu Coach
                          </button>
                        </div>
                        {userData.coach?.bookingStatus && (
                          <p className="mt-2 mb-0">
                            <strong>Trạng thái lịch hẹn:</strong> 
                            <span className="badge bg-primary ms-2">{userData.coach.bookingStatus}</span>
                          </p>
                        )}
                      </div>
                    ) : userData.isMember ? (
                      <div className="alert alert-warning">
                        <p className="mb-1">Bạn chưa được phân công huấn luyện viên.</p>
                        {!(userData.isMemberVip || userData.role === 'memberVip') ? (
                          <p className="mb-0">Vui lòng nâng cấp tài khoản để yêu cầu huấn luyện viên.</p>
                        ) : (
                          <button onClick={() => navigate('/booking')} className="btn btn-info">Đặt lịch</button>
                        )}
                      </div>
                    ) : null}
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
                {userData.currentUserSuggestedPlan ? (
                  <div>
                    <h5>{userData.currentUserSuggestedPlan.title}</h5>
                    <p>{userData.currentUserSuggestedPlan.description}</p>
                    <div><b>Chi tiết:</b> {userData.currentUserSuggestedPlan.planDetail}</div>
                    <div><b>Ngày bắt đầu:</b> {userData.currentUserSuggestedPlan.startDate}</div>
                    <div><b>Ngày kết thúc:</b> {userData.currentUserSuggestedPlan.targetDate}</div>
                    <div className="my-3">
                      <label className="fw-bold">Tiến độ hiện tại:</label>
                      <div className="progress" style={{ height: 24 }}>
                        <div
                          className="progress-bar bg-success"
                          role="progressbar"
                          style={{ width: `${getCurrentProgress(userData.currentUserSuggestedPlan)}%` }}
                          aria-valuenow={getCurrentProgress(userData.currentUserSuggestedPlan)}
                          aria-valuemin="0"
                          aria-valuemax="100"
                        >
                          {getCurrentProgress(userData.currentUserSuggestedPlan)}%
                        </div>
                      </div>
                    </div>
                    <button
                      className="btn btn-outline-danger mt-3"
                      onClick={async () => {
                        const token = localStorage.getItem('token');
                        try {
                          await axios.delete('http://localhost:5000/api/auth/user-suggested-quit-plan', {
                            headers: { Authorization: `Bearer ${token}` }
                          });
                          setSuccess('Đã hủy kế hoạch!');
                          fetchUserData();
                        } catch (error) {
                          setError(error.response?.data?.message || 'Hủy kế hoạch thất bại.');
                        }
                      }}
                    >
                      Đổi kế hoạch
                    </button>
                  </div>
                ) : (
                  userData.role === 'memberVip' || userData.isMemberVip ? (
                    <div className="text-center p-3 border border-dashed rounded-3 bg-light">
                      <p className="text-secondary mb-3">Bạn chưa có kế hoạch cai thuốc. Hãy tạo một kế hoạch để bắt đầu hành trình của mình!</p>
                      <h6 className="mb-2">Chọn kế hoạch mẫu:</h6>
                      <div>
                        {suggestedPlans.length === 0 ? (
                          <p>Không có kế hoạch mẫu.</p>
                        ) : (
                          suggestedPlans.map((plan, idx) => (
                            <div
                              key={plan.Id}
                              className={`card mb-2 ${selectedPlanId === plan.Id ? 'border-primary border-2' : ''}`}
                              style={{ cursor: 'pointer' }}
                              onClick={() => setSelectedPlanId(plan.Id)}
                            >
                              <div className="card-body">
                                <h6>{plan.Title}</h6>
                                <p>{plan.Description}</p>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                      <button
                        className="btn btn-success me-2"
                        disabled={!selectedPlanId}
                        onClick={() => {
                          const plan = suggestedPlans.find(p => p.Id === selectedPlanId);
                          setSelectedPlan(plan);
                          setShowDateForm(true);
                        }}
                      >
                        Chọn
                      </button>
                      {showDateForm && selectedPlan && (
                        <form
                          className="mt-3"
                          onSubmit={async e => {
                            e.preventDefault();
                            const token = localStorage.getItem('token');
                            try {
                              await axios.post('http://localhost:5000/api/auth/user-suggested-quit-plan', {
                                suggestedPlanId: selectedPlan.Id,
                                startDate: planDates.startDate,
                                targetDate: planDates.targetDate
                              }, {
                                headers: { Authorization: `Bearer ${token}` }
                              });
                              setSuccess('Đã lưu kế hoạch!');
                              setShowDateForm(false);
                              setSelectedPlan(null);
                              setPlanDates({ startDate: '', targetDate: '' });
                              fetchUserData();
                            } catch (error) {
                              setError(error.response?.data?.message || 'Lưu kế hoạch thất bại.');
                            }
                          }}
                        >
                          <div className="mb-2">
                            <label>Ngày bắt đầu</label>
                            <input type="date" className="form-control" value={planDates.startDate} onChange={e => setPlanDates({ ...planDates, startDate: e.target.value })} required />
                          </div>
                          <div className="mb-2">
                            <label>Ngày kết thúc</label>
                            <input type="date" className="form-control" value={planDates.targetDate} onChange={e => setPlanDates({ ...planDates, targetDate: e.target.value })} required />
                          </div>
                          <button type="submit" className="btn btn-success">Lưu kế hoạch</button>
                          <button type="button" className="btn btn-secondary ms-2" onClick={() => setShowDateForm(false)}>Hủy</button>
                        </form>
                      )}
                    </div>
                  ) : (
                    <div className="alert alert-warning text-center">
                      Bạn cần nâng cấp lên <b>memberVip</b> để sử dụng kế hoạch mẫu của hệ thống.<br/>
                      <button className="btn btn-success mt-2" onClick={() => navigate('/subscribe')}>Nâng cấp ngay</button>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>

          {/* Nhật ký hàng ngày (luôn luôn hiển thị) */}
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
                    onChange={(e) => setUserData(prev => ({
                      ...prev,
                      smokingStatus: {
                        ...prev.smokingStatus,
                        dailyLog: {
                          ...prev.smokingStatus.dailyLog,
                          cigarettes: Number(e.target.value)
                        }
                      }
                    }))}
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
                    onChange={(e) => setUserData(prev => ({
                      ...prev,
                      smokingStatus: {
                        ...prev.smokingStatus,
                        dailyLog: {
                          ...prev.smokingStatus.dailyLog,
                          feeling: e.target.value
                        }
                      }
                    }))}
                  ></textarea>
                </div>
                <button onClick={handleUpdateDailyLog} className="btn btn-success btn-sm">Cập nhật Nhật ký</button>
              </div>
            </div>
          </div>
        </div> {/* End of second row (Quit Plan & Daily Log) */}

        <div className="row">
          {/* Biểu đồ tiến độ hút thuốc */}
          <div className="col-md-8 mb-4">
            <div className="card shadow-sm h-100">
              <div className="card-header bg-success text-white fw-bold d-flex justify-content-between align-items-center">
                <span>Biểu đồ tiến độ hút thuốc</span>
              </div>
              <div className="card-body">
                {(() => {
                  // Calculate statistics
                  const totalDays = smokingHistory.length;
                  const totalCigarettes = smokingHistory.reduce((sum, entry) => sum + (entry.Cigarettes || 0), 0);
                  const averagePerDay = totalDays > 0 ? (totalCigarettes / totalDays).toFixed(1) : 0;
                  const maxCigarettes = Math.max(...smokingHistory.map(entry => entry.Cigarettes || 0), 0);
                  const daysWithoutSmoking = smokingHistory.filter(entry => (entry.Cigarettes || 0) === 0).length;
                  const currentStreak = calculateCurrentStreak(smokingHistory);
                  
                  // Prepare chart data based on view
                  let chartLabels = [];
                  let chartData = [];
                  let targetData = [];
                  let moneySavedData = [];
                  let weekNavigation = null;
                  let weekStatistics = null;
                  
                  if (chartView === 'plan' && userData.quitPlan) {
                    // Quit plan weekly view
                    const weeks = getQuitPlanWeeks();
                    const currentWeekInfo = getCurrentWeekInfo();
                    
                    if (currentWeekInfo && weeks.length > 0) {
                      const weekData = getWeekData(currentWeekInfo);
                      chartLabels = weekData.labels;
                      chartData = weekData.data;
                      targetData = weekData.targetData;
                      moneySavedData = weekData.moneySavedData;
                      weekStatistics = getWeekStatistics(currentWeekInfo);
                      
                      // Week navigation
                      weekNavigation = (
                        <div className="d-flex justify-content-between align-items-center mb-3">
                          <button 
                            className="btn btn-outline-primary btn-sm"
                            onClick={() => setCurrentWeek(Math.max(1, currentWeek - 1))}
                            disabled={currentWeek === 1}
                          >
                            <i className="fas fa-chevron-left me-1"></i>Tuần trước
                          </button>
                          <div className="text-center">
                            <h6 className="mb-0">{currentWeekInfo.label}</h6>
                            <small className="text-muted">
                              {currentWeekInfo.startDate.toLocaleDateString('vi-VN', { 
                                day: '2-digit', 
                                month: '2-digit', 
                                year: 'numeric' 
                              })} - {currentWeekInfo.endDate.toLocaleDateString('vi-VN', { 
                                day: '2-digit', 
                                month: '2-digit', 
                                year: 'numeric' 
                              })}
                            </small>
                          </div>
                          <button 
                            className="btn btn-outline-primary btn-sm"
                            onClick={() => setCurrentWeek(Math.min(weeks.length, currentWeek + 1))}
                            disabled={currentWeek === weeks.length}
                          >
                            Tuần sau<i className="fas fa-chevron-right ms-1"></i>
                          </button>
                        </div>
                      );
                    }
                  } else if (smokingHistory.length > 0) {
                    const sortedHistory = [...smokingHistory].sort((a, b) => new Date(a.Date) - new Date(b.Date));
                    const startDate = new Date(sortedHistory[0].Date);
                    const endDate = new Date(sortedHistory[sortedHistory.length - 1].Date);
                    
                    if (chartView === 'daily') {
                      // Daily view - show last 30 days
                      const thirtyDaysAgo = new Date();
                      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                      const chartStartDate = new Date(Math.max(startDate, thirtyDaysAgo));
                      
                      for (let d = new Date(chartStartDate); d <= endDate; d.setDate(d.getDate() + 1)) {
                        const dateStr = d.toISOString().slice(0, 10);
                        chartLabels.push(new Date(dateStr).toLocaleDateString('vi-VN', { 
                          month: 'short', 
                          day: 'numeric' 
                        }));
                        
                        const entry = sortedHistory.find(e => e.Date.slice(0, 10) === dateStr);
                        const cigarettes = entry ? entry.Cigarettes : 0;
                        chartData.push(cigarettes);
                        
                        // Calculate money saved (assuming cost per pack from user data)
                        const costPerCigarette = userData.smokingStatus.costPerPack ? userData.smokingStatus.costPerPack / 20 : 0;
                        moneySavedData.push(cigarettes * costPerCigarette);
                        
                        // Target line if quit plan exists
                        if (userData.quitPlan && userData.quitPlan.dailyReduction > 0) {
                          const daysPassed = Math.floor((d.getTime() - new Date(userData.quitPlan.startDate).getTime()) / (1000 * 60 * 60 * 24));
                          targetData.push(Math.max(0, userData.quitPlan.initialCigarettes - (userData.quitPlan.dailyReduction * daysPassed)));
                        }
                      }
                    } else if (chartView === 'weekly') {
                      // Weekly view - group by weeks
                      const weeklyData = groupByWeek(sortedHistory);
                      chartLabels = weeklyData.map(week => `Tuần ${week.weekNumber}`);
                      chartData = weeklyData.map(week => week.totalCigarettes);
                      moneySavedData = weeklyData.map(week => week.totalMoneySaved);
                    } else if (chartView === 'monthly') {
                      // Monthly view - group by months
                      const monthlyData = groupByMonth(sortedHistory);
                      chartLabels = monthlyData.map(month => month.monthLabel);
                      chartData = monthlyData.map(month => month.totalCigarettes);
                      moneySavedData = monthlyData.map(month => month.totalMoneySaved);
                    }
                  }
                  
                  return (
                    <div>
                      {/* Week Navigation for Plan View */}
                      {weekNavigation}
                      
                      {/* Statistics Cards */}
                      <div className="row mb-4">
                        {chartView === 'plan' && weekStatistics ? (
                          // Week-specific statistics
                          <>
                            <div className="col-md-3">
                              <div className="card bg-primary text-white">
                                <div className="card-body text-center">
                                  <h6 className="card-title">Tổng điếu tuần</h6>
                                  <h4>{weekStatistics.totalCigarettes}</h4>
                                </div>
                              </div>
                            </div>
                            <div className="col-md-3">
                              <div className="card bg-success text-white">
                                <div className="card-body text-center">
                                  <h6 className="card-title">Trung bình/ngày</h6>
                                  <h4>{weekStatistics.averagePerDay}</h4>
                                </div>
                              </div>
                            </div>
                            <div className="col-md-3">
                              <div className="card bg-warning text-dark">
                                <div className="card-body text-center">
                                  <h6 className="card-title">Ngày không hút</h6>
                                  <h4>{weekStatistics.daysWithoutSmoking}</h4>
                                </div>
                              </div>
                            </div>
                            <div className="col-md-3">
                              <div className="card bg-info text-white">
                                <div className="card-body text-center">
                                  <h6 className="card-title">Tiết kiệm</h6>
                                  <h4>{weekStatistics.moneySaved.toLocaleString()}đ</h4>
                                </div>
                              </div>
                            </div>
                          </>
                        ) : (
                          // Overall statistics
                          <>
                            <div className="col-md-3">
                              <div className="card bg-primary text-white">
                                <div className="card-body text-center">
                                  <h6 className="card-title">Tổng ngày theo dõi</h6>
                                  <h4>{totalDays}</h4>
                                </div>
                              </div>
                            </div>
                            <div className="col-md-3">
                              <div className="card bg-success text-white">
                                <div className="card-body text-center">
                                  <h6 className="card-title">Trung bình/ngày</h6>
                                  <h4>{averagePerDay}</h4>
                                </div>
                              </div>
                            </div>
                            <div className="col-md-3">
                              <div className="card bg-warning text-dark">
                                <div className="card-body text-center">
                                  <h6 className="card-title">Ngày không hút</h6>
                                  <h4>{daysWithoutSmoking}</h4>
                                </div>
                              </div>
                            </div>
                            <div className="col-md-3">
                              <div className="card bg-info text-white">
                                <div className="card-body text-center">
                                  <h6 className="card-title">Chuỗi hiện tại</h6>
                                  <h4>{currentStreak} ngày</h4>
                                </div>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                      
                      {/* Chart */}
                      {chartLabels.length > 0 ? (
                        <div>
                          <Line
                            data={{
                              labels: chartLabels,
                              datasets: [
                                {
                                  label: 'Số điếu hút',
                                  data: chartData,
                                  borderColor: 'rgb(220, 53, 69)',
                                  backgroundColor: 'rgba(220, 53, 69, 0.1)',
                                  tension: 0.4,
                                  fill: true,
                                },
                                userData.quitPlan && userData.quitPlan.dailyReduction > 0 && {
                                  label: 'Mục tiêu giảm dần',
                                  data: targetData,
                                  borderColor: 'rgb(40, 167, 69)',
                                  backgroundColor: 'rgba(40, 167, 69, 0.1)',
                                  tension: 0.4,
                                  borderDash: [5, 5],
                                  fill: false,
                                },
                                userData.smokingStatus.costPerPack > 0 && {
                                  label: 'Tiền tiết kiệm (VNĐ)',
                                  data: moneySavedData,
                                  borderColor: 'rgb(255, 193, 7)',
                                  backgroundColor: 'rgba(255, 193, 7, 0.1)',
                                  tension: 0.4,
                                  fill: false,
                                  yAxisID: 'y1',
                                },
                              ].filter(Boolean),
                            }}
                            options={{
                              responsive: true,
                              interaction: {
                                mode: 'index',
                                intersect: false,
                              },
                              plugins: {
                                legend: {
                                  position: 'top',
                                },
                                title: {
                                  display: true,
                                  text: chartView === 'plan' 
                                    ? `Tuần ${currentWeek} - ${getCurrentWeekInfo()?.label || ''}`
                                    : `Biểu đồ hút thuốc - ${chartView === 'daily' ? 'Hàng ngày' : chartView === 'weekly' ? 'Hàng tuần' : 'Hàng tháng'}`,
                                },
                                tooltip: {
                                  callbacks: {
                                    afterBody: function(context) {
                                      const dataIndex = context[0].dataIndex;
                                      const cigarettes = chartData[dataIndex];
                                      const moneySaved = moneySavedData[dataIndex];
                                      let tooltip = '';
                                      if (cigarettes !== undefined) {
                                        tooltip += `\nSố điếu: ${cigarettes}`;
                                      }
                                      if (moneySaved !== undefined && moneySaved > 0) {
                                        tooltip += `\nTiết kiệm: ${moneySaved.toLocaleString()} VNĐ`;
                                      }
                                      return tooltip;
                                    }
                                  }
                                }
                              },
                              scales: {
                                x: {
                                  title: {
                                    display: true,
                                    text: chartView === 'plan' ? 'Ngày trong tuần' : 'Thời gian',
                                  },
                                },
                                y: {
                                  type: 'linear',
                                  display: true,
                                  position: 'left',
                                  title: {
                                    display: true,
                                    text: 'Số điếu thuốc',
                                  },
                                  min: 0,
                                },
                                y1: {
                                  type: 'linear',
                                  display: userData.smokingStatus.costPerPack > 0,
                                  position: 'right',
                                  title: {
                                    display: true,
                                    text: 'Tiền tiết kiệm (VNĐ)',
                                  },
                                  min: 0,
                                  grid: {
                                    drawOnChartArea: false,
                                  },
                                },
                              },
                            }}
                          />
                        </div>
                      ) : (
                        <div className="text-center py-5">
                          <i className="fas fa-chart-line fa-3x text-muted mb-3"></i>
                          {chartView === 'plan' ? (
                            <>
                              <p className="text-secondary">Chưa có kế hoạch cai thuốc hoặc dữ liệu để hiển thị.</p>
                              <p className="text-muted small">Hãy tạo kế hoạch cai thuốc và cập nhật nhật ký hàng ngày!</p>
                            </>
                          ) : (
                            <>
                              <p className="text-secondary">Chưa có dữ liệu lịch sử hút thuốc để hiển thị biểu đồ.</p>
                              <p className="text-muted small">Hãy cập nhật nhật ký hàng ngày để theo dõi tiến độ của bạn!</p>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>

          {/* Thành tích của bạn */}
          <div className="col-md-4 mb-4">
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
    </div>
  );
};

export default MyProgressPage;