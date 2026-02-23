import UserService from './user.service.js';
import ResponseHandler from '../utils/responseHandler.js';
import catchAsync from '../utils/catchAsync.js';
import appError from '../utils/appError.js';

class UserController {
  static register = catchAsync(async (req, res, next) => {
    const { user, token } = await UserService.register(req.body);
    
    ResponseHandler.success(res, { user, token }, 'User registered successfully', 201);
  });

  // Login user
  static login = catchAsync(async (req, res, next) => {
    const { email, password } = req.body;
    console.log("email, password", email, password)
    if (!email || !password) {
      return next(new appError('Please provide email and password', 400));
    }
    
    const { user, token } = await UserService.login(email, password);
    
    ResponseHandler.success(res, { user, token }, 'Logged in successfully');
  });

  // Get all users
  static getAllUsers = catchAsync(async (req, res, next) => {
    const result = await UserService.getAllUsers(req.query);
    
    ResponseHandler.paginated(
      res, 
      result.users, 
      req.query.page, 
      req.query.limit, 
      result.pagination.total,
      'Users fetched successfully'
    );
  });

  // Get user by ID
  static getUserById = catchAsync(async (req, res, next) => {
    const user = await UserService.getUserById(req.params.id);
    
    ResponseHandler.success(res, user, 'User fetched successfully');
  });

  // Update user
  static updateUser = catchAsync(async (req, res, next) => {
    const updatedUser = await UserService.updateUser(req.params.id, req.body, req.user);
    
    ResponseHandler.success(res, updatedUser, 'User updated successfully');
  });

  // Delete user (soft delete)
  static deleteUser = catchAsync(async (req, res, next) => {
    const result = await UserService.deleteUser(req.params.id, req.user);
    
    ResponseHandler.success(res, null, result.message);
  });

  // Get current user profile
  static getMe = catchAsync(async (req, res, next) => {
    const user = await UserService.getUserById(req.user.id);
    
    ResponseHandler.success(res, user, 'Profile fetched successfully');
  });

  // Update current user profile
  static updateMe = catchAsync(async (req, res, next) => {
    // Remove role from update data (can't change role directly)
    const { role, ...updateData } = req.body;
    
    const updatedUser = await UserService.updateUser(req.user.id, updateData, req.user);
    
    ResponseHandler.success(res, updatedUser, 'Profile updated successfully');
  });

  // Change password
  static changePassword = catchAsync(async (req, res, next) => {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return next(new appError('Please provide current and new password', 400));
    }
    
    const result = await UserService.changePassword(req.user.id, currentPassword, newPassword);
    
    ResponseHandler.success(res, null, result.message);
  });

  // Update provider profile
  static updateProviderProfile = catchAsync(async (req, res, next) => {
    if (req.user.role !== 'PROVIDER') {
      return next(new appError('Only providers can access this route', 403));
    }
    
    const updatedProfile = await UserService.updateProviderProfile(req.user.id, req.body);
    
    ResponseHandler.success(res, updatedProfile, 'Provider profile updated successfully');
  });

  // Admin: Toggle user status
  static toggleUserStatus = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const { isActive } = req.body;
    
    if (req.user.role !== 'ADMIN') {
      return next(new appError('Admin access required', 403));
    }
    
    const user = await UserService.updateUser(id, { isActive }, req.user);
    
    ResponseHandler.success(res, user, `User ${isActive ? 'activated' : 'deactivated'} successfully`);
  });
}

export default UserController;