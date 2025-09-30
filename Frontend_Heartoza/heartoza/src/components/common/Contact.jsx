import React from "react";
import "../css/Contact.css";
import Logo from "../../assets/logo/1.png"; // logo hoặc ảnh bìa

export default function Contact() {
  return (
    <div className="contact-container">
      <h1>Liên hệ với Heartoza</h1>
      <img src={Logo} alt="Heartoza Logo" className="contact-logo" />

      <p>
        Nếu bạn có câu hỏi, góp ý hoặc cần hỗ trợ, hãy liên hệ với chúng tôi qua
        các kênh sau:
      </p>

      <div className="contact-info">
        <div className="contact-card">
          <i className="bi bi-envelope"></i>
          <h3>Email</h3>
          <p>weelearn10@gmail.com</p>
        </div>

        <div className="contact-card">
          <i className="bi bi-telephone"></i>
          <h3>Điện thoại</h3>
          <p>+84 835 236 437</p>
        </div>

        <div className="contact-card">
          <i className="bi bi-geo-alt"></i>
          <h3>Địa chỉ</h3>
          <p>Trường Đại học FPT Hà Nội</p>
        </div>

        <div className="contact-card">
          <i className="bi bi-facebook"></i>
          <h3>Facebook</h3>
          <a href="https://facebook.com/heartoza" target="_blank" rel="noreferrer">
            facebook.com/heartoza
          </a>
        </div>
      </div>
    </div>
  );
}
