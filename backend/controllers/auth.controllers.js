import mongoose from "mongoose";
import User from "../models/user.model.js";
import bcrypt from 'bcryptjs';
import { generateTokenAndSetCookie } from "../lib/utils/generateToken.js";



export const signup = async (req, res) => {
    const {fullName, username, password, email} = req.body;
    
    try{
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)){
            return res.status(400).json({error: "invalid email format"})
        }

        const existingUser = await User.findOne({username});
            if (existingUser){
            return res.status(400).json({error: 'username is already taken'});
        }

        const existingEmail = await User.findOne({email});
        if (existingEmail){
            return res.status(400).json({error: 'email is already taken'});
        }

        if (password.length < 6) {
            return res.status(400).json({error: 'password must be atleast 6 characters long'})
        }

        // hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        const newUser = new User({
            username,
            fullName,
            email,
            password: hashedPassword
        });

        if (newUser){
            generateTokenAndSetCookie(newUser._id, res);
            await newUser.save();

            res.status(201).json({
                _id: newUser._id,
                fullName: newUser.fullName,
                email: newUser.email,
                followers: newUser.followers,
                following: newUser.following,
                profileImg: newUser.profileImg,
                coverImg: newUser.coverImg
            })
        } else {
            res.status(400).json({error: "invalid user data"})
        }
    } catch(error){
        console.error(`Error in signUp controller: ${error.message}`);
        res.status(500).json({error: "Internal server error"});
    }
    
}


export const login = async (req, res) => {
    try{
        const {username, password} = req.body;
        
        const user = await User.findOne({username});
        const isPasswordValid = await bcrypt.compare(password, user?.password || "");
        
        if (!user || !isPasswordValid){
            return res.status(400).json({error: "invalid username or password"});
        }

        generateTokenAndSetCookie(user._id, res);

        res.status(200).json({
            _id: user._id,
            username: user.username,
            fullName: user.fullName,
            email: user.email,
            followers: user.followers,
            following: user.following,
            profileImg: user.profileImg,
            coverImg: user.coverImg
        });


    } catch(error){
        console.error(`Error in login controller: ${error.message}`);
        res.status(500).json({error: "Internal Server Error"})
    }
}


export const logout = async (req, res) => {
    try{
        res.cookie("jwt", "", {maxAge: 0});
        res.status(200).json({message: 'logout successfully'});
    } catch(error){
        console.error(`Error in logout controller: ${error.message}`);
        res.status(500).json({error: 'Internal server error'});
    }
}


export const getMe = async(req, res) => {
    try{
        const user = await User.findById(req.user._id).select("-password");
        res.status(200).json(user);
    } catch(error){
        console.error(`Error in getMe controller: ${error.message}`);
        res.status(500).json({error: 'internal server error'});
    }
}