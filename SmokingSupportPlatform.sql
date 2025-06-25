CREATE DATABASE SmokingSupportPlatform;
GO

USE SmokingSupportPlatform;
GO

-- USERS
CREATE TABLE Users (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Username NVARCHAR(100) NOT NULL,
    Password NVARCHAR(255) NOT NULL,
    Email NVARCHAR(255) NOT NULL,
    PhoneNumber NVARCHAR(20),
    Address NVARCHAR(255),
    Role NVARCHAR(50) NOT NULL CHECK (Role IN ('member', 'memberVip', 'coach', 'admin')),
    IsMemberVip BIT NOT NULL DEFAULT 0,
    CoachId INT NULL,
    CreatedAt DATETIME NOT NULL DEFAULT GETDATE(),
    FOREIGN KEY (CoachId) REFERENCES Users(Id)
);
GO

drop table UserStatistics

-- SMOKING PROFILES
CREATE TABLE SmokingProfiles (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    UserId INT NOT NULL,
    CigarettesPerDay INT,
    CostPerPack INT,
    SmokingFrequency NVARCHAR(50),
    HealthStatus NVARCHAR(255),
    QuitReason NVARCHAR(255),
    CigaretteType NVARCHAR(100),
    FOREIGN KEY (UserId) REFERENCES Users(Id)
);
GO

-- BADGES
CREATE TABLE Badges (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Name NVARCHAR(100) NOT NULL,
    Description NVARCHAR(255),
    BadgeType NVARCHAR(50) NOT NULL CHECK (BadgeType IN ('loai1', 'loai2', 'loai3', 'loai4', 'loai5', 'loai6', 'loai7')),
    Requirement NVARCHAR(255)
);
GO

-- USER BADGES
CREATE TABLE UserBadges (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    UserId INT NOT NULL,
    BadgeId INT NOT NULL,
    AwardedAt DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (UserId) REFERENCES Users(Id),
    FOREIGN KEY (BadgeId) REFERENCES Badges(Id)
);
GO

CREATE TABLE MembershipPackages (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Name NVARCHAR(100) NOT NULL,
    Description NVARCHAR(255),
    Price INT NOT NULL,
    DurationInDays INT NOT NULL,
    Features NVARCHAR(MAX)
);
GO

-- QUIT PLANS
CREATE TABLE QuitPlans (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    UserId INT NOT NULL,
    CoachId INT,
    PlanType NVARCHAR(50) CHECK (PlanType IN ('suggested', 'custom')),
    StartDate DATE NOT NULL,
    TargetDate DATE,
    PlanDetail NVARCHAR(MAX),
    Status NVARCHAR(20) DEFAULT 'active',
    CreatedAt DATETIME DEFAULT GETDATE(),
    Milestones NVARCHAR(MAX),
    InitialCigarettes INT,
    DailyReduction INT,
    FOREIGN KEY (UserId) REFERENCES Users(Id),
    FOREIGN KEY (CoachId) REFERENCES Users(Id)
);

CREATE TABLE SuggestedQuitPlans (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Title NVARCHAR(255) NOT NULL,
    Description NVARCHAR(MAX),
    PlanDetail NVARCHAR(MAX),
    CreatedAt DATETIME DEFAULT GETDATE()
);

-- STATISTICS
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

-- NOTIFICATIONS
CREATE TABLE Notifications (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    UserId INT NOT NULL,
    Message NVARCHAR(255) NOT NULL,
    Type NVARCHAR(50),
    CreatedAt DATETIME DEFAULT GETDATE(),
    IsRead BIT DEFAULT 0,
    FOREIGN KEY (UserId) REFERENCES Users(Id)
);
GO

-- SMOKING DAILY LOG (Created before ALTER commands)
CREATE TABLE SmokingDailyLog (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    UserId INT,
    LogDate DATE DEFAULT GETDATE(),
    Cigarettes INT DEFAULT 0,
    Feeling NVARCHAR(255) DEFAULT '',
    PlanId INT NULL, -- Nếu muốn gắn với kế hoạch
    FOREIGN KEY (UserId) REFERENCES Users(Id),
    FOREIGN KEY (PlanId) REFERENCES QuitPlans(Id)
);

