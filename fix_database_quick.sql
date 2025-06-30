-- Script sửa lỗi BadgeId trong database hiện tại
-- Chạy script này nếu không muốn tạo lại database

USE SmokingSupportPlatform;
GO

-- Bước 1: Xóa constraint cũ nếu có
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS WHERE CONSTRAINT_NAME = 'FK_Posts_BadgeId')
BEGIN
    ALTER TABLE Posts DROP CONSTRAINT FK_Posts_BadgeId;
    PRINT 'Đã xóa constraint cũ FK_Posts_BadgeId';
END

-- Bước 2: Xóa cột BadgeId nếu có (để tạo lại)
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Posts' AND COLUMN_NAME = 'BadgeId')
BEGIN
    ALTER TABLE Posts DROP COLUMN BadgeId;
    PRINT 'Đã xóa cột BadgeId cũ';
END

-- Bước 3: Thêm cột BadgeId mới
ALTER TABLE Posts ADD BadgeId INT NULL;
PRINT 'Đã thêm cột BadgeId mới';

-- Bước 4: Tạo constraint mới
ALTER TABLE Posts
ADD CONSTRAINT FK_Posts_BadgeId
FOREIGN KEY (BadgeId) REFERENCES Badges(Id);
PRINT 'Đã tạo constraint FK_Posts_BadgeId mới';

-- Bước 5: Kiểm tra kết quả
SELECT 
    COLUMN_NAME, 
    DATA_TYPE, 
    IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'Posts' AND COLUMN_NAME = 'BadgeId';

PRINT 'Sửa lỗi database hoàn tất! Bây giờ có thể test tính năng BadgeId'; 