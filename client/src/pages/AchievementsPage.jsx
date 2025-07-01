import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getUserBadges, getAllBadges } from '../services/authService';
import '../style/AchievementsPage.scss';
import Badge1Day from '../assets/badges/huyhiệu1ngày.jpg';
import Badge3Days from '../assets/badges/huyhiệu3ngày.jpg';
import Badge5Days from '../assets/badges/huyhiệu5ngày.jpg';
import Badge7Days from '../assets/badges/huyhiệu7ngày.jpg';
import Badge14Days from '../assets/badges/huyhiệu14ngày.jpg';
import Badge30Days from '../assets/badges/huyhiệu30ngày.jpg';
import Badge60Days from '../assets/badges/huyhiệu60ngày.jpg';

// Map BadgeType to images
const badgeImages = {
  'loai1': Badge1Day,
  'loai2': Badge3Days,
  'loai3': Badge5Days,
  'loai4': Badge7Days,
  'loai5': Badge14Days,
  'loai6': Badge30Days,
  'loai7': Badge60Days
};

const AchievementsPage = () => {
  const { user } = useAuth();
  const [userBadges, setUserBadges] = useState([]);
  const [allBadges, setAllBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch cả user badges và all badges từ server
  useEffect(() => {
    const fetchBadgesData = async () => {
      try {
        setLoading(true);
        
        // Fetch parallel để tăng tốc độ
        const [userBadgesResponse, allBadgesResponse] = await Promise.all([
          getUserBadges(),
          getAllBadges()
        ]);
        
        console.log('AchievementsPage - Fetched user badges:', userBadgesResponse.badges);
        console.log('AchievementsPage - Fetched all badges:', allBadgesResponse.badges);
        
        setUserBadges(userBadgesResponse.badges || []);
        setAllBadges(allBadgesResponse.badges || []);
      } catch (error) {
        console.error('Error fetching badges data:', error);
        setError('Không thể tải dữ liệu huy hiệu. Vui lòng thử lại sau.');
        setUserBadges([]);
        setAllBadges([]);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchBadgesData();
    }
  }, [user]);

  // Hàm format ngày tháng phù hợp với dữ liệu từ SQL Server
  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    try {
      // Parse directly from string to avoid timezone issues
      if (dateString.includes('T') || dateString.includes(' ')) {
        const [datePart, timePart] = dateString.split(/[T ]/);
        const [year, month, day] = datePart.split('-');
        const [hours, minutes] = timePart ? timePart.split(':') : ['00', '00'];
        return `${day}/${month}/${year} ${hours}:${minutes}`;
      }
      
      // Fallback for other formats
      const date = new Date(dateString);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${day}/${month}/${year} ${hours}:${minutes}`;
    } catch (error) {
      console.error('Error formatting date:', error);
      return dateString; // Return original if parsing fails
    }
  };

  const isUserBadge = (badgeId) => userBadges.some(b => Number(b.BadgeId || b.Id) === Number(badgeId));
  const getUserBadgeInfo = (badgeId) => userBadges.find(b => Number(b.BadgeId || b.Id) === Number(badgeId));

  if (loading) {
    return (
      <div className="container achievements-bootstrap-page py-5">
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
          <div className="spinner-border text-success" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container achievements-bootstrap-page py-5">
        <div className="alert alert-danger text-center" role="alert">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="container achievements-bootstrap-page py-5">
      <div className="text-center mb-5">
        <h1 className="display-4 fw-bold text-success mb-3"> Thành Tích Cai Thuốc Của Bạn </h1>
        <p className="lead text-secondary">Theo dõi hành trình và các mốc quan trọng bạn đã đạt được</p>
        <span className="badge bg-primary fs-6 px-3 py-2 mb-2">
          {userBadges.length}/{allBadges.length} Huy hiệu đã đạt được
        </span>
      </div>
      <div className="row g-4 justify-content-center">
        {allBadges.map((badge) => {
          const earned = isUserBadge(badge.Id);
          const userBadgeInfo = getUserBadgeInfo(badge.Id);
          const badgeImage = badgeImages[badge.BadgeType] || badgeImages['loai1'];
          
          return (
            <div className="col-12 col-sm-6 col-md-4 col-lg-3 d-flex" key={badge.Id}>
              <div className={`card w-100 shadow-sm h-100 border-0 ${earned ? 'badge-earned' : 'badge-locked'} position-relative`}>
                <div className="card-body d-flex flex-column align-items-center justify-content-center text-center">
                  <div className="mb-3 position-relative">
                    <img
                      src={badgeImage}
                      alt={badge.Name}
                      className={`badge-img mb-3 ${earned ? '' : 'locked-img'}`}
                      style={{ width: 80, height: 80, objectFit: 'contain', filter: !earned ? 'grayscale(1) brightness(0.7)' : 'none', borderRadius: 12, boxShadow: earned ? '0 0 12px #28a74555' : 'none' }}
                    />
                    {!earned && (
                      <span className="position-absolute top-50 start-50 translate-middle text-secondary" style={{fontSize: '2rem', opacity: 0.7}}>
                        <i className="fas fa-lock"></i>
                      </span>
                    )}
                  </div>
                  <h5 className={`card-title fw-bold mb-2 ${earned ? 'text-success' : 'text-muted'}`}>{badge.Name}</h5>
                  <p className="card-text small mb-2 text-secondary">{badge.Description}</p>
                  <span className={`badge ${earned ? 'bg-success' : 'bg-warning text-dark'} mb-2`}>
                    {earned ? 'Đã đạt' : `Cần ${badge.Requirement} ngày`}
                  </span>
                  {earned && userBadgeInfo && (
                    <div className="small text-muted mt-1">
                      <i className="fas fa-calendar-check me-1"></i>
                      {formatDate(userBadgeInfo.AwardedAt)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AchievementsPage;