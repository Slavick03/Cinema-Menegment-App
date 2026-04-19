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

export const getPaymentMethodLabel = (paymentMethod, t) => {
  const labels = {
    apple_pay: t ? t("paymentApplePay") : "Apple Pay",
    google_pay: t ? t("paymentGooglePay") : "Google Pay",
    card: t ? t("paymentCard") : "Card Payment",
  };

  return labels[paymentMethod] || paymentMethod || (t ? t("ticketNotSpecified") : "Not specified");
};

export const formatTicketPrice = (value) => `$${Number(value || 0).toFixed(2)}`;

export const formatCalendarDate = (value, locale = undefined) => {
  const parsedDate = parseCalendarValue(value);

  if (!parsedDate) {
    return "";
  }

  return parsedDate.toLocaleDateString(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

export const formatTicketDate = (value, locale = undefined) => {
  const parsedDate = parseCalendarValue(value);

  if (!parsedDate) {
    return "";
  }

  return parsedDate.toLocaleString(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const getCustomerName = (booking, fallbackLabel = "Guest") => {
  const fullName =
    `${booking?.customerFirstName || ""} ${booking?.customerLastName || ""}`.trim();

  return fullName || booking?.user?.name || fallbackLabel;
};

export const getTicketQrValue = (
  booking,
  fallbacks = {
    ticketUnavailable: "ticket-unavailable",
    bookingId: "unknown-booking",
    movieTitle: "Movie unavailable",
    customerName: "Guest",
  }
) => {
  if (!booking) {
    return fallbacks.ticketUnavailable;
  }

  if (typeof booking.qrCodeValue === "string" && booking.qrCodeValue.trim()) {
    return booking.qrCodeValue.trim();
  }

  if (typeof booking.ticketCode === "string" && booking.ticketCode.trim()) {
    return booking.ticketCode.trim();
  }

  return JSON.stringify({
    bookingId: booking._id || fallbacks.bookingId,
    movieTitle: booking.movie?.title || fallbacks.movieTitle,
    date: booking.date || "",
    seatNumber: booking.seatNumber || "",
    customerName: getCustomerName(booking, fallbacks.customerName),
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
