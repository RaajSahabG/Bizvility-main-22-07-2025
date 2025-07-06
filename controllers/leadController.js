// controllers/leadController.js
import asyncHandler from '../utils/asyncHandler.js';
import Lead from '../models/Leads.js';

// ✅ Create a new lead
// ✅ Create a new lead
export const createLead = asyncHandler(async (req, res) => {
  const { name, contact, businessType, notes } = req.body;

  // ⏰ Set followUpDate to 2 minutes from now
  const followUpDate = new Date(Date.now() + 2 * 60 * 1000);

  const lead = await Lead.create({
    name,
    contact,
    businessType,
    followUpDate,
    notes,
    salesUser: req.user._id
  });

  res.status(201).json({ message: 'Lead created successfully', lead });
});






// ✅ Get all leads

// ✅ Get all leads for the logged-in sales user
export const getLeadsForUser = asyncHandler(async (req, res) => {
  const leads = await Lead.find({ salesUser: req.user._id }).sort({ followUpDate: 1 });
  res.status(200).json({ leads });
});




// ✅ Update a lead
export const updateLead = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, contact, businessType, status, followUpDate, notes } = req.body;

  const lead = await Lead.findOneAndUpdate(
    { _id: id, salesUser: req.user._id },
    { name, contact, businessType, status, followUpDate, notes },
    { new: true }
  );

  if (!lead) {
    res.status(404);
    throw new Error('Lead not found or unauthorized');
  }

  res.status(200).json({ message: 'Lead updated', lead });
});

// ✅ Delete a lead
export const deleteLead = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const lead = await Lead.findOneAndDelete({ _id: id, salesUser: req.user._id });

  if (!lead) {
    res.status(404);
    throw new Error('Lead not found or unauthorized');
  }

  res.status(200).json({ message: 'Lead deleted successfully' });
});

// GET /api/leads/stats
export const getLeadStats = asyncHandler(async (req, res) => {
  const total = await Lead.countDocuments();
  const byStatus = await Lead.aggregate([
    { $group: { _id: "$status", count: { $sum: 1 } } }
  ]);

  res.json({
    total,
    statusCounts: byStatus.reduce((acc, cur) => {
      acc[cur._id] = cur.count;
      return acc;
    }, {})
  });
});

//assign a lead to a sales user
export const assignLead = asyncHandler(async (req, res) => {
  const { leadId } = req.params;
  const { salesUserId } = req.body;

  // Validate user is sales
  const salesUser = await User.findById(salesUserId);
  if (!salesUser || salesUser.role !== 'sales') {
    return res.status(400).json({ message: 'Invalid sales user' });
  }

  const lead = await Lead.findById(leadId);
  if (!lead) return res.status(404).json({ message: 'Lead not found' });

  lead.salesUser = salesUserId;
  await lead.save();

  res.status(200).json({ message: 'Lead assigned successfully', lead });
});

