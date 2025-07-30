import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "../style/MyProgressPage.scss";

import { addDailyLog, saveUserSuggestedQuitPlan } from "../services/extraService";
import DailyLogSection from "../components/DailyLogSection";
import QuitPlanStage from "../components/QuitPlanStage";
import { quitPlanAPI } from "../services/api";
import PlanActions from "../components/PlanActions";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { Modal, Button } from "react-bootstrap";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
);

// Thêm service lấy kế hoạch do coach đề xuất
const getCoachSuggestedPlans = async () => {
  const token = localStorage.getItem("token");
  const res = await axios.get(
    "http://localhost:5000/api/auth/coach-suggested-plans",
    {
      headers: { Authorization: `Bearer ${token}` },
    },
  );
  return res.data.plans;
};
const acceptCoachPlan = async (planId) => {
  const token = localStorage.getItem("token");
  return axios.post(
    "http://localhost:5000/api/auth/accept-coach-plan",
    { planId },
    {
      headers: { Authorization: `Bearer ${token}` },
    },
  );
};
const rejectCoachPlan = async (planId) => {
  const token = localStorage.getItem("token");
  return axios.post(
    "http://localhost:5000/api/auth/reject-coach-plan",
    { planId },
    {
      headers: { Authorization: `Bearer ${token}` },
    },
  );
};

