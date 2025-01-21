const jwt = require("jsonwebtoken");
const User = require("../model/userModel")

const SECRET_KEYS = {
  user: process.env.JWT_USER_ACCESS_TOKEN_SECRET,
  admin: process.env.JWT_ADMIN_ACCESS_TOKEN_SECRET,
};

const verifyToken = (role) => {
  return (req, res, next) => {
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
        const userData = await User.findOne({ $and: [{ _id: decoded?.data?.id }, { isBlocked: true }] })

        if (userData) {
          res.clearCookie("userRefreshToken");
          return res.status(401).json({ message: "User Blocked.", role });
        }
      }

      req.user = decoded;
      next();
    });
  };
};

module.exports = {
  verifyUser: verifyToken("user"),
  verifyAdmin: verifyToken("admin"),
};