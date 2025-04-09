const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
require('dotenv').config();

const categoryRoutes = require('./routes/categoryRoutes');
const productRoutes = require('./routes/productRoutes');
const authRoutes = require('./routes/authRoutes');
const cartRoutes = require('./routes/cartRoutes');
const orderRoutes = require('./routes/orderRoutes');
const walletRoutes = require('./routes/walletRoutes');
const wishlistRoutes = require('./routes/wishlistRoutes');
const couponRoutes = require('./routes/couponRoutes');
const path = require('path');

const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"]
    }
});

// Middleware
app.use(bodyParser.json());
const cors = require('cors');
app.use(cors()); // Cho phép tất cả các origin

// Middleware phục vụ file tĩnh
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/wallet', walletRoutes); // Add route for wallet
app.use('/api/wishlist', wishlistRoutes); // Add route for wishlist
app.use('/api/coupons', couponRoutes); // Add route for coupons

// Review routes
app.use('/api/reviews', require('./routes/reviewRoutes'));

// Lưu trữ instance của Socket.IO
app.set('socketio', io);

// Lưu trữ chat messages và user connections
const chatMessages = {};  // Lưu lịch sử chat theo userId
const activeUsers = {};   // Lưu thông tin người dùng đang kết nối
const customerServiceAgents = {}; // Lưu thông tin nhân viên CSKH đang kết nối

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // Xử lý đăng ký kết nối
    socket.on('register', (userData) => {
        const { userId, username, role } = userData;

        if (role === 'customer_service') {
            customerServiceAgents[socket.id] = { socketId: socket.id, userId, username, socket };
            console.log(`Customer service agent registered: ${username} (${socket.id})`);
            
            // Gửi danh sách người dùng đang active và lịch sử chat cho tất cả userId
            socket.emit('active_users', Object.values(activeUsers));
            
            // Tạo map của userIds và socketIds để giúp tra cứu
            const userSocketMap = {};
            Object.keys(activeUsers).forEach(socketId => {
                const user = activeUsers[socketId];
                userSocketMap[user.userId] = socketId;
            });
            
            // Gửi thông tin map này cho nhân viên để họ có thể truy xuất lịch sử chat
            socket.emit('user_socket_map', userSocketMap);
            
            // Remove the Appointment-related code below
            // Previously there was code checking for pending appointments:
            // Appointment.countDocuments({ status: 'pending' })
            //     .then(count => {
            //         if (count > 0) {
            //             socket.emit('pending_appointments', { count });
            //         }
            //     })
            //     .catch(err => console.error('Error counting pending appointments:', err));
        } else {
            activeUsers[socket.id] = { socketId: socket.id, userId, username };
            if (!chatMessages[userId]) {
                chatMessages[userId] = [];
            }
            socket.emit('chat_history', chatMessages[userId]); // Gửi lịch sử chat cho người dùng
            Object.values(customerServiceAgents).forEach(agent => {
                agent.socket.emit('user_connected', { socketId: socket.id, userId, username });
            });
        }
    });

    // Xử lý tin nhắn chat
    socket.on('chat_message', (messageData) => {
        const { from, to, message, role } = messageData;
        const timestamp = new Date().toISOString();
        const msgObj = { from, message, timestamp, role };

        if (role === 'customer_service') {
            const userSocket = to;
            const user = activeUsers[userSocket];
            if (user) {
                if (!chatMessages[user.userId]) {
                    chatMessages[user.userId] = [];
                }
                chatMessages[user.userId].push(msgObj);
                io.to(userSocket).emit('chat_message', msgObj);
                socket.emit('chat_message', msgObj);
            }
        } else {
            const userId = from;
            if (!chatMessages[userId]) {
                chatMessages[userId] = [];
            }
            chatMessages[userId].push(msgObj);
            Object.values(customerServiceAgents).forEach(agent => {
                agent.socket.emit('chat_message', { ...msgObj, userSocketId: socket.id });
            });
            socket.emit('chat_message', msgObj);
        }
    });

    // Xử lý nhân viên CSKH chọn người dùng để chat
    socket.on('select_user', (userSocketId) => {
        const user = activeUsers[userSocketId];
        if (user && chatMessages[user.userId]) {
            socket.emit('chat_history', chatMessages[user.userId]); // Gửi lịch sử chat của người dùng
        } else {
            socket.emit('chat_history', []); // Gửi lịch sử trống nếu không có
        }
    });

    // Xử lý ngắt kết nối
    socket.on('disconnect', () => {
        if (customerServiceAgents[socket.id]) {
            delete customerServiceAgents[socket.id];
        }
        if (activeUsers[socket.id]) {
            const user = activeUsers[socket.id];
            Object.values(customerServiceAgents).forEach(agent => {
                agent.socket.emit('user_disconnected', socket.id);
            });
            delete activeUsers[socket.id];
        }
    });
});

// Kết nối MongoDB
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(() => {
        console.log('MongoDB connected successfully!');
    })
    .catch((err) => console.error('MongoDB connection error:', err));

// Khởi động server
const PORT = process.env.PORT || 5000;
http.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log(`Socket.IO server is running`);
});