/* =========================
   GiftBoxShop – Clean Setup
   (Users/Products image-ready)
   ========================= */

-- 0) Create & Use DB
IF DB_ID('GiftBoxShop') IS NULL
    CREATE DATABASE GiftBoxShop;
GO
USE GiftBoxShop;
GO

/* =========================
   1) Core tables
   ========================= */

-- Users (LastLoginAt)
CREATE TABLE dbo.Users (
    UserId       INT IDENTITY PRIMARY KEY,
    FullName     NVARCHAR(200) NULL,
    Email        VARCHAR(255)  NOT NULL UNIQUE,
    Phone        VARCHAR(30)   NULL,
    PasswordHash VARCHAR(255)  NOT NULL,
    Role         VARCHAR(30)   NOT NULL DEFAULT 'Customer',
    IsActive     BIT           NOT NULL DEFAULT 1,
    LastLoginAt  DATETIME2     NULL,
    CreatedAt    DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME()
);

-- Addresses (đã có IsDefault)
CREATE TABLE dbo.Addresses (
    AddressId  INT IDENTITY PRIMARY KEY,
    UserId     INT           NOT NULL,
    FullName   NVARCHAR(200) NULL,
    Line1      NVARCHAR(255) NULL,
    District   NVARCHAR(100) NULL,
    City       NVARCHAR(100) NULL,
    Country    NVARCHAR(100) NOT NULL DEFAULT 'Vietnam',
    PostalCode NVARCHAR(20)  NULL,
    Phone      VARCHAR(30)   NULL,
    IsDefault  BIT           NOT NULL DEFAULT 0,
    CONSTRAINT FK_Addr_User FOREIGN KEY (UserId)
        REFERENCES dbo.Users(UserId) ON DELETE CASCADE
);
CREATE INDEX IX_Address_UserId ON dbo.Addresses(UserId);

-- Categories
CREATE TABLE dbo.Categories (
    CategoryId INT IDENTITY PRIMARY KEY,
    Name       NVARCHAR(200) NOT NULL,
    ParentId   INT NULL,
    CONSTRAINT FK_Cat_Parent FOREIGN KEY (ParentId)
        REFERENCES dbo.Categories(CategoryId)
);

-- Products
CREATE TABLE dbo.Products (
    ProductId  INT IDENTITY PRIMARY KEY,
    Name       NVARCHAR(255) NOT NULL,
    SKU        VARCHAR(64)   NOT NULL UNIQUE,
    Price      DECIMAL(18,2) NOT NULL,
    CategoryId INT           NOT NULL,
    IsActive   BIT           NOT NULL DEFAULT 1,
    CreatedAt  DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_Product_Category FOREIGN KEY (CategoryId)
        REFERENCES dbo.Categories(CategoryId)
);
CREATE INDEX IX_Product_CategoryId ON dbo.Products(CategoryId);

-- Inventory
CREATE TABLE dbo.Inventory (
    ProductId INT PRIMARY KEY,
    Quantity  INT NOT NULL,
    CONSTRAINT FK_Inv_Product FOREIGN KEY (ProductId)
        REFERENCES dbo.Products(ProductId)
);

-- Orders
CREATE TABLE dbo.Orders (
    OrderId           INT IDENTITY PRIMARY KEY,
    OrderCode         VARCHAR(32) NOT NULL UNIQUE,
    UserId            INT NOT NULL,
    ShippingAddressId INT NOT NULL,
    Subtotal          DECIMAL(18,2) NOT NULL,
    ShippingFee       DECIMAL(18,2) NOT NULL DEFAULT 0,
    GrandTotal        DECIMAL(18,2) NOT NULL,
    Status            VARCHAR(30)   NOT NULL DEFAULT 'Pending',
    Comment           NVARCHAR(MAX) NULL,
    CreatedAt         DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_Order_User FOREIGN KEY (UserId)
        REFERENCES dbo.Users(UserId),
    CONSTRAINT FK_Order_ShipAddr FOREIGN KEY (ShippingAddressId)
        REFERENCES dbo.Addresses(AddressId)
);
CREATE INDEX IX_Order_UserId ON dbo.Orders(UserId);
CREATE INDEX IX_Order_ShippingAddrId ON dbo.Orders(ShippingAddressId);

