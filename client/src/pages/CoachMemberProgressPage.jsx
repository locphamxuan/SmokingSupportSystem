import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const CoachMemberProgressPage = () => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [progressHistory, setProgressHistory] = useState([]);
  const [memberInfo, setMemberInfo] = useState(null);
  const [smokingProfile, setSmokingProfile] = useState(null);
  const [coachQuitPlan, setCoachQuitPlan] = useState(null);
  const [systemQuitPlan, setSystemQuitPlan] = useState(null);
  const navigate = useNavigate();
  const { memberId } = useParams();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (memberId) {
      setLoading(true);
      setError('');
      axios.get(`http://localhost:5000/api/coach/member/${memberId}/progress`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => {
          setProgressHistory(res.data.history || []);
          setSmokingProfile(res.data.smokingProfile || null);
          setCoachQuitPlan(res.data.coachQuitPlan || null);
          setSystemQuitPlan(res.data.systemQuitPlan || null);
        })
        .catch(() => setError('Không thể tải tiến trình của thành viên.'))
        .finally(() => setLoading(false));
      axios.get(`http://localhost:5000/api/user/${memberId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => setMemberInfo(res.data))
        .catch(() => {});
    } else {
      setLoading(true);
      setError('');
      axios.get('http://localhost:5000/api/booking/accepted', {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => setMembers(res.data.bookings || []))
        .catch(() => setError('Không thể tải danh sách thành viên đã nhận lịch.'))
        .finally(() => setLoading(false));
    }
  }, [memberId]);

  if (loading) return <div className="container py-5 text-center">Đang tải dữ liệu...</div>;
  if (error) return <div className="container py-5 text-center text-danger">{error}</div>;

  if (memberId) {
    // Chuẩn bị dữ liệu biểu đồ
    const chartData = {
      labels: progressHistory.map(log => log.date ? new Date(log.date).toLocaleDateString() : ''),
      datasets: [
        {
          label: 'Số điếu thuốc mỗi ngày',
          data: progressHistory.map(log => log.cigarettes),
          fill: false,
          borderColor: '#1976d2',
          backgroundColor: '#1976d2',
          tension: 0.2
        }
      ]
    };
    const chartOptions = {
      responsive: true,
      plugins: {
        legend: { position: 'top' },
        title: { display: true, text: 'Biểu đồ số điếu thuốc theo ngày' }
      }
    };

    return (
      <div className="container py-4 mt-5">
        <button className="btn btn-link mb-3" onClick={() => navigate(-1)}>&larr; Quay lại</button>
        <h3 className="mb-4">Tiến trình của thành viên {memberInfo?.username || memberId}</h3>

        {/* Thông tin hồ sơ hút thuốc */}
        {smokingProfile && (
          <div className="mb-4">
            <h5>Thông tin hồ sơ hút thuốc</h5>
            <ul>
              <li>Số điếu/ngày: <b>{smokingProfile.cigarettesPerDay}</b></li>
              <li>Loại thuốc: <b>{smokingProfile.cigaretteType}</b></li>
              <li>Tần suất hút: <b>{smokingProfile.smokingFrequency}</b></li>
              <li>Lý do cai: <b>{smokingProfile.quitReason}</b></li>
              <li>Tình trạng sức khỏe: <b>{smokingProfile.healthStatus}</b></li>
            </ul>
          </div>
        )}

        {/* Kế hoạch do coach gán */}
        {coachQuitPlan && (
          <div className="mb-4">
            <h5>Kế hoạch cai thuốc do coach gán</h5>
            <ul>
              <li>Ngày bắt đầu: <b>{coachQuitPlan.startDate}</b></li>
              <li>Ngày mục tiêu: <b>{coachQuitPlan.targetDate}</b></li>
              <li>Số điếu ban đầu: <b>{coachQuitPlan.initialCigarettes}</b></li>
              <li>Giảm mỗi ngày: <b>{coachQuitPlan.dailyReduction}</b></li>
              <li>Mô tả: <b>{coachQuitPlan.planDetail}</b></li>
            </ul>
          </div>
        )}

        {/* Kế hoạch mẫu hệ thống */}
        {systemQuitPlan && (
          <div className="mb-4">
            <h5>Kế hoạch mẫu hệ thống</h5>
            <ul>
              <li>Ngày bắt đầu: <b>{systemQuitPlan.startDate}</b></li>
              <li>Ngày mục tiêu: <b>{systemQuitPlan.targetDate}</b></li>
              <li>Số điếu ban đầu: <b>{systemQuitPlan.initialCigarettes}</b></li>
              <li>Giảm mỗi ngày: <b>{systemQuitPlan.dailyReduction}</b></li>
              <li>Mô tả: <b>{systemQuitPlan.planDetail}</b></li>
            </ul>
          </div>
        )}

        {/* Biểu đồ tiến trình */}
        <div className="mb-4">
          <Line data={chartData} options={chartOptions} />
        </div>

        {/* Bảng lịch sử nhật ký */}
        <div className="mb-4">
          <h5>Lịch sử nhật ký hút thuốc</h5>
          {progressHistory.length === 0 ? (
            <div className="alert alert-info">Chưa có nhật ký tiến trình nào.</div>
          ) : (
            <table className="table table-bordered">
              <thead>
                <tr>
                  <th>Ngày</th>
                  <th>Số điếu thuốc</th>
                  <th>Cảm xúc/Ghi chú</th>
                </tr>
              </thead>
              <tbody>
                {progressHistory.map((log, idx) => (
                  <tr key={idx}>
                    <td>{log.date ? new Date(log.date).toLocaleDateString() : ''}</td>
                    <td>{log.cigarettes}</td>
                    <td>{log.feeling}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    );
  }

  // Lọc member duy nhất theo MemberId
  const uniqueMembers = Array.from(new Map(members.map(m => [m.MemberId, m])).values());

  return (
    <div className="container py-4 mt-5">
      <h3 className="mb-4">Danh sách thành viên đã nhận lịch</h3>
      {uniqueMembers.length === 0 ? (
        <div className="alert alert-info">Bạn chưa nhận lịch cho thành viên nào.</div>
      ) : (
        <ul className="list-group">
          {uniqueMembers.map(member => (
            <li key={member.MemberId} className="list-group-item d-flex align-items-center justify-content-between">
              <div className="d-flex align-items-center">
                <i className="bi bi-person-circle" style={{ fontSize: 36, marginRight: 12 }}></i>
                <span className="fw-bold">{member.MemberName || member.MemberId}</span>
              </div>
              <button className="btn btn-primary" onClick={() => navigate(`/coach/member/${member.MemberId}/progress`)}>
                Xem tiến trình
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default CoachMemberProgressPage; 