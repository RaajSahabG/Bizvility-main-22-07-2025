// utils/sendNotification.js

import Notification from '../models/Notification.js';
import User from '../models/user.js';

let io = null;
let onlineUsers = null;

// 🔌 Inject io and onlineUsers during app start (called from server.js)
export const initNotificationSystem = (_io, _onlineUsers) => {
  io = _io;
  onlineUsers = _onlineUsers;

  // 🟢 Optional: Register global sender when initialized
  global.sendNotificationToUser = (userId, payload) => {
    console.log(userId, socketId, payload);
    if (!io || !onlineUsers) {
      console.warn('⚠️ Socket system not initialized properly');
      return;
    }

    const socketId = onlineUsers.get(userId.toString());
    if (socketId) {
      console.log(`📤 (Global) Emitting to ${socketId} ->`, payload);
      io.to(socketId).emit('new_notification', payload);
    } else {
      console.log(`📭 (Global) User ${userId} not online`);
    }
  };
};

/**
 * 🔔 Notify specific user (DB + real-time if online)
 */
export const notifyUser = async ({ userId, type, title, message, data = {} }) => {
  try {
    const user = await User.findById(userId).select('role');
    if (!user) {
      console.warn(`⚠️ User not found: ${userId}`);
      return null;
    }

    const notification = await Notification.create({
      user: userId,
      role: user.role,
      type,
      title,
      message,
      data,
    });

    const payload = {
      _id: notification._id,
      type,
      title,
      message,
      data,
      createdAt: notification.createdAt,
      read: notification.read || false,
    };

    // ✅ Emit real-time using global function
    if (global.sendNotificationToUser) {
      global.sendNotificationToUser(userId.toString(), payload);
    } else {
      console.warn('⚠️ global.sendNotificationToUser not defined');
    }

    return notification;

  } catch (err) {
    console.error('❌ notifyUser error:', err.message);
    return null;
  }
};


/**
 * 🔔 Notify all users of a specific role
 */
export const notifyRole = async ({ role, type, title, message, data = {} }) => {
  try {
    const existing = await Notification.findOne({ role, type, title, message });
    if (existing) {
      return console.log(`⚠️ Duplicate role notification: ${role}`);
    }

    const notification = await Notification.create({
      user: null,
      role,
      type,
      title,
      message,
      data
    });

    const payload = {
      _id: notification._id,
      type,
      title,
      message,
      data,
      createdAt: notification.createdAt,
      read: false
    };

    // 🔊 Emit to room (if users joined room by role)
    io.to(role).emit('new_notification', payload);

    console.log(`📨 Notified role [${role}]`);
    return notification;

  } catch (err) {
    console.error(`❌ notifyRole error for ${role}:`, err.message);
  }
};
