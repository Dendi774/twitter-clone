

// packages
import bcrypt from "bcryptjs";
import {v2 as cloudinary} from 'cloudinary';

// models
import Notification from "../models/notification.model.js";
import User from "../models/user.model.js";


export const getAllNotications = async (req, res) => {
    try{
        const notifications = await Notification.find({});
        res.status(200).json(notifications);
    } catch(error){
        console.log(`error in getAllNotifications Controller: ${error.message}`);
        res.status(500).json({error: 'internal server error'});
    }
}

export const getAllUsers = async (req, res) => {

    try{
        const users = await User.find({});
        res.status(200).json(users);
    } catch (error){
        console.log(`error in getAllUsers controller: ${error.message}`);
        res.status(500).json({error: 'internal server error'});
    }
    
    
}


export const getUserProfile = async (req, res) => {
    const {username} = req.params;
    
    try {
        const user = await User.findOne({username}).select("-password");
        if (!user){
            return res.status(404).json({error: 'user not found'});
        }
        res.status(200).json(user);
    } catch (error) {
        console.log('error in getUserProfile controller: ', error.message);
        res.status(500).json({error: 'internal server error'});
    }
}

export const followUnfollowUser = async (req, res) => {
    
    try{
        const {id} = req.params;
        const userToModify = await User.findById(id);
        const currentUser = await User.findById(req.user._id);

        if (id === req.user._id.toString()){
            return res.status(400).json({error: 'you cant follow or unfollow yourself'});
        }

        if (!userToModify || !currentUser) {
            return res.status(404).json({error: 'user not found'});
        }

        const isFollowing = currentUser.following.includes(id);
        
        if (isFollowing){
            // unfollow the user
            await User.findByIdAndUpdate(id, {$pull: {followers: req.user._id}});
            await User.findByIdAndUpdate(req.user._id, {$pull: {following: id}});
            res.status(200).json({message: 'user unfollowed successfully'});
        } else{
            // follow the user
            await User.findByIdAndUpdate(id, {$push: {followers: req.user._id}});
            await User.findByIdAndUpdate(req.user._id, {$push: {following: id}});
            // send notification to the user

            const newNotification = new Notification({
                type: "follow",
                from: currentUser._id,
                to: userToModify._id
            })

            await newNotification.save();

            res.status(200).json({message: 'user followed successfully'});
        }
    } catch(error){
        console.log('error in followUnfollowUser controller: ', error.message);
        res.status(500).json({error: 'internal server error'});
    }
}


export const getSuggestedUsers = async (req, res) => {
    try{
        const userId = req.user._id;
        
        const usersFollowedByMe = await User.findById(userId).select("following");

        // gets all the users except the current user
        const users = await User.aggregate([
            {
                $match: {
                    _id: {$ne: userId}
                },
            },
            {$sample: {size: 10}},
        ])

        // filters all the users currently being followed
        const filteredUsers = users.filter(user=>!usersFollowedByMe.following.includes(user._id));
        const suggestedUsers = filteredUsers.slice(0, 4);

        suggestedUsers.forEach((user)=>(user.password=null));

        res.status(200).json(suggestedUsers);
    } catch(error){
        console.log(`error in getSuggestedUsers controller: ${error.message}`);
        res.status(500).json({error: 'internal server error'});
    }
}

export const updateUser = async (req, res) => {
    try{
        const {fullName, email, username, currentPassword, newPassword, bio, link} = req.body;
        let {profileImg, coverImg} = req.body;
        
        const userId = req.user._id;

        let user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({error: 'user not found'});
        }

        if ((!newPassword && currentPassword) || (!currentPassword && newPassword)){
            return res.status(400).json({error: 'please provide both current and new passwords'});
        }

        if (newPassword && currentPassword){
            const isMatch = await bcrypt.compare(currentPassword, user.password);
            if(!isMatch) return res.status(400).json({error: 'current password is incorrect'});
            if(newPassword.length < 6){
                return res.status(400).json({error: 'new passwor must be 6 characters or longer'});
            }

            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(newPassword, salt);
        }

        if (profileImg){
            if (user.profileImg){
                await cloudinary.uploader.destroy(user.profileImg.split("/").pop().split(".")[0]);
            }
            const uploadedResponse = await cloudinary.uploader.upload(profileImg);
            profileImg = uploadedResponse.secure_url;
        }

        if (coverImg){
            if (user.coverImg){
                await cloudinary.uploader.destroy(user.coverImg.split("/").pop().split(".")[0]);
            }
            const uploadedResponse = await cloudinary.uploader.upload(coverImg);
            coverImg = uploadedResponse.secure_url;
        }

        user.fullName = fullName || user.fullName;
        user.email = email || user.email;
        user.username = username || user.username;
        user.bio = bio || user.bio;
        user.link = link || user.link;
        user.profileImg = profileImg || user.profileImg;
        user.coverImg = coverImg || user.coverImg;

        user = await user.save();
        user.password = null;
        return res.status(200).json(user);
        
    } catch(error){
        console.log(`error in updateUser controller: ${error.message}`);
        res.status(500).json({error: 'internal server error'});
    }
}