-- OrderItems
CREATE TABLE dbo.OrderItems (
    OrderItemId INT IDENTITY PRIMARY KEY,
    OrderId     INT NOT NULL,
    ProductId   INT NOT NULL,
    Quantity    INT NOT NULL,
    UnitPrice   DECIMAL(18,2) NOT NULL,
    LineTotal   AS (Quantity * UnitPrice) PERSISTED,
    CONSTRAINT FK_OI_Order FOREIGN KEY (OrderId)
        REFERENCES dbo.Orders(OrderId),
    CONSTRAINT FK_OI_Product FOREIGN KEY (ProductId)
        REFERENCES dbo.Products(ProductId)
);
CREATE INDEX IX_OrderItem_OrderId ON dbo.OrderItems(OrderId);
CREATE INDEX IX_OrderItem_ProductId ON dbo.OrderItems(ProductId);

-- Payments
CREATE TABLE dbo.Payments (
    PaymentId INT IDENTITY PRIMARY KEY,
    OrderId   INT NOT NULL,
    Amount    DECIMAL(18,2) NOT NULL,
    Method    VARCHAR(30)   NOT NULL,
    Status    VARCHAR(30)   NOT NULL DEFAULT 'Pending',
    CreatedAt DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_Pay_Order FOREIGN KEY (OrderId)
        REFERENCES dbo.Orders(OrderId)
);

-- Shipments
CREATE TABLE dbo.Shipments (
    ShipmentId   INT IDENTITY PRIMARY KEY,
    OrderId      INT NOT NULL,
    Carrier      VARCHAR(50)  NULL,
    TrackingCode VARCHAR(100) NULL,
    Status       VARCHAR(30)  NOT NULL DEFAULT 'Packing',
    CreatedAt    DATETIME2    NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_Ship_Order FOREIGN KEY (OrderId)
        REFERENCES dbo.Orders(OrderId)
);

-- Carts
CREATE TABLE dbo.Carts (
    CartId    INT IDENTITY PRIMARY KEY,
    UserId    INT NOT NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_Cart_User FOREIGN KEY (UserId)
        REFERENCES dbo.Users(UserId) ON DELETE CASCADE
);

CREATE TABLE dbo.CartItems (
    CartItemId INT IDENTITY PRIMARY KEY,
    CartId     INT NOT NULL,
    ProductId  INT NOT NULL,
    Quantity   INT NOT NULL,
    UnitPrice  DECIMAL(18,2) NOT NULL,
    LineTotal  AS (Quantity * UnitPrice) PERSISTED,
    CONSTRAINT FK_CartItem_Cart FOREIGN KEY (CartId)
        REFERENCES dbo.Carts(CartId),
    CONSTRAINT FK_CartItem_Product FOREIGN KEY (ProductId)
        REFERENCES dbo.Products(ProductId)
);

/* =========================
   2) Image tables (Users & Products only)
   ========================= */

-- Media (metadata ảnh/file; blob hoặc url ngoài)
CREATE TABLE dbo.Media (
    MediaId        BIGINT IDENTITY PRIMARY KEY,
    StorageAccount NVARCHAR(100) NOT NULL DEFAULT N'',   -- để trống nếu 1 account
    Container      NVARCHAR(100) NOT NULL,               -- vd: 'media'
    BlobPath       NVARCHAR(512) NOT NULL,               -- 'products/2025/10/.../guid.jpg'
    FileName       NVARCHAR(255) NOT NULL,
    ContentType    NVARCHAR(100) NOT NULL,               -- 'image/jpeg','image/webp',...
    ByteSize       BIGINT        NOT NULL DEFAULT 0,
    Width          INT           NULL,
    Height         INT           NULL,
    SourceType     NVARCHAR(20)  NOT NULL DEFAULT 'blob',  -- 'blob'|'external'
    ExternalUrl    NVARCHAR(1000) NULL,                    -- nếu SourceType='external'
    Status         NVARCHAR(20)  NOT NULL DEFAULT 'imported', -- 'pending'|'imported'
    CreatedAt      DATETIME2(3)  NOT NULL DEFAULT SYSUTCDATETIME()
);
CREATE INDEX IX_Media_ContainerPath ON dbo.Media(Container, BlobPath);

