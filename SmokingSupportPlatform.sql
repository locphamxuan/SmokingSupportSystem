CREATE DATABASE SmokingSupportPlatform;
GO

USE SmokingSupportPlatform;
GO
ALTER LOGIN sa WITH PASSWORD = '12345';
-- Thêm cột Price vào bảng Booking
ALTER TABLE Booking
ADD Price DECIMAL(10,2);

-- Thêm cột Price vào bảng Booking_Coach  
ALTER TABLE Booking_Coach  
ADD Price DECIMAL(10,2);



-- Thêm cột thời gian VIP
ALTER TABLE Users 
ADD VipStartDate DATETIME,
    VipEndDate DATETIME;
GO

-- Cập nhật dữ liệu cho người dùng VIP hiện tại
UPDATE Users
SET VipStartDate = GETDATE(),
    VipEndDate = DATEADD(DAY, 30, GETDATE())
WHERE IsMemberVip = 1 
  AND VipStartDate IS NULL;



-- Cập nhật giá mặc định cho các booking cũ (nếu cần)
UPDATE Booking 
SET Price = 0 
WHERE Price IS NULL;

UPDATE Booking_Coach
SET Price = 0
WHERE Price IS NULL;


IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'sp_CheckVipStatus')
    DROP PROCEDURE sp_CheckVipStatus
GO

UPDATE MembershipPackages
SET DurationInDays = -1 -- Sử dụng -1 để biểu thị không giới hạn
WHERE Name = N'Gói Thường' OR Id = 1;

UPDATE MembershipPackages
SET Description = N'Truy cập blog chia sẻ cộng đòng',N'Tạo kế hoạch cai thuốc cho riêng mình',=
    DurationInDays = -1
WHERE Name = N'Gói Thường' OR Id = 1;

CREATE PROCEDURE sp_CheckVipStatus
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Tạo bảng tạm để lưu user hết hạn VIP
    DECLARE @ExpiredUsers TABLE (
        UserId INT
    );

    -- Lưu danh sách user hết hạn vào bảng tạm
    INSERT INTO @ExpiredUsers (UserId)
    SELECT Id 
    FROM Users 
    WHERE IsMemberVip = 1 
    AND VipEndDate < GETDATE();

    -- Tạo thông báo cho những user hết hạn trước khi update status
    INSERT INTO Notifications (
        UserId,
        Message,
        Type,
        CreatedAt,
        IsRead
    )
    SELECT 
        UserId,
        N'Gói VIP của bạn đã hết hạn. Bạn đã được chuyển về gói thường.',
        'vip_expired',
        GETDATE(),
        0
    FROM @ExpiredUsers;

    -- Cập nhật trạng thái VIP về normal
    UPDATE Users 
    SET IsMemberVip = 0,
        VipStartDate = NULL,
        VipEndDate = NULL
    WHERE Id IN (SELECT UserId FROM @ExpiredUsers);

    -- Thông báo cho user sắp hết hạn
    INSERT INTO Notifications (
        UserId,
        Message,
        Type,
        CreatedAt,
        IsRead
    )
    SELECT 
        Id,
        N'Gói VIP của bạn sẽ hết hạn trong ' + 
        CAST(DATEDIFF(DAY, GETDATE(), VipEndDate) AS NVARCHAR(10)) + 
        N' ngày. Vui lòng gia hạn để tiếp tục sử dụng.',
        'vip_expiring_soon',
        GETDATE(),
        0
    FROM Users 
    WHERE IsMemberVip = 1 
    AND VipEndDate BETWEEN GETDATE() AND DATEADD(DAY, 3, GETDATE())
    AND Id NOT IN (
        SELECT UserId 
        FROM Notifications 
        WHERE Type = 'vip_expiring_soon' 
        AND CreatedAt > DATEADD(DAY, -1, GETDATE())
    );

    -- Trả về số lượng user bị hết hạn
    SELECT COUNT(*) as ExpiredCount FROM @ExpiredUsers;
END


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
    IsEmailVerified BIT NOT NULL DEFAULT 0,
    CreatedAt DATETIME NOT NULL DEFAULT GETDATE(),
    FOREIGN KEY (CoachId) REFERENCES Users(Id)
);
GO

