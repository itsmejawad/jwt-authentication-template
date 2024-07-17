import express from 'express';
import userController from '../controllers/userController';
import authController from '../controllers/authController';

const router = express.Router();

// Auth Controllers
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/forgot-password', authController.forgotPassword);
router.patch('/reset-password/:token', authController.resetPassword);
// router.post('/reset-password', authController.login);

// User Controllers
router.route('/').get(authController.protect, userController.getAllUsers);
router
  .route('/:id')
  .get(userController.getUser)
  .delete(authController.protect, authController.restrictTo('admin'), userController.deleteUser);

export default router;
