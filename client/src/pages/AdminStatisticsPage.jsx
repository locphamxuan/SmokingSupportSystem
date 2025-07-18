import React, { useEffect, useState } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Line, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend } from 'chart.js';
import '../style/AdminStatisticsPage.scss';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend);

const AdminStatisticsPage = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('http://localhost:5000/api/admin/statistics', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setStats(res.data);
      } catch (err) {
        setError('Không thể tải thống kê.');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}><div className="spinner-border text-success" role="status"><span className="visually-hidden">Loading...</span></div></div>;
  if (error) return <div className="alert alert-danger text-center mt-4">{error}</div>;
  if (!stats) return null;

  // Format tiền theo định dạng Việt Nam
  const formatMoney = (value) => {
    if (!value || value === 0) return '0 VNĐ';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  // Dữ liệu biểu đồ ngày
  const dailyLabels = stats.dailyStats.map(d => d.date);
  const dailySmokeFree = stats.dailyStats.map(d => d.smokeFreeDays);
  const dailyMoneySaved = stats.dailyStats.map(d => d.moneySaved);

  // Dữ liệu biểu đồ tháng
  const monthlyLabels = stats.monthlyStats.map(m => m.month);
  const monthlySmokeFree = stats.monthlyStats.map(m => m.smokeFreeDays);
  const monthlyMoneySaved = stats.monthlyStats.map(m => m.moneySaved);

  return (
    <div className="admin-statistics-page container py-4">
      <h2 className="mb-4 text-success fw-bold text-center">Thống kê hệ thống cai thuốc</h2>
      <div className="row g-4 mb-4">
        <div className="col-12 col-md-4">
          <div className="stat-card card shadow-sm text-center">
            <div className="card-body">
              <div className="stat-label">Tổng ngày không hút thuốc</div>
              <div className="stat-value text-primary fs-2 fw-bold">{stats.totalSmokeFreeDays}</div>
            </div>
          </div>
        </div>
        <div className="col-12 col-md-4">
          <div className="stat-card card shadow-sm text-center">
            <div className="card-body">
              <div className="stat-label">Tổng tiền tiết kiệm</div>
              <div className="stat-value text-success fs-2 fw-bold">{formatMoney(stats.totalMoneySaved)}</div>
            </div>
          </div>
        </div>
        <div className="col-12 col-md-4">
          <div className="stat-card card shadow-sm text-center">
            <div className="card-body">
              <div className="stat-label">Tổng tiền đã nhận</div>
              <div className="stat-value text-danger fs-2 fw-bold">{formatMoney(stats.totalReceived)}</div>
            </div>
          </div>
        </div>
      </div>
      <div className="row g-4">
        <div className="col-12 col-lg-6">
          <div className="card shadow-sm h-100">
            <div className="card-header bg-primary text-white fw-bold">Biểu đồ ngày (7 ngày gần nhất)</div>
            <div className="card-body">
              <Bar
                data={{
                  labels: dailyLabels,
                  datasets: [
                    {
                      label: 'Ngày không hút thuốc',
                      data: dailySmokeFree,
                      backgroundColor: 'rgba(40, 167, 69, 0.7)',
                    },
                    {
                      label: 'Tiền tiết kiệm',
                      data: dailyMoneySaved,
                      backgroundColor: 'rgba(255, 193, 7, 0.7)',
                      yAxisID: 'y1',
                    }
                  ]
                }}
                options={{
                  responsive: true,
                  plugins: {
                    legend: { position: 'top' },
                    title: { display: true, text: 'Thống kê theo ngày' },
                    tooltip: {
                      callbacks: {
                        label: function(context) {
                          const label = context.dataset.label || '';
                          const value = context.parsed.y;
                          if (label.includes('Tiền tiết kiệm')) {
                            return `${label}: ${formatMoney(value)}`;
                          }
                          return `${label}: ${value}`;
                        }
                      }
                    }
                  },
                  scales: {
                    y: { beginAtZero: true, title: { display: true, text: 'Ngày không hút' } },
                    y1: {
                      beginAtZero: true,
                      position: 'right',
                      title: { display: true, text: 'Tiền tiết kiệm (VNĐ)' },
                      grid: { drawOnChartArea: false },
                      ticks: {
                        callback: function(value) {
                          return formatMoney(value);
                        }
                      }
                    }
                  }
                }}
              />
            </div>
          </div>
        </div>
        <div className="col-12 col-lg-6">
          <div className="card shadow-sm h-100">
            <div className="card-header bg-info text-white fw-bold">Biểu đồ tháng (6 tháng gần nhất)</div>
            <div className="card-body">
              <Line
                data={{
                  labels: monthlyLabels,
                  datasets: [
                    {
                      label: 'Ngày không hút thuốc',
                      data: monthlySmokeFree,
                      borderColor: 'rgb(40, 167, 69)',
                      backgroundColor: 'rgba(40, 167, 69, 0.2)',
                      yAxisID: 'y',
                      tension: 0.4,
                      fill: true
                    },
                    {
                      label: 'Tiền tiết kiệm',
                      data: monthlyMoneySaved,
                      borderColor: 'rgb(255, 193, 7)',
                      backgroundColor: 'rgba(255, 193, 7, 0.2)',
                      yAxisID: 'y1',
                      tension: 0.4,
                      fill: true
                    }
                  ]
                }}
                options={{
                  responsive: true,
                  plugins: {
                    legend: { position: 'top' },
                    title: { display: true, text: 'Thống kê theo tháng' },
                    tooltip: {
                      callbacks: {
                        label: function(context) {
                          const label = context.dataset.label || '';
                          const value = context.parsed.y;
                          if (label.includes('Tiền tiết kiệm')) {
                            return `${label}: ${formatMoney(value)}`;
                          }
                          return `${label}: ${value}`;
                        }
                      }
                    }
                  },
                  scales: {
                    y: { beginAtZero: true, title: { display: true, text: 'Ngày không hút' } },
                    y1: {
                      beginAtZero: true,
                      position: 'right',
                      title: { display: true, text: 'Tiền tiết kiệm (VNĐ)' },
                      grid: { drawOnChartArea: false },
                      ticks: {
                        callback: function(value) {
                          return formatMoney(value);
                        }
                      }
                    }
                  }
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminStatisticsPage; 