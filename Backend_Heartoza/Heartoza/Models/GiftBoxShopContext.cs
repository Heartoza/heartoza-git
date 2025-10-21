using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;

namespace Heartoza.Models;

public partial class GiftBoxShopContext : DbContext
{
    public GiftBoxShopContext(DbContextOptions<GiftBoxShopContext> options)
        : base(options)
    {
    }

    public virtual DbSet<Address> Addresses { get; set; }

    public virtual DbSet<AuditLog> AuditLogs { get; set; }

    public virtual DbSet<Banner> Banners { get; set; }

    public virtual DbSet<Cart> Carts { get; set; }

    public virtual DbSet<CartItem> CartItems { get; set; }

    public virtual DbSet<Category> Categories { get; set; }

    public virtual DbSet<EmailVerification> EmailVerifications { get; set; }

    public virtual DbSet<Inventory> Inventories { get; set; }

    public virtual DbSet<LoginAttempt> LoginAttempts { get; set; }

    public virtual DbSet<Medium> Media { get; set; }

    public virtual DbSet<Order> Orders { get; set; }

    public virtual DbSet<OrderItem> OrderItems { get; set; }

    public virtual DbSet<PasswordReset> PasswordResets { get; set; }

    public virtual DbSet<Payment> Payments { get; set; }

    public virtual DbSet<Product> Products { get; set; }

    public virtual DbSet<ProductMedium> ProductMedia { get; set; }

    public virtual DbSet<RefreshToken> RefreshTokens { get; set; }

    public virtual DbSet<SeoMetum> SeoMeta { get; set; }

    public virtual DbSet<Shipment> Shipments { get; set; }

    public virtual DbSet<User> Users { get; set; }

    public virtual DbSet<UserMedium> UserMedia { get; set; }

    public virtual DbSet<Voucher> Vouchers { get; set; }

