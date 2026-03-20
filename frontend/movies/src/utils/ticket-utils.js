import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const parseCalendarValue = (value) => {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (typeof value === "string") {
    const trimmedValue = value.trim();
    const dateOnlyMatch = trimmedValue.match(/^(\d{4})-(\d{2})-(\d{2})$/);

    if (dateOnlyMatch) {
      const [, year, month, day] = dateOnlyMatch;
      return new Date(Number(year), Number(month) - 1, Number(day));
    }

    const parsedDate = new Date(trimmedValue);
    return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
  }

  const parsedDate = new Date(value);
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
};

export const paymentMethodLabels = {
  apple_pay: "Apple Pay",
  google_pay: "Google Pay",
  card: "Card Payment",
};

export const formatTicketPrice = (value) => `$${Number(value || 0).toFixed(2)}`;

export const formatCalendarDate = (value) => {
  const parsedDate = parseCalendarValue(value);

  if (!parsedDate) {
    return "";
  }

  return parsedDate.toLocaleDateString([], {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

export const formatTicketDate = (value) => {
  const parsedDate = parseCalendarValue(value);

  if (!parsedDate) {
    return "";
  }

  return parsedDate.toLocaleString([], {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const getCustomerName = (booking) => {
  const fullName =
    `${booking?.customerFirstName || ""} ${booking?.customerLastName || ""}`.trim();

  return fullName || booking?.user?.name || "Guest";
};

export const getTicketQrValue = (booking) => {
  if (!booking) {
    return "ticket-unavailable";
  }

  if (typeof booking.qrCodeValue === "string" && booking.qrCodeValue.trim()) {
    return booking.qrCodeValue.trim();
  }

  if (typeof booking.ticketCode === "string" && booking.ticketCode.trim()) {
    return booking.ticketCode.trim();
  }

  return JSON.stringify({
    bookingId: booking._id || "unknown-booking",
    movieTitle: booking.movie?.title || "Movie unavailable",
    date: booking.date || "",
    seatNumber: booking.seatNumber || "",
    customerName: getCustomerName(booking) || "Guest",
  });
};

export const downloadTicketPdf = async (element, fileName) => {
  if (!element) {
    return;
  }

  const canvas = await html2canvas(element, {
    backgroundColor: "#08111b",
    scale: 2,
  });

  const imageData = canvas.toDataURL("image/png");
  const pdf = new jsPDF("p", "mm", "a4");
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 10;
  const imageWidth = pageWidth - margin * 2;
  const imageHeight = (canvas.height * imageWidth) / canvas.width;
  const fittedHeight = Math.min(imageHeight, pageHeight - margin * 2);

  pdf.addImage(imageData, "PNG", margin, margin, imageWidth, fittedHeight);
  pdf.save(fileName);
};
