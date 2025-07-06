import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoute.js';
import adminRoutes from './routes/adminRoute.js';
import { errorHandler } from './utils/errorHandler.js';
import businessRoutes from './routes/businessRoute.js';
import userRoutes from './routes/userRoute.js';
import superAdminRoute from './routes/superAdminRoute.js';
import plansRoute from './routes/plansRoute.js';
import reviewRoute from './routes/reviewRoute.js';
import permissionRoute from './routes/permissionRoute.js';
import roleRoute from './routes/roleRoute.js';
import path from 'path';
import requestIp from 'request-ip';
import salesRoute from './routes/salesRoute.js';
import eventRoutes from './routes/eventRoute.js';
import visitRoutes from './routes/visitRoutes.js';
import leadsRoute from './routes/leadsRoute.js'; // Import leads route
import notificationRoutes from './routes/notificationRoute.js';
import './cronJobs/leadReminderJob.js';
import cors from 'cors';

dotenv.config();
const app = express();

// Database connection
connectDB();
app.use(requestIp.mw());


// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
// startLeadReminderCron(); // ✅ This starts the cron job at 9:00 AM daily
// CORS
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  exposedHeaders: ['Content-Type']
}));

// ✅ Create HTTP server and bind to Express
const httpServer = http.createServer(app);

// 🔌 Setup Socket.IO server
const io = new Server(httpServer, {
  cors: {
    origin: '*', // Adjust as needed for frontend domain
    methods: ['GET', 'POST']
  }
});

// ✅ Global user socket map
const onlineUsers = new Map();

// 🎯 Socket.IO connection
io.on('connection', (socket) => {
  console.log('✅ Socket connected:', socket.id);

  // Receive and register userId from frontend
  socket.on('register', (userId) => {
    onlineUsers.set(userId.toString(), socket.id); // 🔄 Ensure .toString()
  console.log(`🟢 User registered: ${userId} -> ${socket.id}`);
  console.log('✅ Current Online Users Map:', Array.from(onlineUsers.entries()));
  });

  // Clean up on disconnect
  socket.on('disconnect', () => {
    for (const [userId, sockId] of onlineUsers.entries()) {
      if (sockId === socket.id) {
        onlineUsers.delete(userId);
        console.log(`🔴 User disconnected: ${userId}`);
        break;
      }
    }
  });
});
import { initNotificationSystem } from './utils/sendNotification.js';
initNotificationSystem(io, onlineUsers);

// Make io and onlineUsers accessible globally
export { io, onlineUsers };







// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/business', businessRoutes);
app.use('/api/user', userRoutes);
app.use('/api/superadmin', superAdminRoute);
app.use('/api/plan', plansRoute);
app.use('/api/reviews', reviewRoute);
app.use('/api/sales', salesRoute); // Sales route for sales dashboard and referral link
app.use('/api/permissions', permissionRoute);
app.use('/api/roles', roleRoute);
app.use('/api/events', eventRoutes);
app.use('/api/visit', visitRoutes);
app.use('/api/leads', leadsRoute); // Leads management route
app.use('/api/notifications', notificationRoutes);


// app.get("/api/test-notification", (req, res) => {
//   const userId = "68612341c102a6966e31e5cf"; // Replace with a valid user ID from your DB

//   const payload = {
//     title: "🧪 Test Notification",
//     message: "You received this in real-time!",
//     time: new Date().toLocaleTimeString(),
//     read: false,
//     type: "system",
//     id: Math.random(),
//   };

//   if (global.sendNotificationToUser) {
//     global.sendNotificationToUser(userId, payload);
//     return res.send("✅ Test notification sent!");
//   } else {
//     return res.status(500).send("❌ Notification system not initialized.");
//   }
// });




// ✅ Serve static files from 'uploads' folder
app.use('/uploads', express.static(path.join(path.resolve(), 'uploads')));
// Error handling
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

// Handle unhandled promise rejections global error handler
process.on('unhandledRejection', (err) => {
  console.error(`Error: ${err.message}`);
  httpServer.close(() => process.exit(1));
});