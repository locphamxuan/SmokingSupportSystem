import React from "react";
import { Link } from "react-router-dom";
import "../style/AboutPage.scss";
import facebookImage from "../assets/images/facebook.jpg";
import instagramImage from "../assets/images/instragram.jpg";
import harmEffectsImage from "../assets/images/anh11.jpg";
import communityImage from "../assets/images/comunity.jpg";
import articleImage1 from "../assets/images/cainghienthuocla.jpg";
import articleImage2 from "../assets/images/doiphoconthem.jpg";
import articleImage3 from "../assets/images/loiich.jpg";
import articleImage4 from "../assets/images/suckhoe.jpg";
import postQuitImage from "../assets/images/saukhicainghienthuocthanhcong.jpg";

const AboutPage = () => {
  return (
    <div className="about-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="container">
          <p className="knowledge-is-power">Kiến thức là sức mạnh</p>
          <h1 className="title">Thông tin cai nghiện thuốc lá</h1>
          <p className="subtitle">
            Tìm hiểu về tác hại của thuốc lá, lợi ích của việc cai nghiện và các
            phương pháp hiệu quả để từ bỏ thuốc lá.
          </p>
        </div>
      </section>

      {/* Harmful Effects Section */}
      <section className="harmful-effects">
        <div className="container">
          <h2>Tác hại của thuốc lá</h2>
          <p className="section-subtitle">Hiểu rõ để đưa ra quyết định</p>
          <div className="effects-content">
            <div className="left-column">
              <p>
                Thuốc lá gây ra nhiều bệnh nguy hiểm như ung thư phổi, bệnh tim
                mạch và các vấn đề hô hấp.
              </p>
              <p>
                Khói thuốc lá ảnh hưởng đến những người xung quanh, đặc biệt là
                trẻ em và phụ nữ mang thai.
              </p>
            </div>
            <div className="right-column">
              <p>
                Nicotine trong thuốc lá gây nghiện và khó cai, ảnh hưởng đến sức
                khỏe tinh thần và thể chất.
              </p>
            </div>
          </div>
          <Link to="/blog" className="learn-more-btn">
            Tìm hiểu thêm
          </Link>
        </div>
      </section>

      {/* Image below Harmful Effects Section */}
      <div className="harmful-effects-image-container">
        <img
          src={harmEffectsImage}
          alt="Understanding smoking effects"
          className="harmful-effects-image"
        />
      </div>

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

      {/* Image after Benefits Section */}
      <div className="post-quit-image-container">
        <img
          src={postQuitImage}
          alt="Man happy after quitting smoking"
          className="post-quit-image"
        />
      </div>

      {/* Steps Section */}
      <section className="steps">
        <div className="container">
          <h2>Các bước cai nghiện thuốc lá hiệu quả</h2>
          <p className="section-description">
            Lộ trình cai nghiện thuốc lá từng bước, giúp bạn dễ dàng đạt được
            mục tiêu.
          </p>
          <div className="steps-grid">
            <div className="step-card">
              <div className="step-icon">
                <i className="fas fa-bullseye"></i>
              </div>
              <h3>Xác định mục tiêu</h3>
              <p>Đặt ra mục tiêu cai nghiện rõ ràng và quyết tâm thực hiện.</p>
            </div>
            <div className="step-card">
              <div className="step-icon">
                <i className="fas fa-people-carry"></i>
              </div>
              <h3>Tìm kiếm sự hỗ trợ</h3>
              <p>
                Tham gia cộng đồng hỗ trợ, tìm kiếm sự giúp đỡ từ gia đình và
                bạn bè.
              </p>
            </div>
            <div className="step-card">
              <div className="step-icon">
                <i className="fas fa-hand-holding-heart"></i>
              </div>
              <h3>Áp dụng phương pháp cai nghiện</h3>
              <p>
                Sử dụng thuốc hỗ trợ, liệu pháp tâm lý hoặc thay đổi lối sống.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="faq">
        <div className="container">
          <h2>Câu hỏi thường gặp</h2>
          <p className="section-description">
            Giải đáp các thắc mắc về quá trình cai nghiện thuốc lá.
          </p>
          <div className="faq-grid">
            <div className="faq-item">
              <div className="faq-icon">
                <i className="fas fa-question"></i>
              </div>
              <div className="faq-content">
                <h3>Cai nghiện thuốc lá có khó không?</h3>
                <p>
                  Cai nghiện thuốc lá có thể khó khăn, nhưng hoàn toàn có thể
                  thực hiện được với sự quyết tâm và hỗ trợ đúng cách.
                </p>
              </div>
            </div>
            <div className="faq-item">
              <div className="faq-icon">
                <i className="fas fa-question"></i>
              </div>
              <div className="faq-content">
                <h3>Tôi nên bắt đầu cai nghiện từ đâu?</h3>
                <p>
                  Bạn nên bắt đầu bằng cách xác định mục tiêu, tìm kiếm sự hỗ
                  trợ và lựa chọn phương pháp cai nghiện phù hợp.
                </p>
              </div>
            </div>
            <div className="faq-item">
              <div className="faq-icon">
                <i className="fas fa-question"></i>
              </div>
              <div className="faq-content">
                <h3>Có những phương pháp cai nghiện nào?</h3>
                <p>
                  Có nhiều phương pháp cai nghiện như sử dụng thuốc hỗ trợ, liệu
                  pháp tâm lý và thay đổi lối sống.
                </p>
              </div>
            </div>
            <div className="faq-item">
              <div className="faq-icon">
                <i className="fas fa-question"></i>
              </div>
              <div className="faq-content">
                <h3>Làm thế nào để đối phó với cơn thèm thuốc?</h3>
                <p>
                  Bạn có thể đối phó với cơn thèm thuốc bằng cách sử dụng kẹo
                  cao su nicotine, tập thể dục hoặc tìm kiếm sự hỗ trợ từ cộng
                  đồng.
                </p>
              </div>
            </div>
          </div>
          <div className="contact-support">
            <p>Bạn không tìm thấy câu trả lời mình cần?</p>
            <Link to="/contact" className="contact-btn">
              Liên hệ hỗ trợ
            </Link>
          </div>
        </div>
      </section>

      {/* Community Section */}
      <section className="community">
        <div className="container">
          <div className="community-content-wrapper">
            <div className="community-image-card">
              <img
                src={communityImage}
                alt="Community support for quitting smoking"
              />
            </div>
            <div className="community-text-content">
              <h2>Tham gia cộng đồng hỗ trợ</h2>
              <p>
                Kết nối với những người đang cai nghiện thuốc lá và chia sẻ kinh
                nghiệm.
              </p>
              <div className="community-benefits">
                <ul>
                  <li>
                    <i className="fas fa-check-circle"></i> Nhận sự hỗ trợ và
                    động viên
                  </li>
                  <li>
                    <i className="fas fa-check-circle"></i> Tìm kiếm lời khuyên
                    từ chuyên gia
                  </li>
                </ul>
                <ul>
                  <li>
                    <i className="fas fa-check-circle"></i> Chia sẻ kinh nghiệm
                    và học hỏi
                  </li>
                  <li>
                    <i className="fas fa-check-circle"></i> Vượt qua khó khăn
                    cùng nhau
                  </li>
                </ul>
              </div>
              <Link to="/blog" className="join-btn">
                Tham gia ngay <i className="fas fa-arrow-right"></i>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Useful Articles Section */}
      <section className="articles-section">
        <div className="container">
          <div className="articles-header">
            <h2>Bài viết hữu ích về cai nghiện</h2>
            <Link to="/blog" className="see-more-btn">
              Xem thêm <i className="fas fa-arrow-right"></i>
            </Link>
          </div>
          <div className="articles-grid">
            <div className="article-card">
              <a
                href="https://vnexpress.net/hai-bien-phap-giup-giam-tac-hai-cua-khoi-thuoc-4719531.html"
                target="_blank"
                rel="noopener noreferrer"
              >
                <img src={articleImage1} alt="Article 1" />
                <div className="article-content">
                  <h3>Cai nghiện thuốc lá: Những điều cần biết</h3>
                  <p className="article-date">March 10, 2023</p>
                </div>
              </a>
            </div>
            <div className="article-card">
              <a
                href="https://baolongan.vn/giai-phap-nao-de-tu-bo-su-dung-thuoc-la-the-he-moi-a196851.html"
                target="_blank"
                rel="noopener noreferrer"
              >
                <img src={articleImage2} alt="Article 2" />
                <div className="article-content">
                  <h3>Đối phó với cơn thèm thuốc</h3>
                  <p className="article-date">March 12, 2023</p>
                </div>
              </a>
            </div>
            <div className="article-card">
              <a
                href="https://www.phoiviet.com/new/153/loi-ich-truoc-mat-va-lau-dai-cua-viec-cai-thuoc-la.html"
                target="_blank"
                rel="noopener noreferrer"
              >
                <img src={articleImage3} alt="Article 3" />
                <div className="article-content">
                  <h3>Lợi ích lâu dài của việc cai nghiện</h3>
                  <p className="article-date">March 15, 2023</p>
                </div>
              </a>
            </div>
            <div className="article-card">
              <a
                href="https://trungtamytebinhtan.medinet.gov.vn/phong-chong-tac-hai-thuoc-la/co-the-thay-doi-the-nao-neu-bo-thuoc-la-trong-mot-nam-cmobile16833-142046.aspx"
                target="_blank"
                rel="noopener noreferrer"
              >
                <img src={articleImage4} alt="Article 4" />
                <div className="article-content">
                  <h3>Chăm sóc sức khỏe sau cai nghiện</h3>
                  <p className="article-date">March 18, 2023</p>
                </div>
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;
