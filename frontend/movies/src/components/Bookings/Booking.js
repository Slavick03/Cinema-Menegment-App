import {
  Alert,
  Box,
  Button,
  FormLabel,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";
import React, { Fragment, useEffect, useState } from "react";
import { Elements, CardElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { useNavigate, useParams } from "react-router-dom";
import {
  addMovieReview,
  completePaymentBooking,
  createPaymentIntent,
  deleteMovieReview,
  getBookedSeats,
  getMovieDetails,
  getStripeConfig,
} from "../../api-helpers/api-helpers";
import SeatSelectionModal from "./SeatSelectionModal";
import VirtualTicket from "./VirtualTicket";
import {
  formatCalendarDate,
  formatTicketPrice,
  formatTicketDate,
  getPaymentMethodLabel,
} from "../../utils/ticket-utils";
import { useI18n } from "../../i18n/LanguageContext";

const getShowtimeLabel = (showtime, locale) => {
  if (!showtime) {
    return "";
  }

  const dateLabel = formatTicketDate(showtime.startTime, locale);
  const hallLabel = showtime.hall ? ` • ${showtime.hall}` : "";
  const priceLabel = Number.isFinite(Number(showtime.price))
    ? ` • ${formatTicketPrice(showtime.price)}`
    : "";

  return `${dateLabel}${hallLabel}${priceLabel}`;
};

const Booking = () => {
  const navigate = useNavigate();
  const [movie, setMovie] = useState();
  const [comments, setComments] = useState([]);
  const [inputs, setInputs] = useState({
    showtime: "",
    customerFirstName: "",
    customerLastName: "",
    phoneNumber: "",
    paymentMethod: "card",
  });
  const [selectedSeat, setSelectedSeat] = useState("");
  const [bookedSeats, setBookedSeats] = useState([]);
  const [isSeatModalOpen, setIsSeatModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [createdBooking, setCreatedBooking] = useState(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [stripePromise, setStripePromise] = useState(null);
  const [isStripeLoading, setIsStripeLoading] = useState(true);
  const [reviewInputs, setReviewInputs] = useState({ rating: "5", comment: "" });
  const [reviewMessage, setReviewMessage] = useState("");
  const [reviewError, setReviewError] = useState("");
  const [deletingReviewId, setDeletingReviewId] = useState("");
  const id = useParams().id;
  const { locale, t } = useI18n();
  const currentUserId = localStorage.getItem("userId");

  useEffect(() => {
    getMovieDetails(id)
      .then((res) => {
        setMovie(res.movie);
        setComments(res.comments || []);
      })
      .catch((err) => console.log(err.message));
  }, [id]);

  useEffect(() => {
    setIsStripeLoading(true);
    getStripeConfig()
      .then((res) => {
        setStripePromise(loadStripe(res.publishableKey));
      })
      .catch((err) => {
        setErrorMessage(err.message);
      })
      .finally(() => {
        setIsStripeLoading(false);
      });
  }, []);

  const selectedShowtime = movie?.showtimes?.find(
    (showtime) => showtime._id === inputs.showtime
  );

  useEffect(() => {
    if (!selectedShowtime?._id) {
      setBookedSeats([]);
      return;
    }

    getBookedSeats(selectedShowtime._id)
      .then((res) => {
        const takenSeats = res.bookedSeats || [];
        setBookedSeats(takenSeats);
        setSelectedSeat((currentSeat) =>
          takenSeats.includes(currentSeat) ? "" : currentSeat
        );
      })
      .catch((err) => setErrorMessage(err.message));
  }, [selectedShowtime?._id]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setInputs((prevState) => ({
      ...prevState,
      [name]: value,
    }));
    if (name === "showtime") {
      setSelectedSeat("");
      setBookedSeats([]);
    }
    setErrorMessage("");
    setSuccessMessage("");
  };

  const handleSeatSelection = (seatNumber) => {
    setSelectedSeat(seatNumber);
    setErrorMessage("");
    setSuccessMessage("");
  };

  const handleReviewChange = (e) => {
    setReviewInputs((prevState) => ({
      ...prevState,
      [e.target.name]: e.target.value,
    }));
    setReviewMessage("");
    setReviewError("");
  };

  const handleReviewSubmit = (e) => {
    e.preventDefault();

    if (!reviewInputs.comment.trim()) {
      setReviewError(t("bookingErrorReviewRequired"));
      return;
    }

    addMovieReview(id, {
      rating: Number(reviewInputs.rating),
      comment: reviewInputs.comment,
    })
      .then((res) => {
        setComments(res.comments || []);
        setMovie((prevMovie) => ({
          ...prevMovie,
          averageRating: res.averageRating,
          ratingsCount: res.ratingsCount,
        }));
        setReviewInputs({ rating: "5", comment: "" });
        setReviewMessage(res.message);
        setReviewError("");
      })
      .catch((err) => {
        setReviewMessage("");
        setReviewError(err.message);
      });
  };

  const handleReviewDelete = (reviewId) => {
    setDeletingReviewId(reviewId);
    setReviewMessage("");
    setReviewError("");

    deleteMovieReview(id, reviewId)
      .then((res) => {
        setComments(res.comments || []);
        setMovie((prevMovie) => ({
          ...prevMovie,
          averageRating: res.averageRating,
          ratingsCount: res.ratingsCount,
        }));
        setReviewMessage(res.message);
      })
      .catch((err) => {
        setReviewError(err.message);
      })
      .finally(() => {
        setDeletingReviewId("");
      });
  };

  const validateBookingInputs = () => {
    if (!inputs.showtime) {
      setErrorMessage(t("bookingErrorShowtimeRequired"));
      return false;
    }

    if (!selectedSeat) {
      setErrorMessage(t("bookingErrorSeatRequired"));
      return false;
    }

    if (
      !inputs.customerFirstName.trim() ||
      !inputs.customerLastName.trim() ||
      !inputs.phoneNumber.trim()
    ) {
      setErrorMessage(t("bookingErrorContactRequired"));
      return false;
    }

    return true;
  };

  const bookingPayload = selectedShowtime
    ? {
        ...inputs,
        showtime: selectedShowtime._id,
        date: selectedShowtime.startTime,
        seatNumber: selectedSeat,
      }
    : null;
  const isPaymentDetailsReady =
    Boolean(inputs.showtime) &&
    Boolean(selectedSeat) &&
    Boolean(inputs.customerFirstName.trim()) &&
    Boolean(inputs.customerLastName.trim()) &&
    Boolean(inputs.phoneNumber.trim());

  const handleBookingCreated = (booking) => {
    setCreatedBooking(booking);
    setBookedSeats((prevSeats) =>
      prevSeats.includes(booking.seatNumber) ? prevSeats : [...prevSeats, booking.seatNumber]
    );
    setSelectedSeat("");
    setSuccessMessage(t("bookingSuccess"));
    setErrorMessage("");
  };

  const reviews = [...comments].sort(
    (firstReview, secondReview) =>
      new Date(secondReview.updatedAt) - new Date(firstReview.updatedAt)
  );

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
            {t("bookingTitle", { title: movie.title })}
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
                  {t("bookingStarring")}: {movie.actors.join(", ")}
                </Typography>
                <Typography fontWeight="bold" marginTop={1.5}>
                  {t("bookingReleaseDate")}: {formatCalendarDate(movie.releaseDate, locale)}
                </Typography>
                <Typography fontWeight="bold" marginTop={1.5} sx={{ color: "#ffb08d" }}>
                  {t("bookingTicketPrice")}: {formatTicketPrice(movie.ticketPrice)}
                </Typography>
                <Typography fontWeight="bold" marginTop={1.5} sx={{ color: "#6dd3ff" }}>
                  {t("bookingRating")}:{" "}
                  {movie.ratingsCount
                    ? t("bookingRatingWithCount", {
                        rating: movie.averageRating,
                        count: movie.ratingsCount,
                      })
                    : t("bookingNoRatings")}
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
              <Box>
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
                    {t("bookingAndPayment")}
                  </Typography>
                  <FormLabel sx={{ color: "rgba(255,255,255,0.76)", mt: 1 }}>
                    {t("bookingShowtime")}
                  </FormLabel>
                  <TextField
                    select
                    name="showtime"
                    margin="normal"
                    variant="outlined"
                    value={inputs.showtime}
                    onChange={handleChange}
                    sx={fieldStyles}
                  >
                    {(movie.showtimes || []).length ? (
                      (movie.showtimes || []).map((showtime) => (
                        <MenuItem key={showtime._id} value={showtime._id}>
                          {getShowtimeLabel(showtime, locale)}
                        </MenuItem>
                      ))
                    ) : (
                      <MenuItem value="" disabled>
                        {t("bookingNoShowtimes")}
                      </MenuItem>
                    )}
                  </TextField>
                  {selectedShowtime ? (
                    <Box
                      sx={{
                        mt: 1,
                        p: 2,
                        borderRadius: 4,
                        border: "1px solid rgba(109,211,255,0.12)",
                        background: "rgba(109,211,255,0.05)",
                      }}
                    >
                      <Typography>{t("bookingDate")}: {formatTicketDate(selectedShowtime.startTime, locale)}</Typography>
                      <Typography sx={{ mt: 0.7 }}>{t("bookingHall")}: {selectedShowtime.hall}</Typography>
                      <Typography sx={{ mt: 0.7 }}>{t("bookingTicketPrice")}: {formatTicketPrice(selectedShowtime.price)}</Typography>
                      <Typography sx={{ mt: 0.7 }}>{t("bookingSeatCapacity")}: {selectedShowtime.totalSeats}</Typography>
                    </Box>
                  ) : null}
                  <FormLabel sx={{ color: "rgba(255,255,255,0.76)", mt: 1 }}>
                    {t("bookingFirstName")}
                  </FormLabel>
                  <TextField
                    name="customerFirstName"
                    margin="normal"
                    variant="outlined"
                    value={inputs.customerFirstName}
                    onChange={handleChange}
                    sx={fieldStyles}
                  />
                  <FormLabel sx={{ color: "rgba(255,255,255,0.76)", mt: 1 }}>
                    {t("bookingLastName")}
                  </FormLabel>
                  <TextField
                    name="customerLastName"
                    margin="normal"
                    variant="outlined"
                    value={inputs.customerLastName}
                    onChange={handleChange}
                    sx={fieldStyles}
                  />
                  <FormLabel sx={{ color: "rgba(255,255,255,0.76)", mt: 1 }}>
                    {t("bookingPhone")}
                  </FormLabel>
                  <TextField
                    name="phoneNumber"
                    margin="normal"
                    variant="outlined"
                    value={inputs.phoneNumber}
                    onChange={handleChange}
                    placeholder="+373 69 000 000"
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
                      {t("bookingSelectedSeat")}
                    </Typography>
                    <Typography
                      sx={{
                        mt: 0.5,
                        fontFamily: "'Space Grotesk', sans-serif",
                        fontSize: "1.4rem",
                      }}
                    >
                      {selectedSeat || t("bookingNoSeatSelected")}
                    </Typography>
                    <Typography sx={{ mt: 1.2, color: "rgba(255,255,255,0.62)", lineHeight: 1.7 }}>
                      {t("bookingSeatHelp")}
                    </Typography>
                    <Button
                      type="button"
                      variant="outlined"
                      disabled={!inputs.showtime}
                      onClick={() => setIsSeatModalOpen(true)}
                      sx={{
                        mt: 2.5,
                        width: "100%",
                        py: 1.2,
                        borderRadius: 999,
                        borderColor: "rgba(255,255,255,0.18)",
                        color: inputs.showtime ? "#6dd3ff" : "rgba(255,255,255,0.36)",
                        "&:hover": {
                          borderColor: "#6dd3ff",
                          bgcolor: "rgba(109,211,255,0.08)",
                        },
                      }}
                    >
                      {t("bookingOpenSeatMap")}
                    </Button>
                  </Box>

                  <FormLabel sx={{ color: "rgba(255,255,255,0.76)", mt: 2.5 }}>
                    {t("bookingPaymentMethod")}
                  </FormLabel>
                  <Box
                    sx={{
                      mt: 1.5,
                      p: 2.2,
                      borderRadius: 4,
                      border: "1px solid rgba(255,255,255,0.12)",
                      bgcolor: "rgba(255,255,255,0.03)",
                    }}
                  >
                    <Typography sx={{ fontWeight: 700 }}>
                      {t("bookingCardDetails")}
                    </Typography>
                    <Typography sx={{ mt: 0.8, color: "rgba(255,255,255,0.62)", lineHeight: 1.7 }}>
                      {t("bookingCardDetailsHint")}
                    </Typography>
                  </Box>

                  <Box
                    sx={{
                      mt: 2,
                      p: 2.5,
                      borderRadius: 5,
                      border: "1px solid rgba(255,255,255,0.12)",
                      background: "rgba(255,255,255,0.03)",
                    }}
                  >
                    <Typography sx={{ color: "rgba(255,255,255,0.58)", fontSize: "0.86rem", mb: 1.4 }}>
                      {t("bookingCardFormLabel")}
                    </Typography>
                    {!isPaymentDetailsReady ? (
                      <Box
                        sx={{
                          p: 2,
                          borderRadius: 4,
                          border: "1px dashed rgba(255,255,255,0.14)",
                          bgcolor: "rgba(8,17,27,0.35)",
                        }}
                      >
                        <Typography sx={{ color: "rgba(255,255,255,0.72)", lineHeight: 1.7 }}>
                          {t("bookingPaymentPrerequisites")}
                        </Typography>
                      </Box>
                    ) : stripePromise ? (
                      <Elements stripe={stripePromise}>
                        <StripeCardPaymentForm
                          bookingPayload={bookingPayload}
                          disabled={!movie}
                          isStripeLoading={isStripeLoading}
                          isProcessingPayment={isProcessingPayment}
                          onProcessingChange={setIsProcessingPayment}
                          onValidate={validateBookingInputs}
                          onSuccess={handleBookingCreated}
                          onError={(message) => {
                            setSuccessMessage("");
                            setErrorMessage(message);
                          }}
                          onClearMessages={() => {
                            setErrorMessage("");
                            setSuccessMessage("");
                          }}
                          onStatusMessage={setSuccessMessage}
                          t={t}
                        />
                      </Elements>
                    ) : (
                      <Typography sx={{ color: "#ffb4b8", lineHeight: 1.7 }}>
                        {isStripeLoading ? t("bookingStripeLoading") : t("bookingStripeUnavailable")}
                      </Typography>
                    )}
                  </Box>

                  <Box
                    sx={{
                      mt: 2,
                      p: 2.5,
                      borderRadius: 5,
                      border: "1px solid rgba(109,211,255,0.16)",
                      background: "rgba(109,211,255,0.05)",
                    }}
                  >
                    <Typography
                      sx={{
                        color: "rgba(255,255,255,0.58)",
                        fontSize: "0.86rem",
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                      }}
                    >
                      {t("bookingPaymentSummary")}
                    </Typography>
                    <Typography sx={{ mt: 1.2 }}>
                      {t("bookingTicketPrice")}: {formatTicketPrice(selectedShowtime?.price ?? movie.ticketPrice)}
                    </Typography>
                    <Typography sx={{ mt: 0.7 }}>
                      {t("bookingPaymentType")}: {getPaymentMethodLabel("card", t)}
                    </Typography>
                    {selectedShowtime ? (
                      <Typography sx={{ mt: 0.7 }}>
                        {t("bookingHall")}: {selectedShowtime.hall}
                      </Typography>
                    ) : null}
                    <Typography sx={{ mt: 0.7 }}>
                      {t("ticketSeat")}: {selectedSeat || t("bookingChooseSeatFirst")}
                    </Typography>
                    <Typography sx={{ mt: 0.7, color: "#6dd3ff" }}>
                      {t("bookingStripeHint")}
                    </Typography>
                  </Box>

                  {successMessage && (
                    <Alert
                      severity="success"
                      sx={{
                        mt: 2.5,
                        borderRadius: 4,
                        bgcolor: "rgba(80, 200, 120, 0.14)",
                        color: "#d7ffe3",
                        border: "1px solid rgba(80, 200, 120, 0.22)",
                      }}
                    >
                      {successMessage}
                    </Alert>
                  )}

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

                </Box>
              </Box>
            </Box>
          </Box>

          {createdBooking && (
            <Box
              marginTop={4}
              sx={{
                p: 3,
                borderRadius: 6,
                border: "1px solid rgba(255,255,255,0.08)",
                background:
                  "linear-gradient(180deg, rgba(11,20,31,0.84), rgba(15,27,42,0.9))",
                boxShadow: "0 24px 60px rgba(0,0,0,0.28)",
              }}
            >
              <VirtualTicket booking={createdBooking} title={t("ticketPaidTitle")} />
              <Button
                type="button"
                variant="outlined"
                onClick={() => navigate("/user")}
                sx={{
                  mt: 2,
                  borderRadius: 999,
                  borderColor: "rgba(255,255,255,0.18)",
                  color: "white",
                  "&:hover": {
                    borderColor: "#6dd3ff",
                    bgcolor: "rgba(109,211,255,0.08)",
                  },
                }}
              >
                {t("bookingOpenMyBookings")}
              </Button>
            </Box>
          )}

          <Box
            marginTop={4}
            display="flex"
            gap={3}
            flexDirection={{ xs: "column", lg: "row" }}
          >
            <Box
              width={{ xs: "100%", lg: "42%" }}
              sx={{
                p: 3,
                borderRadius: 6,
                border: "1px solid rgba(255,255,255,0.08)",
                background:
                  "linear-gradient(180deg, rgba(16,28,43,0.95), rgba(10,17,27,0.92))",
                boxShadow: "0 24px 60px rgba(0,0,0,0.28)",
              }}
            >
              <Typography
                variant="h5"
                sx={{ fontFamily: "'Space Grotesk', sans-serif", mb: 2 }}
              >
                {t("bookingLeaveReview")}
              </Typography>
              <form onSubmit={handleReviewSubmit}>
                <FormLabel sx={{ color: "rgba(255,255,255,0.76)", mt: 1 }}>
                  {t("bookingReviewRating")}
                </FormLabel>
                <TextField
                  select
                  name="rating"
                  margin="normal"
                  variant="outlined"
                  value={reviewInputs.rating}
                  onChange={handleReviewChange}
                  sx={fieldStyles}
                >
                  {[5, 4, 3, 2, 1].map((value) => (
                    <MenuItem key={value} value={String(value)}>
                      {value} / 5
                    </MenuItem>
                  ))}
                </TextField>
                <FormLabel sx={{ color: "rgba(255,255,255,0.76)", mt: 1 }}>
                  {t("bookingYourReview")}
                </FormLabel>
                <TextField
                  name="comment"
                  margin="normal"
                  variant="outlined"
                  multiline
                  minRows={4}
                  value={reviewInputs.comment}
                  onChange={handleReviewChange}
                  placeholder={t("bookingReviewPlaceholder")}
                  sx={fieldStyles}
                />

                {reviewMessage && (
                  <Alert
                    severity="success"
                    sx={{
                      mt: 2.5,
                      borderRadius: 4,
                      bgcolor: "rgba(80, 200, 120, 0.14)",
                      color: "#d7ffe3",
                      border: "1px solid rgba(80, 200, 120, 0.22)",
                    }}
                  >
                    {reviewMessage}
                  </Alert>
                )}

                {reviewError && (
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
                    {reviewError}
                  </Alert>
                )}

                <Button
                  type="submit"
                  variant="contained"
                  sx={{
                    mt: 3,
                    py: 1.35,
                    width: "100%",
                    borderRadius: 999,
                    bgcolor: "#6dd3ff",
                    color: "#08111b",
                    fontWeight: 800,
                    "&:hover": {
                      bgcolor: "#8adfff",
                    },
                  }}
                >
                  {t("bookingSubmitReview")}
                </Button>
              </form>
            </Box>

            <Box
              width={{ xs: "100%", lg: "58%" }}
              sx={{
                p: 3,
                borderRadius: 6,
                border: "1px solid rgba(255,255,255,0.08)",
                background:
                  "linear-gradient(180deg, rgba(11,20,31,0.84), rgba(15,27,42,0.9))",
                boxShadow: "0 24px 60px rgba(0,0,0,0.28)",
              }}
            >
              <Typography
                variant="h5"
                sx={{ fontFamily: "'Space Grotesk', sans-serif", mb: 2 }}
              >
                {t("bookingViewerReviews")}
              </Typography>
              <Typography sx={{ mb: 2.5, color: "rgba(255,255,255,0.62)" }}>
                {movie.ratingsCount
                  ? t("bookingAverageScore", {
                      rating: movie.averageRating,
                      count: movie.ratingsCount,
                    })
                  : t("bookingAverageScorePending")}
              </Typography>
              {reviews.length ? (
                <Box display="flex" flexDirection="column" gap={2}>
                  {reviews.map((review) => (
                    <Box
                      key={review._id}
                      sx={{
                        p: 2.5,
                        borderRadius: 4,
                        bgcolor: "rgba(255,255,255,0.03)",
                        border: "1px solid rgba(255,255,255,0.08)",
                      }}
                    >
                      <Box
                        display="flex"
                        justifyContent="space-between"
                        alignItems={{ xs: "flex-start", sm: "center" }}
                        flexDirection={{ xs: "column", sm: "row" }}
                        gap={1}
                      >
                        <Typography fontWeight={700}>{review.userName}</Typography>
                        <Box
                          display="flex"
                          alignItems={{ xs: "flex-start", sm: "center" }}
                          flexDirection={{ xs: "column", sm: "row" }}
                          gap={1}
                        >
                          <Typography sx={{ color: "#6dd3ff", fontWeight: 700 }}>
                            {review.rating} / 5
                          </Typography>
                          {review.user === currentUserId && (
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => handleReviewDelete(review._id)}
                              disabled={deletingReviewId === review._id}
                              sx={{
                                borderRadius: 999,
                                borderColor: "rgba(255,107,107,0.3)",
                                color: "#ff9b9b",
                                fontWeight: 700,
                                minWidth: "auto",
                                px: 1.6,
                                ":hover": {
                                  borderColor: "#ff6b6b",
                                  bgcolor: "rgba(255,107,107,0.08)",
                                },
                              }}
                            >
                              {deletingReviewId === review._id
                                ? t("commonDeleting")
                                : t("bookingDeleteMyReview")}
                            </Button>
                          )}
                        </Box>
                      </Box>
                      <Typography sx={{ mt: 1.2, color: "rgba(255,255,255,0.72)", lineHeight: 1.8 }}>
                        {review.text}
                      </Typography>
                      <Typography sx={{ mt: 1, color: "rgba(255,255,255,0.5)", fontSize: "0.84rem" }}>
                        {review.userEmail}
                      </Typography>
                      <Typography sx={{ mt: 1.2, color: "rgba(255,255,255,0.46)", fontSize: "0.82rem" }}>
                        {t("bookingReviewUpdated", {
                          date: new Date(review.updatedAt || review.createdAt).toLocaleString(locale),
                        })}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              ) : (
                <Typography sx={{ color: "rgba(255,255,255,0.58)", lineHeight: 1.8 }}>
                  {t("bookingReviewsEmpty")}
                </Typography>
              )}
            </Box>
          </Box>

          <SeatSelectionModal
            open={isSeatModalOpen}
            onClose={() => setIsSeatModalOpen(false)}
            onSelectSeat={handleSeatSelection}
            selectedSeat={selectedSeat}
            bookedSeats={bookedSeats}
            movieTitle={movie.title}
            bookingDate={selectedShowtime?.startTime}
            hall={selectedShowtime?.hall}
            totalSeats={selectedShowtime?.totalSeats}
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

const StripeCardPaymentForm = ({
  bookingPayload,
  disabled,
  isStripeLoading,
  isProcessingPayment,
  onProcessingChange,
  onValidate,
  onSuccess,
  onError,
  onClearMessages,
  onStatusMessage,
  t,
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [clientSecret, setClientSecret] = useState("");
  const [paymentIntentId, setPaymentIntentId] = useState("");
  const [intentSignature, setIntentSignature] = useState("");

  const buildIntentSignature = () =>
    JSON.stringify({
      showtime: bookingPayload?.showtime || "",
      date: bookingPayload?.date || "",
      seatNumber: bookingPayload?.seatNumber || "",
      customerFirstName: bookingPayload?.customerFirstName || "",
      customerLastName: bookingPayload?.customerLastName || "",
      phoneNumber: bookingPayload?.phoneNumber || "",
    });

  const handlePay = async () => {
    if (!stripe || !elements || disabled || isStripeLoading) {
      return;
    }

    if (!onValidate()) {
      return;
    }

    onClearMessages();
    onProcessingChange(true);

    try {
      const nextSignature = buildIntentSignature();
      let nextClientSecret = clientSecret;
      let nextPaymentIntentId = paymentIntentId;

      if (!nextClientSecret || intentSignature !== nextSignature) {
        onStatusMessage(t("bookingPreparingPayment"));
        const paymentIntentResponse = await createPaymentIntent(bookingPayload);
        nextClientSecret = paymentIntentResponse.clientSecret;
        nextPaymentIntentId = paymentIntentResponse.paymentIntentId;
        setClientSecret(nextClientSecret);
        setPaymentIntentId(nextPaymentIntentId);
        setIntentSignature(nextSignature);
      }

      const cardElement = elements.getElement(CardElement);

      if (!cardElement) {
        throw new Error(t("bookingCardFormNotReady"));
      }

      onStatusMessage(t("bookingPaymentProcessing"));

      const { error, paymentIntent } = await stripe.confirmCardPayment(nextClientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: `${bookingPayload.customerFirstName} ${bookingPayload.customerLastName}`.trim(),
            phone: bookingPayload.phoneNumber,
          },
        },
      });

      if (error) {
        throw new Error(error.message || t("bookingPaymentFailed"));
      }

      if (!paymentIntent || paymentIntent.status !== "succeeded") {
        throw new Error(t("bookingPaymentNotCompleted"));
      }

      onStatusMessage(t("bookingPaymentVerifying"));
      const bookingResponse = await completePaymentBooking(nextPaymentIntentId || paymentIntent.id);
      onSuccess(bookingResponse.booking);
    } catch (error) {
      onStatusMessage("");
      onError(error.message || t("bookingPaymentFailed"));
    } finally {
      onProcessingChange(false);
    }
  };

  return (
    <Box>
      <Box
        sx={{
          p: 1.8,
          borderRadius: 4,
          border: "1px solid rgba(255,255,255,0.12)",
          bgcolor: "rgba(8,17,27,0.55)",
        }}
      >
        <CardElement
          options={{
            disableLink: true,
            style: {
              base: {
                color: "#ffffff",
                fontSize: "16px",
                fontFamily: "Space Grotesk, sans-serif",
                "::placeholder": {
                  color: "rgba(255,255,255,0.42)",
                },
              },
              invalid: {
                color: "#ff8d92",
              },
            },
          }}
        />
      </Box>
      <Typography sx={{ mt: 1.1, color: "#6dd3ff", lineHeight: 1.7 }}>
        {t("bookingStripeHint")}
      </Typography>
      <Button
        type="button"
        variant="contained"
        onClick={handlePay}
        disabled={isProcessingPayment || isStripeLoading || !stripe}
        sx={{
          mt: 2.2,
          width: "100%",
          py: 1.4,
          borderRadius: 999,
          bgcolor: "#ff7a45",
          color: "#08111b",
          fontWeight: 800,
          "&:hover": {
            bgcolor: "#ff925d",
          },
          "&.Mui-disabled": {
            bgcolor: "rgba(255,255,255,0.08)",
            color: "rgba(255,255,255,0.38)",
          },
        }}
      >
        {isProcessingPayment ? t("bookingPaymentProcessing") : t("bookingPayConfirm")}
      </Button>
    </Box>
  );
};

export default Booking;
