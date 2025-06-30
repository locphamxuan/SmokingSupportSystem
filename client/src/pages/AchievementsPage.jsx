import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import '../style/AchievementsPage.scss';
import Badge1Day from '../assets/badges/huyhiệu1ngày.jpg';
import Badge3Days from '../assets/badges/huyhiệu3ngày.jpg';
import Badge5Days from '../assets/badges/huyhiệu5ngày.jpg';
import Badge7Days from '../assets/badges/huyhiệu7ngày.jpg';
import Badge14Days from '../assets/badges/huyhiệu14ngày.jpg';
import Badge30Days from '../assets/badges/huyhiệu30ngày.jpg';
import Badge60Days from '../assets/badges/huyhiệu60ngày.jpg';

const allBadges = [
  { id: 1, name: "1 Ngày Không Hút Thuốc", description: "Bạn đã vượt qua ngày đầu tiên không hút thuốc!", requirement: 1, image: Badge1Day },
  { id: 2, name: "3 Ngày Kiên Trì", description: "Ba ngày liên tiếp không hút thuốc - một thành tích đáng nể!", requirement: 3, image: Badge3Days },
  { id: 3, name: "5 Ngày Mạnh Mẽ", description: "Năm ngày không hút thuốc - bạn đang làm rất tốt!", requirement: 5, image: Badge5Days },
  { id: 4, name: "1 Tuần Thành Công", description: "Một tuần không hút thuốc - một cột mốc quan trọng!", requirement: 7, image: Badge7Days },
  { id: 5, name: "2 Tuần Kiên Định", description: "Hai tuần không hút thuốc - bạn đang thay đổi thói quen!", requirement: 14, image: Badge14Days },
  { id: 6, name: "1 Tháng Phi Thường", description: "Một tháng không hút thuốc - thành tích xuất sắc!", requirement: 30, image: Badge30Days },
  { id: 7, name: "2 Tháng Chiến Thắng", description: "Hai tháng không hút thuốc - bạn đã thực sự thay đổi!", requirement: 60, image: Badge60Days }
];

const AchievementsPage = () => {
  const { user } = useAuth();
  const userBadges = user?.achievements || [];
  const isUserBadge = (badgeId) => userBadges.some(b => Number(b.BadgeId || b.Id) === Number(badgeId));
  const getUserBadgeInfo = (badgeId) => userBadges.find(b => Number(b.BadgeId || b.Id) === Number(badgeId));

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
          const earned = isUserBadge(badge.id);
          const userBadgeInfo = getUserBadgeInfo(badge.id);
          return (
            <div className="col-12 col-sm-6 col-md-4 col-lg-3 d-flex" key={badge.id}>
              <div className={`card w-100 shadow-sm h-100 border-0 ${earned ? 'badge-earned' : 'badge-locked'} position-relative`}>
                <div className="card-body d-flex flex-column align-items-center justify-content-center text-center">
                  <div className="mb-3 position-relative">
                    <img
                      src={badge.image}
                      alt={badge.name}
                      className={`badge-img mb-3 ${earned ? '' : 'locked-img'}`}
                      style={{ width: 80, height: 80, objectFit: 'contain', filter: !earned ? 'grayscale(1) brightness(0.7)' : 'none', borderRadius: 12, boxShadow: earned ? '0 0 12px #28a74555' : 'none' }}
                    />
                    {!earned && (
                      <span className="position-absolute top-50 start-50 translate-middle text-secondary" style={{fontSize: '2rem', opacity: 0.7}}>
                        <i className="fas fa-lock"></i>
                      </span>
                    )}
                  </div>
                  <h5 className={`card-title fw-bold mb-2 ${earned ? 'text-success' : 'text-muted'}`}>{badge.name}</h5>
                  <p className="card-text small mb-2 text-secondary">{badge.description}</p>
                  <span className={`badge ${earned ? 'bg-success' : 'bg-warning text-dark'} mb-2`}>
                    {earned ? 'Đã đạt' : `Cần ${badge.requirement} ngày`}
                  </span>
                  {earned && userBadgeInfo && (
                    <div className="small text-muted mt-1">
                      <i className="fas fa-calendar-check me-1"></i>
                      {new Date(userBadgeInfo.AwardedAt).toLocaleDateString('vi-VN')}
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