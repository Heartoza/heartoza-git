using System.Text;
using Heartoza.Models;
using Heartoza.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;

namespace Heartoza
{
    public class Program
    {
        public static void Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);

            // ===== DB =====
            builder.Services.AddDbContext<GiftBoxShopContext>(opt =>
                opt.UseSqlServer(
                    builder.Configuration.GetConnectionString("DefaultConnection"),
                    sql => sql.EnableRetryOnFailure()
                ));

            // ===== Controllers & Swagger =====
            builder.Services.AddControllers();
            builder.Services.AddEndpointsApiExplorer();
            builder.Services.AddSwaggerGen(c =>
            {
                c.SwaggerDoc("v1", new OpenApiInfo { Title = "Heartoza API", Version = "v1" });
                var scheme = new OpenApiSecurityScheme
                {
                    Name = "Authorization",
                    Type = SecuritySchemeType.Http,
                    Scheme = "bearer",
                    BearerFormat = "JWT",
                    In = ParameterLocation.Header,
                    Description = "Nhập: Bearer {token}"
                };
                c.AddSecurityDefinition("Bearer", scheme);
                c.AddSecurityRequirement(new OpenApiSecurityRequirement { { scheme, Array.Empty<string>() } });
            });

            // ===== CORS (KHÔNG CẦN nếu FE dùng proxy SWA). Giữ để test local. =====
            builder.Services.AddCors(o =>
                o.AddPolicy("Default", p => p
                    .WithOrigins("http://localhost:5173", "http://localhost:3000")
                    .AllowAnyHeader()
                    .AllowAnyMethod()
                )
            );

            // ===== JWT =====
            var jwt = builder.Configuration.GetSection("Jwt");
            var keyBytes = Encoding.UTF8.GetBytes(jwt["Key"]!);

            builder.Services.AddAuthentication(o =>
            {
                o.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
                o.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
            })
            .AddJwtBearer(o =>
            {
                o.RequireHttpsMetadata = !builder.Environment.IsDevelopment();
                o.SaveToken = true;
                o.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidateIssuerSigningKey = true,
                    ValidateLifetime = true,
                    ClockSkew = TimeSpan.FromSeconds(30),
                    ValidIssuer = jwt["Issuer"],
                    ValidAudience = jwt["Audience"],
                    IssuerSigningKey = new SymmetricSecurityKey(keyBytes),
                };
            });

            builder.Services.AddAuthorization();

            // ===== DI Services =====
            builder.Services.AddHttpContextAccessor();
            builder.Services.AddScoped<IJwtService, JwtService>();
            builder.Services.AddScoped<IAuditService, AuditService>();

            // chọn email sender theo môi trường (tránh đăng ký 2 lần)
            if (builder.Environment.IsDevelopment())
                builder.Services.AddScoped<IEmailSender, DevEmailSender>();
            else
                builder.Services.AddScoped<IEmailSender, SmtpEmailSender>();

            // nếu vẫn dùng TokenService custom
            builder.Services.AddSingleton<ITokenService>(
                new TokenService(jwt["Issuer"]!, jwt["Audience"]!, jwt["Key"]!)
            );

            var app = builder.Build();

            // ===== Swagger theo cấu hình =====
            var enableSwagger = app.Configuration.GetValue<bool>("EnableSwagger", app.Environment.IsDevelopment());
            if (enableSwagger)
            {
                app.UseSwagger();
                app.UseSwaggerUI();
            }

            // tiện demo: vào root tự chuyển sang swagger
            app.MapGet("/", () => Results.Redirect("/swagger"));

            app.UseCors("Default");       // proxy SWA không cần, nhưng giữ cho local

            app.UseHttpsRedirection();
            app.UseAuthentication();
            app.UseAuthorization();

            app.MapControllers();

            app.Run();
        }
    }
}
