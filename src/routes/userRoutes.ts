import express from 'express';
import userController from '../controllers/userController';
import authController from '../controllers/authController';

const router = express.Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.route('/').get(authController.protect, userController.getAllUsers);
router.route('/:id').get(userController.getUser);

export default router;
