import React, { useState, useEffect } from 'react';
import axios from 'axios';
import StatCard from '../components/StatCard';
import "../style/AdminStatisticsPage.scss";

const AdminStatisticsPage = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchStatistics = async () => {
        try {
            setLoading(true);
            setError(null);

            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('Token không hợp lệ');
            }

            const response = await axios.get('http://localhost:5000/api/admin/statistics', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            setStats(response.data);
            
        } catch (err) {
            console.error('Error fetching statistics:', err);
            setError('Không thể tải dữ liệu thống kê. Vui lòng thử lại sau.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStatistics();
    }, []);

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(value || 0);
    };

    if (error) {
        return (
            <div className="admin-statistics-page">
                <div className="error-container">
                    <div className="alert alert-danger">
                        <i className="bi bi-exclamation-triangle-fill me-2"></i>
                        {error}
                    </div>
                    <button 
                        className="btn btn-primary mt-3"
                        onClick={fetchStatistics}
                    >
                        <i className="bi bi-arrow-clockwise me-2"></i>
                        Thử lại
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="admin-statistics-page">
            <div className="header-section">
                <h1>Thống kê hệ thống</h1>
                <p className="last-updated">
                    Cập nhật lúc: {new Date().toLocaleString('vi-VN')}
                </p>
            </div>

            <div className="stats-grid">
                <StatCard
                    title="Thống kê người dùng"
                    icon="people"
                    loading={loading}
                    data={[
                        { 
                            label: 'Tổng người dùng', 
                            value: stats?.userStats?.totalUsers || 0 
                        },
                        { 
                            label: 'Huấn luyện viên', 
                            value: stats?.userStats?.activeCoaches || 0 
                        },
                        { 
                            label: 'Thành viên VIP', 
                            value: stats?.userStats?.vipMembers || 0 
                        }
                    ]}
                />

                <StatCard
                    title="Thống kê doanh thu"
                    icon="cash"
                    loading={loading}
                    data={[
                        { 
                            label: 'Doanh thu tư vấn', 
                            value: formatCurrency(stats?.bookingStats?.totalRevenue) 
                        },
                        { 
                            label: 'Doanh thu gói VIP',
                            value: formatCurrency(stats?.membershipStats?.totalRevenue)
                        }
                    ]}
                />

                <StatCard
                    title="Hoạt động hệ thống" 
                    icon="activity"
                    loading={loading}
                    data={[
                        { 
                            label: 'Lịch tư vấn hoàn thành', 
                            value: stats?.bookingStats?.completedBookings || 0 
                        },
                        { 
                            label: 'Bài viết', 
                            value: stats?.contentStats?.posts || 0 
                        },
                        { 
                            label: 'Bình luận', 
                            value: stats?.contentStats?.comments || 0 
                        }
                    ]}
                />
            </div>
        </div>
    );
};

export default AdminStatisticsPage;
