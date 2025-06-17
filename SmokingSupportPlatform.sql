CREATE DATABASE SmokingSupportPlatform;
GO

USE SmokingSupportPlatform;
GO

CREATE TABLE Users (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Username NVARCHAR(100) NOT NULL,
    Password NVARCHAR(255) NOT NULL,
    Email NVARCHAR(255) NOT NULL,
    PhoneNumber NVARCHAR(20),
    Address NVARCHAR(255),
    Role NVARCHAR(50) NOT NULL DEFAULT 'user',
    IsMember BIT NOT NULL DEFAULT 0,
    CoachId INT NULL,
    CreatedAt DATETIME NOT NULL DEFAULT GETDATE(),
    FOREIGN KEY (CoachId) REFERENCES Users(Id)
);
GO

CREATE TABLE Badges (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Name NVARCHAR(100) NOT NULL,
    Description NVARCHAR(255),
    BadgeType NVARCHAR(50), -- 'days', 'money'
    Requirement NVARCHAR(255)
);
GO

CREATE TABLE Blogs (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    UserId INT NOT NULL,
    Title NVARCHAR(255) NOT NULL,
    Content NVARCHAR(MAX) NOT NULL,
    CreatedAt DATETIME DEFAULT GETDATE(),
    Status NVARCHAR(20) DEFAULT 'published', -- 'draft', 'published', 'archived'
    FOREIGN KEY (UserId) REFERENCES Users(Id)
);
GO

CREATE TABLE QuitPlans (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    UserId INT NOT NULL,
    CoachId INT,
    PlanType NVARCHAR(50), -- 'suggested' hoặc 'custom'
    StartDate DATE NOT NULL,
    TargetDate DATE,
    PlanDetail NVARCHAR(MAX),
    Status NVARCHAR(20) DEFAULT 'active', -- 'active', 'completed', 'cancelled'
    CreatedAt DATETIME DEFAULT GETDATE(),
    CurrentProgress INT DEFAULT 0,
    Milestones NVARCHAR(MAX) NULL,
    InitialCigarettes INT NULL,
    DailyReduction INT NULL,
    FOREIGN KEY (UserId) REFERENCES Users(Id),
    FOREIGN KEY (CoachId) REFERENCES Users(Id)
);

CREATE TABLE SmokingProfiles (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    UserId INT NOT NULL,
    cigarettesPerDay INT,
    costPerPack INT,
    smokingFrequency NVARCHAR(50),
    healthStatus NVARCHAR(255),
    QuitReason NVARCHAR(255),
    FOREIGN KEY (UserId) REFERENCES Users(Id)
);
GO

CREATE TABLE UserBadges (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    UserId INT NOT NULL,
    BadgeId INT NOT NULL,
    AwardedAt DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (UserId) REFERENCES Users(Id),
    FOREIGN KEY (BadgeId) REFERENCES Badges(Id)
);
GO

CREATE TABLE Comments (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    BlogId INT NOT NULL,
    UserId INT NOT NULL,
    Content NVARCHAR(500) NOT NULL,
    CreatedAt DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (BlogId) REFERENCES Blogs(Id),
    FOREIGN KEY (UserId) REFERENCES Users(Id)
);
GO

CREATE TABLE Progress (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    UserId INT NOT NULL,
    PlanId INT NOT NULL,
    Date DATE NOT NULL,
    Cigarettes INT DEFAULT 0,
    MoneySpent DECIMAL(18,2) DEFAULT 0,
    Note NVARCHAR(255),
    FOREIGN KEY (UserId) REFERENCES Users(Id),
    FOREIGN KEY (PlanId) REFERENCES QuitPlans(Id)
);
GO

CREATE TABLE UserStatistics (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    UserId INT NOT NULL,
    TotalDaysWithoutSmoking INT DEFAULT 0,
    TotalMoneySaved DECIMAL(18,2) DEFAULT 0,
    HealthImprovements NVARCHAR(MAX),
    LastUpdated DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (UserId) REFERENCES Users(Id)
);
GO

CREATE TABLE Notifications (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    UserId INT NOT NULL,
    Message NVARCHAR(255) NOT NULL,
    Type NVARCHAR(50), -- 'milestone', 'badge', 'reminder', 'system'
    CreatedAt DATETIME DEFAULT GETDATE(),
    IsRead BIT DEFAULT 0,
    FOREIGN KEY (UserId) REFERENCES Users(Id)
);
GO

CREATE TABLE Reports (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    UserId INT NOT NULL,
    Content NVARCHAR(1000) NOT NULL,
    Rating INT, -- 1-5 sao
    CreatedAt DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (UserId) REFERENCES Users(Id)
);
GO

CREATE TABLE Rankings (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    UserId INT NOT NULL,
    TotalDaysWithoutSmoking INT DEFAULT 0,
    TotalMoneySaved DECIMAL(18,2) DEFAULT 0,
    LastUpdated DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (UserId) REFERENCES Users(Id)
);
GO

CREATE TABLE SmokingDailyLog (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    UserId INT,
    ProgressId INT,
    LogDate DATE DEFAULT GETDATE(),
    Cigarettes INT DEFAULT 0,
    Feeling NVARCHAR(255) DEFAULT '',
    FOREIGN KEY (UserId) REFERENCES Users(Id),
    FOREIGN KEY (ProgressId) REFERENCES Progress(Id)
);
GO

CREATE TABLE Booking (
    Id INT PRIMARY KEY IDENTITY(1,1),
    MemberId INT NOT NULL,
    CoachId INT NULL,
    ScheduledTime DATETIME NOT NULL,
    Status NVARCHAR(50) DEFAULT N'đang chờ xác nhận', -- 'đang chờ xác nhận', 'đã xác nhận', 'đã hủy'
    Note NVARCHAR(MAX) NULL,
    CreatedAt DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (MemberId) REFERENCES Users(Id),
    FOREIGN KEY (CoachId) REFERENCES Users(Id)
);
GO

