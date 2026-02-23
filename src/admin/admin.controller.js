import AdminService from '../services/admin.service.js';
import ResponseHandler from '../utils/responseHandler.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/appError.js';

class AdminController {
  static register = catchAsync(async (req, res, next) => {
    const { user, token } = await AdminService.register(req.body);
    
    ResponseHandler.success(res, { user, token }, 'Admin registered successfully', 201);
  });

  static login = catchAsync(async (req, res, next) => {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return next(new AppError('Please provide email and password', 400));
    }
    
    const { user, token } = await AdminService.login(email, password);
    
    ResponseHandler.success(res, { user, token }, 'Logged in successfully');
  });

  static getMe = catchAsync(async (req, res, next) => {
    const user = await AdminService.getAdminById(req.user.id);
    
    ResponseHandler.success(res, user, 'Profile fetched successfully');
  });

  static updateMe = catchAsync(async (req, res, next) => {
    const { role, ...updateData } = req.body;
    
    const updatedUser = await AdminService.updateAdmin(req.user.id, updateData, req.user);
    
    ResponseHandler.success(res, updatedUser, 'Profile updated successfully');
  });

  static changePassword = catchAsync(async (req, res, next) => {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return next(new AppError('Please provide current and new password', 400));
    }
    
    const result = await AdminService.changePassword(req.user.id, currentPassword, newPassword);
    
    ResponseHandler.success(res, null, result.message);
  });

  static getAdminById = catchAsync(async (req, res, next) => {
    const user = await AdminService.getAdminById(req.params.id);
    
    ResponseHandler.success(res, user, 'Admin fetched successfully');
  });

  static updateAdmin = catchAsync(async (req, res, next) => {
    const updatedUser = await AdminService.updateAdmin(req.params.id, req.body, req.user);
    
    ResponseHandler.success(res, updatedUser, 'Admin updated successfully');
  });

  static deleteAdmin = catchAsync(async (req, res, next) => {
    const result = await AdminService.deleteAdmin(req.params.id, req.user);
    
    ResponseHandler.success(res, null, result.message);
  });

  static verifyProvider = catchAsync(async (req, res, next) => {
    const { providerId } = req.params;
    const result = await AdminService.verifyProviderProfile(req.user.id, providerId, req.body);
    
    ResponseHandler.success(res, null, result.message);
  });

  static toggleProviderStatus = catchAsync(async (req, res, next) => {
    const { providerId } = req.params;
    const result = await AdminService.toggleProviderStatus(req.user.id, providerId, req.body);
    
    ResponseHandler.success(res, null, result.message);
  });

  static getDashboardStats = catchAsync(async (req, res, next) => {
    const stats = await AdminService.getDashboardStats();
    
    ResponseHandler.success(res, stats, 'Dashboard statistics fetched successfully');
  });
}

export default AdminController;