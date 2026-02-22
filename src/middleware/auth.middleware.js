import prisma from "../prisma/prisma.js";
import JWTConfig from "../config/jwt.config.js";
import AppError from "../utils/AppError.js";
import catchAsync from "../utils/catchAsync.js";

export const protect = catchAsync(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return next(
      new AppError(
        "You are not logged in. Please log in to access this resource",
        401
      )
    );
  }

  const decoded = JWTConfig.verifyToken(token);
  if (!decoded) {
    return next(new AppError("Invalid token or token expired", 401));
  }

  const user = await prisma.user.findUnique({
    where: { id: decoded.id },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      isActive: true,
      isVerified: true,
    },
  });

  if (!user) {
    return next(
      new AppError("User belonging to this token no longer exists", 401)
    );
  }

  if (!user.isActive) {
    return next(
      new AppError(
        "Your account has been deactivated. Please contact support",
        403
      )
    );
  }

  req.user = user;
  next();
});
