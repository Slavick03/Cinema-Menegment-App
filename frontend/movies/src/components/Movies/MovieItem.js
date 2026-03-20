import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Typography,
} from "@mui/material";
import React from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { formatCalendarDate, formatTicketPrice } from "../../utils/ticket-utils";

const MovieItem = ({
  title,
  releaseDate,
  posterUrl,
  id,
  ticketPrice = 0,
  averageRating = 0,
  ratingsCount = 0,
}) => {
  const navigate = useNavigate();
  const isUserLoggedIn = useSelector((state) => state.user.isLoggedIn);
  const hasRatings = Number(ratingsCount) > 0;

  const handleButtonClick = () => {
    if (isUserLoggedIn) {
      navigate(`/booking/${id}`);
    } else {
      navigate("/auth");
    }
  };

  return (
    <Card
      sx={{
        width: { xs: "100%", sm: 280 },
        minHeight: 420,
        borderRadius: 6,
        overflow: "hidden",
        border: "1px solid rgba(255,255,255,0.08)",
        background:
          "linear-gradient(180deg, rgba(14,25,39,0.98), rgba(10,17,27,0.96))",
        color: "white",
        boxShadow: "0 20px 50px rgba(0,0,0,0.28)",
        transition: "transform 180ms ease, box-shadow 180ms ease",
        ":hover": {
          transform: "translateY(-6px)",
          boxShadow: "0 26px 70px rgba(0,0,0,0.4)",
        },
      }}
    >
      <Box sx={{ position: "relative", height: 240 }}>
        <img
          height="100%"
          width="100%"
          src={posterUrl}
          alt={title}
          style={{ objectFit: "cover" }}
        />
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(180deg, rgba(0,0,0,0.02), rgba(0,0,0,0.68))",
          }}
        />
        <Box
          sx={{
            position: "absolute",
            top: 14,
            right: 14,
            px: 1.4,
            py: 0.7,
            borderRadius: 999,
            bgcolor: "rgba(8,17,27,0.82)",
            border: "1px solid rgba(109,211,255,0.32)",
            backdropFilter: "blur(10px)",
          }}
        >
          <Typography
            sx={{
              color: "#6dd3ff",
              fontWeight: 800,
              fontSize: "0.85rem",
              lineHeight: 1,
            }}
          >
            {hasRatings ? `${averageRating} / 5` : "New"}
          </Typography>
        </Box>
      </Box>
      <CardContent sx={{ px: 2.5, pt: 2.5 }}>
        <Typography
          gutterBottom
          variant="h5"
          component="div"
          sx={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontWeight: 700,
          }}
        >
          {title}
        </Typography>
        <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.62)" }}>
          {formatCalendarDate(releaseDate)}
        </Typography>
        <Typography
          sx={{
            mt: 1.3,
            color: "#ffb08d",
            fontWeight: 700,
            fontSize: "0.95rem",
          }}
        >
          Ticket: {formatTicketPrice(ticketPrice)}
        </Typography>
        <Typography
          sx={{
            mt: 0.7,
            color: "#6dd3ff",
            fontWeight: 700,
            fontSize: "0.95rem",
          }}
        >
          Rating: {hasRatings ? `${averageRating} / 5` : "No ratings yet"}
        </Typography>
        <Typography variant="body2" sx={{ mt: 0.5, color: "rgba(255,255,255,0.55)" }}>
          {hasRatings ? `${ratingsCount} user ratings` : "Be the first to rate"}
        </Typography>
      </CardContent>
      <CardActions sx={{ p: 2.5, pt: 0, mt: "auto" }}>
        <Button
          variant="contained"
          fullWidth
          sx={{
            margin: "auto",
            py: 1.2,
            borderRadius: 999,
            bgcolor: "#ff7a45",
            color: "#08111b",
            fontWeight: 800,
            ":hover": {
              bgcolor: "#ff925d",
            },
          }}
          onClick={handleButtonClick}
          size="medium"
        >
          Book a Seat
        </Button>
      </CardActions>
    </Card>
  );
};

export default MovieItem;
