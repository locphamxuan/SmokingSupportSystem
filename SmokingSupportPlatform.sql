create database SmokingSupportPlatform


-- Tạo bảng Users với các trường cần thiết
CREATE TABLE Users (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Username NVARCHAR(50) NOT NULL,
    Password NVARCHAR(255) NOT NULL,
    Email NVARCHAR(100) NOT NULL UNIQUE,
    IsPremium BIT DEFAULT 0, -- 0: User, 1: Premium User
    IsAdmin BIT DEFAULT 0,   -- 0: User, 1: Admin
    phoneNumber NVARCHAR(20),
    address NVARCHAR(255),
    cigarettesPerDay INT,
    costPerPack INT,
    smokingFrequency NVARCHAR(50),
    healthStatus NVARCHAR(255),
    QuitReason NVARCHAR(255),
    CreatedAt DATETIME DEFAULT GETDATE()
);

-- Các bảng khác giữ nguyên như cũ
CREATE TABLE Blogs (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    UserId INT NOT NULL,
    Title NVARCHAR(255) NOT NULL,
    Content NVARCHAR(MAX) NOT NULL,
    CreatedAt DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (UserId) REFERENCES Users(Id)
);

CREATE TABLE Comments (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    BlogId INT NOT NULL,
    UserId INT NOT NULL,
    Content NVARCHAR(500) NOT NULL,
    CreatedAt DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (BlogId) REFERENCES Blogs(Id),
    FOREIGN KEY (UserId) REFERENCES Users(Id)
);

CREATE TABLE Badges (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Name NVARCHAR(100) NOT NULL,
    Description NVARCHAR(255)
);

CREATE TABLE UserBadges (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    UserId INT NOT NULL,
    BadgeId INT NOT NULL,
    AwardedAt DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (UserId) REFERENCES Users(Id),
    FOREIGN KEY (BadgeId) REFERENCES Badges(Id)
);

CREATE TABLE Feedbacks (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    UserId INT NOT NULL,
    Content NVARCHAR(1000) NOT NULL,
    CreatedAt DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (UserId) REFERENCES Users(Id)
);

CREATE TABLE Plans (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    UserId INT NOT NULL,
    PlanType NVARCHAR(50), -- Gợi ý hoặc tùy chỉnh
    PlanDetail NVARCHAR(MAX),
    CreatedAt DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (UserId) REFERENCES Users(Id)
);

CREATE TABLE Progress (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    UserId INT NOT NULL,
    Date DATE NOT NULL,
    Cigarettes INT DEFAULT 0,
    MoneySpent DECIMAL(18,2) DEFAULT 0,
    Note NVARCHAR(255),
    FOREIGN KEY (UserId) REFERENCES Users(Id)
);

CREATE TABLE Notifications (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    UserId INT NOT NULL,
    Message NVARCHAR(255) NOT NULL,
    CreatedAt DATETIME DEFAULT GETDATE(),
    IsRead BIT DEFAULT 0,
    FOREIGN KEY (UserId) REFERENCES Users(Id)
);

CREATE TABLE Memberships (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Name NVARCHAR(50) NOT NULL,
    Price DECIMAL(18,2) NOT NULL,
    DurationInDays INT NOT NULL
);

CREATE TABLE UserMemberships (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    UserId INT NOT NULL,
    MembershipId INT NOT NULL,
    StartDate DATETIME DEFAULT GETDATE(),
    EndDate DATETIME,
    FOREIGN KEY (UserId) REFERENCES Users(Id),
    FOREIGN KEY (MembershipId) REFERENCES Memberships(Id)
);

CREATE TABLE CommunityPosts (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    UserId INT NOT NULL,
    Content NVARCHAR(MAX) NOT NULL,
    CreatedAt DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (UserId) REFERENCES Users(Id)
);

-- Dữ liệu mẫu cho Users (KHÔNG còn FullName)
-- Admin
INSERT INTO Users (Username, Password, Email, IsPremium, IsAdmin, healthStatus, QuitReason, phoneNumber, address, cigarettesPerDay, costPerPack, smokingFrequency)
VALUES (N'admin', N'$2a$10$Xx28FVlGvXddurGYFNCkAe.f27khOHkrais.rgjZe4xR6s716joyC', N'admin@smoking.com', 0, 1, N'Khỏe mạnh', N'Quản trị hệ thống', NULL, NULL, NULL, NULL, NULL);

-- User thường
INSERT INTO Users (Username, Password, Email, IsPremium, IsAdmin, healthStatus, QuitReason, phoneNumber, address, cigarettesPerDay, costPerPack, smokingFrequency)
VALUES (N'user1', N'user123', N'user1@gmail.com', 0, 0, N'Bình thường', N'Vì sức khỏe', NULL, NULL, NULL, NULL, NULL);

