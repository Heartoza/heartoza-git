import "../css/Footer.css";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-content">
        {/* Brand Section */}
        <div className="footer-brand">
          <h2>Heartoza</h2>
          <p>
            Nơi gửi gắm yêu thương qua từng món quà ý nghĩa. 
            Heartoza mang đến những sản phẩm độc đáo, chất lượng cao 
            dành cho người thân yêu của bạn.
          </p>
          <div className="footer-social">
            <a href="mailto:weelearn10@gmail.com" title="Email">
              📧
            </a>
            <a 
              href="https://www.facebook.com/profile.php?id=61581715259294" 
              target="_blank" 
              rel="noreferrer"
              title="Facebook"
            >
              📘
            </a>
          </div>
        </div>

        {/* Quick Links */}
        <div className="footer-section">
          <h3>Liên kết nhanh</h3>
          <a href="/">Trang chủ</a>
          <a href="/products">Sản phẩm</a>
          <a href="/about">Về chúng tôi</a>
          <a href="/contact">Liên hệ</a>
        </div>

        {/* Support */}
        <div className="footer-section">
          <h3>Hỗ trợ</h3>
          <a href="/faq">Câu hỏi thường gặp</a>
          <a href="/shipping">Vận chuyển</a>
          <a href="/returns">Đổi trả hàng</a>
          <a href="/privacy">Chính sách bảo mật</a>
        </div>
      </div>

      {/* Footer Bottom */}
      <div className="footer-bottom">
        <p>
          © 2025 <a href="/">Heartoza</a>. All rights reserved. Made with 💖
        </p>
      </div>
    </footer>
  );
}