    public virtual DbSet<VoucherUsage> VoucherUsages { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Address>(entity =>
        {
            entity.HasKey(e => e.AddressId).HasName("PK__Addresse__091C2AFB411F48D2");

            entity.HasIndex(e => e.UserId, "IX_Address_UserId");

            entity.Property(e => e.City).HasMaxLength(100);
            entity.Property(e => e.Country)
                .HasMaxLength(100)
                .HasDefaultValue("Vietnam");
            entity.Property(e => e.District).HasMaxLength(100);
            entity.Property(e => e.FullName).HasMaxLength(200);
            entity.Property(e => e.Line1).HasMaxLength(255);
            entity.Property(e => e.Phone)
                .HasMaxLength(30)
                .IsUnicode(false);
            entity.Property(e => e.PostalCode).HasMaxLength(20);

            entity.HasOne(d => d.User).WithMany(p => p.Addresses)
                .HasForeignKey(d => d.UserId)
                .HasConstraintName("FK_Addr_User");
        });

        modelBuilder.Entity<AuditLog>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__AuditLog__3214EC073A2CE4F6");

            entity.HasIndex(e => new { e.UserId, e.CreatedAt }, "IX_AuditLogs_UserTime");

            entity.Property(e => e.Action).HasMaxLength(100);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(sysutcdatetime())");
            entity.Property(e => e.Detail).HasMaxLength(2000);
            entity.Property(e => e.Ip).HasMaxLength(64);

            entity.HasOne(d => d.User).WithMany(p => p.AuditLogs)
                .HasForeignKey(d => d.UserId)
                .HasConstraintName("FK_AuditLogs_Users");
        });

        modelBuilder.Entity<Banner>(entity =>
        {
            entity.HasKey(e => e.BannerId).HasName("PK__Banners__32E86AD1731128B5");

            entity.HasIndex(e => new { e.Position, e.IsActive, e.StartAt, e.EndAt, e.SortOrder }, "IX_Banners_Position_Active_Time");

            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(sysutcdatetime())");
            entity.Property(e => e.ExternalImageUrl).HasMaxLength(500);
            entity.Property(e => e.IsActive).HasDefaultValue(true);
            entity.Property(e => e.LinkUrl).HasMaxLength(500);
            entity.Property(e => e.OpenInNewTab).HasDefaultValue(true);
            entity.Property(e => e.Position)
                .HasMaxLength(50)
                .IsUnicode(false);
            entity.Property(e => e.Title).HasMaxLength(200);

            entity.HasOne(d => d.CreatedByUser).WithMany(p => p.BannerCreatedByUsers)
                .HasForeignKey(d => d.CreatedByUserId)
                .HasConstraintName("FK_Banners_Users_CreatedBy");

            entity.HasOne(d => d.Media).WithMany(p => p.Banners)
                .HasForeignKey(d => d.MediaId)
                .HasConstraintName("FK_Banners_Media");

            entity.HasOne(d => d.UpdatedByUser).WithMany(p => p.BannerUpdatedByUsers)
                .HasForeignKey(d => d.UpdatedByUserId)
                .HasConstraintName("FK_Banners_Users_UpdatedBy");
        });

        modelBuilder.Entity<Cart>(entity =>
        {
            entity.HasKey(e => e.CartId).HasName("PK__Carts__51BCD7B7624448C0");

            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(sysutcdatetime())");

            entity.HasOne(d => d.User).WithMany(p => p.Carts)
                .HasForeignKey(d => d.UserId)
                .HasConstraintName("FK_Cart_User");
        });

        modelBuilder.Entity<CartItem>(entity =>
        {
            entity.HasKey(e => e.CartItemId).HasName("PK__CartItem__488B0B0A370566FF");

            entity.Property(e => e.LineTotal)
                .HasComputedColumnSql("([Quantity]*[UnitPrice])", true)
                .HasColumnType("decimal(29, 2)");
            entity.Property(e => e.UnitPrice).HasColumnType("decimal(18, 2)");

            entity.HasOne(d => d.Cart).WithMany(p => p.CartItems)
                .HasForeignKey(d => d.CartId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_CartItem_Cart");

            entity.HasOne(d => d.Product).WithMany(p => p.CartItems)
                .HasForeignKey(d => d.ProductId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_CartItem_Product");
        });

        modelBuilder.Entity<Category>(entity =>
        {
            entity.HasKey(e => e.CategoryId).HasName("PK__Categori__19093A0BF7600954");

            entity.Property(e => e.Name).HasMaxLength(200);

            entity.HasOne(d => d.Parent).WithMany(p => p.InverseParent)
                .HasForeignKey(d => d.ParentId)
                .HasConstraintName("FK_Cat_Parent");
        });

        modelBuilder.Entity<EmailVerification>(entity =>
        {
            entity.HasKey(e => e.EmailVerificationId).HasName("PK__EmailVer__C899D253807EA443");

            entity.HasIndex(e => e.Token, "UQ__EmailVer__1EB4F81734520B15").IsUnique();

            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(sysutcdatetime())");
            entity.Property(e => e.Token)
                .HasMaxLength(100)
                .IsUnicode(false);

            entity.HasOne(d => d.User).WithMany(p => p.EmailVerifications)
                .HasForeignKey(d => d.UserId)
                .HasConstraintName("FK_EmailVerifications_Users");
        });

        modelBuilder.Entity<Inventory>(entity =>
        {
            entity.HasKey(e => e.ProductId).HasName("PK__Inventor__B40CC6CD9AC8D7F9");

            entity.ToTable("Inventory");

            entity.Property(e => e.ProductId).ValueGeneratedNever();

            entity.HasOne(d => d.Product).WithOne(p => p.Inventory)
                .HasForeignKey<Inventory>(d => d.ProductId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Inv_Product");
        });

        modelBuilder.Entity<LoginAttempt>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__LoginAtt__3214EC07CFF0FFC5");

            entity.HasIndex(e => new { e.Email, e.CreatedAt }, "IX_LoginAttempts_EmailTime");

            entity.HasIndex(e => new { e.Ip, e.CreatedAt }, "IX_LoginAttempts_IpTime");

            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(sysutcdatetime())");
            entity.Property(e => e.Email)
                .HasMaxLength(255)
                .IsUnicode(false);
            entity.Property(e => e.Ip).HasMaxLength(64);
        });

        modelBuilder.Entity<Medium>(entity =>
        {
            entity.HasKey(e => e.MediaId).HasName("PK__Media__B2C2B5CF7DF159AB");

            entity.HasIndex(e => new { e.Container, e.BlobPath }, "IX_Media_ContainerPath");

            entity.Property(e => e.BlobPath).HasMaxLength(512);
            entity.Property(e => e.Container).HasMaxLength(100);
            entity.Property(e => e.ContentType).HasMaxLength(100);
            entity.Property(e => e.CreatedAt)
                .HasPrecision(3)
                .HasDefaultValueSql("(sysutcdatetime())");
            entity.Property(e => e.ExternalUrl).HasMaxLength(1000);
            entity.Property(e => e.FileName).HasMaxLength(255);
            entity.Property(e => e.SourceType)
                .HasMaxLength(20)
                .HasDefaultValue("blob");
            entity.Property(e => e.Status)
                .HasMaxLength(20)
                .HasDefaultValue("imported");
            entity.Property(e => e.StorageAccount)
                .HasMaxLength(100)
                .HasDefaultValue("");
        });

        modelBuilder.Entity<Order>(entity =>
        {
            entity.HasKey(e => e.OrderId).HasName("PK__Orders__C3905BCFA0059193");

            entity.HasIndex(e => e.ShippingAddressId, "IX_Order_ShippingAddrId");

            entity.HasIndex(e => e.UserId, "IX_Order_UserId");

            entity.HasIndex(e => e.OrderCode, "UQ__Orders__999B522923652D7E").IsUnique();

            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(sysutcdatetime())");
            entity.Property(e => e.GrandTotal).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.OrderCode)
                .HasMaxLength(32)
                .IsUnicode(false);
            entity.Property(e => e.ShippingFee).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.Status)
                .HasMaxLength(30)
                .IsUnicode(false)
                .HasDefaultValue("Pending");
            entity.Property(e => e.Subtotal).HasColumnType("decimal(18, 2)");

            entity.HasOne(d => d.ShippingAddress).WithMany(p => p.Orders)
                .HasForeignKey(d => d.ShippingAddressId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Order_ShipAddr");

            entity.HasOne(d => d.User).WithMany(p => p.Orders)
                .HasForeignKey(d => d.UserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Order_User");
        });

        modelBuilder.Entity<OrderItem>(entity =>
        {
            entity.HasKey(e => e.OrderItemId).HasName("PK__OrderIte__57ED0681E387504B");

            entity.HasIndex(e => e.OrderId, "IX_OrderItem_OrderId");

            entity.HasIndex(e => e.ProductId, "IX_OrderItem_ProductId");

            entity.Property(e => e.LineTotal)
                .HasComputedColumnSql("([Quantity]*[UnitPrice])", true)
                .HasColumnType("decimal(29, 2)");
            entity.Property(e => e.UnitPrice).HasColumnType("decimal(18, 2)");

            entity.HasOne(d => d.Order).WithMany(p => p.OrderItems)
                .HasForeignKey(d => d.OrderId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_OI_Order");

            entity.HasOne(d => d.Product).WithMany(p => p.OrderItems)
                .HasForeignKey(d => d.ProductId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_OI_Product");
        });

        modelBuilder.Entity<PasswordReset>(entity =>
        {
            entity.HasKey(e => e.ResetId).HasName("PK__Password__783CF04D0D5B7549");

            entity.HasIndex(e => e.Token, "IX_PasswordResets_Token");

            entity.HasIndex(e => e.Token, "UQ__Password__1EB4F81727991CE7").IsUnique();

            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(sysutcdatetime())");
            entity.Property(e => e.Token)
                .HasMaxLength(64)
                .IsUnicode(false);

            entity.HasOne(d => d.User).WithMany(p => p.PasswordResets)
                .HasForeignKey(d => d.UserId)
                .HasConstraintName("FK_PasswordResets_Users");
        });

        modelBuilder.Entity<Payment>(entity =>
        {
            entity.HasKey(e => e.PaymentId).HasName("PK__Payments__9B556A3844CC07A8");

            entity.Property(e => e.Amount).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(sysutcdatetime())");
            entity.Property(e => e.Method)
                .HasMaxLength(30)
                .IsUnicode(false);
            entity.Property(e => e.Status)
                .HasMaxLength(30)
                .IsUnicode(false)
                .HasDefaultValue("Pending");

            entity.HasOne(d => d.Order).WithMany(p => p.Payments)
                .HasForeignKey(d => d.OrderId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Pay_Order");
        });

        modelBuilder.Entity<Product>(entity =>
        {
            entity.HasKey(e => e.ProductId).HasName("PK__Products__B40CC6CD0F394B00");

            entity.HasIndex(e => e.CategoryId, "IX_Product_CategoryId");

            entity.HasIndex(e => e.Sku, "UQ__Products__CA1ECF0D7D1F6DFF").IsUnique();

            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(sysutcdatetime())");
            entity.Property(e => e.IsActive).HasDefaultValue(true);
            entity.Property(e => e.Name).HasMaxLength(255);
            entity.Property(e => e.Price).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.Sku)
                .HasMaxLength(64)
                .IsUnicode(false)
                .HasColumnName("SKU");

            entity.HasOne(d => d.Category).WithMany(p => p.Products)
                .HasForeignKey(d => d.CategoryId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Product_Category");
        });

        modelBuilder.Entity<ProductMedium>(entity =>
        {
            entity.HasKey(e => e.ProductMediaId).HasName("PK__ProductM__B583D85326303865");

            entity.HasIndex(e => new { e.ProductId, e.IsPrimary, e.SortOrder }, "IX_ProductMedia_Product");

            entity.HasIndex(e => new { e.ProductId, e.MediaId }, "UQ_ProductMedia_Unique").IsUnique();

            entity.Property(e => e.CreatedAt)
                .HasPrecision(3)
                .HasDefaultValueSql("(sysutcdatetime())");

            entity.HasOne(d => d.Media).WithMany(p => p.ProductMedia)
                .HasForeignKey(d => d.MediaId)
                .HasConstraintName("FK_ProductMedia_Media");

            entity.HasOne(d => d.Product).WithMany(p => p.ProductMedia)
                .HasForeignKey(d => d.ProductId)
                .HasConstraintName("FK_ProductMedia_Product");
        });

        modelBuilder.Entity<RefreshToken>(entity =>
        {
            entity.HasKey(e => e.RefreshTokenId).HasName("PK__RefreshT__F5845E39B50C9723");

            entity.HasIndex(e => new { e.UserId, e.RevokedAt }, "IX_RefreshTokens_User_Active").HasFilter("([RevokedAt] IS NULL)");

            entity.HasIndex(e => e.Token, "UQ__RefreshT__1EB4F817F853C7B2").IsUnique();

            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(sysutcdatetime())");
            entity.Property(e => e.Ip).HasMaxLength(64);
            entity.Property(e => e.Token)
                .HasMaxLength(255)
                .IsUnicode(false);
            entity.Property(e => e.UserAgent).HasMaxLength(200);

            entity.HasOne(d => d.User).WithMany(p => p.RefreshTokens)
                .HasForeignKey(d => d.UserId)
                .HasConstraintName("FK_RefreshTokens_Users");
        });

        modelBuilder.Entity<SeoMetum>(entity =>
        {
            entity.HasKey(e => e.SeoMetaId).HasName("PK__SeoMeta__1A17C80AF94BA20B");

            entity.HasIndex(e => e.Slug, "UX_SeoMeta_Slug").IsUnique();

            entity.Property(e => e.CanonicalUrl).HasMaxLength(500);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(sysutcdatetime())");
            entity.Property(e => e.Description).HasMaxLength(500);
            entity.Property(e => e.Keywords).HasMaxLength(500);
            entity.Property(e => e.OgImageUrl).HasMaxLength(500);
            entity.Property(e => e.Slug).HasMaxLength(300);
            entity.Property(e => e.Title).HasMaxLength(300);

            entity.HasOne(d => d.ImageMedia).WithMany(p => p.SeoMeta)
                .HasForeignKey(d => d.ImageMediaId)
                .HasConstraintName("FK_SeoMeta_Media");
        });

        modelBuilder.Entity<Shipment>(entity =>
        {
            entity.HasKey(e => e.ShipmentId).HasName("PK__Shipment__5CAD37EDB1AF919E");

            entity.Property(e => e.Carrier)
                .HasMaxLength(50)
                .IsUnicode(false);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(sysutcdatetime())");
            entity.Property(e => e.Status)
                .HasMaxLength(30)
                .IsUnicode(false)
                .HasDefaultValue("Packing");
            entity.Property(e => e.TrackingCode)
                .HasMaxLength(100)
                .IsUnicode(false);

            entity.HasOne(d => d.Order).WithMany(p => p.Shipments)
                .HasForeignKey(d => d.OrderId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Ship_Order");
        });

        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(e => e.UserId).HasName("PK__Users__1788CC4C58FA5C37");

            entity.HasIndex(e => e.Email, "UQ__Users__A9D1053475C9AF02").IsUnique();

            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(sysutcdatetime())");
            entity.Property(e => e.Email)
                .HasMaxLength(255)
                .IsUnicode(false);
            entity.Property(e => e.FullName).HasMaxLength(200);
            entity.Property(e => e.IsActive).HasDefaultValue(true);
            entity.Property(e => e.PasswordHash)
                .HasMaxLength(255)
                .IsUnicode(false);
            entity.Property(e => e.Phone)
                .HasMaxLength(30)
                .IsUnicode(false);
            entity.Property(e => e.Role)
                .HasMaxLength(30)
                .IsUnicode(false)
                .HasDefaultValue("Customer");
        });

        modelBuilder.Entity<UserMedium>(entity =>
        {
            entity.HasKey(e => e.UserMediaId).HasName("PK__UserMedi__9525267884F322D9");

            entity.HasIndex(e => new { e.UserId, e.IsPrimary, e.SortOrder }, "IX_UserMedia_User");

            entity.HasIndex(e => new { e.UserId, e.MediaId }, "UQ_UserMedia_Unique").IsUnique();

            entity.Property(e => e.CreatedAt)
                .HasPrecision(3)
                .HasDefaultValueSql("(sysutcdatetime())");

            entity.HasOne(d => d.Media).WithMany(p => p.UserMedia)
                .HasForeignKey(d => d.MediaId)
                .HasConstraintName("FK_UserMedia_Media");

            entity.HasOne(d => d.User).WithMany(p => p.UserMedia)
                .HasForeignKey(d => d.UserId)
                .HasConstraintName("FK_UserMedia_User");
        });

        modelBuilder.Entity<Voucher>(entity =>
        {
            entity.HasKey(e => e.VoucherId).HasName("PK__Vouchers__3AEE7921670B819A");

            entity.HasIndex(e => e.Code, "UX_Vouchers_Code").IsUnique();

            entity.Property(e => e.Code)
                .HasMaxLength(50)
                .IsUnicode(false);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(sysutcdatetime())");
            entity.Property(e => e.DiscountType)
                .HasMaxLength(20)
                .IsUnicode(false);
            entity.Property(e => e.DiscountValue).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.IsActive).HasDefaultValue(true);
            entity.Property(e => e.MaxDiscount).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.MinOrder).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.Name).HasMaxLength(200);

            entity.HasOne(d => d.CreatedByUser).WithMany(p => p.VoucherCreatedByUsers)
                .HasForeignKey(d => d.CreatedByUserId)
                .HasConstraintName("FK_Vouchers_Users_CreatedBy");

            entity.HasOne(d => d.UpdatedByUser).WithMany(p => p.VoucherUpdatedByUsers)
                .HasForeignKey(d => d.UpdatedByUserId)
                .HasConstraintName("FK_Vouchers_Users_UpdatedBy");
        });

        modelBuilder.Entity<VoucherUsage>(entity =>
        {
            entity.HasKey(e => e.VoucherUsageId).HasName("PK__VoucherU__4264F80BC2BA50C7");

            entity.HasIndex(e => e.UserId, "IX_VoucherUsages_User");

            entity.HasIndex(e => e.VoucherId, "IX_VoucherUsages_Voucher");

            entity.Property(e => e.DiscountApplied).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.UsedAt).HasDefaultValueSql("(sysutcdatetime())");

            entity.HasOne(d => d.Order).WithMany(p => p.VoucherUsages)
                .HasForeignKey(d => d.OrderId)
                .HasConstraintName("FK_VoucherUsages_Orders");

            entity.HasOne(d => d.User).WithMany(p => p.VoucherUsages)
                .HasForeignKey(d => d.UserId)
                .HasConstraintName("FK_VoucherUsages_Users");

            entity.HasOne(d => d.Voucher).WithMany(p => p.VoucherUsages)
                .HasForeignKey(d => d.VoucherId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_VoucherUsages_Vouchers");
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}
