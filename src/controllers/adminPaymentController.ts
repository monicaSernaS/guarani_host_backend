import { Request, Response } from "express";
import { Booking } from "../models/BookingModel";
import { Parser } from "json2csv";
import PDFDocument from "pdfkit";

/**
 * @desc    Admin exports all bookings as CSV
 * @route   GET /api/admin/bookings/export/csv
 * @access  Private (admin only)
 */
export const exportBookingsAsCSV = async (req: Request, res: Response): Promise<void> => {
  try {
    const bookings = await Booking.find()
      .populate("user", "firstName lastName email")
      .populate("property", "title city")
      .populate("tourPackage", "title price")
      .lean();

  // Ensure that bookings are not empty
    if (bookings.length === 0) {
      res.status(404).json({ message: "❗ No bookings found to export" });
      return;
    }

    const data = bookings.map((b: any) => ({
      BookingID: b._id.toString(),
      User: `${b.user?.firstName || "-"} ${b.user?.lastName || "-"}`,
      Email: b.user?.email || "-",
      Type: b.property ? "Property" : "Tour",
      Reference: b.property?.title || b.tourPackage?.title || "N/A",
      City: b.property?.city || "N/A",
      Guests: b.guests,
      CheckIn: new Date(b.checkIn).toISOString().split("T")[0],
      CheckOut: new Date(b.checkOut).toISOString().split("T")[0],
      Status: b.status,
      PaymentStatus: b.paymentStatus,
      Total: b.totalPrice,
    }));

    const parser = new Parser();
    const csv = parser.parse(data);

    res.header("Content-Type", "text/csv");
    res.attachment("bookings-report.csv");
    res.send(csv);
  } catch (error) {
    console.error("❌ Error exporting bookings as CSV:", error);
    res.status(500).json({ message: "❌ Failed to export CSV" });
  }
};

/**
 * @desc    Admin exports all bookings as PDF
 * @route   GET /api/admin/bookings/export/pdf
 * @access  Private (admin only)
 */
export const exportBookingsAsPDF = async (req: Request, res: Response): Promise<void> => {
  try {
    const bookings = await Booking.find()
      .populate("user", "firstName lastName email")
      .populate("property", "title city")
      .populate("tourPackage", "title price")
      .lean();

  // Ensure that bookings are not empty
    if (bookings.length === 0) {
     res.status(404).json({ message: "❗ No bookings found to export" });
     return;
    }

    const doc = new PDFDocument({ margin: 30, size: "A4" });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=bookings-report.pdf");

    doc.pipe(res);

    doc.fontSize(20).text("Bookings Report", { align: "center" });
    doc.moveDown();

    doc.fontSize(10).font("Helvetica-Bold");
    doc.text("User", 30, doc.y, { continued: true, width: 100 });
    doc.text("Type", 130, doc.y, { continued: true, width: 50 });
    doc.text("Reference", 180, doc.y, { continued: true, width: 100 });
    doc.text("CheckIn", 280, doc.y, { continued: true, width: 70 });
    doc.text("CheckOut", 350, doc.y, { continued: true, width: 70 });
    doc.text("Guests", 420, doc.y, { continued: true, width: 50 });
    doc.text("Status", 470, doc.y, { continued: true, width: 50 });
    doc.text("Payment", 520, doc.y);
    doc.moveDown(0.5);
    doc.font("Helvetica");

    bookings.forEach((b: any) => {
      doc.text(`${b.user?.firstName || "-"} ${b.user?.lastName || "-"}`, 30, doc.y, { continued: true, width: 100 });
      doc.text(b.property ? "Property" : "Tour", 130, doc.y, { continued: true, width: 50 });
      doc.text(b.property?.title || b.tourPackage?.title || "-", 180, doc.y, { continued: true, width: 100 });
      doc.text(new Date(b.checkIn).toISOString().split("T")[0], 280, doc.y, { continued: true, width: 70 });
      doc.text(new Date(b.checkOut).toISOString().split("T")[0], 350, doc.y, { continued: true, width: 70 });
      doc.text(String(b.guests), 420, doc.y, { continued: true, width: 50 });
      doc.text(b.status, 470, doc.y, { continued: true, width: 50 });
      doc.text(b.paymentStatus, 520, doc.y);
      doc.moveDown(0.5);
    });

    doc.end();
  } catch (error) {
    console.error("❌ Error exporting bookings as PDF:", error);
    res.status(500).json({ message: "❌ Failed to export PDF" });
  }
};
