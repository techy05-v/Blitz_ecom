const jwt = require("jsonwebtoken");
const User = require("../model/userModel")

const SECRET_KEYS = {
  user: process.env.JWT_USER_ACCESS_TOKEN_SECRET,
  admin: process.env.JWT_ADMIN_ACCESS_TOKEN_SECRET,
};

const verifyToken = (role) => {
  return (req, res, next) => {
    const authHeader = req.headers["authorization"];
    console.log("authHeader", authHeader)

    if (!authHeader) {
      console.log("Token verification failed: No token provided");
      return res.status(403).json({ message: "No token provided.", role });
    }

    const token = authHeader.split(" ")[1];

    if (!token || token.split(".").length !== 3) {
      console.log("Token verification failed: Invalid token format");
      return res.status(400).json({ message: "Invalid token format." });
    }

    const secretKey = SECRET_KEYS[role];
    if (!secretKey) {
      console.log("Token verification failed: Invalid role specified", { role });
      return res.status(400).json({ message: "Invalid role specified.", role });
    }
    console.log("Verifying token for role:", role);

    jwt.verify(token, secretKey, async (err, decoded) => {
      if (err) {
        console.log("Token verification failed: Invalid or expired token", { error: err.message });
        return res.status(401).json({ message: "Token is invalid or expired.", role });
      }
      console.log("Token decoded successfully:", decoded);

      if (decoded?.data?.role === "user") {
        console.log("Checking blocked status for user ID:", decoded?.data?.id);
        const userData = await User.findOne({ $and: [{ _id: decoded?.data?.id }, { isBlocked: true }] })

        console.log("User blocked status check result:", {
          userId: decoded.user_id,
          isBlocked: !!userData,
          userData: userData ? 'User found and is blocked' : 'User either not found or not blocked'
        });

        if (userData) {
          console.log("Access denied: User is blocked", { userId: decoded._id });
          res.clearCookie("userRefreshToken");
          return res.status(401).json({ message: "User Blocked.", role });
        }
      }

      req.user = decoded;
      console.log("Token verification successful, proceeding to next middleware");
      next();
    });
  };
};

module.exports = {
  verifyUser: verifyToken("user"),
  verifyAdmin: verifyToken("admin"),
};