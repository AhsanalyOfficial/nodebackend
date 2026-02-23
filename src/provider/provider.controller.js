// src/controllers/provider.controller.js
import ProviderService from '../services/provider.service.js';
import ResponseHandler from '../utils/responseHandler.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/appError.js';

class ProviderController {
  // Register new provider
  static register = catchAsync(async (req, res, next) => {
    const { user, token } = await ProviderService.register(req.body);
    
    ResponseHandler.success(res, { user, token }, 'Provider registered successfully', 201);
  });

  // Login provider
  static login = catchAsync(async (req, res, next) => {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return next(new AppError('Please provide email and password', 400));
    }
    
    const { user, token } = await ProviderService.login(email, password);
    
    ResponseHandler.success(res, { user, token }, 'Logged in successfully');
  });

  // Get current provider profile
  static getMe = catchAsync(async (req, res, next) => {
    const provider = await ProviderService.getProviderById(req.user.id);
    
    ResponseHandler.success(res, provider, 'Profile fetched successfully');
  });

  // Update current provider profile
  static updateMe = catchAsync(async (req, res, next) => {
    const { role, email, ...updateData } = req.body;
    
    const updatedUser = await ProviderService.updateProfile(req.user.id, updateData, req.user);
    
    ResponseHandler.success(res, updatedUser, 'Profile updated successfully');
  });

  // Change password
  static changePassword = catchAsync(async (req, res, next) => {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return next(new AppError('Please provide current and new password', 400));
    }
    
    const result = await ProviderService.changePassword(req.user.id, currentPassword, newPassword);
    
    ResponseHandler.success(res, null, result.message);
  });

  // Get provider by ID (public)
  static getProviderById = catchAsync(async (req, res, next) => {
    const provider = await ProviderService.getProviderById(req.params.id);
    
    ResponseHandler.success(res, provider, 'Provider details fetched successfully');
  });

  // Service management
  static addService = catchAsync(async (req, res, next) => {
    const service = await ProviderService.addService(req.user.id, req.body);
    
    ResponseHandler.success(res, service, 'Service added successfully', 201);
  });

  static updateService = catchAsync(async (req, res, next) => {
    const { serviceId } = req.params;
    const service = await ProviderService.updateService(req.user.id, serviceId, req.body);
    
    ResponseHandler.success(res, service, 'Service updated successfully');
  });

  static deleteService = catchAsync(async (req, res, next) => {
    const { serviceId } = req.params;
    const result = await ProviderService.deleteService(req.user.id, serviceId);
    
    ResponseHandler.success(res, null, result.message);
  });

  static getMyServices = catchAsync(async (req, res, next) => {
    const services = await ProviderService.getMyServices(req.user.id);
    
    ResponseHandler.success(res, services, 'Services fetched successfully');
  });

  // Booking management
  static getMyBookings = catchAsync(async (req, res, next) => {
    const result = await ProviderService.getMyBookings(req.user.id, req.query);
    
    ResponseHandler.paginated(
      res,
      result.bookings,
      req.query.page,
      req.query.limit,
      result.pagination.total,
      'Bookings fetched successfully'
    );
  });

  static updateBookingStatus = catchAsync(async (req, res, next) => {
    const { bookingId } = req.params;
    const { status, notes } = req.body;
    
    const booking = await ProviderService.updateBookingStatus(req.user.id, bookingId, status, notes);
    
    ResponseHandler.success(res, booking, `Booking ${status.toLowerCase()} successfully`);
  });

  // Availability management
  static setAvailability = catchAsync(async (req, res, next) => {
    const availability = await ProviderService.setAvailability(req.user.id, req.body);
    
    ResponseHandler.success(res, availability, 'Availability set successfully');
  });

  static getAvailability = catchAsync(async (req, res, next) => {
    const availability = await ProviderService.getAvailability(req.user.id);
    
    ResponseHandler.success(res, availability, 'Availability fetched successfully');
  });

  // Dashboard stats
  static getDashboardStats = catchAsync(async (req, res, next) => {
    const stats = await ProviderService.getDashboardStats(req.user.id);
    
    ResponseHandler.success(res, stats, 'Dashboard statistics fetched successfully');
  });
}

export default ProviderController;