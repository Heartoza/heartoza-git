using Heartoza.Models;

namespace Heartoza.Services
{
    public interface IAuditService
    {
        Task LogAsync(int? userId, string action, string? detail, string? ip);
    }

    public class AuditService : IAuditService
    {
        private readonly GiftBoxShopContext _db;
        public AuditService(GiftBoxShopContext db) => _db = db;

        public async Task LogAsync(int? userId, string action, string? detail, string? ip)
        {
            try
            {
                _db.AuditLogs.Add(new AuditLog
                {
                    UserId = userId,
                    Action = action,
                    Detail = detail,
                    Ip = ip,
                    CreatedAt = DateTime.UtcNow
                });
                await _db.SaveChangesAsync();
            }
            catch { /* nuốt lỗi audit để không ảnh hưởng luồng chính */ }
        }
    }
}
