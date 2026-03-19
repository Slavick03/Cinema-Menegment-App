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

const MovieItem = ({ title, releaseDate, posterUrl, id }) => {
  const navigate = useNavigate();
  const isUserLoggedIn = useSelector((state) => state.user.isLoggedIn);

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
          {new Date(releaseDate).toDateString()}
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
