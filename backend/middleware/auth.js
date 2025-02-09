const jwt = require("jsonwebtoken");
const User = require("../model/userModel");

const SECRET_KEYS = {
  user: process.env.JWT_USER_ACCESS_TOKEN_SECRET,
  admin: process.env.JWT_ADMIN_ACCESS_TOKEN_SECRET,
};

const verifyToken = (role) => {
  return async (req, res, next) => {
    try {
      const authHeader = req.headers["authorization"];

      if (!authHeader) {
        return res.status(403).json({ message: "No token provided.", role });
      }

      const token = authHeader.split(" ")[1];

      if (!token || token.split(".").length !== 3) {
        return res.status(400).json({ message: "Invalid token format." });
      }

      const secretKey = SECRET_KEYS[role];
      if (!secretKey) {
        return res.status(400).json({ message: "Invalid role specified.", role });
      }

      jwt.verify(token, secretKey, async (err, decoded) => {
        if (err) {
          return res.status(401).json({ message: "Token is invalid or expired.", role });
        }

        if (decoded?.data?.role === "user") {
          const userData = await User.findById(decoded?.data?._id);

          if (!userData) {
            return res.status(404).json({ message: "User not found.", role });
          }

          if (userData.isBlocked) {
            res.clearCookie("userRefreshToken");
            return res.status(401).json({ message: "User Blocked.", role });
          }
        }

        req.user = decoded;
        next();
      });
    } catch (error) {
      console.error("Error in verifyToken middleware:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  };
};

module.exports = {
  verifyUser: verifyToken("user"),
  verifyAdmin: verifyToken("admin"),
};
