import express from 'express';
import { protect } from '../middlewares/auth.js';
import roles from '../middlewares/roles.js';
import { getDashboardStats } from '../controllers/adminController.js';

const router = express.Router();

// SUPERADMIN ONLY ROUTE
router.get(
  '/dashboard',
  protect,
  roles('superadmin'),
  getDashboardStats
);

export default router;