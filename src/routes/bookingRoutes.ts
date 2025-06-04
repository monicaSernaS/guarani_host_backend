import express from "express";
import { protect } from "../middlewares/protect";
import { checkRole } from "../middlewares/checkRole";
import multer from "multer";
import {
  createBooking,
  getUserBookings,
  getUserBookingById,
  updateUserBooking,
  cancelUserBooking,
  filterUserBookings
} from "../controllers/bookingController";

const router = express.Router();

// Configure multer for file uploads (payment images)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit per file
    files: 5 // Maximum 5 files
  },
  fileFilter: (req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      // Use Error object properly for multer
      const error = new Error('Only image files are allowed for payment proof') as any;
      error.code = 'INVALID_FILE_TYPE';
      cb(error, false);
    }
  }
});

/* ========================= USER BOOKINGS ROUTES ========================= */
/* 
 * All routes in this file are protected and require:
 * 1. Valid JWT token (protect middleware)
 * 2. User role (checkRole("user") middleware)
 * 
 * Users can:
 * - Book ANY host's properties and tours
 * - View and manage ONLY their own bookings
 * - Update limited fields of their bookings
 * - Cancel their bookings (sets status to cancelled, doesn't delete)
 * 
 * Users CANNOT:
 * - View other users' bookings
 * - Modify booking status or payment status (only hosts/admins can)
 * - Delete bookings permanently (only cancel them)
 * - Access bookings they didn't create
 */

// ====================== MAIN BOOKING OPERATIONS ======================

/**
 * @route   POST /api/bookings
 * @desc    Create a new booking for any property or tour
 * @body    {
 *            property?: ObjectId,           // Either property OR tourPackage required
 *            tourPackage?: ObjectId,        // Either property OR tourPackage required
 *            checkIn: "YYYY-MM-DD",         // Check-in date
 *            checkOut: "YYYY-MM-DD",        // Check-out date
 *            guests: number,                // Number of guests (1-20)
 *            totalPrice: number,            // Total booking price
 *            paymentDetails?: string        // Optional payment notes/details
 *          }
 * @files   paymentImage?: File[]           // Optional payment proof images (max 5, 5MB each)
 * @access  Private (user only)
 * @validation
 *   - Either property OR tourPackage must be provided (mutually exclusive)
 *   - Check-in must be in the future
 *   - Check-out must be after check-in
 *   - Guests must be between 1 and 20
 *   - Total price must be positive
 *   - Property/tour must be available for the selected dates
 * @business_logic
 *   - Validates availability against existing bookings
 *   - Sets initial status to "pending" and payment status to "pending"
 *   - Uploads payment images to Cloudinary if provided
 *   - Sends confirmation email to user
 * @returns Created booking with populated property/tour and user details
 */
router.post("/", 
  protect, 
  checkRole("user"), 
  upload.fields([{ name: "paymentImage", maxCount: 5 }]),
  createBooking
);

/**
 * @route   GET /api/bookings
 * @desc    Get user's own bookings with pagination
 * @query   page=1&limit=10 (optional pagination parameters)
 * @access  Private (user only)
 * @returns Paginated list of user's bookings with property/tour details
 * @security Only returns bookings where booking.user matches the authenticated user
 * @note Includes bookings for properties/tours from any host, but only user's own bookings
 */
router.get("/", protect, checkRole("user"), getUserBookings);

/**
 * @route   GET /api/bookings/filter
 * @desc    Filter user's own bookings by various criteria
 * @query   {
 *            status?: "pending" | "confirmed" | "cancelled" | "completed",
 *            paymentStatus?: "pending" | "paid" | "failed" | "refunded",
 *            type?: "property" | "tour",
 *            from?: "YYYY-MM-DD",
 *            to?: "YYYY-MM-DD",
 *            page?: number,
 *            limit?: number
 *          }
 * @access  Private (user only)
 * @example /api/bookings/filter?status=confirmed&type=property&page=1&limit=20
 * @validation Status values must match enum definitions, dates must be valid format
 * @returns Filtered and paginated bookings for the authenticated user only
 * @security Only filters among user's own bookings, cannot see other users' bookings
 */
router.get("/filter", protect, checkRole("user"), filterUserBookings);

/**
 * @route   GET /api/bookings/:id
 * @desc    Get detailed information for a specific booking (user's own only)
 * @params  id - Booking ObjectId
 * @access  Private (user only)
 * @returns Single booking with full population (property/tour details, user info)
 * @security Only returns booking if booking.user matches the authenticated user
 * @error   404 if booking doesn't exist or doesn't belong to the user
 */
