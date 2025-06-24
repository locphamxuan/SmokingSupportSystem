// Trang đăng ký gói nâng cấp

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Payment from '../components/Payment';
import axios from 'axios';
import facebookImage from "../assets/images/facebook.jpg";
import instagramImage from "../assets/images/instragram.jpg";
import "../style/SubscriptionPlans.scss";
import { getMembershipPackages } from '../services/extraService';

const SubscriptionPlans = () => {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);

  const features = {
    free: [
      'Theo dõi thời gian cai thuốc',
      'Nhật ký cai thuốc cơ bản',
      'Thống kê đơn giản',
      'Cộng đồng hỗ trợ'
    ],
    premium: [
      'Tất cả tính năng của gói Miễn phí',
      'Nhật ký chi tiết với hình ảnh',
      'Thống kê nâng cao',
      'Tư vấn chuyên gia',
      'Kế hoạch cai thuốc cá nhân hóa',
      'Ứng dụng không quảng cáo'
    ]
  };

  const handleUpgrade = () => {
    setPaymentOpen(true);
  };

  const handleCloseSnackbar = () => {
    setError('');
    setSuccess('');
  };

  const handlePaymentSuccess = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await axios.put('http://localhost:5000/api/auth/upgrade-member', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data && response.data.user) {
        // Ensure isMemberVip is a boolean
        const updatedUser = {
          ...response.data.user,
          isMemberVip: !!response.data.user.isMemberVip
        };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
        console.log('[SubscriptionPlans] User state after successful upgrade:', updatedUser); // DEBUG
        setSuccess('Nâng cấp tài khoản thành công!');
        setTimeout(() => {
          navigate('/profile');
        }, 2000);
      }
    } catch (error) {
      console.error('Lỗi khi nâng cấp tài khoản:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
      } else if (error.response?.status === 400) {
        setError(error.response.data.message || 'Không thể nâng cấp tài khoản. Vui lòng thử lại sau.');
      } else {
        setError('Không thể nâng cấp tài khoản. Vui lòng thử lại sau.');
      }
    }
  };

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    let currentUser = null;
    try {
      if (userStr && userStr !== 'undefined') {
        const parsedUser = JSON.parse(userStr);
        // Ensure isMemberVip is a boolean when initializing from localStorage
        currentUser = {
          ...parsedUser,
          isMemberVip: !!parsedUser.isMemberVip
        };
      }
    } catch (e) {
      currentUser = null;
    }

    if (!currentUser) {
      navigate('/login');
      return;
    }

    if (currentUser.role === "admin") {
      navigate("/admin/users");
      return;
    }

    setUser(currentUser);
    console.log('[SubscriptionPlans] Initial user state:', currentUser); // DEBUG

    // Lấy danh sách gói thành viên
    getMembershipPackages()
      .then((data) => {
        console.log('Membership packages data:', data);
        setPackages(data);
      })
      .catch((error) => {
        console.error('Error fetching membership packages:', error);
        // Fallback data nếu API không hoạt động
        const fallbackPackages = [
          {
            id: 1,
            name: 'Gói Miễn phí',
            price: 0,
            durationInDays: 0,
            description: 'Trải nghiệm các tính năng cơ bản'
          },
          {
            id: 2,
            name: 'Gói Premium',
            price: 99000,
            durationInDays: 30,
            description: 'Truy cập đầy đủ tất cả tính năng cao cấp'
          }
        ];
        setPackages(fallbackPackages);
      })
      .finally(() => setLoading(false));
  }, [navigate]);

  const isPremiumMember = user && (user.role === 'memberVip' || user.isMemberVip === true);
  console.log('[SubscriptionPlans] isPremiumMember:', isPremiumMember); // DEBUG
  console.log('[SubscriptionPlans] User role:', user?.role); // DEBUG
  console.log('[SubscriptionPlans] User isMemberVip:', user?.isMemberVip); // DEBUG

  console.log('SubscriptionPlans render - user:', user, 'loading:', loading, 'packages:', packages);

  if (!user || loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '50vh',
        fontSize: '18px'
      }}>
        Đang tải...
      </div>
    );
  }

  return (
    <div className="homepage" style={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
      <section className="subscription-plans-section" style={{ padding: '40px 0' }}>
        <div className="container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
          <div style={{ padding: '20px 0', textAlign: 'center' }}>
            <h1 style={{ color: '#333', marginBottom: '20px' }}>Gói Dịch Vụ</h1>
          </div>
          {isPremiumMember ? (
            <>
              <div className="card premium-status-card text-center mb-4">
                <i className="fas fa-award fa-5x mb-3"></i>
                <h2>
                  🎉 Bạn đã đăng ký gói Premium!
                </h2>
                <p>
                  Cảm ơn bạn đã tin tưởng và sử dụng dịch vụ Premium của chúng tôi.
                </p>
                <button
                  className="btn btn-lg rounded-pill"
                  onClick={() => navigate('/profile')}
                >
                  Quay về trang cá nhân
                </button>
              </div>

              <h3 className="text-center mb-4">
                Các tính năng Premium bạn đang sử dụng
              </h3>
              <div className="row justify-content-center">
                <div className="col-12 col-md-8">
                  <div className="card h-100">
                    <div className="card-body">
                      <h4 className="card-title mb-4">
                        Gói Premium - Đang hoạt động
                      </h4>
                      <ul className="list-unstyled mb-0">
                        {features.premium.map((feature, index) => (
                          <li key={index} className="d-flex align-items-center py-2">
                            <i className="fas fa-check-circle me-3"></i>
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <h2>
                Chọn gói phù hợp với bạn
              </h2>
              <p>
                Nâng cấp lên Premium để trải nghiệm đầy đủ tính năng.
              </p>
              <div className="row justify-content-center">
                {packages.map((pkg) => (
                  <div key={pkg.id} className="col-12 col-md-6 col-lg-5 mb-4">
                    <div className="card h-100">
                      <div className="card-body">
                        <h4>{pkg.name}</h4>
                        <h3>
                          {pkg.price === 0 ? 'Miễn phí' : `${pkg.price.toLocaleString()} VNĐ`}
                          {pkg.durationInDays > 0 && <span className="text-muted">/{pkg.durationInDays} ngày</span>}
                        </h3>
                        <p>{pkg.description}</p>
                        <hr className="my-3" />
                        <ul className="list-unstyled mb-0">
                          {(pkg.price === 0 ? features.free : features.premium).map((feature, index) => (
                            <li key={index} className="d-flex align-items-center py-2">
                              <i className="fas fa-check-circle me-3"></i>
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>
                        {pkg.price === 0 ? (
                          <button className="btn btn-lg btn-outline-secondary mt-4 rounded-pill" disabled>Đang sử dụng</button>
                        ) : (
                          <button className="btn btn-lg rounded-pill mt-4" onClick={handleUpgrade}>Nâng cấp ngay</button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Snackbar/Alert for messages */}
          {error && (
            <div className="alert alert-danger alert-dismissible fade show text-center mt-4" role="alert">
              {error}
              <button type="button" className="btn-close" onClick={handleCloseSnackbar} aria-label="Close"></button>
            </div>
          )}
          {success && (
            <div className="alert alert-success alert-dismissible fade show text-center mt-4" role="alert">
              {success}
              <button type="button" className="btn-close" onClick={handleCloseSnackbar} aria-label="Close"></button>
            </div>
          )}

          {paymentOpen && <Payment open={paymentOpen} onClose={() => setPaymentOpen(false)} onSuccess={handlePaymentSuccess} />}
        </div>
      </section>

      {/* Contact Section */}
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

export default SubscriptionPlans; 