-- Ảnh người dùng (avatar, gallery)
CREATE TABLE dbo.UserMedia (
    UserMediaId BIGINT IDENTITY PRIMARY KEY,
    UserId      INT    NOT NULL,
    MediaId     BIGINT NOT NULL,
    IsPrimary   BIT    NOT NULL DEFAULT 0,
    SortOrder   INT    NOT NULL DEFAULT 0,
    CreatedAt   DATETIME2(3) NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_UserMedia_User  FOREIGN KEY (UserId)  REFERENCES dbo.Users(UserId)  ON DELETE CASCADE,
    CONSTRAINT FK_UserMedia_Media FOREIGN KEY (MediaId) REFERENCES dbo.Media(MediaId) ON DELETE CASCADE,
    CONSTRAINT UQ_UserMedia_Unique UNIQUE(UserId, MediaId)
);
CREATE INDEX IX_UserMedia_User ON dbo.UserMedia(UserId, IsPrimary, SortOrder);

-- Ảnh sản phẩm (1 ảnh chính + nhiều ảnh phụ)
CREATE TABLE dbo.ProductMedia (
    ProductMediaId BIGINT IDENTITY PRIMARY KEY,
    ProductId      INT    NOT NULL,
    MediaId        BIGINT NOT NULL,
    IsPrimary      BIT    NOT NULL DEFAULT 0,
    SortOrder      INT    NOT NULL DEFAULT 0,
    CreatedAt      DATETIME2(3) NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_ProductMedia_Product FOREIGN KEY (ProductId) REFERENCES dbo.Products(ProductId) ON DELETE CASCADE,
    CONSTRAINT FK_ProductMedia_Media   FOREIGN KEY (MediaId)   REFERENCES dbo.Media(MediaId)   ON DELETE CASCADE,
    CONSTRAINT UQ_ProductMedia_Unique UNIQUE(ProductId, MediaId)
);
CREATE INDEX IX_ProductMedia_Product ON dbo.ProductMedia(ProductId, IsPrimary, SortOrder);

/* =========================
   3) Security/utility tables
   ========================= */

-- PasswordResets
CREATE TABLE dbo.PasswordResets (
    ResetId   INT IDENTITY PRIMARY KEY,
    UserId    INT NOT NULL,
    Token     VARCHAR(64)  NOT NULL UNIQUE,
    ExpiresAt DATETIME2     NOT NULL,
    UsedAt    DATETIME2     NULL,
    CreatedAt DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_PasswordResets_Users FOREIGN KEY (UserId)
        REFERENCES dbo.Users(UserId) ON DELETE CASCADE
);
CREATE INDEX IX_PasswordResets_Token ON dbo.PasswordResets(Token);

-- RefreshTokens
CREATE TABLE dbo.RefreshTokens (
    RefreshTokenId INT IDENTITY PRIMARY KEY,
    UserId   INT NOT NULL,
    Token    VARCHAR(255) NOT NULL UNIQUE,
    ExpiresAt DATETIME2   NOT NULL,
    RevokedAt DATETIME2   NULL,
    CreatedAt DATETIME2   NOT NULL DEFAULT SYSUTCDATETIME(),
    UserAgent NVARCHAR(200) NULL,
    Ip       NVARCHAR(64)  NULL,
    CONSTRAINT FK_RefreshTokens_Users FOREIGN KEY (UserId)
        REFERENCES dbo.Users(UserId) ON DELETE CASCADE
);
CREATE INDEX IX_RefreshTokens_User_Active
    ON dbo.RefreshTokens(UserId, RevokedAt) WHERE RevokedAt IS NULL;