-- OTP VERIFICATION
CREATE TABLE OTPVerification (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Email NVARCHAR(255) NOT NULL,
    OTP NVARCHAR(6) NOT NULL,
    ExpiresAt DATETIME NOT NULL,
    IsUsed BIT NOT NULL DEFAULT 0,
    CreatedAt DATETIME NOT NULL DEFAULT GETDATE()
);
GO





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
    CustomCigaretteType NVARCHAR(100),
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

-- MEMBERSHIP PACKAGES
CREATE TABLE MembershipPackages (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Name NVARCHAR(100) NOT NULL,
    Description NVARCHAR(255),
    Price INT NOT NULL,
    DurationInDays INT NOT NULL,
    Features NVARCHAR(MAX)
);
GO

-- BOOKING
CREATE TABLE Booking (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    MemberId INT NOT NULL,
    CoachId INT,
    Slot NVARCHAR(20) NOT NULL CHECK (Slot IN ('7h-9h', '10h-12h', '13h-15h', '16h-18h')),
    SlotDate DATE NOT NULL,
    Status NVARCHAR(50) DEFAULT N'đang chờ xác nhận' CHECK (Status IN (N'chưa thanh toán', N'đã thanh toán', N'khách hàng đã hủy', N'coach đã hủy')),
    Note NVARCHAR(MAX),
    CreatedAt DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (MemberId) REFERENCES Users(Id),
    FOREIGN KEY (CoachId) REFERENCES Users(Id)
);
GO

-- BOOKING COACH
CREATE TABLE Booking_Coach (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    BookingId INT NOT NULL,
    CoachId INT NOT NULL,
    Status NVARCHAR(50) DEFAULT N'đã nhận',
    AcceptedAt DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (BookingId) REFERENCES Booking(Id),
    FOREIGN KEY (CoachId) REFERENCES Users(Id)
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
    CurrentStageId INT,
    Status NVARCHAR(50) DEFAULT 'In Progress' CHECK (Status IN ('In Progress', 'Completed', 'Paused', 'Cancelled')),
    QuitReason NVARCHAR(500),
    CompletionDate DATETIME,
    FOREIGN KEY (UserId) REFERENCES Users(Id),
    FOREIGN KEY (CoachId) REFERENCES Users(Id)
);
GO

-- QUIT PLAN STAGES
CREATE TABLE QuitPlanStages (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    StageName NVARCHAR(100) NOT NULL,
    StageOrder INT NOT NULL,
    Objective NVARCHAR(255) NOT NULL,
    Description NVARCHAR(MAX)
);
GO

-- USER QUIT PLAN STAGES
CREATE TABLE UserQuitPlanStages (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    QuitPlanId INT NOT NULL,
    StageId INT NULL, -- Nullable to support custom stages
    StartDate DATETIME,
    EndDate DATETIME,
    Status NVARCHAR(50) DEFAULT 'not_started',
    StageName NVARCHAR(255),
    Objective NVARCHAR(500),
    InitialCigarettes INT,
    TargetCigarettes INT,
    FOREIGN KEY (QuitPlanId) REFERENCES QuitPlans(Id),
    FOREIGN KEY (StageId) REFERENCES QuitPlanStages(Id)
);
GO

-- STAGE ACTIVITIES
CREATE TABLE StageActivities (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    StageId INT NOT NULL,
    ActivityName NVARCHAR(255) NOT NULL,
    ActivityType NVARCHAR(50) NOT NULL, -- e.g., 'assessment', 'checklist', 'journal'
    FOREIGN KEY (StageId) REFERENCES QuitPlanStages(Id)
);
GO

-- USER STAGE ACTIVITIES
CREATE TABLE UserStageActivities (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    UserQuitPlanStageId INT NOT NULL,
    ActivityId INT NOT NULL,
    IsCompleted BIT DEFAULT 0,
    CompletionDate DATETIME,
    FOREIGN KEY (UserQuitPlanStageId) REFERENCES UserQuitPlanStages(Id),
    FOREIGN KEY (ActivityId) REFERENCES StageActivities(Id)
);
GO

