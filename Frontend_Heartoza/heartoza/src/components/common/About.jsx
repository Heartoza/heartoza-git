import React from "react";
import "./css/About.css";

const team = [
  { name: "Nguyễn Thị Minh Huệ", role: "Founder & CEO", bio: "Đam mê công nghệ, yêu thích thiết kế giao diện đẹp và trải nghiệm mượt mà. Yui là người đưa ra ý tưởng và định hướng phát triển cho shop." },
  { name: "Lê Phạm Việt An", role: "Backend Developer", bio: "Chuyên xây dựng API nhanh, bảo mật, xử lý dữ liệu mượt mà. Minh là người đảm bảo hệ thống luôn chạy ổn định." },
  { name: "Hà Đức Vũ", role: "Frontend Developer", bio: "Người biến ý tưởng thành giao diện sống động. An yêu thích React, UX/UI, luôn muốn mang trải nghiệm tốt nhất đến người dùng." },
  { name: "Nguyễn Thu Thanh", role: "Marketing", bio: "Luôn tìm cách đưa sản phẩm tiếp cận khách hàng nhanh và hiệu quả. Lan chịu trách nhiệm quảng bá và chăm sóc khách hàng." },
  { name: "Trần Trung Thành", role: "Marketing", bio: "Luôn tìm cách đưa sản phẩm tiếp cận khách hàng nhanh và hiệu quả. Lan chịu trách nhiệm quảng bá và chăm sóc khách hàng." },
  { name: "Nguyễn Đức Anh", role: "Marketing", bio: "Luôn tìm cách đưa sản phẩm tiếp cận khách hàng nhanh và hiệu quả. Lan chịu trách nhiệm quảng bá và chăm sóc khách hàng." }
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
            <h3>{member.name}</h3>
            <p className="role">{member.role}</p>
            <p className="bio">{member.bio}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