-- EmailVerifications
CREATE TABLE dbo.EmailVerifications (
    EmailVerificationId INT IDENTITY PRIMARY KEY,
    UserId    INT NOT NULL,
    Token     VARCHAR(100) NOT NULL UNIQUE,
    ExpiresAt DATETIME2    NOT NULL,
    UsedAt    DATETIME2    NULL,
    CreatedAt DATETIME2    NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_EmailVerifications_Users FOREIGN KEY (UserId)
        REFERENCES dbo.Users(UserId) ON DELETE CASCADE
);

-- LoginAttempts
CREATE TABLE dbo.LoginAttempts (
    Id        BIGINT IDENTITY PRIMARY KEY,
    Email     VARCHAR(255) NULL,
    Ip        NVARCHAR(64) NULL,
    Success   BIT NOT NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);
CREATE INDEX IX_LoginAttempts_EmailTime ON dbo.LoginAttempts(Email, CreatedAt);
CREATE INDEX IX_LoginAttempts_IpTime    ON dbo.LoginAttempts(Ip, CreatedAt);

-- AuditLogs
CREATE TABLE dbo.AuditLogs (
    Id        BIGINT IDENTITY PRIMARY KEY,
    UserId    INT NULL,
    Action    NVARCHAR(100) NOT NULL,
    Detail    NVARCHAR(2000) NULL,
    Ip        NVARCHAR(64) NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_AuditLogs_Users FOREIGN KEY (UserId)
        REFERENCES dbo.Users(UserId)
);
CREATE INDEX IX_AuditLogs_UserTime ON dbo.AuditLogs(UserId, CreatedAt);

/* =========================
   4) Seed data
   ========================= */

-- Users
INSERT INTO dbo.Users(FullName, Email, Phone, PasswordHash, Role, IsActive)
VALUES
 (N'Nguyễn An',   'an1@example.com',  '0900000001', 'hash', 'Customer', 1),
 (N'Trần Bình',   'binh2@example.com','0900000002', 'hash', 'Customer', 1),
 (N'Lê Chi',      'chi3@example.com', '0900000003', 'hash', 'Customer', 1),
 (N'Phạm Dũng',   'dung4@example.com','0900000004', 'hash', 'Customer', 1),
 (N'Hồ Em',       'em5@example.com',  '0900000005', 'hash', 'Customer', 1),
 (N'Đỗ Giang',    'giang6@example.com','0900000006','hash', 'Customer', 1),
 (N'Vũ Hạnh',     'hanh7@example.com','0900000007', 'hash', 'Customer', 1),
 (N'Bùi Khoa',    'khoa8@example.com','0900000008', 'hash', 'Customer', 1),
 (N'Lý Lan',      'lan9@example.com', '0900000009', 'hash', 'Customer', 1),
 (N'Phan Minh',   'minh10@example.com','0900000010','hash', 'Customer', 1);

-- Addresses
INSERT INTO dbo.Addresses(UserId, FullName, Line1, District, City, Country, PostalCode, Phone, IsDefault)
VALUES
 (1, N'Nguyễn An',  N'12 Nguyễn Trãi',   N'Q1',           N'HCM',    N'Vietnam','700000','0900000001',1),
 (2, N'Trần Bình',  N'34 Hai Bà Trưng',  N'Q3',           N'HCM',    N'Vietnam','700000','0900000002',1),
 (3, N'Lê Chi',     N'56 Lý Thường Kiệt',N'Hoàn Kiếm',    N'Hà Nội', N'Vietnam','100000','0900000003',1),
 (4, N'Phạm Dũng',  N'78 Bạch Mai',      N'Hai Bà Trưng', N'Hà Nội', N'Vietnam','100000','0900000004',1),
 (5, N'Hồ Em',      N'91 Trần Phú',      N'Hải Châu',     N'Đà Nẵng',N'Vietnam','550000','0900000005',1),
 (6, N'Đỗ Giang',   N'22 Hùng Vương',    N'Thanh Khê',    N'Đà Nẵng',N'Vietnam','550000','0900000006',1),
 (7, N'Vũ Hạnh',    N'15 Lê Lợi',        N'Ninh Kiều',    N'Cần Thơ',N'Vietnam','900000','0900000007',1),
 (8, N'Bùi Khoa',   N'88 Phan Chu Trinh',N'Q1',           N'HCM',    N'Vietnam','700000','0900000008',1),
 (9, N'Lý Lan',     N'101 Điện Biên Phủ',N'Bình Thạnh',   N'HCM',    N'Vietnam','700000','0900000009',1),
 (10,N'Phan Minh',  N'202 Trường Chinh', N'Tân Bình',     N'HCM',    N'Vietnam','700000','0900000010',1);

