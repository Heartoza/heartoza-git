// Models/PasswordReset.cs
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Heartoza.Models
{
    [Table("PasswordResets")]
    public partial class PasswordReset
    {
        [Key]
        public int ResetId { get; set; }

        [Required]
        public int UserId { get; set; }

        [Required, MaxLength(64)]
        public string Token { get; set; } = default!;

        [Required]
        public DateTime ExpiresAt { get; set; }

        public DateTime? UsedAt { get; set; }

        [Required]
        public DateTime CreatedAt { get; set; }

        [ForeignKey(nameof(UserId))]
        public virtual User User { get; set; } = default!;
    }
}