router.get("/:id", protect, checkRole("user"), getUserBookingById);

// ====================== UPDATE OPERATIONS ======================

/**
 * @route   PATCH /api/bookings/:id
 * @desc    Update user's own booking (limited fields only)
 * @params  id - Booking ObjectId
 * @body    {
 *            checkIn?: "YYYY-MM-DD",        // New check-in date
 *            checkOut?: "YYYY-MM-DD",       // New check-out date
 *            guests?: number,               // New guest count
 *            paymentDetails?: string,       // Updated payment details
 *            removedPaymentImages?: string[] // URLs of images to remove
 *          }
 * @files   paymentImage?: File[]           // New payment images to add
 * @access  Private (user only)
 * @restrictions
 *   - Cannot update cancelled or completed bookings
 *   - Cannot change booking status or payment status (host/admin only)
 *   - Cannot change property/tour (would need new booking)
 *   - Cannot change user (obviously)
 * @validation
 *   - If dates change, validates new availability
 *   - Excludes current booking from availability check
 *   - Validates guest count and date logic
 * @business_logic
 *   - Removes specified payment images from Cloudinary
 *   - Uploads new payment images if provided
 *   - Sends update notification email to user
 *   - Host receives notification of changes (via separate system)
 * @returns Updated booking with populated details
 */
router.patch("/:id", 
  protect, 
  checkRole("user"), 
  upload.fields([{ name: "paymentImage", maxCount: 5 }]),
  updateUserBooking
);

// ====================== CANCELLATION OPERATIONS ======================

/**
 * @route   DELETE /api/bookings/:id
 * @desc    Cancel user's own booking (soft delete - sets status to cancelled)
 * @params  id - Booking ObjectId
 * @body    { reason?: string }             // Optional cancellation reason
 * @access  Private (user only)
 * @restrictions
 *   - Cannot cancel already cancelled bookings
 *   - Cannot cancel completed bookings
 *   - Can only cancel own bookings
 * @business_logic
 *   - Sets status to "cancelled" instead of deleting record
 *   - Sets cancellation timestamp and reason
 *   - If booking was paid, automatically sets payment status to "refunded"
 *   - Sends cancellation email to user with refund information
 *   - Notifies host of cancellation (via separate system)
 * @refund_policy
 *   - Paid bookings automatically marked for refund
 *   - Actual refund processing handled separately
 *   - Refund terms depend on host's cancellation policy
 * @returns Confirmation with booking ID and cancellation details
 */
router.delete("/:id", protect, checkRole("user"), cancelUserBooking);

/* ==================== ROUTE ORGANIZATION NOTES ==================== */
/*
 * ROUTE ORDERING EXPLANATION:
 * 
 * 1. POST route first (creation)
 * 2. GET routes for listing and filtering
 *    - /filter comes before /:id to avoid conflicts
 *    - / (list all) comes before specific routes
 * 3. GET route for single booking
 * 4. PATCH route for updates
 * 5. DELETE route for cancellation (last)
 * 
 * This ordering prevents Express from matching "filter" as a booking ID parameter.
 */

/* ==================== USER PERMISSIONS & LIMITATIONS ==================== */
/*
 * USER SCOPE:
 * - Can book ANY host's properties/tours (cross-host booking allowed)
 * - Can only view/modify their OWN bookings
 * - Cannot see other users' bookings
 * - Cannot directly modify status/payment status
 * 
 * FIELD RESTRICTIONS:
 * - Can update: dates, guest count, payment details, payment images
 * - Cannot update: status, payment status, property/tour, user
 * - Cannot update cancelled or completed bookings
 * 
 * BUSINESS RULES:
 * - Booking creation requires either property OR tour (mutually exclusive)
 * - Availability validation for properties (tours may have different logic)
 * - Payment images uploaded to Cloudinary with automatic cleanup
 * - Email notifications for all booking lifecycle events
 * - Soft deletion (cancellation) instead of hard deletion
 */

