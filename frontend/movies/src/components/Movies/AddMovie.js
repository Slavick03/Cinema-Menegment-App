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

const normalizeTicketPriceInput = (value) => `${value || ""}`.trim().replace(",", ".");

const AddMovie = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);

  const [inputs, setInputs] = useState(createInitialInputs);
  const [actors, setActors] = useState([]);
  const [actor, setActor] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoadingMovie, setIsLoadingMovie] = useState(isEditing);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isEditing) {
      setInputs(createInitialInputs());
      setActors([]);
      setActor("");
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

    if (!trimmedActors.length) {
      setErrorMessage("Add at least one actor before saving the movie.");
      return;
    }

    const normalizedTicketPrice = normalizeTicketPriceInput(inputs.ticketPrice);

    if (!Number(normalizedTicketPrice) || Number(normalizedTicketPrice) <= 0) {
      setErrorMessage("Set a ticket price greater than 0.");
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
        });
      } else {
        await addMovie({
          ...inputs,
          actors: trimmedActors,
          ticketPrice: normalizedTicketPrice,
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
            {isEditing ? "Edit Movie" : "Add New Movie"}
          </Typography>
          <Typography
            textAlign="center"
            sx={{ color: "rgba(255,255,255,0.62)", mb: 3 }}
          >
            {isEditing
              ? "Refresh the movie details already visible in the cinema catalog."
              : "Publish a fresh release to the cinema catalog."}
          </Typography>

          {isLoadingMovie ? (
            <Typography sx={{ color: "rgba(255,255,255,0.72)", textAlign: "center", py: 6 }}>
              Loading movie details...
            </Typography>
          ) : (
            <>
              <FormLabel sx={{ ...labelProps, color: "rgba(255,255,255,0.76)" }}>
                Title
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
                Description
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
                Poster URL
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
                Release Date
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
                Ticket Price
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
                Actor
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
                  Add
                </Button>
              </Box>
              <Typography mt={1.5} sx={{ color: "rgba(255,255,255,0.56)" }}>
                Actors: {actors.length ? actors.join(", ") : "No actors added yet"}
              </Typography>
              {errorMessage && (
                <Typography mt={1.5} sx={{ color: "#ff9aa2" }}>
                  {errorMessage}
                </Typography>
              )}
              <FormLabel sx={{ ...labelProps, color: "rgba(255,255,255,0.76)", mt: 2 }}>
                Featured
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
                  Cancel
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
                      ? "Saving..."
                      : "Publishing..."
                    : isEditing
                      ? "Save Changes"
                      : "Add New Movie"}
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
