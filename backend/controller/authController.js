const Admin = require("../model/adminModel");
const RefreshToken = require("../model/refreshTokenModel");
const User = require("../model/userModel");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const dotenv = require("dotenv");
const UnverifiedUser= require("../model/unverifiedUserModel")
const { sendOTPEmail, sendPasswordResetEmail } = require("../utils/emailUtils");
const storeToken =require("../utils/JWT/storeCookie")
const  generateUserId  = require("../utils/JWT/userIdGenerator");
const { OAuth2Client } = require("google-auth-library");
const {
    generateAccessToken,
    generateRefreshToken,
} = require("../utils/JWT/generateToken");
const {hashPassword,comparePassword } = require("../utils/passwordUtils")
const FRONDEND_URL=process.env.CLIENT_URL
const JWT_SECRET =process.env.JWT_SECRET
const createToken = (data) => {
    return jwt.sign({ id: data }, JWT_SECRET, { expiresIn: "4m" });
};
const generateOTP = () => {
	return Math.floor(100000 + Math.random() * 900000).toString();
};

const refreshAccessToken = async (req, res) => {
    console.log("received Cookies" ,req.cookies)
    console.log(req.cookies);
    console.log("------------------refreshtoken-------------------------------------------")
    try {
        // Fix the syntax error in refreshToken assignment
        console.log("enna pinne thodangamrsr")
        const refreshToken = 
            req?.cookies?.userRefreshToken ||
            req?.cookies?.adminRefreshToken;
        console.log("mone work ayi")
        if (!refreshToken) {
            console.log("refreshing fields");
            return res.status(403).json({
                message: "Refresh token expired. Login to your account",
                success: false,
            });
        }
        console.log("next step")
        const tokenDoc = await RefreshToken.findOne({ token: refreshToken });
        console.log(tokenDoc)
        if (!tokenDoc) {
            console.log("Refreshing Failed");
            return res.status(403).json({
                message: "Invalid refresh token",
                success: false,
            });
        }
        console.log("tokenDoc set")
        const roleSecrets = {
            user: {
                refreshSecret: process.env.JWT_USER_REFRESH_TOKEN_SECRET,
                accessSecret: process.env.JWT_USER_ACCESS_TOKEN_SECRET,
            },
            admin: {
                refreshSecret: process.env.JWT_ADMIN_REFRESH_TOKEN_SECRET,
                accessSecret: process.env.JWT_ADMIN_ACCESS_TOKEN_SECRET,
            },
        };
        console.log("bro working")
        const role = tokenDoc.user;              // because you store role in 'user' field
        const expiresAt = tokenDoc.expires_at; 
        console.log(role,expiresAt)
        if (!roleSecrets[role]) {
            return res.status(403).json({
                message: "Invalid role in refresh token",
                success: false,
                role,
            });
        }
        console.log("ithum okey bro")
        const { refreshSecret, accessSecret } = roleSecrets[role];
        console.log(refreshSecret , accessSecret)
        if (expiresAt <= new Date()) {
            await RefreshToken.deleteOne({ token: refreshToken });

            res.clearCookie(`${role}RefreshToken`, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
            });
            console.log("good job")
            return res.status(403).json({
                message: "Refresh token expired. Login to your account",
                success: false,
            });
        }
        console.log("havu")
        try {
            const decoded = jwt.verify(refreshToken, refreshSecret);

            const newAccessToken = jwt.sign(
                {
                    _id: decoded?.data?._id,
                    email: decoded?.data?.email,
                    role: decoded?.data?.role,
                    user_id: decoded?.data?.user_id,
                },
                accessSecret,
                { expiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRES }
            );
            console.log("New Access Token:", newAccessToken);
            console.log("Refreshing Completed");

            return res.status(200).json({
                message: "Access Token created successfully",
                success: true,
                access_token: newAccessToken,
                role,
            });
        } catch (err) {
            console.error("Invalid Refresh Token:", err.message);
            return res.status(403).json({
                message: "Invalid refresh token",
                success: false,
            });
        }
    } catch (error) {
        console.error("Error in Refresh Token:", error.message);
        return res.status(500).json({
            message: "Something went wrong",
            success: false,
            error: error.message,
        });
    }
};
const resendOtp = async (req, res) => {
    try {
      const { email, role } = req.body;
  
      console.log("===== Resend OTP Request Received =====");
      console.log("Request Body:", { email, role });
  
      // Validate required fields
      if (!email || !role) {
        console.log("Validation Failed: Missing email or role");
        return res.status(400).json({
          success: false,
          message: "Email and role are required."
        });
      }
  
      // Find the user
      console.log(`Searching for user with email: ${email}`);
      const unverifiedUser = await UnverifiedUser.findOne({ email });
      console.log("User Search Result:", unverifiedUser);
  
      if (!unverifiedUser) {
        console.log(`User not found for email: ${email}`);
        return res.status(404).json({
          success: false,
          message: "User not found."
        });
      }
  
      // Explicit role validation
      console.log(`Validating role. Expected: ${role}, Found: ${unverifiedUser.role}`);
      if (unverifiedUser.role !== role) {
        console.log(
          `Role mismatch for email: ${email}. Registered role: ${unverifiedUser.role}`
        );
        return res.status(400).json({
          success: false,
          message: `This email is registered as a ${unverifiedUser.role} account.`
        });
      }
  
      // Check OTP expiry
      const currentTime = Date.now();
      const otpExpiryTime = unverifiedUser.otpExpiry.getTime();
      const remainingTime = otpExpiryTime - currentTime;
  
      console.log(`Current Time: ${currentTime}`);
      console.log(`OTP Expiry Time: ${otpExpiryTime}`);
      console.log(`Remaining OTP Validity for ${email}: ${remainingTime} ms`);
  
      // If OTP is expired or about to expire
      if (remainingTime <= 5000) {
        console.log("OTP expired or about to expire. Generating new OTP...");
  
        const newOtp = generateOTP();
        console.log(`Generated New OTP for ${email}: ${newOtp}`);
  
        unverifiedUser.otp = newOtp;
        unverifiedUser.otpExpiry = new Date(currentTime + 120000); // 2 minutes expiry
  
        console.log(`Updated OTP Expiry Time: ${unverifiedUser.otpExpiry}`);
  
        try {
          await unverifiedUser.save();
          console.log(`New OTP saved successfully for ${email}`);
          console.log(`Sending New OTP to ${email}...`);
          await sendOTPEmail(email, newOtp);
          console.log(`New OTP sent successfully to ${email}`);
        } catch (error) {
          console.error("Error while saving OTP or sending email:", error);
          return res.status(500).json({
            success: false,
            message: "Failed to generate and send new OTP."
          });
        }
  
        return res.status(200).json({
          success: true,
          message: "New OTP sent successfully.",
          expiresIn: 120 // seconds
        });
      } else {
        // If OTP is still valid
        console.log(`Existing OTP still valid. Remaining time: ${remainingTime} ms`);
        console.log(`Resending Existing OTP to ${email}: ${unverifiedUser.otp}`);
  
        try {
          await sendOTPEmail(email, unverifiedUser.otp);
          console.log(`Existing OTP resent successfully to ${email}`);
        } catch (error) {
          console.error("Error while resending existing OTP:", error);
          return res.status(500).json({
            success: false,
            message: "Failed to resend OTP."
          });
        }
  
        return res.status(200).json({
          success: true,
          message: "OTP resent successfully.",
          expiresIn: Math.floor(remainingTime / 1000) // Convert ms to seconds
        });
      }
    } catch (error) {
      console.error("===== Unexpected Error in Resend OTP =====");
      console.error("Error Details:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error while resending OTP."
      });
    }
  };
  const googleAuth = async (req, res) => {
    const { token, role } = req.body;

    try {
        const client = new OAuth2Client({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        });

        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const { name, email, sub: googleId, picture } = ticket.getPayload();

        // Find user by email
        let user = await User.findOne({ email: email.toLowerCase() });
        let isNewUser = false;

        if (user) {
            // Link Google account if not already linked
            if (!user.google_id) {
                user.google_id = googleId;
                user.avatar = user.avatar || picture;
                await user.save();
            }
        } else {
            // Create new user
            user = new User({
                user_name: name,
                email: email.toLowerCase(),
                google_id: googleId,
                avatar: picture,
                user_id: generateUserId()
            });
            await user.save();
            isNewUser = true;
        }

        if (user.isBlocked) {
            return res.status(401).json({
                message: "Account blocked. Please contact support."
            });
        }

        const tokenData = {
            _id: user._id,
            email: user.email,
            role,
            user_id: user.user_id
        };

        const accessToken = generateAccessToken(role, tokenData);
        const refreshToken = generateRefreshToken(role, tokenData);

        // Save refresh token
        const newRefreshToken = new RefreshToken({
            token: refreshToken,
            user: role,
            user_id: user._id,
            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        });

        await newRefreshToken.save();

        // Store refresh token in cookie
        storeToken(
            `${role}RefreshToken`,
            refreshToken,
            7 * 24 * 60 * 60 * 1000,
            res
        );

        const { password: _, ...userDetails } = user.toObject();

        res.status(200).json({
            success: true,
            message: isNewUser 
                ? "Account created successfully" 
                : "Login successful",
            userData: userDetails,
            accessToken,
            role
        });
    } catch (error) {
        console.error("Google Auth Error:", error);
        res.status(500).json({ 
            message: "Authentication failed",
            error: error.message 
        });
    }
};
const adminSignIn = async (req, res) => {
	console.log(req.body)
	const { email, password } = req.body;
	
	try {
		const admin = await Admin.findOne({
			email,
		});
    console.log(admin)
		if (!admin) {
			return res.status(400).json({ message: "Account not found" });
		}

		const isMatch = await comparePassword(password, admin?.password);

		if (!isMatch) {
			return res.status(400).json({ message: "Incorrect Password" });
		}
		const adminDataToGenerateToken = {
			_id: admin?._id,
			email: admin?.email,
			role: "admin",
		};

		const accessToken = generateAccessToken(
			"admin",
			adminDataToGenerateToken
		);
		const refreshToken = generateRefreshToken(
			"admin",
			adminDataToGenerateToken
		);
		// console.log(accessToken,"fffe", refreshToken);

		const newRefreshToken = new RefreshToken({
			token: refreshToken,
			user: adminDataToGenerateToken?.role,
			user_id: adminDataToGenerateToken?._id,
			expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
		});
		const savedToken = await newRefreshToken.save();

		const { password: _, ...adminDetails } = admin.toObject();

		if (savedToken) {
			storeToken(
				"adminRefreshToken",
				refreshToken,
				7 * 24 * 60 * 60 * 1000,
				res
			);

			res.status(200).json({
				message: "Admin logged in successfully",
				adminData: adminDetails,
				success: true,
				accessToken,
				role: "admin",
			});
		}
	} catch (error) {
		console.log("Admin Sign In Error: ", error);
		res.status(500).json({ message: "Internal server error" });
	}
};
const userSignUp = async (req, res) => {
  try {
      const { user_name, email, password } = req.body;
      
      // Check existing users
      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser) {
          return res.status(400).json({
              message: existingUser.google_id 
                  ? "This email is already registered with Google. Please use Google Sign-in."
                  : "User already exists. Please login with your password."
          });
      }

      // Check unverified users
      const unverifiedUser = await UnverifiedUser.findOne({ 
          email: email.toLowerCase() 
      });
      if (unverifiedUser) {
          return res.status(400).json({
              message: "User registration pending verification. Please verify your email."
          });
      }

      const hashedPassword = await hashPassword(password);
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const user_id = generateUserId();
      const newUnverifiedUser = new UnverifiedUser({
          user_name,
          email: email.toLowerCase(),
          password: hashedPassword,
          user_id,
          otp,
          otpExpiry: Date.now() + 120000, // 2 minutes
          role: "user"
      });

      await newUnverifiedUser.save();
      await sendOTPEmail(email, otp);
      
      return res.status(201).json({
          message: "OTP sent to your email."
      });
  } catch (error) {
      console.error("SignUp Error:", error);
      res.status(500).json({ message: "Internal server error" });
  }
};

