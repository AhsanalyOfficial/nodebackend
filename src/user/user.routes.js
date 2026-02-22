import express from "express";
import UserController from "./user.controller.js";
import {
  restrictTo,
  checkOwnership,
} from "../middleware/role.middleware.js";
import {
  protect
} from "../middleware/auth.middleware.js";
import { userValidation, validate } from "./user.validation.js";
import { sanitizeInput } from "../middleware/validate.middleware.js";

const router = express.Router();

// Public routes
router.post(
  "/register",
  sanitizeInput,
  userValidation.register,
  validate,
  UserController.register
);

router.post(
  "/login",
  sanitizeInput,
  userValidation.login,
  validate,
  UserController.login
);

// Protected routes (require authentication)
router.use(protect); // All routes below this require authentication

// Current user routes
router.get("/me", UserController.getMe);
router.patch(
  "/update-me",
  sanitizeInput,
  userValidation.updateProfile,
  validate,
  UserController.updateMe
);
router.patch("/change-password", sanitizeInput, UserController.changePassword);

// Provider specific routes
router.patch(
  "/provider-profile",
  restrictTo("PROVIDER"),
  sanitizeInput,
  UserController.updateProviderProfile
);

// User management routes (with ownership check)
router.get(
  "/:id",
  userValidation.userId,
  validate,
  checkOwnership("id"),
  UserController.getUserById
);

router.patch(
  "/:id",
  userValidation.userId,
  userValidation.updateProfile,
  validate,
  sanitizeInput,
  checkOwnership("id"),
  UserController.updateUser
);

router.delete(
  "/:id",
  userValidation.userId,
  validate,
  checkOwnership("id"),
  UserController.deleteUser
);

// Admin only routes
router.get("/", restrictTo("ADMIN"), UserController.getAllUsers);

router.patch(
  "/admin/:id/toggle-status",
  restrictTo("ADMIN"),
  userValidation.userId,
  validate,
  UserController.toggleUserStatus
);

export default router;
