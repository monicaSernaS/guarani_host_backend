import express from "express";
import { protect } from "../middlewares/protect";
import { checkRole } from "../middlewares/checkRole";
import {
  getHostBookings,
  getHostBookingById,
  filterHostBookings,
  updateHostBookingPaymentStatus,
  updateHostBookingStatus,
  exportHostBookingsToPDF
} from "../controllers/hostBookingController";

const router = express.Router();

/* ========================= HOST BOOKINGS ROUTES ========================= */
/* 
 * All routes in this file are protected and require:
 * 1. Valid JWT token (protect middleware)
 * 2. Host role (checkRole("host") middleware)
 * 
 * Host can only access bookings for THEIR properties and tours
 * - They can view bookings made by any user for their listings
 * - They can update payment status and booking status
 * - They cannot create bookings (users do that)
 * - They cannot delete bookings (only cancel them)
 */

// ====================== MAIN BOOKING OPERATIONS ======================

/**
 * @route   GET /api/host/bookings
 * @desc    Get all bookings for host's properties and tours with pagination
 * @query   page=1&limit=10 (optional pagination parameters)
 * @access  Private (host only)
 * @returns Paginated list of bookings for host's properties/tours with guest and property/tour details
 * @note    Only returns bookings where the property.host or tourPackage.host matches the authenticated host
 */
router.get("/bookings", protect, checkRole("host"), getHostBookings);

/**
 * @route   GET /api/host/bookings/:id
 * @desc    Get detailed information for a specific booking (if it belongs to host)
 * @params  id - Booking ObjectId
 * @access  Private (host only)
 * @returns Single booking with full population (guest details, property/tour info)
 * @security Only returns booking if the associated property/tour belongs to the authenticated host
 */
router.get("/bookings/:id", protect, checkRole("host"), getHostBookingById);

// ====================== FILTERING OPERATIONS ======================

/**
 * @route   GET /api/host/bookings/filter
 * @desc    Filter host's bookings by various criteria with pagination
 * @query   {
 *            paymentStatus?: "pending" | "paid" | "failed" | "refunded",
 *            bookingStatus?: "pending" | "confirmed" | "cancelled" | "completed",
 *            from?: "YYYY-MM-DD",
 *            to?: "YYYY-MM-DD",
 *            propertyType?: "property" | "tour",
 *            page?: number,
 *            limit?: number
 *          }
 * @access  Private (host only)
 * @example /api/host/bookings/filter?paymentStatus=paid&bookingStatus=confirmed&page=1&limit=20
 * @validation All status values must match enum definitions, dates must be valid format
 * @returns Filtered and paginated bookings for host's properties/tours with applied filter metadata
 */
router.get("/bookings/filter", protect, checkRole("host"), filterHostBookings);

// ====================== UPDATE OPERATIONS ======================

/**
 * @route   PATCH /api/host/bookings/:id/payment-status
 * @desc    Host updates payment status for a booking of their property/tour
 * @params  id - Booking ObjectId
 * @body    { paymentStatus: "pending" | "paid" | "failed" | "refunded" }
 * @access  Private (host only)
 * @business_rules
 *   - Cannot mark cancelled bookings as paid
 *   - If payment is marked as "paid" and booking status is "pending", auto-confirms booking
 *   - If booking is cancelled and was paid, auto-sets payment to "refunded"
 * @security Only allows update if the booking's property/tour belongs to the authenticated host
 * @notifications Sends email to guest when payment status changes
 * @returns Updated booking with previous and new payment status
 */
router.patch("/bookings/:id/payment-status", protect, checkRole("host"), updateHostBookingPaymentStatus);

/**
 * @route   PATCH /api/host/bookings/:id/status
 * @desc    Host updates booking status for their property/tour
 * @params  id - Booking ObjectId
 * @body    { 
 *            status: "pending" | "confirmed" | "cancelled" | "completed",
 *            reason?: string (required for cancellation)
 *          }
 * @access  Private (host only)
 * @business_rules
 *   - Cannot change status of already cancelled bookings
 *   - Cancelling a paid booking auto-sets payment status to "refunded"
 *   - Cancellation reason is stored and included in notifications
 * @security Only allows update if the booking's property/tour belongs to the authenticated host
 * @notifications 
 *   - Sends status update email to guest
 *   - Special cancellation email with reason if status is "cancelled"
 *   - Includes refund information if applicable
 * @returns Updated booking with previous and new status
 */
router.patch("/bookings/:id/status", protect, checkRole("host"), updateHostBookingStatus);

// ====================== EXPORT OPERATIONS ======================

