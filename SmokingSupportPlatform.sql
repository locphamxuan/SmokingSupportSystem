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
    StartDate DATE NOT NULL,
    TargetDate DATE,
    PlanDetail NVARCHAR(MAX),
    CreatedAt DATETIME DEFAULT GETDATE(),
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
    Message NVARCHAR(500) NOT NULL,
    Type NVARCHAR(50) NOT NULL, -- daily, weekly, motivation, reward, ...
    CreatedAt DATETIME NOT NULL DEFAULT GETDATE(),
    IsRead BIT NOT NULL DEFAULT 0
);

-- Nếu muốn ràng buộc UserId là khóa ngoại:
-- ALTER TABLE Notifications
-- ADD CONSTRAINT FK_Notifications_Users FOREIGN KEY (UserId) REFERENCES Users(Id);
-- Bảng thông báo hàng ngày
CREATE TABLE DailyNotifications (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Message NVARCHAR(500) NOT NULL
);

-- Bảng thông báo hàng tuần
CREATE TABLE WeeklyNotifications (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Message NVARCHAR(500) NOT NULL
);

-- Bảng thông báo trao huy hiệu hoặc phần thưởng
CREATE TABLE RewardNotifications (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Message NVARCHAR(500) NOT NULL
);

-- Bảng thông báo khi người dùng gặp khó khăn
CREATE TABLE MotivationNotifications (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Message NVARCHAR(500) NOT NULL
);

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
INSERT INTO QuitPlans (UserId, CoachId, StartDate, TargetDate, PlanDetail) VALUES
(4, 2, '2025-06-01', '2025-07-01', N'Kế hoạch mẫu - giảm dần mỗi tuần'),
(5, 3, '2025-06-10', '2025-08-01', N'Tự lên kế hoạch - bỏ hoàn toàn sau 3 tuần');

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



--- Dữ liệu mẫu cho Reports
INSERT INTO Reports (UserId, Content) VALUES
(4, N'Hệ thống rất hữu ích, dễ sử dụng.'),
(5, N'Tôi cảm thấy có động lực hơn khi sử dụng app.');



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


INSERT INTO DailyNotifications (Message) VALUES
(N'Một ngày không khói thuốc là một bước tiến đến cuộc sống khỏe mạnh. Bạn đang làm rất tốt!'),
(N'Hãy hít thở sâu và nhớ lý do bạn bắt đầu: vì chính bạn, vì gia đình, vì một tương lai tươi sáng.'),
(N'Chỉ cần vượt qua hôm nay, ngày mai sẽ dễ dàng hơn. Đừng bỏ cuộc!'),
(N'Cai thuốc là hành trình từng bước. Hôm nay bạn lại tiến thêm một bước!');



INSERT INTO WeeklyNotifications (Message) VALUES
(N'Tuần này bạn đã không hút thuốc! Một thành tích tuyệt vời, hãy tự hào về bản thân.'),
(N'Chúc mừng! Bạn đã vượt qua tuần thứ 2 không thuốc lá – nguy cơ đau tim của bạn đang giảm đáng kể!'),
(N'Bạn vừa bước sang tuần mới của hành trình! Hãy đặt ra mục tiêu nhỏ cho tuần này và chinh phục nó!'),
(N'Mỗi tuần không thuốc giúp phổi của bạn hồi phục thêm. Cơ thể đang biết ơn bạn!'),
(N'Hãy nhìn lại tuần qua – bạn đã mạnh mẽ hơn rất nhiều. Tiếp tục nhé!');



INSERT INTO RewardNotifications (Message) VALUES
(N'Chúc mừng! Bạn đã đạt mốc 1 ngày không thuốc – hãy chia sẻ thành tích này để truyền cảm hứng cho người khác.'),
(N'Chúc mừng! Bạn đã đạt mốc 3 ngày không thuốc – hãy chia sẻ thành tích này để truyền cảm hứng cho người khác.'),
(N'Chúc mừng! Bạn đã đạt mốc 5 ngày không thuốc – hãy chia sẻ thành tích này để truyền cảm hứng cho người khác.'),
(N'Chúc mừng! Bạn đã đạt mốc 7 ngày không thuốc – hãy chia sẻ thành tích này để truyền cảm hứng cho người khác.'),
(N'Chúc mừng! Bạn đã đạt mốc 14 ngày không thuốc – hãy chia sẻ thành tích này để truyền cảm hứng cho người khác.'),
(N'Chúc mừng! Bạn đã đạt mốc 30 ngày không thuốc – hãy chia sẻ thành tích này để truyền cảm hứng cho người khác.'),
(N'Chúc mừng! Bạn đã đạt mốc 60 ngày không thuốc – hãy chia sẻ thành tích này để truyền cảm hứng cho người khác.');



