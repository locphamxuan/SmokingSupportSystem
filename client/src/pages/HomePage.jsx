import React from 'react';
import './HomePage.scss';

const HomePage = () => {
  const userRankings = [
    {
      id: 1,
      name: "Vinh N Thiện",
      timeQuit: "5 tháng",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=vinh"
    },
    {
      id: 2,
      name: "Uhin Nguyen Mặn", 
      timeQuit: "6 tháng 3 ngày",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=uhin"
    },
    {
      id: 3,
      name: "Ngành sau Trường",
      timeQuit: "6 tháng",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=nganh"
    }
  ];

  const recentPosts = [
    {
      id: 1,
      title: "Lợi ích sức khỏe khi bỏ thuốc lá",
      author: "Dulcinea",
      timeAgo: "2h trước",
      content: "Sau 1 tuần bỏ thuốc, hệ hô hấp đã cải thiện rõ rệt..."
    },
    {
      id: 2,
      title: "Lời khuyên để vượt qua cơn thèm thuốc",
      author: "Nga Kim Dung",
      timeAgo: "2 tiếng trước",
      content: "Uống nhiều nước, tập thể dục và thiền định..."
    }
  ];

  return (
    <div className="homepage">
      {/* Phần 1: Giới thiệu */}
      <section className="intro-section">
        <div className="intro-content">
          <h1>Hành trình cai thuốc lá bắt đầu từ hôm nay</h1>
          <p>Chúng tôi cung cấp công cụ và hỗ trợ bạn cai thuốc lá hiệu quả thông qua:</p>
          <div className="features">
            <div className="feature-item">
              <span className="feature-icon">📊</span>
              <h3>Theo dõi tiến trình</h3>
              <p>Ghi nhận và đánh giá quá trình cai thuốc</p>
            </div>
            <div className="feature-item">
              <span className="feature-icon">👥</span>
              <h3>Hỗ trợ cộng đồng</h3>
              <p>Chia sẻ và động viên từ người đồng hành</p>
            </div>
            <div className="feature-item">
              <span className="feature-icon">🎯</span>
              <h3>Mục tiêu cá nhân</h3>
              <p>Đặt và đạt được các mốc quan trọng</p>
            </div>
          </div>
        </div>
      </section>

      {/* Phần 2: Bảng xếp hạng */}
      <section className="rankings-section">
        <h2>Bảng xếp hạng thành tích</h2>
        <div className="user-list">
          {userRankings.map((user) => (
            <div key={user.id} className="user-item">
              <img src={user.avatar} alt={user.name} className="user-avatar" />
              <div className="user-info">
                <div className="user-name">{user.name}</div>
                <div className="user-time">Thời gian cai: {user.timeQuit}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Phần 3: Bài viết chia sẻ */}
      <section className="blog-section">
        <h2>Kinh nghiệm cai thuốc lá</h2>
        <div className="posts-list">
          {recentPosts.map((post) => (
            <div key={post.id} className="post-item">
              <h3 className="post-title">{post.title}</h3>
              <p className="post-content">{post.content}</p>
              <div className="post-meta">
                <span className="post-author">{post.author}</span>
                <span className="post-time">{post.timeAgo}</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default HomePage;
