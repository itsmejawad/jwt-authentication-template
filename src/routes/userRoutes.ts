import express from 'express';

import userController from '../controllers/userController';
import authController from '../controllers/authController';

const router = express.Router();

// Auth Controllers
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/forgot-password', authController.forgotPassword);
router.patch('/reset-password/:token', authController.resetPassword);

// Protect all future routes to only logged in users
router.use(authController.protect);

router.patch('/update-password', authController.updatePassword);
router.patch('/update-me', userController.updateMe);
router.delete('/delete-me', userController.deleteMe);

// Protect all future routes to only admin access
router.use(authController.restrictTo('Admin'));

// User Controllers
router.route('/').get(userController.getAllUsers).post(userController.createUser);
router
  .route('/:id')
  .get(userController.getUser)
  .delete(userController.deleteUser)
  .patch(userController.updateUser);

export default router;
