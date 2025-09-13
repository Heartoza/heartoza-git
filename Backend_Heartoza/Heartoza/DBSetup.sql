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
