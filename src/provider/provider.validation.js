import { body, param, validationResult } from "express-validator";
import { BookingStatus } from "@prisma/client";

export const providerValidation = {
  register: [
    body("firstName")
      .notEmpty()
      .withMessage("First name is required")
      .isLength({ min: 2, max: 50 })
      .withMessage("First name must be between 2 and 50 characters")
      .matches(/^[a-zA-Z\s]+$/)
      .withMessage("First name can only contain letters and spaces"),

    body("lastName")
      .notEmpty()
      .withMessage("Last name is required")
      .isLength({ min: 2, max: 50 })
      .withMessage("Last name must be between 2 and 50 characters")
      .matches(/^[a-zA-Z\s]+$/)
      .withMessage("Last name can only contain letters and spaces"),

    body("email")
      .notEmpty()
      .withMessage("Email is required")
      .isEmail()
      .withMessage("Please provide a valid email")
      .normalizeEmail(),

    body("password")
      .notEmpty()
      .withMessage("Password is required")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters long")
      .matches(/^(?=.*[A-Za-z])(?=.*\d)/)
      .withMessage("Password must contain at least one letter and one number"),

    body("phone")
      .notEmpty()
      .withMessage("Phone number is required")
      .isMobilePhone()
      .withMessage("Please provide a valid phone number"),

    body("bio")
      .optional()
      .isLength({ max: 500 })
      .withMessage("Bio cannot exceed 500 characters"),

    body("experience")
      .optional()
      .isInt({ min: 0, max: 50 })
      .withMessage("Experience must be between 0 and 50 years"),
  ],

  login: [
    body("email")
      .notEmpty()
      .withMessage("Email is required")
      .isEmail()
      .withMessage("Please provide a valid email"),

    body("password").notEmpty().withMessage("Password is required"),
  ],

  updateProfile: [
    body("firstName")
      .optional()
      .isLength({ min: 2, max: 50 })
      .withMessage("First name must be between 2 and 50 characters")
      .matches(/^[a-zA-Z\s]+$/)
      .withMessage("First name can only contain letters and spaces"),

    body("lastName")
      .optional()
      .isLength({ min: 2, max: 50 })
      .withMessage("Last name must be between 2 and 50 characters")
      .matches(/^[a-zA-Z\s]+$/)
      .withMessage("Last name can only contain letters and spaces"),

    body("phone")
      .optional()
      .isMobilePhone()
      .withMessage("Please provide a valid phone number"),

    body("bio")
      .optional()
      .isLength({ max: 500 })
      .withMessage("Bio cannot exceed 500 characters"),

    body("experience")
      .optional()
      .isInt({ min: 0, max: 50 })
      .withMessage("Experience must be between 0 and 50 years"),

    body("address")
      .optional()
      .isLength({ max: 200 })
      .withMessage("Address cannot exceed 200 characters"),

    body("city")
      .optional()
      .isLength({ max: 50 })
      .withMessage("City cannot exceed 50 characters"),

    body("state")
      .optional()
      .isLength({ max: 50 })
      .withMessage("State cannot exceed 50 characters"),

    body("zipCode")
      .optional()
      .isPostalCode("any")
      .withMessage("Please provide a valid zip code"),

    body("avatar")
      .optional()
      .isURL()
      .withMessage("Avatar must be a valid URL"),

    body("verifiedDoc")
      .optional()
      .isURL()
      .withMessage("Document must be a valid URL"),
  ],

  changePassword: [
    body("currentPassword")
      .notEmpty()
      .withMessage("Current password is required"),

    body("newPassword")
      .notEmpty()
      .withMessage("New password is required")
      .isLength({ min: 6 })
      .withMessage("New password must be at least 6 characters long")
      .matches(/^(?=.*[A-Za-z])(?=.*\d)/)
      .withMessage("New password must contain at least one letter and one number"),
  ],

  addService: [
    body("title")
      .notEmpty()
      .withMessage("Service title is required")
      .isLength({ min: 3, max: 100 })
      .withMessage("Title must be between 3 and 100 characters"),

    body("description")
      .optional()
      .isLength({ max: 500 })
      .withMessage("Description cannot exceed 500 characters"),

    body("price")
      .notEmpty()
      .withMessage("Price is required")
      .isFloat({ min: 0 })
      .withMessage("Price must be a positive number"),

    body("duration")
      .optional()
      .isInt({ min: 15, max: 480 })
      .withMessage("Duration must be between 15 and 480 minutes"),

    body("categoryId")
      .notEmpty()
      .withMessage("Category ID is required")
      .isUUID()
      .withMessage("Invalid category ID format"),
  ],

  updateService: [
    body("title")
      .optional()
      .isLength({ min: 3, max: 100 })
      .withMessage("Title must be between 3 and 100 characters"),

    body("description")
      .optional()
      .isLength({ max: 500 })
      .withMessage("Description cannot exceed 500 characters"),

    body("price")
      .optional()
      .isFloat({ min: 0 })
      .withMessage("Price must be a positive number"),

    body("duration")
      .optional()
      .isInt({ min: 15, max: 480 })
      .withMessage("Duration must be between 15 and 480 minutes"),

    body("categoryId")
      .optional()
      .isUUID()
      .withMessage("Invalid category ID format"),

    body("isActive")
      .optional()
      .isBoolean()
      .withMessage("isActive must be a boolean"),
  ],

  updateBookingStatus: [
    body("status")
      .notEmpty()
      .withMessage("Status is required")
      .isIn(Object.values(BookingStatus))
      .withMessage("Invalid booking status"),

    body("notes")
      .optional()
      .isLength({ max: 500 })
      .withMessage("Notes cannot exceed 500 characters"),
  ],

  setAvailability: [
    body("dayOfWeek")
      .optional()
      .isInt({ min: 0, max: 6 })
      .withMessage("Day of week must be between 0 and 6"),

    body("startTime")
      .notEmpty()
      .withMessage("Start time is required")
      .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .withMessage("Start time must be in HH:MM format"),

    body("endTime")
      .notEmpty()
      .withMessage("End time is required")
      .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .withMessage("End time must be in HH:MM format"),

    body("isAvailable")
      .optional()
      .isBoolean()
      .withMessage("isAvailable must be a boolean"),

    body("specificDate")
      .optional()
      .isISO8601()
      .withMessage("Specific date must be a valid date"),
  ],

  providerId: [
    param("id")
      .notEmpty()
      .withMessage("Provider ID is required")
      .isUUID()
      .withMessage("Invalid provider ID format"),
  ],

  serviceId: [
    param("serviceId")
      .notEmpty()
      .withMessage("Service ID is required")
      .isUUID()
      .withMessage("Invalid service ID format"),
  ],

  bookingId: [
    param("bookingId")
      .notEmpty()
      .withMessage("Booking ID is required")
      .isUUID()
      .withMessage("Invalid booking ID format"),
  ],
};

export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array().map((err) => ({
        field: err.path,
        message: err.msg,
      })),
    });
  }
  next();
};