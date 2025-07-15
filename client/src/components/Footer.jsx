import React from 'react';
import { Link } from 'react-router-dom';
import '../style/Footer.scss';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-top">
          <div className="footer-section">
            <h4>Về chúng tôi</h4>
            <div className="footer-underline"></div>
            <p>
              Hỗ trợ cai nghiện thuốc lá là sứ mệnh của chúng tôi. Chúng tôi cam
              kết đồng hành cùng bạn trên hành trình hướng tới một cuộc sống
              khỏe mạnh hơn.
            </p>
          </div>

          <div className="footer-section">
            <h4>Liên kết nhanh</h4>
            <div className="footer-underline"></div>
            <ul>
              <li><a href="/about">Thông tin về thuốc lá</a></li>
              <li><a href="/blog">Cộng đồng</a></li>
              <li><a href="/leaderboard">Bảng xếp hạng</a></li>
            </ul>
          </div>

          <div className="footer-section">
            <h4>Dịch vụ hỗ trợ</h4>
            <div className="footer-underline"></div>
            <ul>
              <li><Link to="/consultation">Tư vấn trực tuyến</Link></li>
              <li><Link to="/community">Cộng đồng</Link></li>
              <li><Link to="/resources">Tài nguyên</Link></li>
              <li><Link to="/faq">FAQ</Link></li>
            </ul>
          </div>

          <div className="footer-section">
            <h4>Liên hệ</h4>
            <div className="footer-underline"></div>
            <ul className="contact-info">
              <li>
                <i className="fas fa-phone"></i>
                <span>Hotline: 1800-xxxx</span>
              </li>
              <li>
                <div className="contact-item" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <i className="bi bi-envelope"></i>
                  <span>Email</span>
                  <span className="ms-2">support@smokingsupport.com</span>
                </div>
              </li>
              <li>
                <i className="fas fa-clock"></i>
                <span>Hỗ trợ 24/7</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="footer-middle">
          <div className="emergency-support">
            <i className="fas fa-headset"></i>
            <div className="emergency-content">
              <h5>Cần hỗ trợ khẩn cấp?</h5>
              <p>Gọi ngay: <strong>1800-xxxx</strong></p>
            </div>
          </div>

          <div className="social-icons">
            <a href="https://www.facebook.com/loccphamxuan" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
              <i className="fab fa-facebook"></i>
            </a>
            <a href="https://www.instagram.com/xlocpham/" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
              <i className="fab fa-instagram"></i>
            </a>
          </div>
        </div>

        <div className="footer-bottom">
          <div className="footer-logo">
            <img src="/logo-leaf.png" alt="Smoking Support Logo" />
            <div className="logo-text">
              <span className="logo-title">Hỗ trợ cai nghiện</span>
              <span className="logo-subtitle">Vì cuộc sống khỏe mạnh hơn</span>
            </div>
          </div>

          <div className="footer-info">
            <p className="copyright">
              &copy; 2024 Hỗ trợ cai nghiện. Đã đăng ký bản quyền.
            </p>
            <div className="footer-links">
              <a href="/privacy">Chính sách bảo mật</a>
              <span className="separator">|</span>
              <a href="/terms">Điều khoản sử dụng</a>
              <span className="separator">|</span>
              <a href="/sitemap">Sơ đồ trang</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;