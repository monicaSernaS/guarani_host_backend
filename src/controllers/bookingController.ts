/**
 * @file bookingController.ts
 * @description USER booking operations - users can book any host's properties/tours
 */

import { Request, Response } from "express";
import { Booking } from "../models/BookingModel";
import { IUser } from "../models/User";
import { uploadImagesToCloudinary } from "../helpers/uploadImagesToCloudinary";
import { deleteImageFromCloudinary } from "../helpers/deleteImageFromCloudinary";
import { sendEmail } from "../utils/emailService";
import { BookingStatus, PaymentStatus } from "../@types/express/enums";
import { validateBookingDates } from "../helpers/availabilityHelper";
import { validateBookingData } from "../helpers/validateBooking";
import { Types } from "mongoose";

/**
 * @desc    Create booking for ANY property/tour (user can book from any host)
 * @route   POST /api/bookings
 * @access  Private (user)
 */
export const createBooking = async (req: Request, res: Response): Promise<void> => {
  try {
    const { property, tourPackage, checkIn, checkOut, guests, totalPrice, paymentDetails } = req.body;
    const userId = req.user?._id;

    if (!userId) {
      res.status(401).json({ 
        success: false, 
        message: "🚫 Unauthorized" 
      });
      return;
    }

    // Validate basic booking data (works for both properties AND tours)
    validateBookingData({ 
      checkIn, 
      checkOut, 
      guests, 
      totalPrice, 
      property, 
      tourPackage 
    });

    // Validate availability for properties (tours don't need availability check in the same way)
    if (property) {
      const availabilityValidation = await validateBookingDates(
        property,
        new Date(checkIn),
        new Date(checkOut)
      );

      if (!availabilityValidation.valid) {
        res.status(400).json({ 
          success: false,
          message: availabilityValidation.message || "Property not available for selected dates"
        });
        return;
      }
    }

    // For tours, we could add capacity validation here if needed
    // Tours typically don't have date conflicts like properties do

    // Build booking data object
    const bookingData: any = {
      user: userId,
      checkIn: new Date(checkIn),
      checkOut: new Date(checkOut),
      guests,
      totalPrice,
      paymentStatus: PaymentStatus.PENDING,
      paymentDetails: paymentDetails?.trim() || "",
      status: BookingStatus.PENDING,
    };

    // Add property OR tourPackage (mutually exclusive)
    if (property) bookingData.property = property;
    if (tourPackage) bookingData.tourPackage = tourPackage;

    // Handle payment images upload if provided
    if (req.files && "paymentImage" in req.files) {
      const paymentImageFiles = req.files["paymentImage"] as Express.Multer.File[];
      const imageUrls = await uploadImagesToCloudinary(paymentImageFiles);
      bookingData.paymentImages = imageUrls;
    }

    // Create and save the booking
    const newBooking = new Booking(bookingData);
    await newBooking.save();

    // Populate the booking for response
    await newBooking.populate([
      { path: 'property', select: 'title city location pricePerNight host' },
      { path: 'tourPackage', select: 'title description price duration host' },
      { path: 'user', select: 'firstName lastName email phone' }
    ]);

    // // Send confirmation email to user
    // if (req.user?.email) {
    //   const bookingType = property ? 'property' : 'tour';
    //   const bookingTitle = property ? 
    //     (newBooking.property as any)?.title : 
    //     (newBooking.tourPackage as any)?.title;

    //   await sendEmail(
    //     req.user.email,
    //     "Booking Confirmation - GuaraniHost",
    //     `
    //     <h2>✅ Booking Confirmed!</h2>
    //     <p>Hello ${req.user.firstName},</p>
    //     <p>Your ${bookingType} booking for <strong>${bookingTitle}</strong> has been successfully created.</p>
    //     <p><strong>Booking Details:</strong></p>
    //     <ul>
    //       <li>Check-in: ${new Date(checkIn).toLocaleDateString()}</li>
    //       <li>Check-out: ${new Date(checkOut).toLocaleDateString()}</li>
    //       <li>Guests: ${guests}</li>
    //       <li>Total Price: $${totalPrice}</li>
    //       <li>Status: ${BookingStatus.PENDING}</li>
    //       <li>Payment Status: ${PaymentStatus.PENDING}</li>
    //     </ul>
    //     <p>Your booking is currently pending confirmation from the host. You will receive another email once it's confirmed.</p>
    //     <br>
    //     <p>Best regards,<br>GuaraniHost Team</p>
    //     `
    //   );
    // }

    res.status(201).json({
      success: true,
      message: `✅ ${property ? 'Property' : 'Tour'} booking created successfully`,
      data: { booking: newBooking }
    });
  } catch (error: any) {
    console.error("❌ Error creating booking:", error);
    res.status(400).json({ 
      success: false,
      message: error.message || "❌ Server error" 
    });
  }
};

