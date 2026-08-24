


import express from 'express';
import { protectRoute } from '../middlewares/protectRoute.js';
import { getUserProfile, followUnfollowUser, getAllUsers, getAllNotications, getSuggestedUsers, updateUser } from '../controllers/user.controllers.js';

const router = express.Router();

router.get('/notifications', getAllNotications);
router.get('/', getAllUsers);
router.get('/profile/:username', protectRoute, getUserProfile);
router.get('/suggested', protectRoute, getSuggestedUsers);
router.post('/follow/:id', protectRoute, followUnfollowUser);
router.post('/update', protectRoute, updateUser);


export default router;