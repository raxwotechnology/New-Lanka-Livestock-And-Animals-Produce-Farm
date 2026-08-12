import express from 'express';
import { 
    createEditRequest, 
    getMyEditRequests, 
    getAllEditRequests, 
    approveEditRequest, 
    rejectEditRequest 
} from '../controllers/editRequestController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { requirePermission } from '../middleware/permissionMiddleware.js';

const router = express.Router();

// Routes for managers to create and view their requests
router.post('/', protect, createEditRequest);
router.get('/my', protect, getMyEditRequests);

// Routes for admin to manage requests
// Since this is a new global feature, we use admin.users.manage as a proxy for admin rights
// or we can just authorize('admin', 'superadmin')
router.get('/', protect, authorize('admin', 'superadmin', 'md'), getAllEditRequests);
router.put('/:id/approve', protect, authorize('admin', 'superadmin', 'md'), approveEditRequest);
router.put('/:id/reject', protect, authorize('admin', 'superadmin', 'md'), rejectEditRequest);

export default router;
