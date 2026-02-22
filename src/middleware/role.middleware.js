import appError from "../utils/appError.js";

export const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new appError("You do not have permission to perform this action", 403)
      );
    }
    next();
  };
};

export const isAdmin = (req, res, next) => {
  if (req.user.role !== "ADMIN") {
    return next(new appError("Admin access required", 403));
  }
  next();
};

export const isProvider = (req, res, next) => {
  if (req.user.role !== "PROVIDER") {
    return next(new appError("Provider access required", 403));
  }
  next();
};

export const isCustomer = (req, res, next) => {
  if (req.user.role !== "CUSTOMER") {
    return next(new appError("Customer access required", 403));
  }
  next();
};

export const checkOwnership = (resourceParam = "id") => {
  return (req, res, next) => {
    const resourceId = req.params[resourceParam];

    if (req.user.role === "ADMIN" || req.user.id === resourceId) {
      return next();
    }

    return next(new appError("You can only access your own resources", 403));
  };
};