INSERT INTO MotivationNotifications (Message) VALUES
(N'Thèm thuốc ư? Đó chỉ là cơn sóng ngắn. Đứng vững, nó sẽ qua nhanh hơn bạn nghĩ.'),
(N'Mỗi lần bạn vượt qua cơn thèm thuốc, bạn trở nên mạnh mẽ hơn. Bạn kiểm soát cuộc đời mình, không phải điếu thuốc.'),
(N'Bạn có thể trượt, nhưng đừng dừng lại. Hãy bắt đầu lại – hệ thống luôn đồng hành cùng bạn.');


INSERT INTO Notifications (UserId, Message, Type, CreatedAt, IsRead)
SELECT 
    1008,
    d.Message,
    'daily',
    GETDATE(),
    0
FROM QuitPlans q
CROSS JOIN (
    SELECT TOP 1 Message FROM DailyNotifications ORDER BY NEWID()
) d

INSERT INTO Notifications (UserId, Message, Type, CreatedAt, IsRead)
SELECT 
    1008,
    w.Message,
    'weekly',
    GETDATE(),
    0
FROM QuitPlans q
CROSS JOIN (
    SELECT TOP 1 Message FROM WeeklyNotifications ORDER BY NEWID()
) w
WHERE DATEDIFF(DAY, q.StartDate, GETDATE()) % 7 = 0


INSERT INTO Notifications (UserId, Message, Type, CreatedAt, IsRead)
SELECT 
    1008,
    m.Message,
    'motivation',
    GETDATE(),
    0
FROM QuitPlans q
CROSS JOIN (
    SELECT TOP 1 Message FROM MotivationNotifications ORDER BY NEWID()
) m

INSERT INTO Notifications (UserId, Message, Type, CreatedAt, IsRead)
SELECT 
    1011,
    r.Message,
    'reward',
    GETDATE(),
    0
FROM QuitPlans q
CROSS JOIN RewardNotifications r
WHERE q.UserId = 1011
  AND (
        (r.Message LIKE N'%1 ngày%' AND DATEDIFF(DAY, q.StartDate, GETDATE()) = 1)
     OR (r.Message LIKE N'%3 ngày%' AND DATEDIFF(DAY, q.StartDate, GETDATE()) = 3)
     OR (r.Message LIKE N'%5 ngày%' AND DATEDIFF(DAY, q.StartDate, GETDATE()) = 5)
     OR (r.Message LIKE N'%7 ngày%' AND DATEDIFF(DAY, q.StartDate, GETDATE()) = 7)
     OR (r.Message LIKE N'%14 ngày%' AND DATEDIFF(DAY, q.StartDate, GETDATE()) = 14)
     OR (r.Message LIKE N'%30 ngày%' AND DATEDIFF(DAY, q.StartDate, GETDATE()) = 30)
     OR (r.Message LIKE N'%60 ngày%' AND DATEDIFF(DAY, q.StartDate, GETDATE()) = 60)
  )
  SELECT * FROM Notifications ORDER BY CreatedAt DESC;

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


ALTER TABLE Rankings DROP COLUMN TotalMoneySaved;
ALTER TABLE Rankings DROP CONSTRAINT DF__Rankings__TotalM__66603565;

-- Giả sử mỗi user có 1 ngày không hút thuốc khi cigarettes = 0
INSERT INTO Rankings (UserId, TotalDaysWithoutSmoking, LastUpdated)
SELECT 
    p.UserId, 
    COUNT(*) AS TotalDaysWithoutSmoking,
    MAX(p.Date) AS LastUpdated
FROM Progress p
WHERE p.Cigarettes = 0
GROUP BY p.UserId