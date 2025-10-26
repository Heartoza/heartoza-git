using Heartoza.Models;
using Heartoza.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.Diagnostics;
using System.Text;

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
            app.MapGet("/diag/ef-conn", async (GiftBoxShopContext db) =>
            {
                try
                {
                    var sw = Stopwatch.StartNew();
                    var canConnect = await db.Database.CanConnectAsync();
                    sw.Stop();

                    var cnn = db.Database.GetDbConnection();

                    return Results.Ok(new
                    {
                        efProvider = db.Database.ProviderName,
                        canConnect,
                        openState = cnn.State.ToString(),
                        dataSource = cnn.DataSource,
                        database = cnn.Database,
                        elapsedMs = sw.ElapsedMilliseconds
                    });
                }
                catch (Exception ex)
                {
                    return Results.Problem(
                        title: "EF connection failed",
                        detail: ex.ToString(),
                        statusCode: 500
                    );
                }
            });
            static string Redact(string cs)
            {
                if (string.IsNullOrWhiteSpace(cs)) return cs ?? "";
                // Ẩn password trong chuỗi kết nối
                try
                {
                    var sb = new SqlConnectionStringBuilder(cs);
                    if (!string.IsNullOrEmpty(sb.Password)) sb.Password = "****";
                    return sb.ToString();
                }
                catch { return cs; }
            }

            app.MapGet("/diag/db-ping", async (IConfiguration cfg) =>
            {
                var cs = cfg.GetConnectionString("DefaultConnection");
                if (string.IsNullOrWhiteSpace(cs))
                    return Results.Problem("Missing ConnectionStrings:DefaultConnection", statusCode: 500);

                try
                {
                    var sw = Stopwatch.StartNew();
                    using var con = new SqlConnection(cs);
                    await con.OpenAsync();

                    using var cmd = con.CreateCommand();
                    cmd.CommandText = @"
SELECT 
  DB_NAME()                          AS DbName,
  SUSER_SNAME()                      AS LoginName,
  CAST(SERVERPROPERTY('ProductVersion') AS nvarchar(50)) AS SqlVersion,
  IIF(OBJECT_ID('dbo.Users','U') IS NULL, 0, 1) AS HasUsersTable,
  IIF(OBJECT_ID('dbo.Banners','U') IS NULL, 0, 1) AS HasBannersTable,
  IIF(OBJECT_ID('dbo.Vouchers','U') IS NULL, 0, 1) AS HasVouchersTable,
  IIF(OBJECT_ID('dbo.SeoMeta','U')  IS NULL, 0, 1) AS HasSeoMetaTable
";
                    using var r = await cmd.ExecuteReaderAsync();
                    object? row = null;
                    if (await r.ReadAsync())
                    {
                        row = new
                        {
                            DbName = r["DbName"]?.ToString(),
                            LoginName = r["LoginName"]?.ToString(),
                            SqlVersion = r["SqlVersion"]?.ToString(),
                            HasUsersTable = (int)r["HasUsersTable"] == 1,
                            HasBannersTable = (int)r["HasBannersTable"] == 1,
                            HasVouchersTable = (int)r["HasVouchersTable"] == 1,
                            HasSeoMetaTable = (int)r["HasSeoMetaTable"] == 1
                        };
                    }
                    sw.Stop();

                    return Results.Ok(new
                    {
                        ok = true,
                        connection = new
                        {
                            dataSource = con.DataSource,
                            database = con.Database,
                            redacted = Redact(cs)
                        },
                        elapsedMs = sw.ElapsedMilliseconds,
                        info = row
                    });
                }
                catch (Exception ex)
                {
                    return Results.Problem(
                        title: "DB ping failed",
                        detail: ex.ToString(),
                        statusCode: 500,
                        extensions: new Dictionary<string, object?>
                        {
                            ["connectionString"] = Redact(cs)
                        });
                }
            });

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