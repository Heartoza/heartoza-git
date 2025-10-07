-- Database
CREATE DATABASE GiftBoxShop;
GO
USE GiftBoxShop;
GO

-- Users
CREATE TABLE Users (
    UserId INT IDENTITY PRIMARY KEY,
    FullName NVARCHAR(200),
    Email VARCHAR(255) UNIQUE NOT NULL,
    Phone VARCHAR(30),
    PasswordHash VARCHAR(255) NOT NULL,
    Role VARCHAR(30) DEFAULT 'Customer',
    IsActive BIT DEFAULT 1,
    CreatedAt DATETIME2 DEFAULT SYSUTCDATETIME()
);

-- Addresses
CREATE TABLE Addresses (
    AddressId INT IDENTITY PRIMARY KEY,
    UserId INT NOT NULL,
    FullName NVARCHAR(200),
    Line1 NVARCHAR(255),
    District NVARCHAR(100),
    City NVARCHAR(100),
    Country NVARCHAR(100) DEFAULT 'Vietnam',
    PostalCode NVARCHAR(20),
    Phone VARCHAR(30),
    CONSTRAINT FK_Addr_User FOREIGN KEY (UserId) REFERENCES Users(UserId) ON DELETE CASCADE
);
CREATE INDEX IX_Address_UserId ON Addresses(UserId);

-- Categories
CREATE TABLE Categories (
    CategoryId INT IDENTITY PRIMARY KEY,
    Name NVARCHAR(200) NOT NULL,
    ParentId INT NULL,
    CONSTRAINT FK_Cat_Parent FOREIGN KEY (ParentId) REFERENCES Categories(CategoryId)
);

-- Products
CREATE TABLE Products (
    ProductId INT IDENTITY PRIMARY KEY,
    Name NVARCHAR(255) NOT NULL,
    SKU VARCHAR(64) UNIQUE NOT NULL,
    Price DECIMAL(18,2) NOT NULL,
    CategoryId INT NOT NULL,
    IsActive BIT DEFAULT 1,
    CreatedAt DATETIME2 DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_Product_Category FOREIGN KEY (CategoryId) REFERENCES Categories(CategoryId)
);
CREATE INDEX IX_Product_CategoryId ON Products(CategoryId);

-- Inventory
CREATE TABLE Inventory (
    ProductId INT PRIMARY KEY,
    Quantity INT NOT NULL,
    CONSTRAINT FK_Inv_Product FOREIGN KEY (ProductId) REFERENCES Products(ProductId)
);

-- Orders
CREATE TABLE Orders (
    OrderId INT IDENTITY PRIMARY KEY,
    OrderCode VARCHAR(32) UNIQUE NOT NULL,
    UserId INT NOT NULL,
    ShippingAddressId INT NOT NULL,
    Subtotal DECIMAL(18,2) NOT NULL,
    ShippingFee DECIMAL(18,2) DEFAULT 0,
    GrandTotal DECIMAL(18,2) NOT NULL,
    Status VARCHAR(30) DEFAULT 'Pending',
    CreatedAt DATETIME2 DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_Order_User FOREIGN KEY (UserId) REFERENCES Users(UserId),
    CONSTRAINT FK_Order_ShipAddr FOREIGN KEY (ShippingAddressId) REFERENCES Addresses(AddressId)
);
CREATE INDEX IX_Order_UserId ON Orders(UserId);
CREATE INDEX IX_Order_ShippingAddrId ON Orders(ShippingAddressId);

-- OrderItems
CREATE TABLE OrderItems (
    OrderItemId INT IDENTITY PRIMARY KEY,
    OrderId INT NOT NULL,
    ProductId INT NOT NULL,
    Quantity INT NOT NULL,
    UnitPrice DECIMAL(18,2) NOT NULL,
    LineTotal AS (Quantity * UnitPrice) PERSISTED,
    CONSTRAINT FK_OI_Order FOREIGN KEY (OrderId) REFERENCES Orders(OrderId),
    CONSTRAINT FK_OI_Product FOREIGN KEY (ProductId) REFERENCES Products(ProductId)
);
CREATE INDEX IX_OrderItem_OrderId ON OrderItems(OrderId);
CREATE INDEX IX_OrderItem_ProductId ON OrderItems(ProductId);