CREATE TABLE Messages (
    Id INT PRIMARY KEY IDENTITY(1,1),
    SenderId INT NOT NULL,
    ReceiverId INT NOT NULL,
    ProgressId INT,
    Content NVARCHAR(MAX) NOT NULL,
    SentAt DATETIME DEFAULT GETDATE(),
    IsRead BIT DEFAULT 0,
    FOREIGN KEY (SenderId) REFERENCES Users(Id),
    FOREIGN KEY (ReceiverId) REFERENCES Users(Id),
    FOREIGN KEY (ProgressId) REFERENCES Progress(Id)
);
GO

-- Dữ liệu mẫu cho Users
INSERT INTO Users (Username, Password, Email, Role)
VALUES (N'admin', N'admin123', N'admin@smoking.com', 'admin');
GO

INSERT INTO Users (Username, Password, Email, Role)
VALUES (N'member1', N'member123', N'member1@gmail.com', 'member');
GO

INSERT INTO Users (Username, Password, Email, Role)
VALUES (N'coach1', N'coach123', N'coach1@gmail.com', 'coach');
VALUES (N'coach2', N'coach123', N'coach2@gmail.com', 'coach');

GO


-- Dữ liệu mẫu cho SmokingProfiles
INSERT INTO SmokingProfiles (UserId, cigarettesPerDay, costPerPack, smokingFrequency, healthStatus, QuitReason)
VALUES (2, 10, 25000, N'Ngày 2 lần', N'Bình thường', N'Vì sức khỏe');
GO

-- Dữ liệu mẫu cho Badges
INSERT INTO Badges (Name, Description, BadgeType, Requirement)
VALUES 
(N'1 ngày không hút thuốc', N'Chúc mừng bạn đã không hút thuốc 1 ngày!', 'days', '1'),
(N'3 ngày không hút thuốc', N'Bạn đã vượt qua 3 ngày không hút thuốc!', 'days', '3'),
(N'7 ngày không hút thuốc', N'Bạn đã vượt qua 7 ngày không hút thuốc!', 'days', '7'),
(N'14 ngày không hút thuốc', N'Bạn đã vượt qua 14 ngày không hút thuốc!', 'days', '14'),
(N'30 ngày không hút thuốc', N'Bạn đã vượt qua 30 ngày không hút thuốc!', 'days', '30'),
(N'Tiết kiệm 100k', N'Bạn đã tiết kiệm được 100,000đ!', 'money', '100000'),
(N'Tiết kiệm 200k', N'Bạn đã tiết kiệm được 200,000đ!', 'money', '200000'),
(N'Tiết kiệm 500k', N'Bạn đã tiết kiệm được 500,000đ!', 'money', '500000'),
(N'Tiết kiệm 1 triệu', N'Bạn đã tiết kiệm được 1,000,000đ!', 'money', '1000000');
GO

-- Dữ liệu mẫu cho Blogs
INSERT INTO Blogs (UserId, Title, Content)
VALUES (2, N'Kinh nghiệm cai thuốc', N'Mình đã cai thuốc thành công nhờ sự động viên của gia đình!');
GO

-- Dữ liệu mẫu cho Comments
INSERT INTO Comments (BlogId, UserId, Content)
VALUES (1, 2, N'Cảm ơn bạn đã chia sẻ, mình sẽ cố gắng!');
GO

-- Dữ liệu mẫu cho Notifications
INSERT INTO Notifications (UserId, Message, Type)
VALUES (2, N'Chúc mừng bạn đã không hút thuốc hôm nay!', 'milestone');
GO

-- Dữ liệu mẫu cho Reports (formerly Feedbacks)
INSERT INTO Reports (UserId, Content, Rating)
VALUES (2, N'Hệ thống rất hữu ích, cảm ơn admin!', 5);
GO

-- Dữ liệu mẫu cho Rankings
INSERT INTO Rankings (UserId, TotalDaysWithoutSmoking, TotalMoneySaved)
VALUES (2, 5, 125000);
GO
INSERT INTO QuitPlans (UserId, PlanType, StartDate, TargetDate, PlanDetail)
VALUES (2, N'suggested', '2024-06-01', '2024-07-01', N'Kế hoạch mặc định do hệ thống gợi ý');
GO

INSERT INTO Progress (UserId, PlanId, Date, Cigarettes, MoneySpent, Note)
VALUES (2, 1, '2024-06-04', 5, 20000, N'Cảm nhận hôm nay');
GO

ALTER TABLE SmokingProfiles
ADD cigaretteType NVARCHAR(100) NULL;
GO






ALTER TABLE Users
ADD CoachId INT NULL;

-- Thêm lịch hẹn cho Quynh (MemberId = 2, CoachId = 3)
INSERT INTO Booking (MemberId, CoachId, ScheduledTime, Status, Note, CreatedAt)
VALUES (2, 3, '2025-07-10 10:00:00', N'đang chờ xác nhận', N'Lịch hẹn đầu tiên với Quynh', GETDATE());

-- Thêm lịch hẹn cho Xung (MemberId = 2, CoachId = 3)
INSERT INTO Booking (MemberId, CoachId, ScheduledTime, Status, Note, CreatedAt)
VALUES (2, 3, '2025-07-12 14:30:00', N'đang chờ xác nhận', N'Lịch hẹn tư vấn với Xung', GETDATE());


ALTER TABLE Progress DROP COLUMN MoneySpent;
    ALTER TABLE Progress DROP CONSTRAINT DF__Progress__MoneyS__440B1D61;
	        SELECT Id, Username, CoachId FROM Users WHERE Username = 'loccc';