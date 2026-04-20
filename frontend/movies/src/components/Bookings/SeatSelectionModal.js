import React from "react";
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogContent,
  IconButton,
  Typography,
} from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import EventSeatRoundedIcon from "@mui/icons-material/EventSeatRounded";
import { formatCalendarDate } from "../../utils/ticket-utils";
import { useI18n } from "../../i18n/LanguageContext";

const seatsPerRow = 8;
const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

const buildSeatRows = (totalSeats) => {
  const safeTotalSeats = Math.max(1, Number(totalSeats) || seatsPerRow);
  const rowCount = Math.ceil(safeTotalSeats / seatsPerRow);

  return Array.from({ length: rowCount }, (_, rowIndex) => {
    const rowLabel = alphabet[rowIndex] || `R${rowIndex + 1}`;
    const seatsInRow = Math.min(seatsPerRow, safeTotalSeats - rowIndex * seatsPerRow);

    return {
      rowLabel,
      seatsInRow,
    };
  });
};

const SeatSelectionModal = ({
  open,
  onClose,
  onSelectSeat,
  selectedSeat,
  bookedSeats,
  movieTitle,
  bookingDate,
  hall,
  totalSeats,
}) => {
  const bookedSeatSet = new Set(bookedSeats);
  const { locale, t } = useI18n();
  const seatRows = buildSeatRows(totalSeats);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 8,
          bgcolor: "rgba(10, 17, 27, 0.94)",
          border: "1px solid rgba(255,255,255,0.08)",
          backdropFilter: "blur(24px)",
          color: "white",
          boxShadow: "0 28px 90px rgba(0,0,0,0.45)",
          overflow: "hidden",
        },
      }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          p: { xs: 2.5, md: 3.5 },
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          background:
            "linear-gradient(180deg, rgba(255,122,69,0.12), rgba(109,211,255,0.06))",
        }}
      >
        <Box>
          <Typography
            sx={{
              color: "#ffb08d",
              textTransform: "uppercase",
              letterSpacing: "0.16em",
              fontWeight: 800,
              fontSize: "0.76rem",
            }}
          >
            {t("seatMapTitle")}
          </Typography>
          <Typography
            variant="h4"
            sx={{
              mt: 1,
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: { xs: "1.7rem", md: "2.2rem" },
            }}
          >
            {movieTitle}
          </Typography>
          <Typography sx={{ mt: 1, color: "rgba(255,255,255,0.66)" }}>
            {bookingDate
              ? t("seatMapChooseForDate", {
                  date: formatCalendarDate(bookingDate, locale),
                })
              : t("seatMapSelectDateFirst")}
          </Typography>
          {hall ? (
            <Typography sx={{ mt: 0.8, color: "#6dd3ff" }}>
              {t("bookingHall")}: {hall}
            </Typography>
          ) : null}
        </Box>
        <IconButton onClick={onClose} sx={{ color: "rgba(255,255,255,0.72)" }}>
          <CloseRoundedIcon />
        </IconButton>
      </Box>
      <DialogContent sx={{ p: { xs: 2.5, md: 4 } }}>
        <Box
          sx={{
            mb: 4,
            py: 1.2,
            borderRadius: 999,
            textAlign: "center",
            letterSpacing: "0.28em",
            fontSize: "0.78rem",
            fontWeight: 800,
            color: "rgba(255,255,255,0.7)",
            border: "1px solid rgba(255,255,255,0.08)",
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02))",
            boxShadow: "0 16px 40px rgba(0,0,0,0.26)",
          }}
        >
          {t("seatMapScreen")}
        </Box>

        <Box display="flex" justifyContent="center" gap={1.2} flexWrap="wrap" mb={3}>
          <Chip label={t("seatMapAvailable")} sx={legendChipStyles("#6dd3ff", "rgba(109,211,255,0.12)")} />
          <Chip label={t("seatMapSelected")} sx={legendChipStyles("#ff7a45", "rgba(255,122,69,0.14)")} />
          <Chip label={t("seatMapBooked")} sx={legendChipStyles("rgba(255,255,255,0.58)", "rgba(255,255,255,0.06)")} />
        </Box>

        <Box display="flex" flexDirection="column" gap={1.4}>
          {seatRows.map(({ rowLabel, seatsInRow }) => (
            <Box
              key={rowLabel}
              sx={{
                display: "grid",
                gridTemplateColumns: "48px repeat(8, minmax(0, 1fr))",
                gap: { xs: 0.7, md: 1 },
                alignItems: "center",
              }}
            >
              <Typography
                sx={{
                  textAlign: "center",
                  fontWeight: 800,
                  color: "#6dd3ff",
                }}
              >
                {rowLabel}
              </Typography>
              {Array.from({ length: seatsInRow }, (_, index) => {
                const seatNumber = `${rowLabel}-${index + 1}`;
                const isBooked = bookedSeatSet.has(seatNumber);
                const isSelected = selectedSeat === seatNumber;

                return (
                  <Button
                    key={seatNumber}
                    type="button"
                    disabled={isBooked}
                    onClick={() => onSelectSeat(seatNumber)}
                    sx={{
                      minWidth: 0,
                      aspectRatio: "1 / 1",
                      borderRadius: 3,
                      border: "1px solid rgba(255,255,255,0.08)",
                      bgcolor: isBooked
                        ? "rgba(255,255,255,0.06)"
                        : isSelected
                          ? "rgba(255,122,69,0.18)"
                          : "rgba(109,211,255,0.12)",
                      color: isBooked
                        ? "rgba(255,255,255,0.38)"
                        : isSelected
                          ? "#ffb08d"
                          : "#d8f6ff",
                      boxShadow: isSelected
                        ? "0 12px 28px rgba(255,122,69,0.22)"
                        : "none",
                      "&:hover": {
                        bgcolor: isBooked
                          ? "rgba(255,255,255,0.06)"
                          : isSelected
                            ? "rgba(255,122,69,0.22)"
                            : "rgba(109,211,255,0.18)",
                      },
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        lineHeight: 1.1,
                      }}
                    >
                      <EventSeatRoundedIcon fontSize="small" />
                      <Typography sx={{ fontSize: "0.7rem", fontWeight: 800 }}>
                        {index + 1}
                      </Typography>
                    </Box>
                  </Button>
                );
              })}
            </Box>
          ))}
        </Box>

        <Box
          sx={{
            mt: 4,
            p: 2,
            borderRadius: 5,
            border: "1px solid rgba(255,255,255,0.08)",
            background: "rgba(255,255,255,0.03)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: { xs: "flex-start", md: "center" },
            flexDirection: { xs: "column", md: "row" },
            gap: 2,
          }}
        >
          <Box>
            <Typography sx={{ color: "rgba(255,255,255,0.58)", fontSize: "0.86rem" }}>
              {t("bookingSelectedSeat")}
            </Typography>
            <Typography
              sx={{
                mt: 0.5,
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: "1.3rem",
              }}
            >
              {selectedSeat || t("bookingNoSeatSelected")}
            </Typography>
          </Box>
          <Button
            onClick={onClose}
            variant="contained"
            sx={{
              px: 3.5,
              py: 1.2,
              borderRadius: 999,
              bgcolor: "#ff7a45",
              color: "#08111b",
              fontWeight: 800,
              "&:hover": {
                bgcolor: "#ff925d",
              },
            }}
          >
            {t("seatMapConfirm")}
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

const legendChipStyles = (color, backgroundColor) => ({
  color,
  bgcolor: backgroundColor,
  border: "1px solid rgba(255,255,255,0.08)",
  fontWeight: 700,
});

export default SeatSelectionModal;
