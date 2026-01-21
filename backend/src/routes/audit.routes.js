import express from 'express';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/', protect, authorize('admin'), (req, res) => {
  res.json({ message: 'Audit routes' });
});

export default router;