-- Categories
INSERT INTO dbo.Categories(Name, ParentId) VALUES
 (N'Hộp quà', NULL),
 (N'Bánh kẹo', NULL),
 (N'Đồ uống', NULL),
 (N'Lưu niệm', NULL),
 (N'Phụ kiện', NULL);

-- Products
INSERT INTO dbo.Products(Name, SKU, Price, CategoryId, IsActive) VALUES
 (N'Hộp nhỏ',     'BX-S',   30000, 1, 1),
 (N'Hộp vừa',     'BX-M',   50000, 1, 1),
 (N'Hộp lớn',     'BX-L',   70000, 1, 1),
 (N'Kẹo trái cây','CK-001', 35000, 2, 1),
 (N'Sô cô la 70%','CH-002', 55000, 2, 1),
 (N'Trà hoa',     'TEA-01', 45000, 3, 1),
 (N'Cà phê rang', 'COF-01', 65000, 3, 1),
 (N'Cốc sứ trắng','MUG-01', 90000, 4, 1),
 (N'Thiệp chúc',  'CARD-1', 15000, 5, 1),
 (N'Ruy băng',    'RIB-01', 10000, 5, 1);

-- Inventory
INSERT INTO dbo.Inventory(ProductId, Quantity) VALUES
 (1,100),(2,80),(3,60),(4,200),(5,150),(6,120),(7,100),(8,70),(9,300),(10,500);

-- Orders
INSERT INTO dbo.Orders(OrderCode, UserId, ShippingAddressId, Subtotal, ShippingFee, GrandTotal, Status)
VALUES
 ('ORD-20250914-0001', 1, 1,  115000, 25000, 140000, 'Pending'),
 ('ORD-20250914-0002', 2, 2,  205000, 30000, 235000, 'Pending'),
 ('ORD-20250914-0003', 3, 3,  150000, 20000, 170000, 'Pending'),
 ('ORD-20250914-0004', 4, 4,  235000, 25000, 260000, 'Pending'),
 ('ORD-20250914-0005', 5, 5,  180000, 30000, 210000, 'Pending'),
 ('ORD-20250914-0006', 6, 6,  255000, 25000, 280000, 'Pending'),
 ('ORD-20250914-0007', 7, 7,  120000, 20000, 140000, 'Pending'),
 ('ORD-20250914-0008', 8, 8,  305000, 30000, 335000, 'Pending'),
 ('ORD-20250914-0009', 9, 9,  165000, 25000, 190000, 'Pending'),
 ('ORD-20250914-0010',10,10, 220000, 30000, 250000, 'Pending');

-- OrderItems
INSERT INTO dbo.OrderItems(OrderId, ProductId, Quantity, UnitPrice) VALUES
 (1, 1, 1, 30000),(1, 4, 2, 35000),(1, 9, 1, 15000),
 (2, 2, 1, 50000),(2, 5, 2, 55000),(2, 8, 1, 90000),(2,10,5,10000),
 (3, 1, 2, 30000),(3, 6, 2, 45000),
 (4, 3, 1, 70000),(4, 7, 2, 65000),(4, 9, 1, 15000),(4, 4, 2, 35000),
 (5, 2, 1, 50000),(5, 8, 1, 90000),(5,10,4,10000),
 (6, 3, 1, 70000),(6, 5, 3, 55000),(6,10,2,10000),
 (7, 1, 1, 30000),(7, 4, 1, 35000),(7,10,2,10000),(7, 9, 2, 15000),
 (8, 2, 1, 50000),(8, 3, 1, 70000),(8, 7, 2, 65000),(8, 9, 1, 15000),(8,10,4,10000),
 (9, 1, 1, 30000),(9, 6, 3, 45000),
 (10,3, 1, 70000),(10,8, 1, 90000),(10,10,6,10000);

