const User = require("../model/userModel");
const cloudinary = require("../config/cloudinary");
//const { validateProfileData } = require("../utils/validation");

const createProfile = async (req, res) => {
    try {
        const { email, user_name, phone_number, gender, dob } = req.body;
        // const { error } = validateProfileData(req.body);
        
        if (error) {
            return res.status(400).json({
                success: false,
                error: error.details[0].message
            });
        }

        const existingUser = await User.findOne({ 
            $or: [{ email }, { phone_number }] 
        });
        
        if (existingUser) {
            return res.status(400).json({
                success: false,
                error: "User with this email or phone number already exists"
            });
        }

        const user = new User({
            email,
            user_name,
            phone_number,
            gender,
            dob
        });

        await user.save();
        res.status(201).json({
            success: true,
            user: {
                email: user.email,
                user_name: user.user_name,
                phone_number: user.phone_number,
                gender: user.gender,
                dob: user.dob
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: "Failed to create profile"
        });
    }
};

const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.data._id)
            .select("-password -resetToken -resetTokenExpiry");
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }
        
        res.json({
            success: true,
            user
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch user profile"
        });
    }
};

const updateProfile = async (req, res) => {
    try {
        const { user_name, phone_number, gender, dob,profileImage } = req.body;
        
        if (!req.user || !req.user.data._id) {
            return res.status(401).json({
                success: false,
                message: "Authentication required"
            });
        }

        const updateData = {
            user_name,
            phone_number,
            gender,
            dob,
            profileImage // Include profileImage in updates
        };

        const user = await User.findByIdAndUpdate(
            req.user.data.id,
            { $set: updateData },
            { new: true }
        ).select("-password -resetToken -resetTokenExpiry");

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        res.json({
            success: true,
            user
        });
    } catch (err) {
        console.error('Profile update error:', err);
        res.status(500).json({
            success: false,
            message: "Failed to update user profile"
        });
    }
};

const deleteProfileImage = async (req, res) => {
    try {
        const user = await User.findById(req.user.data._id);
        
        if (!user || !user.profileImage) {
            return res.status(404).json({
                success: false,
                message: "No profile image found"
            });
        }

        const publicId = user.profileImage.split('/').pop().split('.')[0];
        
        try {
            await cloudinary.uploader.destroy(publicId);
        } catch (deleteError) {
            return res.status(500).json({
                success: false,
                message: "Failed to delete image from storage"
            });
        }

        user.profileImage = null;
        await user.save();

        res.json({
            success: true,
            message: 'Profile image deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to delete profile image"
        });
    }
};

module.exports = {
    createProfile,
    getProfile,
    updateProfile,
    deleteProfileImage
};