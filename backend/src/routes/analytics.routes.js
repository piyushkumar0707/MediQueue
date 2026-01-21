import express from 'express';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/', protect, authorize('admin', 'doctor'), (req, res) => {
  res.json({ message: 'Analytics routes' });
});

export default router;