-- Payments (Amount = GrandTotal)
INSERT INTO dbo.Payments(OrderId, Amount, Method, Status)
SELECT OrderId, GrandTotal,
       CASE WHEN OrderId IN (2,4,6,8,10) THEN 'MoMo' ELSE 'COD' END,
       CASE WHEN OrderId IN (2,6,9) THEN 'Success' ELSE 'Pending' END
FROM dbo.Orders;

-- Shipments
INSERT INTO dbo.Shipments(OrderId, Carrier, TrackingCode, Status) VALUES
 (1,'GHN','GHN-0001','Packing'),
 (2,'GHTK','GHTK-0002','Shipped'),
 (3,'GHN','GHN-0003','Packing'),
 (4,'VNPost','VN-0004','Packing'),
 (5,'Ninja','NJ-0005','Packing'),
 (6,'GHN','GHN-0006','Shipped'),
 (7,'GHTK','GHTK-0007','Packing'),
 (8,'VNPost','VN-0008','Packing'),
 (9,'GHN','GHN-0009','Delivered'),
 (10,'Ninja','NJ-0010','Packing');

-- (Optional demo) Seed ảnh external cho Users & Products (chỉ minh họa)
-- Anh có thể thay ExternalUrl bằng link thật; sau này ingest về Blob cập nhật Container/BlobPath/SourceType='blob'
INSERT INTO dbo.Media (StorageAccount, Container, BlobPath, FileName, ContentType, ByteSize, SourceType, ExternalUrl)
VALUES
 (N'', N'external', N'users/an1.jpg',  N'an1.jpg',  N'image/jpeg', 0, N'external', N'https://i.pravatar.cc/300?u=an1'),
 (N'', N'external', N'users/binh2.jpg',N'binh2.jpg',N'image/jpeg', 0, N'external', N'https://i.pravatar.cc/300?u=binh2'),
 (N'', N'external', N'products/bx-s.jpg',N'bx-s.jpg',N'image/jpeg', 0, N'external', N'https://picsum.photos/seed/bxs/800/800'),
 (N'', N'external', N'products/bx-m.jpg',N'bx-m.jpg',N'image/jpeg', 0, N'external', N'https://picsum.photos/seed/bxm/800/800');

-- map avatar (UserMedia)
INSERT INTO dbo.UserMedia(UserId, MediaId, IsPrimary, SortOrder)
SELECT u.UserId, m.MediaId, 1, 0
FROM dbo.Users u
JOIN dbo.Media m ON (m.ExternalUrl LIKE '%an1%' AND u.Email='an1@example.com')
UNION ALL
SELECT u.UserId, m.MediaId, 1, 0
FROM dbo.Users u
JOIN dbo.Media m ON (m.ExternalUrl LIKE '%binh2%' AND u.Email='binh2@example.com');

-- map ảnh sản phẩm (ProductMedia)
-- BX-S -> media 'bxs'; BX-M -> 'bxm'
INSERT INTO dbo.ProductMedia(ProductId, MediaId, IsPrimary, SortOrder)
SELECT p.ProductId, m.MediaId, 1, 0
FROM dbo.Products p
JOIN dbo.Media m ON p.SKU='BX-S' AND m.ExternalUrl LIKE '%bxs%'
UNION ALL
SELECT p.ProductId, m.MediaId, 1, 0
FROM dbo.Products p
JOIN dbo.Media m ON p.SKU='BX-M' AND m.ExternalUrl LIKE '%bxm%';
GO