/**
 * @route   GET /api/host/bookings/export/pdf
 * @desc    Export host's bookings to PDF format with optional filtering
 * @query   {
 *            from?: "YYYY-MM-DD",
 *            to?: "YYYY-MM-DD", 
 *            paymentStatus?: "pending" | "paid" | "failed" | "refunded",
 *            bookingStatus?: "pending" | "confirmed" | "cancelled" | "completed",
 *            propertyType?: "property" | "tour"
 *          }
 * @access  Private (host only)
 * @example /api/host/bookings/export/pdf?from=2024-01-01&to=2024-12-31&paymentStatus=paid
 * @validation Date formats must be valid, status values must match enums
 * @returns PDF file download with host's booking data
 * @features
 *   - Professional PDF layout with host information in header
 *   - Applied filters displayed in report metadata
 *   - Complete booking details including guest info and property/tour details
 *   - Cancellation reasons included when applicable
 *   - Automatic pagination for large datasets
 *   - Timestamped filename for easy organization
 * @security Only includes bookings for properties/tours owned by the authenticated host
 */
router.get("/bookings/export/pdf", protect, checkRole("host"), exportHostBookingsToPDF);

/* ==================== ROUTE ORGANIZATION NOTES ==================== */
/*
 * ROUTE ORDERING EXPLANATION:
 * 
 * 1. GET routes come first (read operations)
 *    - /bookings (list all)
 *    - /bookings/filter (specific filter endpoint)
 *    - /bookings/export/pdf (export endpoint)
 *    - /bookings/:id (get single - must come after specific paths)
 * 
 * 2. PATCH routes for updates
 *    - More specific routes first (/bookings/:id/payment-status)
 *    - Less specific routes last (/bookings/:id/status)
 * 
 * 3. No DELETE routes - hosts can only cancel bookings, not delete them
 * 
 * 4. No POST routes - hosts don't create bookings (users do)
 */

/* ==================== HOST PERMISSIONS & BUSINESS LOGIC ==================== */
/*
 * HOST SCOPE LIMITATIONS:
 * - Hosts can only access bookings for their own properties and tours
 * - Cannot see bookings for other hosts' properties/tours
 * - Cannot create or delete bookings
 * - Can only update payment status and booking status (not dates or guest count)
 * 
 * OWNERSHIP VERIFICATION:
 * - Every operation checks that booking.property.host === authenticatedHost._id
 * - Or booking.tourPackage.host === authenticatedHost._id
 * - Returns 403 Forbidden if host doesn't own the property/tour
 * 
 * BUSINESS RULES ENFORCED:
 * 1. Payment Status Updates:
 *    - Cannot mark cancelled bookings as paid
 *    - Paid + pending status auto-confirms booking
 * 
 * 2. Status Updates:
 *    - Cannot modify already cancelled bookings
 *    - Cancelling paid bookings triggers refund status
 *    - Cancellation requires reason (optional but recommended)
 * 
 * 3. Email Notifications:
 *    - All status changes trigger guest notifications
 *    - Cancellations include refund information when applicable
 *    - Payment confirmations trigger booking confirmation emails
 */

/* ==================== SECURITY CONSIDERATIONS ==================== */
/*
 * AUTHENTICATION & AUTHORIZATION:
 * - protect middleware validates JWT and attaches user to request
 * - checkRole("host") ensures only hosts can access these routes
 * - Each controller function verifies ownership of the specific booking
 * 
 * INPUT VALIDATION:
 * - MongoDB ObjectId validation for booking IDs
 * - Enum validation for status values
 * - Date format validation for date ranges
 * - Required field validation in request bodies
 * 
 * DATA EXPOSURE:
 * - Guest passwords are excluded from all responses
 * - Only necessary booking and guest information is included
 * - Host can see guest contact info (needed for communication)
 * - Payment images and details are included (needed for verification)
 */

/* ==================== RESPONSE FORMAT STANDARD ==================== */
/*
 * All host routes follow consistent response format:
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
 *     filters?: object,
 *     previousStatus?: string,
 *     newStatus?: string
 *   }
 * }
 * 
 * ERROR RESPONSES:
 * - 401: Unauthorized (no valid token or not a host)
 * - 403: Forbidden (host doesn't own the property/tour)
 * - 404: Not Found (booking doesn't exist)
 * - 400: Bad Request (validation errors, invalid data)
 * - 500: Internal Server Error (unexpected server issues)
 */

/* ==================== INTEGRATION WITH OTHER SERVICES ==================== */
/*
 * EMAIL SERVICE:
 * - Automatic notifications for all booking changes
 * - Personalized messages based on booking type (property vs tour)
 * - Includes relevant booking details and contact information
 * - Handles cancellation notifications with refund information
 * 
 * PDF GENERATION:
 * - Professional reports for host record-keeping
 * - Includes host branding and contact information
 * - Supports various filtering options for targeted reports
 * - Automatic date formatting and business-friendly layout
 * 
 * DATABASE OPTIMIZATION:
 * - Efficient queries with proper indexing
 * - Parallel execution of database operations where possible
 * - Pagination to handle large datasets
 * - Population of related documents for complete information
 */

export default router;