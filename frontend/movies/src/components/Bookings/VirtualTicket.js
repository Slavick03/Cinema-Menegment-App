import { Box, Button, Chip, Typography } from "@mui/material";
import React, { useRef, useState } from "react";
import QRCode from "react-qr-code";
import {
  downloadTicketPdf,
  formatTicketDate,
  formatTicketPrice,
  getCustomerName,
  getTicketQrValue,
  paymentMethodLabels,
} from "../../utils/ticket-utils";

const VirtualTicket = ({ booking, title = "Virtual Ticket", showDownload = true }) => {
  const ticketRef = useRef(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const qrValue = getTicketQrValue(booking);

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
              {title}
            </Typography>
            <Typography
              variant="h5"
              sx={{ mt: 1, fontFamily: "'Space Grotesk', sans-serif" }}
            >
              {booking.movie?.title}
            </Typography>
          </Box>
          <Chip
            label={booking.paymentStatus === "paid" ? "Paid" : "Pending"}
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
            <Typography><strong>Ticket code:</strong> {booking.ticketCode || "Not assigned yet"}</Typography>
            <Typography><strong>Guest:</strong> {getCustomerName(booking)}</Typography>
            <Typography><strong>Phone:</strong> {booking.phoneNumber || "Not provided"}</Typography>
            <Typography><strong>Date:</strong> {formatTicketDate(booking.date)}</Typography>
            <Typography><strong>Seat:</strong> {booking.seatNumber || "Not assigned"}</Typography>
            <Typography>
              <strong>Payment:</strong> {paymentMethodLabels[booking.paymentMethod] || booking.paymentMethod || "Not specified"}
            </Typography>
            <Typography><strong>Total:</strong> {formatTicketPrice(booking.totalPrice)}</Typography>
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
          {isDownloading ? "Preparing PDF..." : "Download PDF Ticket"}
        </Button>
      )}
    </Box>
  );
};

export default VirtualTicket;
