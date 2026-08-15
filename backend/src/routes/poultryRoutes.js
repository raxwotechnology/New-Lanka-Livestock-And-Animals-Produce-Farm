import express from 'express';
import { createBatch, getBatches, createDailyLog, getDailyLogs, updateDailyLog, deleteDailyLog, getBatchAnalytics, getBatchById, getTransactions, createTransaction, updateTransaction, deleteTransaction, getSummary, deleteBatch, updateBatch } from '../controllers/poultryController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply auth middleware if your app uses it.
router.use(protect);

router.get('/summary', getSummary);

router.post('/batches', createBatch);
router.get('/batches', getBatches);
router.get('/batches/:id', getBatchById);
router.put('/batches/:id', updateBatch);
router.delete('/batches/:id', deleteBatch);

router.post('/logs', createDailyLog);
router.get('/logs', getDailyLogs);
router.put('/logs/:id', updateDailyLog);
router.delete('/logs/:id', deleteDailyLog);
router.get('/analytics/:batchId', getBatchAnalytics);

router.get('/transactions', getTransactions);
router.get('/transactions/:batchId', getTransactions);
router.post('/transactions', createTransaction);
router.put('/transactions/:id', updateTransaction);
router.delete('/transactions/:id', deleteTransaction);

export default router;

