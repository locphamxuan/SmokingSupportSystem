const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const messageRoutes = require('./routes/messageRoutes');
const adminRoutes = require('./routes/adminRoutes');
const userRoutes = require('./routes/userRoutes');
require('dotenv').config();
const { connectDB } = require('./db');
const coachRoutes = require('./routes/coachRoutes');
const bookingController = require('./controllers/bookingController');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const swaggerDocument = YAML.load('./swagger.yaml');
const jwt = require('jsonwebtoken');
const { sql } = require('./db');
const messageController = require('./controllers/messageController');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*", // hoặc chỉ định domain FE
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Connect to database
connectDB();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
console.log('Setting up /api/bookings route...');
app.use('/api/booking', bookingRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/hlv', coachRoutes);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working!', timestamp: new Date().toISOString() });
});

app.get('/api/test-user/:id', async (req, res) => {
  try {
    const { sql } = require('./db');
    const userId = req.params.id;
    
    const result = await sql.query`
      SELECT Id, Username, cigarettesPerDay, costPerPack, smokingFrequency, healthStatus, cigaretteType, 
             dailyCigarettes, dailyFeeling
      FROM Users WHERE Id = ${userId}
    `;
    
    res.json({ 
      message: 'Direct DB query test',
      userId: userId,
      found: result.recordset.length > 0,
      data: result.recordset[0] || null
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Lưu socketId theo userId để gửi tin nhắn đúng người
const userSocketMap = new Map();

// Xử lý socket.io
io.on('connection', (socket) => {
  // Lấy userId từ token JWT FE truyền lên
  let userId = null;
  try {
    const token = socket.handshake.query.token;
    console.log('[Socket.io] Token nhận được:', token);
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('[Socket.io] Token decode:', decoded);
      userId = decoded.userId || decoded.id; // Đảm bảo lấy đúng field
      userSocketMap.set(userId, socket.id);
    }
  } catch (err) {
    console.error('[Socket.io] Lỗi xác thực JWT:', err);
    socket.emit('error', 'Xác thực thất bại!');
    socket.disconnect();
    return;
  }

  // Khi user join phòng chat với coach/member
  socket.on('joinChat', async ({ userId: clientUserId, coachId }) => {
    // Bảo vệ quyền truy cập như REST API
    if (userId !== clientUserId) {
      socket.emit('error', 'Không hợp lệ!');
      return;
    }
    // Lấy lịch sử tin nhắn
    const messages = await messageController.getMessagesSocket(userId, coachId);
    socket.emit('messageHistory', messages);
  });

  // Khi user gửi tin nhắn
  socket.on('sendMessage', async (msg) => {
    // msg: {senderId, receiverId, content}
    if (userId !== msg.senderId) {
      socket.emit('error', 'Không hợp lệ!');
      return;
    }
    const result = await messageController.sendMessageSocket(msg.senderId, msg.receiverId, msg.content);
    if (result.error) {
      socket.emit('error', result.error);
      return;
    }
    // Gửi cho cả 2 phía nếu đang online
    [msg.senderId, msg.receiverId].forEach(id => {
      const sid = userSocketMap.get(Number(id));
      if (sid) io.to(sid).emit('newMessage', result.message);
    });
  });

  socket.on('disconnect', () => {
    if (userId) userSocketMap.delete(userId);
  });
});

server.listen(5000, () => {
  console.log('Server is running on port 5000');
}); 