-- Payments
CREATE TABLE Payments (
    PaymentId INT IDENTITY PRIMARY KEY,
    OrderId INT NOT NULL,
    Amount DECIMAL(18,2) NOT NULL,
    Method VARCHAR(30) NOT NULL,
    Status VARCHAR(30) DEFAULT 'Pending',
    CreatedAt DATETIME2 DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_Pay_Order FOREIGN KEY (OrderId) REFERENCES Orders(OrderId)
);

-- Shipments
CREATE TABLE Shipments (
    ShipmentId INT IDENTITY PRIMARY KEY,
    OrderId INT NOT NULL,
    Carrier VARCHAR(50),
    TrackingCode VARCHAR(100),
    Status VARCHAR(30) DEFAULT 'Packing',
    CreatedAt DATETIME2 DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_Ship_Order FOREIGN KEY (OrderId) REFERENCES Orders(OrderId)
);

USE GiftBoxShop;
GO

/* =========================
   1) USERS (10 bản ghi)
   ========================= */
INSERT INTO Users(FullName, Email, Phone, PasswordHash, Role, IsActive)
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

/* =========================
   2) ADDRESSES (10 bản ghi)
   ========================= */
INSERT INTO Addresses(UserId, FullName, Line1, District, City, Country, PostalCode, Phone)
VALUES
 (1, N'Nguyễn An',  N'12 Nguyễn Trãi',  N'Q1', N'HCM',  N'Vietnam', '700000', '0900000001'),
 (2, N'Trần Bình',  N'34 Hai Bà Trưng', N'Q3', N'HCM',  N'Vietnam', '700000', '0900000002'),
 (3, N'Lê Chi',     N'56 Lý Thường Kiệt',N'Hoàn Kiếm',N'Hà Nội',N'Vietnam','100000','0900000003'),
 (4, N'Phạm Dũng',  N'78 Bạch Mai',     N'Hai Bà Trưng',N'Hà Nội',N'Vietnam','100000','0900000004'),
 (5, N'Hồ Em',      N'91 Trần Phú',     N'Hải Châu',N'Đà Nẵng',N'Vietnam','550000','0900000005'),
 (6, N'Đỗ Giang',   N'22 Hùng Vương',   N'Thanh Khê',N'Đà Nẵng',N'Vietnam','550000','0900000006'),
 (7, N'Vũ Hạnh',    N'15 Lê Lợi',       N'Ninh Kiều',N'Cần Thơ',N'Vietnam','900000','0900000007'),
 (8, N'Bùi Khoa',   N'88 Phan Chu Trinh',N'Q1',N'HCM', N'Vietnam','700000','0900000008'),
 (9, N'Lý Lan',     N'101 Điện Biên Phủ',N'Bình Thạnh',N'HCM',N'Vietnam','700000','0900000009'),
 (10,N'Phan Minh',  N'202 Trường Chinh', N'Tân Bình',N'HCM',N'Vietnam','700000','0900000010');

/* =========================
   3) CATEGORIES (5 bản ghi)
   - 1 = Hộp quà (dùng để enforce rule)
   ========================= */
INSERT INTO Categories(Name, ParentId) VALUES
 (N'Hộp quà', NULL),
 (N'Bánh kẹo', NULL),
 (N'Đồ uống', NULL),
 (N'Lưu niệm', NULL),
 (N'Phụ kiện', NULL);

/* =========================
   4) PRODUCTS (10 bản ghi)
   - 1..3 là Hộp quà
   ========================= */
INSERT INTO Products(Name, SKU, Price, CategoryId, IsActive)
VALUES
 (N'Hộp nhỏ',    'BX-S', 30000, 1, 1),
 (N'Hộp vừa',    'BX-M', 50000, 1, 1),
 (N'Hộp lớn',    'BX-L', 70000, 1, 1),
 (N'Kẹo trái cây','CK-001', 35000, 2, 1),
 (N'Sô cô la 70%','CH-002', 55000, 2, 1),
 (N'Trà hoa',     'TEA-01', 45000, 3, 1),
 (N'Cà phê rang', 'COF-01', 65000, 3, 1),
 (N'Cốc sứ trắng','MUG-01', 90000, 4, 1),
 (N'Thiệp chúc',  'CARD-1', 15000, 5, 1),
 (N'Ruy băng',    'RIB-01', 10000, 5, 1);

