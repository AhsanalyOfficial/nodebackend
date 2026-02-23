import prisma from "../prisma/prisma.js";
import AppError from "../utils/appError.js";
import JWTConfig from "../config/jwt.config.js";
import dotenv from "dotenv";
import { UserRole } from "@prisma/client";
import { comparePassword, hashPassword } from "../utils/bcrypt.utils.js";

dotenv.config();

class AdminService {
  static async register(userData) {
    const { firstName, lastName, email, password, phone, role } = userData;

    const existingUser = await prisma.user.findUnique({
      where: { email: email },
    });

    if (existingUser) {
      throw new AppError("Email already in use", 400);
    }

    if (role !== UserRole.ADMIN) {
      throw new AppError(
        "Invalid role. Only ADMIN can be registered here",
        400
      );
    }

    const hashedPassword = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        password: hashedPassword,
        phone,
        role: UserRole.ADMIN,
        isActive: true,
        isVerified: true,
      },
    });

    const token = JWTConfig.generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    return { user, token };
  }

  static async login(email, password) {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new AppError("Invalid email or password", 401);
    }

    if (user.role !== UserRole.ADMIN) {
      throw new AppError("Access denied. Admin only.", 403);
    }

    if (!user.isActive) {
      throw new AppError(
        "Your account has been deactivated. Contact super admin.",
        403
      );
    }

    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      throw new AppError("Invalid email or password", 401);
    }

    const { password: _, ...userWithoutPassword } = user;

    const token = JWTConfig.generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    return { user: userWithoutPassword, token };
  }

  static async getAdminById(id) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        _count: {
          select: {
            customerBookings: true,
            services: true,
          },
        },
      },
    });

    if (!user) {
      throw new AppError("Admin not found", 404);
    }

    return user;
  }

  static async updateAdmin(id, updateData, requestingUser) {
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      throw new AppError("Admin not found", 404);
    }

    if (existingUser.role !== UserRole.ADMIN) {
      throw new AppError("This is not an admin account", 400);
    }

    if (requestingUser.role !== UserRole.ADMIN) {
      throw new AppError(
        "You don't have permission to update admin profiles",
        403
      );
    }

    const { password, role, ...safeUpdateData } = updateData;

    const updatedUser = await prisma.user.update({
      where: { id },
      data: safeUpdateData,
    });

    return updatedUser;
  }

  static async deleteAdmin(id) {
    const allAdmins = await prisma.user.findMany({
      where: { role: UserRole.ADMIN, isActive: true },
    });
    if (allAdmins.length <= 1 && allAdmins[0]?.id === id) {
      throw new AppError(
        "Cannot delete the last active admin. At least one admin must exist.",
        400
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      throw new AppError("Admin not found", 404);
    }

    if (existingUser.role !== UserRole.ADMIN) {
      throw new AppError("This is not an admin account", 400);
    }

    await prisma.user.update({
      where: { id },
      data: { isActive: false },
    });

    return { message: "Admin account deactivated successfully" };
  }

  static async changePassword(userId, currentPassword, newPassword) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppError("Admin not found", 404);
    }
    if (user.role !== UserRole.ADMIN) {
      throw new AppError("User role is not Admin", 400);
    }

    const isPasswordValid = await comparePassword(
      currentPassword,
      user.password
    );
    if (!isPasswordValid) {
      throw new AppError("Current password is incorrect", 401);
    }

    const hashedPassword = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return { message: "Password changed successfully" };
  }

  static async verifyProviderProfile(adminId, providerId, data) {
    const admin = await prisma.user.findUnique({
      where: { id: adminId },
    });

    if (!admin) {
      throw new AppError("Admin not found", 404);
    }

    if (admin.role !== UserRole.ADMIN) {
      throw new AppError("You don't have permission to verify providers", 403);
    }

    const provider = await prisma.user.findUnique({
      where: { id: providerId },
    });

    if (!provider) {
      throw new AppError("Provider not found", 404);
    }

    if (provider.role !== UserRole.PROVIDER) {
      throw new AppError("This user is not a provider", 400);
    }

    const { isVerified, reason } = data;

    if (isVerified === true) {
      if (provider.isVerified) {
        return { message: "Provider is already verified" };
      }

      await prisma.user.update({
        where: { id: providerId },
        data: {
          isVerified: true,
          reason: ""
        },
      });
      return { message: "Provider account verified successfully!" };
    } else {
      if(!reason){
        throw new AppError("Reason is required to Unverify provider account.")
      }
      await prisma.user.update({
        where: { id: providerId },
        data: {
          isVerified: false,
          verifiedDoc: null,
          reason: reason
        },
      });
      return { message: "Provider account unverified successfully!" };
    }
  }

  static async toggleProviderStatus(adminId, providerId, data) {
    const admin = await prisma.user.findUnique({
      where: { id: adminId },
    });

    if (!admin) {
      throw new AppError("Admin not found", 404);
    }

    if (admin.role !== UserRole.ADMIN) {
      throw new AppError(
        "You don't have permission to update provider status",
        403
      );
    }

    const provider = await prisma.user.findUnique({
      where: { id: providerId },
    });

    if (!provider) {
      throw new AppError("Provider not found", 404);
    }

    if (provider.role !== UserRole.PROVIDER) {
      throw new AppError("This user is not a provider", 400);
    }

    const { isActive, reason } = data;

    if (isActive === true) {
      if (provider.isActive) {
        return { message: "Provider is already active" };
      }

      await prisma.user.update({
        where: { id: providerId },
        data: {
          isActive: true,
          reason: ""
        },
      });
      return { message: "Provider account activated successfully!" };
    } else {
      if(!reason){
        throw new AppError("Reason is required to Deactivate provider account.")
      }
      await prisma.user.update({
        where: { id: providerId },
        data: {
          isActive: false,
          reason: reason
        },
      });
      return { message: "Provider account deactivated successfully!" };
    }
  }

  static async getDashboardStats() {
    const [
      totalUsers,
      totalProviders,
      totalCustomers,
      totalAdmins,
      totalBookings,
      pendingVerifications,
      recentBookings,
      revenue,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: UserRole.PROVIDER } }),
      prisma.user.count({ where: { role: UserRole.CUSTOMER } }),
      prisma.user.count({ where: { role: UserRole.ADMIN } }),
      prisma.booking.count(),
      prisma.user.count({
        where: {
          role: UserRole.PROVIDER,
          isVerified: false,
          isActive: true,
        },
      }),
      prisma.booking.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          customer: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
          provider: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
          service: {
            select: {
              title: true,
            },
          },
        },
      }),
      prisma.payment.aggregate({
        _sum: {
          amount: true,
        },
        where: {
          status: "PAID",
        },
      }),
    ]);

    return {
      users: {
        total: totalUsers,
        providers: totalProviders,
        customers: totalCustomers,
        admins: totalAdmins,
      },
      bookings: {
        total: totalBookings,
        recent: recentBookings,
      },
      pendingVerifications,
      revenue: revenue._sum.amount || 0,
      timestamp: new Date().toISOString(),
    };
  }
}

export default AdminService;
