import prisma from "../prisma/prisma.js";
import AppError from "../utils/appError.js";
import JWTConfig from "../config/jwt.config.js";
import dotenv from "dotenv";
import { UserRole, BookingStatus, PaymentStatus } from "@prisma/client";
import { comparePassword, hashPassword } from "../utils/bcrypt.utils.js";

dotenv.config();

class ProviderService {
  static async register(userData) {
    const { firstName, lastName, email, password, phone, bio, experience } = userData;

    const existingUser = await prisma.user.findUnique({
      where: { email: email },
    });

    if (existingUser) {
      throw new AppError("Email already in use", 400);
    }

    const hashedPassword = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        password: hashedPassword,
        phone,
        role: UserRole.PROVIDER,
        isActive: true,
        isVerified: false,
        bio: bio || null,
        experience: experience ? parseInt(experience) : null,
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
      throw new AppError("Invalid email address", 401);
    }

    if (user.role !== UserRole.PROVIDER) {
      throw new AppError("Access denied. Provider only.", 403);
    }

    if (!user.isActive) {
      throw new AppError(
        "Your account has been deactivated. Contact admin.",
        403
      );
    }

    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      throw new AppError("Invalid password", 401);
    }

    const { password: _, ...userWithoutPassword } = user;

    const token = JWTConfig.generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    return { user: userWithoutPassword, token };
  }

  static async getProviderById(id) {
    const provider = await prisma.user.findUnique({
      where: { id },
      select: {
        services: {
          where: { isActive: true },
          include: {
            category: true
          }
        },
        reviewsReceived: {
          take: 10,
          orderBy: { createdAt: "desc" },
          include: {
            reviewer: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatar: true
              }
            },
            booking: {
              select: {
                id: true,
                bookingNumber: true
              }
            }
          }
        },
        availabilities: {
          orderBy: [
            { specificDate: 'asc' },
            { dayOfWeek: 'asc' }
          ]
        },
        providerBookings: {
          take: 5,
          orderBy: { createdAt: "desc" },
          include: {
            customer: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatar: true
              }
            },
            service: {
              select: {
                id: true,
                title: true,
                price: true
              }
            }
          }
        },
        _count: {
          select: {
            services: true,
            providerBookings: true,
            reviewsReceived: true,
            availabilities: true
          }
        }
      },
    });

    if (!provider) {
      throw new AppError("Provider not found", 404);
    }

    if (provider.reviewsReceived && provider.reviewsReceived.length > 0) {
      const avgRating = provider.reviewsReceived.reduce((acc, review) => acc + review.rating, 0) / provider.reviewsReceived.length;
      provider.averageRating = parseFloat(avgRating.toFixed(1));
    }

    return provider;
  }

  static async updateProfile(id, updateData, requestingUser) {
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      throw new AppError("Provider not found", 404);
    }

    if (existingUser.role !== UserRole.PROVIDER) {
      throw new AppError("This is not a provider account", 400);
    }

    if (requestingUser.id !== id) {
      throw new AppError("You can only update your own profile", 403);
    }

    const { password, role, email, ...safeUpdateData } = updateData;

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
        bio: true,
        experience: true,
        address: true,
        city: true,
        state: true,
        zipCode: true,
        updatedAt: true
      }
    });

    return updatedUser;
  }

  static async changePassword(userId, currentPassword, newPassword) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppError("User not found", 404);
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

  static async addService(providerId, serviceData) {
    const { title, description, price, duration, categoryId } = serviceData;

    const provider = await prisma.user.findUnique({
      where: { id: providerId }
    });

    if (!provider || provider.role !== UserRole.PROVIDER) {
      throw new AppError("Provider not found", 404);
    }

    const category = await prisma.serviceCategory.findUnique({
      where: { id: categoryId }
    });

    if (!category) {
      throw new AppError("Service category not found", 404);
    }

    const existingService = await prisma.service.findFirst({
      where: {
        providerId,
        title: {
          equals: title,
          mode: 'insensitive'
        }
      }
    });

    if (existingService) {
      throw new AppError("You already have a service with this title", 400);
    }

    const service = await prisma.service.create({
      data: {
        title,
        description,
        price: parseFloat(price),
        duration: duration ? parseInt(duration) : null,
        providerId,
        categoryId,
        isActive: true
      },
      include: {
        category: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    return service;
  }

  static async updateService(providerId, serviceId, updateData) {
    const service = await prisma.service.findFirst({
      where: {
        id: serviceId,
        providerId
      }
    });

    if (!service) {
      throw new AppError("Service not found or you don't have permission", 404);
    }

    const { id, providerId: _, ...safeUpdateData } = updateData;

    const updatedService = await prisma.service.update({
      where: { id: serviceId },
      data: safeUpdateData,
      include: {
        category: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    return updatedService;
  }

  // Delete service (soft delete)
  static async deleteService(providerId, serviceId) {
    // Check if service exists and belongs to provider
    const service = await prisma.service.findFirst({
      where: {
        id: serviceId,
        providerId
      }
    });

    if (!service) {
      throw new AppError("Service not found or you don't have permission", 404);
    }

    // Soft delete by deactivating
    await prisma.service.update({
      where: { id: serviceId },
      data: { isActive: false }
    });

    return { message: "Service deleted successfully" };
  }

  // Get provider's services
  static async getMyServices(providerId) {
    const services = await prisma.service.findMany({
      where: {
        providerId,
        isActive: true
      },
      include: {
        category: {
          select: {
            id: true,
            name: true
          }
        },
        _count: {
          select: {
            bookings: true,
            reviews: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return services;
  }

  // Get provider's bookings
  static async getMyBookings(providerId, query) {
    const { status, page = 1, limit = 10 } = query;
    
    const skip = (page - 1) * limit;
    const take = parseInt(limit);

    const where = {
      providerId
    };

    if (status) {
      where.status = status;
    }

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        skip,
        take,
        include: {
          customer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
              phone: true,
              address: true
            }
          },
          service: {
            select: {
              id: true,
              title: true,
              price: true,
              duration: true
            }
          },
          payment: {
            select: {
              status: true,
              amount: true,
              paymentMethod: true
            }
          },
          review: true
        },
        orderBy: { scheduledDate: 'desc' }
      }),
      prisma.booking.count({ where })
    ]);

    return {
      bookings,
      pagination: {
        page: parseInt(page),
        limit: take,
        total,
        pages: Math.ceil(total / take)
      }
    };
  }

  // Update booking status
  static async updateBookingStatus(providerId, bookingId, status, notes) {
    // Check if booking exists and belongs to provider
    const booking = await prisma.booking.findFirst({
      where: {
        id: bookingId,
        providerId
      },
      include: {
        customer: true
      }
    });

    if (!booking) {
      throw new AppError("Booking not found or you don't have permission", 404);
    }

    // Validate status transition
    const validTransitions = {
      [BookingStatus.PENDING]: [BookingStatus.CONFIRMED, BookingStatus.REJECTED],
      [BookingStatus.CONFIRMED]: [BookingStatus.IN_PROGRESS, BookingStatus.CANCELLED],
      [BookingStatus.IN_PROGRESS]: [BookingStatus.COMPLETED],
      [BookingStatus.COMPLETED]: [],
      [BookingStatus.REJECTED]: [],
      [BookingStatus.CANCELLED]: []
    };

    if (!validTransitions[booking.status].includes(status)) {
      throw new AppError(`Cannot transition from ${booking.status} to ${status}`, 400);
    }

    // Update booking
    const updateData = {
      status,
      providerNotes: notes || booking.providerNotes
    };

    // Set timestamps based on status
    if (status === BookingStatus.CONFIRMED) {
      updateData.confirmedAt = new Date();
    } else if (status === BookingStatus.IN_PROGRESS) {
      updateData.startedAt = new Date();
    } else if (status === BookingStatus.COMPLETED) {
      updateData.completedAt = new Date();
    } else if (status === BookingStatus.REJECTED || status === BookingStatus.CANCELLED) {
      updateData.cancelledAt = new Date();
      updateData.cancelledBy = UserRole.PROVIDER;
      updateData.cancelReason = notes || "Cancelled by provider";
    }

    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: updateData,
      include: {
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true
          }
        },
        service: {
          select: {
            id: true,
            title: true,
            price: true
          }
        }
      }
    });

    return updatedBooking;
  }

  // Set availability
  static async setAvailability(providerId, availabilityData) {
    const { dayOfWeek, startTime, endTime, isAvailable, specificDate } = availabilityData;

    // Check if availability already exists
    const existingAvailability = await prisma.availability.findFirst({
      where: {
        providerId,
        ...(specificDate ? { specificDate: new Date(specificDate) } : { dayOfWeek })
      }
    });

    let availability;

    if (existingAvailability) {
      // Update existing
      availability = await prisma.availability.update({
        where: { id: existingAvailability.id },
        data: {
          startTime,
          endTime,
          isAvailable: isAvailable !== undefined ? isAvailable : true
        }
      });
    } else {
      // Create new
      availability = await prisma.availability.create({
        data: {
          providerId,
          dayOfWeek: specificDate ? null : dayOfWeek,
          startTime,
          endTime,
          isAvailable: isAvailable !== undefined ? isAvailable : true,
          specificDate: specificDate ? new Date(specificDate) : null
        }
      });
    }

    return availability;
  }

  // Get availability
  static async getAvailability(providerId) {
    const availability = await prisma.availability.findMany({
      where: { providerId },
      orderBy: [
        { specificDate: 'asc' },
        { dayOfWeek: 'asc' }
      ]
    });

    return availability;
  }

  // Get dashboard stats for provider
  static async getDashboardStats(providerId) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalBookings,
      pendingBookings,
      confirmedBookings,
      completedBookings,
      cancelledBookings,
      todayBookings,
      upcomingBookings,
      totalRevenue,
      recentBookings,
      services
    ] = await Promise.all([
      prisma.booking.count({ where: { providerId } }),
      prisma.booking.count({ where: { providerId, status: BookingStatus.PENDING } }),
      prisma.booking.count({ where: { providerId, status: BookingStatus.CONFIRMED } }),
      prisma.booking.count({ where: { providerId, status: BookingStatus.COMPLETED } }),
      prisma.booking.count({ 
        where: { 
          providerId, 
          status: { in: [BookingStatus.CANCELLED, BookingStatus.REJECTED] }
        } 
      }),
      prisma.booking.count({ 
        where: { 
          providerId, 
          scheduledDate: {
            gte: today,
            lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
          }
        } 
      }),
      prisma.booking.count({ 
        where: { 
          providerId, 
          scheduledDate: { gt: new Date() },
          status: { in: [BookingStatus.CONFIRMED, BookingStatus.PENDING] }
        } 
      }),
      prisma.payment.aggregate({
        where: {
          booking: { providerId },
          status: PaymentStatus.PAID
        },
        _sum: { amount: true }
      }),
      prisma.booking.findMany({
        where: { providerId },
        take: 5,
        orderBy: { scheduledDate: 'asc' },
        include: {
          customer: {
            select: {
              firstName: true,
              lastName: true,
              avatar: true
            }
          },
          service: {
            select: {
              title: true,
              price: true
            }
          }
        }
      }),
      prisma.service.count({
        where: { providerId, isActive: true }
      })
    ]);

    // Calculate average rating
    const reviews = await prisma.review.aggregate({
      where: { providerId },
      _avg: { rating: true },
      _count: true
    });

    return {
      bookings: {
        total: totalBookings,
        pending: pendingBookings,
        confirmed: confirmedBookings,
        completed: completedBookings,
        cancelled: cancelledBookings,
        today: todayBookings,
        upcoming: upcomingBookings
      },
      revenue: totalRevenue._sum.amount || 0,
      services: services,
      rating: {
        average: reviews._avg.rating || 0,
        total: reviews._count
      },
      recentBookings,
      timestamp: new Date().toISOString()
    };
  }
}

export default ProviderService;