using System.Text;
using Heartoza.Models;
using Heartoza.Services; // JwtService, DevEmailSender, SmtpEmailSender, AuditService
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

            // ===== App Insights (log/traces trên Azure, vẫn chạy local) =====
            builder.Services.AddApplicationInsightsTelemetry();

            // ===== DB =====
            builder.Services.AddDbContext<GiftBoxShopContext>(opt =>
                opt.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

            // ===== Controllers & Swagger =====
            builder.Services.AddControllers();
            builder.Services.AddEndpointsApiExplorer();
            builder.Services.AddSwaggerGen(c =>
            {
                c.SwaggerDoc("v1", new OpenApiInfo { Title = "Heartoza API", Version = "v1" });

                // Bearer on Swagger
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

            // ===== CORS =====
            builder.Services.AddCors(options =>
            {
                options.AddPolicy("Default", policy =>
                {
                    policy
                        .WithOrigins(
                            "http://localhost:5173",
                            "http://localhost:3000",
                            "https://heartozaapi.azurewebsites.net" // FE/prod nếu có
                        )
                        .AllowAnyHeader()
                        .AllowAnyMethod();
                    // .AllowCredentials(); // chỉ bật nếu DÙNG cookie; JWT thường không cần
                });
            });

            // ===== JWT =====
            var jwt = builder.Configuration.GetSection("Jwt");
            var keyBytes = Encoding.UTF8.GetBytes(jwt["Key"] ?? "changeme_dev_key");

            builder.Services.AddAuthentication(o =>
            {
                o.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
                o.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
            })
            .AddJwtBearer(o =>
            {
                o.RequireHttpsMetadata = !builder.Environment.IsDevelopment(); // Dev cho dễ test
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

            // Nếu anh còn dùng TokenService custom
            builder.Services.AddSingleton<ITokenService>(
                new TokenService(jwt["Issuer"] ?? "", jwt["Audience"] ?? "", jwt["Key"] ?? "")
            );

            var app = builder.Build();

            // ===== Auto-migrate (bật/tắt qua config: RunMigrationsOnStart=true) =====
            if (app.Configuration.GetValue<bool>("RunMigrationsOnStart"))
            {
                using var scope = app.Services.CreateScope();
                var db = scope.ServiceProvider.GetRequiredService<GiftBoxShopContext>();
                db.Database.Migrate();
            }

            // ===== Middleware =====
            var enableSwagger = app.Configuration.GetValue<bool>(
                "EnableSwagger",
                app.Environment.IsDevelopment()
            );
            if (enableSwagger)
            {
                app.UseSwagger();
                app.UseSwaggerUI();
            }


            app.UseCors("Default");
            app.UseHttpsRedirection();
            app.UseAuthentication();
            app.UseAuthorization();

            app.MapGet("/", () => Results.Redirect("/swagger"));

            app.MapControllers();
            app.Run();
        }
    }
}
