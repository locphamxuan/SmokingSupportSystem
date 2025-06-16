import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import facebookImage from '../assets/images/facebook.jpg';
import instagramImage from '../assets/images/instragram.jpg';
import '../style/ProfilePage.scss';
import 'bootstrap/dist/css/bootstrap.min.css';

const ProfilePage = () => {

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
    role: 'guest'
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
      
      console.log('Profile API response:', response.data);
      
      const userData = {
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
        }
      };
      
      console.log('Processed userData:', userData);
      setUserData(userData);
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
    if (user && user.role === "admin") {
      navigate("/admin/users");
    }
  }, [user, navigate]);



  const handleUpdateProfile = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
      if (!userData.username || !userData.email) {
        setError('Vui lòng nhập đầy đủ tên đăng nhập và email.');
        setLoading(false);
        return;
      }
      await axios.put('http://localhost:5000/api/auth/profile', {
        username: userData.username,
        email: userData.email,
        phoneNumber: userData.phoneNumber,
        address: userData.address
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess('Hồ sơ đã được cập nhật thành công!');
      setError('');
    } catch (error) {
      console.error("Lỗi khi cập nhật hồ sơ:", error);
      setError(error.response?.data?.message || 'Cập nhật hồ sơ thất bại. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSuccess('');
    setError('');
  };

  if (loading) {
    return (
      <div className="profile-wrapper">
        <div className="profile-container">
          <div className="d-flex align-items-center mb-3">
            <button
              onClick={() => navigate('/')}
              className="btn btn-outline-primary me-2"
            >
              <i className="fas fa-arrow-left me-2"></i>Quay lại trang chủ
            </button>
          </div>
          
          <h4 className="mb-3 fw-bold text-success">Hồ sơ cá nhân</h4>

          {/* Alert messages with dismissible functionality */}
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

          <div className="loading-spinner">
            <div className="spinner-border text-success" role="status">
              <span className="visually-hidden">Đang tải...</span>
            </div>
          </div>
        </div>

        <div className="footer bg-light text-dark py-4">
          <div className="container">
            <div className="social-icons">
              <a href="#" aria-label="Twitter" target="_blank" rel="noopener noreferrer">
                <i className="fab fa-twitter" style={{ fontSize: '36px' }}></i>
              </a>
              <a href="https://www.facebook.com/loccphamxuan?locale=vi_VN" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                <img src={facebookImage} alt="Facebook" style={{ width: '36px', height: '36px' }} />
              </a>
              <a href="https://www.instagram.com/xlocpham/" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                <img src={instagramImage} alt="Instagram" style={{ width: '36px', height: '36px' }} />
              </a>
              <a href="#" aria-label="YouTube" target="_blank" rel="noopener noreferrer">
                <i className="fab fa-youtube" style={{ fontSize: '36px' }}></i>
              </a>
            </div>
            <p className="copyright">
              &copy; 2024 Hỗ trợ cai nghiện. Đã đăng ký bản quyền.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-wrapper">
      <div className="profile-container">
        <div className="d-flex align-items-center mb-3">
          <button
            onClick={() => navigate('/')}
            className="btn btn-outline-primary me-2"
          >
            <i className="fas fa-arrow-left me-2"></i>Quay lại trang chủ
          </button>
        </div>
        
        <h4 className="mb-3 fw-bold text-success">Hồ sơ cá nhân</h4>

        {/* Alert messages with dismissible functionality */}
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

        <div className="card shadow-sm p-3">
          <div className="card-body">
            <div className="row">
              <div className="col-12 col-sm-6 mb-3">
                <label htmlFor="username" className="form-label">Tên đăng nhập</label>
                <input
                  type="text"
                  className="form-control"
                  id="username"
                  value={userData.username}
                  onChange={(e) => setUserData({ ...userData, username: e.target.value })}
                />
              </div>
              <div className="col-12 col-sm-6 mb-3">
                <label htmlFor="email" className="form-label">Email</label>
                <input
                  type="email"
                  className="form-control"
                  id="email"
                  value={userData.email}
                  onChange={(e) => setUserData({ ...userData, email: e.target.value })}
                  disabled
                />
              </div>
              <div className="col-12 col-sm-6 mb-3">
                <label htmlFor="phoneNumber" className="form-label">Số điện thoại</label>
                <input
                  type="text"
                  className="form-control"
                  id="phoneNumber"
                  value={userData.phoneNumber}
                  onChange={(e) => setUserData({ ...userData, phoneNumber: e.target.value })}
                />
              </div>
              <div className="col-12 col-sm-6 mb-3">
                <label htmlFor="address" className="form-label">Địa chỉ</label>
                <input
                  type="text"
                  className="form-control"
                  id="address"
                  value={userData.address}
                  onChange={(e) => setUserData({ ...userData, address: e.target.value })}
                />
              </div>
              <div className="col-12">
                <button className="btn btn-success" onClick={handleUpdateProfile} disabled={loading}>
                  Cập nhật Profile
                </button>
              </div>
            </div>
          </div>
        </div>

        {userData.role === 'guest' ? (
          <div className="card shadow-sm p-3 mt-3">
            <div className="card-body">
              <div className="row">
                <div className="col-12">
                  <p className="card-text">Bạn chưa được phân công huấn luyện viên.</p>
                  <button className="btn btn-primary" onClick={() => navigate('/booking')}>Đặt lịch</button>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <div className="footer bg-light text-dark py-4">
        <div className="container">
          <div className="social-icons">
            <a href="https://www.facebook.com/loccphamxuan?locale=vi_VN" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
              <img src={facebookImage} alt="Facebook" style={{ width: '36px', height: '36px' }} />
            </a>
            <a href="https://www.instagram.com/xlocpham/" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
              <img src={instagramImage} alt="Instagram" style={{ width: '36px', height: '36px' }} />
            </a>
           
          </div>
          <p className="copyright">
            &copy; 2024 Hỗ trợ cai nghiện. Đã đăng ký bản quyền.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage; 
