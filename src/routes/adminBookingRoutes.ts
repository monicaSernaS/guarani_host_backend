import express from "express";
import { protect } from "../middlewares/protect";
import { checkRole } from "../middlewares/checkRole";
import {
  getAllBookingsForAdmin,
  getBookingById,
  updateBookingByAdmin,
  updateBookingPaymentStatus,
  deleteBookingByAdmin,
  filterBookingsByDateRange,
  filterBookingsByStatus,
  filterBookingsByType,
  filterBookingsByHost,
  exportBookingsToPDF
} from "../controllers/adminBookingController";

const router = express.Router();

/* ==================== ADMIN BOOKINGS ROUTES ==================== */
/* 
 * All routes in this file are protected and require:
 * 1. Valid JWT token (protect middleware)
 * 2. Admin role (checkRole("admin") middleware)
 * 
 * Admin has full CRUD access to ALL bookings in the system
 * regardless of which user created them or which host owns the property/tour
 */

// ====================== MAIN BOOKING OPERATIONS ======================

/**
 * @route   GET /api/admin/bookings
 * @desc    Admin retrieves all bookings in the system with pagination
 * @query   page=1&limit=10 (optional pagination parameters)
 * @access  Private (admin only)
 * @returns Paginated list of all bookings with user, property, and tour data populated
 */
router.get("/bookings", protect, checkRole("admin"), getAllBookingsForAdmin);

/**
 * @route   GET /api/admin/bookings/:id
 * @desc    Admin retrieves a specific booking by ID
 * @params  id - Booking ObjectId
 * @access  Private (admin only)
 * @returns Single booking with full population (user, property/tour details)
 */
router.get("/bookings/:id", protect, checkRole("admin"), getBookingById);

/**
 * @route   PATCH /api/admin/bookings/:id
 * @desc    Admin updates any booking (comprehensive update)
 * @params  id - Booking ObjectId
 * @body    {
 *            status?: BookingStatus,
 *            paymentStatus?: PaymentStatus,
 *            checkIn?: Date,
 *            checkOut?: Date,
 *            totalPrice?: number,
 *            guests?: number
 *          }
 * @access  Private (admin only)
 * @note    Sends email notification to user when status changes
 * @returns Updated booking object
 */
router.patch("/bookings/:id", protect, checkRole("admin"), updateBookingByAdmin);

/**
 * @route   PATCH /api/admin/bookings/:id/payment-status
 * @desc    Admin updates only the payment status of a specific booking
 * @params  id - Booking ObjectId
 * @body    { paymentStatus: PaymentStatus }
 * @access  Private (admin only)
 * @note    Sends email notification to user about payment status change
 * @returns Updated booking with payment status change details
 */
router.patch("/bookings/:id/payment-status", protect, checkRole("admin"), updateBookingPaymentStatus);

/**
 * @route   DELETE /api/admin/bookings/:id
 * @desc    Admin permanently deletes a booking from the system
 * @params  id - Booking ObjectId
 * @access  Private (admin only)
 * @warning This is a hard delete operation - booking will be permanently removed
 * @note    Sends cancellation email notification to the user
 * @returns Confirmation message with deleted booking ID
 */
router.delete("/bookings/:id", protect, checkRole("admin"), deleteBookingByAdmin);

// ====================== FILTERING OPERATIONS ======================

/**
 * @route   GET /api/admin/bookings/filter/date
 * @desc    Filter bookings by check-in and check-out date range
 * @query   from=YYYY-MM-DD&to=YYYY-MM-DD&page=1&limit=10
 * @access  Private (admin only)
 * @example /api/admin/bookings/filter/date?from=2024-01-01&to=2024-12-31&page=1&limit=20
 * @validation Both 'from' and 'to' dates are required and must be valid dates
 * @returns Filtered bookings within the specified date range with pagination
 */
router.get("/bookings/filter/date", protect, checkRole("admin"), filterBookingsByDateRange);

/**
 * @route   GET /api/admin/bookings/filter/status
 * @desc    Filter bookings by booking status and/or payment status
 * @query   status=pending|confirmed|cancelled|completed&paymentStatus=paid|pending|refunded|failed&page=1&limit=10
 * @access  Private (admin only)
 * @example /api/admin/bookings/filter/status?status=confirmed&paymentStatus=paid
 * @validation Status values must match enum values from BookingStatus and PaymentStatus
 * @returns Filtered bookings matching the specified status criteria
 */
