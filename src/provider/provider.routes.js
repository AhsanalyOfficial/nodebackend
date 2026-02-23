// src/routes/provider.routes.js
import express from "express";
import ProviderController from "../controllers/provider.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import { restrictTo } from "../middleware/role.middleware.js";
import { providerValidation, validate } from "../validations/provider.validation.js";
import { sanitizeInput } from "../middleware/validate.middleware.js";

const router = express.Router();

// Public routes
router.post(
  "/register",
  sanitizeInput,
  providerValidation.register,
  validate,
  ProviderController.register
);

router.post(
  "/login",
  sanitizeInput,
  providerValidation.login,
  validate,
  ProviderController.login
);

// Public profile view
router.get(
  "/:id",
  providerValidation.providerId,
  validate,
  ProviderController.getProviderById
);

// Protected routes (require authentication)
router.use(protect);
router.use(restrictTo("PROVIDER"));

// Profile management
router.get("/me", ProviderController.getMe);
router.patch(
  "/update-me",
  sanitizeInput,
  providerValidation.updateProfile,
  validate,
  ProviderController.updateMe
);
router.patch(
  "/change-password",
  sanitizeInput,
  providerValidation.changePassword,
  validate,
  ProviderController.changePassword
);

// Service management
router.post(
  "/services",
  sanitizeInput,
  providerValidation.addService,
  validate,
  ProviderController.addService
);
router.get("/services", ProviderController.getMyServices);
router.patch(
  "/services/:serviceId",
  sanitizeInput,
  providerValidation.updateService,
  validate,
  ProviderController.updateService
);
router.delete(
  "/services/:serviceId",
  providerValidation.serviceId,
  validate,
  ProviderController.deleteService
);

// Booking management
router.get("/bookings", ProviderController.getMyBookings);
router.patch(
  "/bookings/:bookingId/status",
  sanitizeInput,
  providerValidation.updateBookingStatus,
  validate,
  ProviderController.updateBookingStatus
);

// Availability management
router.post(
  "/availability",
  sanitizeInput,
  providerValidation.setAvailability,
  validate,
  ProviderController.setAvailability
);
router.get("/availability", ProviderController.getAvailability);

// Dashboard
router.get("/dashboard/stats", ProviderController.getDashboardStats);

export default router;