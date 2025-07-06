import asyncHandler from '../utils/asyncHandler.js';
import User from '../models/user.js';
import Business from '../models/Business.js';


// @desc    Get dashboard statistics
// @route   GET /api/admin/dashboard
// @access  SuperAdmin
export const getDashboardStats = asyncHandler(async (req, res) => {
  const stats = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ isVerified: true }),
    Business.countDocuments(),
    Business.countDocuments({ isApproved: false }),
    User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      }
    ])
  ]);

  res.json({
    totalUsers: stats[0],
    verifiedUsers: stats[1],
    totalBusinesss: stats[2],
    pendingBusinesss: stats[3],
    userRoles: stats[4]
  });
});

// @desc    Approve/reject business Businesss
// @route   PUT /api/admin/Businesss/:id
// @access  Admin/SuperAdmin
export const moderateBusiness = asyncHandler(async (req, res) => {
  const { action } = req.body; // 'approve' or 'reject'
  const Business = await Business.findById(req.params.id);

  if (!Business) {
    res.status(404);
    throw new Error('Business not found');
  }

  if (action === 'approve') {
    Business.isApproved = true;
    await Business.save();
    res.json({ message: 'Business approved successfully' });
  } else if (action === 'reject') {
    await Business.deleteOne();
    res.json({ message: 'Business rejected and removed' });
  } else {
    res.status(400);
    throw new Error('Invalid action');
  }
});

// @desc    Get all pending Businesss
// @route   GET /api/admin/Businesss/pending
// @access  Admin/SuperAdmin
export const getPendingBusinesss = asyncHandler(async (req, res) => {
  const Businesss = await Business.find({ isApproved: false })
    .populate('owner', 'email profile.name');

  res.json(Businesss);
});

// @desc    Manage user roles
// @route   PUT /api/admin/users/:id/role
// @access  SuperAdmin
export const updateUserRole = asyncHandler(async (req, res) => {
  const { role } = req.body;
  const user = await User.findById(req.params.id);

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  // Prevent role escalation
  if (req.user.role !== 'superadmin' && ['admin', 'superadmin'].includes(role)) {
    res.status(403);
    throw new Error('Not authorized to assign this role');
  }

  user.role = role;
  await user.save();

  res.json({
    _id: user._id,
    email: user.email,
    role: user.role
  });
});

// @desc    Verify business accounts
// @route   PUT /api/admin/business/:id/verify
// @access  Admin/SuperAdmin
export const verifyBusiness = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { 
      isVerified: true,
      $set: { 'profile.isVerified': true } 
    },
    { new: true }
  ).select('-password');

  if (!user || user.role !== 'business') {
    res.status(404);
    throw new Error('Business user not found');
  }

  res.json(user);
});