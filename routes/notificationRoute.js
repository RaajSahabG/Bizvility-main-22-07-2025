// routes/notificationRoutes.js
import express from 'express';
import { getNotifications } from '../controllers/notificationController.js';
import { protect } from '../middlewares/auth.js';

const router = express.Router();

router.get('/', protect, getNotifications);

export default router;
