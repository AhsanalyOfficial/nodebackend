import express from "express";
import AdminController from "../controllers/admin.controller.js";
import { restrictTo } from "../middleware/role.middleware.js";
import { protect } from "../middleware/auth.middleware.js";
import { adminValidation, validate } from "../validations/admin.validation.js";
import { sanitizeInput } from "../middleware/validate.middleware.js";

const router = express.Router();

router.post(
  "/register",
  sanitizeInput,
  adminValidation.register,
  validate,
  AdminController.register
);

router.post(
  "/login",
  sanitizeInput,
  adminValidation.login,
  validate,
  AdminController.login
);

router.use(protect);
router.use(restrictTo("ADMIN"));

router.get("/me", AdminController.getMe);
router.patch(
  "/update-me",
  sanitizeInput,
  adminValidation.updateProfile,
  validate,
  AdminController.updateMe
);
router.patch(
  "/change-password",
  sanitizeInput,
  adminValidation.changePassword,
  validate,
  AdminController.changePassword
);

router.get(
  "/:id",
  adminValidation.userId,
  validate,
  AdminController.getAdminById
);
router.patch(
  "/:id",
  adminValidation.userId,
  adminValidation.updateProfile,
  validate,
  sanitizeInput,
  AdminController.updateAdmin
);
router.delete(
  "/:id",
  adminValidation.userId,
  validate,
  AdminController.deleteAdmin
);
router.patch(
  "/provider/:providerId/verify",
  adminValidation.providerId,
  adminValidation.verifyProvider,
  validate,
  AdminController.verifyProvider
);
router.patch(
  "/provider/:providerId/toggle-status",
  adminValidation.providerId,
  adminValidation.toggleStatus,
  validate,
  AdminController.toggleProviderStatus
);

router.get("/dashboard/stats", AdminController.getDashboardStats);

export default router;
