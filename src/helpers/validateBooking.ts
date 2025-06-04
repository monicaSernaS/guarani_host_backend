import { PaymentStatus, BookingStatus } from "../@types/express/enums";

/**
 * Validates check-in and check-out dates.
 * Throws an error if validation fails.
 */
export const validateCheckInOut = (checkIn: string, checkOut: string): void => {
  const now = Date.now();
  const inDate = new Date(checkIn).getTime();
  const outDate = new Date(checkOut).getTime();

  if (isNaN(inDate) || isNaN(outDate)) {
    throw new Error("❗ Invalid date format");
  }

  if (inDate < now) {
    throw new Error("❗ Check-in date cannot be in the past");
  }

  if (outDate < now) {
    throw new Error("❗ Check-out date cannot be in the past");
  }

  if (inDate >= outDate) {
    throw new Error("❗ Check-out date must be after check-in date");
  }
};

/**
 * Validates that a string is a valid PaymentStatus enum value.
 * Throws an error if not.
 */
export const validatePaymentStatus = (status: any): void => {
  if (!Object.values(PaymentStatus).includes(status)) {
    throw new Error("❗ Invalid payment status value");
  }
};

/**
 * Validates that a string is a valid BookingStatus enum value.
 * Throws an error if not.
 */
export const validateBookingStatus = (status: any): void => {
  if (!Object.values(BookingStatus).includes(status)) {
    throw new Error("❗ Invalid booking status value");
  }
};

/**
 * Validates booking data before creation/update
 */
export const validateBookingData = (data: {
  checkIn: string;
  checkOut: string;
  guests: number;
  totalPrice: number;
  property?: string;
  tourPackage?: string;
}): void => {
  const { checkIn, checkOut, guests, totalPrice, property, tourPackage } = data;

  // Validate dates
  validateCheckInOut(checkIn, checkOut);

  // Validate guests
  if (!guests || guests <= 0 || guests > 20) {
    throw new Error("❗ Number of guests must be between 1 and 20");
  }

  // Validate total price
  if (!totalPrice || totalPrice <= 0) {
    throw new Error("❗ Total price must be greater than zero");
  }

  // Validate that either property or tourPackage is provided (but not both)
  if (!property && !tourPackage) {
    throw new Error("❗ Either property or tour package must be specified");
  }

  if (property && tourPackage) {
    throw new Error("❗ Cannot book both property and tour package in same booking");
  }
};

