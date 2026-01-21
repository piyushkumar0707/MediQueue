import express from 'express';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Placeholder - will implement controllers later
router.get('/', protect, (req, res) => {
  res.json({ message: 'User routes' });
});

export default router;