router.get("/bookings/filter/status", protect, checkRole("admin"), filterBookingsByStatus);

/**
 * @route   GET /api/admin/bookings/filter/type
 * @desc    Filter bookings by type (property bookings vs tour bookings)
 * @query   type=property|tour&page=1&limit=10
 * @access  Private (admin only)
 * @example /api/admin/bookings/filter/type?type=property
 * @validation Type must be either 'property' or 'tour'
 * @returns Filtered bookings of the specified type (property or tour bookings)
 */
router.get("/bookings/filter/type", protect, checkRole("admin"), filterBookingsByType);

/**
 * @route   GET /api/admin/bookings/filter/host/:hostId
 * @desc    Filter bookings by a specific host (all bookings for host's properties and tours)
 * @params  hostId - Host user ObjectId
 * @query   status=pending|confirmed|cancelled|completed&paymentStatus=paid|pending|refunded|failed&type=property|tour&page=1&limit=10
 * @access  Private (admin only)
 * @example /api/admin/bookings/filter/host/60f7b8c4e4b0a0a4c8d4e4f4?status=confirmed&type=property
 * @validation hostId must be a valid ObjectId and exist as a host user
 * @returns All bookings for the specified host's properties and tours with optional additional filters
 */
router.get("/bookings/filter/host/:hostId", protect, checkRole("admin"), filterBookingsByHost);

// ====================== EXPORT OPERATIONS ======================

/**
 * @route   GET /api/admin/bookings/export/pdf
 * @desc    Export filtered bookings to PDF format for admin reporting
 * @query   from=YYYY-MM-DD&to=YYYY-MM-DD&status=pending&paymentStatus=paid&type=property|tour&hostId=ObjectId
 * @access  Private (admin only)
 * @example /api/admin/bookings/export/pdf?from=2024-01-01&to=2024-12-31&status=confirmed
 * @note    All query parameters are optional - without filters, exports all bookings
 * @validation Date formats must be valid, status/paymentStatus must match enum values
 * @returns PDF file download with filtered booking data
 * @features 
 *   - Professional PDF formatting with headers/footers
 *   - Applied filters shown in report metadata
 *   - Automatic pagination for large datasets
 *   - Complete booking details including user and property/tour information
 */
router.get("/bookings/export/pdf", protect, checkRole("admin"), exportBookingsToPDF);

/* ==================== ROUTE ORGANIZATION NOTES ==================== */
/*
 * ROUTE ORDERING EXPLANATION:
 * 
 * 1. Specific routes MUST come before parameterized routes
 *    - /bookings/filter/date comes before /bookings/:id
 *    - This prevents Express from treating "filter" as an :id parameter
 * 
 * 2. More specific paths come before less specific ones:
 *    - /bookings/:id/payment-status (more specific)
 *    - /bookings/:id (less specific)
 * 
 * 3. Filter routes are grouped together for better organization
 * 
 * 4. Export routes come last as they're typically less frequently used
 */

/* ==================== SECURITY & PERMISSIONS ==================== */
/*
 * ADMIN PERMISSIONS:
 * - Full read access to ALL bookings (any user, any host)
 * - Full write access to ALL bookings (update any field)
 * - Delete access to ALL bookings (permanent removal)
 * - Export access to ALL booking data
 * 
 * MIDDLEWARE STACK:
 * 1. protect: Validates JWT token and attaches user to request
 * 2. checkRole("admin"): Ensures user has admin role
 * 
 * ERROR HANDLING:
 * - All routes handle errors and return consistent JSON responses
 * - Email notifications are sent for booking changes
 * - Validation errors return 400 status with descriptive messages
 */

/* ==================== RESPONSE FORMAT STANDARD ==================== */
/*
 * All admin routes follow consistent response format:
 * {
 *   success: boolean,
 *   message: string,
 *   data?: {
 *     bookings?: Booking[],
 *     booking?: Booking,
 *     pagination?: {
 *       current: number,
 *       total: number,
 *       totalCount: number,
 *       hasNext: boolean,
 *       hasPrev: boolean
 *     },
 *     filters?: object
 *   }
 * }
 */

export default router;