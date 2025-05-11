import { PaymentStatus } from "../@types/express/enums";

/**
 * Validates check-in and check-out dates.
 * Throws an error if validation fails.
 */
const validateCheckInOut = (checkIn: string, checkOut: string): void => {
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

  if (inDate > outDate) {
    throw new Error("❗ Check-out date must be after check-in date");
  }
};

/**
 * Validates that a string is a valid PaymentStatus enum value.
 * Throws an error if not.
 */
const validatePaymentStatus = (status: any): void => {
  if (!Object.values(PaymentStatus).includes(status)) {
    throw new Error("❗ Invalid payment status value");
  }
};

export { validateCheckInOut, validatePaymentStatus };