-- Now we can safely ALTER the table
ALTER TABLE SmokingDailyLog
ADD SuggestedPlanId INT NULL;

ALTER TABLE SmokingDailyLog
ADD CONSTRAINT FK_SmokingDailyLog_SuggestedPlanId
FOREIGN KEY (SuggestedPlanId) REFERENCES SuggestedQuitPlans(Id);

-- POSTS
CREATE TABLE Posts (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    UserId INT NOT NULL,
    Title NVARCHAR(255) NOT NULL,
    Content NVARCHAR(MAX) NOT NULL,
    CreatedAt DATETIME DEFAULT GETDATE(),
    Status NVARCHAR(20) DEFAULT 'chờ duyệt',
    FOREIGN KEY (UserId) REFERENCES Users(Id)
);
GO

-- COMMENTS
CREATE TABLE Comments (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    PostId INT NOT NULL,
    UserId INT NOT NULL,
    Content NVARCHAR(500) NOT NULL,
    CreatedAt DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (PostId) REFERENCES Posts(Id),
    FOREIGN KEY (UserId) REFERENCES Users(Id)
);
GO

-- BOOKING
CREATE TABLE Booking (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    MemberId INT NOT NULL,
    CoachId INT,
    Slot NVARCHAR(20) NOT NULL CHECK (Slot IN ('7h-9h', '10h-12h', '13h-15h', '16h-18h')),
    SlotDate DATE NOT NULL,
    Status NVARCHAR(50) DEFAULT N'đang chờ xác nhận' CHECK (Status IN (N'đang chờ xác nhận', N'khách hàng đã hủy', N'coach đã hủy', N'đã xác nhận')),
    Note NVARCHAR(MAX),
    CreatedAt DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (MemberId) REFERENCES Users(Id),
    FOREIGN KEY (CoachId) REFERENCES Users(Id)
);
GO

-- MESSAGES (Keeping the table, not dropping it)
CREATE TABLE Messages (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    SenderId INT NOT NULL,
    ReceiverId INT NOT NULL,
    Content NVARCHAR(MAX) NOT NULL,
    SentAt DATETIME DEFAULT GETDATE(),
    IsRead BIT DEFAULT 0,
    FOREIGN KEY (SenderId) REFERENCES Users(Id),
    FOREIGN KEY (ReceiverId) REFERENCES Users(Id)
);
GO

-- REPORTS (NO RATING)
CREATE TABLE Reports (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    UserId INT NOT NULL,
    Content NVARCHAR(1000) NOT NULL,
    CreatedAt DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (UserId) REFERENCES Users(Id)
);
GO

-- RANKINGS
CREATE TABLE Rankings (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    UserId INT NOT NULL,
    TotalDaysWithoutSmoking INT DEFAULT 0,
    TotalMoneySaved DECIMAL(18,2) DEFAULT 0,
    LastUpdated DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (UserId) REFERENCES Users(Id)
);
GO

CREATE TABLE UserSuggestedQuitPlans (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    UserId INT NOT NULL,
    SuggestedPlanId INT NOT NULL,
    StartDate DATE NOT NULL,
    TargetDate DATE NOT NULL,
    Status NVARCHAR(20) DEFAULT 'active', -- active, completed, canceled, ...
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (UserId) REFERENCES Users(Id),
    FOREIGN KEY (SuggestedPlanId) REFERENCES SuggestedQuitPlans(Id)
);


--- Dữ liệu mẫu cho Users
INSERT INTO Users (Username, Password, Email, Role, IsMemberVip) VALUES
(N'admin', N'admin123', N'admin@smoking.com', 'admin', 0),
(N'coach1', N'coach123', N'coach1@smoking.com', 'coach', 0),
(N'coach2', N'coach123', N'coach2@smoking.com', 'coach', 0),
(N'member1', N'member123', N'member1@gmail.com', 'member', 0),
(N'memberVip1', N'membervip123', N'membervip1@gmail.com', 'memberVip', 1);