/**
 * @desc    Get user's OWN bookings (properties and tours they've booked)
 * @route   GET /api/bookings
 * @access  Private (user)
 */
export const getUserBookings = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?._id;

    if (!userId) {
      res.status(401).json({ 
        success: false, 
        message: "🚫 Unauthorized" 
      });
      return;
    }

    // Get pagination parameters
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    // Get all bookings made BY this user (regardless of which host's property/tour)
    const [bookings, totalCount] = await Promise.all([
      Booking.find({ user: userId })
        .populate('user', 'firstName lastName email phone')
        .populate('property', 'title city address pricePerNight imageUrls host')
        .populate('tourPackage', 'title description price duration host')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Booking.countDocuments({ user: userId })
    ]);

    res.status(200).json({
      success: true,
      message: "✅ Your bookings retrieved successfully",
      data: {
        bookings,
        pagination: {
          current: page,
          total: Math.ceil(totalCount / limit),
          totalCount,
          hasNext: page * limit < totalCount,
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    console.error("❌ Error fetching user bookings:", error);
    res.status(500).json({ 
      success: false, 
      message: "❌ Server error" 
    });
  }
};

/**
 * @desc    Get user's specific booking by ID
 * @route   GET /api/bookings/:id
 * @access  Private (user)
 */
export const getUserBookingById = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?._id;
    const bookingId = req.params.id;

    if (!userId) {
      res.status(401).json({ 
        success: false, 
        message: "🚫 Unauthorized" 
      });
      return;
    }

    // Find booking that belongs to the user
    const booking = await Booking.findOne({ 
      _id: bookingId, 
      user: userId // Only their own bookings
    })
      .populate('user', 'firstName lastName email phone')
      .populate('property', 'title city address pricePerNight imageUrls host')
      .populate('tourPackage', 'title description price duration host');

    if (!booking) {
      res.status(404).json({ 
        success: false,
        message: "🚫 Booking not found or access denied" 
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "✅ Booking retrieved successfully",
      data: { booking }
    });
  } catch (error) {
    console.error("❌ Error fetching booking:", error);
    res.status(500).json({ 
      success: false, 
      message: "❌ Server error" 
    });
  }
};

/**
 * @desc    Update user's OWN booking (limited fields)
 * @route   PATCH /api/bookings/:id
 * @access  Private (user)
 */
export const updateUserBooking = async (req: Request, res: Response): Promise<void> => {
  try {
    const { checkIn, checkOut, guests, paymentDetails, removedPaymentImages } = req.body;
    const userId = req.user?._id;
    const bookingId = req.params.id;

    if (!userId) {
      res.status(401).json({ 
        success: false, 
        message: "🚫 Unauthorized" 
      });
      return;
    }

    // Find booking that belongs to the user
    const booking = await Booking.findOne({ 
      _id: bookingId, 
      user: userId 
    }).populate("user", "firstName lastName email");

    if (!booking) {
      res.status(404).json({ 
        success: false,
        message: "🚫 Booking not found or access denied" 
      });
      return;
    }

    // Check if booking can be modified
    if (booking.status === BookingStatus.CANCELLED || booking.status === BookingStatus.COMPLETED) {
      res.status(400).json({ 
        success: false,
        message: "❗ Cannot modify cancelled or completed bookings" 
      });
      return;
    }

    // Validate dates if changing
    if (checkIn && checkOut) {
      validateBookingData({ 
        checkIn, 
        checkOut, 
        guests: guests || booking.guests, 
        totalPrice: booking.totalPrice,
        property: booking.property?.toString(),
        tourPackage: booking.tourPackage?.toString()
      });
      
      // Validate availability for properties if dates are changing
      if (booking.property && checkIn && checkOut) {
        const availabilityValidation = await validateBookingDates(
          booking.property.toString(),
          new Date(checkIn),
          new Date(checkOut),
          booking.id 
        );

        if (!availabilityValidation.valid) {
          res.status(400).json({ 
            success: false,
            message: availabilityValidation.message || "Property not available for selected dates"
          });
          return;
        }
      }

      // For tour packages, we might add different validation logic here if needed
    }

    // Update allowed fields (users can't change status/paymentStatus)
    if (checkIn) booking.checkIn = new Date(checkIn);
    if (checkOut) booking.checkOut = new Date(checkOut);
    if (guests) booking.guests = guests;
    if (paymentDetails !== undefined) booking.paymentDetails = paymentDetails?.trim();

    // Handle payment images removal
    if (Array.isArray(removedPaymentImages)) {
      for (const imageUrl of removedPaymentImages) {
        try {
          await deleteImageFromCloudinary(imageUrl);
          booking.paymentImages = booking.paymentImages?.filter((url) => url !== imageUrl) || [];
        } catch (error) {
          console.error(`Failed to delete image ${imageUrl}:`, error);
          // Continue with other operations even if image deletion fails
        }
      }
    }

    // Handle new payment images upload
    if (req.files && "paymentImage" in req.files) {
      const newPaymentImageFiles = req.files["paymentImage"] as Express.Multer.File[];
      const newImageUrls = await uploadImagesToCloudinary(newPaymentImageFiles);
      booking.paymentImages = [...(booking.paymentImages || []), ...newImageUrls];
    }

    await booking.save();

    // Populate for response
    await booking.populate([
      { path: 'property', select: 'title city address pricePerNight imageUrls host' },
      { path: 'tourPackage', select: 'title description price duration host' }
    ]);

    // // Send update notification email
    // const user = booking.user as unknown as IUser;
    // if (user?.email) {
    //   const bookingType = booking.property ? 'property' : 'tour';
    //   const bookingTitle = booking.property ? 
    //     (booking.property as any)?.title : 
    //     (booking.tourPackage as any)?.title;

    //   await sendEmail(
    //     user.email,
    //     "Booking Updated - GuaraniHost",
    //     `
    //     <h2>📝 Booking Updated</h2>
    //     <p>Hello ${user.firstName},</p>
    //     <p>Your ${bookingType} booking for <strong>${bookingTitle}</strong> has been successfully updated.</p>
    //     <p><strong>Updated Details:</strong></p>
    //     <ul>
    //       <li>Check-in: ${booking.checkIn.toLocaleDateString()}</li>
    //       <li>Check-out: ${booking.checkOut.toLocaleDateString()}</li>
    //       <li>Guests: ${booking.guests}</li>
    //       <li>Total Price: $${booking.totalPrice}</li>
    //     </ul>
    //     <p>Your host will be notified of these changes.</p>
    //     <br>
    //     <p>Best regards,<br>GuaraniHost Team</p>
    //     `
    //   );
    // }

    res.status(200).json({
      success: true,
      message: "✅ Booking updated successfully",
      data: { booking }
    });
  } catch (error: any) {
    console.error("❌ Error updating booking:", error);
    res.status(500).json({ 
      success: false,
      message: error.message || "❌ Server error" 
    });
  }
};

/**
 * @desc    Cancel user's OWN booking
 * @route   DELETE /api/bookings/:id
 * @access  Private (user)
 */
export const cancelUserBooking = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?._id;
    const bookingId = req.params.id;
    const { reason } = req.body || {}; // Optional cancellation reason - handle undefined body

    // 1. Validate user authentication
    if (!userId) {
      res.status(401).json({ 
        success: false, 
        message: "🚫 Unauthorized" 
      });
      return;
    }

    // 2. Validate booking ID format
    if (!Types.ObjectId.isValid(bookingId)) {
      res.status(400).json({ 
        success: false,
        message: "❌ Invalid booking ID format" 
      });
      return;
    }

    console.log(`🔍 Searching for booking: ${bookingId} for user: ${userId}`);

    // 3. Find the booking belonging to the authenticated user
    const booking = await Booking.findOne({ 
      _id: bookingId, 
      user: userId 
    }).populate("user", "firstName lastName email");

    if (!booking) {
      console.log(`❌ Booking ${bookingId} not found for user ${userId}`);
      res.status(404).json({ 
        success: false,
        message: "🚫 Booking not found or access denied" 
      });
      return;
    }

    console.log(`✅ Found booking: ${booking._id}, Status: ${booking.status}`);

    // 4. Validate that booking can be cancelled
    if (booking.status === BookingStatus.CANCELLED) {
      res.status(400).json({ 
        success: false,
        message: "❗ Booking is already cancelled" 
      });
      return;
    }

    if (booking.status === BookingStatus.COMPLETED) {
      res.status(400).json({ 
        success: false,
        message: "❗ Cannot cancel completed bookings" 
      });
      return;
    }

    console.log(`🔄 Cancelling booking ${booking._id}`);

    // 5. Update booking status to cancelled
    booking.status = BookingStatus.CANCELLED;
    booking.cancelledAt = new Date();
    booking.cancellationReason = reason || "Cancelled by guest";

    // 6. If booking was paid, mark payment as refunded
    if (booking.paymentStatus === PaymentStatus.PAID) {
      booking.paymentStatus = PaymentStatus.REFUNDED;
      console.log(`💰 Payment status changed to REFUNDED for booking ${booking._id}`);
    }

    // 7. Save changes to database
    await booking.save();
    console.log(`✅ Booking ${booking._id} successfully cancelled`);

    // 8. Populate related data for response
    await booking.populate([
      { path: 'property', select: 'title city address pricePerNight imageUrls host' },
      { path: 'tourPackage', select: 'title description price duration host' }
    ]);

    // 9. Optional: Send cancellation confirmation email
    // const user = booking.user as unknown as IUser;
    // if (user?.email) {
    //   const bookingType = booking.property ? 'property' : 'tour';
    //   const bookingTitle = booking.property ? 
    //     (booking.property as any)?.title : 
    //     (booking.tourPackage as any)?.title;

    //   await sendEmail(
    //     user.email,
    //     "Booking Cancelled - GuaraniHost",
    //     `
    //     <h2>❌ Booking Cancelled</h2>
    //     <p>Hello ${user.firstName},</p>
    //     <p>Your ${bookingType} booking for <strong>${bookingTitle}</strong> has been cancelled.</p>
    //     <p><strong>Booking Details:</strong></p>
    //     <ul>
    //       <li>Check-in: ${booking.checkIn.toLocaleDateString()}</li>
    //       <li>Check-out: ${booking.checkOut.toLocaleDateString()}</li>
    //       <li>Guests: ${booking.guests}</li>
    //       <li>Total Price: $${booking.totalPrice}</li>
    //       <li>Cancellation Reason: ${booking.cancellationReason}</li>
    //     </ul>
    //     ${booking.paymentStatus === PaymentStatus.REFUNDED ? 
    //       '<p><strong>Refund Information:</strong> Your payment will be refunded according to our refund policy.</p>' : 
    //       ''
    //     }
    //     <p>The host has been notified of this cancellation.</p>
    //     <br>
    //     <p>Best regards,<br>GuaraniHost Team</p>
    //     `
    //   );
    // }

    res.status(200).json({
      success: true,
      message: "✅ Booking cancelled successfully",
      data: { 
        bookingId: booking._id,
        cancellationReason: booking.cancellationReason,
        refundStatus: booking.paymentStatus === PaymentStatus.REFUNDED ? 'Refund initiated' : 'No refund applicable'
      }
    });

  } catch (error: any) {
    // 10. Enhanced error logging
    console.error("❌ Error cancelling booking:", {
      error: error.message,
      stack: error.stack,
      bookingId: req.params.id,
      userId: req.user?._id
    });
    
    res.status(500).json({ 
      success: false, 
      message: "❌ Server error",
      // Show error details in development environment
      ...(process.env.NODE_ENV === 'development' && { 
        error: error.message 
      })
    });
  }
};
/**
 * @desc    Filter user's OWN bookings
 * @route   GET /api/bookings/filter
 * @access  Private (user)
 */
