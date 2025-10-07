import React from "react";
import "../css/About.css";
import MinhHue from "../../assets/team/MinhHue.jpg";
import VietAn from "../../assets/team/VietAn.jpg";
import DucVu from "../../assets/team/DucVu.png";
import ThuThanh from "../../assets/team/ThuThanh.jpg";
import DucAnh from "../../assets/team/DucAnh.jpg";
import TrungThanh from "../../assets/team/TrungThanh.jpg";

// Team data
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
    <div className="about-container">
      <h1>About Us</h1>
      <p className="intro">
        Chúng tôi là một nhóm trẻ đam mê công nghệ và mua sắm online. 
        Mục tiêu của chúng tôi là xây dựng một cửa hàng hiện đại, dễ sử dụng, 
        giúp bạn tìm sản phẩm yêu thích chỉ với vài cú click chuột.
      </p>

      <h2>Meet Our Team</h2>
      <div className="team-grid">
        {team.map((member, idx) => (
          <div key={idx} className="team-card">
            <img 
              src={member.img} 
              alt={member.name} 
              className="team-img" 
            />
            <h3>{member.name}</h3>
            <p className="role">{member.role}</p>
            <p className="bio">{member.bio}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
