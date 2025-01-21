const UnverifiedUser = require("../model/unverifiedUserModel")
const Category = require('../model/categorySchema');
const Product = require("../model/productSchema")
const Admin=require("../model/adminModel")
const RefreshToken = require("../model/refreshTokenModel")
const User = require("../model/userModel")
const jwt = require("jsonwebtoken")
const bcrypt= require("bcrypt")
const dotenv= require("dotenv")
const crypto = require("crypto")
const {generateResetToken} = require("../utils/CRYPTO/resetTokens")
const { OAuth2Client } = require("google-auth-library");
dotenv.config();
const { sendOTPEmail, sendPasswordResetEmail } = require("../utils/emailUtils");
const storeToken =require("../utils/JWT/storeCookie")
const {
	generateAccessToken,
	generateRefreshToken,
} = require("../utils/JWT/generateToken");
const {hashPassword,comparePassword } = require("../utils/passwordUtils")
const FRONDEND_URL=process.env.CLIENT_URL
const JWT_SECRET =process.env.JWT_SECRET


const getAllProductsByUser = async (req, res) => {
  try {
    const { sort,search } = req.query;
    let sortOption = {};
    let searchQuery={}

    
    // Fix sort direction
    if (sort === "Low-High") {
      sortOption = { regularPrice: 1 };  // ascending order
    } else if (sort === "High-Low") {
      sortOption = { regularPrice: -1 }; // descending order
    }
    else if(sort==="A-Z"){
        sortOption={productName:1}
    }
    else if(sort==="Z-A"){
      sortOption={productName:-1}
    }
    // handle search

    if(search){
      searchQuery={
          $or:[
            {productName:{$regex:search,$options:"i"}},
            {descriptiion:{$regex:search,$options:"i"}}
          ]
      }
    }

    const finalQuery={
      ...searchQuery,
      isactive:true
    }
    const products = await Product.find(finalQuery)
      .populate({
        path: 'category',
        match: { isactive: true },
        select: 'CategoryName'
      })
      .sort(sortOption);  // Apply the sort

    const activeProducts = products.filter(product => product.category);
    
    res.status(200).json({ 
      message: 'Products fetched successfully', 
      activeProducts 
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching products', error: error.message });
  }
};
const googleAuth = async (req, res) => {
    const { token, role } = req.body;


    if (!token || !role) {
        console.error("Missing token or role in the request");
        return res.status(400).json({ error: "Token and role are required" });
    }

    if (!["user", "admin"].includes(role)) {
        console.error("Invalid role specified:", role);
        return res.status(400).json({ error: "Invalid role specified" });
    }

    try {
        const client = new OAuth2Client({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        });

        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();

        if (!payload.email_verified) {
            console.warn("Unverified email:", payload.email);
            return res.status(401).json({ message: "Email not verified" });
        }

        const { name, email, sub, picture } = payload;

        // rs

        // if (isOtherRoleExists) {
        //     console.warn(`Account role mismatch: ${email} is a ${role === "user" ? "admin" : "user"} account`);
        //     return res.status(401).json({
        //         message: `This account is a ${role === "user" ? "admin" : "user"} account.`,
        //     });
        // }

        let user = await User.findOne({ email });

        if (user && user.isBlocked) {
            console.warn("Blocked user attempted to log in:", email);
            return res.status(401).json({
                message: "Your account has been blocked. Please contact the support team.",
            });
        }

        if (!user) {
            user = new User({
                full_name: name,
                email,
                google_id: sub,
                avatar: picture,
            });
        } else if (!user.google_id) {
            user.google_id = sub;
            if (!user.avatar) {
                user.avatar = picture;
            }
        }

        await user.save();

        const userDataToGenerateToken = {
            _id: user._id,
            email: user.email,
            role,
        };

        const accessToken = generateAccessToken(role, userDataToGenerateToken);
        const refreshToken = generateRefreshToken(role, userDataToGenerateToken);

        const newRefreshToken = new RefreshToken({
            token: refreshToken,
            user: role,
            user_id: user._id,
            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        });

        const savedToken = await newRefreshToken.save();

        const { password, ...userDetails } = user.toObject();

        if (savedToken) {
            storeToken(
                `${role}RefreshToken`,
                refreshToken,
                7 * 24 * 60 * 60 * 1000,
                res
            );

            return res.status(200).json({
                success: true,
                message: `${role.charAt(0).toUpperCase() + role.slice(1)} logged in successfully`,
                userData: userDetails,
                accessToken,
                role,
            });
        }

        res.status(500).json({ message: "Failed to log in" });
    } catch (error) {
        res.status(500).json({
            message: "Internal server error. Please try again.",
        });
    }
};

const getProductById = async (req, res) => {
	try {
	  
	  const id = req.params.id;
	  
	  const product = await Product.findById(id)
		.populate('category', 'CategoryName');
	  
	  
	  if (!product) {
		console.warn(`Product not found for ID: ${id}`);
		return res.status(404).json({ 
		  message: 'Product not found',
		  success: false 
		});
	  }
	  
	  res.status(200).json({ 
		message: 'Product retrieved successfully',
		success: true,
		data: product 
	  });
	} catch (error) {
	  console.error('Error in getProductById:', error);
	  res.status(500).json({ 
		message: 'Error fetching product',
		success: false,
		error: error.message 
	  });
	}
  };
  const getAllCategories = async (req, res) => {
	try {
	  
	  
	  const categories = await Category.find({});
	  
	  
	  if (categories.length === 0) {
		console.warn('No categories found');
	  }
  
	  res.status(200).json(categories);
	} catch (error) {
	  console.error('Get Categories Error:', error);
	  console.error('Error Stack:', error.stack);
  
	  res.status(500).json({ 
		message: 'Error fetching categories', 
		error: error.message 
	  });
	}
  };


const forgotPassword = async (req, res) => {
    const { email } = req.body;
    
    if (!email) {
        return res.status(400).json({ message: "Email is required" });
    }
  
    try {
        // Find the user
        const user = await User.findOne({ email });
        
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Generate reset tokens
        const { resetToken, hashedToken, tokenExpire } = generateResetToken();
        
        // Update user with reset token information
        user.resetToken = hashedToken;
        user.resetTokenExpiry = tokenExpire;
        await user.save();
  
        // Create the reset URL
        const resetURL = `${FRONDEND_URL}/user/reset-password/${resetToken}`;
        
        // Send the password reset email
        await sendPasswordResetEmail(email, resetURL);
  
        return res.status(200).json({ 
            success: true,
            message: "Password reset instructions have been sent to your email" 
        });

    } catch (error) {
        console.error("Forgot Password Error:", error);
        
        // Cleanup token if email sending fails
        try {
            const user = await User.findOne({ email });
            if (user) {
                user.resetToken = undefined;
                user.resetTokenExpiry = undefined;
                await user.save();
            }
        } catch (cleanupError) {
            console.error("Error cleaning up reset token:", cleanupError);
        }
        
        return res.status(500).json({ 
            success: false,
            message: "Unable to send password reset email. Please try again later." 
        });
    }
};
const resetPassword = async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  if (!token || !password) {
      return res.status(400).json({ 
          success: false,
          message: "Token and new password are required" 
      });
  }

  try {
      // Create hashed token for comparison
      const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
      
      // Find user with valid reset token
      const user = await User.findOne({
          resetToken: hashedToken,  // Changed from resetPasswordToken to match forgotPassword
          resetTokenExpiry: { $gt: Date.now() }  // Changed from resetPasswordExpire to match forgotPassword
      });

      if (!user) {
          return res.status(400).json({ 
              success: false,
              message: "Invalid or expired password reset token" 
          });
      }

      // Hash the new password
      const hashedPassword = await hashPassword(password);
      
      // Update user's password and clear reset token fields
      user.password = hashedPassword;
      user.resetToken = undefined;
      user.resetTokenExpiry = undefined;
      
      await user.save();

      res.status(200).json({ 
          success: true,
          message: "Password has been successfully reset. Please login with your new password." 
      });
      
  } catch (error) {
      console.error("Reset Password Error:", error);
      res.status(500).json({ 
          success: false,
          message: "An error occurred while resetting your password. Please try again." 
      });
  }
};

const getProfile = async (req,res)=>{
  try{
    const userId = res.user.data._id
    const user = await User.findOne(userId)
    if(!user){
      return res.status(404).json({
        success: false,
        message: "User not found"
      })
    }
    res.status(200).json({
      success: true,
      data: user
    })
  }
  catch(error){
    console.error("Get Profile Error:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while fetching your profile."
    })
  }
}
const updateProfile = async (req, res) => {
  
}


module.exports ={googleAuth,getProductById,getAllProductsByUser,getAllCategories,resetPassword,forgotPassword }