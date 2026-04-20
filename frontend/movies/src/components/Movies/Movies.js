import React, { useEffect, useState } from "react";
import { getAllMovies } from "../../api-helpers/api-helpers";
import {
  Box,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import MovieItem from "./MovieItem";
import { useI18n } from "../../i18n/LanguageContext";

const initialFilters = {
  search: "",
  releaseDateFrom: "",
  releaseDateTo: "",
  status: "",
  sortBy: "",
  sortOrder: "desc",
};

const filterFieldSx = {
  "& .MuiInputLabel-root": {
    color: "rgba(232, 241, 255, 0.82)",
  },
  "& .MuiInputLabel-root.Mui-focused": {
    color: "#9edfff",
  },
  "& .MuiInputLabel-root.Mui-disabled": {
    color: "rgba(232, 241, 255, 0.45)",
  },
  "& .MuiOutlinedInput-root": {
    color: "#f6fbff",
    background: "rgba(9, 18, 28, 0.88)",
    "& fieldset": {
      borderColor: "rgba(139, 183, 218, 0.22)",
    },
    "&:hover fieldset": {
      borderColor: "rgba(120, 197, 255, 0.48)",
    },
    "&.Mui-focused fieldset": {
      borderColor: "#4cb8ff",
      borderWidth: "1px",
    },
    "&.Mui-disabled": {
      background: "rgba(9, 18, 28, 0.55)",
      color: "rgba(246, 251, 255, 0.45)",
    },
  },
  "& .MuiOutlinedInput-input": {
    color: "#f6fbff",
  },
  "& .MuiOutlinedInput-input::placeholder": {
    color: "rgba(226, 237, 248, 0.72)",
    opacity: 1,
  },
  "& .MuiSelect-icon": {
    color: "rgba(214, 234, 251, 0.8)",
  },
  "& .MuiSvgIcon-root": {
    color: "rgba(214, 234, 251, 0.85)",
  },
  "& .Mui-disabled .MuiSelect-icon": {
    color: "rgba(214, 234, 251, 0.35)",
  },
};

const Movies = () => {
  const [movies, setMovies] = useState([]);
  const [filters, setFilters] = useState(initialFilters);
  const { t } = useI18n();

  useEffect(() => {
    getAllMovies(filters)
      .then((data) => setMovies(data.movies || []))
      .catch((err) => console.log(err.message));
  }, [filters]);

  const handleFilterChange = (key) => (event) => {
    const nextValue = event.target.value;

    setFilters((prevFilters) => {
      const nextFilters = {
        ...prevFilters,
        [key]: nextValue,
      };

      if (key === "sortBy" && !nextValue) {
        nextFilters.sortOrder = "desc";
      }

      return nextFilters;
    });
  };

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
        sx={{
          mt: 3,
          p: { xs: 2, md: 3 },
          borderRadius: 5,
          border: "1px solid rgba(255,255,255,0.08)",
          background:
            "linear-gradient(135deg, rgba(12,24,37,0.94), rgba(7,14,22,0.96))",
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            md: "repeat(2, minmax(0, 1fr))",
            xl: "repeat(5, minmax(0, 1fr))",
          },
          gap: 2,
        }}
      >
        <TextField
          fullWidth
          label={t("moviesSearchLabel")}
          placeholder={t("searchMovies")}
          value={filters.search}
          onChange={handleFilterChange("search")}
          InputLabelProps={{ shrink: true }}
          sx={filterFieldSx}
        />
        <TextField
          fullWidth
          label={t("moviesReleaseFrom")}
          type="date"
          value={filters.releaseDateFrom}
          onChange={handleFilterChange("releaseDateFrom")}
          InputLabelProps={{ shrink: true }}
          sx={filterFieldSx}
        />
        <TextField
          fullWidth
          label={t("moviesReleaseTo")}
          type="date"
          value={filters.releaseDateTo}
          onChange={handleFilterChange("releaseDateTo")}
          InputLabelProps={{ shrink: true }}
          sx={filterFieldSx}
        />
        <FormControl fullWidth sx={filterFieldSx}>
          <InputLabel>
            {t("moviesStatusLabel")}
          </InputLabel>
          <Select
            value={filters.status}
            label={t("moviesStatusLabel")}
            onChange={handleFilterChange("status")}
          >
            <MenuItem value="">{t("moviesStatusAll")}</MenuItem>
            <MenuItem value="featured">{t("moviesStatusFeatured")}</MenuItem>
            <MenuItem value="now_showing">{t("moviesStatusNowShowing")}</MenuItem>
            <MenuItem value="upcoming">{t("moviesStatusUpcoming")}</MenuItem>
          </Select>
        </FormControl>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gap: 2,
          }}
        >
          <FormControl fullWidth sx={filterFieldSx}>
            <InputLabel>
              {t("moviesSortBy")}
            </InputLabel>
            <Select
              value={filters.sortBy}
              label={t("moviesSortBy")}
              onChange={handleFilterChange("sortBy")}
            >
              <MenuItem value="">{t("moviesSortDefault")}</MenuItem>
              <MenuItem value="rating">{t("moviesSortRating")}</MenuItem>
              <MenuItem value="price">{t("moviesSortPrice")}</MenuItem>
            </Select>
          </FormControl>
          <FormControl fullWidth disabled={!filters.sortBy} sx={filterFieldSx}>
            <InputLabel>
              {t("moviesSortOrder")}
            </InputLabel>
            <Select
              value={filters.sortOrder}
              label={t("moviesSortOrder")}
              onChange={handleFilterChange("sortOrder")}
            >
              <MenuItem value="desc">{t("moviesSortDesc")}</MenuItem>
              <MenuItem value="asc">{t("moviesSortAsc")}</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Box>
      <Typography
        sx={{
          mt: 3,
          color: "rgba(255,255,255,0.7)",
          fontWeight: 600,
        }}
      >
        {t("moviesResultsCount", { count: movies.length })}
      </Typography>
      <Box
        width="100%"
        margin="auto"
        marginTop={4}
        display="flex"
        justifyContent={{ xs: "center", lg: "flex-start" }}
        flexWrap="wrap"
        gap={2}
      >
        {movies.length > 0 ? (
          movies.map((movie) => (
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
          ))
        ) : (
          <Box
            sx={{
              width: "100%",
              p: 4,
              borderRadius: 5,
              textAlign: "center",
              border: "1px dashed rgba(255,255,255,0.15)",
              background: "rgba(8,17,27,0.35)",
            }}
          >
            <Typography variant="h6" sx={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              {t("moviesEmptyTitle")}
            </Typography>
            <Typography sx={{ mt: 1, color: "rgba(255,255,255,0.65)" }}>
              {t("moviesEmptyDescription")}
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default Movies;
