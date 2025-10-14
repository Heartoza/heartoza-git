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
    <div style={{
      minHeight: '100vh',
      background: '#f8f9fa',
      padding: '40px 20px'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{
          textAlign: 'center',
          marginBottom: '50px',
          padding: '40px 20px',
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
        }}>
          <h1 style={{
            fontSize: '2.5rem',
            fontWeight: '600',
            color: '#6db4f7',
            marginBottom: '15px'
          }}>
            ❤️ Về Chúng Tôi
          </h1>
          <p style={{
            fontSize: '1.1rem',
            lineHeight: '1.8',
            color: '#555',
            maxWidth: '700px',
            margin: '0 auto'
          }}>
            Chúng tôi là một nhóm trẻ đam mê công nghệ và mua sắm online. 
            Mục tiêu của chúng tôi là xây dựng một cửa hàng hiện đại, dễ sử dụng, 
            giúp bạn tìm sản phẩm yêu thích chỉ với vài cú click chuột.
          </p>
        </div>

        {/* Team Title */}
        <h2 style={{
          fontSize: '2rem',
          fontWeight: '600',
          textAlign: 'center',
          color: '#333',
          marginBottom: '40px'
        }}>
          👥 Đội Ngũ Của Chúng Tôi
        </h2>

        {/* Team Grid - 3 người 1 hàng */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '30px',
          marginBottom: '30px'
        }}>
          {team.map((member, idx) => (
            <div key={idx} style={{
              background: 'white',
              borderRadius: '12px',
              overflow: 'hidden',
              boxShadow: '0 2px 15px rgba(0,0,0,0.08)',
              transition: 'all 0.3s ease',
              border: '2px solid transparent'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-5px)';
              e.currentTarget.style.boxShadow = '0 8px 25px rgba(109, 180, 247, 0.3)';
              e.currentTarget.style.borderColor = '#6db4f7';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 15px rgba(0,0,0,0.08)';
              e.currentTarget.style.borderColor = 'transparent';
            }}>
              {/* Image */}
              <div style={{
                width: '100%',
                height: '280px',
                overflow: 'hidden',
                background: '#f0f0f0'
              }}>
                <img 
                  src={member.img} 
                  alt={member.name}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    transition: 'transform 0.3s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                />
              </div>

              {/* Info */}
              <div style={{ padding: '20px' }}>
                <h3 style={{
                  fontSize: '1.2rem',
                  fontWeight: '600',
                  color: '#333',
                  marginBottom: '8px',
                  textAlign: 'center'
                }}>
                  {member.name}
                </h3>
                <p style={{
                  fontSize: '0.9rem',
                  fontWeight: '500',
                  color: '#6db4f7',
                  marginBottom: '10px',
                  textAlign: 'center',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  {member.role}
                </p>
                <p style={{
                  fontSize: '0.9rem',
                  lineHeight: '1.6',
                  color: '#666',
                  textAlign: 'center'
                }}>
                  {member.bio}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{
          marginTop: '20px',
          padding: '30px',
          background: 'white',
          borderRadius: '12px',
          textAlign: 'center',
          boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
        }}>
          <p style={{
            fontSize: '1.1rem',
            color: '#555',
            margin: '0'
          }}>
            💝 Cảm ơn bạn đã tin tưởng và ủng hộ Heartoza! 💝
          </p>
        </div>
      </div>
    </div>
  );
}