-- User Premium
INSERT INTO Users (Username, Password, Email, IsPremium, IsAdmin, healthStatus, QuitReason, phoneNumber, address, cigarettesPerDay, costPerPack, smokingFrequency)
VALUES (N'premium1', N'premium123', N'premium1@gmail.com', 1, 0, N'Bình thường', N'Vì gia đình', NULL, NULL, NULL, NULL, NULL);

-- User có đủ thông tin
INSERT INTO Users (Username, Password, Email, IsPremium, IsAdmin, healthStatus, QuitReason, phoneNumber, address, cigarettesPerDay, costPerPack, smokingFrequency)
VALUES (N'hai', N'$2a$10$ZqsyatP.mzwakcWQnbanzuHcMkzdtKNe6vbs5rZ1mLUl...', 0, 0, N'Bình thường', N'Vì sức khỏe', N'0903066233', N'Lo D39 KDC Tan Tien Phuong Tan Thoi Hiep Q12', 10, 25000, N'Ngày 2 lần');

-- Các bảng khác giữ nguyên như cũ, chỉ cần sửa lại các lệnh INSERT cho Users như trên.

-- Các lệnh INSERT mẫu cho các bảng khác (giữ nguyên)
INSERT INTO Memberships (Name, Price, DurationInDays)
VALUES (N'Gói 1 tháng', 99000, 30),
       (N'Gói 3 tháng', 249000, 90);

-- Gán gói premium cho user premium (giả sử Id của premium1 là 3, MembershipId là 1)
INSERT INTO UserMemberships (UserId, MembershipId, StartDate, EndDate)
VALUES (3, 1, GETDATE(), DATEADD(DAY, 30, GETDATE()));

INSERT INTO Badges (Name, Description)
VALUES (N'1 ngày không hút thuốc', N'Chúc mừng bạn đã không hút thuốc 1 ngày!'),
       (N'1 tuần không hút thuốc', N'Bạn đã vượt qua 7 ngày không hút thuốc!');

-- Gán huy hiệu cho user thường
INSERT INTO UserBadges (UserId, BadgeId)
VALUES (2, 1);

INSERT INTO Blogs (UserId, Title, Content)
VALUES (2, N'Kinh nghiệm cai thuốc', N'Mình đã cai thuốc thành công nhờ sự động viên của gia đình!');

INSERT INTO Comments (BlogId, UserId, Content)
VALUES (1, 3, N'Cảm ơn bạn đã chia sẻ, mình sẽ cố gắng!');

INSERT INTO Feedbacks (UserId, Content)
VALUES (2, N'Hệ thống rất hữu ích, cảm ơn admin!');

INSERT INTO Plans (UserId, PlanType, PlanDetail)
VALUES (2, N'Gợi ý', N'Giảm dần số lượng thuốc mỗi ngày trong 2 tuần');

INSERT INTO Progress (UserId, Date, Cigarettes, MoneySpent, Note)
VALUES (2, GETDATE(), 5, 20000, N'Đã giảm số lượng thuốc');

INSERT INTO Notifications (UserId, Message)
VALUES (2, N'Chúc mừng bạn đã không hút thuốc hôm nay!');

INSERT INTO CommunityPosts (UserId, Content)
VALUES (2, N'Mọi người cùng cố gắng nhé!');



-- Xóa cột FullName nếu còn
IF EXISTS (SELECT * FROM sys.columns WHERE Name = N'FullName' AND Object_ID = Object_ID(N'Users'))
    ALTER TABLE Users DROP COLUMN FullName;

-- Thêm các trường mới nếu chưa có
IF NOT EXISTS (SELECT * FROM sys.columns WHERE Name = N'phoneNumber' AND Object_ID = Object_ID(N'Users'))
    ALTER TABLE Users ADD phoneNumber NVARCHAR(20);

IF NOT EXISTS (SELECT * FROM sys.columns WHERE Name = N'address' AND Object_ID = Object_ID(N'Users'))
    ALTER TABLE Users ADD address NVARCHAR(255);

IF NOT EXISTS (SELECT * FROM sys.columns WHERE Name = N'cigarettesPerDay' AND Object_ID = Object_ID(N'Users'))
    ALTER TABLE Users ADD cigarettesPerDay INT;

IF NOT EXISTS (SELECT * FROM sys.columns WHERE Name = N'costPerPack' AND Object_ID = Object_ID(N'Users'))
    ALTER TABLE Users ADD costPerPack INT;

IF NOT EXISTS (SELECT * FROM sys.columns WHERE Name = N'smokingFrequency' AND Object_ID = Object_ID(N'Users'))
    ALTER TABLE Users ADD smokingFrequency NVARCHAR(50);

IF NOT EXISTS (SELECT * FROM sys.columns WHERE Name = N'healthStatus' AND Object_ID = Object_ID(N'Users'))
    ALTER TABLE Users ADD healthStatus NVARCHAR(255);

IF NOT EXISTS (SELECT * FROM sys.columns WHERE Name = N'QuitReason' AND Object_ID = Object_ID(N'Users'))
    ALTER TABLE Users ADD QuitReason NVARCHAR(255);