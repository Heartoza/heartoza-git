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
                c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
                {
                    Name = "Authorization",
                    Type = SecuritySchemeType.Http,
                    Scheme = "bearer",
                    BearerFormat = "JWT",
                    In = ParameterLocation.Header,
                    Description = "Paste **token** (không cần chữ 'Bearer')"
                });
                c.AddSecurityRequirement(new OpenApiSecurityRequirement
                {
                    {
                        new OpenApiSecurityScheme
                        {
                            Reference = new OpenApiReference
                            {
                                Type = ReferenceType.SecurityScheme,
                                Id   = "Bearer"
                            }
                        },
                        Array.Empty<string>()
                    }
                });
            });

            // ===== CORS =====
            // ✅ Đổi tên policy cho rõ ràng hơn
            builder.Services.AddCors(o =>
                o.AddPolicy("AllowReactApp", p => p
                    // Cho phép các địa chỉ này gọi API
                    .WithOrigins("http://localhost:3000", "http://localhost:5173", "https://witty-hill-06b27a500.2.azurestaticapps.net")
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
            if (builder.Environment.IsDevelopment())
                builder.Services.AddScoped<IEmailSender, DevEmailSender>();
            else
                builder.Services.AddScoped<IEmailSender, SmtpEmailSender>();
            builder.Services.Configure<AzureStorageOptions>(
            builder.Configuration.GetSection("AzureStorage"));
            builder.Services.AddSingleton<IAvatarStorage, BlobAvatarStorage>();
            builder.Services.AddSingleton<ITokenService>(
                new TokenService(jwt["Issuer"]!, jwt["Audience"]!, jwt["Key"]!)
            );

            var app = builder.Build();

            // ===== Swagger =====
            var enableSwagger = app.Configuration.GetValue<bool>("EnableSwagger", app.Environment.IsDevelopment());
            if (enableSwagger)
            {
                app.UseSwagger();
                app.UseSwaggerUI();
            }

            // ===== Diagnostic Endpoints =====
            app.MapGet("/", () => Results.Redirect("/swagger"));
            app.MapGet("/diag/ef-conn", (GiftBoxShopContext db) => { /* ... */ });
            app.MapGet("/diag/db-ping", async (IConfiguration cfg) => { /* ... */ });

            app.UseHttpsRedirection();
            app.UseStaticFiles();

            // ✅ DI CHUYỂN CORS LÊN TRƯỚC Authentication VÀ Authorization
            app.UseRouting();
            app.UseCors("AllowReactApp"); // Phải đặt ở đây

            app.UseAuthentication();
            app.UseAuthorization();

            app.MapControllers();
            app.Run();
        }
    }
}