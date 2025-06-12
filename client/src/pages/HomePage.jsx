import React, { useState } from 'react';
import '../style/HomePage.scss';

const HomePage = () => {
  const [activeTab, setActiveTab] = useState('posts');

  const recentPosts = [
    {
      id: 1,
      title: "Lợi ích sức khỏe khi bỏ thuốc lá",
      author: "dulcinea",
      timeAgo: "2h trước",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=dulcinea"
    },
    {
      id: 2,
      title: "Lời khuyên để vượt qua cơn thèm thuốc",
      author: "nga kim dung",
      timeAgo: "2 tiếng trước",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=nga"
    }
  ];

  const userRankings = [
    {
      id: 1,
      name: "Vinh N Thiện",
      timeQuit: "5 tháng",
      daysCount: "1 ngày 9",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=vinh"
    },
    {
      id: 2,
      name: "Uhin Nguyen Mặn",
      timeQuit: "6 tháng 3 ngày",
      daysCount: "2 ngày",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=uhin"
    },
    {
      id: 3,
      name: "Ngành Sau Trường",
      timeQuit: "6 tháng",
      daysCount: "2 ngày",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=nganh"
    }
  ];

  return (
    <div className="homepage">
      <div className="main-content">
        {/* Left Sidebar */}
        <aside className="sidebar">
          {/* Hero Section */}
          <div className="hero-section">
            <div className="hero-content">
              <h1 className="hero-title">
                Bắt đầu hành trình cai thuốc ngay hôm nay!
              </h1>
              <button className="btn-start">Bắt đầu</button>
            </div>
            <div className="hero-image">
              <img src="https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=300&h=200&fit=crop&crop=faces" alt="Mother and child" />
            </div>
          </div>

          {/* User Rankings */}
          <div className="section">
            <h2 className="section-title">Bảng xếp hạng<br />Người dùng xuất sắc</h2>
            <div className="user-list">
              {userRankings.map((user) => (
                <div key={user.id} className="user-item">
                  <img src={user.avatar} alt={user.name} className="user-avatar" />
                  <div className="user-info">
                    <div className="user-name">{user.name}</div>
                    <div className="user-time">{user.timeQuit}</div>
                  </div>
                  <div className="user-days">{user.daysCount}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Statistics */}
          <div className="stats-section">
            <div className="stat-item large">
              <div className="stat-number">1,500</div>
              <div className="stat-label">Người cùng cai thuốc</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">3</div>
              <div className="stat-label">Năm không hút thuốc</div>
            </div>
          </div>

          {/* Rewards Section */}
          <div className="section">
            <div className="section-header">
              <h2 className="section-title">Bảng xếp thưởng</h2>
              <a href="#" className="view-more">Tìm hiểu thêm »</a>
            </div>
            <div className="rewards">
              <div className="reward-item">
                <span className="reward-icon">💰</span>
                <div className="reward-info">
                  <div className="reward-amount">Số tiền tiết kiệm được</div>
                  {/* <div className="reward-desc">trong một thuốc</div> */}
                </div>
                <div className="reward-value">60 Triệu<br />đồng đã tiết kiệm</div>
              </div>
            </div>
            <div className="additional-stats">
              <div className="stat">
                <span className="stat-num">1,500</span>
                <span className="stat-desc">điếu thuốc đã bỏ</span>
              </div>
              <div className="stat">
                <span className="stat-num">3 năm</span>
                <span className="stat-desc">thời gian không hút thuốc</span>
              </div>
              <div className="stat">
                <span className="stat-num">600</span>
                <span className="stat-desc">Cải thiện sức khỏe</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="content">
          {/* Recent Posts Section */}
          <div className="posts-section">
            <div className="section-header">
              <h2 className="section-title">Bài Viết mới nhất</h2>
              <a href="#" className="view-more">Xem tất cả bài viết »</a>
            </div>
            
            <div className="posts-list">
              {recentPosts.map((post) => (
                <div key={post.id} className="post-item">
                  <img src={post.avatar} alt={post.author} className="post-avatar" />
                  <div className="post-content">
                    <h3 className="post-title">{post.title}</h3>
                    <div className="post-meta">
                      <span className="post-author">{post.author}</span>
                      <span className="post-time">{post.timeAgo}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Progress Stats */}
          <div className="progress-section">
            <div className="progress-item">
              <div className="progress-number">1,500</div>
              <div className="progress-label">Tổng số ngày</div>
              <div className="progress-desc">Số ngày không hút thuốc</div>
            </div>
            
            <div className="progress-item">
              <div className="progress-number">3 Năm</div>
              <div className="progress-label">Tổng thời gian không hút thuốc</div>
              <div className="progress-desc">Tiến trình cai thuốc của bạn</div>
            </div>
          </div>

          {/* Calendar */}
          <div className="calendar-section">
            <div className="calendar-header">
              <button className="calendar-nav">‹</button>
              <span className="calendar-title">April 2004</span>
              <button className="calendar-nav">›</button>
            </div>
            <div className="calendar">
              <div className="calendar-days">
                <div className="calendar-day-header">CN</div>
                <div className="calendar-day-header">T2</div>
                <div className="calendar-day-header">T3</div>
                <div className="calendar-day-header">T4</div>
                <div className="calendar-day-header">T5</div>
                <div className="calendar-day-header">T6</div>
                <div className="calendar-day-header">T7</div>
              </div>
              <div className="calendar-dates">
                {Array.from({length: 30}, (_, i) => (
                  <div key={i} className={`calendar-date ${i === 15 ? 'active' : ''}`}>
                    {i + 1}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>

        {/* Right Sidebar */}
        <aside className="right-sidebar">
          <div className="plan-section">
            <div className="plan-header">
              <h3>🎯 Kế hoạch cai thuốc của bạn</h3>
            </div>
            <div className="plan-tabs">
              <button className="plan-tab">Kế hoạch của tôi</button>
              <button className="plan-tab">Lịch hẹn</button>
              <button className="plan-tab">Nhật ký</button>
              <button className="plan-tab">Tư vấn</button>
              <button className="plan-tab">Thông tin chính</button>
            </div>
          </div>

          <div className="goal-section">
            <h3>Lập Kế hoạch cai Thuốc</h3>
            <div className="goal-tabs">
              <button className="goal-tab active">Lý do bỏ thuốc</button>
              <button className="goal-tab">Phương pháp</button>
              <button className="goal-tab">Thời gian</button>
            </div>
            
            <div className="goal-content">
              <h4>Lý do bỏ thuốc của bạn là gì?</h4>
              <div className="goal-options">
                <div className="goal-option">
                  <span className="goal-icon">⚕️</span>
                  <span>Sức khỏe</span>
                </div>
                <div className="goal-option">
                  <span className="goal-icon">👨‍👩‍👧‍👦</span>
                  <span>Gia đình</span>
                </div>
                <div className="goal-option">
                  <span className="goal-icon">💰</span>
                  <span>Tài chính</span>
                </div>
                <div className="goal-option">
                  <span className="goal-icon">💼</span>
                  <span>Công việc</span>
                </div>
              </div>
              <div className="goal-other">
                <span>Lý do khác</span>
              </div>
              <button className="btn-continue">Tiếp theo</button>
            </div>
          </div>

          <div className="bottom-section">
            <div className="plan-create">
              <h3>🎯 Lập kế hoạch</h3>
              <div className="plan-create-tabs">
                <button className="plan-create-tab">Lý do</button>
                <button className="plan-create-tab">Phương pháp</button>
                <button className="plan-create-tab">Thời gian</button>
                {/* <button className="plan-create-tab active">Telo voc</button> */}
              </div>
              
              <h3>Lập Kế hoạch</h3>
              <div className="final-tabs">
                <button className="final-tab active">Lý do bỏ thuốc</button>
                <button className="final-tab">Phương pháp</button>
                <button className="final-tab">Thời gian</button>
              </div>
            </div>
          </div>
        </aside>
      </div>
      <footer className="footer">
        {/* Footer content */}
      </footer>
    </div>
  );
};

export default HomePage;