/* =========================
   5) INVENTORY (10 bản ghi, đủ tồn)
   ========================= */
INSERT INTO Inventory(ProductId, Quantity) VALUES
 (1,100),(2,80),(3,60),(4,200),(5,150),(6,120),(7,100),(8,70),(9,300),(10,500);

/* =========================
   6) ORDERS (10 bản ghi)
   ========================= */
INSERT INTO Orders(OrderCode, UserId, ShippingAddressId, Subtotal, ShippingFee, GrandTotal, Status)
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

/* =========================
   7) ORDER ITEMS (mỗi đơn 2–4 dòng)
   - Giá UnitPrice khớp Products
   - Có ít nhất 1 item thuộc CategoryId=1 (Hộp quà) trong mỗi đơn
   ========================= */

-- Order 1: BX-S x1 (30000), Kẹo x2 (70000), Thiệp x1 (15000) = 115000
INSERT INTO OrderItems(OrderId, ProductId, Quantity, UnitPrice) VALUES
 (1, 1, 1, 30000),
 (1, 4, 2, 35000),
 (1, 9, 1, 15000);

-- Order 2: BX-M x1 (50000), Socola x2 (110000), Cốc x1 (90000), Ruy băng x5 (50000) = 205000
INSERT INTO OrderItems(OrderId, ProductId, Quantity, UnitPrice) VALUES
 (2, 2, 1, 50000),
 (2, 5, 2, 55000),
 (2, 8, 1, 90000),
 (2, 10,5, 10000);

-- Order 3: BX-S x2 (60000), Trà x2 (90000) = 150000
INSERT INTO OrderItems(OrderId, ProductId, Quantity, UnitPrice) VALUES
 (3, 1, 2, 30000),
 (3, 6, 2, 45000);

-- Order 4: BX-L x1 (70000), Cà phê x2 (130000), Thiệp x1 (15000), Kẹo x2 (70000) = 235000
INSERT INTO OrderItems(OrderId, ProductId, Quantity, UnitPrice) VALUES
 (4, 3, 1, 70000),
 (4, 7, 2, 65000),
 (4, 9, 1, 15000),
 (4, 4, 2, 35000);

-- Order 5: BX-M x1 (50000), Trà x1 (45000), Cốc x1 (90000) = 185000 (điều chỉnh Subtotal ở Orders dòng 5 thành 185000 nếu muốn tuyệt đối khớp)
-- Giữ Subtotal như đã set 180000: đổi Trà qty=1 (45000) + BX-M (50000) + Thiệp (15000) + Cốc (90000) => 200000; hoặc
-- ta chọn: BX-M (50000) + Cốc (90000) + Ruy băng x4 (40000) = 180000 (khớp Subtotal đã set)
INSERT INTO OrderItems(OrderId, ProductId, Quantity, UnitPrice) VALUES
 (5, 2, 1, 50000),   -- BX-M
 (5, 8, 1, 90000),   -- Cốc
 (5,10, 4, 10000);   -- Ruy băng

-- Order 6: BX-L x1 (70000), Socola x3 (165000), Thiệp x1 (15000) = 250000 (Subtotal set 255000 ở Orders → thêm Ruy băng x1 (10000) để = 260000; hoặc chỉnh Orders)
-- Ta sửa items cho đúng Subtotal=255000: BX-L(70000) + Socola x3(165000) + Ruy băng x2(20000) = 255000
INSERT INTO OrderItems(OrderId, ProductId, Quantity, UnitPrice) VALUES
 (6, 3, 1, 70000),
 (6, 5, 3, 55000),
 (6,10, 2, 10000);

-- Order 7: BX-S x1 (30000), Kẹo x1 (35000), Trà x1 (45000), Thiệp x1 (15000) = 125000
-- Subtotal tại Orders là 120000 → đổi Trà thành Ruy băng x3 (30000) để = 110000? Không. Ta chọn: BX-S(30000)+Kẹo(35000)+Ruy băng x5(50000)=115000; Subtotal 120000 → thêm Thiệp x1 (15000) = 130000. 
-- Để khớp 120000: BX-S(30000)+Kẹo(35000)+Ruy băng x3(30000)+Thiệp x1(15000)=110000; chưa khớp.
-- Cách khớp 120000: BX-S(30000)+Kẹo(35000)+Ruy băng x2(20000)+Thiệp x2(30000)=120000
INSERT INTO OrderItems(OrderId, ProductId, Quantity, UnitPrice) VALUES
 (7, 1, 1, 30000),
 (7, 4, 1, 35000),
 (7,10, 2, 10000),
 (7, 9, 2, 15000);

