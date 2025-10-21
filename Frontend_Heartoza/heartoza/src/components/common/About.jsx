import React from "react";
import "../css/About.css";
import MinhHue from "../../assets/team/MinhHue.jpg";
import VietAn from "../../assets/team/VietAn.jpg";
import DucVu from "../../assets/team/DucVu.png";
import ThuThanh from "../../assets/team/ThuThanh.jpg";
import DucAnh from "../../assets/team/DucAnh.jpg";
import TrungThanh from "../../assets/team/TrungThanh.jpg";

const team = [
  { 
    name: "Nguyễn Thị Minh Huệ", 
    role: "Team Leader & Developer", 
    bio: "Là leader kiêm dev, phụ trách cả frontend và backend, định hướng và quản lý tiến độ dự án.",
    img: MinhHue
  },
  { 
    name: "Lê Phạm Việt An", 
    role: "Developer", 
    bio: "Tham gia phát triển cả frontend và backend, đảm bảo tính năng vận hành ổn định.",
    img: VietAn
  },
  { 
    name: "Hà Đức Vũ", 
    role: "Developer", 
    bio: "Tham gia phát triển cả frontend và backend, tối ưu hiệu năng và trải nghiệm người dùng.",
    img: DucVu
  },
  { 
    name: "Nguyễn Thu Thanh", 
    role: "Marketing", 
    bio: "Chịu trách nhiệm quảng bá sản phẩm, chăm sóc khách hàng và tăng độ nhận diện thương hiệu.",
    img: ThuThanh
  },
  { 
    name: "Trần Trung Thành", 
    role: "Marketing", 
    bio: "Chịu trách nhiệm quảng bá sản phẩm, chăm sóc khách hàng và tăng doanh số.",
    img: TrungThanh
  },
  { 
    name: "Nguyễn Đức Anh", 
    role: "Marketing", 
    bio: "Chịu trách nhiệm quảng bá sản phẩm, quản lý các chiến dịch marketing hiệu quả.",
    img: DucAnh
  }
];

export default function About() {
  return (
    <div className="about-page">
      <div className="about-container">
        {/* Hero Section */}
        <div className="about-hero">
          <div className="about-hero-icon">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
          </div>
          <h1 className="about-title">Về Chúng Tôi</h1>
          <div className="about-divider"></div>
          <p className="about-intro">
            Chúng tôi là một nhóm trẻ đam mê công nghệ và mua sắm online. 
            Mục tiêu của chúng tôi là xây dựng một cửa hàng hiện đại, dễ sử dụng, 
            giúp bạn tìm sản phẩm yêu thích chỉ với vài cú click chuột.
          </p>
        </div>

        {/* Team Section */}
        <div className="team-section">
          <h2 className="team-title">
            <span className="team-title-icon">👥</span>
            Đội Ngũ Của Chúng Tôi
          </h2>
          
          <div className="team-grid">
            {team.map((member, idx) => (
              <div key={idx} className="team-card">
                <div className="team-card-image">
                  <img src={member.img} alt={member.name} />
                  <div className="team-card-overlay"></div>
                </div>
                <div className="team-card-content">
                  <h3 className="team-member-name">{member.name}</h3>
                  <p className="team-member-role">{member.role}</p>
                  <p className="team-member-bio">{member.bio}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Message */}
        <div className="about-footer">
          <div className="about-footer-icon">💝</div>
          <p className="about-footer-text">Cảm ơn bạn đã tin tưởng và ủng hộ Heartoza!</p>
        </div>
      </div>
    </div>
  );
}
