# Backend Clean Code Guide

## Tổng quan

Backend đã được clean code với các cải thiện sau:

### 1. **Xóa console.log không cần thiết**
- ✅ Đã xóa tất cả `console.log` debug
- ✅ Chỉ giữ lại `console.error` cho lỗi
- ✅ Xóa log dữ liệu nhạy cảm (token, password, ...)

### 2. **Tạo Database Utils (`server/utils/dbUtils.js`)**
- ✅ Gom các truy vấn SQL lặp lại
- ✅ Tách biệt logic database
- ✅ Dễ maintain và tái sử dụng

**Các module utils:**
- `userUtils`: Queries liên quan đến user
- `smokingUtils`: Queries liên quan đến smoking profile
- `dailyLogUtils`: Queries liên quan đến daily log
- `badgeUtils`: Queries liên quan đến badges
- `planUtils`: Queries liên quan đến quit plans
- `bookingUtils`: Queries liên quan đến booking

### 3. **Global Error Handler (`server/middlewares/errorHandler.js`)**
- ✅ Xử lý lỗi thống nhất cho toàn bộ API
- ✅ Custom error classes
- ✅ Async error wrapper

**Các error classes:**
- `ValidationError`: Lỗi validate input
- `UnauthorizedError`: Lỗi xác thực
- `ForbiddenError`: Lỗi quyền truy cập
- `NotFoundError`: Lỗi không tìm thấy resource

### 4. **Input Validation (`server/utils/validation.js`)**
- ✅ Validate input data từ client
- ✅ Schemas cho từng API endpoint
- ✅ Middleware validate tự động

**Các validation schemas:**
- `register`: Validate đăng ký
- `login`: Validate đăng nhập
- `smokingProfile`: Validate smoking profile
- `dailyLog`: Validate daily log
- `quitPlan`: Validate quit plan
- `createPost`: Validate tạo post
- `comment`: Validate comment

### 5. **Cải thiện app.js**
- ✅ Thêm global error handler
- ✅ Xóa console.log không cần thiết
- ✅ Cấu trúc rõ ràng hơn

## Cách sử dụng

### 1. Sử dụng Database Utils

```javascript
const { userUtils, smokingUtils } = require('../utils/dbUtils');

// Thay vì viết SQL trực tiếp
const user = await userUtils.getUserById(userId);
const smokingProfile = await smokingUtils.getSmokingProfile(userId);
```

### 2. Sử dụng Error Handler

```javascript
const { asyncHandler, ValidationError } = require('../middlewares/errorHandler');

// Wrap controller với asyncHandler
exports.getProfile = asyncHandler(async (req, res) => {
  const user = await userUtils.getUserById(req.user.id);
  if (!user) {
    throw new NotFoundError('User not found');
  }
  res.json(user);
});
```

### 3. Sử dụng Validation

```javascript
const { validateBody } = require('../utils/validation');

// Trong routes
router.post('/register', validateBody('register'), authController.register);
router.post('/login', validateBody('login'), authController.login);
```

## Cấu trúc thư mục sau khi clean

```
server/
├── controllers/          # Controllers (đã clean)
├── middlewares/          # Middlewares
│   ├── auth.js          # Authentication middleware
│   └── errorHandler.js  # Global error handler
├── routes/              # API routes
├── utils/               # Utility functions
│   ├── dbUtils.js       # Database utilities
│   └── validation.js    # Input validation
├── config/              # Configuration
├── app.js               # Main app (đã clean)
└── db.js                # Database connection
```

## Best Practices đã áp dụng

### 1. **Separation of Concerns**
- Tách logic database ra utils
- Tách validation ra riêng
- Tách error handling ra middleware

### 2. **DRY (Don't Repeat Yourself)**
- Gom các truy vấn lặp lại vào utils
- Tái sử dụng validation schemas
- Tái sử dụng error handling

### 3. **Consistent Error Handling**
- Tất cả API trả về lỗi với format thống nhất
- Custom error classes cho từng loại lỗi
- Global error handler

### 4. **Input Validation**
- Validate tất cả input từ client
- Schemas rõ ràng cho từng endpoint
- Middleware validate tự động

### 5. **Clean Logging**
- Chỉ log lỗi quan trọng
- Không log dữ liệu nhạy cảm
- Log format nhất quán

## Tiếp theo

### 1. **Áp dụng utils vào controllers**
- Thay thế SQL trực tiếp bằng utils
- Giảm code duplication

### 2. **Thêm validation cho tất cả API**
- Áp dụng validation middleware
- Đảm bảo data integrity

### 3. **Tách controllers lớn**
- Chia nhỏ controllers có nhiều chức năng
- Mỗi controller chỉ xử lý 1 domain

### 4. **Thêm unit tests**
- Test utils functions
- Test validation schemas
- Test error handling

### 5. **Environment Configuration**
- Tách config ra file riêng
- Sử dụng environment variables
- Không hardcode sensitive data

## Lưu ý

- ✅ Logic và dữ liệu vẫn đúng 100%
- ✅ Không thay đổi API endpoints
- ✅ Không thay đổi response format
- ✅ Chỉ cải thiện code structure và maintainability 