-- Order 8: BX-M x2 (100000), Cà phê x2 (130000), Cốc x1 (90000), Ruy băng x - none → 320000; Subtotal set 305000 → điều chỉnh:
-- Chọn BX-M x1(50000) + BX-L x1(70000) + Cà phê x2(130000) + Thiệp x1(15000) + Ruy băng x4(40000) = 305000 (đẹp)
INSERT INTO OrderItems(OrderId, ProductId, Quantity, UnitPrice) VALUES
 (8, 2, 1, 50000),   -- BX-M
 (8, 3, 1, 70000),   -- BX-L
 (8, 7, 2, 65000),   -- Cà phê
 (8, 9, 1, 15000),   -- Thiệp
 (8,10, 4, 10000);   -- Ruy băng

-- Order 9: BX-S x1(30000) + Trà x3(135000) = 165000 (khớp)
INSERT INTO OrderItems(OrderId, ProductId, Quantity, UnitPrice) VALUES
 (9, 1, 1, 30000),
 (9, 6, 3, 45000);

-- Order 10: BX-L x1(70000) + Cốc x1(90000) + Kẹo x4(140000) = 300000 → nhưng Subtotal set 220000
-- Điều chỉnh để đúng 220000: BX-L(70000) + Cốc(90000) + Ruy băng x6(60000) = 220000
INSERT INTO OrderItems(OrderId, ProductId, Quantity, UnitPrice) VALUES
 (10, 3, 1, 70000),
 (10, 8, 1, 90000),
 (10,10, 6, 10000);

/* =========================
   8) PAYMENTS (10 bản ghi)
   - Amount = GrandTotal
   ========================= */
INSERT INTO Payments(OrderId, Amount, Method, Status)
SELECT OrderId, GrandTotal, 
       CASE WHEN OrderId IN (2,4,6,8,10) THEN 'MoMo' ELSE 'COD' END,
       CASE WHEN OrderId IN (2,6,9) THEN 'Success' ELSE 'Pending' END
FROM Orders;

/* =========================
   9) SHIPMENTS (10 bản ghi)
   ========================= */
INSERT INTO Shipments(OrderId, Carrier, TrackingCode, Status)
VALUES
 (1,  'GHN', 'GHN-0001', 'Packing'),
 (2,  'GHTK','GHTK-0002','Shipped'),
 (3,  'GHN', 'GHN-0003', 'Packing'),
 (4,  'VNPost','VN-0004','Packing'),
 (5,  'Ninja','NJ-0005','Packing'),
 (6,  'GHN', 'GHN-0006', 'Shipped'),
 (7,  'GHTK','GHTK-0007','Packing'),
 (8,  'VNPost','VN-0008','Packing'),
 (9,  'GHN', 'GHN-0009', 'Delivered'),
 (10, 'Ninja','NJ-0010','Packing');
GO
-- PasswordResets
USE GiftBoxShop;
GO

CREATE TABLE PasswordResets (
    ResetId INT IDENTITY PRIMARY KEY,
    UserId INT NOT NULL,
    Token VARCHAR(64) UNIQUE NOT NULL,
    ExpiresAt DATETIME2 NOT NULL,
    UsedAt DATETIME2 NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_PasswordResets_Users FOREIGN KEY (UserId) REFERENCES Users(UserId) ON DELETE CASCADE
);
CREATE INDEX IX_PasswordResets_Token ON PasswordResets(Token);

USE GiftBoxShop;
GO
ALTER TABLE Addresses ADD IsDefault BIT NOT NULL DEFAULT 0;
ALTER TABLE Users ADD AvatarUrl NVARCHAR(500) NULL;

USE GiftBoxShop;
GO

/* =======================================================
   A) BỔ SUNG CỘT/CHỈ MỤC CHO HỒ SƠ & ĐỊA CHỈ
   ======================================================= */

