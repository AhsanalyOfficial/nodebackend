import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

class JWTConfig {
  static generateToken(payload) {
    return jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRE || "7d",
    });
  }

  static verifyToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      return null;
    }
  }

  static generateRefreshToken(payload) {
    return jwt.sign(payload, process.env.JWT_SECRET + "refresh", {
      expiresIn: "30d",
    });
  }
}

export default JWTConfig;
