# Tóm tắt cập nhật API - Smoking Support System

## Backend Controllers đã được cập nhật:

### 1. authController.js
- ✅ Thêm `getSuggestedQuitPlans()` - API lấy danh sách kế hoạch mẫu (chỉ cho memberVip)
- ✅ Cập nhật tất cả API để sử dụng `IsMemberVip` thay vì `IsMember`
- ✅ Cập nhật role handling: `member`, `memberVip`, `coach`, `admin`

### 2. statisticsController.js
- ✅ `getUserStatistics()` - Lấy thống kê người dùng
- ✅ `updateUserStatistics()` - Cập nhật thống kê người dùng

### 3. notificationController.js
- ✅ `getUserNotifications()` - Lấy thông báo người dùng
- ✅ `markNotificationAsRead()` - Đánh dấu thông báo đã đọc
- ✅ `createNotification()` - Tạo thông báo mới

### 4. dailyLogController.js
- ✅ `getDailyLog()` - Lấy nhật ký hàng ngày
- ✅ `addDailyLog()` - Thêm nhật ký hàng ngày

### 5. membershipController.js
- ✅ `getMembershipPackages()` - Lấy danh sách gói thành viên

### 6. rankingController.js
- ✅ `getRankings()` - Lấy bảng xếp hạng

### 7. reportController.js
- ✅ `submitReport()` - Gửi báo cáo
- ✅ `getAllReports()` - Lấy tất cả báo cáo (admin)

## Frontend Services đã được cập nhật:

### 1. extraService.jsx
- ✅ `getUserStatistics()` - Lấy thống kê người dùng
- ✅ `getUserNotifications()` - Lấy thông báo
- ✅ `markNotificationAsRead()` - Đánh dấu thông báo đã đọc
- ✅ `submitReport()` - Gửi báo cáo
- ✅ `getRankings()` - Lấy bảng xếp hạng
- ✅ `getDailyLog()` - Lấy nhật ký hàng ngày
- ✅ `addDailyLog()` - Thêm nhật ký hàng ngày
- ✅ `getMembershipPackages()` - Lấy gói thành viên
- ✅ `getSuggestedQuitPlans()` - Lấy kế hoạch mẫu

## Frontend Pages đã được cập nhật:

### 1. MyProgressPage.jsx
- ✅ Cập nhật để sử dụng API mới từ extraService
- ✅ Sử dụng `addDailyLog()` thay vì API cũ
- ✅ Import các service mới

### 2. SubscriptionPlans.jsx
- ✅ Đã sử dụng `getMembershipPackages()` từ extraService
- ✅ Cập nhật logic kiểm tra `isMemberVip`

### 3. LeaderboardPage.jsx
- ✅ Cập nhật để sử dụng `getRankings()` từ extraService
- ✅ Cập nhật UI để hiển thị đúng dữ liệu từ API mới

## Routes đã được cập nhật:

### 1. authRoutes.js
- ✅ Thêm route `/quit-plan/suggested` cho suggested quit plans
- ✅ Tất cả routes đã được map với controllers tương ứng

## Swagger Documentation:

### 1. swagger.yaml
- ✅ Đã cập nhật đầy đủ với tất cả API mới
- ✅ Schema definitions cho tất cả models
- ✅ Response examples và error codes
- ✅ Role-based access control documentation

## Database Schema Alignment:

### 1. Các bảng chính:
- ✅ `Users` - với `Role` và `IsMemberVip`
- ✅ `SmokingDailyLog` - nhật ký hàng ngày
- ✅ `UserStatistics` - thống kê người dùng
- ✅ `Notifications` - thông báo
- ✅ `Reports` - báo cáo
- ✅ `Rankings` - bảng xếp hạng
- ✅ `MembershipPackages` - gói thành viên
- ✅ `SuggestedQuitPlans` - kế hoạch mẫu

## Role-based Feature Matrix:

### Member (Miễn phí):
- ✅ Nhật ký cơ bản (30 ngày gần nhất)
- ✅ Thống kê đơn giản
- ✅ Cộng đồng hỗ trợ

### MemberVip (Premium):
- ✅ Tất cả tính năng của Member
- ✅ Nhật ký chi tiết (toàn bộ lịch sử)
- ✅ Thống kê nâng cao
- ✅ Kế hoạch mẫu hệ thống
- ✅ Tư vấn chuyên gia
- ✅ Bảng xếp hạng chi tiết

## API Endpoints Summary:

### Authentication & Profile:
- `POST /auth/login` - Đăng nhập
- `POST /auth/register` - Đăng ký
- `GET /auth/profile` - Lấy thông tin profile
- `PUT /auth/profile` - Cập nhật profile
- `PUT /auth/upgrade-member` - Nâng cấp thành memberVip

### Smoking & Progress:
- `PUT /auth/smoking-status` - Cập nhật trạng thái hút thuốc
- `POST /auth/quit-plan` - Tạo/cập nhật kế hoạch cai thuốc
- `GET /auth/quit-plan` - Lấy kế hoạch cai thuốc
- `GET /auth/quit-plan/suggested` - Lấy kế hoạch mẫu (memberVip only)
- `POST /auth/progress` - Ghi nhận tiến trình
- `GET /auth/progress/history` - Lấy lịch sử tiến trình

### Daily Log:
- `GET /auth/daily-log` - Lấy nhật ký hàng ngày
- `POST /auth/daily-log` - Thêm nhật ký hàng ngày

### Statistics & Analytics:
- `GET /auth/statistics` - Lấy thống kê người dùng
- `GET /auth/rankings` - Lấy bảng xếp hạng

### Notifications:
- `GET /auth/notifications` - Lấy thông báo
- `PUT /auth/notifications/:id/read` - Đánh dấu đã đọc

### Reports:
- `POST /auth/reports` - Gửi báo cáo

### Membership:
- `GET /auth/membership-packages` - Lấy gói thành viên

### Community:
- `GET /auth/posts` - Lấy bài đăng
- `POST /auth/posts` - Tạo bài đăng
- `GET /auth/posts/:id/comments` - Lấy bình luận
- `POST /auth/posts/:id/comments` - Thêm bình luận

### Badges & Achievements:
- `GET /auth/badges` - Lấy huy hiệu người dùng

## Status: ✅ HOÀN THÀNH

Tất cả API đã được cập nhật và đồng bộ giữa:
- Backend Controllers
- Frontend Services  
- Swagger Documentation
- Database Schema
- Role-based Access Control 