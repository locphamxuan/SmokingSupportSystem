# SmokingSupportSystem

## Hướng dẫn sử dụng database dùng chung (MongoDB)

### 1. Cấu hình kết nối MongoDB

Dự án này sử dụng database MongoDB dùng chung cho nhiều máy. Khi clone code về, bạn chỉ cần cấu hình file `.env` như sau:

```env
MONGO_URI=mongodb://swpuser:swppass123@192.168.1.100:27017/SmokingSupportPlatform
JWT_SECRET=your_jwt_secret_here
PORT=5000
```
- Thay `192.168.1.100` bằng IP thật của máy chủ MongoDB.
- Thay `swpuser` và `swppass123` bằng user/password bạn đã tạo trên MongoDB server.

### 2. Cách chạy dự án

```bash
npm install
npm start
```

### 3. Lưu ý
- Bạn **không cần cài MongoDB local** nếu đã dùng connection string trên.
- Tất cả các máy dùng chung database, tài khoản, dữ liệu.
- Nếu không kết nối được, hãy kiểm tra:
  - Địa chỉ IP máy chủ MongoDB
  - Đã mở cổng 27017 trên firewall máy chủ
  - Đã sửa `bindIp: 0.0.0.0` trong file cấu hình MongoDB
  - User/password đúng

### 4. Bảo mật
- Nếu dùng qua Internet, nên chỉ mở cổng cho IP tin cậy và đặt password mạnh cho user MongoDB.
- Không commit file `.env` chứa thông tin nhạy cảm lên public repository.

---

## Thông tin liên hệ
- Nếu cần hỗ trợ, liên hệ admin dự án.