export const filterUserBookings = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?._id;
    const { status, paymentStatus, type, from, to, page = 1, limit = 10 } = req.query;

    if (!userId) {
      res.status(401).json({ 
        success: false, 
        message: "🚫 Unauthorized" 
      });
      return;
    }

    // Build query for user's own bookings
    const query: any = { user: userId };

    // Apply filters
    if (status) query.status = status;
    if (paymentStatus) query.paymentStatus = paymentStatus;
    
    if (type) {
      if (type === 'property') {
        query.property = { $exists: true, $ne: null };
        query.tourPackage = { $exists: false };
      } else if (type === 'tour') {
        query.tourPackage = { $exists: true, $ne: null };
        query.property = { $exists: false };
      }
    }

    if (from && to) {
      query.checkIn = { $gte: new Date(from as string) };
      query.checkOut = { $lte: new Date(to as string) };
    }

    // Pagination setup
    const skip = (Number(page) - 1) * Number(limit);

    // Execute queries in parallel
    const [bookings, totalCount] = await Promise.all([
      Booking.find(query)
        .populate('property', 'title city address pricePerNight imageUrls host')
        .populate('tourPackage', 'title description price duration host')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Booking.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      message: "✅ Your bookings filtered successfully",
      data: {
        bookings,
        pagination: {
          current: Number(page),
          total: Math.ceil(totalCount / Number(limit)),
          totalCount,
          hasNext: Number(page) * Number(limit) < totalCount,
          hasPrev: Number(page) > 1
        },
        filters: { status, paymentStatus, type, from, to }
      }
    });
  } catch (error) {
    console.error("❌ Error filtering user bookings:", error);
    res.status(500).json({ 
      success: false, 
      message: "❌ Server error" 
    });
  }
};