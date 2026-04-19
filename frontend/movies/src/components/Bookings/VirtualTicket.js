import { Box, Button, Chip, Typography } from "@mui/material";
import React, { useRef, useState } from "react";
import QRCode from "react-qr-code";
import {
  downloadTicketPdf,
  formatTicketDate,
  formatTicketPrice,
  getPaymentMethodLabel,
  getCustomerName,
  getTicketQrValue,
} from "../../utils/ticket-utils";
import { useI18n } from "../../i18n/LanguageContext";

const VirtualTicket = ({ booking, title, showDownload = true }) => {
  const ticketRef = useRef(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const { locale, t } = useI18n();
  const qrValue = getTicketQrValue(booking, {
    ticketUnavailable: t("fallbackTicketUnavailable"),
    bookingId: "unknown-booking",
    movieTitle: t("fallbackMovieUnavailable"),
    customerName: t("fallbackGuest"),
  });

  const handleDownload = async () => {
    try {
      setIsDownloading(true);
      await downloadTicketPdf(
        ticketRef.current,
        `${(booking.movie?.title || "ticket").replace(/\s+/g, "-").toLowerCase()}-${booking.ticketCode || "booking"}.pdf`
      );
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Box>
      <Box
        ref={ticketRef}
        sx={{
          p: 3,
          borderRadius: 6,
          border: "1px solid rgba(255,255,255,0.08)",
          background:
            "linear-gradient(135deg, rgba(14,25,39,0.98), rgba(7,12,20,0.98))",
          boxShadow: "0 24px 60px rgba(0,0,0,0.28)",
        }}
      >
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", md: "center" }}
          flexDirection={{ xs: "column", md: "row" }}
          gap={1.5}
        >
          <Box>
            <Typography
              sx={{
                color: "#6dd3ff",
                textTransform: "uppercase",
                letterSpacing: "0.16em",
                fontSize: "0.76rem",
                fontWeight: 800,
              }}
            >
              {title || t("ticketVirtualTitle")}
            </Typography>
            <Typography
              variant="h5"
              sx={{ mt: 1, fontFamily: "'Space Grotesk', sans-serif" }}
            >
              {booking.movie?.title}
            </Typography>
          </Box>
          <Chip
            label={booking.paymentStatus === "paid" ? t("ticketStatusPaid") : t("ticketStatusPending")}
            sx={{
              bgcolor: "rgba(109,211,255,0.14)",
              color: "#d9f8ff",
              border: "1px solid rgba(109,211,255,0.24)",
              fontWeight: 700,
            }}
          />
        </Box>

        <Box
          mt={3}
          display="grid"
          gridTemplateColumns={{ xs: "1fr", md: "1.2fr 0.8fr" }}
          gap={3}
          alignItems="center"
        >
          <Box display="grid" gap={1.2}>
            <Typography><strong>{t("ticketCode")}:</strong> {booking.ticketCode || t("ticketNotAssignedYet")}</Typography>
            <Typography><strong>{t("ticketGuest")}:</strong> {getCustomerName(booking, t("fallbackGuest"))}</Typography>
            <Typography><strong>{t("ticketPhone")}:</strong> {booking.phoneNumber || t("ticketNotProvided")}</Typography>
            <Typography><strong>{t("ticketDate")}:</strong> {formatTicketDate(booking.date, locale)}</Typography>
            <Typography><strong>{t("ticketSeat")}:</strong> {booking.seatNumber || t("ticketNotAssigned")}</Typography>
            <Typography>
              <strong>{t("ticketPayment")}:</strong>{" "}
              {getPaymentMethodLabel(booking.paymentMethod, t)}
            </Typography>
            <Typography><strong>{t("ticketTotal")}:</strong> {formatTicketPrice(booking.totalPrice)}</Typography>
          </Box>

          <Box
            sx={{
              ml: { md: "auto" },
              p: 2,
              borderRadius: 4,
              bgcolor: "white",
              width: "fit-content",
            }}
          >
            <QRCode value={qrValue} size={164} />
          </Box>
        </Box>
      </Box>

      {showDownload && (
        <Button
          type="button"
          variant="contained"
          onClick={handleDownload}
          disabled={isDownloading}
          sx={{
            mt: 2,
            borderRadius: 999,
            px: 3,
            py: 1.15,
            bgcolor: "#6dd3ff",
            color: "#08111b",
            fontWeight: 800,
            "&:hover": {
              bgcolor: "#8adfff",
            },
          }}
        >
          {isDownloading ? t("ticketPreparingPdf") : t("ticketDownloadPdf")}
        </Button>
      )}
    </Box>
  );
};

export default VirtualTicket;
