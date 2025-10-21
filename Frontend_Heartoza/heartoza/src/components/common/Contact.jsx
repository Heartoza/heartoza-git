import React from "react";
import "../css/Contact.css";
import Logo from "../../assets/logo/3.png";

export default function Contact() {
  return (
    <div className="contact-page">
      <div className="contact-container">
        {/* Hero Section */}
        <div className="contact-hero">
          <div className="contact-logo-wrapper">
            <img src={Logo} alt="Heartoza Logo" className="contact-logo" />
          </div>
          <h1 className="contact-title">Liên Hệ Với Heartoza</h1>
          <div className="contact-divider"></div>
          <p className="contact-intro">
            Nếu bạn có câu hỏi, góp ý hoặc cần hỗ trợ, hãy liên hệ với chúng tôi qua các kênh sau. 
            Chúng tôi luôn sẵn sàng lắng nghe và hỗ trợ bạn!
          </p>
        </div>

        {/* Contact Grid */}
        <div className="contact-grid">
          <div className="contact-card">
            <div className="contact-card-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
            </div>
            <h3 className="contact-card-title">Email</h3>
            <a href="mailto:weelearn10@gmail.com" className="contact-card-link">
              weelearn10@gmail.com
            </a>
            <p className="contact-card-desc">Gửi email cho chúng tôi bất cứ lúc nào</p>
          </div>

          <div className="contact-card">
            <div className="contact-card-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
              </svg>
            </div>
            <h3 className="contact-card-title">Điện Thoại</h3>
            <p className="contact-card-value">+84 835 236 437</p>
            <p className="contact-card-desc">Liên hệ trực tiếp qua điện thoại</p>
          </div>

          <div className="contact-card">
            <div className="contact-card-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
            </div>
            <h3 className="contact-card-title">Địa Chỉ</h3>
            <p className="contact-card-value">Trường Đại học FPT Hà Nội</p>
            <p className="contact-card-desc">Đến thăm chúng tôi tại trường</p>
          </div>

          <div className="contact-card">
            <div className="contact-card-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </div>
            <h3 className="contact-card-title">Facebook</h3>
            <a 
              href="https://www.facebook.com/profile.php?id=61581715259294" 
              target="_blank" 
              rel="noreferrer"
              className="contact-card-link"
            >
              Heartoza
            </a>
            <p className="contact-card-desc">Theo dõi và kết nối với chúng tôi</p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="contact-cta">
          <h2 className="contact-cta-title">Bạn có thắc mắc?</h2>
          <p className="contact-cta-text">
            Đừng ngần ngại liên hệ với chúng tôi. Chúng tôi sẵn sàng giải đáp mọi thắc mắc của bạn!
          </p>
          <a href="mailto:weelearn10@gmail.com" className="contact-cta-button">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
              <polyline points="22,6 12,13 2,6"/>
            </svg>
            Gửi Email Ngay
          </a>
        </div>
      </div>
    </div>
  );
}
