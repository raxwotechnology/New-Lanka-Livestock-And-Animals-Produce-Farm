import express from 'express';
import * as controller from '../controllers/piggeryController.js';
import { protect } from '../middleware/authMiddleware.js';
import { requirePermission } from '../middleware/permissionMiddleware.js';

const router = express.Router();

router.use(protect); // Ensure user is logged in

// Batches
router.route('/batches')
    .get(controller.getBatches)
    .post(controller.createBatch);

router.route('/batches/:id')
    .get(controller.getBatchById)
    .put(controller.updateBatch)
    .delete(controller.deleteBatch);

// Analytics
router.get('/analytics/:batchId', requirePermission('production.view'), controller.getBatchAnalytics);

// Mortalities
router.route('/mortalities')
    .get(controller.getMortalities)
    .post(controller.createMortality);

// Breeding
router.route('/breeding')
    .get(controller.getBreedingRecords)
    .post(controller.createBreedingRecord);

router.route('/breeding/:id')
    .put(controller.updateBreedingRecord)
    .delete(controller.deleteBreedingRecord);

// Finances (Expenses & Incomes)
router.route('/expenses')
    .get(controller.getExpenses)
    .post(controller.createExpense);

router.route('/expenses/:id')
    .put(controller.updateExpense)
    .delete(controller.deleteExpense);

router.route('/incomes')
    .get(controller.getIncomes)
    .post(controller.createIncome);

router.route('/incomes/:id')
    .put(controller.updateIncome)
    .delete(controller.deleteIncome);

// Summary
router.get('/summary', controller.getSummary);

// Transactions
router.route('/transactions')
    .post(controller.createBatchTransaction);

router.route('/transactions/:id')
    .get(controller.getBatchTransactions)
    .put(controller.updateBatchTransaction)
    .delete(controller.deleteBatchTransaction);

export default router;
