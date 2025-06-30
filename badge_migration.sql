-- Script để kiểm tra và sửa lỗi database nếu cần
-- CHỈ chạy script này nếu database đã tạo từ file SQL cũ và gặp lỗi

USE SmokingSupportPlatform;
GO

-- Xóa database cũ và tạo lại từ file SmokingSupportPlatform.sql mới
-- HOẶC chạy script dưới đây để sửa lỗi

PRINT 'Nếu gặp lỗi với BadgeId, hãy DROP database và tạo lại từ file SmokingSupportPlatform.sql';
PRINT 'Hoặc liên hệ để được hỗ trợ sửa lỗi database hiện tại';

-- Kiểm tra cột BadgeId
SELECT 
    COLUMN_NAME, 
    DATA_TYPE, 
    IS_NULLABLE,
    COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'Posts' AND COLUMN_NAME = 'BadgeId';

-- Kiểm tra foreign key constraints
SELECT 
    CONSTRAINT_NAME,
    TABLE_NAME,
    COLUMN_NAME
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
WHERE CONSTRAINT_NAME = 'FK_Posts_BadgeId'; 