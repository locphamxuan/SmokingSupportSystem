import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css'; 
import 'bootstrap/dist/js/bootstrap.bundle.min.js'; 
import '../style/MyProgressPage.scss'; 

import { 
  addDailyLog
} from '../services/extraService';
import DailyLogSection from '../components/DailyLogSection';

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
  
// Thêm service lấy kế hoạch do coach đề xuất
const getCoachSuggestedPlans = async () => {
  const token = localStorage.getItem('token');
  const res = await axios.get('http://localhost:5000/api/auth/coach-suggested-plans', {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data.plans;
};
const acceptCoachPlan = async (planId) => {
  const token = localStorage.getItem('token');
  return axios.post('http://localhost:5000/api/auth/accept-coach-plan', { planId }, {
    headers: { Authorization: `Bearer ${token}` }
  });
};
const rejectCoachPlan = async (planId) => {
  const token = localStorage.getItem('token');
  return axios.post('http://localhost:5000/api/auth/reject-coach-plan', { planId }, {
    headers: { Authorization: `Bearer ${token}` }
  });
};

const MyProgressPage = () => {
  const [currentDate, setCurrentDate] = useState(new Date().toLocaleDateString('vi-VN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }));
  
  const [logDate, setLogDate] = useState(new Date().toISOString().slice(0, 10));

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
      customCigaretteType: '',
      quitReason: '',
      dailyLog: {
        cigarettes: 0,
        feeling: '',
        date: new Date().toISOString().slice(0, 10)
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
    dailyReduction: 0
  });
  const [showDateForm, setShowDateForm] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [planDates, setPlanDates] = useState({ startDate: '', targetDate: '' });
  
  // State cho kế hoạch do coach đề xuất
  const [coachPlans, setCoachPlans] = useState([]);
  const [loadingCoachPlans, setLoadingCoachPlans] = useState(true);
  // Thêm state để lưu kế hoạch coach đã xác nhận
  const [acceptedCoachPlans, setAcceptedCoachPlans] = useState([]);
  const [selectedLogPlan, setSelectedLogPlan] = useState(null); // Kế hoạch được chọn để nhập nhật ký

  useEffect(() => {
    (async () => {
      setLoadingCoachPlans(true);
      try {
        const plans = await getCoachSuggestedPlans();
        setCoachPlans(plans || []);
        // Tách các kế hoạch đã xác nhận
        setAcceptedCoachPlans((plans || []).filter(p => p.Status === 'accepted'));
      } catch (e) {
        setCoachPlans([]);
        setAcceptedCoachPlans([]);
      } finally {
        setLoadingCoachPlans(false);
      }
    })();
  }, []);

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

  useEffect(() => {
    // Nếu chế độ xem là 'plan' nhưng không có kế hoạch, chuyển sang 'daily'
    if (chartView === 'plan' && !userData.quitPlan) {
      setChartView('daily');
    }
  }, [userData.quitPlan, chartView]);

  // Lấy kế hoạch coach đã xác nhận mới nhất
  const latestCoachPlan = acceptedCoachPlans.length > 0
    ? acceptedCoachPlans.reduce((a, b) => new Date(a.CreatedAt || a.createdAt) > new Date(b.CreatedAt || b.createdAt) ? a : b)
    : null;

  // Khi userData.quitPlan hoặc latestCoachPlan thay đổi, chọn mặc định kế hoạch nhập nhật ký
  useEffect(() => {
    if (userData.quitPlan && !latestCoachPlan) {
      setSelectedLogPlan({ type: 'system', plan: userData.quitPlan });
    } else if (!userData.quitPlan && latestCoachPlan) {
      setSelectedLogPlan({ type: 'coach', plan: latestCoachPlan });
    } else if (userData.quitPlan && latestCoachPlan) {
      setSelectedLogPlan({ type: 'system', plan: userData.quitPlan });
    } else {
      setSelectedLogPlan(null);
    }
  }, [userData.quitPlan, latestCoachPlan]);

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
        customCigaretteType: fetchedUserData.smokingStatus.customCigaretteType || '',
        quitReason: fetchedUserData.smokingStatus.quitReason || '',
        dailyLog: fetchedUserData.smokingStatus.dailyLog || {},
      };

      // Explicitly set default values for dailyLog properties
      fetchedUserData.smokingStatus.dailyLog = {
        ...fetchedUserData.smokingStatus.dailyLog,
        cigarettes: fetchedUserData.smokingStatus.dailyLog.cigarettes || 0,
        feeling: fetchedUserData.smokingStatus.dailyLog.feeling || '',
      };

      // Fetch custom quit plan from QuitPlans table if available
      try {
        const customQuitPlanResponse = await axios.get('http://localhost:5000/api/auth/custom-quit-plan', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (customQuitPlanResponse.data.quitPlan) {
          fetchedUserData.quitPlan = {
            id: customQuitPlanResponse.data.quitPlan.id || 0,
            startDate: customQuitPlanResponse.data.quitPlan.startDate || '',
            targetDate: customQuitPlanResponse.data.quitPlan.targetDate || '',
            initialCigarettes: customQuitPlanResponse.data.quitPlan.initialCigarettes || 0,
            dailyReduction: customQuitPlanResponse.data.quitPlan.dailyReduction || 0,
            currentProgress: 0,
            planDetail: customQuitPlanResponse.data.quitPlan.planDetail || '',
            createdAt: customQuitPlanResponse.data.quitPlan.createdAt || null,
            planSource: 'custom'
          };
        } else {
          // If no custom plan, try the old quit-plan endpoint
          try {
            const quitPlanResponse = await axios.get('http://localhost:5000/api/auth/quit-plan', {
              headers: { Authorization: `Bearer ${token}` }
            });
            fetchedUserData.quitPlan = {
              id: quitPlanResponse.data.quitPlan.id || 0,
              startDate: quitPlanResponse.data.quitPlan.startDate || '',
              targetDate: quitPlanResponse.data.quitPlan.targetDate || '',
              initialCigarettes: quitPlanResponse.data.quitPlan.initialCigarettes || 0,
              dailyReduction: quitPlanResponse.data.quitPlan.dailyReduction || 0,
              currentProgress: quitPlanResponse.data.quitPlan.currentProgress || 0,
              planDetail: quitPlanResponse.data.quitPlan.planDetail || '',
              createdAt: quitPlanResponse.data.quitPlan.createdAt || null,
            };
          } catch (oldQuitPlanError) {
            if (oldQuitPlanError.response && oldQuitPlanError.response.status !== 404) {
              console.error("Lỗi khi tải kế hoạch cai thuốc cũ:", oldQuitPlanError);
            }
            fetchedUserData.quitPlan = null;
          }
        }
      } catch (customQuitPlanError) {
        // It's okay if no custom quit plan exists (404), log other errors
        if (customQuitPlanError.response && customQuitPlanError.response.status !== 404) {
          console.error("Lỗi khi tải kế hoạch cai thuốc tự tạo:", customQuitPlanError);
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
    const dataArr = Array.isArray(weekData.data) ? weekData.data : [];
    const moneyArr = Array.isArray(weekData.moneySavedData) ? weekData.moneySavedData : [];
    const totalCigarettes = dataArr.reduce((sum, val) => sum + val, 0);
    const averagePerDay = dataArr.length > 0 ? (totalCigarettes / dataArr.length).toFixed(1) : 0;
    const daysWithoutSmoking = dataArr.filter(val => val === 0).length;
    const moneySaved = moneyArr.reduce((sum, val) => sum + val, 0);

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

  const getTotalWeeks = () => {
    // Kiểm tra kế hoạch tự tạo trước
    if (userData.quitPlan && userData.quitPlan.startDate && userData.quitPlan.targetDate) {
      const startDate = new Date(userData.quitPlan.startDate);
      const endDate = new Date(userData.quitPlan.targetDate);
      const diffTime = Math.abs(endDate - startDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return Math.ceil(diffDays / 7);
    }
    
    // Fallback to suggested plan
    if (!userData.currentUserSuggestedPlan) return 0;
    
    const startDate = new Date(userData.currentUserSuggestedPlan.startDate);
    const endDate = new Date(userData.currentUserSuggestedPlan.targetDate);
    const diffTime = Math.abs(endDate - startDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.ceil(diffDays / 7);
  };

  const getWeekDataFromPlan = (weekNumber) => {
    let activePlan = null;
    
    // Kiểm tra kế hoạch tự tạo trước
    if (userData.quitPlan && userData.quitPlan.startDate && userData.quitPlan.targetDate) {
      activePlan = userData.quitPlan;
    } else if (userData.currentUserSuggestedPlan) {
      activePlan = userData.currentUserSuggestedPlan;
    }
    
    if (!activePlan) return [];

    const startDate = new Date(activePlan.startDate);
    const weekStartDate = new Date(startDate);
    weekStartDate.setDate(startDate.getDate() + (weekNumber - 1) * 7);
    
    const weekData = [];
    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(weekStartDate);
      currentDate.setDate(weekStartDate.getDate() + i);
      
      // Nếu ngày hiện tại vượt quá ngày kết thúc kế hoạch, dừng lại
      if (currentDate > new Date(activePlan.targetDate)) break;
      
      // Tìm dữ liệu nhật ký cho ngày này
      const logEntry = smokingHistory.find(entry => 
        new Date(entry.Date).toISOString().slice(0, 10) === currentDate.toISOString().slice(0, 10)
      );
      
      weekData.push({
        date: currentDate,
        cigarettes: logEntry ? logEntry.Cigarettes : 0
      });
    }
    
    return weekData;
  };

  // Sửa hàm handleDailyLogUpdate để truyền đúng planId/suggestedPlanId
  const handleDailyLogUpdate = async (updatedLog) => {
    try {
      let payload = {
        cigarettes: updatedLog.cigarettes || 0,
        feeling: updatedLog.feeling || '',
        logDate: updatedLog.date || new Date().toISOString().slice(0, 10)
      };
      if (selectedLogPlan) {
        if (selectedLogPlan.type === 'system') {
          payload.planId = selectedLogPlan.plan.id;
        } else if (selectedLogPlan.type === 'coach') {
          payload.coachSuggestedPlanId = selectedLogPlan.plan.Id;
        }
      }
      const response = await addDailyLog(payload);
      setSuccess('Cập nhật nhật ký thành công!');
      setUserData(prev => ({
        ...prev,
        smokingStatus: {
          ...prev.smokingStatus,
          dailyLog: {
            cigarettes: updatedLog.cigarettes || 0,
            feeling: updatedLog.feeling || '',
            date: updatedLog.date || new Date().toISOString().slice(0, 10)
          }
        }
      }));
      if (response.newBadges && response.newBadges.length > 0) {
        setUserData(prev => ({
          ...prev,
          achievements: [...prev.achievements, ...response.newBadges]
        }));
        setSuccess(`Cập nhật nhật ký thành công! Bạn đã nhận được ${response.newBadges.length} huy hiệu mới!`);
      }
      await fetchUserData();
      await fetchSmokingHistory();
    } catch (error) {
      setError(error.message || 'Cập nhật nhật ký thất bại.');
    }
  };

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
                            className="btn btn-success"
                            onClick={() => {
                              // Fix: Always resolve coach ID correctly
                              const coachId = userData.coach?.Id || userData.coach?.id || userData.coachId;
                              if (coachId) {
                                navigate(`/chat-coach/${coachId}`);
                              } else {
                                alert('Không tìm thấy thông tin huấn luyện viên để nhắn tin.');
                              }
                            }}
                            disabled={!(userData.coach?.Id || userData.coach?.id || userData.coachId)}
                          >
                            <i className="fas fa-comments me-2"></i>Nhắn tin với Coach
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
                        <p className="mb-0">Bạn chưa được phân công huấn luyện viên.</p>
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
                    value={
                      [
                        'Thuốc lá 555',
                        'Thuốc lá Richmond',
                        'Thuốc lá Esse',
                        'Thuốc lá Craven',
                        'Thuốc lá Marlboro',
                        'Thuốc lá Camel',
                        'Thuốc lá SG bạc',
                        'Thuốc lá Jet',
                        'Thuốc lá Thăng Long',
                        'Thuốc lá Hero',
                        'other',
                        ''
                      ].includes(userData.smokingStatus.cigaretteType)
                        ? userData.smokingStatus.cigaretteType
                        : 'other'
                    }
                    onChange={e => {
                      if (e.target.value === 'other') {
                        handleUpdateSmokingStatus('cigaretteType', 'other');
                      } else {
                        handleUpdateSmokingStatus('cigaretteType', e.target.value);
                        handleUpdateSmokingStatus('customCigaretteType', '');
                      }
                    }}
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
                    <option value="other">Khác</option>
                  </select>
                  {/* Nếu chọn Khác thì hiển thị ô nhập tự do */}
                  {([
                    'other',
                    ''
                  ].includes(userData.smokingStatus.cigaretteType) ||
                    ![
                      'Thuốc lá 555',
                      'Thuốc lá Richmond',
                      'Thuốc lá Esse',
                      'Thuốc lá Craven',
                      'Thuốc lá Marlboro',
                      'Thuốc lá Camel',
                      'Thuốc lá SG bạc',
                      'Thuốc lá Jet',
                      'Thuốc lá Thăng Long',
                      'Thuốc lá Hero',
                      ''
                    ].includes(userData.smokingStatus.cigaretteType)) && (
                    <input
                      type="text"
                      className="form-control mt-2"
                      placeholder="Nhập loại thuốc lá khác..."
                      value={userData.smokingStatus.customCigaretteType}
                      onChange={e => handleUpdateSmokingStatus('customCigaretteType', e.target.value)}
                      onBlur={e => {
                        if (e.target.value) {
                          handleUpdateSmokingStatus('cigaretteType', e.target.value);
                        }
                      }}
                    />
                  )}
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
              <div className="card-header bg-success text-white fw-bold d-flex justify-content-between align-items-center">
                <span>Kế hoạch Cai thuốc</span>
                {(userData.quitPlan || userData.currentUserSuggestedPlan) && (
                  <span className={`badge ${userData.quitPlan ? 'bg-primary' : 'bg-info'}`}>
                    {userData.quitPlan ? 'Tự tạo' : 'Mẫu'}
                  </span>
                )}
              </div>
              <div className="card-body">
                {userData.quitPlan ? (
                  <div>
                    <h5>Kế hoạch cai thuốc tự tạo</h5>
                    <div><b>Chi tiết:</b> {userData.quitPlan.planDetail}</div>
                    <div><b>Ngày bắt đầu:</b> {userData.quitPlan.startDate}</div>
                    <div><b>Ngày kết thúc:</b> {userData.quitPlan.targetDate}</div>
                    <div><b>Số điếu ban đầu:</b> {userData.quitPlan.initialCigarettes}</div>
                    <div><b>Giảm mỗi ngày:</b> {userData.quitPlan.dailyReduction}</div>
                    <div className="my-3">
                      <label className="fw-bold">Tiến độ hiện tại:</label>
                      {(() => {
                        const startDate = new Date(userData.quitPlan.startDate);
                        const endDate = new Date(userData.quitPlan.targetDate);
                        const today = new Date();

                        if (today < startDate) {
                          return (
                            <div>
                              <div className="progress" style={{ height: 24 }}>
                                <div className="progress-bar bg-secondary" style={{ width: '0%' }}>
                                  0%
                                </div>
                              </div>
                              <small className="text-muted">Kế hoạch chưa bắt đầu</small>
                            </div>
                          );
                        }

                        if (today > endDate) {
                          const recentLogs = smokingHistory
                            .filter(log => new Date(log.Date) >= startDate && new Date(log.Date) <= endDate)
                            .sort((a, b) => new Date(b.Date) - new Date(a.Date));

                          const noSmokingDays = recentLogs.filter(log => log.Cigarettes === 0).length;
                          const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
                          const successRate = Math.round((noSmokingDays / totalDays) * 100);

                          return (
                            <div>
                              <div className="progress" style={{ height: 24 }}>
                                <div 
                                  className={`progress-bar ${successRate >= 70 ? 'bg-success' : successRate >= 40 ? 'bg-warning' : 'bg-danger'}`}
                                  style={{ width: '100%' }}
                                >
                                  Hoàn thành - {successRate}% ngày không hút thuốc
                                </div>
                              </div>
                              <small className="text-muted">Kế hoạch đã kết thúc</small>
                            </div>
                          );
                        }

                        const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
                        const daysPassed = Math.ceil((today - startDate) / (1000 * 60 * 60 * 24));
                        const progressPercent = Math.round((daysPassed / totalDays) * 100);

                        const recentLogs = smokingHistory
                          .filter(log => new Date(log.Date) >= startDate && new Date(log.Date) <= today)
                          .sort((a, b) => new Date(b.Date) - new Date(a.Date));

                        const noSmokingDays = recentLogs.filter(log => log.Cigarettes === 0).length;
                        const successRate = noSmokingDays > 0 ? Math.round((noSmokingDays / daysPassed) * 100) : 0;

                        return (
                          <div>
                            <div className="progress" style={{ height: 24 }}>
                              <div 
                                className={`progress-bar ${successRate >= 70 ? 'bg-success' : successRate >= 40 ? 'bg-warning' : 'bg-danger'}`}
                                style={{ width: `${progressPercent}%` }}
                              >
                                {progressPercent}% - {successRate}% ngày không hút thuốc
                              </div>
                            </div>
                            <div className="mt-2 d-flex justify-content-between">
                              <small className="text-muted">
                                {noSmokingDays} ngày không hút / {daysPassed} ngày đã qua
                              </small>
                              <small className="text-muted">
                                Còn {totalDays - daysPassed} ngày
                              </small>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                    <button
                      className="btn btn-outline-warning mt-3"
                      onClick={() => setShowCreateForm(true)}
                    >
                      Chỉnh sửa kế hoạch
                    </button>
                  </div>
                ) : userData.currentUserSuggestedPlan ? (
                  <div>
                    <h5>{userData.currentUserSuggestedPlan.title}</h5>
                    <p>{userData.currentUserSuggestedPlan.description}</p>
                    <div><b>Chi tiết:</b> {userData.currentUserSuggestedPlan.planDetail}</div>
                    <div><b>Ngày bắt đầu:</b> {userData.currentUserSuggestedPlan.startDate}</div>
                    <div><b>Ngày kết thúc:</b> {userData.currentUserSuggestedPlan.targetDate}</div>
                    <div className="my-3">
                      <label className="fw-bold">Tiến độ hiện tại:</label>
                      {(() => {
                        const startDate = new Date(userData.currentUserSuggestedPlan.startDate);
                        const endDate = new Date(userData.currentUserSuggestedPlan.targetDate);
                        const today = new Date();

                        // Nếu chưa đến ngày bắt đầu
                        if (today < startDate) {
                          return (
                            <div>
                              <div className="progress" style={{ height: 24 }}>
                                <div className="progress-bar bg-secondary" style={{ width: '0%' }}>
                                  0%
                                </div>
                              </div>
                              <small className="text-muted">Kế hoạch chưa bắt đầu</small>
                            </div>
                          );
                        }

                        // Nếu đã kết thúc
                        if (today > endDate) {
                          const recentLogs = smokingHistory
                            .filter(log => new Date(log.Date) >= startDate && new Date(log.Date) <= endDate)
                            .sort((a, b) => new Date(b.Date) - new Date(a.Date));

                          const noSmokingDays = recentLogs.filter(log => log.Cigarettes === 0).length;
                          const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
                          const successRate = Math.round((noSmokingDays / totalDays) * 100);

                          return (
                            <div>
                              <div className="progress" style={{ height: 24 }}>
                                <div 
                                  className={`progress-bar ${successRate >= 70 ? 'bg-success' : successRate >= 40 ? 'bg-warning' : 'bg-danger'}`}
                                  style={{ width: '100%' }}
                                >
                                  Hoàn thành - {successRate}% ngày không hút thuốc
                                </div>
                              </div>
                              <small className="text-muted">Kế hoạch đã kết thúc</small>
                            </div>
                          );
                        }

                        // Đang trong quá trình thực hiện
                        const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
                        const daysPassed = Math.ceil((today - startDate) / (1000 * 60 * 60 * 24));
                        const progressPercent = Math.round((daysPassed / totalDays) * 100);

                        // Tính số ngày không hút thuốc
                        const recentLogs = smokingHistory
                          .filter(log => new Date(log.Date) >= startDate && new Date(log.Date) <= today)
                          .sort((a, b) => new Date(b.Date) - new Date(a.Date));

                        const noSmokingDays = recentLogs.filter(log => log.Cigarettes === 0).length;
                        const successRate = noSmokingDays > 0 ? Math.round((noSmokingDays / daysPassed) * 100) : 0;

                        return (
                          <div>
                            <div className="progress" style={{ height: 24 }}>
                              <div 
                                className={`progress-bar ${successRate >= 70 ? 'bg-success' : successRate >= 40 ? 'bg-warning' : 'bg-danger'}`}
                                style={{ width: `${progressPercent}%` }}
                              >
                                {progressPercent}% - {successRate}% ngày không hút thuốc
                              </div>
                            </div>
                            <div className="mt-2 d-flex justify-content-between">
                              <small className="text-muted">
                                {noSmokingDays} ngày không hút / {daysPassed} ngày đã qua
                              </small>
                              <small className="text-muted">
                                Còn {totalDays - daysPassed} ngày
                              </small>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                   
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
                        Chọn kế hoạch mẫu
                      </button>
                      <button
                        className="btn btn-primary"
                        onClick={() => setShowCreateForm(true)}
                      >
                        Tự tạo kế hoạch
                      </button>
                      {showDateForm && selectedPlan && (
                        <form
                          className="mt-3"
                          onSubmit={async e => {
                            e.preventDefault();
                            const token = localStorage.getItem('token');
                            // Auto-calculate targetDate based on plan duration
                            const startDateObj = new Date(planDates.startDate);
                            let durationDays = 30; // Default
                            if (selectedPlan.Title?.includes('60')) durationDays = 60;
                            else if (selectedPlan.Title?.includes('90')) durationDays = 90;
                            // You can also parse from Description or add a field in DB for duration
                            const targetDateObj = new Date(startDateObj);
                            targetDateObj.setDate(startDateObj.getDate() + durationDays - 1);
                            const targetDate = targetDateObj.toISOString().slice(0, 10);
                            try {
                              await axios.post('http://localhost:5000/api/auth/user-suggested-quit-plan', {
                                suggestedPlanId: selectedPlan.Id,
                                startDate: planDates.startDate,
                                targetDate
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
                          {/* Ngày kết thúc sẽ tự động tính toán và hiển thị */}
                          {planDates.startDate && (
                            <div className="mb-2">
                              <label>Ngày kết thúc (tự động):</label>
                              <input type="text" className="form-control" value={() => {
                                const startDateObj = new Date(planDates.startDate);
                                let durationDays = 30;
                                if (selectedPlan.Title?.includes('60')) durationDays = 60;
                                else if (selectedPlan.Title?.includes('90')) durationDays = 90;
                                const targetDateObj = new Date(startDateObj);
                                targetDateObj.setDate(startDateObj.getDate() + durationDays - 1);
                                return targetDateObj.toISOString().slice(0, 10);
                              }} readOnly />
                            </div>
                          )}
                          <button type="submit" className="btn btn-success">Lưu kế hoạch</button>
                          <button type="button" className="btn btn-secondary ms-2" onClick={() => setShowDateForm(false)}>Hủy</button>
                        </form>
                      )}

                      {/* Form tự tạo kế hoạch */}
                      {showCreateForm && (
                        <form
                          className="mt-4 p-3 border rounded"
                          onSubmit={async e => {
                            e.preventDefault();
                            const token = localStorage.getItem('token');
                            try {
                              await axios.post('http://localhost:5000/api/auth/create-quit-plan', {
                                startDate: newPlan.startDate,
                                targetDate: newPlan.targetDate,
                                planDetail: newPlan.planDetail,
                                initialCigarettes: Number(newPlan.initialCigarettes),
                                dailyReduction: Number(newPlan.dailyReduction)
                              }, {
                                headers: { Authorization: `Bearer ${token}` }
                              });
                              setSuccess('Đã tạo kế hoạch cai thuốc thành công!');
                              setShowCreateForm(false);
                              setNewPlan({
                                startDate: '',
                                targetDate: '',
                                planDetail: '',
                                initialCigarettes: 0,
                                dailyReduction: 0
                              });
                              fetchUserData();
                            } catch (error) {
                              setError(error.response?.data?.message || 'Tạo kế hoạch thất bại.');
                            }
                          }}
                        >
                          <h6 className="mb-3 text-primary">🛠️ Tự tạo kế hoạch cai thuốc</h6>
                          
                          <div className="row">
                            <div className="col-md-6 mb-3">
                              <label className="form-label">Ngày bắt đầu *</label>
                              <input 
                                type="date" 
                                className="form-control" 
                                value={newPlan.startDate} 
                                onChange={e => setNewPlan({ ...newPlan, startDate: e.target.value })} 
                                required 
                              />
                            </div>
                            <div className="col-md-6 mb-3">
                              <label className="form-label">Ngày kết thúc *</label>
                              <input 
                                type="date" 
                                className="form-control" 
                                value={newPlan.targetDate} 
                                onChange={e => setNewPlan({ ...newPlan, targetDate: e.target.value })} 
                                required 
                              />
                            </div>
                          </div>

                          <div className="row">
                            <div className="col-md-6 mb-3">
                              <label className="form-label">Số điếu ban đầu *</label>
                              <input 
                                type="number" 
                                className="form-control" 
                                value={newPlan.initialCigarettes} 
                                onChange={e => setNewPlan({ ...newPlan, initialCigarettes: e.target.value })} 
                                min="0"
                                placeholder="Số điếu hút hiện tại"
                                required 
                              />
                              <small className="form-text text-muted">Số điếu thuốc bạn đang hút mỗi ngày</small>
                            </div>
                            <div className="col-md-6 mb-3">
                              <label className="form-label">Giảm mỗi ngày</label>
                              <input 
                                type="number" 
                                className="form-control" 
                                value={newPlan.dailyReduction} 
                                onChange={e => setNewPlan({ ...newPlan, dailyReduction: e.target.value })} 
                                min="0"
                                step="0.1"
                                placeholder="0.5"
                              />
                              <small className="form-text text-muted">Số điếu giảm mỗi ngày (có thể để 0)</small>
                            </div>
                          </div>

                          <div className="mb-3">
                            <label className="form-label">Chi tiết kế hoạch *</label>
                            <textarea 
                              className="form-control" 
                              rows="4"
                              value={newPlan.planDetail} 
                              onChange={e => setNewPlan({ ...newPlan, planDetail: e.target.value })} 
                              placeholder="Mô tả chi tiết về kế hoạch cai thuốc của bạn..."
                              required 
                            />
                            <small className="form-text text-muted">
                              Ví dụ: &quot;Tuần 1: Giảm từ 20 xuống 15 điếu/ngày. Tuần 2: Giảm xuống 10 điếu/ngày...&quot;
                            </small>
                          </div>

                          <div className="d-flex gap-2">
                            <button type="submit" className="btn btn-primary">
                              <i className="fas fa-plus me-2"></i>Tạo kế hoạch
                            </button>
                            <button 
                              type="button" 
                              className="btn btn-secondary" 
                              onClick={() => {
                                setShowCreateForm(false);
                                setNewPlan({
                                  startDate: '',
                                  targetDate: '',
                                  planDetail: '',
                                  initialCigarettes: 0,
                                  dailyReduction: 0
                                });
                              }}
                            >
                              Hủy
                            </button>
                          </div>
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

          {/* Kế hoạch do coach đề xuất */}
          {loadingCoachPlans ? (
            <div>Đang tải kế hoạch do coach đề xuất...</div>
          ) : coachPlans && coachPlans.length > 0 && (
            <div className="col-md-6 mb-4">
              <div className="card shadow-sm mb-4">
                <div className="card-header bg-info text-white fw-bold">Kế hoạch cai thuốc do huấn luyện viên đề xuất</div>
                <div className="card-body">
                  {coachPlans.map(plan => (
                    <div key={plan.Id} className="mb-3 p-2 border rounded">
                      <h6>{plan.Title}</h6>
                      <div><b>Mô tả:</b> {plan.Description}</div>
                      <div><b>Chi tiết:</b> <pre style={{whiteSpace:'pre-line'}}>{plan.PlanDetail}</pre></div>
                      <div><b>Ngày bắt đầu:</b> {plan.StartDate}</div>
                      <div><b>Ngày kết thúc:</b> {plan.TargetDate}</div>
                      <div className="mt-2">
                        <button
                          className="btn btn-success me-2"
                          onClick={async () => {
                            await acceptCoachPlan(plan.Id);
                            setSuccess('Đã xác nhận kế hoạch!');
                            // Reload danh sách kế hoạch coach đề xuất
                            setLoadingCoachPlans(true);
                            try {
                              const plans = await getCoachSuggestedPlans();
                              setCoachPlans(plans || []);
                              // Tách các kế hoạch đã xác nhận
                              setAcceptedCoachPlans((plans || []).filter(p => p.Status === 'accepted'));
                            } catch (e) {
                              setCoachPlans([]);
                              setAcceptedCoachPlans([]);
                            } finally {
                              setLoadingCoachPlans(false);
                            }
                          }}
                        >
                          Xác nhận
                        </button>
                        <button
                          className="btn btn-outline-danger"
                          onClick={async () => {
                            await rejectCoachPlan(plan.Id);
                            setSuccess('Đã từ chối kế hoạch!');
                            // Reload danh sách kế hoạch coach đề xuất
                            setLoadingCoachPlans(true);
                            try {
                              const plans = await getCoachSuggestedPlans();
                              setCoachPlans(plans || []);
                              // Tách các kế hoạch đã xác nhận
                              setAcceptedCoachPlans((plans || []).filter(p => p.Status === 'accepted'));
                            } catch (e) {
                              setCoachPlans([]);
                              setAcceptedCoachPlans([]);
                            } finally {
                              setLoadingCoachPlans(false);
                            }
                          }}
                        >
                          Hủy
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Nhật ký hàng ngày (luôn luôn hiển thị) */}
          <div className="col-md-6 mb-4">
            <div className="card shadow-sm h-100">
              <div className="card-header bg-success text-white fw-bold">Nhật ký hàng ngày</div>
              <div className="card-body">
                {/* Dropdown chọn kế hoạch */}
                <div className="mb-3">
                  <label className="form-label">Chọn kế hoạch để nhập nhật ký</label>
                  <select
                    className="form-select"
                    value={selectedLogPlan ? (selectedLogPlan.type === 'system' ? `system-${userData.quitPlan?.id}` : `coach-${latestCoachPlan?.Id}`) : ''}
                    onChange={e => {
                      const val = e.target.value;
                      if (val.startsWith('system-')) {
                        setSelectedLogPlan({ type: 'system', plan: userData.quitPlan });
                      } else if (val.startsWith('coach-')) {
                        setSelectedLogPlan({ type: 'coach', plan: latestCoachPlan });
                      }
                    }}
                  >
                    {userData.quitPlan && (
                      <option value={`system-${userData.quitPlan.id}`}>Kế hoạch hệ thống/tự tạo</option>
                    )}
                    {latestCoachPlan && (
                      <option value={`coach-${latestCoachPlan.Id}`}>Kế hoạch coach: {latestCoachPlan.Title}</option>
                    )}
                  </select>
                </div>
                <DailyLogSection 
                  dailyLog={userData.smokingStatus.dailyLog}
                  onUpdateLog={handleDailyLogUpdate}
                />
                {userData.smokingStatus.dailyLog && typeof userData.smokingStatus.dailyLog.savedMoney !== 'undefined' && (
                  <div className="alert alert-info mt-3">
                    💰 Tiền tiết kiệm hôm nay: <b>{userData.smokingStatus.dailyLog.savedMoney?.toLocaleString('vi-VN')} VNĐ</b>
                  </div>
                )}
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
                <div className="btn-group btn-group-sm" role="group">
                  <button 
                    className="btn btn-light"
                    onClick={() => setCurrentWeek(Math.max(1, currentWeek - 1))}
                    disabled={currentWeek === 1}
                  >
                    <i className="fas fa-chevron-left"></i>
                  </button>
                  <div className="dropdown">
                    <button 
                      className="btn btn-light" 
                      type="button"
                      onClick={(e) => {
                        const dropdownMenu = e.currentTarget.nextElementSibling;
                        dropdownMenu.classList.toggle('show');
                      }}
                    >
                      Tuần {currentWeek} <i className="fas fa-chevron-down ms-1"></i>
                    </button>
                    <div className="dropdown-menu" style={{maxHeight: '200px', overflowY: 'auto'}}>
                      {Array.from({length: getTotalWeeks()}, (_, i) => (
                        <button 
                          key={i + 1}
                          className="dropdown-item" 
                          onClick={() => {
                            setCurrentWeek(i + 1);
                            // Đóng dropdown sau khi chọn
                            document.querySelector('.dropdown-menu').classList.remove('show');
                          }}
                        >
                          Tuần {i + 1}
                        </button>
                      ))}
                    </div>
                  </div>
                  <button 
                    className="btn btn-light"
                    onClick={() => setCurrentWeek(Math.min(getTotalWeeks(), currentWeek + 1))}
                    disabled={currentWeek === getTotalWeeks()}
                  >
                    <i className="fas fa-chevron-right"></i>
                  </button>
                </div>
              </div>
              <div className="card-body">
                {(() => {
                  // Lấy dữ liệu của tuần từ kế hoạch cai thuốc
                  const weekData = getWeekDataFromPlan(currentWeek);
                  const weekDataArr = Array.isArray(weekData) ? weekData : [];
                  const weekDataDataArr = Array.isArray(weekDataArr.data) ? weekDataArr.data : weekDataArr;
                  // Tính toán thống kê
                  const totalCigarettes = weekDataDataArr.reduce ? weekDataDataArr.reduce((sum, entry) => sum + (entry.cigarettes || 0), 0) : 0;
                  const averagePerDay = weekDataDataArr.length > 0 ? (totalCigarettes / weekDataDataArr.length).toFixed(1) : 0;
                  const daysWithoutSmoking = weekDataDataArr.filter ? weekDataDataArr.filter(entry => (entry.cigarettes || 0) === 0).length : 0;
                  const currentStreak = calculateCurrentStreak(weekDataDataArr);

                  return (
                    <div>
                     

                      {/* Chart */}
                      {weekDataArr.length > 0 ? (
                        <Line
                          data={{
                            labels: weekDataArr.map(entry => 
                              new Date(entry.date).toLocaleDateString('vi-VN', { 
                                weekday: 'short',
                                day: '2-digit',
                                month: '2-digit'
                              })
                            ),
                            datasets: [
                              {
                                label: 'Số điếu hút',
                                data: weekDataArr.map(entry => entry.cigarettes || 0),
                                borderColor: 'rgb(220, 53, 69)',
                                backgroundColor: 'rgba(220, 53, 69, 0.1)',
                                tension: 0.4,
                                fill: true,
                              }
                            ],
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
                                text: `Biểu đồ hút thuốc - Tuần ${currentWeek}`,
                              },
                              tooltip: {
                                callbacks: {
                                  afterBody: function(context) {
                                    const dataIndex = context[0].dataIndex;
                                    const cigarettes = weekDataArr[dataIndex]?.cigarettes || 0;
                                    return `\nSố điếu: ${cigarettes}`;
                                  }
                                }
                              }
                            },
                            scales: {
                              x: {
                                title: {
                                  display: true,
                                  text: 'Ngày trong tuần',
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
                              }
                            },
                          }}
                        />
                      ) : (
                        <div className="text-center py-5">
                          <i className="fas fa-chart-line fa-3x text-muted mb-3"></i>
                          <p className="text-secondary">Chưa có dữ liệu cho tuần này.</p>
                          <p className="text-muted small">Hãy cập nhật nhật ký hàng ngày để theo dõi tiến độ của bạn!</p>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        </div> {/* End of third row (Chart & Achievements) */}       
      </div>
    </div>
  );
};

export default MyProgressPage;