const MyProgressPage = () => {
  const [currentDate, setCurrentDate] = useState(
    new Date().toLocaleDateString("vi-VN", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
  );

  const [logDate, setLogDate] = useState(new Date().toISOString().slice(0, 10));

  const [userData, setUserData] = useState({
    username: "",
    email: "",
    phoneNumber: "",
    address: "",
    smokingStatus: {
      cigarettesPerDay: 0,
      costPerPack: 0,
      smokingFrequency: "",
      healthStatus: "",
      cigaretteType: "",
      customCigaretteType: "",
      quitReason: "",
      dailyLog: {
        cigarettes: 0,
        feeling: "",
        date: new Date().toISOString().slice(0, 10),
      },
    },
    quitPlan: null,
    achievements: [],
    role: "guest",
    isMemberVip: false,
    coach: null,
  });
  const [smokingHistory, setSmokingHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [notifications, setNotifications] = useState([]);
  const navigate = useNavigate();
  const [suggestedPlans, setSuggestedPlans] = useState([]);
  const [chartView, setChartView] = useState("plan");
  const [currentWeek, setCurrentWeek] = useState(1);
  const [selectedPlanId, setSelectedPlanId] = useState(null);
  const [showNewPlanForm, setShowNewPlanForm] = useState(false);
  const [newPlan, setNewPlan] = useState({
    startDate: "",
    targetDate: "",
    planDetail: "",
    initialCigarettes: 0,
    dailyReduction: 0,
    quitReason: "",
  });
  const [showDateForm, setShowDateForm] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [planDates, setPlanDates] = useState({ startDate: "", targetDate: "" });

  // State cho kế hoạch do coach đề xuất
  const [coachPlans, setCoachPlans] = useState([]);
  const [loadingCoachPlans, setLoadingCoachPlans] = useState(true);
  // Thêm state để lưu kế hoạch coach đã xác nhận
  const [acceptedCoachPlans, setAcceptedCoachPlans] = useState([]);
  const [selectedLogPlan, setSelectedLogPlan] = useState(null); // Kế hoạch được chọn để nhập nhật ký
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  // State cho form nhiều giai đoạn
  const [multiStagePlan, setMultiStagePlan] = useState({
    reason: "",
    startDate: "",
    endDate: "",
    stages: [
      {
        name: "",
        goal: "",
        initial: "",
        target: "",
        stageStart: "",
        stageEnd: "",
      },
    ],
  });
  const [planType, setPlanType] = useState("simple"); // 'simple' or 'staged'
  const [isDraft, setIsDraft] = useState(false);

  // New state for 6-stage quit plan
  const [stagedQuitPlan, setStagedQuitPlan] = useState(null);
  const [loadingStagedPlan, setLoadingStagedPlan] = useState(false);
  const formatDateString = (dateStr) => {
    const datePart = dateStr.split("T")[0];
    const [year, month, day] = datePart.split("-");
    return `${day}-${month}-${year}`;
  };
  useEffect(() => {
    (async () => {
      setLoadingCoachPlans(true);
      try {
        const plans = await getCoachSuggestedPlans();
        setCoachPlans(plans || []);
        // Tách các kế hoạch đã xác nhận
        setAcceptedCoachPlans(
          (plans || []).filter((p) => p.Status === "accepted"),
        );
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
    if (userStr && userStr !== "undefined") {
      user = JSON.parse(userStr);
    }
  } catch (error) {
    console.error("Error parsing user from localStorage:", error);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
  }

  useEffect(() => {
    // Nếu chế độ xem là 'plan' nhưng không có kế hoạch, chuyển sang 'daily'
    if (chartView === "plan" && !userData.quitPlan) {
      setChartView("daily");
    }
  }, [userData.quitPlan, chartView]);

  // Lấy kế hoạch coach đã xác nhận mới nhất
  const latestCoachPlan =
    acceptedCoachPlans.length > 0
      ? acceptedCoachPlans.reduce((a, b) =>
          new Date(a.CreatedAt || a.createdAt) >
          new Date(b.CreatedAt || b.createdAt)
            ? a
            : b,
        )
      : null;

  // Khi userData.quitPlan hoặc latestCoachPlan thay đổi, chọn mặc định kế hoạch nhập nhật ký
  useEffect(() => {
    // Priority: Coach > Custom > Suggested > Staged
    if (latestCoachPlan) {
      setSelectedLogPlan({ type: "coach", plan: latestCoachPlan });
    } else if (userData.quitPlan) {
      setSelectedLogPlan({ type: "system", plan: userData.quitPlan });
    } else if (userData.currentUserSuggestedPlan) {
      setSelectedLogPlan({
        type: "suggested",
        plan: userData.currentUserSuggestedPlan,
      });
    } else if (stagedQuitPlan) {
      setSelectedLogPlan({ type: "staged", plan: stagedQuitPlan });
    } else {
      setSelectedLogPlan(null);
    }
  }, [
    userData.quitPlan,
    latestCoachPlan,
    userData.currentUserSuggestedPlan,
    stagedQuitPlan,
  ]);

  const fetchUserData = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      // Fetch user profile
      const profileResponse = await axios.get(
        "http://localhost:5000/api/auth/profile",
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      console.log(
        "MyProgressPage - Raw User Profile Response:",
        profileResponse.data,
      ); // DEBUG: Log raw data

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
        smokingFrequency: fetchedUserData.smokingStatus.smokingFrequency || "",
        healthStatus: fetchedUserData.smokingStatus.healthStatus || "",
        cigaretteType: fetchedUserData.smokingStatus.cigaretteType || "",
        customCigaretteType:
          fetchedUserData.smokingStatus.customCigaretteType || "",
        quitReason: fetchedUserData.smokingStatus.quitReason || "",
        dailyLog: fetchedUserData.smokingStatus.dailyLog || {},
      };

      // Explicitly set default values for dailyLog properties
      fetchedUserData.smokingStatus.dailyLog = {
        ...fetchedUserData.smokingStatus.dailyLog,
        cigarettes: fetchedUserData.smokingStatus.dailyLog.cigarettes || 0,
        feeling: fetchedUserData.smokingStatus.dailyLog.feeling || "",
      };

      // Fetch custom quit plan from QuitPlans table if available
      try {
        const customQuitPlanResponse = await axios.get(
          "http://localhost:5000/api/auth/custom-quit-plan",
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        if (customQuitPlanResponse.data.quitPlan) {
          fetchedUserData.quitPlan = {
            id: customQuitPlanResponse.data.quitPlan.id || 0,
            startDate: customQuitPlanResponse.data.quitPlan.startDate || "",
            targetDate: customQuitPlanResponse.data.quitPlan.targetDate || "",
            initialCigarettes:
              customQuitPlanResponse.data.quitPlan.initialCigarettes || 0,
            dailyReduction:
              customQuitPlanResponse.data.quitPlan.dailyReduction || 0,
            currentProgress: 0,
            planDetail: customQuitPlanResponse.data.quitPlan.planDetail || "",
            createdAt: customQuitPlanResponse.data.quitPlan.createdAt || null,
            planSource: "custom",
            Status: customQuitPlanResponse.data.quitPlan.Status, // Add Status field
            status: customQuitPlanResponse.data.quitPlan.status, // Add status field
          };
        } else {
          // If no custom plan, try the old quit-plan endpoint
          try {
            const quitPlanResponse = await axios.get(
              "http://localhost:5000/api/auth/quit-plan",
              {
                headers: { Authorization: `Bearer ${token}` },
              },
            );
            fetchedUserData.quitPlan = {
              id: quitPlanResponse.data.quitPlan.id || 0,
              startDate: quitPlanResponse.data.quitPlan.startDate || "",
              targetDate: quitPlanResponse.data.quitPlan.targetDate || "",
              initialCigarettes:
                quitPlanResponse.data.quitPlan.initialCigarettes || 0,
              dailyReduction:
                quitPlanResponse.data.quitPlan.dailyReduction || 0,
              currentProgress:
                quitPlanResponse.data.quitPlan.currentProgress || 0,
              planDetail: quitPlanResponse.data.quitPlan.planDetail || "",
              createdAt: quitPlanResponse.data.quitPlan.createdAt || null,
            };
          } catch (oldQuitPlanError) {
            if (
              oldQuitPlanError.response &&
              oldQuitPlanError.response.status !== 404
            ) {
              console.error(
                "Lỗi khi tải kế hoạch cai thuốc cũ:",
                oldQuitPlanError,
              );
            }
            fetchedUserData.quitPlan = null;
          }
        }
      } catch (customQuitPlanError) {
        // It's okay if no custom quit plan exists (404), log other errors
        if (
          customQuitPlanError.response &&
          customQuitPlanError.response.status !== 404
        ) {
          console.error(
            "Lỗi khi tải kế hoạch cai thuốc tự tạo:",
            customQuitPlanError,
          );
        }
        fetchedUserData.quitPlan = null; // Ensure it's null if not found or error
      }

      // Fetch user badges
      try {
        const badgesResponse = await axios.get(
          "http://localhost:5000/api/auth/badges",
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        fetchedUserData.achievements = badgesResponse.data.badges || [];
      } catch (badgesError) {
        console.error("Lỗi khi tải huy hiệu:", badgesError);
        fetchedUserData.achievements = [];
      }

      // Fetch smoking progress history
      try {
        const historyResponse = await axios.get(
          "http://localhost:5000/api/auth/progress/history",
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        setSmokingHistory(historyResponse.data.history || []);
      } catch (historyError) {
        console.error("Lỗi khi tải lịch sử hút thuốc:", historyError);
        setSmokingHistory([]);
      }

      if (profileResponse.data.currentUserSuggestedPlan) {
        setUserData((prev) => ({
          ...prev,
          currentUserSuggestedPlan:
            profileResponse.data.currentUserSuggestedPlan,
        }));
      }

      setUserData(fetchedUserData);
      console.log(
        "MyProgressPage - fetchedUserData after setState:",
        fetchedUserData,
      );
    } catch (error) {
      console.error("Lỗi khi tải thông tin người dùng:", error);
      console.error("Error details:", error.response?.data || error.message);
      setError("Không thể tải thông tin người dùng. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  // Fetch staged quit plan data
  const fetchStagedQuitPlan = useCallback(async () => {
    try {
      setLoadingStagedPlan(true);
      const token = localStorage.getItem("token");
      const response = await axios.get(
        "http://localhost:5000/api/auth/user-quit-plan",
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      setStagedQuitPlan(response.data);
    } catch (error) {
      console.error("Error fetching staged quit plan:", error);
      if (error.response?.status !== 404) {
        // Only set error if it's not a 404 (plan not found)
        setError("Không thể tải kế hoạch 6 giai đoạn.");
      }
      setStagedQuitPlan(null);
    } finally {
      setLoadingStagedPlan(false);
    }
  }, []);

  useEffect(() => {
    fetchStagedQuitPlan();
  }, [fetchStagedQuitPlan]);

  useEffect(() => {
    const fetchSuggestedPlans = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(
          "http://localhost:5000/api/auth/quit-plan/suggested",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setSuggestedPlans(res.data);
      } catch (err) {
        setSuggestedPlans([]);
      }
    };
    
    fetchSuggestedPlans();
  }, []);

  useEffect(() => {
    const fetchSuggestedPlans = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(
          "http://localhost:5000/api/auth/quit-plan/suggested",
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
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
    setUserData((prev) => ({ ...prev, smokingStatus: updatedSmokingStatus }));

    try {
      const token = localStorage.getItem("token");
      // Gửi toàn bộ đối tượng đã cập nhật
      await axios.put(
        "http://localhost:5000/api/auth/smoking-status",
        updatedSmokingStatus,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      addNotification("Cập nhật thành công!", "success");
    } catch (error) {
      addNotification(
        error.response?.data?.message || "Cập nhật thất bại.",
        "error",
      );
    }
  };

  const handleUpdateDailyLog = async () => {
    try {
      let payload = {
        cigarettes: userData.smokingStatus.dailyLog.cigarettes,
        feeling: userData.smokingStatus.dailyLog.feeling,
        logDate: new Date().toISOString().slice(0, 10),
      };
      if (userData.currentUserSuggestedPlan) {
        payload.suggestedPlanId = userData.currentUserSuggestedPlan.id;
      } else if (userData.quitPlan && userData.quitPlan.id) {
        payload.planId = userData.quitPlan.id;
      }
      const response = await addDailyLog(payload);
      addNotification("Nhật ký đã được cập nhật!", "success");
      if (response.newBadges && response.newBadges.length > 0) {
        setUserData((prev) => ({
          ...prev,
          achievements: [...prev.achievements, ...response.newBadges],
        }));
        addNotification(
          `Bạn đã nhận được ${response.newBadges.length} huy hiệu mới!`,
          "success",
        );
      }
      await fetchUserData();
      await fetchSmokingHistory();
    } catch (error) {
      addNotification(error.message || "Cập nhật nhật ký thất bại.", "error");
    }
  };

  const handleCloseSnackbar = () => {
    setError("");
    setSuccess("");
  };

  // Add notification function
  const addNotification = (message, type = "success") => {
    const id = Date.now();
    const notification = { id, message, type };
    setNotifications((prev) => [...prev, notification]);

    // Auto remove after 4 seconds
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 4000);
  };

  // Remove notification manually
  const removeNotification = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const handleJoinQuitPlan = async () => {
    try {
      const token = localStorage.getItem("token");
      // Gửi yêu cầu POST để tạo kế hoạch cai thuốc mặc định
      await axios.post(
        "http://localhost:5000/api/auth/quit-plan",
        {
          startDate: new Date().toISOString().slice(0, 10),
          targetDate: new Date(new Date().setMonth(new Date().getMonth() + 1))
            .toISOString()
            .slice(0, 10), // 1 month from now
          planType: "suggested",
          initialCigarettes: userData.smokingStatus.cigarettesPerDay || 0,
          dailyReduction: 0, // Default to 0, user can change later
          planDetail: "Kế hoạch cai thuốc mặc định do hệ thống gợi ý",
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      addNotification("Bạn đã tham gia kế hoạch cai thuốc!", "success");
      fetchUserData();
    } catch (error) {
      addNotification(
        error.response?.data?.message || "Tham gia kế hoạch thất bại.",
        "error",
      );
    }
  };

  const handleUpdateQuitPlan = async () => {
    try {
      const token = localStorage.getItem("token");
      // Gửi yêu cầu POST để cập nhật kế hoạch cai thuốc
      await axios.post(
        "http://localhost:5000/api/auth/quit-plan",
        {
          startDate: userData.quitPlan?.startDate || "",
          targetDate: userData.quitPlan?.targetDate || "",
          planType: userData.quitPlan?.planType || "custom",
          initialCigarettes: Number(userData.quitPlan?.initialCigarettes || 0), // Ensure it's a number
          dailyReduction: Number(userData.quitPlan?.dailyReduction || 0),
          planDetail: userData.quitPlan?.planDetail || "",
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      addNotification("Kế hoạch cai thuốc đã được cập nhật!", "success");
      fetchUserData();
    } catch (error) {
      addNotification(
        error.response?.data?.message || "Cập nhật kế hoạch thất bại.",
        "error",
      );
    }
  };

  const handleAddMilestone = async () => {
    try {
      const token = localStorage.getItem("token");
      const newMilestoneTitle = prompt("Nhập tiêu đề mốc quan trọng mới:");
      if (newMilestoneTitle) {
        await axios.post(
          "http://localhost:5000/api/auth/quit-plan/milestones",
          { title: newMilestoneTitle },
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        addNotification("Mốc quan trọng đã được thêm!", "success");
        fetchUserData();
      }
    } catch (error) {
      addNotification(
        error.response?.data?.message || "Thêm mốc quan trọng thất bại.",
        "error",
      );
    }
  };

  // Helper functions for chart calculations
  const calculateCurrentStreak = (history) => {
    if (!history || history.length === 0) return 0;

    const sortedHistory = [...history].sort(
      (a, b) => new Date(b.Date) - new Date(a.Date),
    );
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

    const sortedHistory = [...history].sort(
      (a, b) => new Date(a.Date) - new Date(b.Date),
    );
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

    history.forEach((entry) => {
      const date = new Date(entry.Date);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay()); // Start of week (Sunday)
      const weekKey = weekStart.toISOString().slice(0, 10);

      if (!weeklyData[weekKey]) {
        weeklyData[weekKey] = {
          weekNumber: Math.ceil(
            (date.getTime() - new Date(date.getFullYear(), 0, 1).getTime()) /
              (1000 * 60 * 60 * 24 * 7),
          ),
          totalCigarettes: 0,
          totalMoneySaved: 0,
          days: 0,
        };
      }

      weeklyData[weekKey].totalCigarettes += entry.Cigarettes || 0;
      weeklyData[weekKey].days++;
    });

    // Calculate money saved for each week
    Object.values(weeklyData).forEach((week) => {
      const costPerCigarette = userData.smokingStatus.costPerPack
        ? userData.smokingStatus.costPerPack / 20
        : 0;
      week.totalMoneySaved = week.totalCigarettes * costPerCigarette;
    });

    return Object.values(weeklyData).sort(
      (a, b) => a.weekNumber - b.weekNumber,
    );
  };

  const groupByMonth = (history) => {
    const monthlyData = {};

    history.forEach((entry) => {
      const date = new Date(entry.Date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          monthLabel: date.toLocaleDateString("vi-VN", {
            year: "numeric",
            month: "long",
          }),
          totalCigarettes: 0,
          totalMoneySaved: 0,
          days: 0,
        };
      }

      monthlyData[monthKey].totalCigarettes += entry.Cigarettes || 0;
      monthlyData[monthKey].days++;
    });

    // Calculate money saved for each month
    Object.values(monthlyData).forEach((month) => {
      const costPerCigarette = userData.smokingStatus.costPerPack
        ? userData.smokingStatus.costPerPack / 20
        : 0;
      month.totalMoneySaved = month.totalCigarettes * costPerCigarette;
    });

    return Object.values(monthlyData).sort((a, b) => {
      const [yearA, monthA] = Object.keys(monthlyData)
        .find((key) => monthlyData[key] === a)
        .split("-");
      const [yearB, monthB] = Object.keys(monthlyData)
        .find((key) => monthlyData[key] === b)
        .split("-");
      return new Date(yearA, monthA - 1) - new Date(yearB, monthB - 1);
    });
  };

  // Helper functions for quit plan weekly view
  const getQuitPlanWeeks = () => {
    if (
      !userData.quitPlan ||
      !userData.quitPlan.startDate ||
      !userData.quitPlan.targetDate
    ) {
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
        label: `Tuần ${week} (${weekStartDate.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })} - ${weekEndDate.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })})`,
      });
    }

    return weeks;
  };

  const getWeekData = (weekInfo) => {
    if (!weekInfo || !smokingHistory.length)
      return { labels: [], data: [], targetData: [], moneySavedData: [] };

    const labels = [];
    const data = [];
    const targetData = [];
    const moneySavedData = [];

    // Generate data for each day in the week
    for (
      let d = new Date(weekInfo.startDate);
      d <= weekInfo.endDate;
      d.setDate(d.getDate() + 1)
    ) {
      const dateStr = d.toISOString().slice(0, 10);
      labels.push(
        d.toLocaleDateString("vi-VN", {
          weekday: "short",
          day: "2-digit",
          month: "2-digit",
        }),
      );

      // Find smoking data for this date
      const entry = smokingHistory.find((e) => e.Date.slice(0, 10) === dateStr);
      const cigarettes = entry ? entry.Cigarettes : 0;
      data.push(cigarettes);

      // Calculate money saved
      const costPerCigarette = userData.smokingStatus.costPerPack
        ? userData.smokingStatus.costPerPack / 20
        : 0;
      moneySavedData.push(cigarettes * costPerCigarette);

      // Calculate target based on quit plan
      if (userData.quitPlan && userData.quitPlan.dailyReduction > 0) {
        const daysPassed = Math.floor(
          (d.getTime() - new Date(userData.quitPlan.startDate).getTime()) /
            (1000 * 60 * 60 * 24),
        );
        targetData.push(
          Math.max(
            0,
            userData.quitPlan.initialCigarettes -
              userData.quitPlan.dailyReduction * daysPassed,
          ),
        );
      }
    }

    return { labels, data, targetData, moneySavedData };
  };

  const getCurrentWeekInfo = () => {
    const weeks = getQuitPlanWeeks();
    return weeks.find((week) => week.weekNumber === currentWeek) || null;
  };

  const getWeekStatistics = (weekInfo) => {
    if (!weekInfo)
      return {
        totalCigarettes: 0,
        averagePerDay: 0,
        daysWithoutSmoking: 0,
        moneySaved: 0,
      };

    const weekData = getWeekData(weekInfo);
    const dataArr = Array.isArray(weekData.data) ? weekData.data : [];
    const moneyArr = Array.isArray(weekData.moneySavedData)
      ? weekData.moneySavedData
      : [];
    const totalCigarettes = dataArr.reduce((sum, val) => sum + val, 0);
    const averagePerDay =
      dataArr.length > 0 ? (totalCigarettes / dataArr.length).toFixed(1) : 0;
    const daysWithoutSmoking = dataArr.filter((val) => val === 0).length;
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
      const token = localStorage.getItem("token");
      const historyResponse = await axios.get(
        "http://localhost:5000/api/auth/progress/history",
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      setSmokingHistory(historyResponse.data.history || []);
    } catch (historyError) {
      setSmokingHistory([]);
    }
  }, []);

  const getTotalWeeks = () => {
    // Kiểm tra kế hoạch tự tạo trước
    if (
      userData.quitPlan &&
      userData.quitPlan.startDate &&
      userData.quitPlan.targetDate
    ) {
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
    if (
      userData.quitPlan &&
      userData.quitPlan.startDate &&
      userData.quitPlan.targetDate
    ) {
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
      const logEntry = smokingHistory.find(
        (entry) =>
          new Date(entry.Date).toISOString().slice(0, 10) ===
          currentDate.toISOString().slice(0, 10),
      );

      weekData.push({
        date: currentDate,
        cigarettes: logEntry ? logEntry.Cigarettes : 0,
      });
    }

    return weekData;
  };

  // Sửa hàm handleDailyLogUpdate để truyền đúng planId/suggestedPlanId/coachSuggestedPlanId
  const handleDailyLogUpdate = async (updatedLog) => {
    try {
      let payload = {
        cigarettes: updatedLog.cigarettes || 0,
        feeling: updatedLog.feeling || "",
        logDate: updatedLog.date || new Date().toISOString().slice(0, 10),
      };
      if (selectedLogPlan) {
        if (
          selectedLogPlan.type === "system" ||
          selectedLogPlan.type === "staged"
        ) {
          payload.planId = selectedLogPlan.plan.id || selectedLogPlan.plan.Id;
          delete payload.suggestedPlanId;
          delete payload.coachSuggestedPlanId;
        } else if (selectedLogPlan.type === "coach") {
          payload.coachSuggestedPlanId =
            selectedLogPlan.plan.Id || selectedLogPlan.plan.id;
          delete payload.planId;
          delete payload.suggestedPlanId;
        } else if (selectedLogPlan.type === "suggested") {
          payload.suggestedPlanId =
            selectedLogPlan.plan.id || selectedLogPlan.plan.Id;
          delete payload.planId;
          delete payload.coachSuggestedPlanId;
        }
      }
      // ... gửi payload như cũ
      const response = await addDailyLog(payload);
      addNotification("Cập nhật nhật ký thành công!", "success");
      setUserData((prev) => ({
        ...prev,
        smokingStatus: {
          ...prev.smokingStatus,
          dailyLog: {
            cigarettes: updatedLog.cigarettes || 0,
            feeling: updatedLog.feeling || "",
            date: updatedLog.date || new Date().toISOString().slice(0, 10),
          },
        },
      }));
      if (response.newBadges && response.newBadges.length > 0) {
        setUserData((prev) => ({
          ...prev,
          achievements: [...prev.achievements, ...response.newBadges],
        }));
        addNotification(
          `Cập nhật nhật ký thành công! Bạn đã nhận được ${response.newBadges.length} huy hiệu mới!`,
          "success",
        );
      }
      await fetchUserData();
      await fetchSmokingHistory();
    } catch (error) {
      addNotification(error.message || "Cập nhật nhật ký thất bại.", "error");
    }
  };

  const handleDeletePlan = async () => {
    setShowDeleteModal(true);
  };

  const confirmDeletePlan = async () => {
    setShowDeleteModal(false);
    try {
      await quitPlanAPI.deletePlan();
      addNotification("Đã hủy kế hoạch!", "success");
      // Refetch both user data and staged plan data to update the entire UI
      fetchUserData();
      fetchStagedQuitPlan();
    } catch (error) {
      addNotification(
        error.response?.data?.message || "Hủy kế hoạch thất bại.",
        "error",
      );
    }
  };

  // Handler functions for staged quit plan
  const handleStageComplete = useCallback(
    async (userStageId) => {
      try {
        // Refetch stagedQuitPlan from backend to ensure UI reflects the latest data
        await fetchStagedQuitPlan();
        addNotification("Giai đoạn đã được hoàn thành!", "success");

        // Optional: Could also update stage status locally if needed:
        // setStagedQuitPlan(prev => ({
        //   ...prev,
        //   stages: prev.stages.map(stage =>
        //     stage.Id === userStageId ? { ...stage, Status: 'Completed' } : stage
        //   )
        // }));
      } catch (error) {
        console.error("Error refreshing staged quit plan:", error);
        addNotification("Có lỗi xảy ra khi làm mới kế hoạch.", "error");
      }
    },
    [fetchStagedQuitPlan],
  );

  // Archive plan function
  const archivePlan = async (planId) => {
    try {
      await quitPlanAPI.archivePlan(planId);
      addNotification("Kế hoạch đã được lưu trữ!", "success");
      fetchUserData();
      fetchStagedQuitPlan();
    } catch (error) {
      addNotification(
        error.response?.data?.message || "Lưu trữ kế hoạch thất bại.",
        "error",
      );
    }
  };

  // Effect to check for plan completion when stage data changes
  useEffect(() => {
    console.log(
      "Completion useEffect triggered with stagedQuitPlan:",
      stagedQuitPlan,
    );

    // Explicit guards as specified in the task
    if (
      stagedQuitPlan &&
      stagedQuitPlan.stages &&
      stagedQuitPlan.stages.every((s) => s.Status === "Completed") &&
      stagedQuitPlan.Status !== "Completed"
    ) {
      const planId =
        stagedQuitPlan.Id || stagedQuitPlan.id || stagedQuitPlan._id;
      console.log("Marking staged plan complete", planId);
      console.log("All stages completed, plan completion hook firing!");

      const completePlanAsync = async () => {
        try {
          await quitPlanAPI.completePlan(planId);
          console.log("Plan completion API call successful");
          fetchUserData(); // or setStagedQuitPlan({...stagedQuitPlan, Status:'Completed'})
          addNotification(
            "Kế hoạch đã được đánh dấu là hoàn thành!",
            "success",
          );
        } catch (error) {
          console.error("Error marking plan as complete:", error);
          addNotification(
            "Không thể đánh dấu kế hoạch là hoàn thành.",
            "error",
          );
        }
      };

      completePlanAsync();
    } else {
      console.log("Completion conditions not met:", {
        hasStagedQuitPlan: !!stagedQuitPlan,
        hasStages: !!(stagedQuitPlan && stagedQuitPlan.stages),
        allStagesCompleted:
          stagedQuitPlan && stagedQuitPlan.stages
            ? stagedQuitPlan.stages.every((s) => s.Status === "Completed")
            : false,
        planNotCompleted: stagedQuitPlan
          ? stagedQuitPlan.Status !== "Completed"
          : false,
        currentPlanStatus: stagedQuitPlan ? stagedQuitPlan.Status : "No plan",
        stageStatuses:
          stagedQuitPlan && stagedQuitPlan.stages
            ? stagedQuitPlan.stages.map((s) => ({
                stageId: s.Id || s.id,
                status: s.Status,
              }))
            : [],
      });
    }
  }, [stagedQuitPlan, fetchUserData]);

  if (loading) {
    return (
      <div className="my-progress-wrapper">
        <div
          className="d-flex justify-content-center align-items-center"
          style={{ minHeight: "60vh" }}
        >
          <div className="spinner-border text-success" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="d-flex"
      style={{ minHeight: "100vh", background: "#f8f9fa" }}
    >
      {/* Sidebar user */}
      <nav
        className="sidebar-user bg-dark text-white d-flex flex-column p-3"
        style={{ minWidth: 220, minHeight: "100vh" }}
      >
        <div className="sidebar-header mb-4 text-center">
          <i className="bi bi-person-circle fs-1 mb-2"></i>
          <div className="fw-bold">
            Xin chào, {userData.username || "Người dùng"}
          </div>
        </div>
        <ul className="nav nav-pills flex-column mb-auto">
          <li className="nav-item mb-2">
            <Link to="/" className="nav-link text-white">
              <i className="bi bi-house me-2"></i>Trang chủ
            </Link>
          </li>
          <li className="nav-item mb-2">
            <Link to="/my-progress" className="nav-link text-white active">
              <i className="bi bi-bar-chart-line me-2"></i>Nhật ký cai thuốc
            </Link>
          </li>
          <li className="nav-item mb-2">
            <Link to="/leaderboard" className="nav-link text-white">
              <i className="bi bi-trophy me-2"></i>Bảng xếp hạng
            </Link>
          </li>
          <li className="nav-item mb-2">
            <Link to="/achievements" className="nav-link text-white">
              <i className="bi bi-award me-2"></i>Thành tích
            </Link>
          </li>
          <li className="nav-item mb-2">
            <Link to="/booking" className="nav-link text-white">
              <i className="bi bi-calendar-check me-2"></i>Đặt lịch
            </Link>
          </li>
          <li className="nav-item mt-4">
            <button
              className="btn btn-outline-light w-100"
              onClick={() => {
                localStorage.clear();
                window.location.href = "/login";
              }}
            >
              <i className="bi bi-box-arrow-right me-2"></i>Đăng xuất
            </button>
          </li>
        </ul>
      </nav>
      {/* Main content */}
      <div className="flex-grow-1">
        <div className="my-progress-wrapper">
          <div className="my-progress-container">
            <h4 className="mb-3 fw-bold text-success">
              Quá trình cai thuốc của bạn
            </h4>
            <div className="row g-4">
              {/* Ô 1: Thông tin Cai thuốc */}
              <div className="col-12 col-md-6">
                <div className="card shadow-sm h-100">
                  <div className="card-header bg-success text-white fw-bold">
                    Thông tin Cai thuốc
                  </div>
                  <div className="card-body">
                    <div className="mb-3">
                      <label htmlFor="cigarettesPerDay" className="form-label">
                        Số điếu thuốc/ngày
                      </label>
                      <input
                        type="number"
                        className="form-control"
                        id="cigarettesPerDay"
                        value={userData.smokingStatus.cigarettesPerDay}
                        onChange={(e) =>
                          handleUpdateSmokingStatus(
                            "cigarettesPerDay",
                            Number(e.target.value),
                          )
                        }
                        min="0"
                      />
                    </div>
                    <div className="mb-3">
                      <label htmlFor="costPerPack" className="form-label">
                        Giá mỗi gói thuốc (VNĐ)
                      </label>
                      <input
                        type="number"
                        className="form-control"
                        id="costPerPack"
                        value={userData.smokingStatus.costPerPack}
                        onChange={(e) =>
                          handleUpdateSmokingStatus(
                            "costPerPack",
                            Number(e.target.value),
                          )
                        }
                        min="0"
                      />
                    </div>
                    <div className="mb-3">
                      <label htmlFor="smokingFrequency" className="form-label">
                        Tần suất hút thuốc
                      </label>
                      <select
                        className="form-select"
                        id="smokingFrequency"
                        value={userData.smokingStatus.smokingFrequency}
                        onChange={(e) =>
                          handleUpdateSmokingStatus(
                            "smokingFrequency",
                            e.target.value,
                          )
                        }
                      >
                        <option value="">Chọn tần suất</option>
                        <option value="daily">Hàng ngày</option>
                        <option value="weekly">Hàng tuần</option>
                        <option value="occasionally">Thỉnh thoảng</option>
                      </select>
                    </div>
                    <div className="mb-3">
                      <label htmlFor="healthStatus" className="form-label">
                        Tình trạng sức khỏe liên quan
                      </label>
                      <textarea
                        className="form-control"
                        id="healthStatus"
                        rows="3"
                        value={userData.smokingStatus.healthStatus}
                        onChange={(e) =>
                          handleUpdateSmokingStatus(
                            "healthStatus",
                            e.target.value,
                          )
                        }
                      ></textarea>
                    </div>
                    <div className="mb-3">
                      <label htmlFor="cigaretteType" className="form-label">
                        Loại thuốc lá
                      </label>
                      <select
                        className="form-select"
                        id="cigaretteType"
                        value={userData.smokingStatus.cigaretteType || ""}
                        onChange={(e) => {
                          if (e.target.value === "other") {
                            handleUpdateSmokingStatus("cigaretteType", "other");
                          } else {
                            handleUpdateSmokingStatus(
                              "cigaretteType",
                              e.target.value,
                            );
                            handleUpdateSmokingStatus(
                              "customCigaretteType",
                              "",
                            );
                          }
                        }}
                      >
                        <option value="">Chọn loại thuốc lá</option>
                        <option value="Thuốc lá 555">Thuốc lá 555</option>
                        <option value="Thuốc lá Richmond">
                          Thuốc lá Richmond
                        </option>
                        <option value="Thuốc lá Esse">Thuốc lá Esse</option>
                        <option value="Thuốc lá Craven">Thuốc lá Craven</option>
                        <option value="Thuốc lá Marlboro">
                          Thuốc lá Marlboro
                        </option>
                        <option value="Thuốc lá Camel">Thuốc lá Camel</option>
                        <option value="Thuốc lá SG bạc">Thuốc lá SG bạc</option>
                        <option value="Thuốc lá Jet">Thuốc lá Jet</option>
                        <option value="Thuốc lá Thăng Long">
                          Thuốc lá Thăng Long
                        </option>
                        <option value="Thuốc lá Hero">Thuốc lá Hero</option>
                        <option value="other">Khác</option>
                      </select>
                      {/* Nếu chọn Khác thì hiển thị ô nhập tự do */}
                      {userData.smokingStatus.cigaretteType === "other" && (
                        <input
                          type="text"
                          className="form-control mt-2"
                          placeholder="Nhập loại thuốc lá khác..."
                          value={
                            userData.smokingStatus.customCigaretteType || ""
                          }
                          onChange={(e) =>
                            handleUpdateSmokingStatus(
                              "customCigaretteType",
                              e.target.value,
                            )
                          }
                        />
                      )}
                    </div>
                    <div className="mb-3">
                      <label htmlFor="quitReason" className="form-label">
                        Lý do cai thuốc
                      </label>
                      <textarea
                        className="form-control"
                        id="quitReason"
                        rows="3"
                        value={userData.smokingStatus.quitReason}
                        onChange={(e) =>
                          handleUpdateSmokingStatus(
                            "quitReason",
                            e.target.value,
                          )
                        }
                      ></textarea>
                    </div>
                  </div>
                </div>
              </div>
              {/* Ô 2: Nhật ký hàng ngày */}
              <div className="col-12 col-md-6">
                <div className="card shadow-sm h-100">
                  <div className="card-header bg-success text-white fw-bold">
                    Nhật ký hàng ngày
                  </div>
                  <div className="card-body">
                    <div className="mb-3">
                      <label className="form-label fw-bold">
                        Kế hoạch áp dụng cho nhật ký
                      </label>
                      <div className="p-2 border rounded bg-light-subtle text-dark">
                        {selectedLogPlan && selectedLogPlan.plan ? (
                          <strong>
                            {(() => {
                              const { type, plan } = selectedLogPlan;
                              if (type === "system")
                                return `Kế hoạch tự tạo: ${plan.planDetail || plan.title || "Không có tên"}`;
                              if (type === "suggested")
                                return `Kế hoạch mẫu: ${plan.title || "Không có tên"}`;
                              if (type === "coach")
                                return `Kế hoạch coach: ${plan.Title || plan.title || "Không có tên"}`;
                              if (type === "staged")
                                return `Kế hoạch theo giai đoạn: ${plan.planName || "Không có tên"}`;
                              return "Không xác định";
                            })()}
                          </strong>
                        ) : (
                          <span className="text-muted">
                            Không có kế hoạch nào đang hoạt động.
                          </span>
                        )}
                      </div>
                    </div>
                    <DailyLogSection
                      dailyLog={userData.smokingStatus.dailyLog}
                      onUpdateLog={handleDailyLogUpdate}
                    />
                    {userData.smokingStatus.dailyLog &&
                      typeof userData.smokingStatus.dailyLog.savedMoney !==
                        "undefined" && (
                        <div className="alert alert-info mt-3">
                          💰 Tiền tiết kiệm hôm nay:{" "}
                          <b>
                            {userData.smokingStatus.dailyLog.savedMoney?.toLocaleString(
                              "vi-VN",
                            )}{" "}
                            VNĐ
                          </b>
                        </div>
                      )}
                  </div>
                </div>
              </div>
              {/* Ô 3: Kế hoạch cai thuốc của hệ thống/tự tạo */}
              <div className="col-12">
                <div className="card shadow-sm h-100">
                  <div className="card-header bg-success text-white fw-bold">
                    Kế hoạch cai thuốc của hệ thống/tự tạo
                  </div>
                  <div className="card-body">
                    {userData.quitPlan ? (
                      <div>
                        <h5>Kế hoạch cai thuốc tự tạo</h5>
                        <div>
                          <b>Chi tiết:</b> {userData.quitPlan.planDetail}
                        </div>
                        <div>
                          <b>Ngày bắt đầu:</b>{" "}
                          {formatDateString(userData.quitPlan.startDate)}
                        </div>
                        <div>
                          <b>Ngày kết thúc:</b>{" "}
                          {formatDateString(userData.quitPlan.targetDate)}
                        </div>
                        <div>
                          <b>Số điếu ban đầu:</b>{" "}
                          {userData.quitPlan.initialCigarettes}
                        </div>
                        <div>
                          <b>Giảm mỗi ngày:</b>{" "}
                          {userData.quitPlan.dailyReduction}
                        </div>
                        <div className="my-3">
                          <label className="fw-bold">Tiến độ hiện tại:</label>
                          {(() => {
                            // Check if plan is completed first
                            const planStatus =
                              userData.quitPlan.Status ||
                              userData.quitPlan.status;
                            if (
                              planStatus &&
                              planStatus.toLowerCase() === "completed"
                            ) {
                              return (
                                <div>
                                  <div
                                    className="progress"
                                    style={{ height: 24 }}
                                  >
                                    <div
                                      className="progress-bar bg-success"
                                      style={{ width: "100%" }}
                                    >
                                      Hoàn thành 100%
                                    </div>
                                  </div>
                                  <small className="text-muted">
                                    Kế hoạch đã hoàn thành
                                  </small>
                                </div>
                              );
                            }

                            const startDate = new Date(
                              userData.quitPlan.startDate,
                            );
                            const endDate = new Date(
                              userData.quitPlan.targetDate,
                            );
                            const today = new Date();
                            if (today < startDate) {
                              return (
                                <div>
                                  <div
                                    className="progress"
                                    style={{ height: 24 }}
                                  >
                                    <div
                                      className="progress-bar bg-secondary"
                                      style={{ width: "0%" }}
                                    >
                                      0%
                                    </div>
                                  </div>
                                  <small className="text-muted">
                                    Kế hoạch chưa bắt đầu
                                  </small>
                                </div>
                              );
                            }
                            if (today > endDate) {
                              const recentLogs = smokingHistory
                                .filter(
                                  (log) =>
                                    new Date(log.Date) >= startDate &&
                                    new Date(log.Date) <= endDate,
                                )
                                .sort(
                                  (a, b) => new Date(b.Date) - new Date(a.Date),
                                );
                              const noSmokingDays = recentLogs.filter(
                                (log) => log.Cigarettes === 0,
                              ).length;
                              const totalDays = Math.ceil(
                                (endDate - startDate) / (1000 * 60 * 60 * 24),
                              );
                              const successRate = Math.round(
                                (noSmokingDays / totalDays) * 100,
                              );
                              return (
                                <div>
                                  <div
                                    className="progress"
                                    style={{ height: 24 }}
                                  >
                                    <div
                                      className={`progress-bar ${successRate >= 70 ? "bg-success" : successRate >= 40 ? "bg-warning" : "bg-danger"}`}
                                      style={{ width: "100%" }}
                                    >
                                      Hoàn thành - {successRate}% ngày không hút
                                      thuốc
                                    </div>
                                  </div>
                                  <small className="text-muted">
                                    Kế hoạch đã kết thúc
                                  </small>
                                </div>
                              );
                            }
                            const totalDays = Math.ceil(
                              (endDate - startDate) / (1000 * 60 * 60 * 24),
                            );
                            const daysPassed = Math.ceil(
                              (today - startDate) / (1000 * 60 * 60 * 24),
                            );
                            const progressPercent = Math.round(
                              (daysPassed / totalDays) * 100,
                            );
                            const recentLogs = smokingHistory
                              .filter(
                                (log) =>
                                  new Date(log.Date) >= startDate &&
                                  new Date(log.Date) <= today,
                              )
                              .sort(
                                (a, b) => new Date(b.Date) - new Date(a.Date),
                              );
                            const noSmokingDays = recentLogs.filter(
                              (log) => log.Cigarettes === 0,
                            ).length;
                            const successRate =
                              noSmokingDays > 0
                                ? Math.round((noSmokingDays / daysPassed) * 100)
                                : 0;
                            return (
                              <div>
                                <div
                                  className="progress"
                                  style={{ height: 24 }}
                                >
                                  <div
                                    className={`progress-bar ${successRate >= 70 ? "bg-success" : successRate >= 40 ? "bg-warning" : "bg-danger"}`}
                                    style={{ width: `${progressPercent}%` }}
                                  >
                                    {progressPercent}% - {successRate}% ngày
                                    không hút thuốc
                                  </div>
                                </div>
                                <div className="mt-2 d-flex justify-content-between">
                                  <small className="text-muted">
                                    {noSmokingDays} ngày không hút /{" "}
                                    {daysPassed} ngày đã qua
                                  </small>
                                  <small className="text-muted">
                                    Còn {totalDays - daysPassed} ngày
                                  </small>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                        {/* Biểu đồ tiến độ hệ thống giữ nguyên như cũ */}
                        <div className="mt-4">
                          <label className="fw-bold mb-2">
                            Biểu đồ tiến độ hút thuốc (kế hoạch hệ thống/tự tạo)
                          </label>
                          {(() => {
                            let plan =
                              userData.quitPlan ||
                              userData.currentUserSuggestedPlan;
                            if (!plan)
                              return (
                                <div className="text-muted">
                                  Chưa có kế hoạch.
                                </div>
                              );
                            const startDate = new Date(
                              plan.startDate || plan.StartDate,
                            );
                            const endDate = new Date(
                              plan.targetDate || plan.TargetDate,
                            );

                            const allDates = [];
                            for (
                              let d = new Date(startDate);
                              d <= endDate;
                              d.setDate(d.getDate() + 1)
                            ) {
                              allDates.push(new Date(d));
                            }

                            const sampledDates = (dates, maxPoints = 30) => {
                              if (dates.length <= maxPoints) return dates;
                              const step = Math.ceil(dates.length / maxPoints);
                              return dates.filter((_, i) => i % step === 0);
                            };

                            const displayDates = sampledDates(allDates);

                            const chartData = displayDates.map((d) => {
                              const dateStr = d.toISOString().slice(0, 10);
                              const entry = smokingHistory.find(
                                (e) => e.Date.slice(0, 10) === dateStr,
                              );
                              return entry ? entry.Cigarettes : 0;
                            });

                            const chartLabels = displayDates.map((d) =>
                              d.toLocaleDateString("vi-VN", {
                                weekday: "short",
                                day: "2-digit",
                                month: "2-digit",
                              }),
                            );

                            return (
                              <Line
                                data={{
                                  labels: chartLabels,
                                  datasets: [
                                    {
                                      label: "Số điếu hút",
                                      data: chartData,
                                      borderColor: "rgb(0, 123, 255)",
                                      backgroundColor: "rgba(0, 123, 255, 0.1)",
                                      tension: 0.4,
                                      fill: true,
                                      pointRadius: allDates.length > 60 ? 2 : 4, // Smaller points for long plans
                                      pointHoverRadius:
                                        allDates.length > 60 ? 4 : 8,
                                    },
                                  ],
                                }}
                                options={{
                                  responsive: true,
                                  interaction: {
                                    mode: "index",
                                    intersect: false,
                                  },
                                  plugins: {
                                    legend: { position: "top" },
                                    title: {
                                      display: true,
                                      text: "Biểu đồ hút thuốc theo kế hoạch",
                                    },
                                    tooltip: {
                                      callbacks: {
                                        title: function (context) {
                                          const dataIndex =
                                            context[0].dataIndex;
                                          return displayDates[
                                            dataIndex
                                          ].toLocaleDateString("vi-VN", {
                                            dateStyle: "full",
                                          });
                                        },
                                        afterBody: function (context) {
                                          const dataIndex =
                                            context[0].dataIndex;
                                          const cigarettes =
                                            chartData[dataIndex] || 0;
                                          return `\nSố điếu: ${cigarettes}`;
                                        },
                                      },
                                    },
                                  },
                                  scales: {
                                    x: {
                                      title: { display: true, text: "Ngày" },
                                      ticks: {
                                        maxRotation:
                                          allDates.length > 90 ? 90 : 0, // Rotate labels for long plans
                                        minRotation:
                                          allDates.length > 90 ? 90 : 0,
                                      },
                                    },
                                    y: {
                                      type: "linear",
                                      display: true,
                                      position: "left",
                                      title: {
                                        display: true,
                                        text: "Số điếu thuốc",
                                      },
                                      min: 0,
                                    },
                                  },
                                }}
                              />
                            );
                          })()}
                        </div>
                        <div className="mt-3 d-flex justify-content-end gap-2">
                          <PlanActions
                            isCompleted={(() => {
                              const planStatus =
                                userData.quitPlan.Status ||
                                userData.quitPlan.status;
                              return (
                                planStatus &&
                                planStatus.toLowerCase() === "completed"
                              );
                            })()}
                            onNew={() => {
                              setShowNewPlanForm(true);
                              setPlanType("staged");
                            }}
                            onArchive={() => setShowDeleteModal(true)}
                            onCancel={() => setShowDeleteModal(true)}
                          />
                        </div>
                        {showNewPlanForm && (
                          <div className="mt-4 p-3 border rounded bg-white">
                            <div className="btn-group mb-3">
                              <button
                                className={`btn ${planType === "simple" ? "btn-primary" : "btn-outline-primary"}`}
                                onClick={() => setPlanType("simple")}
                              >
                                Kế hoạch đơn giản
                              </button>
                              <button
                                className={`btn ${planType === "staged" ? "btn-primary" : "btn-outline-primary"}`}
                                onClick={() => setPlanType("staged")}
                              >
                                Kế hoạch theo giai đoạn
                              </button>
                            </div>
                            {planType === "simple" ? (
                              <form
                                onSubmit={async (e) => {
                                  e.preventDefault();
                                  try {
                                    const token = localStorage.getItem("token");
                                    await axios.post(
                                      "http://localhost:5000/api/auth/quit-plan",
                                      newPlan,
                                      {
                                        headers: {
                                          Authorization: `Bearer ${token}`,
                                        },
                                      },
                                    );
                                    addNotification(
                                      "Kế hoạch đã được tạo!",
                                      "success",
                                    );
                                    setShowNewPlanForm(false);
                                    setNewPlan({
                                      startDate: "",
                                      targetDate: "",
                                      planDetail: "",
                                      initialCigarettes: 0,
                                      dailyReduction: 0,
                                      quitReason: "",
                                    });
                                    fetchUserData();
                                  } catch (error) {
                                    addNotification(
                                      error.response?.data?.message ||
                                        "Tạo kế hoạch thất bại.",
                                      "error",
                                    );
                                  }
                                }}
                              >
                                <h6 className="mb-3 text-primary">
                                  <i className="bi bi-pencil-square"></i> Tự tạo
                                  kế hoạch cai thuốc
                                </h6>
                                <div className="mb-3">
                                  <label
                                    htmlFor="quitReasonSimple"
                                    className="form-label"
                                  >
                                    Lý do cai thuốc *
                                  </label>
                                  <textarea
                                    className="form-control"
                                    id="quitReasonSimple"
                                    rows="2"
                                    placeholder="Tại sao bạn muốn cai thuốc?"
                                    value={newPlan.quitReason}
                                    onChange={(e) =>
                                      setNewPlan((p) => ({
                                        ...p,
                                        quitReason: e.target.value,
                                      }))
                                    }
                                    required
                                  ></textarea>
                                </div>
                                <div className="mb-3">
                                  <label
                                    htmlFor="planDetailSimple"
                                    className="form-label"
                                  >
                                    Chi tiết kế hoạch *
                                  </label>
                                  <textarea
                                    className="form-control"
                                    id="planDetailSimple"
                                    rows="3"
                                    placeholder="Mô tả chi tiết về kế hoạch của bạn"
                                    value={newPlan.planDetail}
                                    onChange={(e) =>
                                      setNewPlan((p) => ({
                                        ...p,
                                        planDetail: e.target.value,
                                      }))
                                    }
                                    required
                                  ></textarea>
                                </div>
                                <div className="row">
                                  <div className="col-md-6 mb-3">
                                    <label
                                      htmlFor="initialCigarettesSimple"
                                      className="form-label"
                                    >
                                      Số điếu thuốc ban đầu *
                                    </label>
                                    <input
                                      type="number"
                                      className="form-control"
                                      id="initialCigarettesSimple"
                                      value={newPlan.initialCigarettes}
                                      onChange={(e) =>
                                        setNewPlan((p) => ({
                                          ...p,
                                          initialCigarettes: Number(
                                            e.target.value,
                                          ),
                                        }))
                                      }
                                      required
                                      min="0"
                                    />
                                  </div>
                                  <div className="col-md-6 mb-3">
                                    <label
                                      htmlFor="dailyReductionSimple"
                                      className="form-label"
                                    >
                                      Số điếu giảm mỗi ngày
                                    </label>
                                    <input
                                      type="number"
                                      className="form-control"
                                      id="dailyReductionSimple"
                                      value={newPlan.dailyReduction}
                                      onChange={(e) =>
                                        setNewPlan((p) => ({
                                          ...p,
                                          dailyReduction: Number(
                                            e.target.value,
                                          ),
                                        }))
                                      }
                                      min="0"
                                    />
                                  </div>
                                </div>
                                <div className="row">
                                  <div className="col-md-6 mb-3">
                                    <label
                                      htmlFor="startDateSimple"
                                      className="form-label"
                                    >
                                      Ngày bắt đầu *
                                    </label>
                                    <input
                                      type="date"
                                      className="form-control"
                                      id="startDateSimple"
                                      value={newPlan.startDate}
                                      onChange={(e) =>
                                        setNewPlan((p) => ({
                                          ...p,
                                          startDate: e.target.value,
                                        }))
                                      }
                                      required
                                    />
                                  </div>
                                  <div className="col-md-6 mb-3">
                                    <label
                                      htmlFor="targetDateSimple"
                                      className="form-label"
                                    >
                                      Ngày kết thúc *
                                    </label>
                                    <input
                                      type="date"
                                      className="form-control"
                                      id="targetDateSimple"
                                      value={newPlan.targetDate}
                                      onChange={(e) =>
                                        setNewPlan((p) => ({
                                          ...p,
                                          targetDate: e.target.value,
                                        }))
                                      }
                                      required
                                    />
                                  </div>
                                </div>
                                <div className="d-flex gap-2 mt-3">
                                  <button
                                    type="submit"
                                    className="btn btn-primary"
                                  >
                                    Lưu kế hoạch
                                  </button>
                                  <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => setShowNewPlanForm(false)}
                                  >
                                    Hủy
                                  </button>
                                </div>
                              </form>
                            ) : (
                              <form
                                onSubmit={async (e) => {
                                  e.preventDefault();
                                  const { startDate, endDate, stages } =
                                    multiStagePlan;
                                  if (!startDate || !endDate) {
                                    addNotification(
                                      "Vui lòng nhập ngày bắt đầu và kết thúc tổng thể.",
                                      "error",
                                    );
                                    return;
                                  }
                                  if (new Date(endDate) < new Date(startDate)) {
                                    addNotification(
                                      "Ngày kết thúc kế hoạch không thể trước ngày bắt đầu.",
                                      "error",
                                    );
                                    return;
                                  }
                                  for (let i = 0; i < stages.length; i++) {
                                    const stage = stages[i];
                                    if (!stage.stageStart || !stage.stageEnd) {
                                      addNotification(
                                        `Giai đoạn "${stage.name || i + 1}" phải có ngày bắt đầu và kết thúc.`,
                                        "error",
                                      );
                                      return;
                                    }
                                    if (
                                      new Date(stage.stageEnd) <
                                      new Date(stage.stageStart)
                                    ) {
                                      addNotification(
                                        `Ngày kết thúc của giai đoạn "${stage.name || i + 1}" không thể trước ngày bắt đầu.`,
                                        "error",
                                      );
                                      return;
                                    }
                                    if (
                                      new Date(stage.stageStart) <
                                        new Date(startDate) ||
                                      new Date(stage.stageEnd) >
                                        new Date(endDate)
                                    ) {
                                      addNotification(
                                        `Giai đoạn "${stage.name || i + 1}" phải nằm trong khoảng thời gian của kế hoạch tổng thể.`,
                                        "error",
                                      );
                                      return;
                                    }
                                    for (
                                      let j = i + 1;
                                      j < stages.length;
                                      j++
                                    ) {
                                      const otherStage = stages[j];
                                      const start1 = new Date(stage.stageStart);
                                      const end1 = new Date(stage.stageEnd);
                                      const start2 = new Date(
                                        otherStage.stageStart,
                                      );
                                      const end2 = new Date(
                                        otherStage.stageEnd,
                                      );
                                      if (start1 < end2 && start2 < end1) {
                                        addNotification(
                                          `Giai đoạn "${stage.name || i + 1}" và "${otherStage.name || j + 1}" có thời gian trùng lặp.`,
                                          "error",
                                        );
                                        return;
                                      }
                                    }
                                  }
                                  const token = localStorage.getItem("token");
                                  try {
                                    await axios.post(
                                      "http://localhost:5000/api/auth/create-quit-plan",
                                      {
                                        reason: multiStagePlan.reason,
                                        startDate: multiStagePlan.startDate,
                                        endDate: multiStagePlan.endDate,
                                        stages: multiStagePlan.stages,
                                        isDraft,
                                      },
                                      {
                                        headers: {
                                          Authorization: `Bearer ${token}`,
                                        },
                                      },
                                    );
                                    addNotification(
                                      "Đã tạo kế hoạch cai thuốc thành công!",
                                      "success",
                                    );
                                    setShowNewPlanForm(false);
                                    setMultiStagePlan({
                                      reason: "",
                                      startDate: "",
                                      endDate: "",
                                      stages: [
                                        {
                                          name: "",
                                          goal: "",
                                          initial: "",
                                          target: "",
                                          stageStart: "",
                                          stageEnd: "",
                                        },
                                      ],
                                    });
                                    fetchUserData();
                                    fetchStagedQuitPlan();
                                  } catch (error) {
                                    addNotification(
                                      error.response?.data?.message ||
                                        "Tạo kế hoạch thất bại.",
                                      "error",
                                    );
                                  }
                                }}
                              >
                                <h6 className="mb-3 text-primary">
                                  <i className="bi bi-diagram-3"></i> Tự tạo kế
                                  hoạch cai thuốc nhiều giai đoạn
                                </h6>
                                <div className="mb-3">
                                  <label className="form-label">
                                    Lý do cai thuốc *
                                  </label>
                                  <input
                                    type="text"
                                    className="form-control"
                                    value={multiStagePlan.reason}
                                    onChange={(e) =>
                                      setMultiStagePlan((p) => ({
                                        ...p,
                                        reason: e.target.value,
                                      }))
                                    }
                                    required
                                  />
                                </div>
                                <div className="p-3 mb-4 border rounded bg-light-subtle">
                                  <div className="mb-2 fw-bold text-success">
                                    Thông tin tổng thể kế hoạch
                                  </div>
                                  <div className="row align-items-end">
                                    <div className="col-md-6 mb-3">
                                      <label className="form-label">
                                        Ngày bắt đầu toàn kế hoạch *
                                      </label>
                                      <input
                                        type="date"
                                        className="form-control"
                                        value={multiStagePlan.startDate}
                                        onChange={(e) =>
                                          setMultiStagePlan((p) => ({
                                            ...p,
                                            startDate: e.target.value,
                                          }))
                                        }
                                        required
                                      />
                                    </div>
                                    <div className="col-md-6 mb-3">
                                      <label className="form-label">
                                        Ngày kết thúc toàn kế hoạch *
                                      </label>
                                      <input
                                        type="date"
                                        className="form-control"
                                        value={multiStagePlan.endDate}
                                        onChange={(e) =>
                                          setMultiStagePlan((p) => ({
                                            ...p,
                                            endDate: e.target.value,
                                          }))
                                        }
                                        required
                                      />
                                    </div>
                                  </div>
                                  <div className="form-text text-secondary">
                                    * Ngày bắt đầu/kết thúc tổng giúp bạn xác
                                    định phạm vi toàn bộ kế hoạch. Các giai đoạn
                                    bên dưới có thể nằm trong hoặc trùng với
                                    phạm vi này.
                                  </div>
                                </div>
                                <div className="mb-3">
                                  <div className="fw-bold text-primary mb-2">
                                    Các giai đoạn cai thuốc
                                  </div>
                                  {multiStagePlan.stages.map((stage, idx) => (
                                    <div
                                      key={idx}
                                      className="border rounded p-3 mb-3 bg-light position-relative"
                                    >
                                      <div className="row g-2 align-items-end">
                                        <div className="col-md-2 mb-2">
                                          <label className="form-label">
                                            Tên giai đoạn
                                          </label>
                                          <input
                                            type="text"
                                            className="form-control"
                                            placeholder="Giai đoạn 1"
                                            value={stage.name}
                                            onChange={(e) =>
                                              setMultiStagePlan((p) => {
                                                const s = [...p.stages];
                                                s[idx].name = e.target.value;
                                                return { ...p, stages: s };
                                              })
                                            }
                                            required
                                          />
                                        </div>
                                        <div className="col-md-3 mb-2">
                                          <label className="form-label">
                                            Mục tiêu
                                          </label>
                                          <input
                                            type="text"
                                            className="form-control"
                                            placeholder="Giảm từ 15 xuống 10"
                                            value={stage.goal}
                                            onChange={(e) =>
                                              setMultiStagePlan((p) => {
                                                const s = [...p.stages];
                                                s[idx].goal = e.target.value;
                                                return { ...p, stages: s };
                                              })
                                            }
                                            required
                                          />
                                        </div>
                                        <div className="col-md-2 mb-2">
                                          <label className="form-label">
                                            Điếu ban đầu
                                          </label>
                                          <input
                                            type="number"
                                            className="form-control"
                                            placeholder="15"
                                            value={stage.initial}
                                            onChange={(e) =>
                                              setMultiStagePlan((p) => {
                                                const s = [...p.stages];
                                                s[idx].initial = e.target.value;
                                                return { ...p, stages: s };
                                              })
                                            }
                                            required
                                          />
                                        </div>
                                        <div className="col-md-2 mb-2">
                                          <label className="form-label">
                                            Điếu mục tiêu
                                          </label>
                                          <input
                                            type="number"
                                            className="form-control"
                                            placeholder="10"
                                            value={stage.target}
                                            onChange={(e) =>
                                              setMultiStagePlan((p) => {
                                                const s = [...p.stages];
                                                s[idx].target = e.target.value;
                                                return { ...p, stages: s };
                                              })
                                            }
                                            required
                                          />
                                        </div>
                                        <div className="col-md-6 mb-3">
                                          <label className="form-label">
                                            Bắt đầu (ngày)
                                          </label>
                                          <input
                                            type="date"
                                            className="form-control"
                                            value={stage.stageStart}
                                            onChange={(e) =>
                                              setMultiStagePlan((p) => {
                                                const s = [...p.stages];
                                                s[idx].stageStart =
                                                  e.target.value;
                                                return { ...p, stages: s };
                                              })
                                            }
                                            required
                                          />
                                        </div>
                                        <div className="col-md-6 mb-3">
                                          <label className="form-label">
                                            Kết thúc (ngày)
                                          </label>
                                          <input
                                            type="date"
                                            className="form-control"
                                            value={stage.stageEnd}
                                            onChange={(e) =>
                                              setMultiStagePlan((p) => {
                                                const s = [...p.stages];
                                                s[idx].stageEnd =
                                                  e.target.value;
                                                return { ...p, stages: s };
                                              })
                                            }
                                            required
                                          />
                                        </div>
                                        <div className="col-md-1 d-flex align-items-center gap-1 mt-4">
                                          {multiStagePlan.stages.length > 1 && (
                                            <button
                                              type="button"
                                              className="btn btn-danger btn-sm"
                                              title="Xóa giai đoạn"
                                              onClick={() =>
                                                setMultiStagePlan((p) => ({
                                                  ...p,
                                                  stages: p.stages.filter(
                                                    (_, i) => i !== idx,
                                                  ),
                                                }))
                                              }
                                            >
                                              <i className="bi bi-trash"></i>
                                            </button>
                                          )}
                                          {idx > 0 && (
                                            <button
                                              type="button"
                                              className="btn btn-outline-secondary btn-sm"
                                              title="Lên trên"
                                              onClick={() =>
                                                setMultiStagePlan((p) => {
                                                  const s = [...p.stages];
                                                  [s[idx - 1], s[idx]] = [
                                                    s[idx],
                                                    s[idx - 1],
                                                  ];
                                                  return { ...p, stages: s };
                                                })
                                              }
                                            >
                                              <i className="bi bi-arrow-up"></i>
                                            </button>
                                          )}
                                          {idx <
                                            multiStagePlan.stages.length -
                                              1 && (
                                            <button
                                              type="button"
                                              className="btn btn-outline-secondary btn-sm"
                                              title="Xuống dưới"
                                              onClick={() =>
                                                setMultiStagePlan((p) => {
                                                  const s = [...p.stages];
                                                  [s[idx + 1], s[idx]] = [
                                                    s[idx],
                                                    s[idx + 1],
                                                  ];
                                                  return { ...p, stages: s };
                                                })
                                              }
                                            >
                                              <i className="bi bi-arrow-down"></i>
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                  <button
                                    type="button"
                                    className="btn btn-success mt-2"
                                    onClick={() =>
                                      setMultiStagePlan((p) => ({
                                        ...p,
                                        stages: [
                                          ...p.stages,
                                          {
                                            name: "",
                                            goal: "",
                                            initial: "",
                                            target: "",
                                            stageStart: "",
                                            stageEnd: "",
                                          },
                                        ],
                                      }))
                                    }
                                  >
                                    + Thêm giai đoạn mới
                                  </button>
                                  <div
                                    className="form-text text-secondary ms-2 mb-2"
                                    style={{ fontSize: "0.85em" }}
                                  >
                                    Ngày bắt đầu/kết thúc của giai đoạn nên nằm
                                    trong phạm vi tổng thể kế hoạch.
                                  </div>
                                </div>
                                <div className="d-flex gap-2 mt-3">
                                  <button
                                    type="submit"
                                    className="btn btn-primary"
                                  >
                                    <i className="fas fa-plus me-2"></i>Lưu kế
                                    hoạch
                                  </button>
                                  <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => setShowNewPlanForm(false)}
                                  >
                                    Hủy
                                  </button>
                                  <button
                                    type="button"
                                    className="btn btn-outline-warning ms-auto"
                                    onClick={() => {
                                      setIsDraft(true);
                                    }}
                                  >
                                    Lưu nháp
                                  </button>
                                </div>
                              </form>
                            )}
                          </div>
                        )}
                      </div>
                    ) : userData.currentUserSuggestedPlan ? (
                      <div>
                        <h5>{userData.currentUserSuggestedPlan.title}</h5>
                        <p>{userData.currentUserSuggestedPlan.description}</p>
                        <div>
                          <b>Chi tiết:</b>{" "}
                          {userData.currentUserSuggestedPlan.planDetail}
                        </div>
                        <div>
                          <b>Ngày bắt đầu:</b>{" "}
                          {userData.currentUserSuggestedPlan.startDate}
                        </div>
                        <div>
                          <b>Ngày kết thúc:</b>{" "}
                          {userData.currentUserSuggestedPlan.targetDate}
                        </div>
                        <div className="my-3">
                          <label className="fw-bold">Tiến độ hiện tại:</label>
                          {(() => {
                            const startDate = new Date(
                              userData.currentUserSuggestedPlan.startDate,
                            );
                            const endDate = new Date(
                              userData.currentUserSuggestedPlan.targetDate,
                            );
                            const today = new Date();

                            // Nếu chưa đến ngày bắt đầu
                            if (today < startDate) {
                              return (
                                <div>
                                  <div
                                    className="progress"
                                    style={{ height: 24 }}
                                  >
                                    <div
                                      className="progress-bar bg-secondary"
                                      style={{ width: "0%" }}
                                    >
                                      0%
                                    </div>
                                  </div>
                                  <small className="text-muted">
                                    Kế hoạch chưa bắt đầu
                                  </small>
                                </div>
                              );
                            }

                            // Nếu đã kết thúc
                            if (today > endDate) {
                              const recentLogs = smokingHistory
                                .filter(
                                  (log) =>
                                    new Date(log.Date) >= startDate &&
                                    new Date(log.Date) <= endDate,
                                )
                                .sort(
                                  (a, b) => new Date(b.Date) - new Date(a.Date),
                                );

                              const noSmokingDays = recentLogs.filter(
                                (log) => log.Cigarettes === 0,
                              ).length;
                              const totalDays = Math.ceil(
                                (endDate - startDate) / (1000 * 60 * 60 * 24),
                              );
                              const successRate = Math.round(
                                (noSmokingDays / totalDays) * 100,
                              );

                              return (
                                <div>
                                  <div
                                    className="progress"
                                    style={{ height: 24 }}
                                  >
                                    <div
                                      className={`progress-bar ${successRate >= 70 ? "bg-success" : successRate >= 40 ? "bg-warning" : "bg-danger"}`}
                                      style={{ width: "100%" }}
                                    >
                                      Hoàn thành - {successRate}% ngày không hút
                                      thuốc
                                    </div>
                                  </div>
                                  <small className="text-muted">
                                    Kế hoạch đã kết thúc
                                  </small>
                                </div>
                              );
                            }

                            // Đang trong quá trình thực hiện
                            const totalDays = Math.ceil(
                              (endDate - startDate) / (1000 * 60 * 60 * 24),
                            );
                            const daysPassed = Math.ceil(
                              (today - startDate) / (1000 * 60 * 60 * 24),
                            );
                            const progressPercent = Math.round(
                              (daysPassed / totalDays) * 100,
                            );

                            // Tính số ngày không hút thuốc
                            const recentLogs = smokingHistory
                              .filter(
                                (log) =>
                                  new Date(log.Date) >= startDate &&
                                  new Date(log.Date) <= today,
                              )
                              .sort(
                                (a, b) => new Date(b.Date) - new Date(a.Date),
                              );

                            const noSmokingDays = recentLogs.filter(
                              (log) => log.Cigarettes === 0,
                            ).length;
                            const successRate =
                              noSmokingDays > 0
                                ? Math.round((noSmokingDays / daysPassed) * 100)
                                : 0;

                            return (
                              <div>
                                <div
                                  className="progress"
                                  style={{ height: 24 }}
                                >
                                  <div
                                    className={`progress-bar ${successRate >= 70 ? "bg-success" : successRate >= 40 ? "bg-warning" : "bg-danger"}`}
                                    style={{ width: `${progressPercent}%` }}
                                  >
                                    {progressPercent}% - {successRate}% ngày
                                    không hút thuốc
                                  </div>
                                </div>
                                <div className="mt-2 d-flex justify-content-between">
                                  <small className="text-muted">
                                    {noSmokingDays} ngày không hút /{" "}
                                    {daysPassed} ngày đã qua
                                  </small>
                                  <small className="text-muted">
                                    Còn {totalDays - daysPassed} ngày
                                  </small>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                        <div className="mt-3 d-flex justify-content-end">
                          <button
                            className="btn btn-danger"
                            onClick={() => setShowDeleteModal(true)}
                          >
                            Hủy kế hoạch
                          </button>
                        </div>
                      </div>
                    ) : userData.role === "memberVip" ||
                      userData.isMemberVip ? (
                      <div className="text-center p-3 border border-dashed rounded-3 bg-light">
                        <p className="text-secondary mb-3">
                          Bạn chưa có kế hoạch cai thuốc. Hãy tạo một kế hoạch
                          để bắt đầu hành trình của mình!
                        </p>
                        <h6 className="mb-2">Chọn kế hoạch mẫu:</h6>
                        <div>
                          {suggestedPlans.length === 0 ? (
                            <p>Không có kế hoạch mẫu.</p>
                          ) : (
                            suggestedPlans.map((plan, idx) => (
                              <div
                                key={plan.Id}
                                className={`card mb-2 ${selectedPlanId === plan.Id ? "border-primary border-2" : ""}`}
                                style={{ cursor: "pointer" }}
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
                            const plan = suggestedPlans.find(
                              (p) => p.Id === selectedPlanId,
                            );
                            setSelectedPlan(plan);
                            setShowDateForm(true);
                          }}
                        >
                          Chọn kế hoạch mẫu
                        </button>
                        <button
                          className="btn btn-primary"
                          onClick={() => {
                            setShowNewPlanForm(true);
                            setPlanType("staged");
                          }}
                        >
                          Tự tạo kế hoạch
                        </button>
                        {showNewPlanForm && (
                          <div className="mt-4 p-3 border rounded bg-white">
                            <div className="btn-group mb-3">
                              <button
                                className={`btn ${planType === "simple" ? "btn-primary" : "btn-outline-primary"}`}
                                onClick={() => setPlanType("simple")}
                              >
                                Kế hoạch đơn giản
                              </button>
                              <button
                                className={`btn ${planType === "staged" ? "btn-primary" : "btn-outline-primary"}`}
                                onClick={() => setPlanType("staged")}
                              >
                                Kế hoạch theo giai đoạn
                              </button>
                            </div>
                            {planType === "simple" ? (
                              <form
                                onSubmit={async (e) => {
                                  e.preventDefault();
                                  try {
                                    const token = localStorage.getItem("token");
                                    await axios.post(
                                      "http://localhost:5000/api/auth/quit-plan",
                                      newPlan,
                                      {
                                        headers: {
                                          Authorization: `Bearer ${token}`,
                                        },
                                      },
                                    );
                                    addNotification(
                                      "Kế hoạch đã được tạo!",
                                      "success",
                                    );
                                    setShowNewPlanForm(false);
                                    setNewPlan({
                                      startDate: "",
                                      targetDate: "",
                                      planDetail: "",
                                      initialCigarettes: 0,
                                      dailyReduction: 0,
                                      quitReason: "",
                                    });
                                    fetchUserData();
                                  } catch (error) {
                                    addNotification(
                                      error.response?.data?.message ||
                                        "Tạo kế hoạch thất bại.",
                                      "error",
                                    );
                                  }
                                }}
                              >
                                <h6 className="mb-3 text-primary">
                                  <i className="bi bi-pencil-square"></i> Tự tạo
                                  kế hoạch cai thuốc
                                </h6>
                                <div className="mb-3">
                                  <label
                                    htmlFor="quitReasonSimple"
                                    className="form-label"
                                  >
                                    Lý do cai thuốc *
                                  </label>
                                  <textarea
                                    className="form-control"
                                    id="quitReasonSimple"
                                    rows="2"
                                    placeholder="Tại sao bạn muốn cai thuốc?"
                                    value={newPlan.quitReason}
                                    onChange={(e) =>
                                      setNewPlan((p) => ({
                                        ...p,
                                        quitReason: e.target.value,
                                      }))
                                    }
                                    required
                                  ></textarea>
                                </div>
                                <div className="mb-3">
                                  <label
                                    htmlFor="planDetailSimple"
                                    className="form-label"
                                  >
                                    Chi tiết kế hoạch *
                                  </label>
                                  <textarea
                                    className="form-control"
                                    id="planDetailSimple"
                                    rows="3"
                                    placeholder="Mô tả chi tiết về kế hoạch của bạn"
                                    value={newPlan.planDetail}
                                    onChange={(e) =>
                                      setNewPlan((p) => ({
                                        ...p,
                                        planDetail: e.target.value,
                                      }))
                                    }
                                    required
                                  ></textarea>
                                </div>
                                <div className="row">
                                  <div className="col-md-6 mb-3">
                                    <label
                                      htmlFor="initialCigarettesSimple"
                                      className="form-label"
                                    >
                                      Số điếu thuốc ban đầu *
                                    </label>
                                    <input
                                      type="number"
                                      className="form-control"
                                      id="initialCigarettesSimple"
                                      value={newPlan.initialCigarettes}
                                      onChange={(e) =>
                                        setNewPlan((p) => ({
                                          ...p,
                                          initialCigarettes: Number(
                                            e.target.value,
                                          ),
                                        }))
                                      }
                                      required
                                      min="0"
                                    />
                                  </div>
                                  <div className="col-md-6 mb-3">
                                    <label
                                      htmlFor="dailyReductionSimple"
                                      className="form-label"
                                    >
                                      Số điếu giảm mỗi ngày
                                    </label>
                                    <input
                                      type="number"
                                      className="form-control"
                                      id="dailyReductionSimple"
                                      value={newPlan.dailyReduction}
                                      onChange={(e) =>
                                        setNewPlan((p) => ({
                                          ...p,
                                          dailyReduction: Number(
                                            e.target.value,
                                          ),
                                        }))
                                      }
                                      min="0"
                                    />
                                  </div>
                                </div>
                                <div className="row">
                                  <div className="col-md-6 mb-3">
                                    <label
                                      htmlFor="startDateSimple"
                                      className="form-label"
                                    >
                                      Ngày bắt đầu *
                                    </label>
                                    <input
                                      type="date"
                                      className="form-control"
                                      id="startDateSimple"
                                      value={newPlan.startDate}
                                      onChange={(e) =>
                                        setNewPlan((p) => ({
                                          ...p,
                                          startDate: e.target.value,
                                        }))
                                      }
                                      required
                                    />
                                  </div>
                                  <div className="col-md-6 mb-3">
                                    <label
                                      htmlFor="targetDateSimple"
                                      className="form-label"
                                    >
                                      Ngày kết thúc *
                                    </label>
                                    <input
                                      type="date"
                                      className="form-control"
                                      id="targetDateSimple"
                                      value={newPlan.targetDate}
                                      onChange={(e) =>
                                        setNewPlan((p) => ({
                                          ...p,
                                          targetDate: e.target.value,
                                        }))
                                      }
                                      required
                                    />
                                  </div>
                                </div>
                                <div className="d-flex gap-2 mt-3">
                                  <button
                                    type="submit"
                                    className="btn btn-primary"
                                  >
                                    Lưu kế hoạch
                                  </button>
                                  <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => setShowNewPlanForm(false)}
                                  >
                                    Hủy
                                  </button>
                                </div>
                              </form>
                            ) : (
                              <form
                                onSubmit={async (e) => {
                                  e.preventDefault();

                                  // --- DATE VALIDATION ---
                                  const { startDate, endDate, stages } =
                                    multiStagePlan;
                                  if (!startDate || !endDate) {
                                    addNotification(
                                      "Vui lòng nhập ngày bắt đầu và kết thúc tổng thể.",
                                      "error",
                                    );
                                    return;
                                  }
                                  if (new Date(endDate) < new Date(startDate)) {
                                    addNotification(
                                      "Ngày kết thúc kế hoạch không thể trước ngày bắt đầu.",
                                      "error",
                                    );
                                    return;
                                  }

                                  for (let i = 0; i < stages.length; i++) {
                                    const stage = stages[i];
                                    if (!stage.stageStart || !stage.stageEnd) {
                                      addNotification(
                                        `Giai đoạn "${stage.name || i + 1}" phải có ngày bắt đầu và kết thúc.`,
                                        "error",
                                      );
                                      return;
                                    }
                                    if (
                                      new Date(stage.stageEnd) <
                                      new Date(stage.stageStart)
                                    ) {
                                      addNotification(
                                        `Ngày kết thúc của giai đoạn "${stage.name || i + 1}" không thể trước ngày bắt đầu.`,
                                        "error",
                                      );
                                      return;
                                    }
                                    if (
                                      new Date(stage.stageStart) <
                                        new Date(startDate) ||
                                      new Date(stage.stageEnd) >
                                        new Date(endDate)
                                    ) {
                                      addNotification(
                                        `Giai đoạn "${stage.name || i + 1}" phải nằm trong khoảng thời gian của kế hoạch tổng thể.`,
                                        "error",
                                      );
                                      return;
                                    }
                                    // Check for overlapping stages
                                    for (
                                      let j = i + 1;
                                      j < stages.length;
                                      j++
                                    ) {
                                      const otherStage = stages[j];
                                      const start1 = new Date(stage.stageStart);
                                      const end1 = new Date(stage.stageEnd);
                                      const start2 = new Date(
                                        otherStage.stageStart,
                                      );
                                      const end2 = new Date(
                                        otherStage.stageEnd,
                                      );
                                      if (start1 < end2 && start2 < end1) {
                                        addNotification(
                                          `Giai đoạn "${stage.name || i + 1}" và "${otherStage.name || j + 1}" có thời gian trùng lặp.`,
                                          "error",
                                        );
                                        return;
                                      }
                                    }
                                  }
                                  // --- END VALIDATION ---

                                  const token = localStorage.getItem("token");
                                  try {
                                    await axios.post(
                                      "http://localhost:5000/api/auth/create-quit-plan",
                                      {
                                        reason: multiStagePlan.reason,
                                        startDate: multiStagePlan.startDate,
                                        endDate: multiStagePlan.endDate,
                                        stages: multiStagePlan.stages,
                                        isDraft,
                                      },
                                      {
                                        headers: {
                                          Authorization: `Bearer ${token}`,
                                        },
                                      },
                                    );
                                    addNotification(
                                      "Đã tạo kế hoạch cai thuốc thành công!",
                                      "success",
                                    );
                                    setShowNewPlanForm(false);
                                    setMultiStagePlan({
                                      reason: "",
                                      startDate: "",
                                      endDate: "",
                                      stages: [
                                        {
                                          name: "",
                                          goal: "",
                                          initial: "",
                                          target: "",
                                          stageStart: "",
                                          stageEnd: "",
                                        },
                                      ],
                                    });
                                    fetchUserData();
                                    fetchStagedQuitPlan(); // Refetch to show the new plan
                                  } catch (error) {
                                    addNotification(
                                      error.response?.data?.message ||
                                        "Tạo kế hoạch thất bại.",
                                      "error",
                                    );
                                  }
                                }}
                              >
                                <h6 className="mb-3 text-primary">
                                  <i className="bi bi-diagram-3"></i> Tự tạo kế
                                  hoạch cai thuốc nhiều giai đoạn
                                </h6>
                                <div className="mb-3">
                                  <label className="form-label">
                                    Lý do cai thuốc *
                                  </label>
                                  <input
                                    type="text"
                                    className="form-control"
                                    value={multiStagePlan.reason}
                                    onChange={(e) =>
                                      setMultiStagePlan((p) => ({
                                        ...p,
                                        reason: e.target.value,
                                      }))
                                    }
                                    required
                                  />
                                </div>
                                <div className="p-3 mb-4 border rounded bg-light-subtle">
                                  <div className="mb-2 fw-bold text-success">
                                    Thông tin tổng thể kế hoạch
                                  </div>
                                  <div className="row align-items-end">
                                    <div className="col-md-6 mb-3">
                                      <label className="form-label">
                                        Ngày bắt đầu toàn kế hoạch *
                                      </label>
                                      <input
                                        type="date"
                                        className="form-control"
                                        value={multiStagePlan.startDate}
                                        onChange={(e) =>
                                          setMultiStagePlan((p) => ({
                                            ...p,
                                            startDate: e.target.value,
                                          }))
                                        }
                                        required
                                      />
                                    </div>
                                    <div className="col-md-6 mb-3">
                                      <label className="form-label">
                                        Ngày kết thúc toàn kế hoạch *
                                      </label>
                                      <input
                                        type="date"
                                        className="form-control"
                                        value={multiStagePlan.endDate}
                                        onChange={(e) =>
                                          setMultiStagePlan((p) => ({
                                            ...p,
                                            endDate: e.target.value,
                                          }))
                                        }
                                        required
                                      />
                                    </div>
                                  </div>
                                  <div className="form-text text-secondary">
                                    * Ngày bắt đầu/kết thúc tổng giúp bạn xác
                                    định phạm vi toàn bộ kế hoạch. Các giai đoạn
                                    bên dưới có thể nằm trong hoặc trùng với
                                    phạm vi này.
                                  </div>
                                </div>
                                <div className="mb-3">
                                  <div className="fw-bold text-primary mb-2">
                                    Các giai đoạn cai thuốc
                                  </div>
                                  {multiStagePlan.stages.map((stage, idx) => (
                                    <div
                                      key={idx}
                                      className="border rounded p-3 mb-3 bg-light position-relative"
                                    >
                                      <div className="row g-2 align-items-end">
                                        <div className="col-md-2 mb-2">
                                          <label className="form-label">
                                            Tên giai đoạn
                                          </label>
                                          <input
                                            type="text"
                                            className="form-control"
                                            placeholder="Giai đoạn 1"
                                            value={stage.name}
                                            onChange={(e) =>
                                              setMultiStagePlan((p) => {
                                                const s = [...p.stages];
                                                s[idx].name = e.target.value;
                                                return { ...p, stages: s };
                                              })
                                            }
                                            required
                                          />
                                        </div>
                                        <div className="col-md-3 mb-2">
                                          <label className="form-label">
                                            Mục tiêu
                                          </label>
                                          <input
                                            type="text"
                                            className="form-control"
                                            placeholder="Giảm từ 15 xuống 10"
                                            value={stage.goal}
                                            onChange={(e) =>
                                              setMultiStagePlan((p) => {
                                                const s = [...p.stages];
                                                s[idx].goal = e.target.value;
                                                return { ...p, stages: s };
                                              })
                                            }
                                            required
                                          />
                                        </div>
                                        <div className="col-md-2 mb-2">
                                          <label className="form-label">
                                            Điếu ban đầu
                                          </label>
                                          <input
                                            type="number"
                                            className="form-control"
                                            placeholder="15"
                                            value={stage.initial}
                                            onChange={(e) =>
                                              setMultiStagePlan((p) => {
                                                const s = [...p.stages];
                                                s[idx].initial = e.target.value;
                                                return { ...p, stages: s };
                                              })
                                            }
                                            required
                                          />
                                        </div>
                                        <div className="col-md-2 mb-2">
                                          <label className="form-label">
                                            Điếu mục tiêu
                                          </label>
                                          <input
                                            type="number"
                                            className="form-control"
                                            placeholder="10"
                                            value={stage.target}
                                            onChange={(e) =>
                                              setMultiStagePlan((p) => {
                                                const s = [...p.stages];
                                                s[idx].target = e.target.value;
                                                return { ...p, stages: s };
                                              })
                                            }
                                            required
                                          />
                                        </div>
                                        <div className="col-md-6 mb-3">
                                          <label className="form-label">
                                            Bắt đầu (ngày)
                                          </label>
                                          <input
                                            type="date"
                                            className="form-control"
                                            value={stage.stageStart}
                                            onChange={(e) =>
                                              setMultiStagePlan((p) => {
                                                const s = [...p.stages];
                                                s[idx].stageStart =
                                                  e.target.value;
                                                return { ...p, stages: s };
                                              })
                                            }
                                            required
                                          />
                                        </div>
                                        <div className="col-md-6 mb-3">
                                          <label className="form-label">
                                            Kết thúc (ngày)
                                          </label>
                                          <input
                                            type="date"
                                            className="form-control"
                                            value={stage.stageEnd}
                                            onChange={(e) =>
                                              setMultiStagePlan((p) => {
                                                const s = [...p.stages];
                                                s[idx].stageEnd =
                                                  e.target.value;
                                                return { ...p, stages: s };
                                              })
                                            }
                                            required
                                          />
                                        </div>
                                        <div className="col-md-1 d-flex align-items-center gap-1 mt-4">
                                          {multiStagePlan.stages.length > 1 && (
                                            <button
                                              type="button"
                                              className="btn btn-danger btn-sm"
                                              title="Xóa giai đoạn"
                                              onClick={() =>
                                                setMultiStagePlan((p) => ({
                                                  ...p,
                                                  stages: p.stages.filter(
                                                    (_, i) => i !== idx,
                                                  ),
                                                }))
                                              }
                                            >
                                              <i className="bi bi-trash"></i>
                                            </button>
                                          )}
                                          {idx > 0 && (
                                            <button
                                              type="button"
                                              className="btn btn-outline-secondary btn-sm"
                                              title="Lên trên"
                                              onClick={() =>
                                                setMultiStagePlan((p) => {
                                                  const s = [...p.stages];
                                                  [s[idx - 1], s[idx]] = [
                                                    s[idx],
                                                    s[idx - 1],
                                                  ];
                                                  return { ...p, stages: s };
                                                })
                                              }
                                            >
                                              <i className="bi bi-arrow-up"></i>
                                            </button>
                                          )}
                                          {idx <
                                            multiStagePlan.stages.length -
                                              1 && (
                                            <button
                                              type="button"
                                              className="btn btn-outline-secondary btn-sm"
                                              title="Xuống dưới"
                                              onClick={() =>
                                                setMultiStagePlan((p) => {
                                                  const s = [...p.stages];
                                                  [s[idx + 1], s[idx]] = [
                                                    s[idx],
                                                    s[idx + 1],
                                                  ];
                                                  return { ...p, stages: s };
                                                })
                                              }
                                            >
                                              <i className="bi bi-arrow-down"></i>
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                  <button
                                    type="button"
                                    className="btn btn-success mt-2"
                                    onClick={() =>
                                      setMultiStagePlan((p) => ({
                                        ...p,
                                        stages: [
                                          ...p.stages,
                                          {
                                            name: "",
                                            goal: "",
                                            initial: "",
                                            target: "",
                                            stageStart: "",
                                            stageEnd: "",
                                          },
                                        ],
                                      }))
                                    }
                                  >
                                    + Thêm giai đoạn mới
                                  </button>
                                  <div
                                    className="form-text text-secondary ms-2 mb-2"
                                    style={{ fontSize: "0.85em" }}
                                  >
                                    Ngày bắt đầu/kết thúc của giai đoạn nên nằm
                                    trong phạm vi tổng thể kế hoạch.
                                  </div>
                                </div>
                                <div className="d-flex gap-2 mt-3">
                                  <button
                                    type="submit"
                                    className="btn btn-primary"
                                  >
                                    <i className="fas fa-plus me-2"></i>Lưu kế
                                    hoạch
                                  </button>
                                  <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => setShowNewPlanForm(false)}
                                  >
                                    Hủy
                                  </button>
                                  <button
                                    type="button"
                                    className="btn btn-outline-warning ms-auto"
                                    onClick={() => {
                                      setIsDraft(
                                        true,
                                      ); /* có thể lưu localStorage hoặc gửi lên backend với isDraft=true */
                                    }}
                                  >
                                    Lưu nháp
                                  </button>
                                </div>
                              </form>
                            )}
                          </div>
                        )}
                        {showDateForm && selectedPlan && (
                          <form
                            className="mt-3"
                            onSubmit={async (e) => {
                              e.preventDefault();
                              const token = localStorage.getItem("token");
                              // Auto-calculate targetDate based on plan duration
                              const startDateObj = new Date(
                                planDates.startDate,
                              );
                              let durationDays = 30; // Default
                              if (selectedPlan.Title?.includes("60"))
                                durationDays = 60;
                              else if (selectedPlan.Title?.includes("90"))
                                durationDays = 90;
                              // You can also parse from Description or add a field in DB for duration
                              const targetDateObj = new Date(startDateObj);
                              targetDateObj.setDate(
                                startDateObj.getDate() + durationDays - 1,
                              );
                              const targetDate = targetDateObj
                                .toISOString()
                                .slice(0, 10);
                              try {
                                const response = await saveUserSuggestedQuitPlan({
                                  suggestedPlanId: selectedPlan.Id,
                                  startDate: planDates.startDate,
                                  targetDate,
                                });
                                
                                // Show success message with stage creation info
                                const stageCount = response.stages ? response.stages.length : 0;
                                addNotification(
                                  `Đã lưu kế hoạch thành công! Tự động tạo ${stageCount} giai đoạn.`,
                                  "success"
                                );
                                
                                console.log("Suggested plan saved with automatic stage creation:", {
                                  userSuggestedQuitPlanId: response.userSuggestedQuitPlanId,
                                  quitPlanId: response.quitPlanId,
                                  stagesCreated: response.stages
                                });
                                
                                setShowDateForm(false);
                                setSelectedPlan(null);
                                setPlanDates({ startDate: "", targetDate: "" });
                                
                                // Refresh both user data and staged quit plan data
                                await fetchUserData();
                                await fetchStagedQuitPlan();
                              } catch (error) {
                                addNotification(
                                  error.message || "Lưu kế hoạch thất bại.",
                                  "error"
                                );
                              }
                            }}
                          >
                            <div className="mb-2">
                              <label>Ngày bắt đầu</label>
                              <input
                                type="date"
                                className="form-control"
                                value={planDates.startDate}
                                onChange={(e) =>
                                  setPlanDates({
                                    ...planDates,
                                    startDate: e.target.value,
                                  })
                                }
                                required
                              />
                            </div>
                            {/* Ngày kết thúc sẽ tự động tính toán và hiển thị */}
                            {planDates.startDate && (
                              <div className="mb-2">
                                <label>Ngày kết thúc (tự động):</label>
                                <input
                                  type="text"
                                  className="form-control"
                                  value={() => {
                                    const startDateObj = new Date(
                                      planDates.startDate,
                                    );
                                    let durationDays = 30;
                                    if (selectedPlan.Title?.includes("60"))
                                      durationDays = 60;
                                    else if (selectedPlan.Title?.includes("90"))
                                      durationDays = 90;
                                    const targetDateObj = new Date(
                                      startDateObj,
                                    );
                                    targetDateObj.setDate(
                                      startDateObj.getDate() + durationDays - 1,
                                    );
                                    return targetDateObj
                                      .toISOString()
                                      .slice(0, 10);
                                  }}
                                  readOnly
                                />
                              </div>
                            )}
                            <button type="submit" className="btn btn-success">
                              Lưu kế hoạch
                            </button>
                            <button
                              type="button"
                              className="btn btn-secondary ms-2"
                              onClick={() => setShowDateForm(false)}
                            >
                              Hủy
                            </button>
                          </form>
                        )}
                      </div>
                    ) : (
                      // Member thường: chỉ cho tự tạo kế hoạch
                      <div className="text-center p-3 border border-dashed rounded-3 bg-light">
                        <p className="text-secondary mb-3">
                          Bạn chưa có kế hoạch cai thuốc. Hãy tự tạo một kế
                          hoạch để bắt đầu hành trình của mình!
                        </p>
                        <button
                          className="btn btn-primary"
                          onClick={() => {
                            setShowNewPlanForm(true);
                            setPlanType("staged");
                          }}
                        >
                          Tự tạo kế hoạch
                        </button>
                        {showNewPlanForm && (
                          <div className="mt-4 p-3 border rounded bg-white">
                            <div className="btn-group mb-3">
                              <button
                                className={`btn ${planType === "simple" ? "btn-primary" : "btn-outline-primary"}`}
                                onClick={() => setPlanType("simple")}
                              >
                                Kế hoạch đơn giản
                              </button>
                              <button
                                className={`btn ${planType === "staged" ? "btn-primary" : "btn-outline-primary"}`}
                                onClick={() => setPlanType("staged")}
                              >
                                Kế hoạch theo giai đoạn
                              </button>
                            </div>
                            {planType === "simple" ? (
                              <form
                                onSubmit={async (e) => {
                                  e.preventDefault();
                                  try {
                                    const token = localStorage.getItem("token");
                                    await axios.post(
                                      "http://localhost:5000/api/auth/quit-plan",
                                      newPlan,
                                      {
                                        headers: {
                                          Authorization: `Bearer ${token}`,
                                        },
                                      },
                                    );
                                    addNotification(
                                      "Kế hoạch đã được tạo!",
                                      "success",
                                    );
                                    setShowNewPlanForm(false);
                                    setNewPlan({
                                      startDate: "",
                                      targetDate: "",
                                      planDetail: "",
                                      initialCigarettes: 0,
                                      dailyReduction: 0,
                                      quitReason: "",
                                    });
                                    fetchUserData();
                                  } catch (error) {
                                    addNotification(
                                      error.response?.data?.message ||
                                        "Tạo kế hoạch thất bại.",
                                      "error",
                                    );
                                  }
                                }}
                              >
                                <h6 className="mb-3 text-primary">
                                  <i className="bi bi-pencil-square"></i> Tự tạo
                                  kế hoạch cai thuốc
                                </h6>
                                <div className="mb-3">
                                  <label
                                    htmlFor="quitReasonSimple"
                                    className="form-label"
                                  >
                                    Lý do cai thuốc *
                                  </label>
                                  <textarea
                                    className="form-control"
                                    id="quitReasonSimple"
                                    rows="2"
                                    placeholder="Tại sao bạn muốn cai thuốc?"
                                    value={newPlan.quitReason}
                                    onChange={(e) =>
                                      setNewPlan((p) => ({
                                        ...p,
                                        quitReason: e.target.value,
                                      }))
                                    }
                                    required
                                  ></textarea>
                                </div>
                                <div className="mb-3">
                                  <label
                                    htmlFor="planDetailSimple"
                                    className="form-label"
                                  >
                                    Chi tiết kế hoạch *
                                  </label>
                                  <textarea
                                    className="form-control"
                                    id="planDetailSimple"
                                    rows="3"
                                    placeholder="Mô tả chi tiết về kế hoạch của bạn"
                                    value={newPlan.planDetail}
                                    onChange={(e) =>
                                      setNewPlan((p) => ({
                                        ...p,
                                        planDetail: e.target.value,
                                      }))
                                    }
                                    required
                                  ></textarea>
                                </div>
                                <div className="row">
                                  <div className="col-md-6 mb-3">
                                    <label
                                      htmlFor="initialCigarettesSimple"
                                      className="form-label"
                                    >
                                      Số điếu thuốc ban đầu *
                                    </label>
                                    <input
                                      type="number"
                                      className="form-control"
                                      id="initialCigarettesSimple"
                                      value={newPlan.initialCigarettes}
                                      onChange={(e) =>
                                        setNewPlan((p) => ({
                                          ...p,
                                          initialCigarettes: Number(
                                            e.target.value,
                                          ),
                                        }))
                                      }
                                      required
                                      min="0"
                                    />
                                  </div>
                                  <div className="col-md-6 mb-3">
                                    <label
                                      htmlFor="dailyReductionSimple"
                                      className="form-label"
                                    >
                                      Số điếu giảm mỗi ngày
                                    </label>
                                    <input
                                      type="number"
                                      className="form-control"
                                      id="dailyReductionSimple"
                                      value={newPlan.dailyReduction}
                                      onChange={(e) =>
                                        setNewPlan((p) => ({
                                          ...p,
                                          dailyReduction: Number(
                                            e.target.value,
                                          ),
                                        }))
                                      }
                                      min="0"
                                    />
                                  </div>
                                </div>
                                <div className="row">
                                  <div className="col-md-6 mb-3">
                                    <label
                                      htmlFor="startDateSimple"
                                      className="form-label"
                                    >
                                      Ngày bắt đầu *
                                    </label>
                                    <input
                                      type="date"
                                      className="form-control"
                                      id="startDateSimple"
                                      value={newPlan.startDate}
                                      onChange={(e) =>
                                        setNewPlan((p) => ({
                                          ...p,
                                          startDate: e.target.value,
                                        }))
                                      }
                                      required
                                    />
                                  </div>
                                  <div className="col-md-6 mb-3">
                                    <label
                                      htmlFor="targetDateSimple"
                                      className="form-label"
                                    >
                                      Ngày kết thúc *
                                    </label>
                                    <input
                                      type="date"
                                      className="form-control"
                                      id="targetDateSimple"
                                      value={newPlan.targetDate}
                                      onChange={(e) =>
                                        setNewPlan((p) => ({
                                          ...p,
                                          targetDate: e.target.value,
                                        }))
                                      }
                                      required
                                    />
                                  </div>
                                </div>
                                <div className="d-flex gap-2 mt-3">
                                  <button
                                    type="submit"
                                    className="btn btn-primary"
                                  >
                                    Lưu kế hoạch
                                  </button>
                                  <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => setShowNewPlanForm(false)}
                                  >
                                    Hủy
                                  </button>
                                </div>
                              </form>
                            ) : (
                              <form
                                onSubmit={async (e) => {
                                  e.preventDefault();
                                  const token = localStorage.getItem("token");
                                  try {
                                    await axios.post(
                                      "http://localhost:5000/api/auth/create-quit-plan",
                                      {
                                        reason: multiStagePlan.reason,
                                        startDate: multiStagePlan.startDate,
                                        endDate: multiStagePlan.endDate,
                                        stages: multiStagePlan.stages,
                                        isDraft,
                                      },
                                      {
                                        headers: {
                                          Authorization: `Bearer ${token}`,
                                        },
                                      },
                                    );
                                    addNotification(
                                      "Đã tạo kế hoạch cai thuốc thành công!",
                                      "success",
                                    );
                                    setShowNewPlanForm(false);
                                    setMultiStagePlan({
                                      reason: "",
                                      startDate: "",
                                      endDate: "",
                                      stages: [
                                        {
                                          name: "",
                                          goal: "",
                                          initial: "",
                                          target: "",
                                          stageStart: "",
                                          stageEnd: "",
                                        },
                                      ],
                                    });
                                    fetchUserData();
                                  } catch (error) {
                                    addNotification(
                                      error.response?.data?.message ||
                                        "Tạo kế hoạch thất bại.",
                                      "error",
                                    );
                                  }
                                }}
                              >
                                <h6 className="mb-3 text-primary">
                                  <i className="bi bi-diagram-3"></i> Tự tạo kế
                                  hoạch cai thuốc nhiều giai đoạn
                                </h6>
                                <div className="mb-3">
                                  <label className="form-label">
                                    Lý do cai thuốc *
                                  </label>
                                  <input
                                    type="text"
                                    className="form-control"
                                    value={multiStagePlan.reason}
                                    onChange={(e) =>
                                      setMultiStagePlan((p) => ({
                                        ...p,
                                        reason: e.target.value,
                                      }))
                                    }
                                    required
                                  />
                                </div>
                                <div className="p-3 mb-4 border rounded bg-light-subtle">
                                  <div className="mb-2 fw-bold text-success">
                                    Thông tin tổng thể kế hoạch
                                  </div>
                                  <div className="row align-items-end">
                                    <div className="col-md-6 mb-3">
                                      <label className="form-label">
                                        Ngày bắt đầu toàn kế hoạch *
                                      </label>
                                      <input
                                        type="date"
                                        className="form-control"
                                        value={multiStagePlan.startDate}
                                        onChange={(e) =>
                                          setMultiStagePlan((p) => ({
                                            ...p,
                                            startDate: e.target.value,
                                          }))
                                        }
                                        required
                                      />
                                    </div>
                                    <div className="col-md-6 mb-3">
                                      <label className="form-label">
                                        Ngày kết thúc toàn kế hoạch *
                                      </label>
                                      <input
                                        type="date"
                                        className="form-control"
                                        value={multiStagePlan.endDate}
                                        onChange={(e) =>
                                          setMultiStagePlan((p) => ({
                                            ...p,
                                            endDate: e.target.value,
                                          }))
                                        }
                                        required
                                      />
                                    </div>
                                  </div>
                                  <div className="form-text text-secondary">
                                    * Ngày bắt đầu/kết thúc tổng giúp bạn xác
                                    định phạm vi toàn bộ kế hoạch. Các giai đoạn
                                    bên dưới có thể nằm trong hoặc trùng với
                                    phạm vi này.
                                  </div>
                                </div>
                                <div className="mb-3">
                                  <div className="fw-bold text-primary mb-2">
                                    Các giai đoạn cai thuốc
                                  </div>
                                  {multiStagePlan.stages.map((stage, idx) => (
                                    <div
                                      key={idx}
                                      className="border rounded p-3 mb-3 bg-light position-relative"
                                    >
                                      <div className="row g-2 align-items-end">
                                        <div className="col-md-2 mb-2">
                                          <label className="form-label">
                                            Tên giai đoạn
                                          </label>
                                          <input
                                            type="text"
                                            className="form-control"
                                            placeholder="Giai đoạn 1"
                                            value={stage.name}
                                            onChange={(e) =>
                                              setMultiStagePlan((p) => {
                                                const s = [...p.stages];
                                                s[idx].name = e.target.value;
                                                return { ...p, stages: s };
                                              })
                                            }
                                            required
                                          />
                                        </div>
                                        <div className="col-md-3 mb-2">
                                          <label className="form-label">
                                            Mục tiêu
                                          </label>
                                          <input
                                            type="text"
                                            className="form-control"
                                            placeholder="Giảm từ 15 xuống 10"
                                            value={stage.goal}
                                            onChange={(e) =>
                                              setMultiStagePlan((p) => {
                                                const s = [...p.stages];
                                                s[idx].goal = e.target.value;
                                                return { ...p, stages: s };
                                              })
                                            }
                                            required
                                          />
                                        </div>
                                        <div className="col-md-2 mb-2">
                                          <label className="form-label">
                                            Điếu ban đầu
                                          </label>
                                          <input
                                            type="number"
                                            className="form-control"
                                            placeholder="15"
                                            value={stage.initial}
                                            onChange={(e) =>
                                              setMultiStagePlan((p) => {
                                                const s = [...p.stages];
                                                s[idx].initial = e.target.value;
                                                return { ...p, stages: s };
                                              })
                                            }
                                            required
                                          />
                                        </div>
                                        <div className="col-md-2 mb-2">
                                          <label className="form-label">
                                            Điếu mục tiêu
                                          </label>
                                          <input
                                            type="number"
                                            className="form-control"
                                            placeholder="10"
                                            value={stage.target}
                                            onChange={(e) =>
                                              setMultiStagePlan((p) => {
                                                const s = [...p.stages];
                                                s[idx].target = e.target.value;
                                                return { ...p, stages: s };
                                              })
                                            }
                                            required
                                          />
                                        </div>
                                        <div className="col-md-6 mb-3">
                                          <label className="form-label">
                                            Bắt đầu (ngày)
                                          </label>
                                          <input
                                            type="date"
                                            className="form-control"
                                            value={stage.stageStart}
                                            onChange={(e) =>
                                              setMultiStagePlan((p) => {
                                                const s = [...p.stages];
                                                s[idx].stageStart =
                                                  e.target.value;
                                                return { ...p, stages: s };
                                              })
                                            }
                                            required
                                          />
                                        </div>
                                        <div className="col-md-6 mb-3">
                                          <label className="form-label">
                                            Kết thúc (ngày)
                                          </label>
                                          <input
                                            type="date"
                                            className="form-control"
                                            value={stage.stageEnd}
                                            onChange={(e) =>
                                              setMultiStagePlan((p) => {
                                                const s = [...p.stages];
                                                s[idx].stageEnd =
                                                  e.target.value;
                                                return { ...p, stages: s };
                                              })
                                            }
                                            required
                                          />
                                        </div>
                                        <div className="col-md-1 d-flex align-items-center gap-1 mt-4">
                                          {multiStagePlan.stages.length > 1 && (
                                            <button
                                              type="button"
                                              className="btn btn-danger btn-sm"
                                              title="Xóa giai đoạn"
                                              onClick={() =>
                                                setMultiStagePlan((p) => ({
                                                  ...p,
                                                  stages: p.stages.filter(
                                                    (_, i) => i !== idx,
                                                  ),
                                                }))
                                              }
                                            >
                                              <i className="bi bi-trash"></i>
                                            </button>
                                          )}
                                          {idx > 0 && (
                                            <button
                                              type="button"
                                              className="btn btn-outline-secondary btn-sm"
                                              title="Lên trên"
                                              onClick={() =>
                                                setMultiStagePlan((p) => {
                                                  const s = [...p.stages];
                                                  [s[idx - 1], s[idx]] = [
                                                    s[idx],
                                                    s[idx - 1],
                                                  ];
                                                  return { ...p, stages: s };
                                                })
                                              }
                                            >
                                              <i className="bi bi-arrow-up"></i>
                                            </button>
                                          )}
                                          {idx <
                                            multiStagePlan.stages.length -
                                              1 && (
                                            <button
                                              type="button"
                                              className="btn btn-outline-secondary btn-sm"
                                              title="Xuống dưới"
                                              onClick={() =>
                                                setMultiStagePlan((p) => {
                                                  const s = [...p.stages];
                                                  [s[idx + 1], s[idx]] = [
                                                    s[idx],
                                                    s[idx + 1],
                                                  ];
                                                  return { ...p, stages: s };
                                                })
                                              }
                                            >
                                              <i className="bi bi-arrow-down"></i>
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                  <button
                                    type="button"
                                    className="btn btn-success mt-2"
                                    onClick={() =>
                                      setMultiStagePlan((p) => ({
                                        ...p,
                                        stages: [
                                          ...p.stages,
                                          {
                                            name: "",
                                            goal: "",
                                            initial: "",
                                            target: "",
                                            stageStart: "",
                                            stageEnd: "",
                                          },
                                        ],
                                      }))
                                    }
                                  >
                                    + Thêm giai đoạn mới
                                  </button>
                                  <div
                                    className="form-text text-secondary ms-2 mb-2"
                                    style={{ fontSize: "0.85em" }}
                                  >
                                    Ngày bắt đầu/kết thúc của giai đoạn nên nằm
                                    trong phạm vi tổng thể kế hoạch.
                                  </div>
                                </div>
                                <div className="d-flex gap-2 mt-3">
                                  <button
                                    type="submit"
                                    className="btn btn-primary"
                                  >
                                    <i className="fas fa-plus me-2"></i>Lưu kế
                                    hoạch
                                  </button>
                                  <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => setShowNewPlanForm(false)}
                                  >
                                    Hủy
                                  </button>
                                  <button
                                    type="button"
                                    className="btn btn-outline-warning ms-auto"
                                    onClick={() => {
                                      setIsDraft(
                                        true,
                                      ); /* có thể lưu localStorage hoặc gửi lên backend với isDraft=true */
                                    }}
                                  >
                                    Lưu nháp
                                  </button>
                                </div>
                              </form>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              {/* Ô 4: Kế hoạch của coach (nếu có) */}
              {latestCoachPlan && (
                <div className="col-12 col-md-6">
                  <div className="card shadow-sm h-100">
                    <div className="card-header bg-info text-white fw-bold">
                      Kế hoạch cai thuốc do huấn luyện viên đề xuất
                    </div>
                    <div className="card-body">
                      <h5>{latestCoachPlan.Title}</h5>
                      <div>
                        <b>Mô tả:</b> {latestCoachPlan.Description}
                      </div>
                      <div>
                        <b>Chi tiết:</b>{" "}
                        <pre style={{ whiteSpace: "pre-line" }}>
                          {latestCoachPlan.PlanDetail}
                        </pre>
                      </div>
                      <div>
                        <b>Ngày bắt đầu:</b> {latestCoachPlan.StartDate}
                      </div>
                      <div>
                        <b>Ngày kết thúc:</b> {latestCoachPlan.TargetDate}
                      </div>
                      {/* Tiến độ hiện tại cho kế hoạch coach */}
                      <div className="my-3">
                        <label className="fw-bold">Tiến độ hiện tại:</label>
                        {(() => {
                          const startDate = new Date(latestCoachPlan.StartDate);
                          const endDate = new Date(latestCoachPlan.TargetDate);
                          const today = new Date();
                          if (today < startDate) {
                            return (
                              <div>
                                <div
                                  className="progress"
                                  style={{ height: 24 }}
                                >
                                  <div
                                    className="progress-bar bg-secondary"
                                    style={{ width: "0%" }}
                                  >
                                    0%
                                  </div>
                                </div>
                                <small className="text-muted">
                                  Kế hoạch chưa bắt đầu
                                </small>
                              </div>
                            );
                          }
                          if (today > endDate) {
                            const recentLogs = smokingHistory
                              .filter(
                                (log) =>
                                  new Date(log.Date) >= startDate &&
                                  new Date(log.Date) <= endDate,
                              )
                              .sort(
                                (a, b) => new Date(b.Date) - new Date(a.Date),
                              );
                            const noSmokingDays = recentLogs.filter(
                              (log) => log.Cigarettes === 0,
                            ).length;
                            const totalDays = Math.ceil(
                              (endDate - startDate) / (1000 * 60 * 60 * 24),
                            );
                            const successRate = Math.round(
                              (noSmokingDays / totalDays) * 100,
                            );
                            return (
                              <div>
                                <div
                                  className="progress"
                                  style={{ height: 24 }}
                                >
                                  <div
                                    className={`progress-bar ${successRate >= 70 ? "bg-success" : successRate >= 40 ? "bg-warning" : "bg-danger"}`}
                                    style={{ width: "100%" }}
                                  >
                                    Hoàn thành - {successRate}% ngày không hút
                                    thuốc
                                  </div>
                                </div>
                                <small className="text-muted">
                                  Kế hoạch đã kết thúc
                                </small>
                              </div>
                            );
                          }
                          const totalDays = Math.ceil(
                            (endDate - startDate) / (1000 * 60 * 60 * 24),
                          );
                          const daysPassed = Math.ceil(
                            (today - startDate) / (1000 * 60 * 60 * 24),
                          );
                          const progressPercent = Math.round(
                            (daysPassed / totalDays) * 100,
                          );
                          const recentLogs = smokingHistory
                            .filter(
                              (log) =>
                                new Date(log.Date) >= startDate &&
                                new Date(log.Date) <= today,
                            )
                            .sort(
                              (a, b) => new Date(b.Date) - new Date(a.Date),
                            );
                          const noSmokingDays = recentLogs.filter(
                            (log) => log.Cigarettes === 0,
                          ).length;
                          const successRate =
                            noSmokingDays > 0
                              ? Math.round((noSmokingDays / daysPassed) * 100)
                              : 0;
                          return (
                            <div>
                              <div className="progress" style={{ height: 24 }}>
                                <div
                                  className={`progress-bar ${successRate >= 70 ? "bg-success" : successRate >= 40 ? "bg-warning" : "bg-danger"}`}
                                  style={{ width: `${progressPercent}%` }}
                                >
                                  {progressPercent}% - {successRate}% ngày không
                                  hút thuốc
                                </div>
                              </div>
                              <div className="mt-2 d-flex justify-content-between">
                                <small className="text-muted">
                                  {noSmokingDays} ngày không hút / {daysPassed}{" "}
                                  ngày đã qua
                                </small>
                                <small className="text-muted">
                                  Còn {totalDays - daysPassed} ngày
                                </small>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                      {/* Biểu đồ tiến độ cho kế hoạch coach */}
                      <div className="mt-4">
                        <label className="fw-bold mb-2">
                          Biểu đồ tiến độ hút thuốc (kế hoạch coach)
                        </label>
                        {(() => {
                          // Lấy dữ liệu lịch sử trong khoảng ngày của kế hoạch coach
                          const startDate = new Date(latestCoachPlan.StartDate);
                          const endDate = new Date(latestCoachPlan.TargetDate);
                          const chartData = [];
                          const chartLabels = [];
                          for (
                            let d = new Date(startDate);
                            d <= endDate;
                            d.setDate(d.getDate() + 1)
                          ) {
                            const dateStr = d.toISOString().slice(0, 10);
                            chartLabels.push(
                              d.toLocaleDateString("vi-VN", {
                                weekday: "short",
                                day: "2-digit",
                                month: "2-digit",
                              }),
                            );
                            const entry = smokingHistory.find(
                              (e) => e.Date.slice(0, 10) === dateStr,
                            );
                            chartData.push(entry ? entry.Cigarettes : 0);
                          }
                          return chartData.length > 0 ? (
                            <Line
                              data={{
                                labels: chartLabels,
                                datasets: [
                                  {
                                    label: "Số điếu hút",
                                    data: chartData,
                                    borderColor: "rgb(0, 123, 255)",
                                    backgroundColor: "rgba(0, 123, 255, 0.1)",
                                    tension: 0.4,
                                    fill: true,
                                  },
                                ],
                              }}
                              options={{
                                responsive: true,
                                interaction: {
                                  mode: "index",
                                  intersect: false,
                                },
                                plugins: {
                                  legend: { position: "top" },
                                  title: {
                                    display: true,
                                    text: "Biểu đồ hút thuốc theo kế hoạch coach",
                                  },
                                  tooltip: {
                                    callbacks: {
                                      afterBody: function (context) {
                                        const dataIndex = context[0].dataIndex;
                                        const cigarettes =
                                          chartData[dataIndex] || 0;
                                        return `\nSố điếu: ${cigarettes}`;
                                      },
                                    },
                                  },
                                },
                                scales: {
                                  x: { title: { display: true, text: "Ngày" } },
                                  y: {
                                    type: "linear",
                                    display: true,
                                    position: "left",
                                    title: {
                                      display: true,
                                      text: "Số điếu thuốc",
                                    },
                                    min: 0,
                                  },
                                },
                              }}
                            />
                          ) : (
                            <div className="text-center py-3">
                              <i className="fas fa-chart-line fa-2x text-muted mb-2"></i>
                              <p className="text-secondary">
                                Chưa có dữ liệu cho kế hoạch này.
                              </p>
                            </div>
                          );
                        })()}
                      </div>
                      <div className="mt-3 d-flex justify-content-end">
                        <button
                          className="btn btn-danger"
                          onClick={() => setShowDeleteModal(true)}
                        >
                          Hủy kế hoạch
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {stagedQuitPlan && (
                <div className="col-12">
                  <div className="card shadow-sm">
                    <div className="card-header bg-success text-white fw-bold d-flex justify-content-between align-items-center">
                      <span>Kế hoạch cai thuốc theo giai đoạn</span>
                      {loadingStagedPlan && (
                        <div
                          className="spinner-border spinner-border-sm"
                          role="status"
                        >
                          <span className="visually-hidden">Loading...</span>
                        </div>
                      )}
                    </div>
                    <div className="card-body">
                      {(() => {
                        const isCompleted =
                          stagedQuitPlan?.Status === "Completed";
                        if (isCompleted) {
                          // Calculate completion statistics
                          const completedStages =
                            stagedQuitPlan.stages?.filter(
                              (stage) =>
                                stage.Status?.toLowerCase() === "completed",
                            ).length || 0;
                          const totalStages =
                            stagedQuitPlan.stages?.length || 0;

                          // Calculate total cigarettes saved (approximation)
                          const startDate = new Date(stagedQuitPlan.StartDate);
                          const endDate = new Date(stagedQuitPlan.TargetDate);
                          const totalDays = Math.ceil(
                            (endDate - startDate) / (1000 * 60 * 60 * 24),
                          );
                          const averageCigarettesPerDay = 10; // Approximate
                          const totalCigarettesSaved =
                            totalDays * averageCigarettesPerDay;

                          return (
                            <div
                              className="alert alert-success mb-4"
                              role="alert"
                            >
                              <div className="d-flex align-items-center mb-2">
                                <i className="bi bi-trophy-fill fs-4 me-2"></i>
                                <h5 className="mb-0">
                                  Kế hoạch đã hoàn thành 🎉
                                </h5>
                              </div>
                              <div className="row text-center">
                                <div className="col-md-4">
                                  <div className="fw-bold text-success">
                                    {completedStages}/{totalStages}
                                  </div>
                                  <small className="text-muted">
                                    Giai đoạn hoàn thành
                                  </small>
                                </div>
                                <div className="col-md-4">
                                  <div className="fw-bold text-success">
                                    {new Date(
                                      stagedQuitPlan.TargetDate,
                                    ).toLocaleDateString("vi-VN")}
                                  </div>
                                  <small className="text-muted">
                                    Ngày hoàn thành
                                  </small>
                                </div>
                                <div className="col-md-4">
                                  <div className="fw-bold text-success">
                                    {totalCigarettesSaved.toLocaleString()}
                                  </div>
                                  <small className="text-muted">
                                    Điếu thuốc đã tiết kiệm
                                  </small>
                                </div>
                              </div>
                              <div className="mt-3 text-center">
                                <p className="mb-0 text-success">
                                  Chúc mừng bạn đã hoàn thành kế hoạch cai thuốc
                                  theo giai đoạn!
                                </p>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      })()}

                      <div className="mb-4">
                        <PlanActions
                          isCompleted={stagedQuitPlan?.Status === "Completed"}
                          onNew={() => setShowNewPlanForm(true)}
                          onArchive={() =>
                            archivePlan(
                              stagedQuitPlan.Id ||
                                stagedQuitPlan.id ||
                                stagedQuitPlan._id,
                            )
                          }
                          onCancel={() => setShowDeleteModal(true)}
                        />
                      </div>

                      <div className="mb-3">
                        <h5 className="text-primary">
                          {stagedQuitPlan.planName}
                        </h5>
                        <p className="text-muted">
                          {stagedQuitPlan.description}
                        </p>
                        <div className="row">
                          <div className="col-md-6">
                            <small className="text-muted">
                              Ngày bắt đầu:{" "}
                              {new Date(
                                stagedQuitPlan.StartDate,
                              ).toLocaleDateString("vi-VN")}
                            </small>
                          </div>
                          <div className="col-md-6">
                            <small className="text-muted">
                              Ngày kết thúc:{" "}
                              {new Date(
                                stagedQuitPlan.TargetDate,
                              ).toLocaleDateString("vi-VN")}
                            </small>
                          </div>
                        </div>
                      </div>

                      {/* Overall Progress */}
                      {(() => {
                        // Debug: log all stage statuses
                        console.log(
                          "MyProgressPage - All stage statuses:",
                          stagedQuitPlan.stages?.map((s) => ({
                            Id: s.Id,
                            Status: s.Status,
                          })),
                        );

                        // Check for both 'completed' and 'Completed' to handle case sensitivity
                        const completedStages =
                          stagedQuitPlan.stages?.filter(
                            (stage) =>
                              stage.Status?.toLowerCase() === "completed",
                          ).length || 0;
                        const totalStages = stagedQuitPlan.stages?.length || 6;
                        const overallProgress =
                          totalStages > 0
                            ? Math.round((completedStages / totalStages) * 100)
                            : 0;

                        console.log(
                          "MyProgressPage - Completed stages count:",
                          completedStages,
                          "Total stages:",
                          totalStages,
                        );

                        return (
                          <div className="mb-4">
                            <div className="d-flex justify-content-between align-items-center mb-2">
                              <span className="fw-bold">Tiến độ tổng thể:</span>
                              <span className="badge bg-primary">
                                {completedStages}/{totalStages} giai đoạn hoàn
                                thành
                              </span>
                            </div>
                            <div
                              className="progress"
                              style={{ height: "20px" }}
                            >
                              <div
                                className="progress-bar bg-success"
                                style={{ width: `${overallProgress}%` }}
                                role="progressbar"
                              >
                                {overallProgress}%
                              </div>
                            </div>
                          </div>
                        );
                      })()}

                      {/* Stages List */}
                      <div className="stages-container">
                        {stagedQuitPlan.stages &&
                        stagedQuitPlan.stages.length > 0 ? (
                          stagedQuitPlan.stages
                            .sort((a, b) => a.StageOrder - b.StageOrder)
                            .map((stage) => {
                              // The userStageId is the stage.Id itself since the backend query
                              // returns UserQuitPlanStages.Id as Id
                              console.log(
                                "MyProgressPage - Processing stage:",
                                stage,
                              );
                              const userStageId = stage.Id;
                              console.log(
                                "MyProgressPage - userStageId:",
                                userStageId,
                              );

                              return (
                                <QuitPlanStage
                                  key={stage.Id}
                                  stage={stage}
                                  userStageId={userStageId}
                                  onStageComplete={handleStageComplete}
                                />
                              );
                            })
                        ) : (
                          <div className="text-center py-5">
                            <i className="bi bi-list-ul fs-1 text-muted mb-3"></i>
                            <p className="text-muted">
                              Chưa có giai đoạn nào được thiết lập cho kế hoạch
                              này.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      {/* Modal xác nhận hủy kế hoạch */}
      <Modal
        show={showDeleteModal}
        onHide={() => setShowDeleteModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Xác nhận hủy kế hoạch</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            Bạn có chắc chắn muốn <b>hủy toàn bộ kế hoạch cai thuốc</b> không?
            Dữ liệu liên quan sẽ bị xóa khỏi hệ thống.
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Đóng
          </Button>
          <Button variant="danger" onClick={confirmDeletePlan}>
            Hủy kế hoạch
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Bottom-right notification popup */}
      <div
        className="position-fixed"
        style={{ bottom: "20px", right: "20px", zIndex: 9999 }}
      >
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`alert alert-${notification.type === "error" ? "danger" : "success"} alert-dismissible fade show mb-2`}
            style={{
              minWidth: "300px",
              maxWidth: "400px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
              animation: "slideInRight 0.3s ease-out",
            }}
            role="alert"
          >
            <div className="d-flex align-items-center">
              <i
                className={`bi ${notification.type === "error" ? "bi-exclamation-triangle-fill" : "bi-check-circle-fill"} me-2`}
              ></i>
              <span>{notification.message}</span>
            </div>
            <button
              type="button"
              className="btn-close"
              onClick={() => removeNotification(notification.id)}
              aria-label="Close"
            ></button>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default MyProgressPage;
