import React from 'react';
import { Link } from 'react-router-dom';
import '../style/AboutPage.scss';


const AboutPage = () => {
  return (
    <div className="about-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="container">
          <h1>Thông tin cai nghiện thuốc lá</h1>
          <p className="subtitle">
            Tìm hiểu về tác hại của thuốc lá, lợi ích của việc cai nghiện và các phương pháp hiệu quả để từ bỏ thuốc lá.
          </p>
        </div>
      </section>

      {/* Harmful Effects Section */}
      <section className="harmful-effects">
        <div className="container">
          <h2>Tác hại của thuốc lá</h2>
          <div className="effects-grid">
            <div className="effect-card">
              <h3>Bệnh nguy hiểm</h3>
              <p>Thuốc lá gây ra nhiều bệnh nguy hiểm như ung thư phổi, bệnh tim mạch và các vấn đề hô hấp.</p>
            </div>
            <div className="effect-card">
              <h3>Gây nghiện</h3>
              <p>Nicotine trong thuốc lá gây nghiện và khó cai, ảnh hưởng đến sức khỏe tinh thần và thể chất.</p>
            </div>
            <div className="effect-card">
              <h3>Ảnh hưởng người xung quanh</h3>
              <p>Khói thuốc lá ảnh hưởng đến những người xung quanh, đặc biệt là trẻ em và phụ nữ mang thai.</p>
            </div>
          </div>
          <Link to="/blog" className="learn-more-btn">Tìm hiểu thêm</Link>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="benefits">
        <div className="container">
          <h2>Lợi ích của việc cai nghiện thuốc lá</h2>
          <div className="benefits-grid">
            <div className="benefit-card">
              <h3>Cải thiện sức khỏe</h3>
              <p>Giảm nguy cơ mắc bệnh tim mạch, ung thư và các bệnh hô hấp.</p>
            </div>
            <div className="benefit-card">
              <h3>Tiết kiệm tiền bạc</h3>
              <p>Tiết kiệm một khoản tiền lớn từ việc không mua thuốc lá.</p>
            </div>
            <div className="benefit-card">
              <h3>Nâng cao chất lượng cuộc sống</h3>
              <p>Cảm thấy tự tin, khỏe mạnh và hạnh phúc hơn.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Steps Section */}
      <section className="steps">
        <div className="container">
          <h2>Các bước cai nghiện thuốc lá hiệu quả</h2>
          <div className="steps-grid">
            <div className="step-card">
              <div className="step-number">01</div>
              <h3>Xác định mục tiêu</h3>
              <p>Đặt ra mục tiêu cai nghiện rõ ràng và quyết tâm thực hiện.</p>
            </div>
            <div className="step-card">
              <div className="step-number">02</div>
              <h3>Tìm kiếm sự hỗ trợ</h3>
              <p>Tham gia cộng đồng hỗ trợ, tìm kiếm sự giúp đỡ từ gia đình và bạn bè.</p>
            </div>
            <div className="step-card">
              <div className="step-number">03</div>
              <h3>Áp dụng phương pháp cai nghiện</h3>
              <p>Sử dụng thuốc hỗ trợ, liệu pháp tâm lý hoặc thay đổi lối sống.</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="faq">
        <div className="container">
          <h2>Câu hỏi thường gặp</h2>
          <div className="faq-grid">
            <div className="faq-item">
              <h3>Cai nghiện thuốc lá có khó không?</h3>
              <p>Cai nghiện thuốc lá có thể khó khăn, nhưng hoàn toàn có thể thực hiện được với sự quyết tâm và hỗ trợ đúng cách.</p>
            </div>
            <div className="faq-item">
              <h3>Tôi nên bắt đầu cai nghiện từ đâu?</h3>
              <p>Bạn nên bắt đầu bằng cách xác định mục tiêu, tìm kiếm sự hỗ trợ và lựa chọn phương pháp cai nghiện phù hợp.</p>
            </div>
            <div className="faq-item">
              <h3>Có những phương pháp cai nghiện nào?</h3>
              <p>Có nhiều phương pháp cai nghiện như sử dụng thuốc hỗ trợ, liệu pháp tâm lý và thay đổi lối sống.</p>
            </div>
            <div className="faq-item">
              <h3>Làm thế nào để đối phó với cơn thèm thuốc?</h3>
              <p>Bạn có thể đối phó với cơn thèm thuốc bằng cách sử dụng kẹo cao su nicotine, tập thể dục hoặc tìm kiếm sự hỗ trợ từ cộng đồng.</p>
            </div>
          </div>
          <div className="contact-support">
            <p>Bạn không tìm thấy câu trả lời mình cần?</p>
            <Link to="/contact" className="contact-btn">Liên hệ hỗ trợ</Link>
          </div>
        </div>
      </section>

      {/* Community Section */}
      <section className="community">
        <div className="container">
          <h2>Tham gia cộng đồng hỗ trợ</h2>
          <div className="community-content">
            <div className="community-benefits">
              <ul>
                <li>Nhận sự hỗ trợ và động viên</li>
                <li>Chia sẻ kinh nghiệm và học hỏi</li>
                <li>Tìm kiếm lời khuyên từ chuyên gia</li>
                <li>Vượt qua khó khăn cùng nhau</li>
              </ul>
              <Link to="/community" className="join-btn">Tham gia ngay</Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutPage; 