-- SUGGESTED QUIT PLANS
CREATE TABLE SuggestedQuitPlans (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Title NVARCHAR(255) NOT NULL,
    Description NVARCHAR(MAX),
    PlanDetail NVARCHAR(MAX),
    CreatedAt DATETIME DEFAULT GETDATE()
);
GO

-- SUGGESTED QUIT PLAN STAGES
CREATE TABLE SuggestedQuitPlanStages (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    SuggestedPlanId INT NOT NULL,
    StageOrder INT NOT NULL,
    StageName NVARCHAR(255) NOT NULL,
    Objective NVARCHAR(500),
    Description NVARCHAR(MAX),
    InitialCigarettes INT,
    TargetCigarettes INT,
    DurationInDays INT,
    FOREIGN KEY (SuggestedPlanId) REFERENCES SuggestedQuitPlans(Id)
);
GO

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
    Type NVARCHAR(50) NOT NULL,
    CreatedAt DATETIME NOT NULL DEFAULT GETDATE(),
    IsRead BIT NOT NULL DEFAULT 0,
    FOREIGN KEY (UserId) REFERENCES Users(Id)
);
GO

-- DAILY NOTIFICATIONS
CREATE TABLE DailyNotifications (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Message NVARCHAR(500) NOT NULL
);
GO

-- WEEKLY NOTIFICATIONS
CREATE TABLE WeeklyNotifications (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Message NVARCHAR(500) NOT NULL
);
GO

-- REWARD NOTIFICATIONS
CREATE TABLE RewardNotifications (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Message NVARCHAR(500) NOT NULL
);
GO

-- MOTIVATION NOTIFICATIONS
CREATE TABLE MotivationNotifications (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Message NVARCHAR(500) NOT NULL
);
GO

-- SMOKING DAILY LOG
CREATE TABLE SmokingDailyLog (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    UserId INT NOT NULL,
    LogDate DATE DEFAULT GETDATE(),
    Cigarettes INT DEFAULT 0,
    Feeling NVARCHAR(255) DEFAULT '',
    PlanId INT NULL,
    SavedMoney DECIMAL(18,2) DEFAULT 0,
    SuggestedPlanId INT NULL,
    FOREIGN KEY (UserId) REFERENCES Users(Id),
    FOREIGN KEY (PlanId) REFERENCES QuitPlans(Id),
    FOREIGN KEY (SuggestedPlanId) REFERENCES SuggestedQuitPlans(Id)
);
GO
ALTER TABLE SmokingDailyLog
ADD CoachSuggestedPlanId INT NULL;
GO
-- POSTS
CREATE TABLE Posts (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    UserId INT NOT NULL,
    Title NVARCHAR(255) NOT NULL,
    Content NVARCHAR(MAX) NOT NULL,
    CreatedAt DATETIME DEFAULT GETDATE(),
    Status NVARCHAR(20) DEFAULT 'chờ duyệt',
    BadgeId INT NULL,
    FOREIGN KEY (UserId) REFERENCES Users(Id),
    FOREIGN KEY (BadgeId) REFERENCES Badges(Id)
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

-- MESSAGES
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

-- REPORTS
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
    LastUpdated DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (UserId) REFERENCES Users(Id)
);
GO

-- USER SUGGESTED QUIT PLANS
CREATE TABLE UserSuggestedQuitPlans (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    UserId INT NOT NULL,
    SuggestedPlanId INT NOT NULL,
    StartDate DATE NOT NULL,
    TargetDate DATE NOT NULL,
    Status NVARCHAR(20) DEFAULT 'active',
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (UserId) REFERENCES Users(Id),
    FOREIGN KEY (SuggestedPlanId) REFERENCES SuggestedQuitPlans(Id)
);
GO

-- Add IsCoachApproved column to Users table
ALTER TABLE Users ADD IsCoachApproved BIT NOT NULL DEFAULT 0;
GO

