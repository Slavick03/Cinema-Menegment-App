import { Box } from "@mui/system";
import React, { Fragment, useEffect, useState } from "react";
import {
  deleteAdminBooking,
  deleteAdminReview,
  deleteMovie,
  getAdminById,
  getHomeHeroSettings,
  updateHomeHeroSettings,
} from "../api-helpers/api-helpers";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import AnalyticsOutlinedIcon from "@mui/icons-material/AnalyticsOutlined";
import {
  Button,
  Divider,
  List,
  ListItem,
  ListItemText,
  TextField,
  Typography,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useI18n } from "../i18n/LanguageContext";

const AdminProfile = () => {
  const navigate = useNavigate();
  const [admin, setAdmin] = useState();
  const [errorMessage, setErrorMessage] = useState("");
  const [deletingMovieId, setDeletingMovieId] = useState("");
  const [deletingBookingId, setDeletingBookingId] = useState("");
  const [deletingReviewId, setDeletingReviewId] = useState("");
  const [heroForm, setHeroForm] = useState({
    badgeLabel: "",
    title: "",
    description: "",
    posterUrl: "",
  });
  const [isSavingHero, setIsSavingHero] = useState(false);
  const [heroStatusMessage, setHeroStatusMessage] = useState("");
  const [heroErrorMessage, setHeroErrorMessage] = useState("");
  const { t } = useI18n();
  const heroTextFieldSx = {
    "& .MuiInputBase-input": {
      color: "white",
    },
    "& .MuiInputLabel-root": {
      color: "rgba(255,255,255,0.7)",
    },
    "& .MuiInputLabel-root.Mui-focused": {
      color: "#6dd3ff",
    },
    "& .MuiOutlinedInput-root .MuiOutlinedInput-notchedOutline": {
      borderColor: "rgba(255,255,255,0.2)",
    },
    "& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline": {
      borderColor: "rgba(255,255,255,0.35)",
    },
    "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
      borderColor: "#6dd3ff",
    },
  };
  const formatCurrency = (value) => `$${Number(value || 0).toFixed(2)}`;
  const refreshAdmin = async () => {
    const res = await getAdminById();
    setAdmin(res.admin);
  };

  useEffect(() => {
    Promise.all([getAdminById(), getHomeHeroSettings()])
      .then(([adminData, heroData]) => {
        setAdmin(adminData.admin);
        if (heroData?.settings) {
          setHeroForm({
            badgeLabel: heroData.settings.badgeLabel || "",
            title: heroData.settings.title || "",
            description: heroData.settings.description || "",
            posterUrl: heroData.settings.posterUrl || "",
          });
        }
      })
      .catch((err) => console.log(err.message));
  }, []);

  const handleHeroFieldChange = (field) => (event) => {
    setHeroStatusMessage("");
    setHeroErrorMessage("");
    setHeroForm((previousForm) => ({
      ...previousForm,
      [field]: event.target.value,
    }));
  };

  const handleSaveHeroSettings = async () => {
    setHeroStatusMessage("");
    setHeroErrorMessage("");
    setIsSavingHero(true);

    try {
      const response = await updateHomeHeroSettings(heroForm);
      const settings = response?.settings || {};
      setHeroForm({
        badgeLabel: settings.badgeLabel || "",
        title: settings.title || "",
        description: settings.description || "",
        posterUrl: settings.posterUrl || "",
      });
      setHeroStatusMessage("Hero block updated successfully.");
    } catch (err) {
      setHeroErrorMessage(err.message);
    } finally {
      setIsSavingHero(false);
    }
  };

  const handleDeleteMovie = async (movieId) => {
    setErrorMessage("");
    setDeletingMovieId(movieId);

    try {
      await deleteMovie(movieId);
      await refreshAdmin();
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setDeletingMovieId("");
    }
  };

  const handleDeleteBooking = async (bookingId) => {
    setErrorMessage("");
    setDeletingBookingId(bookingId);

    try {
      await deleteAdminBooking(bookingId);
      await refreshAdmin();
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setDeletingBookingId("");
    }
  };

  const handleDeleteReview = async (reviewId) => {
    setErrorMessage("");
    setDeletingReviewId(reviewId);

    try {
      await deleteAdminReview(reviewId);
      await refreshAdmin();
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setDeletingReviewId("");
    }
  };

  return (
    <Box width="100%" display="flex" flexDirection={{ xs: "column", md: "row" }}>
      <Fragment>
        {" "}
        {admin && (
          <Box
            display="flex"
            flexDirection={"column"}
            justifyContent="center"
            alignItems={"center"}
            width={{ xs: "100%", md: "32%" }}
            padding={3}
            borderRadius={6}
            border="1px solid rgba(255,255,255,0.08)"
            bgcolor="rgba(11,20,31,0.84)"
            boxShadow="0 24px 60px rgba(0,0,0,0.28)"
          >
            <AccountCircleIcon
              sx={{ fontSize: "8rem", textAlign: "center", color: "#ff7a45" }}
            />

            <Typography
              mt={1}
              padding={1}
              width="100%"
              textAlign={"center"}
              border={"1px solid rgba(255,255,255,0.08)"}
              borderRadius={4}
              bgcolor="rgba(255,255,255,0.03)"
            >
              {t("profileEmail")}: {admin.email}
            </Typography>
            <Button
              fullWidth
              variant="contained"
              startIcon={<AnalyticsOutlinedIcon />}
              onClick={() => navigate("/admin-analytics")}
              sx={{
                mt: 2,
                borderRadius: 999,
                bgcolor: "#6dd3ff",
                color: "#08111b",
                fontWeight: 800,
                py: 1.2,
                ":hover": {
                  bgcolor: "#8bddff",
                },
              }}
            >
              {t("adminOpenAnalytics")}
            </Button>
          </Box>
        )}
        {admin && (
          <Box
            width={{ xs: "100%", md: "68%" }}
            display="flex"
            flexDirection={"column"}
            ml={{ xs: 0, md: 3 }}
            mt={{ xs: 3, md: 0 }}
            p={{ xs: 3, md: 4 }}
            borderRadius={6}
            border="1px solid rgba(255,255,255,0.08)"
            bgcolor="rgba(11,20,31,0.84)"
            boxShadow="0 24px 60px rgba(0,0,0,0.28)"
          >
            <Typography
              variant="h4"
              sx={{
                fontFamily: "'Space Grotesk', sans-serif",
                textAlign: "center",
                pb: 2,
                fontSize: { xs: "1.55rem", md: "2rem" },
              }}
            >
              Home Hero Block
            </Typography>
            <Divider sx={{ borderColor: "rgba(255,255,255,0.08)", mb: 2 }} />
            {heroStatusMessage && (
              <Typography sx={{ color: "#9de8b3", mb: 2, textAlign: "center" }}>
                {heroStatusMessage}
              </Typography>
            )}
            {heroErrorMessage && (
              <Typography sx={{ color: "#ff9aa2", mb: 2, textAlign: "center" }}>
                {heroErrorMessage}
              </Typography>
            )}
            <Box display="flex" flexDirection="column" gap={1.5} mb={3}>
              <TextField
                label="Badge text"
                value={heroForm.badgeLabel}
                onChange={handleHeroFieldChange("badgeLabel")}
                fullWidth
                size="small"
                sx={heroTextFieldSx}
              />
              <TextField
                label="Hero title"
                value={heroForm.title}
                onChange={handleHeroFieldChange("title")}
                fullWidth
                size="small"
                sx={heroTextFieldSx}
              />
              <TextField
                label="Hero description"
                value={heroForm.description}
                onChange={handleHeroFieldChange("description")}
                fullWidth
                multiline
                minRows={3}
                sx={heroTextFieldSx}
              />
              <TextField
                label="Poster URL"
                value={heroForm.posterUrl}
                onChange={handleHeroFieldChange("posterUrl")}
                fullWidth
                size="small"
                sx={heroTextFieldSx}
              />
              <Button
                variant="contained"
                onClick={handleSaveHeroSettings}
                disabled={isSavingHero}
                sx={{
                  borderRadius: 999,
                  bgcolor: "#ff7a45",
                  color: "#08111b",
                  fontWeight: 800,
                  px: 3,
                  alignSelf: "flex-start",
                  ":hover": {
                    bgcolor: "#ff925d",
                  },
                }}
              >
                {isSavingHero ? t("commonSaving") : "Save hero block"}
              </Button>
            </Box>

            <Typography
              variant="h3"
              sx={{
                fontFamily: "'Space Grotesk', sans-serif",
                textAlign: "center",
                pb: 2,
                fontSize: { xs: "2rem", md: "2.6rem" },
              }}
            >
              {t("adminAddedMovies")}
            </Typography>
            <Divider sx={{ borderColor: "rgba(255,255,255,0.08)", mb: 2 }} />
            {errorMessage && (
              <Typography sx={{ color: "#ff9aa2", mb: 2, textAlign: "center" }}>
                {errorMessage}
              </Typography>
            )}
            <Box margin={"auto"} display="flex" flexDirection={"column"} width="100%">
              {admin.addedMovies.length > 0 ? (
                <List>
                  {admin.addedMovies.map((movie) => (
                    <ListItem
                      key={movie._id}
                      sx={{
                        bgcolor: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        color: "white",
                        textAlign: "center",
                        marginY: 1,
                        borderRadius: 4,
                        gap: 2,
                        flexDirection: { xs: "column", sm: "row" },
                        alignItems: { xs: "stretch", sm: "center" },
                      }}
                    >
                      <ListItemText
                        sx={{ margin: 1, width: "auto", textAlign: "left" }}
                        primary={`${t("adminMovieLabel")}: ${movie.title}`}
                        secondary={`${t("addMovieTicketPrice")}: ${formatCurrency(movie.ticketPrice)}`}
                        secondaryTypographyProps={{ sx: { color: "rgba(255,255,255,0.52)" } }}
                      />
                      <Box
                        display="flex"
                        gap={1.25}
                        width={{ xs: "100%", sm: "auto" }}
                        flexDirection={{ xs: "column", sm: "row" }}
                      >
                        <Button
                          variant="outlined"
                          onClick={() => navigate(`/edit/${movie._id}`)}
                          sx={{
                            borderRadius: 999,
                            borderColor: "rgba(109,211,255,0.24)",
                            color: "#6dd3ff",
                            fontWeight: 800,
                            px: 3,
                            ":hover": {
                              borderColor: "#6dd3ff",
                              bgcolor: "rgba(109,211,255,0.08)",
                            },
                          }}
                        >
                          {t("commonEdit")}
                        </Button>
                        <Button
                          variant="contained"
                          onClick={() => handleDeleteMovie(movie._id)}
                          disabled={deletingMovieId === movie._id}
                          sx={{
                            borderRadius: 999,
                            bgcolor: "#ff6b6b",
                            color: "#08111b",
                            fontWeight: 800,
                            px: 3,
                            ":hover": {
                              bgcolor: "#ff8585",
                            },
                          }}
                        >
                          {deletingMovieId === movie._id ? t("commonDeleting") : t("commonDelete")}
                        </Button>
                      </Box>
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography sx={{ color: "rgba(255,255,255,0.62)", textAlign: "center" }}>
                  {t("adminNoMovies")}
                </Typography>
              )}
            </Box>

            <Typography
              variant="h4"
              sx={{
                fontFamily: "'Space Grotesk', sans-serif",
                textAlign: "center",
                pt: 4,
                pb: 2,
                fontSize: { xs: "1.55rem", md: "2rem" },
              }}
            >
              {t("adminManageBookings")}
            </Typography>
            <Divider sx={{ borderColor: "rgba(255,255,255,0.08)", mb: 2 }} />
            {admin.managedBookings?.length > 0 ? (
              <List>
                {admin.managedBookings.map((booking) => (
                  <ListItem
                    key={booking._id}
                    sx={{
                      bgcolor: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      color: "white",
                      marginY: 1,
                      borderRadius: 4,
                      gap: 2,
                      flexDirection: { xs: "column", sm: "row" },
                      alignItems: { xs: "stretch", sm: "center" },
                    }}
                  >
                    <ListItemText
                      sx={{ margin: 1, width: "auto", textAlign: "left" }}
                      primary={`${booking.movieTitle} • ${t("adminBookingSeat")}: ${booking.seatNumber}`}
                      secondary={`${t("adminBookingCustomer")}: ${booking.customerFirstName} ${booking.customerLastName} • ${t("adminBookingShowtime")}: ${new Date(booking.date).toLocaleString()} • ${t("adminMovieRevenue")}: ${formatCurrency(booking.totalPrice)}`}
                      secondaryTypographyProps={{ sx: { color: "rgba(255,255,255,0.52)" } }}
                    />
                    <Button
                      variant="contained"
                      onClick={() => handleDeleteBooking(booking._id)}
                      disabled={deletingBookingId === booking._id}
                      sx={{
                        borderRadius: 999,
                        bgcolor: "#ff6b6b",
                        color: "#08111b",
                        fontWeight: 800,
                        px: 3,
                        ":hover": {
                          bgcolor: "#ff8585",
                        },
                      }}
                    >
                      {deletingBookingId === booking._id ? t("commonDeleting") : t("adminCancelBooking")}
                    </Button>
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography sx={{ color: "rgba(255,255,255,0.62)", textAlign: "center" }}>
                {t("adminNoManagedBookings")}
              </Typography>
            )}

            <Typography
              variant="h4"
              sx={{
                fontFamily: "'Space Grotesk', sans-serif",
                textAlign: "center",
                pt: 4,
                pb: 2,
                fontSize: { xs: "1.55rem", md: "2rem" },
              }}
            >
              {t("adminManageReviews")}
            </Typography>
            <Divider sx={{ borderColor: "rgba(255,255,255,0.08)", mb: 2 }} />
            {admin.managedReviews?.length > 0 ? (
              <List>
                {admin.managedReviews.map((review) => (
                  <ListItem
                    key={review._id}
                    sx={{
                      bgcolor: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      color: "white",
                      marginY: 1,
                      borderRadius: 4,
                      gap: 2,
                      flexDirection: { xs: "column", sm: "row" },
                      alignItems: { xs: "stretch", sm: "center" },
                    }}
                  >
                    <ListItemText
                      sx={{ margin: 1, width: "auto", textAlign: "left" }}
                      primary={`${review.movieTitle} • ${t("adminReviewRating")}: ${review.rating}/5`}
                      secondary={`${t("adminReviewAuthor")}: ${review.userName} • ${review.text}`}
                      secondaryTypographyProps={{ sx: { color: "rgba(255,255,255,0.52)" } }}
                    />
                    <Button
                      variant="contained"
                      onClick={() => handleDeleteReview(review._id)}
                      disabled={deletingReviewId === review._id}
                      sx={{
                        borderRadius: 999,
                        bgcolor: "#ff6b6b",
                        color: "#08111b",
                        fontWeight: 800,
                        px: 3,
                        ":hover": {
                          bgcolor: "#ff8585",
                        },
                      }}
                    >
                      {deletingReviewId === review._id ? t("commonDeleting") : t("adminDeleteReview")}
                    </Button>
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography sx={{ color: "rgba(255,255,255,0.62)", textAlign: "center" }}>
                {t("adminNoManagedReviews")}
              </Typography>
            )}
          </Box>
        )}
      </Fragment>
    </Box>
  );
};

export default AdminProfile;
