import React from "react";
import "./css/Contact.css";

export default function Contact() {
  return (
    <div className="contact-container">
      <h1>Liên hệ với Heartoza</h1>
      <p>
        Nếu bạn có câu hỏi, góp ý hoặc cần hỗ trợ, hãy liên hệ với chúng tôi qua
        các kênh sau:
      </p>

      <div className="contact-info">
        <div className="contact-card">
          <i className="bi bi-envelope"></i>
          <h3>Email</h3>
          <p>support@heartoza.com</p>
        </div>

        <div className="contact-card">
          <i className="bi bi-telephone"></i>
          <h3>Điện thoại</h3>
          <p>+84 123 456 789</p>
        </div>

        <div className="contact-card">
          <i className="bi bi-geo-alt"></i>
          <h3>Địa chỉ</h3>
          <p>123 Đường ABC, Quận 1, TP.HCM</p>
        </div>

        <div className="contact-card">
          <i className="bi bi-facebook"></i>
          <h3>Facebook</h3>
          <a href="https://facebook.com/heartoza" target="_blank" rel="noreferrer">
            facebook.com/heartoza
          </a>
        </div>
      </div>

      <div className="contact-form">
        <h2>Gửi tin nhắn cho chúng tôi</h2>
        <form>
          <input type="text" placeholder="Họ tên" required />
          <input type="email" placeholder="Email" required />
          <textarea placeholder="Nội dung" required></textarea>
          <button type="submit">Gửi</button>
        </form>
      </div>
    </div>
  );
}