--- Dữ liệu mẫu cho MembershipPackages
INSERT INTO MembershipPackages (Name, Description, Price, DurationInDays, Features) VALUES
(N'Gói Thường', N'Gói cơ bản cho phép nhập thông tin hút thuốc và truy cập blog cộng đồng.', 0, 0, N'Nhập thông tin hút thuốc
Truy cập blog chia sẻ kinh nghiệm từ cộng đồng');

INSERT INTO MembershipPackages (Name, Description, Price, DurationInDays, Features) VALUES
(N'Gói VIP', N'Gói cao cấp với đầy đủ tính năng, hỗ trợ huấn luyện viên và thành tích.', 199000, 30, N'Tất cả tính năng của gói Thường
Chat với huấn luyện viên
Đặt lịch hẹn
Được trao thành tích khi đạt mốc');

--- Dữ liệu mẫu cho SmokingProfiles
INSERT INTO SmokingProfiles (UserId, CigarettesPerDay, CostPerPack, SmokingFrequency, HealthStatus, QuitReason) VALUES
(4, 10, 25000, N'2 lần/ngày', N'Khó thở nhẹ', N'Vì con'),
(5, 15, 30000, N'3 lần/ngày', N'Ho kéo dài', N'Cải thiện sức khỏe');

--- Dữ liệu mẫu cho QuitPlans
INSERT INTO QuitPlans (UserId, CoachId, PlanType, StartDate, TargetDate, PlanDetail, Status) VALUES
(4, 2, N'suggested', '2025-06-01', '2025-07-01', N'Kế hoạch mẫu - giảm dần mỗi tuần', 'active'),
(5, 3, N'custom', '2025-06-10', '2025-08-01', N'Tự lên kế hoạch - bỏ hoàn toàn sau 3 tuần', 'active');

--- Dữ liệu mẫu cho Badges
INSERT INTO Badges (Name, Description, BadgeType, Requirement) VALUES
(N'1 ngày không hút thuốc', N'Chúc mừng bạn đã không hút thuốc 1 ngày!', 'loai1', '1'),
(N'3 ngày không hút thuốc', N'Tuyệt vời! Bạn đã giữ vững 3 ngày.', 'loai2', '3'),
(N'5 ngày không hút thuốc', N'Cố gắng tuyệt vời trong 5 ngày!', 'loai3', '5'),
(N'7 ngày không hút thuốc', N'1 tuần trôi qua rồi!', 'loai4', '7'),
(N'14 ngày không hút thuốc', N'2 tuần rồi đó!', 'loai5', '14'),
(N'30 ngày không hút thuốc', N'1 tháng đầy kiên cường!', 'loai6', '30'),
(N'60 ngày không hút thuốc', N'2 tháng chinh phục!', 'loai7', '60');

--- Dữ liệu mẫu cho UserBadges
INSERT INTO UserBadges (UserId, BadgeId, AwardedAt) VALUES
(4, 1, GETDATE()),
(4, 2, GETDATE()),
(5, 1, GETDATE());

--- Dữ liệu mẫu cho Posts
INSERT INTO Posts(UserId, Title, Content) VALUES
(4, N'Trải nghiệm sau 1 tuần bỏ thuốc', N'Tôi thấy nhẹ nhõm và ngủ ngon hơn nhiều!');

--- Dữ liệu mẫu cho Comments
INSERT INTO Comments (PostId, UserId, Content) VALUES
(1, 5, N'Cảm ơn bạn đã chia sẻ, rất truyền cảm hứng!');

--- Dữ liệu mẫu cho Notifications
INSERT INTO Notifications (UserId, Message, Type) VALUES
(4, N'Bạn đã không hút thuốc 3 ngày, hãy tiếp tục nhé!', 'milestone'),
(5, N'Hôm nay bạn không hút thuốc, giỏi lắm!', 'reminder');

--- Dữ liệu mẫu cho Reports
INSERT INTO Reports (UserId, Content) VALUES
(4, N'Hệ thống rất hữu ích, dễ sử dụng.'),
(5, N'Tôi cảm thấy có động lực hơn khi sử dụng app.');

--- Dữ liệu mẫu cho Rankings
INSERT INTO Rankings (UserId, TotalDaysWithoutSmoking, TotalMoneySaved) VALUES
(4, 5, 120000),
(5, 3, 90000);

--- Dữ liệu mẫu cho SmokingDailyLog
INSERT INTO SmokingDailyLog (UserId, LogDate, Cigarettes, Feeling) VALUES
(4, '2025-06-06', 6, N'Bình thường'),
(5, '2025-06-13', 10, N'Hơi lo lắng');

--- Dữ liệu mẫu cho Booking
INSERT INTO Booking (MemberId, CoachId, SlotDate, Slot, Status, Note) VALUES
(4, 2, '2025-06-20', '7h-9h', N'đang chờ xác nhận', N'Lịch đầu tiên'),
(5, 3, '2025-06-22', '10h-12h', N'người dùng đã hủy', N'Hủy do bận việc');

--- Dữ liệu mẫu cho Messages
INSERT INTO Messages (SenderId, ReceiverId, Content) VALUES
(4, 2, N'Cảm ơn coach đã hỗ trợ!'),
(5, 3, N'Tôi đang gặp khó khăn vào buổi sáng.');




INSERT INTO SuggestedQuitPlans (Title, Description, PlanDetail)
VALUES
(
  N'KẾ HOẠCH CAI THUỐC TRONG 30 NGÀY (Dành cho người hút nhẹ đến trung bình)',
  N'Ngừng hút hoàn toàn trong 30 ngày. Giảm thiểu cơn thèm và phản ứng phụ.',
  N'
Tuần 1: Giai đoạn chuẩn bị: Xác định lý do cai thuốc, chọn ngày "D" (quit day), ghi nhật ký hút thuốc. Giảm 20-30% số điếu.
Tuần 2: Giai đoạn giảm dần: Chỉ hút sau bữa ăn hoặc khi thực sự không chịu được. Tăng hoạt động thể chất.
Tuần 3: Ngày "D" - Ngừng hoàn toàn. Sử dụng kẹo nicotine, chewing gum nếu cần. Ghi nhật ký cơn thèm.
Tuần 4: Ổn định: Thay đổi thói quen. Tránh các môi trường có người hút. Tập thiền, thở sâu.'
),
(
  N'KẾ HOẠCH CAI THUỐC TRONG 60 NGÀY (Dành cho người hút thuốc trung bình – nặng)',
  N'Ngưng hút thuốc hoàn toàn sau 30 ngày đầu. Làm quen với cuộc sống không thuốc trong 30 ngày tiếp theo.',
  N'
Ngày 1-15: Giảm dần lượng thuốc (giảm 1-2 điếu mỗi 2 ngày). Xác định "triggers" gây thèm.
Ngày 16-30: Ngày "D" – Ngưng hẳn. Tăng cường vận động, uống nhiều nước, giữ tay/mồm bận rộn.
Ngày 31-45: Ổn định tinh thần: Xử lý stress, áp lực bằng thể thao, thiền, viết nhật ký.
Ngày 46-60: Tái lập thói quen mới: Tập trung phát triển bản thân, kỹ năng mới, kết nối xã hội không thuốc.'
),
(
  N'KẾ HOẠCH CAI THUỐC TRONG 90 NGÀY (Dành cho người hút lâu năm hoặc nghiện nặng)',
  N'Giảm phụ thuộc cả thể chất lẫn tâm lý. Tái cấu trúc hoàn toàn thói quen sống không có thuốc lá.',
  N'
Tháng 1: Chuẩn bị và giảm dần: Ghi chép hành vi hút thuốc, giảm 10-20% mỗi tuần. Lên lịch bỏ thuốc.
Tháng 2: Cai hoàn toàn: Ngưng hút, sử dụng các công cụ hỗ trợ nếu cần. Ghi nhật ký cảm xúc.
Tháng 3: Củng cố: Tập trung vào phát triển cá nhân, xử lý trigger tiềm ẩn. Tham gia nhóm hỗ trợ hoặc huấn luyện viên.'
);

-- Cập nhật đặc điểm cho các gói mẫu
UPDATE MembershipPackages
SET Features = N'Nhập thông tin hút thuốc
Truy cập blog chia sẻ kinh nghiệm từ cộng đồng'
WHERE Name LIKE N'%cơ bản%' OR Name LIKE N'%Thường%';

UPDATE MembershipPackages
SET Features = N'Tất cả tính năng của gói Thường
Chat với huấn luyện viên
Đặt lịch hẹn
Được trao thành tích khi đạt mốc'
WHERE Name LIKE N'%VIP%';
