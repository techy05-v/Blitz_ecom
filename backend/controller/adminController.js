const User = require('../model/userModel.js');
const Admin=require("../model/adminModel.js")
const RefreshToken=require("../model/refreshTokenModel.js")
const bcrypt = require('bcrypt');
const { comparePassword } = require('../utils/passwordUtils.js');
const { generateAccessToken, generateRefreshToken } = require('../utils/JWT/generateToken.js');
const storeToken = require('../utils/JWT/storeCookie.js');


const fetchUserDetails = async (req, res) => {
  try {
    console.log("Fetching users...");
    // Changed query to match the schema field name
    const users = await User.find({}, '-password -refreshToken');
    
    if (!users || users.length === 0) {
      console.log("No users found.");
      return res.status(404).json({ message: 'No users found' });
    }

    console.log("Fetched users:", users);
    res.status(200).json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Error fetching users' });
  }
};

// const adminSignIn = async (req, res) => {
// 	console.log(req.body)
// 	const { email, password } = req.body;
	
// 	try {
// 		const admin = await Admin.findOne({
// 			email,
// 		});
//     console.log(admin)
// 		if (!admin) {
// 			return res.status(400).json({ message: "Account not found" });
// 		}

// 		const isMatch = await comparePassword(password, admin?.password);

// 		if (!isMatch) {
// 			return res.status(400).json({ message: "Incorrect Password" });
// 		}
// 		const adminDataToGenerateToken = {
// 			_id: admin?._id,
// 			email: admin?.email,
// 			role: "admin",
// 		};

// 		const accessToken = generateAccessToken(
// 			"admin",
// 			adminDataToGenerateToken
// 		);
// 		const refreshToken = generateRefreshToken(
// 			"admin",
// 			adminDataToGenerateToken
// 		);
// 		// console.log(accessToken,"fffe", refreshToken);

// 		const newRefreshToken = new RefreshToken({
// 			token: refreshToken,
// 			user: adminDataToGenerateToken?.role,
// 			user_id: adminDataToGenerateToken?._id,
// 			expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
// 		});
// 		const savedToken = await newRefreshToken.save();

// 		const { password: _, ...adminDetails } = admin.toObject();

// 		if (savedToken) {
// 			storeToken(
// 				"adminRefreshToken",
// 				refreshToken,
// 				7 * 24 * 60 * 60 * 1000,
// 				res
// 			);

// 			res.status(200).json({
// 				message: "Admin logged in successfully",
// 				adminData: adminDetails,
// 				success: true,
// 				accessToken,
// 				role: "admin",
// 			});
// 		}
// 	} catch (error) {
// 		console.log("Admin Sign In Error: ", error);
// 		res.status(500).json({ message: "Internal server error" });
// 	}
// };

const adminLogout = (req, res) => {
  try {
    // Clear the cookies where the tokens are stored
    res.clearCookie('adminRefreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Strict',
    });

    res.clearCookie('admin_access_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Strict',
    });

    return res.status(200).json({ message: 'Admin logged out successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Error logging out', error: error.message });
  }
};
 
const getUseryId = async(req,res)=>{
  try {
    const user = await User.findById(req.params.userId, '-password -refreshToken');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user details' });
  }
}

const toggleUserBlock = async (req, res) => {
  try {
    // Log the userId and requested block status
    console.log(`Toggling block status for user ID: ${req.params.userId}`);
    console.log(`Requested block status: ${req.body.isBlocked}`);

    // Find the user by ID
    const user = await User.findById(req.params.userId);
    
    if (!user) {
      console.log(`User not found with ID: ${req.params.userId}`);
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Update the block status based on the request body
    user.isBlocked = req.body.isBlocked;
    await user.save();

    // Log success
    console.log(`User ${req.params.userId} ${user.isBlocked ? 'blocked' : 'unblocked'} successfully`);

    // Send success response
    res.status(200).json({ 
      message: `User ${user.isBlocked ? 'blocked' : 'unblocked'} successfully`,
      user
    });

  } catch (error) {
    console.error("Error updating user block status:", error);
    res.status(500).json({ message: 'Error updating user block status' });
  }
};


module.exports={
  fetchUserDetails,
  adminLogout,
  getUseryId,
  toggleUserBlock
}