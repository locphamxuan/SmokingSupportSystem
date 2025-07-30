import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.jsx";
import "../style/HomePage.scss";
import solutionsRightImage from "../assets/images/anh3.jpg";
import stepsLeftImage from "../assets/images/anh4.jpg";
import expertImage1 from "../assets/images/anh5.jpg";
import expertImage2 from "../assets/images/anh6.jpg";
import expertImage3 from "../assets/images/anh7.jpg";
import testimonialImage1 from "../assets/images/anh8.jpg";
import testimonialImage2 from "../assets/images/anh9.jpg";
import testimonialImage3 from "../assets/images/anh10.jpg";
import facebookImage from "../assets/images/facebook.jpg";
import instagramImage from "../assets/images/instragram.jpg";
import homepagebackground2 from "../assets/images/homepagebackground2.jpg";
import backgroundhomepage from "../assets/images/backr0undh0mepage.jpg";

const HomePage = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);

  console.log("HomePage render:", { user, isAuthenticated });

  const slides = [
    {
      id: 1,
      title: "Chào mừng bạn đến với hành trình cai nghiện thuốc lá",
      subtitle:
        "Tìm lại cuộc sống không khói thuốc với sự hỗ trợ từ cộng đồng và các chuyên gia hàng đầu.",
      image: homepagebackground2,
    },
    {
      id: 2,
      title: "Bắt đầu cuộc sống mới không thuốc lá",
      subtitle:
        "Chúng tôi sẽ đồng hành cùng bạn trên con đường cai nghiện thành công.",
      image: backgroundhomepage,
    },
  ];

  const testimonials = [
    {
      id: 1,
      text: "Tôi đã cai nghiện thành công nhờ sự hỗ trợ từ cộng đồng và các chuyên gia tại đây. Cảm ơn rất nhiều!",
      author: "Nguyễn Văn A",
      location: "Hà Nội",
      image: testimonialImage1,
    },
    {
      id: 2,
      text: "Chương trình cai nghiện này đã giúp tôi tìm lại sức khỏe và sự tự tin. Tôi rất hạnh phúc!",
      author: "Trần Thị B",
      location: "TP.HCM",
      image: testimonialImage2,
    },
    {
      id: 3,
      text: "Tôi không thể tin được mình đã cai nghiện thành công sau nhiều năm. Đây là một phép màu!",
      author: "Lê Văn C",
      location: "Đà Nẵng",
      image: testimonialImage3,
    },
  ];

  const [currentSlide, setCurrentSlide] = useState(0);
  const [currentTestimonial, setCurrentTestimonial] = useState(testimonials[0]);

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const handleNavigation = (path) => {
    console.log("HomePage navigation to:", path);
    navigate(path);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Đang tải...</p>
      </div>
    );
  }

  return (
    <div className="homepage">
      {/* Hero Section */}
      <section className="hero-section">
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={`hero-slide ${index === currentSlide ? "active" : ""}`}
          >
            <div className="hero-left-content">
              <div className="container">
                <h1>{slide.title}</h1>
                <p className="subtitle">{slide.subtitle}</p>
                <div className="features">
                  <div className="feature">
                    <i className="fas fa-user"></i>
                    <span>Lộ trình cá nhân hóa</span>
                  </div>
                  <div className="feature">
                    <i className="fas fa-headset"></i>
                    <span>Hỗ trợ 24/7</span>
                  </div>
                  <div className="feature">
                    <i className="fas fa-globe"></i>
                    <span>Kết nối toàn cầu</span>
                  </div>
                </div>
                <div className="cta-buttons">
                  <Link to="/about" className="btn btn-primary">
                    Tìm hiểu thêm <span className="arrow">→</span>
                  </Link>
                  <Link to="/community" className="btn btn-secondary">
                    Tham gia cộng đồng
                  </Link>
                </div>
              </div>
            </div>
            <div className="hero-right-image">
              <img src={slide.image} alt={slide.title} />
            </div>
          </div>
        ))}
        <div className="slide-dots">
          {slides.map((_, index) => (
            <span
              key={index}
              className={`dot ${index === currentSlide ? "active" : ""}`}
              onClick={() => setCurrentSlide(index)}
            />
          ))}
        </div>
      </section>

      {/* Solutions Section */}
      <section className="solutions-section">
        <div className="solutions-content-wrapper">
          <div className="solutions-left-content">
            <h2>Đánh bại thuốc lá</h2>
            <h3>Giải pháp cai nghiện toàn diện</h3>
            <p className="section-description">
              Chương trình cai nghiện thuốc lá trực tuyến, cung cấp kiến thức,
              công cụ và sự hỗ trợ cần thiết để bạn từ bỏ thuốc lá vĩnh viễn.
            </p>

            <div className="solutions-grid">
              <div className="solution-card">
                <h4>Tư vấn trực tuyến</h4>
                <p>
                  Nhận tư vấn từ các chuyên gia cai nghiện hàng đầu, giúp bạn
                  vượt qua khó khăn và duy trì động lực.
                </p>
              </div>
              <div className="solution-card">
                <h4>Liệu pháp tâm lý</h4>
                <p>
                  Tham gia các buổi trị liệu tâm lý nhóm và cá nhân, giải quyết
                  các vấn đề tâm lý liên quan đến nghiện thuốc lá.
                </p>
              </div>
              <div className="solution-card">
                <h4>Công cụ hỗ trợ</h4>
                <p>
                  Sử dụng các ứng dụng và công cụ theo dõi tiến trình cai
                  nghiện, đặt mục tiêu và nhận thông báo nhắc nhở.
                </p>
              </div>
            </div>
          </div>
          <div className="solutions-right-image">
            <img
              src={solutionsRightImage}
              alt="People running on a cigarette"
            />
          </div>
        </div>
      </section>

      {/* Steps Section */}
      <section className="steps-section">
        <div className="steps-content-wrapper">
          <div className="steps-left-image">
            <img src={stepsLeftImage} alt="Cứu trái đất khỏi thuốc lá " />
          </div>
          <div className="steps-right-content">
            <h2>Các bước để cai nghiện thành công</h2>
            <div className="steps-grid">
              <div className="step-card">
                <div className="step-number">01</div>
                <p>
                  Đăng ký tài khoản và tham gia cộng đồng hỗ trợ trực tuyến của
                  chúng tôi.
                </p>
              </div>
              <div className="step-card">
                <div className="step-number">02</div>
                <p>
                  Đánh giá mức độ nghiện thuốc lá và xác định mục tiêu cai
                  nghiện của bạn.
                </p>
              </div>
              <div className="step-card">
                <div className="step-number">03</div>
                <p>
                  Xây dựng kế hoạch cai nghiện cá nhân hóa với sự hướng dẫn của
                  chuyên gia.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="testimonials-section">
        <div className="container">
          <div className="testimonial-display">
            <img
              src={currentTestimonial.image}
              alt={currentTestimonial.author}
              className="testimonial-avatar"
            />
            <p className="testimonial-text">{currentTestimonial.text}</p>
          </div>
          <div className="testimonial-authors">
            {testimonials.map((testimonial) => (
              <button
                key={testimonial.id}
                className={`author-button ${
                  currentTestimonial.id === testimonial.id ? "active" : ""
                }`}
                onClick={() => setCurrentTestimonial(testimonial)}
              >
                {testimonial.author} - {testimonial.location}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Experts Section */}
      <section className="experts-section">
        <div className="container">
          <h2>Đội ngũ chuyên gia của chúng tôi</h2>
          <p className="section-description" style={{ whiteSpace: "nowrap" }}>
            Chúng tôi có đội ngũ chuyên gia và tư vấn viên giàu kinh nghiệm, sẵn
            sàng hỗ trợ bạn trên con đường cai nghiện.
          </p>

          <div className="experts-grid">
            <div className="expert-card">
              <img src={expertImage1} alt="Phạm Thị Hương" />
              <h3>Phạm Thị Hương</h3>
              <p>Chuyên gia tư vấn cai nghiện</p>
            </div>
            <div className="expert-card">
              <img src={expertImage2} alt="Nguyễn Văn Nam" />
              <h3>Nguyễn Văn Nam</h3>
              <p>Chuyên gia tư vấn cai ngiện</p>
            </div>
            <div className="expert-card">
              <img src={expertImage3} alt="Trần Thị Mai" />
              <h3>Trần Thị Mai</h3>
              <p>Chuyên gia tư vấn cai ngiện</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