-- COACH SUGGESTED QUIT PLANS
CREATE TABLE CoachSuggestedQuitPlans (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    CoachId INT NULL,
    UserId INT NULL,
    Title NVARCHAR(255) NOT NULL,
    Description NVARCHAR(MAX),
    PlanDetail NVARCHAR(MAX),
    StartDate DATE NULL,
    TargetDate DATE NULL,
    Status NVARCHAR(20) NULL,
    CreatedAt DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (CoachId) REFERENCES Users(Id),
    FOREIGN KEY (UserId) REFERENCES Users(Id)
);
GO

-- Insert sample data for QuitPlanStages
INSERT INTO QuitPlanStages (StageName, StageOrder, Objective, Description) VALUES
(N'Pre-Contemplation/Assessment', 1, N'Assess current smoking habits and readiness to quit', N'Days -14 to -7'),
(N'Contemplation/Preparation', 2, N'Build motivation and prepare for quit day', N'Days -7 to 0'),
(N'Action/Quit Day', 3, N'Execute the quit plan and manage immediate cessation', N'Day 0'),
(N'Early Maintenance', 4, N'Maintain abstinence and manage acute withdrawal', N'Days 1-30'),
(N'Extended Maintenance', 5, N'Strengthen quit commitment and prevent relapse', N'Days 31-90'),
(N'Long-term Maintenance', 6, N'Sustain long-term abstinence and lifestyle change', N'Days 91-365+');
GO

-- Insert sample data for StageActivities
-- Stage 1: Pre-Contemplation/Assessment
INSERT INTO StageActivities (StageId, ActivityName, ActivityType) VALUES
(1, N'Complete comprehensive smoking history assessment', 'assessment'),
(1, N'Record current smoking patterns (number of cigarettes, frequency, cost)', 'assessment'),
(1, N'Identify personal smoking triggers and situations', 'assessment'),
(1, N'Assess previous quit attempts and outcomes', 'assessment'),
(1, N'Complete readiness-to-change questionnaire', 'assessment');

-- Stage 2: Contemplation/Preparation
INSERT INTO StageActivities (StageId, ActivityName, ActivityType) VALUES
(2, N'Define and document personal reasons for quitting', 'journal'),
(2, N'Set specific quit date within 2-week window', 'checklist'),
(2, N'Choose cessation methods and support tools', 'checklist'),
(2, N'Prepare environment (remove smoking triggers)', 'checklist'),
(2, N'Develop coping strategies for withdrawal symptoms', 'journal'),
(2, N'Create support network activation plan', 'checklist');

-- Stage 3: Action/Quit Day
INSERT INTO StageActivities (StageId, ActivityName, ActivityType) VALUES
(3, N'Activate quit day protocol', 'checklist'),
(3, N'Implement immediate coping strategies', 'journal'),
(3, N'Begin withdrawal symptom management', 'journal'),
(3, N'Execute environmental changes', 'checklist'),
(3, N'Activate support network', 'checklist');

-- Stage 4: Early Maintenance
INSERT INTO StageActivities (StageId, ActivityName, ActivityType) VALUES
(4, N'Daily check-ins and progress logging', 'journal'),
(4, N'Craving intensity and frequency tracking', 'journal'),
(4, N'Health improvement monitoring', 'assessment'),
(4, N'Financial savings calculation', 'assessment'),
(4, N'Trigger situation management', 'journal'),
(4, N'Support system utilization', 'checklist');

-- Stage 5: Extended Maintenance
INSERT INTO StageActivities (StageId, ActivityName, ActivityType) VALUES
(5, N'Weekly comprehensive progress reviews', 'journal'),
(5, N'Advanced coping skills development', 'journal'),
(5, N'Lifestyle habit integration', 'journal'),
(5, N'Social support system reinforcement', 'checklist'),
(5, N'Relapse prevention planning', 'journal');

-- Stage 6: Long-term Maintenance
INSERT INTO StageActivities (StageId, ActivityName, ActivityType) VALUES
(6, N'Monthly milestone celebrations and reviews', 'journal'),
(6, N'Long-term health benefit tracking', 'assessment'),
(6, N'Continuous lifestyle optimization', 'journal'),
(6, N'Peer support and mentoring opportunities', 'checklist'),
(6, N'Relapse recovery planning (if needed)', 'journal');
GO

