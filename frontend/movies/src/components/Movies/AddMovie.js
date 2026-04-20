import {
  Box,
  Button,
  Checkbox,
  FormLabel,
  TextField,
  Typography,
} from "@mui/material";
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  addMovie,
  getMovieDetails,
  updateMovie,
} from "../../api-helpers/api-helpers";
import { useI18n } from "../../i18n/LanguageContext";

const labelProps = {
  mt: 1,
  mb: 1,
};

const createInitialInputs = () => ({
  title: "",
  description: "",
  posterUrl: "",
  releaseDate: "",
  ticketPrice: "",
  featured: false,
});

const createEmptyShowtime = () => ({
  startTime: "",
  hall: "",
  price: "",
  totalSeats: "48",
});

const normalizeTicketPriceInput = (value) => `${value || ""}`.trim().replace(",", ".");
const updateShowtimeField = (showtimes, index, field, value) =>
  showtimes.map((item, itemIndex) =>
    itemIndex === index ? { ...item, [field]: value } : item
  );

const AddMovie = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);

  const [inputs, setInputs] = useState(createInitialInputs);
  const [actors, setActors] = useState([]);
  const [actor, setActor] = useState("");
  const [showtimes, setShowtimes] = useState([createEmptyShowtime()]);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoadingMovie, setIsLoadingMovie] = useState(isEditing);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { t } = useI18n();

  useEffect(() => {
    if (!isEditing) {
      setInputs(createInitialInputs());
      setActors([]);
      setActor("");
      setShowtimes([createEmptyShowtime()]);
      setErrorMessage("");
      setIsLoadingMovie(false);
      return;
    }

    setIsLoadingMovie(true);
    setErrorMessage("");

    getMovieDetails(id)
      .then((res) => {
        const movie = res.movie;

        setInputs({
          title: movie.title || "",
          description: movie.description || "",
          posterUrl: movie.posterUrl || "",
          releaseDate: movie.releaseDate
            ? new Date(movie.releaseDate).toISOString().split("T")[0]
            : "",
          ticketPrice:
            movie.ticketPrice === undefined || movie.ticketPrice === null
              ? ""
              : `${movie.ticketPrice}`,
          featured: Boolean(movie.featured),
        });
        setActors(Array.isArray(movie.actors) ? movie.actors.filter(Boolean) : []);
        setShowtimes(
          Array.isArray(movie.showtimes) && movie.showtimes.length
            ? movie.showtimes.map((showtime) => ({
                startTime: showtime.startTime
                  ? new Date(showtime.startTime).toISOString().slice(0, 16)
                  : "",
                hall: showtime.hall || "",
                price:
                  showtime.price === undefined || showtime.price === null
                    ? ""
                    : `${showtime.price}`,
                totalSeats:
                  showtime.totalSeats === undefined || showtime.totalSeats === null
                    ? "48"
                    : `${showtime.totalSeats}`,
              }))
            : [createEmptyShowtime()]
        );
      })
      .catch((err) => setErrorMessage(err.message))
      .finally(() => setIsLoadingMovie(false));
  }, [id, isEditing]);

  const handleChange = (e) => {
    setInputs((prevState) => ({
      ...prevState,
      [e.target.name]: e.target.value,
    }));
    setErrorMessage("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const trimmedActors = actors.map((item) => item.trim()).filter(Boolean);
    const normalizedShowtimes = showtimes
      .map((showtime) => ({
        startTime: `${showtime.startTime || ""}`.trim(),
        hall: `${showtime.hall || ""}`.trim(),
        price: normalizeTicketPriceInput(
          showtime.price === "" ? inputs.ticketPrice : showtime.price
        ),
        totalSeats: `${showtime.totalSeats || ""}`.trim(),
      }))
      .filter(
        (showtime) =>
          showtime.startTime || showtime.hall || showtime.price || showtime.totalSeats
      );

    if (!trimmedActors.length) {
      setErrorMessage(t("addMovieErrorActorRequired"));
      return;
    }

    const normalizedTicketPrice = normalizeTicketPriceInput(inputs.ticketPrice);

    if (!Number(normalizedTicketPrice) || Number(normalizedTicketPrice) <= 0) {
      setErrorMessage(t("addMovieErrorPriceRequired"));
      return;
    }

    if (!normalizedShowtimes.length) {
      setErrorMessage(t("addMovieErrorShowtimeRequired"));
      return;
    }

    const hasInvalidShowtime = normalizedShowtimes.some(
      (showtime) =>
        !showtime.startTime ||
        !showtime.hall ||
        !Number(showtime.price) ||
        Number(showtime.price) <= 0 ||
        !Number.isInteger(Number(showtime.totalSeats)) ||
        Number(showtime.totalSeats) <= 0
    );

    if (hasInvalidShowtime) {
      setErrorMessage(t("addMovieErrorShowtimeInvalid"));
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      if (isEditing) {
        await updateMovie(id, {
          ...inputs,
          actors: trimmedActors,
          ticketPrice: normalizedTicketPrice,
          showtimes: normalizedShowtimes,
        });
      } else {
        await addMovie({
          ...inputs,
          actors: trimmedActors,
          ticketPrice: normalizedTicketPrice,
          showtimes: normalizedShowtimes,
        });
      }

      navigate("/user-admin");
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <Box
          width={{ xs: "100%", md: "70%" }}
          padding={{ xs: 3, md: 6 }}
          margin="auto"
          display="flex"
          flexDirection="column"
          border="1px solid rgba(255,255,255,0.08)"
          borderRadius={6}
          bgcolor="rgba(11,20,31,0.84)"
          boxShadow="0 28px 70px rgba(0,0,0,0.28)"
        >
          <Typography
            textAlign="center"
            variant="h4"
            sx={{
              fontFamily: "'Space Grotesk', sans-serif",
              mb: 1,
            }}
          >
            {isEditing ? t("addMovieEditTitle") : t("addMovieCreateTitle")}
          </Typography>
          <Typography
            textAlign="center"
            sx={{ color: "rgba(255,255,255,0.62)", mb: 3 }}
          >
            {isEditing
              ? t("addMovieEditDescription")
              : t("addMovieCreateDescription")}
          </Typography>

          {isLoadingMovie ? (
            <Typography sx={{ color: "rgba(255,255,255,0.72)", textAlign: "center", py: 6 }}>
              {t("addMovieLoading")}
            </Typography>
          ) : (
            <>
              <FormLabel sx={{ ...labelProps, color: "rgba(255,255,255,0.76)" }}>
                {t("addMovieTitle")}
              </FormLabel>
              <TextField
                value={inputs.title}
                onChange={handleChange}
                name="title"
                variant="outlined"
                margin="normal"
                sx={fieldStyles}
              />
              <FormLabel sx={{ ...labelProps, color: "rgba(255,255,255,0.76)" }}>
                {t("addMovieDescriptionLabel")}
              </FormLabel>
              <TextField
                value={inputs.description}
                onChange={handleChange}
                name="description"
                variant="outlined"
                margin="normal"
                multiline
                minRows={4}
                sx={fieldStyles}
              />
              <FormLabel sx={{ ...labelProps, color: "rgba(255,255,255,0.76)" }}>
                {t("addMoviePosterUrl")}
              </FormLabel>
              <TextField
                value={inputs.posterUrl}
                onChange={handleChange}
                name="posterUrl"
                variant="outlined"
                margin="normal"
                sx={fieldStyles}
              />
              <FormLabel sx={{ ...labelProps, color: "rgba(255,255,255,0.76)" }}>
                {t("addMovieReleaseDate")}
              </FormLabel>
              <TextField
                type="date"
                value={inputs.releaseDate}
                onChange={handleChange}
                name="releaseDate"
                variant="outlined"
                margin="normal"
                sx={fieldStyles}
              />
              <FormLabel sx={{ ...labelProps, color: "rgba(255,255,255,0.76)" }}>
                {t("addMovieTicketPrice")}
              </FormLabel>
              <TextField
                type="number"
                inputProps={{ min: 0.01, step: "0.01" }}
                value={inputs.ticketPrice}
                onChange={handleChange}
                name="ticketPrice"
                variant="outlined"
                margin="normal"
                sx={fieldStyles}
              />
              <FormLabel sx={{ ...labelProps, color: "rgba(255,255,255,0.76)" }}>
                {t("addMovieActor")}
              </FormLabel>
              <Box display="flex" gap={1.5} flexDirection={{ xs: "column", sm: "row" }}>
                <TextField
                  value={actor}
                  name="actor"
                  onChange={(e) => setActor(e.target.value)}
                  variant="outlined"
                  margin="normal"
                  sx={{ ...fieldStyles, flex: 1 }}
                />
                <Button
                  type="button"
                  onClick={() => {
                    const normalizedActor = actor.trim();

                    if (!normalizedActor) {
                      return;
                    }

                    setActors((prevActors) => [...prevActors, normalizedActor]);
                    setActor("");
                    setErrorMessage("");
                  }}
                  variant="outlined"
                  sx={{
                    alignSelf: { xs: "stretch", sm: "center" },
                    borderRadius: 999,
                    borderColor: "rgba(255,255,255,0.18)",
                    color: "#6dd3ff",
                    px: 3,
                    py: 1.25,
                  }}
                >
                  {t("addMovieAddActor")}
                </Button>
              </Box>
              <Typography mt={1.5} sx={{ color: "rgba(255,255,255,0.56)" }}>
                {t("addMovieActors")}: {actors.length ? actors.join(", ") : t("addMovieNoActors")}
              </Typography>
              <Box
                mt={3}
                p={2.5}
                border="1px solid rgba(255,255,255,0.08)"
                borderRadius={4}
                bgcolor="rgba(255,255,255,0.03)"
              >
                <Typography
                  sx={{
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontSize: "1.1rem",
                    mb: 1.5,
                  }}
                >
                  {t("addMovieShowtimes")}
                </Typography>
                {showtimes.map((showtime, index) => (
                  <Box
                    key={`${index}-${showtime.startTime}-${showtime.hall}`}
                    mt={index ? 2 : 0}
                    p={2}
                    border="1px solid rgba(255,255,255,0.08)"
                    borderRadius={4}
                    bgcolor="rgba(8,17,27,0.35)"
                  >
                    <Typography sx={{ color: "#6dd3ff", mb: 1 }}>
                      {t("addMovieShowtimeLabel", { index: index + 1 })}
                    </Typography>
                    <Box
                      display="grid"
                      gridTemplateColumns={{ xs: "1fr", md: "repeat(2, minmax(0, 1fr))" }}
                      gap={2}
                      alignItems="end"
                    >
                      <Box>
                        <FormLabel sx={{ ...labelProps, color: "rgba(255,255,255,0.76)" }}>
                          {t("bookingShowtime")}
                        </FormLabel>
                        <TextField
                          type="datetime-local"
                          value={showtime.startTime}
                          onChange={(e) =>
                            setShowtimes((prevState) =>
                              updateShowtimeField(prevState, index, "startTime", e.target.value)
                            )
                          }
                          variant="outlined"
                          margin="normal"
                          fullWidth
                          sx={fieldStyles}
                        />
                      </Box>
                      <Box>
                        <FormLabel sx={{ ...labelProps, color: "rgba(255,255,255,0.76)" }}>
                          {t("bookingHall")}
                        </FormLabel>
                        <TextField
                          value={showtime.hall}
                          onChange={(e) =>
                            setShowtimes((prevState) =>
                              updateShowtimeField(prevState, index, "hall", e.target.value)
                            )
                          }
                          variant="outlined"
                          margin="normal"
                          fullWidth
                          sx={fieldStyles}
                        />
                      </Box>
                      <Box>
                        <FormLabel sx={{ ...labelProps, color: "rgba(255,255,255,0.76)" }}>
                          {t("addMovieShowtimePrice")}
                        </FormLabel>
                        <TextField
                          type="number"
                          inputProps={{ min: 0.01, step: "0.01" }}
                          value={showtime.price}
                          onChange={(e) =>
                            setShowtimes((prevState) =>
                              updateShowtimeField(prevState, index, "price", e.target.value)
                            )
                          }
                          variant="outlined"
                          margin="normal"
                          fullWidth
                          sx={fieldStyles}
                        />
                      </Box>
                      <Box>
                        <FormLabel sx={{ ...labelProps, color: "rgba(255,255,255,0.76)" }}>
                          {t("bookingSeatCapacity")}
                        </FormLabel>
                        <TextField
                          type="number"
                          inputProps={{ min: 1, step: "1" }}
                          value={showtime.totalSeats}
                          onChange={(e) =>
                            setShowtimes((prevState) =>
                              updateShowtimeField(prevState, index, "totalSeats", e.target.value)
                            )
                          }
                          variant="outlined"
                          margin="normal"
                          fullWidth
                          sx={fieldStyles}
                        />
                      </Box>
                    </Box>
                    <Box display="flex" justifyContent="flex-end" mt={2}>
                      <Button
                        type="button"
                        variant="outlined"
                        onClick={() =>
                          setShowtimes((prevState) =>
                            prevState.length === 1
                              ? [createEmptyShowtime()]
                              : prevState.filter((_, itemIndex) => itemIndex !== index)
                          )
                        }
                        sx={{
                          borderRadius: 999,
                          borderColor: "rgba(255,154,162,0.28)",
                          color: "#ff9aa2",
                          px: 2.5,
                          "&:hover": {
                            borderColor: "#ff9aa2",
                            bgcolor: "rgba(255,154,162,0.08)",
                          },
                        }}
                      >
                        {t("commonDelete")}
                      </Button>
                    </Box>
                  </Box>
                ))}
                <Button
                  type="button"
                  variant="outlined"
                  onClick={() =>
                    setShowtimes((prevState) => [...prevState, createEmptyShowtime()])
                  }
                  sx={{
                    mt: 2,
                    borderRadius: 999,
                    borderColor: "rgba(255,255,255,0.18)",
                    color: "#6dd3ff",
                    px: 3,
                    py: 1.2,
                  }}
                >
                  {t("addMovieAddShowtime")}
                </Button>
              </Box>
              {errorMessage && (
                <Typography mt={1.5} sx={{ color: "#ff9aa2" }}>
                  {errorMessage}
                </Typography>
              )}
              <FormLabel sx={{ ...labelProps, color: "rgba(255,255,255,0.76)", mt: 2 }}>
                {t("addMovieFeatured")}
              </FormLabel>
              <Checkbox
                name="featured"
                checked={inputs.featured}
                onChange={(e) =>
                  setInputs((prevState) => ({
                    ...prevState,
                    featured: e.target.checked,
                  }))
                }
                sx={{
                  mr: "auto",
                  color: "rgba(255,255,255,0.54)",
                  "&.Mui-checked": {
                    color: "#ff7a45",
                  },
                }}
              />
              <Box
                display="flex"
                justifyContent="center"
                gap={1.5}
                flexDirection={{ xs: "column", sm: "row" }}
                mt={3}
              >
                <Button
                  type="button"
                  variant="outlined"
                  onClick={() => navigate("/user-admin")}
                  disabled={isSubmitting}
                  sx={{
                    width: { xs: "100%", sm: "32%" },
                    py: 1.35,
                    borderRadius: 999,
                    borderColor: "rgba(255,255,255,0.18)",
                    color: "white",
                    ":hover": {
                      borderColor: "#6dd3ff",
                      bgcolor: "rgba(109,211,255,0.08)",
                    },
                  }}
                >
                  {t("commonCancel")}
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={isSubmitting}
                  sx={{
                    width: { xs: "100%", sm: "40%", md: "32%" },
                    py: 1.35,
                    borderRadius: 999,
                    bgcolor: "#ff7a45",
                    color: "#08111b",
                    fontWeight: 800,
                    ":hover": {
                      bgcolor: "#ff925d",
                    },
                  }}
                >
                  {isSubmitting
                    ? isEditing
                      ? t("commonSaving")
                      : t("commonPublishing")
                    : isEditing
                      ? t("commonSaveChanges")
                      : t("addMovieSubmit")}
                </Button>
              </Box>
            </>
          )}
        </Box>
      </form>
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

export default AddMovie;
