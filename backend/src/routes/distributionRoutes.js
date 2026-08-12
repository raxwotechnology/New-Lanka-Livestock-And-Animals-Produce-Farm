import express from 'express';
import * as controller from '../controllers/distributionController.js';
import { protect } from '../middleware/authMiddleware.js';
import { requirePermission } from '../middleware/permissionMiddleware.js';

const router = express.Router();

router.use(protect);

// Items
router.route('/items')
    .get(requirePermission('inventory.view'), controller.getItems)
    .post(requirePermission('inventory.manage'), controller.createItem);

router.route('/items/:id')
    .get(requirePermission('inventory.view'), controller.getItemById)
    .put(requirePermission('inventory.manage'), controller.updateItem)
    .delete(requirePermission('inventory.manage'), controller.deleteItem);

router.post('/items/:id/attachments', requirePermission('inventory.manage'), controller.uploadItemAttachment);
router.delete('/items/:id/attachments/:attachmentId', requirePermission('inventory.manage'), controller.deleteItemAttachment);

// Bills (Sales and Purchases)
router.route('/bills')
    .get(requirePermission('sales.view'), controller.getBills)
    .post(requirePermission('bills.manage'), controller.createBill);

router.route('/bills/:id')
    .put(requirePermission('bills.manage'), controller.updateBill)
    .delete(requirePermission('bills.manage'), controller.deleteBill);

// Reports/Summary
router.get('/summary', requirePermission('reports.sales'), controller.getSummary);

export default router;
