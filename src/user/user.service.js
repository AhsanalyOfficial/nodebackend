import prisma from "../prisma/prisma.js";
import bcrypt from "bcryptjs";
import AppError from "../utils/appError.js";
import JWTConfig from "../config/jwt.config.js";
import dotenv from "dotenv";

dotenv.config();

class UserService {
  static async hashPassword(password) {
    const salt = await bcrypt.genSalt(
      parseInt(process.env.BCRYPT_ROUNDS) || 10
    );
    return await bcrypt.hash(password, salt);
  }

  static async comparePassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  static async register(userData) {
    const {
      firstName,
      lastName,
      email,
      password,
      phone,
      role,
    } = userData;

    const existingUser = await prisma.user.findUnique({
      where: { email: email },
    });
    if (existingUser) {
      throw new AppError("Email already in use", 400);
    }

    const hashedPassword = await this.hashPassword(password);

    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        password: hashedPassword,
        phone,
        role,
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    // Generate token
    const token = JWTConfig.generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    return { user, token };
  }

  // Login user
  static async login(email, password) {
    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new AppError("Invalid email or password", 401);
    }

    // Check if user is active
    if (!user.isActive) {
      throw new AppError(
        "Your account has been deactivated. Please contact support",
        403
      );
    }

    // Verify password
    const isPasswordValid = await this.comparePassword(password, user.password);
    if (!isPasswordValid) {
      throw new AppError("Invalid email or password", 401);
    }

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    // Generate token
    const token = JWTConfig.generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    return { user: userWithoutPassword, token };
  }

  // Get all users (with pagination)
  static async getAllUsers(query) {
    const { page = 1, limit = 10, role, city, search } = query;

    const skip = (page - 1) * limit;
    const take = parseInt(limit);

    // Build where clause
    const where = {};

    if (role) {
      where.role = role;
    }

    if (city) {
      where.city = { contains: city, mode: "insensitive" };
    }

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    // Get users
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          role: true,
          isActive: true,
          isVerified: true,
          city: true,
          state: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.user.count({ where }),
    ]);

    return {
      users,
      pagination: {
        page: parseInt(page),
        limit: take,
        total,
        pages: Math.ceil(total / take),
      },
    };
  }

  // Get user by ID
  static async getUserById(id) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        avatar: true,
        role: true,
        isActive: true,
        isVerified: true,
        address: true,
        city: true,
        state: true,
        pincode: true,
        bio: true,
        experience: true,
        createdAt: true,
        // Include related data based on role
        services: {
          where: { isActive: true },
          include: {
            category: true,
          },
        },
        reviewsReceived: {
          take: 5,
          orderBy: { createdAt: "desc" },
          include: {
            reviewer: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
          },
        },
        _count: {
          select: {
            services: true,
            reviewsReceived: true,
            providerBookings: true,
          },
        },
      },
    });

    if (!user) {
      throw new AppError("User not found", 404);
    }

    // Calculate average rating
    if (user.reviewsReceived && user.reviewsReceived.length > 0) {
      const avgRating =
        user.reviewsReceived.reduce((acc, review) => acc + review.rating, 0) /
        user.reviewsReceived.length;
      user.averageRating = parseFloat(avgRating.toFixed(1));
    }

    return user;
  }

  // Update user
  static async updateUser(id, updateData, requestingUser) {
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      throw new AppError("User not found", 404);
    }

    // Only allow users to update their own profile unless admin
    if (requestingUser.role !== "ADMIN" && requestingUser.id !== id) {
      throw new AppError("You can only update your own profile", 403);
    }

    // Remove sensitive fields from update data
    const { password, role, ...safeUpdateData } = updateData;

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id },
      data: safeUpdateData,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        avatar: true,
        role: true,
        isActive: true,
        address: true,
        city: true,
        state: true,
        pincode: true,
        bio: true,
        experience: true,
        updatedAt: true,
      },
    });

    return updatedUser;
  }

  // Delete user (soft delete by deactivating)
  static async deleteUser(id, requestingUser) {
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      throw new AppError("User not found", 404);
    }

    // Only allow users to delete their own account unless admin
    if (requestingUser.role !== "ADMIN" && requestingUser.id !== id) {
      throw new AppError("You can only delete your own account", 403);
    }

    // Soft delete by deactivating
    await prisma.user.update({
      where: { id },
      data: { isActive: false },
    });

    return { message: "User account deactivated successfully" };
  }

  // Change password
  static async changePassword(userId, currentPassword, newPassword) {
    // Get user with password
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppError("User not found", 404);
    }

    // Verify current password
    const isPasswordValid = await this.comparePassword(
      currentPassword,
      user.password
    );
    if (!isPasswordValid) {
      throw new AppError("Current password is incorrect", 401);
    }

    // Hash new password
    const hashedPassword = await this.hashPassword(newPassword);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return { message: "Password changed successfully" };
  }

  // Update provider profile (additional fields)
  static async updateProviderProfile(userId, providerData) {
    const { bio, experience, verifiedDoc, services } = providerData;

    // Update provider profile
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        bio,
        experience: parseInt(experience),
        verifiedDoc,
        // If services are provided, create them
        services: services
          ? {
              create: services.map((service) => ({
                title: service.title,
                description: service.description,
                price: service.price,
                duration: service.duration,
                categoryId: service.categoryId,
              })),
            }
          : undefined,
      },
      include: {
        services: true,
      },
    });

    return updatedUser;
  }
}

export default UserService;
