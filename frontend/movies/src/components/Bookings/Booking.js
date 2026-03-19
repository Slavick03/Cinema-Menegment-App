import { Alert, Button, FormLabel, TextField, Typography } from "@mui/material";
import { Box } from "@mui/system";
import React, { Fragment, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  getBookedSeats,
  getMovieDetails,
  newBooking,
} from "../../api-helpers/api-helpers";
import SeatSelectionModal from "./SeatSelectionModal";

const Booking = () => {
  const navigate = useNavigate();
  const [movie, setMovie] = useState();
  const [inputs, setInputs] = useState({ date: "" });
  const [selectedSeat, setSelectedSeat] = useState("");
  const [bookedSeats, setBookedSeats] = useState([]);
  const [isSeatModalOpen, setIsSeatModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const id = useParams().id;

  useEffect(() => {
    getMovieDetails(id)
      .then((res) => setMovie(res.movie))
      .catch((err) => console.log(err.message));
  }, [id]);

  useEffect(() => {
    if (!id || !inputs.date) {
      setBookedSeats([]);
      return;
    }

    getBookedSeats(id, inputs.date)
      .then((res) => {
        const takenSeats = res.bookedSeats || [];
        setBookedSeats(takenSeats);
        setSelectedSeat((currentSeat) =>
          takenSeats.includes(currentSeat) ? "" : currentSeat
        );
      })
      .catch((err) => setErrorMessage(err.message));
  }, [id, inputs.date]);

  const handleChange = (e) => {
    setInputs((prevState) => ({
      ...prevState,
      [e.target.name]: e.target.value,
    }));
    setErrorMessage("");
  };

  const handleSeatSelection = (seatNumber) => {
    setSelectedSeat(seatNumber);
    setErrorMessage("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!selectedSeat) {
      setErrorMessage("Choose a seat in the hall layout before booking.");
      return;
    }

    newBooking({ ...inputs, movie: movie._id, seatNumber: selectedSeat })
      .then(() => navigate("/user"))
      .catch((err) => setErrorMessage(err.message));
  };

  return (
    <div>
      {movie && (
        <Fragment>
          <Typography
            paddingTop={2}
            paddingBottom={4}
            variant="h3"
            textAlign="center"
            sx={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: { xs: "2rem", md: "2.8rem" },
            }}
          >
            Book Tickets: {movie.title}
          </Typography>
          <Box
            display="flex"
            justifyContent="center"
            gap={3}
            flexDirection={{ xs: "column", md: "row" }}
          >
            <Box
              display="flex"
              justifyContent="column"
              flexDirection="column"
              width={{ xs: "100%", md: "55%" }}
              sx={{
                p: 3,
                borderRadius: 6,
                border: "1px solid rgba(255,255,255,0.08)",
                background:
                  "linear-gradient(180deg, rgba(11,20,31,0.84), rgba(15,27,42,0.9))",
                boxShadow: "0 24px 60px rgba(0,0,0,0.28)",
              }}
            >
              <img
                width="100%"
                height="340px"
                src={movie.posterUrl}
                alt={movie.title}
                style={{ objectFit: "cover", borderRadius: "24px" }}
              />
              <Box marginTop={3} paddingX={1}>
                <Typography
                  paddingTop={1}
                  sx={{ color: "rgba(255,255,255,0.72)", lineHeight: 1.8 }}
                >
                  {movie.description}
                </Typography>
                <Typography fontWeight="bold" marginTop={2}>
                  Starring: {movie.actors.join(", ")}
                </Typography>
                <Typography fontWeight="bold" marginTop={1.5}>
                  Release Date: {new Date(movie.releaseDate).toDateString()}
                </Typography>
              </Box>
            </Box>
            <Box
              width={{ xs: "100%", md: "45%" }}
              sx={{
                p: 3,
                borderRadius: 6,
                border: "1px solid rgba(255,255,255,0.08)",
                background:
                  "linear-gradient(180deg, rgba(14,25,39,0.95), rgba(10,17,27,0.92))",
                boxShadow: "0 24px 60px rgba(0,0,0,0.28)",
              }}
            >
              <form onSubmit={handleSubmit}>
                <Box
                  padding={{ xs: 1, md: 2 }}
                  margin="auto"
                  display="flex"
                  flexDirection="column"
                >
                  <Typography
                    variant="h5"
                    sx={{
                      fontFamily: "'Space Grotesk', sans-serif",
                      mb: 2,
                    }}
                  >
                    Choose Date and Seat
                  </Typography>
                  <FormLabel sx={{ color: "rgba(255,255,255,0.76)", mt: 1 }}>
                    Booking Date
                  </FormLabel>
                  <TextField
                    name="date"
                    type="date"
                    margin="normal"
                    variant="outlined"
                    value={inputs.date}
                    onChange={handleChange}
                    sx={fieldStyles}
                  />

                  <Box
                    sx={{
                      mt: 2,
                      p: 2.5,
                      borderRadius: 5,
                      border: "1px solid rgba(255,255,255,0.08)",
                      background: "rgba(255,255,255,0.03)",
                    }}
                  >
                    <Typography sx={{ color: "rgba(255,255,255,0.58)", fontSize: "0.86rem" }}>
                      Selected seat
                    </Typography>
                    <Typography
                      sx={{
                        mt: 0.5,
                        fontFamily: "'Space Grotesk', sans-serif",
                        fontSize: "1.4rem",
                      }}
                    >
                      {selectedSeat || "No seat selected yet"}
                    </Typography>
                    <Typography sx={{ mt: 1.2, color: "rgba(255,255,255,0.62)", lineHeight: 1.7 }}>
                      Open the interactive hall layout, pick any free chair, and
                      confirm your booking.
                    </Typography>
                    <Button
                      type="button"
                      variant="outlined"
                      disabled={!inputs.date}
                      onClick={() => setIsSeatModalOpen(true)}
                      sx={{
                        mt: 2.5,
                        width: "100%",
                        py: 1.2,
                        borderRadius: 999,
                        borderColor: "rgba(255,255,255,0.18)",
                        color: inputs.date ? "#6dd3ff" : "rgba(255,255,255,0.36)",
                        "&:hover": {
                          borderColor: "#6dd3ff",
                          bgcolor: "rgba(109,211,255,0.08)",
                        },
                      }}
                    >
                      Open Seat Map
                    </Button>
                  </Box>

                  {errorMessage && (
                    <Alert
                      severity="error"
                      sx={{
                        mt: 2.5,
                        borderRadius: 4,
                        bgcolor: "rgba(255, 89, 94, 0.14)",
                        color: "#ffd4d6",
                        border: "1px solid rgba(255, 89, 94, 0.22)",
                        "& .MuiAlert-icon": {
                          color: "#ff8d92",
                        },
                      }}
                    >
                      {errorMessage}
                    </Alert>
                  )}

                  <Button
                    type="submit"
                    variant="contained"
                    sx={{
                      mt: 3,
                      py: 1.4,
                      borderRadius: 999,
                      bgcolor: "#ff7a45",
                      color: "#08111b",
                      fontWeight: 800,
                      "&:hover": {
                        bgcolor: "#ff925d",
                      },
                    }}
                  >
                    Book Now
                  </Button>
                </Box>
              </form>
            </Box>
          </Box>

          <SeatSelectionModal
            open={isSeatModalOpen}
            onClose={() => setIsSeatModalOpen(false)}
            onSelectSeat={handleSeatSelection}
            selectedSeat={selectedSeat}
            bookedSeats={bookedSeats}
            movieTitle={movie.title}
            bookingDate={inputs.date}
          />
        </Fragment>
      )}
    </div>
  );
};

const fieldStyles = {
  "& .MuiOutlinedInput-root": {
    borderRadius: 4,
    color: "white",
    bgcolor: "rgba(255,255,255,0.03)",
    "& fieldset": {
      borderColor: "rgba(255,255,255,0.12)",
    },
    "&:hover fieldset": {
      borderColor: "rgba(255,255,255,0.22)",
    },
    "&.Mui-focused fieldset": {
      borderColor: "#6dd3ff",
    },
  },
};

export default Booking;