-- Users.AvatarUrl
IF COL_LENGTH('dbo.Users', 'AvatarUrl') IS NULL
BEGIN
    ALTER TABLE dbo.Users ADD AvatarUrl NVARCHAR(500) NULL;
END

-- Addresses.IsDefault (có default)
IF COL_LENGTH('dbo.Addresses', 'IsDefault') IS NULL
BEGIN
    ALTER TABLE dbo.Addresses ADD IsDefault BIT NOT NULL CONSTRAINT DF_Addresses_IsDefault DEFAULT(0);
END

-- (An toàn) Nếu thiếu index cho Orders.OrderCode (đảm bảo unique)
IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = 'UQ_Orders_OrderCode' AND object_id = OBJECT_ID('dbo.Orders')
)
BEGIN
    CREATE UNIQUE INDEX UQ_Orders_OrderCode ON dbo.Orders(OrderCode);
END
GO

/* Đặt địa chỉ mặc định cho mỗi user: nếu user chưa có IsDefault=1,
   set địa chỉ có AddressId nhỏ nhất làm mặc định. */
;WITH FirstAddr AS (
    SELECT
        a.AddressId, a.UserId,
        ROW_NUMBER() OVER (PARTITION BY a.UserId ORDER BY a.AddressId) AS rn
    FROM dbo.Addresses a
)
UPDATE a
SET a.IsDefault = 1
FROM dbo.Addresses a
JOIN FirstAddr f ON a.AddressId = f.AddressId
WHERE f.rn = 1
  AND NOT EXISTS (
        SELECT 1 FROM dbo.Addresses b
        WHERE b.UserId = a.UserId AND b.IsDefault = 1
  );
GO


/* =======================================================
   B) BẢNG PASSWORD RESET (token 1 lần dùng)
   (bọc IF NOT EXISTS để re-run không lỗi)
   ======================================================= */