-- Insert sample data
INSERT INTO Users (Username, Password, Email, Role, IsMemberVip) 
VALUES (N'admin', N'admin123', N'admin@smoking.com', 'admin', 0);
GO

-- Insert sample membership packages
INSERT INTO MembershipPackages (Name, Description, Price, DurationInDays, Features) 
VALUES (N'Gói Thường', N'Gói cơ bản cho phép nhập thông tin hút thuốc và truy cập blog cộng đồng.', 0, ' ', 
N'Nhập thông tin hút thuốc
Truy cập blog chia sẻ kinh nghiệm từ cộng đồng');
GO

INSERT INTO MembershipPackages (Name, Description, Price, DurationInDays, Features) 
VALUES (N'Gói VIP', N'Gói cao cấp với đầy đủ tính năng, hỗ trợ huấn luyện viên và thành tích.', 199000, 30, 
N'Tất cả tính năng của gói Thường
Chat với huấn luyện viên
Đặt lịch hẹn
Được trao thành tích khi đạt mốc');
GO


-- Insert sample badges
INSERT INTO Badges (Name, Description, BadgeType, Requirement) VALUES
(N'1 ngày không hút thuốc', N'Chúc mừng bạn đã không hút thuốc 1 ngày!', 'loai1', '1'),
(N'3 ngày không hút thuốc', N'Tuyệt vời! Bạn đã giữ vững 3 ngày.', 'loai2', '3'),
(N'5 ngày không hút thuốc', N'Cố gắng tuyệt vời trong 5 ngày!', 'loai3', '5'),
(N'7 ngày không hút thuốc', N'1 tuần trôi qua rồi!', 'loai4', '7'),
(N'14 ngày không hút thuốc', N'2 tuần rồi đó!', 'loai5', '14'),
(N'30 ngày không hút thuốc', N'1 tháng đầy kiên cường!', 'loai6', '30'),
(N'60 ngày không hút thuốc', N'2 tháng chinh phục!', 'loai7', '60');
GO

-- Insert sample suggested quit plans
INSERT INTO SuggestedQuitPlans (Title, Description, PlanDetail) VALUES
(N'KẾ HOẠCH CAI THUỐC TRONG 30 NGÀY (Dành cho người hút nhẹ đến trung bình)',
N'Ngừng hút hoàn toàn trong 30 ngày. Giảm thiểu cơn thèm và phản ứng phụ.',
N'Tuần 1: Giai đoạn chuẩn bị: Xác định lý do cai thuốc, chọn ngày "D" (quit day), ghi nhật ký hút thuốc. Giảm 20-30% số điếu.
Tuần 2: Giai đoạn giảm dần: Chỉ hút sau bữa ăn hoặc khi thực sự không chịu được. Tăng hoạt động thể chất.
Tuần 3: Ngày "D" - Ngừng hoàn toàn. Sử dụng kẹo nicotine, chewing gum nếu cần. Ghi nhật ký cơn thèm.
Tuần 4: Ổn định: Thay đổi thói quen. Tránh các môi trường có người hút. Tập thiền, thở sâu.');
GO

INSERT INTO SuggestedQuitPlans (Title, Description, PlanDetail) VALUES
(N'KẾ HOẠCH CAI THUỐC TRONG 60 NGÀY (Dành cho người hút thuốc trung bình – nặng)',
N'Ngưng hút thuốc hoàn toàn sau 30 ngày đầu. Làm quen với cuộc sống không thuốc trong 30 ngày tiếp theo.',
N'Ngày 1-15: Giảm dần lượng thuốc (giảm 1-2 điếu mỗi 2 ngày). Xác định "triggers" gây thèm.
Ngày 16-30: Ngày "D" – Ngưng hẳn. Tăng cường vận động, uống nhiều nước, giữ tay/mồm bận rộn.
Ngày 31-45: Ổn định tinh thần: Xử lý stress, áp lực bằng thể thao, thiền, viết nhật ký.
Ngày 46-60: Tái lập thói quen mới: Tập trung phát triển bản thân, kỹ năng mới, kết nối xã hội không thuốc.');
GO

INSERT INTO SuggestedQuitPlans (Title, Description, PlanDetail) VALUES
(N'KẾ HOẠCH CAI THUỐC TRONG 90 NGÀY (Dành cho người hút lâu năm hoặc nghiện nặng)',
N'Giảm phụ thuộc cả thể chất lẫn tâm lý. Tái cấu trúc hoàn toàn thói quen sống không có thuốc lá.',
N'Tháng 1: Chuẩn bị và giảm dần: Ghi chép hành vi hút thuốc, giảm 10-20% mỗi tuần. Lên lịch bỏ thuốc.
Tháng 2: Cai hoàn toàn: Ngưng hút, sử dụng các công cụ hỗ trợ nếu cần. Ghi nhật ký cảm xúc.
Tháng 3: Củng cố: Tập trung vào phát triển cá nhân, xử lý trigger tiềm ẩn. Tham gia nhóm hỗ trợ hoặc huấn luyện viên.');
GO

-- Insert sample notifications
INSERT INTO DailyNotifications (Message) VALUES
(N'Một ngày không khói thuốc là một bước tiến đến cuộc sống khỏe mạnh. Bạn đang làm rất tốt!'),
(N'Hãy hít thở sâu và nhớ lý do bạn bắt đầu: vì chính bạn, vì gia đình, vì một tương lai tươi sáng.'),
(N'Chỉ cần vượt qua hôm nay, ngày mai sẽ dễ dàng hơn. Đừng bỏ cuộc!'),
(N'Cai thuốc là hành trình từng bước. Hôm nay bạn lại tiến thêm một bước!');
GO

INSERT INTO WeeklyNotifications (Message) VALUES
(N'Tuần này bạn đã không hút thuốc! Một thành tích tuyệt vời, hãy tự hào về bản thân.'),
(N'Chúc mừng! Bạn đã vượt qua tuần thứ 2 không thuốc lá – nguy cơ đau tim của bạn đang giảm đáng kể!'),
(N'Bạn vừa bước sang tuần mới của hành trình! Hãy đặt ra mục tiêu nhỏ cho tuần này và chinh phục nó!'),
(N'Mỗi tuần không thuốc giúp phổi của bạn hồi phục thêm. Cơ thể đang biết ơn bạn!'),
(N'Hãy nhìn lại tuần qua – bạn đã mạnh mẽ hơn rất nhiều. Tiếp tục nhé!');
GO

INSERT INTO RewardNotifications (Message) VALUES
(N'Chúc mừng! Bạn đã đạt mốc 1 ngày không thuốc – hãy chia sẻ thành tích này để truyền cảm hứng cho người khác.'),
(N'Chúc mừng! Bạn đã đạt mốc 3 ngày không thuốc – hãy chia sẻ thành tích này để truyền cảm hứng cho người khác.'),
(N'Chúc mừng! Bạn đã đạt mốc 5 ngày không thuốc – hãy chia sẻ thành tích này để truyền cảm hứng cho người khác.'),
(N'Chúc mừng! Bạn đã đạt mốc 7 ngày không thuốc – hãy chia sẻ thành tích này để truyền cảm hứng cho người khác.'),
(N'Chúc mừng! Bạn đã đạt mốc 14 ngày không thuốc – hãy chia sẻ thành tích này để truyền cảm hứng cho người khác.'),
(N'Chúc mừng! Bạn đã đạt mốc 30 ngày không thuốc – hãy chia sẻ thành tích này để truyền cảm hứng cho người khác.'),
(N'Chúc mừng! Bạn đã đạt mốc 60 ngày không thuốc – hãy chia sẻ thành tích này để truyền cảm hứng cho người khác.');
GO

INSERT INTO MotivationNotifications (Message) VALUES
(N'Thèm thuốc ư? Đó chỉ là cơn sóng ngắn. Đứng vững, nó sẽ qua nhanh hơn bạn nghĩ.'),
(N'Mỗi lần bạn vượt qua cơn thèm thuốc, bạn trở nên mạnh mẽ hơn. Bạn kiểm soát cuộc đời mình, không phải điếu thuốc.'),
(N'Bạn có thể trượt, nhưng đừng dừng lại. Hãy bắt đầu lại – hệ thống luôn đồng hành cùng bạn.');
GO

-- Insert sample coach suggested quit plans
INSERT INTO CoachSuggestedQuitPlans (CoachId, UserId, Title, Description, PlanDetail, StartDate, TargetDate) VALUES
(NULL, NULL, N'Kế hoạch giảm dần 30 ngày', N'Kế hoạch phù hợp cho người hút dưới 10 điếu/ngày.',
N'Tuần 1: Giảm từ 10 xuống 7 điếu/ngày.
Tuần 2: Giảm xuống 5 điếu/ngày.
Tuần 3: Giảm xuống 2 điếu/ngày.
Tuần 4: Ngưng hoàn toàn.', NULL, NULL);
GO

INSERT INTO CoachSuggestedQuitPlans (CoachId, UserId, Title, Description, PlanDetail, StartDate, TargetDate) VALUES
(NULL, NULL, N'Cai thuốc 60 ngày', N'Kế hoạch cho người hút 10-20 điếu/ngày.',
N'Ngày 1-15: Giảm 1 điếu mỗi 2 ngày.
Ngày 16-30: Ổn định ở 5 điếu/ngày.
Ngày 31-45: Giảm xuống 2 điếu/ngày.
Ngày 46-60: Ngưng hoàn toàn.', NULL, NULL);
GO

INSERT INTO CoachSuggestedQuitPlans (CoachId, UserId, Title, Description, PlanDetail, StartDate, TargetDate) VALUES
(NULL, NULL, N'Kế hoạch 90 ngày cho người nghiện nặng', N'Kế hoạch dành cho người hút trên 20 điếu/ngày.',
N'Tháng 1: Giảm 2 điếu/ngày mỗi tuần.
Tháng 2: Ổn định ở 10 điếu/ngày.
Tháng 3: Ngưng hoàn toàn, tập trung thể thao và thiền.', NULL, NULL);
GO

INSERT INTO SuggestedQuitPlanStages (SuggestedPlanId, StageOrder, StageName, Objective, Description, InitialCigarettes, TargetCigarettes, DurationInDays)
VALUES
-- Plan 1: 30-Day Plan (Light to Moderate Smokers)
(1, 1, N'Tuần 1: Khởi động', N'Giảm 25% lượng thuốc', N'Ghi nhật ký hút thuốc, xác định lý do cai thuốc, chuẩn bị tinh thần. Giảm từ 20 xuống 15 điếu/ngày.', 20, 15, 7),
(1, 2, N'Tuần 2: Tăng tốc', N'Giảm thêm 33%', N'Chỉ hút sau bữa ăn hoặc khi thực sự cần thiết. Tăng hoạt động thể chất. Giảm từ 15 xuống 10 điếu/ngày.', 15, 10, 7),
(1, 3, N'Tuần 3: Về đích', N'Giảm 50% cuối cùng', N'Chuẩn bị cho ngày "D". Sử dụng kẹo nicotine nếu cần. Giảm từ 10 xuống 5 điếu/ngày.', 10, 5, 7),
(1, 4, N'Tuần 4: Cai hoàn toàn', N'Ngừng hút hoàn toàn', N'Ngày "D" - ngừng hút hoàn toàn. Thay đổi thói quen, tránh trigger, tập thiền và thở sâu.', 5, 0, 9);

INSERT INTO SuggestedQuitPlanStages (SuggestedPlanId, StageOrder, StageName, Objective, Description, InitialCigarettes, TargetCigarettes, DurationInDays)
VALUES
-- Plan 2: 60-Day Plan (Moderate to Heavy Smokers)
(2, 1, N'Giai đoạn 1: Chuẩn bị (Ngày 1-15)', N'Giảm 20% lượng thuốc', N'Xác định triggers, giảm 1-2 điếu mỗi 2 ngày. Tìm kiếm sự hỗ trợ từ bạn bè, gia đình. Giảm từ 30 xuống 24 điếu/ngày.', 30, 24, 15),
(2, 2, N'Giai đoạn 2: Giảm dần (Ngày 16-30)', N'Giảm xuống còn một nửa', N'Tăng cường vận động, uống nhiều nước. Giữ tay và miệng bận rộn. Giảm từ 24 xuống 15 điếu/ngày.', 24, 15, 15),
(2, 3, N'Giai đoạn 3: Cai hoàn toàn (Ngày 31-45)', N'Ngừng hút thuốc', N'Ngày "D" - ngưng hẳn. Xử lý stress bằng thiền, viết nhật ký. Tránh xa các tình huống có nguy cơ cao.', 15, 0, 15),
(2, 4, N'Giai đoạn 4: Ổn định (Ngày 46-60)', N'Duy trì không hút thuốc', N'Tái lập thói quen mới, tập trung phát triển bản thân, kết nối xã hội không thuốc lá.', 0, 0, 15);

INSERT INTO SuggestedQuitPlanStages (SuggestedPlanId, StageOrder, StageName, Objective, Description, InitialCigarettes, TargetCigarettes, DurationInDays)
VALUES
-- Plan 3: 90-Day Plan (Long-term/Heavy Smokers)
(3, 1, N'Tháng 1: Giảm dần', N'Giảm 40% trong tháng đầu', N'Ghi chép hành vi hút thuốc chi tiết, lên lịch bỏ thuốc cụ thể. Giảm 10-20% mỗi tuần. Giảm từ 40 xuống 24 điếu/ngày.', 40, 24, 30),
(3, 2, N'Tháng 2: Cai hoàn toàn', N'Ngừng hút hoàn toàn', N'Ngưng hút hoàn toàn, sử dụng các công cụ hỗ trợ (nicotine gum, patch). Ghi nhật ký cảm xúc và cơn thèm.', 24, 0, 30),
(3, 3, N'Tháng 3: Củng cố và duy trì', N'Sống không thuốc lá', N'Củng cố thành quả, xử lý trigger tiềm ẩn. Tham gia nhóm hỗ trợ hoặc làm việc với huấn luyện viên.', 0, 0, 30);

GO


USE SmokingSupportPlatform;
GO

-- Xóa job cũ nếu tồn tại
IF EXISTS (SELECT job_id FROM msdb.dbo.sysjobs_view WHERE name = N'Check VIP Status')
EXEC msdb.dbo.sp_delete_job @job_name=N'Check VIP Status', @delete_unused_schedule=1
GO

BEGIN TRANSACTION
DECLARE @ReturnCode INT
SELECT @ReturnCode = 0

EXEC @ReturnCode = msdb.dbo.sp_add_job @job_name=N'Check VIP Status', 
        @enabled=1, 
        @notify_level_eventlog=0, 
        @notify_level_email=0, 
        @notify_level_netsend=0, 
        @notify_level_page=0, 
        @delete_level=0, 
        @description=N'Kiểm tra và cập nhật trạng thái VIP của người dùng', 
        @category_name=N'[Uncategorized (Local)]', 
        @owner_login_name=N'sa'

EXEC @ReturnCode = msdb.dbo.sp_add_jobstep @job_name=N'Check VIP Status', 
        @step_name=N'Run Check VIP', 
        @step_id=1, 
        @cmdexec_success_code=0, 
        @on_success_action=1, 
        @on_success_step_id=0, 
        @on_fail_action=2, 
        @on_fail_step_id=0, 
        @retry_attempts=0, 
        @retry_interval=0, 
        @os_run_priority=0,
        @subsystem=N'TSQL', 
        @command=N'EXEC sp_CheckAndUpdateVipStatus', 
        @database_name=N'SmokingSupportPlatform'

EXEC @ReturnCode = msdb.dbo.sp_add_jobschedule @job_name=N'Check VIP Status', 
        @name=N'Daily Check', 
        @enabled=1, 
        @freq_type=4, 
        @freq_interval=1, 
        @freq_subday_type=1, 
        @freq_subday_interval=0, 
        @freq_relative_interval=0, 
        @freq_recurrence_factor=0, 
        @active_start_date=20250731, 
        @active_end_date=99991231, 
        @active_start_time=0, 
        @active_end_time=235959

EXEC @ReturnCode = msdb.dbo.sp_add_jobserver @job_name=N'Check VIP Status'

COMMIT TRANSACTION
GO