import { Property } from "../models/PropertyModel";
import { Booking } from "../models/BookingModel";
import { BookingStatus, PropertyStatus } from "../@types/express/enums";

/**
 * Check if a property is available for given dates
 * @param propertyId - Property ID to check
 * @param checkIn - Desired check-in date
 * @param checkOut - Desired check-out date
 * @returns Boolean indicating availability
 */
export const isPropertyAvailable = async (
  propertyId: string,
  checkIn: Date,
  checkOut: Date
): Promise<boolean> => {
  try {
    // First check if property exists and is available
    const property = await Property.findById(propertyId);
    if (!property || property.status !== PropertyStatus.AVAILABLE) {
      return false;
    }

    // Check for overlapping bookings
    const overlappingBookings = await Booking.find({
      property: propertyId,
      status: { $in: [BookingStatus.CONFIRMED, BookingStatus.PENDING] },
      $or: [
        // Booking starts before our checkout and ends after our checkin
        {
          checkIn: { $lt: checkOut },
          checkOut: { $gt: checkIn }
        }
      ]
    });

    // Property is available if no overlapping bookings
    return overlappingBookings.length === 0;
  } catch (error) {
    console.error('Error checking availability:', error);
    return false;
  }
};

/**
 * Get all unavailable dates for a property in a date range
 * @param propertyId - Property ID
 * @param startDate - Start of range to check
 * @param endDate - End of range to check
 * @returns Array of unavailable date ranges
 */
export const getUnavailableDates = async (
  propertyId: string,
  startDate: Date,
  endDate: Date
): Promise<Array<{ checkIn: Date; checkOut: Date }>> => {
  try {
    const bookings = await Booking.find({
      property: propertyId,
      status: { $in: [BookingStatus.CONFIRMED, BookingStatus.PENDING] },
      checkIn: { $lt: endDate },
      checkOut: { $gt: startDate }
    }).select('checkIn checkOut');

    return bookings.map(booking => ({
      checkIn: booking.checkIn,
      checkOut: booking.checkOut
    }));
  } catch (error) {
    console.error('Error getting unavailable dates:', error);
    return [];
  }
};

/**
 * Get available properties for given dates
 * @param checkIn - Desired check-in date
 * @param checkOut - Desired check-out date
 * @param city - Optional city filter
 * @returns Array of available properties
 */
export const getAvailableProperties = async (
  checkIn: Date,
  checkOut: Date,
  city?: string
): Promise<any[]> => {
  try {
    // Get all properties that are available status
    const query: any = { status: PropertyStatus.AVAILABLE };
    if (city) {
      query.city = new RegExp(city, 'i'); // Case insensitive
    }

    const properties = await Property.find(query).populate('host', 'firstName lastName');

    // Filter out properties with conflicting bookings
    const availableProperties = [];

    for (const property of properties) {
      const isAvailable = await isPropertyAvailable(property.id, checkIn, checkOut);
      if (isAvailable) {
        availableProperties.push(property);
      }
    }

    return availableProperties;
  } catch (error) {
    console.error('Error getting available properties:', error);
    return [];
  }
};

/**
 * Validate that booking dates don't conflict with existing bookings
 * @param propertyId - Property ID
 * @param checkIn - Check-in date
 * @param checkOut - Check-out date
 * @param excludeBookingId - Optional booking ID to exclude (for updates)
 * @returns Boolean indicating if dates are valid
 */
export const validateBookingDates = async (
  propertyId: string,
  checkIn: Date,
  checkOut: Date,
  excludeBookingId?: string
): Promise<{ valid: boolean; message?: string }> => {
  try {
    // Basic date validation
    if (checkIn >= checkOut) {
      return { valid: false, message: 'Check-out must be after check-in' };
    }

    if (checkIn < new Date()) {
      return { valid: false, message: 'Check-in cannot be in the past' };
    }

    // Check property exists and is available
    const property = await Property.findById(propertyId);
    if (!property) {
      return { valid: false, message: 'Property not found' };
    }

    if (property.status !== PropertyStatus.AVAILABLE) {
      return { valid: false, message: 'Property is not available' };
    }

    // Check for conflicting bookings
    const query: any = {
      property: propertyId,
      status: { $in: [BookingStatus.CONFIRMED, BookingStatus.PENDING] },
      $or: [
        {
          checkIn: { $lt: checkOut },
          checkOut: { $gt: checkIn }
        }
      ]
    };

    // Exclude current booking if updating
    if (excludeBookingId) {
      query._id = { $ne: excludeBookingId };
    }

    const conflictingBookings = await Booking.find(query);

    if (conflictingBookings.length > 0) {
      return { 
        valid: false, 
        message: 'Property is not available for the selected dates' 
      };
    }

    return { valid: true };
  } catch (error) {
    console.error('Error validating booking dates:', error);
    return { valid: false, message: 'Error validating dates' };
  }
};

