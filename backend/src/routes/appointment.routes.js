import express from 'express';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Placeholder routes
router.get('/', protect, (req, res) => {
  res.json({ message: 'Appointment routes' });
});

export default router;
