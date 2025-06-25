import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../style/CoachMemberProgressPage.scss';
import facebookImage from '../assets/images/facebook.jpg';
import instagramImage from '../assets/images/instragram.jpg';

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
  const [smokingHistory, setSmokingHistory] = useState([]);
  const [currentWeek, setCurrentWeek] = useState(1);

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

  const fetchMemberSmokingHistory = async () => {
    try {
      console.log('🔍 Fetching smoking history for memberId:', memberId);
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:5000/api/hlv/member/${memberId}/smoking-history`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('✅ Member smoking history response:', response.data);
      setSmokingHistory(response.data.history || []);
    } catch (err) {
      console.error('❌ Error fetching member smoking history:', err);
      setSmokingHistory([]);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      if (memberId) {
        setLoading(true);
        await Promise.all([
          fetchMemberProgress(),
          fetchAllBadges(),
          fetchMemberBadges(),
          fetchMemberSmokingHistory()
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

  const getTotalWeeks = () => {
    if (!quitPlan) return 0;
    
    const startDate = new Date(quitPlan.startDate);
    const endDate = new Date(quitPlan.targetDate);
    const diffTime = Math.abs(endDate - startDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.ceil(diffDays / 7);
  };

  const getWeekDataFromPlan = (weekNumber) => {
    if (!quitPlan) return [];

    const startDate = new Date(quitPlan.startDate);
    const weekStartDate = new Date(startDate);
    weekStartDate.setDate(startDate.getDate() + (weekNumber - 1) * 7);
    
    const weekData = [];
    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(weekStartDate);
      currentDate.setDate(weekStartDate.getDate() + i);
      
      if (currentDate > new Date(quitPlan.targetDate)) break;
      
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
          <div className="card-header d-flex justify-content-between align-items-center">
            <h5 className="mb-0">🎯 Kế hoạch cai thuốc</h5>
            {quitPlan && (
              <span className={`badge ${quitPlan.planSource === 'custom' ? 'bg-primary' : 'bg-success'}`}>
                {quitPlan.planSource === 'custom' ? '📝 Kế hoạch tự tạo' : '🤖 Kế hoạch gợi ý'}
              </span>
            )}
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
                
                {/* Tiến độ hiện tại */}
                <div className="my-3">
                  <label className="fw-bold">Tiến độ hiện tại:</label>
                  {(() => {
                    const startDate = new Date(quitPlan.startDate);
                    const endDate = new Date(quitPlan.targetDate);
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

        {/* Biểu đồ tiến độ hút thuốc */}
        {quitPlan && (
          <div className="card my-4">
            <div className="card-header bg-success text-white fw-bold d-flex justify-content-between align-items-center">
              <span>📊 Biểu đồ tiến độ hút thuốc</span>
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
                const weekData = getWeekDataFromPlan(currentWeek);
                
                const totalCigarettes = weekData.reduce((sum, entry) => sum + (entry.cigarettes || 0), 0);
                const averagePerDay = weekData.length > 0 ? (totalCigarettes / weekData.length).toFixed(1) : 0;
                const daysWithoutSmoking = weekData.filter(entry => (entry.cigarettes || 0) === 0).length;
                const currentStreak = calculateCurrentStreak(weekData);

                return (
                  <div>
                    {/* Statistics Cards */}
                    <div className="row mb-4">
                      <div className="col-md-3">
                        <div className="card bg-primary text-white">
                          <div className="card-body text-center">
                            <h6 className="card-title">Tổng điếu tuần</h6>
                            <h4>{totalCigarettes}</h4>
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
                    </div>

                    {/* Chart */}
                    {weekData.length > 0 ? (
                      <Line
                        data={{
                          labels: weekData.map(entry => 
                            new Date(entry.date).toLocaleDateString('vi-VN', { 
                              weekday: 'short',
                              day: '2-digit',
                              month: '2-digit'
                            })
                          ),
                          datasets: [
                            {
                              label: 'Số điếu hút',
                              data: weekData.map(entry => entry.cigarettes || 0),
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
                                  const cigarettes = weekData[dataIndex].cigarettes || 0;
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
                        <p className="text-muted small">Thành viên chưa cập nhật nhật ký cho tuần này!</p>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        )}

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