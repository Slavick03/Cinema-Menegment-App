import { Box, Button, Chip, Stack, Typography } from "@mui/material";
import React, { useEffect, useState } from "react";
import MovieItem from "./Movies/MovieItem";
import { Link } from "react-router-dom";
import { getAllMovies } from "../api-helpers/api-helpers";

const HomePage = () => {
  const [movies, setMovies] = useState([]);
  useEffect(() => {
    getAllMovies()
      .then((data) => setMovies(data.movies || []))
      .catch((err) => console.log(err.message));
  }, []);
  return (
    <Box width="100%" height="100%" margin="auto" marginTop={1}>
      <Box
        sx={{
          position: "relative",
          overflow: "hidden",
          minHeight: { xs: "auto", md: "68vh" },
          borderRadius: { xs: 6, md: 8 },
          border: "1px solid rgba(255,255,255,0.08)",
          background:
            "linear-gradient(135deg, rgba(7,12,20,0.9), rgba(17,27,43,0.88))",
          boxShadow: "0 30px 80px rgba(0,0,0,0.34)",
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "1.1fr 0.9fr" },
        }}
      >
        <Box
          sx={{
            p: { xs: 3, md: 7 },
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            gap: 3,
            position: "relative",
            zIndex: 1,
          }}
        >
          <Chip
            label="Now showing"
            sx={{
              width: "fit-content",
              bgcolor: "rgba(255,122,69,0.12)",
              color: "#ffb08d",
              border: "1px solid rgba(255,122,69,0.22)",
              fontWeight: 700,
            }}
          />
          <Typography
            sx={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: { xs: "2.4rem", md: "4.6rem" },
              lineHeight: 0.96,
              fontWeight: 700,
              letterSpacing: "-0.04em",
              maxWidth: "10ch",
            }}
          >
            Feel every scene before the lights go down.
          </Typography>
          <Typography
            sx={{
              maxWidth: 560,
              fontSize: { xs: "1rem", md: "1.1rem" },
              lineHeight: 1.8,
              color: "rgba(255,255,255,0.72)",
            }}
          >
            Discover the freshest releases, reserve seats in seconds and turn a
            regular night out into a full cinema experience.
          </Typography>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <Button
              LinkComponent={Link}
              to="/movies"
              variant="contained"
              sx={{
                px: 3.5,
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
              Browse Movies
            </Button>
            <Button
              LinkComponent={Link}
              to="/auth"
              variant="outlined"
              sx={{
                px: 3.5,
                py: 1.4,
                borderRadius: 999,
                borderColor: "rgba(255,255,255,0.18)",
                color: "white",
                "&:hover": {
                  borderColor: "#6dd3ff",
                  bgcolor: "rgba(109,211,255,0.08)",
                },
              }}
            >
              Sign In To Book
            </Button>
          </Stack>
        </Box>
        <Box
          sx={{
            p: { xs: 2, md: 3 },
            display: "flex",
            alignItems: "stretch",
          }}
        >
          <Box
            sx={{
              width: "100%",
              minHeight: { xs: 320, md: "100%" },
              borderRadius: { xs: 5, md: 6 },
              overflow: "hidden",
              position: "relative",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <img
              src="https://i.ytimg.com/vi/bweRG6WueuM/maxresdefault.jpg"
              alt="Featured cinema release"
              width="100%"
              height="100%"
              style={{ objectFit: "cover" }}
            />
            <Box
              sx={{
                position: "absolute",
                inset: 0,
                background:
                  "linear-gradient(180deg, rgba(0,0,0,0.04), rgba(0,0,0,0.68))",
              }}
            />
          </Box>
        </Box>
      </Box>
      <Box
        paddingTop={7}
        paddingBottom={3}
        display="flex"
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", md: "flex-end" }}
        flexDirection={{ xs: "column", md: "row" }}
        gap={2}
      >
        <Box>
          <Typography
            sx={{
              color: "#6dd3ff",
              textTransform: "uppercase",
              letterSpacing: "0.18em",
              fontSize: "0.76rem",
              fontWeight: 800,
            }}
          >
            Curated tonight
          </Typography>
          <Typography
            variant="h3"
            sx={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: { xs: "2rem", md: "2.8rem" },
              mt: 1,
            }}
          >
            Latest Releases
          </Typography>
        </Box>
        <Typography
          sx={{
            maxWidth: 540,
            color: "rgba(255,255,255,0.62)",
            lineHeight: 1.7,
          }}
        >
          A handpicked lineup of new titles ready for your next booking.
        </Typography>
      </Box>
      <Box
        display="flex"
        width="100%"
        justifyContent={{ xs: "center", lg: "space-between" }}
        alignItems="stretch"
        flexWrap="wrap"
        gap={2}
      >
        {movies &&
          movies
            .slice(0, 4)
            .map((movie) => (
              <MovieItem
                id={movie._id}
                title={movie.title}
                posterUrl={movie.posterUrl}
                releaseDate={movie.releaseDate}
                key={movie._id}
              />
            ))}
      </Box>
      <Box display="flex" paddingTop={5} paddingBottom={3} margin="auto">
        <Button
          LinkComponent={Link}
          to="/movies"
          variant="contained"
          sx={{
            margin: "auto",
            px: 3.5,
            py: 1.4,
            borderRadius: 999,
            color: "#08111b",
            bgcolor: "#6dd3ff",
            fontWeight: 800,
            "&:hover": {
              bgcolor: "#96e0ff",
            },
          }}
        >
          View All Movies
        </Button>
      </Box>
    </Box>
  );
};

export default HomePage;
