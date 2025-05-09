import { Request, Response, NextFunction } from "express";
import { Booking } from "../models/BookingModel";  

/**
 * Middleware to ensure the user is the owner of the booking or admin.
 */
export const checkBookingOwnership = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
 
  const booking = await Booking.findById(req.params.id);
    if (!booking) {
    res.status(404).json({ message: "🚫 Booking not found" });
    return;
  }

  if (
    req.user?.role !== "admin" &&
    booking.user.toString() !== req.user?._id.toString()
  ) {
    res.status(403).json({ message: "🚫 Not authorized to modify this booking" });
    return;
  }

  next();
};
