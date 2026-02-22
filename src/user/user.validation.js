import { body, param, validationResult } from "express-validator";

export const userValidation = {
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
      .optional()
      .isMobilePhone()
      .withMessage("Please provide a valid phone number"),

    body("role")
      .optional()
      .isIn(["CUSTOMER", "PROVIDER", "ADMIN"])
      .withMessage("Invalid role"),
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

    body("address")
      .optional()
      .isLength({ max: 200 })
      .withMessage("Address cannot exceed 200 characters"),

    body("city")
      .optional()
      .isLength({ max: 50 })
      .withMessage("City cannot exceed 50 characters"),

    body("pincode")
      .optional()
      .isPostalCode("any")
      .withMessage("Please provide a valid pincode"),
  ],

  userId: [
    param("id")
      .notEmpty()
      .withMessage("User ID is required")
      .isUUID()
      .withMessage("Invalid user ID format"),
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