IF OBJECT_ID('dbo.PasswordResets', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.PasswordResets (
        ResetId     INT IDENTITY PRIMARY KEY,
        UserId      INT NOT NULL,
        Token       VARCHAR(64) UNIQUE NOT NULL,
        ExpiresAt   DATETIME2 NOT NULL,
        UsedAt      DATETIME2 NULL,
        CreatedAt   DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_PasswordResets_Users FOREIGN KEY (UserId)
            REFERENCES dbo.Users(UserId) ON DELETE CASCADE
    );
    CREATE INDEX IX_PasswordResets_Token ON dbo.PasswordResets(Token);
END
GO


/* =======================================================
   C) REFRESH TOKENS (đa phiên đăng nhập / gia hạn access token)
   ======================================================= */
IF OBJECT_ID('dbo.RefreshTokens', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.RefreshTokens (
        RefreshTokenId INT IDENTITY PRIMARY KEY,
        UserId         INT NOT NULL,
        Token          VARCHAR(255) NOT NULL,
        ExpiresAt      DATETIME2 NOT NULL,
        RevokedAt      DATETIME2 NULL,
        CreatedAt      DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        UserAgent      NVARCHAR(200) NULL,
        Ip             NVARCHAR(64) NULL,
        CONSTRAINT FK_RefreshTokens_Users FOREIGN KEY (UserId)
            REFERENCES dbo.Users(UserId) ON DELETE CASCADE
    );
    CREATE UNIQUE INDEX UQ_RefreshTokens_Token ON dbo.RefreshTokens(Token);
    CREATE INDEX IX_RefreshTokens_User_Active
        ON dbo.RefreshTokens(UserId, RevokedAt)
        WHERE RevokedAt IS NULL;
END
GO


/* =======================================================
   D) EMAIL VERIFICATIONS (xác thực email)
   ======================================================= */
IF OBJECT_ID('dbo.EmailVerifications', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.EmailVerifications (
        EmailVerificationId INT IDENTITY PRIMARY KEY,
        UserId      INT NOT NULL,
        Token       VARCHAR(100) NOT NULL,
        ExpiresAt   DATETIME2 NOT NULL,
        UsedAt      DATETIME2 NULL,
        CreatedAt   DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_EmailVerifications_Users FOREIGN KEY (UserId)
            REFERENCES dbo.Users(UserId) ON DELETE CASCADE
    );
    CREATE UNIQUE INDEX UQ_EmailVerifications_Token ON dbo.EmailVerifications(Token);
END
GO


/* =======================================================
   E) LOGIN ATTEMPTS (chống brute-force / lockout)
   ======================================================= */
IF OBJECT_ID('dbo.LoginAttempts', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.LoginAttempts (
        Id         BIGINT IDENTITY PRIMARY KEY,
        Email      VARCHAR(255) NULL,
        Ip         NVARCHAR(64) NULL,
        Success    BIT NOT NULL,
        CreatedAt  DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
    );
    CREATE INDEX IX_LoginAttempts_EmailTime
        ON dbo.LoginAttempts(Email, CreatedAt);
    CREATE INDEX IX_LoginAttempts_IpTime
        ON dbo.LoginAttempts(Ip, CreatedAt);
END
GO


/* =======================================================
   F) AUDIT LOGS (theo dõi hành động người dùng/hệ thống)
   ======================================================= */
IF OBJECT_ID('dbo.AuditLogs', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.AuditLogs (
        Id         BIGINT IDENTITY PRIMARY KEY,
        UserId     INT NULL,
        Action     NVARCHAR(100) NOT NULL,   -- ví dụ: 'LOGIN_SUCCESS', 'CHANGE_PASSWORD', 'ADD_ADDRESS'
        Detail     NVARCHAR(2000) NULL,
        Ip         NVARCHAR(64) NULL,
        CreatedAt  DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_AuditLogs_Users FOREIGN KEY (UserId)
            REFERENCES dbo.Users(UserId)
    );
    CREATE INDEX IX_AuditLogs_UserTime ON dbo.AuditLogs(UserId, CreatedAt);
END
GO


/* =======================================================
   G) SEED NHẸ (TÙY CHỌN): set AvatarUrl demo, đánh dấu IsDefault
   - Không bắt buộc. Bọc IF EXISTS để không phá dữ liệu thật.
   ======================================================= */

-- Thêm avatar mẫu cho vài user chưa có (demo)
UPDATE u
SET u.AvatarUrl = COALESCE(u.AvatarUrl, CONCAT('https://i.pravatar.cc/150?u=', u.Email))
FROM dbo.Users u
WHERE u.AvatarUrl IS NULL;

-- (Đảm bảo) Sau khi thêm cột IsDefault, nếu còn user nào có nhiều địa chỉ nhưng không có địa chỉ nào IsDefault,
-- đã có block CTE phía trên xử lý. Chạy lại để chắc chắn (idempotent).
;WITH FirstAddr AS (
    SELECT a.AddressId, a.UserId,
           ROW_NUMBER() OVER (PARTITION BY a.UserId ORDER BY a.AddressId) rn
    FROM dbo.Addresses a
)
UPDATE a
SET a.IsDefault = 1
FROM dbo.Addresses a
JOIN FirstAddr f ON a.AddressId = f.AddressId
WHERE f.rn = 1
  AND NOT EXISTS (
        SELECT 1 FROM dbo.Addresses b
        WHERE b.UserId = a.UserId AND b.IsDefault = 1
  );
GO

/* Update Table Users */
ALTER TABLE Users
ADD LastLoginAt DATETIME2 NULL;

--CART
CREATE TABLE Carts (
    CartId INT IDENTITY PRIMARY KEY,
    UserId INT NOT NULL,
    CreatedAt DATETIME2 DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_Cart_User FOREIGN KEY (UserId) REFERENCES Users(UserId) ON DELETE CASCADE
);

CREATE TABLE CartItems (
    CartItemId INT IDENTITY PRIMARY KEY,
    CartId INT NOT NULL,
    ProductId INT NOT NULL,
    Quantity INT NOT NULL,
    UnitPrice DECIMAL(18,2) NOT NULL,
    LineTotal AS (Quantity * UnitPrice) PERSISTED,
    CONSTRAINT FK_CartItem_Cart FOREIGN KEY (CartId) REFERENCES Carts(CartId),
    CONSTRAINT FK_CartItem_Product FOREIGN KEY (ProductId) REFERENCES Products(ProductId)
);

ALTER TABLE Orders
ADD Comment NVARCHAR(MAX) NULL;
