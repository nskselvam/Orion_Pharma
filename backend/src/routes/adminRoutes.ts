import express from 'express';
import { authenticate, authorize } from '../middleware/auth';
import {
  getAllUserData,
  createUserData,
  deleteUserData,
  getAllUserRollData,
  createNavbarItem,
  updateNavbarItem,
  deleteNavbarItem,
  getAllRollMasters,
  createRollMaster,
  updateRollMaster,
  deleteRollMaster
} from '../controllers/adminController';

const router = express.Router();

// Apply authentication middleware to all admin routes
router.use(authenticate);

// User management routes - Admin only
router.get('/all_user_data', authorize('admin'), getAllUserData);
router.post('/create_user_data', authorize('admin'), createUserData);
router.delete('/delete_user_data', authorize('admin'), deleteUserData);

// Navbar management routes - Admin only
router.post('/get_all_user_roll_data', authorize('admin'), getAllUserRollData);
router.post('/create_navbar_item', authorize('admin'), createNavbarItem);
router.post('/update_navbar_item', authorize('admin'), updateNavbarItem);
router.post('/delete_navbar_item', authorize('admin'), deleteNavbarItem);

// Roll master routes - Admin only
router.post('/get_all_roll_masters', authorize('admin'), getAllRollMasters);
router.post('/create_roll_master', authorize('admin'), createRollMaster);
router.post('/update_roll_master', authorize('admin'), updateRollMaster);
router.post('/delete_roll_master', authorize('admin'), deleteRollMaster);

export default router;