/* ==================== PAYMENT IMAGES JUSTIFICATION ==================== */
/*
 * WHY PAYMENT IMAGES ARE INCLUDED:
 * 
 * 1. REGIONAL PAYMENT METHODS:
 *    - Many countries (like Paraguay) rely heavily on bank transfers
 *    - Mobile banking receipts and transfer confirmations are common
 *    - Credit card processing may be limited or expensive
 * 
 * 2. MANUAL VERIFICATION WORKFLOW:
 *    - Host can verify payment before confirming booking
 *    - Reduces payment disputes and chargebacks
 *    - Provides audit trail for accounting
 * 
 * 3. TRUST & TRANSPARENCY:
 *    - Visual proof builds trust between guests and hosts
 *    - Guests can show they've paid, hosts can verify amount
 *    - Reduces communication overhead ("Did you receive my payment?")
 * 
 * 4. BUSINESS MODEL FLEXIBILITY:
 *    - Supports both automated (Stripe/PayPal) and manual payment flows
 *    - Allows for local payment methods not supported by international processors
 *    - Can accommodate cash deposits, local bank transfers, etc.
 * 
 * 5. OPTIONAL FEATURE:
 *    - Payment images are optional (not required fields)
 *    - System works without them for automated payment flows
 *    - Provides option for hosts who prefer manual verification
 * 
 * BEST PRACTICES IMPLEMENTED:
 * - Images stored securely in Cloudinary (not local filesystem)
 * - File type and size validation
 * - Automatic cleanup when removed
 * - Optional field - doesn't break user experience if not used
 * - Clear documentation of purpose and usage
 */

/* ==================== FILE UPLOAD CONFIGURATION ==================== */
/*
 * MULTER SETUP:
 * - Memory storage (files held in RAM temporarily)
 * - 5MB limit per file, maximum 5 files per request
 * - Image files only (validated by MIME type)
 * - Field name: "paymentImage" for payment proof uploads
 * 
 * CLOUDINARY INTEGRATION:
 * - Automatic upload of payment images
 * - URL storage in database
 * - Automatic cleanup when images are removed
 * - Error handling for failed uploads/deletions
 */

/* ==================== SECURITY CONSIDERATIONS ==================== */
/*
 * AUTHENTICATION & AUTHORIZATION:
 * - protect middleware validates JWT and attaches user to request
 * - checkRole("user") ensures only users can access these routes
 * - Each controller function verifies booking ownership for modifications
 * 
 * DATA VALIDATION:
 * - Booking data validation before creation/update
 * - Date range validation and business logic checks
 * - File type and size validation for uploads
 * - MongoDB ObjectId validation for booking IDs
 * 
 * OWNERSHIP VERIFICATION:
 * - Users can only access bookings where booking.user === authenticatedUser._id
 * - No cross-user access allowed (users cannot see others' bookings)
 * - Property/tour owners managed separately (host routes)
 */

/* ==================== EMAIL NOTIFICATIONS ==================== */
/*
 * AUTOMATED EMAILS:
 * - Booking confirmation on creation
 * - Update notifications when booking details change
 * - Cancellation emails with refund information
 * - Host notifications handled separately
 * 
 * EMAIL CONTENT:
 * - Personalized with user name and booking details
 * - Includes relevant dates, prices, and status information
 * - Different templates for properties vs tours
 * - Refund status included in cancellation emails
 */

/* ==================== AVAILABILITY & VALIDATION ==================== */
/*
 * PROPERTY AVAILABILITY:
 * - Checks for date conflicts with existing bookings
 * - Validates property status and availability
 * - Excludes current booking from updating dates
 * 
 * TOUR AVAILABILITY:
 * - Different validation logic (capacity-based rather than date-exclusive)
 * - May allow multiple bookings for same dates depending on tour capacity
 * - Future enhancement: tour-specific availability rules
 * 
 * BUSINESS VALIDATION:
 * - Date logic (check-out after check-in, future dates)
 * - Guest count limits (1-20 guests)
 * - Price validation (positive values)
 * - Status-based restrictions (no updates to completed/cancelled)
 */

/* ==================== ERROR HANDLING ==================== */
/*
 * HTTP STATUS CODES:
 * - 200: Successful operations
 * - 201: Successful booking creation
 * - 400: Validation errors, business rule violations
 * - 401: Authentication required
 * - 403: Access denied (wrong role)
 * - 404: Booking not found or access denied
 * - 500: Server errors, unexpected issues
 * 
 * ERROR RESPONSE FORMAT:
 * {
 *   success: false,
 *   message: "Descriptive error message"
 * }
 * 
 * SUCCESS RESPONSE FORMAT:
 * {
 *   success: true,
 *   message: "Success message",
 *   data: {
 *     booking?: Booking | Booking[],
 *     pagination?: PaginationInfo,
 *     filters?: AppliedFilters
 *   }
 * }
 */

export default router;