const userLogin = async (req, res) => {
  try {
      const { email, password, remember } = req.body;
      const user = await User.findOne({ email: email.toLowerCase() });

      // Check if user exists
      if (!user) {
          return res.status(400).json({ message: "Account not found" });
      }

      // If user exists but has only Google auth
      if (user.google_id && !user.password) {
          return res.status(400).json({ 
              message: "Please use Google Sign-in for this account" 
          });
      }

      // Verify password
      const isMatch = await comparePassword(password, user.password);
      if (!isMatch) {
          return res.status(400).json({ message: "Incorrect password" });
      }

      if (user.isBlocked) {
          return res.status(401).json({ message: "Account blocked" });
      }

      const tokenData = {
          _id: user._id,
          email: user.email,
          role: "user",
          user_id: user.user_id
      };

      const accessToken = generateAccessToken("user", tokenData);
      const refreshToken = generateRefreshToken("user", tokenData);

      // Save refresh token
      const newRefreshToken = new RefreshToken({
          token: refreshToken,
          user: "user",
          user_id: user._id,
          expires_at: new Date(
              Date.now() + (remember ? 7 : 1) * 24 * 60 * 60 * 1000
          ),
      });

      await newRefreshToken.save();

      // Store refresh token in cookie
      storeToken(
          "userRefreshToken",
          refreshToken,
          (remember ? 7 : 1) * 24 * 60 * 60 * 1000,
          res
      );

      const { password: _, ...userDetails } = user.toObject();

      res.status(200).json({
          success: true,
          message: "Login successful",
          userData: userDetails,
          accessToken,
          role: "user"
      });
  } catch (error) {
      console.error("Login Error:", error);
      res.status(500).json({ message: "Internal server error" });
  }
};

  const verifyOtp = async (req, res) => {
    try {
        const { email, otp } = req.body;
        const unverifiedUser = await UnverifiedUser.findOne({ 
            email: email.toLowerCase() 
        });

        if (!unverifiedUser) {
            return res.status(400).json({ message: "User not found." });
        }

        if (unverifiedUser.otp !== otp) {
            return res.status(400).json({ message: "Invalid OTP" });
        }

        if (Date.now() > unverifiedUser.otpExpiry) {
            return res.status(400).json({ message: "OTP has expired" });
        }

        const newUser = new User({
            user_name: unverifiedUser.user_name,
            email: unverifiedUser.email,
            password: unverifiedUser.password,
            user_id: unverifiedUser.user_id,
            is_verified: true
        });

        await newUser.save();
        await UnverifiedUser.deleteOne({ email: email.toLowerCase() });

        const { password: _, ...userData } = newUser.toObject();
        const token = jwt.sign(
            { id: newUser._id }, 
            process.env.JWT_SECRET, 
            { expiresIn: "4m" }
        );

        res.status(200).json({
            message: "Email verified successfully.",
            userData,
            token
        });
    } catch (error) {
        console.error("OTP Verification Error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};
const forgotPassword = async (req, res) => {
    try {
      const { email, role } = req.body;
      
      // Validate email format
      if (!email || !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
        return res.status(400).json({ message: "Invalid email format" });
      }
  
      let person;
      if (role === "user") {
        person = await User.findOne({ email });
        
        // Check if user exists and has password (not Google auth)
        if (person && person.google_id && !person.password) {
          return res.status(400).json({ 
            message: "Please use Google Sign-In for this account" 
          });
        }
      } else if (role === "admin") {
        person = await Admin.findOne({ email });
      } else {
        return res.status(400).json({ message: "Invalid role provided" });
      }
  
      if (!person) {
        return res.status(404).json({ message: "User not found" });
      }
  
      const token = jwt.sign({ id: person._id }, process.env.JWT_SECRET, { expiresIn: "15m" });
      person.resetToken = token;
      person.resetTokenExpiry = Date.now() + 15 * 60 * 1000;
      await person.save();
  
      const resetLink = `${process.env.CLIENT_URL}/user/reset-password/${token}?role=${role}`;
      await sendPasswordResetEmail(email, resetLink);
      return res.status(200).json({ message: "Password reset email sent successfully" });
    } catch (error) {
      console.log("Error in forgotPassword", error);
      return res.status(500).json({ message: "An error occurred. Please try again later" });
    }
  };

module.exports = {
    refreshAccessToken,
    resendOtp,
    googleAuth ,
    adminSignIn,
    userSignUp,
    userLogin,
    verifyOtp,
    forgotPassword
};