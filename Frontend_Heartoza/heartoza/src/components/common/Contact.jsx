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
          <a href="mailto:weelearn10@gmail.com">Email</a>
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
          <a href="https://www.facebook.com/profile.php?id=61581715259294" target="_blank" rel="noreferrer">Heartoza</a>
        </div>
      </div>
    </div>
  );
}
