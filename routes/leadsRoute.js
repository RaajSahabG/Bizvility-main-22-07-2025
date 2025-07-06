import express from 'express';
import { protect } from '../middlewares/auth.js';
import  roles  from '../middlewares/roles.js';   // role guard
import {
  createLead,
  getLeadsForUser,
  updateLead,
  deleteLead,
  getLeadStats,
  assignLead   
} from '../controllers/leadController.js';

const router = express.Router();

router.use(protect); // Ensure only logged-in users access

router.post('/', createLead);            // Create a lead
router.get('/', getLeadsForUser);        // Fetch all leads for a user
router.put('/:id', updateLead);          // Update a lead
router.delete('/:id', deleteLead);       // Delete a lead
router.get('/stats', getLeadStats);    // Get lead statistics (if implemented)

router.put('/assign/:leadId', protect, roles('superadmin'), assignLead);

export default router;
