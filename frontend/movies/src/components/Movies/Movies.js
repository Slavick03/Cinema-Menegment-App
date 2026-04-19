import React, { useEffect, useState } from "react";
import { getAllMovies } from "../../api-helpers/api-helpers";
import { Box, Typography } from "@mui/material";
import MovieItem from "./MovieItem";
import { useI18n } from "../../i18n/LanguageContext";

const Movies = () => {
  const [movies, setMovies] = useState([]);
  const { t } = useI18n();

  useEffect(() => {
    getAllMovies()
      .then((data) => setMovies(data.movies || []))
      .catch((err) => console.log(err.message));
  }, []);

  return (
    <Box margin="auto" marginTop={1}>
      <Box
        sx={{
          borderRadius: 6,
          p: { xs: 3, md: 4 },
          border: "1px solid rgba(255,255,255,0.08)",
          background:
            "linear-gradient(135deg, rgba(11,20,31,0.82), rgba(15,27,42,0.9))",
          boxShadow: "0 26px 70px rgba(0,0,0,0.26)",
        }}
      >
        <Typography
          sx={{
            color: "#6dd3ff",
            textTransform: "uppercase",
            letterSpacing: "0.18em",
            fontSize: "0.76rem",
            fontWeight: 800,
          }}
        >
          {t("moviesCatalog")}
        </Typography>
        <Typography
          marginTop={1}
          variant="h3"
          sx={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: { xs: "2rem", md: "3rem" },
          }}
        >
          {t("moviesAll")}
        </Typography>
      </Box>
      <Box
        width="100%"
        margin="auto"
        marginTop={4}
        display="flex"
        justifyContent={{ xs: "center", lg: "flex-start" }}
        flexWrap="wrap"
        gap={2}
      >
        {movies.map((movie) => (
          <MovieItem
            key={movie._id}
            averageRating={movie.averageRating}
            id={movie._id}
            posterUrl={movie.posterUrl}
            releaseDate={movie.releaseDate}
            ratingsCount={movie.ratingsCount}
            ticketPrice={movie.ticketPrice}
            title={movie.title}
          />
        ))}
      </Box>
    </Box>
  );
};

export default Movies;
