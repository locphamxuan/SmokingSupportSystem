CREATE DATABASE SmokingSupportPlatform;
GO

USE SmokingSupportPlatform;
GO


-- Tìm constraint
  --SELECT OBJECT_NAME(object_id) AS ConstraintName, name AS ColumnName
  --FROM sys.default_constraints
  --WHERE parent_object_id = OBJECT_ID('Users');
  -- Xóa constraint
  --ALTER TABLE Users DROP CONSTRAINT DF__Users__costPerPa__29572725;

--WHERE parent_object_id = OBJECT_ID('Users');

CREATE TABLE Users (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Username NVARCHAR(100) NOT NULL,
    Password NVARCHAR(255) NOT NULL,
    Email NVARCHAR(255) NOT NULL,
    PhoneNumber NVARCHAR(20),
    Address NVARCHAR(255),
    Role NVARCHAR(50) NOT NULL DEFAULT 'guest',
    IsMember BIT NOT NULL DEFAULT 0,
    CreatedAt DATETIME NOT NULL DEFAULT GETDATE()
   
);

GO

CREATE TABLE Badges (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Name NVARCHAR(100) NOT NULL,
    Description NVARCHAR(255),
    Type NVARCHAR(50), -- 'days', 'money', 'health'
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
    PlanType NVARCHAR(50), -- 'suggested' hoặc 'custom'
    StartDate DATE NOT NULL,
    TargetDate DATE,
    PlanDetail NVARCHAR(MAX),
    Status NVARCHAR(20) DEFAULT 'active', -- 'active', 'completed', 'cancelled'
    CreatedAt DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (UserId) REFERENCES Users(Id)
);
GO

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

CREATE TABLE Feedbacks (
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

--lưu nhật ký nhiều ngày
CREATE TABLE SmokingDailyLog (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    UserId INT,
    LogDate DATE DEFAULT GETDATE(),
    Cigarettes INT DEFAULT 0,
    Feeling NVARCHAR(255) DEFAULT '',
    FOREIGN KEY (UserId) REFERENCES Users(Id)
);
GO

    CREATE TABLE ConsultationSchedules (
      Id INT PRIMARY KEY IDENTITY(1,1),
      MemberId INT NOT NULL,
      CoachId INT NULL,
      ScheduledTime DATETIME NOT NULL,
      Status NVARCHAR(50) DEFAULT 'chua tu van', -- 'chua tu van', 'da tu van', 'can theo doi'
      Note NVARCHAR(MAX) NULL,
      CreatedAt DATETIME DEFAULT GETDATE(),
      FOREIGN KEY (MemberId) REFERENCES Users(Id),
      FOREIGN KEY (CoachId) REFERENCES Users(Id)
    );

	    CREATE TABLE Messages (
      Id INT PRIMARY KEY IDENTITY(1,1),
      SenderId INT NOT NULL,
      ReceiverId INT NOT NULL,
      Content NVARCHAR(MAX) NOT NULL,
      SentAt DATETIME DEFAULT GETDATE(),
      IsRead BIT DEFAULT 0,
      FOREIGN KEY (SenderId) REFERENCES Users(Id),
      FOREIGN KEY (ReceiverId) REFERENCES Users(Id)
    );

-- Dữ liệu mẫu cho Users
INSERT INTO Users (Username, Password, Email, Role)
VALUES (N'admin', N'admin123', N'admin@smoking.com', 'admin');
GO

INSERT INTO Users (Username, Password, Email, Role)
VALUES (N'member1', N'member123', N'member1@gmail.com', 'member');
GO

INSERT INTO Users (Username, Password, Email, Role)
VALUES (N'coach1', N'coach123', N'coach1@gmail.com', 'coach');
GO

-- Dữ liệu mẫu cho SmokingProfiles
INSERT INTO SmokingProfiles (UserId, cigarettesPerDay, costPerPack, smokingFrequency, healthStatus, QuitReason)
VALUES (2, 10, 25000, N'Ngày 2 lần', N'Bình thường', N'Vì sức khỏe');
GO

-- Dữ liệu mẫu cho Badges
INSERT INTO Badges (Name, Description, Type, Requirement)
VALUES 
(N'1 ngày không hút thuốc', N'Chúc mừng bạn đã không hút thuốc 1 ngày!', 'days', '1'),
(N'1 tuần không hút thuốc', N'Bạn đã vượt qua 7 ngày không hút thuốc!', 'days', '7'),
(N'Tiết kiệm 100k', N'Bạn đã tiết kiệm được 100,000đ!', 'money', '100000');
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

-- Dữ liệu mẫu cho Feedbacks
INSERT INTO Feedbacks (UserId, Content, Rating)
VALUES (2, N'Hệ thống rất hữu ích, cảm ơn admin!', 5);
GO

-- Dữ liệu mẫu cho Rankings
INSERT INTO Rankings (UserId, TotalDaysWithoutSmoking, TotalMoneySaved)
VALUES (2, 5, 125000);
GO


-- Cập nhật role coach cho user bất kỳ (ví dụ user có Id = 3)
UPDATE Users
SET Role = 'coach'
WHERE Id = 3;
GO

-- Kiểm tra các user có role coach
SELECT Id, Username, Role FROM Users WHERE Role = 'coach';
GO

