import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Divider,
  LinearProgress,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import LocalFireDepartmentRoundedIcon from "@mui/icons-material/LocalFireDepartmentRounded";
import PaidRoundedIcon from "@mui/icons-material/PaidRounded";
import ConfirmationNumberRoundedIcon from "@mui/icons-material/ConfirmationNumberRounded";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import { useNavigate } from "react-router-dom";
import { getAdminById } from "../api-helpers/api-helpers";
import { useI18n } from "../i18n/LanguageContext";

const SummaryCard = ({ title, value, subtitle, accent }) => (
  <Paper
    elevation={0}
    sx={{
      p: 2.25,
      borderRadius: 5,
      color: "white",
      background: `linear-gradient(180deg, ${accent} 0%, rgba(11,20,31,0.88) 100%)`,
      border: "1px solid rgba(255,255,255,0.08)",
      boxShadow: "0 18px 40px rgba(0,0,0,0.22)",
    }}
  >
    <Typography sx={{ color: "rgba(255,255,255,0.68)", fontSize: "0.84rem" }}>
      {title}
    </Typography>
    <Typography variant="h4" fontWeight={800} mt={0.8}>
      {value}
    </Typography>
    <Typography sx={{ color: "rgba(255,255,255,0.58)", fontSize: "0.9rem", mt: 0.8 }}>
      {subtitle}
    </Typography>
  </Paper>
);

const MetricRow = ({ label, value, progress, accent = "#6dd3ff" }) => (
  <Box>
    <Box display="flex" justifyContent="space-between" gap={2} mb={0.75}>
      <Typography sx={{ color: "rgba(255,255,255,0.72)" }}>{label}</Typography>
      <Typography fontWeight={700}>{value}</Typography>
    </Box>
    <LinearProgress
      variant="determinate"
      value={Math.max(0, Math.min(100, progress))}
      sx={{
        height: 10,
        borderRadius: 999,
        bgcolor: "rgba(255,255,255,0.08)",
        "& .MuiLinearProgress-bar": {
          borderRadius: 999,
          background: accent,
        },
      }}
    />
  </Box>
);

const SimpleBarChart = ({ title, emptyLabel, items, getLabel, getValue, valueFormatter, accent }) => {
  const maxValue = Math.max(...items.map((item) => getValue(item)), 0);

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 6,
        border: "1px solid rgba(255,255,255,0.08)",
        bgcolor: "rgba(11,20,31,0.84)",
        color: "white",
      }}
    >
      <Typography variant="h5" fontWeight={800}>
        {title}
      </Typography>
      <Divider sx={{ borderColor: "rgba(255,255,255,0.08)", my: 2 }} />
      {items.length === 0 ? (
        <Typography sx={{ color: "rgba(255,255,255,0.58)" }}>{emptyLabel}</Typography>
      ) : (
        <Stack spacing={1.5}>
          {items.map((item) => {
            const value = getValue(item);
            const width = maxValue > 0 ? (value / maxValue) * 100 : 0;

            return (
              <Box key={getLabel(item)}>
                <Box display="flex" justifyContent="space-between" gap={2} mb={0.7}>
                  <Typography sx={{ color: "rgba(255,255,255,0.78)" }}>
                    {getLabel(item)}
                  </Typography>
                  <Typography fontWeight={700}>{valueFormatter(value)}</Typography>
                </Box>
                <Box
                  sx={{
                    height: 12,
                    borderRadius: 999,
                    bgcolor: "rgba(255,255,255,0.08)",
                    overflow: "hidden",
                  }}
                >
                  <Box
                    sx={{
                      width: `${width}%`,
                      minWidth: value > 0 ? "10px" : 0,
                      height: "100%",
                      borderRadius: 999,
                      background: accent,
                    }}
                  />
                </Box>
              </Box>
            );
          })}
        </Stack>
      )}
    </Paper>
  );
};

const AdminAnalytics = () => {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [admin, setAdmin] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    getAdminById()
      .then((res) => setAdmin(res.admin))
      .catch((err) => setErrorMessage(err.message));
  }, []);

  const formatCurrency = (value) => `$${Number(value || 0).toFixed(2)}`;
  const formatPercent = (value) => `${Number(value || 0).toFixed(1)}%`;

  const analytics = admin?.analytics;
  const movies = useMemo(() => admin?.addedMovies || [], [admin]);

  const derivedData = useMemo(() => {
    const revenueByMovie = [...movies]
      .sort((leftMovie, rightMovie) => (rightMovie.analytics?.revenue || 0) - (leftMovie.analytics?.revenue || 0))
      .slice(0, 6);

    const bookingsByMovie = [...movies]
      .sort((leftMovie, rightMovie) => (rightMovie.analytics?.totalBookings || 0) - (leftMovie.analytics?.totalBookings || 0))
      .slice(0, 6);

    const showtimeLeaders = movies
      .flatMap((movie) =>
        (movie.analytics?.mostPopularShowtimes || []).map((showtime) => ({
          ...showtime,
          movieTitle: movie.title,
        })),
      )
      .sort((leftShowtime, rightShowtime) => rightShowtime.bookingsCount - leftShowtime.bookingsCount)
      .slice(0, 6);

    const bestRatedMovie = [...movies]
      .filter((movie) => (movie.analytics?.ratingsCount || 0) > 0)
      .sort(
        (leftMovie, rightMovie) =>
          (rightMovie.analytics?.averageRating || 0) - (leftMovie.analytics?.averageRating || 0),
      )[0] || null;

    return {
      revenueByMovie,
      bookingsByMovie,
      showtimeLeaders,
      bestRatedMovie,
    };
  }, [movies]);

  return (
    <Box width="min(1280px, calc(100% - 24px))" mx="auto">
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", md: "center" }}
        flexDirection={{ xs: "column", md: "row" }}
        gap={2}
        mb={3}
      >
        <Box>
          <Typography
            variant="h3"
            sx={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: { xs: "2rem", md: "2.8rem" },
              color: "white",
            }}
          >
            {t("adminAnalyticsTitle")}
          </Typography>
          <Typography sx={{ color: "rgba(255,255,255,0.62)", mt: 0.75, maxWidth: 760 }}>
            {t("adminAnalyticsDescription")}
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<ArrowBackRoundedIcon />}
          onClick={() => navigate("/user-admin")}
          sx={{
            borderRadius: 999,
            borderColor: "rgba(255,255,255,0.18)",
            color: "white",
            px: 2.5,
            ":hover": {
              borderColor: "#6dd3ff",
              bgcolor: "rgba(109,211,255,0.08)",
            },
          }}
        >
          {t("adminBackToProfile")}
        </Button>
      </Box>

      {errorMessage && (
        <Paper
          elevation={0}
          sx={{
            p: 2,
            mb: 3,
            borderRadius: 4,
            bgcolor: "rgba(255,107,107,0.12)",
            color: "#ffd3d3",
            border: "1px solid rgba(255,107,107,0.22)",
          }}
        >
          {errorMessage}
        </Paper>
      )}

      {!admin && !errorMessage && (
        <Paper
          elevation={0}
          sx={{
            p: 3,
            borderRadius: 6,
            border: "1px solid rgba(255,255,255,0.08)",
            bgcolor: "rgba(11,20,31,0.84)",
            color: "rgba(255,255,255,0.72)",
          }}
        >
          {t("adminAnalyticsLoading")}
        </Paper>
      )}

      {admin && (
        <Stack spacing={3}>
          <Box
            display="grid"
            gridTemplateColumns={{ xs: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(4, 1fr)" }}
            gap={2}
          >
            <SummaryCard
              title={t("adminTotalRevenue")}
              value={formatCurrency(analytics?.totalRevenue)}
              subtitle={t("adminAnalyticsMoviesCount", { count: analytics?.totalMovies || 0 })}
              accent="rgba(255,122,69,0.22)"
            />
            <SummaryCard
              title={t("adminTotalBookings")}
              value={analytics?.totalBookings || 0}
              subtitle={t("adminAnalyticsTicketsSubtitle")}
              accent="rgba(109,211,255,0.22)"
            />
            <SummaryCard
              title={t("adminAverageRating")}
              value={analytics?.ratingsCount ? `${analytics.averageRating} / 5` : t("adminNoRatingsYet")}
              subtitle={t("adminAnalyticsRatingsCount", { count: analytics?.ratingsCount || 0 })}
              accent="rgba(255,215,64,0.18)"
            />
            <SummaryCard
              title={t("adminOccupancyRate")}
              value={formatPercent(analytics?.occupancyRate)}
              subtitle={t("adminAnalyticsOccupancySubtitle")}
              accent="rgba(74,222,128,0.18)"
            />
          </Box>

          <Box
            display="grid"
            gridTemplateColumns={{ xs: "1fr", lg: "1.2fr 0.8fr" }}
            gap={3}
          >
            <SimpleBarChart
              title={t("adminRevenueChartTitle")}
              emptyLabel={t("adminNoMovies")}
              items={derivedData.revenueByMovie}
              getLabel={(movie) => movie.title}
              getValue={(movie) => movie.analytics?.revenue || 0}
              valueFormatter={formatCurrency}
              accent="linear-gradient(90deg, #ff7a45 0%, #ffb36b 100%)"
            />

            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 6,
                border: "1px solid rgba(255,255,255,0.08)",
                bgcolor: "rgba(11,20,31,0.84)",
                color: "white",
              }}
            >
              <Typography variant="h5" fontWeight={800}>
                {t("adminHighlightsTitle")}
              </Typography>
              <Divider sx={{ borderColor: "rgba(255,255,255,0.08)", my: 2 }} />
              <Stack spacing={2}>
                <Box display="flex" gap={1.25}>
                  <LocalFireDepartmentRoundedIcon sx={{ color: "#ff7a45" }} />
                  <Box>
                    <Typography fontWeight={700}>{t("adminTopMovie")}</Typography>
                    <Typography sx={{ color: "rgba(255,255,255,0.62)" }}>
                      {analytics?.topMovie
                        ? `${analytics.topMovie.title} • ${analytics.topMovie.totalBookings}`
                        : t("adminNoShowtimesAnalytics")}
                    </Typography>
                  </Box>
                </Box>
                <Box display="flex" gap={1.25}>
                  <PaidRoundedIcon sx={{ color: "#6dd3ff" }} />
                  <Box>
                    <Typography fontWeight={700}>{t("adminBestRevenueMovie")}</Typography>
                    <Typography sx={{ color: "rgba(255,255,255,0.62)" }}>
                      {derivedData.revenueByMovie[0]
                        ? `${derivedData.revenueByMovie[0].title} • ${formatCurrency(derivedData.revenueByMovie[0].analytics?.revenue)}`
                        : t("adminNoMovies")}
                    </Typography>
                  </Box>
                </Box>
                <Box display="flex" gap={1.25}>
                  <ConfirmationNumberRoundedIcon sx={{ color: "#8bdd8b" }} />
                  <Box>
                    <Typography fontWeight={700}>{t("adminMostBookedShowtime")}</Typography>
                    <Typography sx={{ color: "rgba(255,255,255,0.62)" }}>
                      {derivedData.showtimeLeaders[0]
                        ? `${derivedData.showtimeLeaders[0].movieTitle} • ${derivedData.showtimeLeaders[0].bookingsCount}`
                        : t("adminNoShowtimesAnalytics")}
                    </Typography>
                  </Box>
                </Box>
                <Box display="flex" gap={1.25}>
                  <StarRoundedIcon sx={{ color: "#ffd740" }} />
                  <Box>
                    <Typography fontWeight={700}>{t("adminBestRatedMovie")}</Typography>
                    <Typography sx={{ color: "rgba(255,255,255,0.62)" }}>
                      {derivedData.bestRatedMovie
                        ? `${derivedData.bestRatedMovie.title} • ${derivedData.bestRatedMovie.analytics.averageRating} / 5`
                        : t("adminNoRatingsYet")}
                    </Typography>
                  </Box>
                </Box>
              </Stack>
            </Paper>
          </Box>

          <Box
            display="grid"
            gridTemplateColumns={{ xs: "1fr", lg: "repeat(2, 1fr)" }}
            gap={3}
          >
            <SimpleBarChart
              title={t("adminBookingsChartTitle")}
              emptyLabel={t("adminNoMovies")}
              items={derivedData.bookingsByMovie}
              getLabel={(movie) => movie.title}
              getValue={(movie) => movie.analytics?.totalBookings || 0}
              valueFormatter={(value) => `${value}`}
              accent="linear-gradient(90deg, #6dd3ff 0%, #a7f0ff 100%)"
            />
            <SimpleBarChart
              title={t("adminPopularShowtimes")}
              emptyLabel={t("adminNoShowtimesAnalytics")}
              items={derivedData.showtimeLeaders}
              getLabel={(showtime) => `${showtime.movieTitle} • ${new Date(showtime.startTime).toLocaleDateString()}`}
              getValue={(showtime) => showtime.bookingsCount}
              valueFormatter={(value) => `${value}`}
              accent="linear-gradient(90deg, #8bdd8b 0%, #bdf6bd 100%)"
            />
          </Box>

          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 6,
              border: "1px solid rgba(255,255,255,0.08)",
              bgcolor: "rgba(11,20,31,0.84)",
              color: "white",
            }}
          >
            <Typography variant="h5" fontWeight={800}>
              {t("adminMovieCardsTitle")}
            </Typography>
            <Divider sx={{ borderColor: "rgba(255,255,255,0.08)", my: 2 }} />
            <Box
              display="grid"
              gridTemplateColumns={{ xs: "1fr", xl: "repeat(2, 1fr)" }}
              gap={2}
            >
              {movies.map((movie) => (
                <Paper
                  key={movie._id}
                  elevation={0}
                  sx={{
                    p: 2.25,
                    borderRadius: 5,
                    border: "1px solid rgba(255,255,255,0.08)",
                    bgcolor: "rgba(255,255,255,0.03)",
                    color: "white",
                  }}
                >
                  <Box display="flex" justifyContent="space-between" gap={2} flexWrap="wrap">
                    <Box>
                      <Typography variant="h6" fontWeight={800}>
                        {movie.title}
                      </Typography>
                      <Typography sx={{ color: "rgba(255,255,255,0.58)", mt: 0.4 }}>
                        {t("addMovieTicketPrice")}: {formatCurrency(movie.ticketPrice)}
                      </Typography>
                    </Box>
                    <Box
                      px={1.2}
                      py={0.55}
                      borderRadius={999}
                      bgcolor="rgba(255,255,255,0.06)"
                      border="1px solid rgba(255,255,255,0.08)"
                    >
                      <Typography sx={{ fontSize: "0.82rem", fontWeight: 700 }}>
                        {t("adminTotalBookings")}: {movie.analytics?.totalBookings || 0}
                      </Typography>
                    </Box>
                  </Box>

                  <Stack spacing={1.6} mt={2.2}>
                    <MetricRow
                      label={t("adminMovieRevenue")}
                      value={formatCurrency(movie.analytics?.revenue)}
                      progress={analytics?.totalRevenue ? ((movie.analytics?.revenue || 0) / analytics.totalRevenue) * 100 : 0}
                      accent="linear-gradient(90deg, #ff7a45 0%, #ffb36b 100%)"
                    />
                    <MetricRow
                      label={t("adminOccupancyRate")}
                      value={formatPercent(movie.analytics?.occupancyRate)}
                      progress={movie.analytics?.occupancyRate || 0}
                      accent="linear-gradient(90deg, #6dd3ff 0%, #a7f0ff 100%)"
                    />
                    <MetricRow
                      label={t("adminAverageRating")}
                      value={
                        movie.analytics?.ratingsCount
                          ? `${movie.analytics.averageRating} / 5`
                          : t("adminNoRatingsYet")
                      }
                      progress={movie.analytics?.ratingsCount ? ((movie.analytics?.averageRating || 0) / 5) * 100 : 0}
                      accent="linear-gradient(90deg, #ffd740 0%, #ffeaa0 100%)"
                    />
                  </Stack>

                  <Box mt={2.2}>
                    <Typography fontWeight={700} mb={1}>
                      {t("adminPopularShowtimes")}
                    </Typography>
                    {(movie.analytics?.mostPopularShowtimes || []).length > 0 ? (
                      <Stack spacing={1}>
                        {movie.analytics.mostPopularShowtimes.map((showtime) => (
                          <Box
                            key={showtime._id}
                            px={1.4}
                            py={1.1}
                            borderRadius={3}
                            bgcolor="rgba(255,255,255,0.04)"
                            border="1px solid rgba(255,255,255,0.06)"
                          >
                            <Typography fontWeight={700}>
                              {new Date(showtime.startTime).toLocaleString()}
                            </Typography>
                            <Typography sx={{ color: "rgba(255,255,255,0.62)", mt: 0.35 }}>
                              {showtime.hall} • {t("adminMovieBookings")}: {showtime.bookingsCount} • {t("adminOccupancyRate")}: {formatPercent(showtime.occupancyRate)}
                            </Typography>
                          </Box>
                        ))}
                      </Stack>
                    ) : (
                      <Typography sx={{ color: "rgba(255,255,255,0.58)" }}>
                        {t("adminNoShowtimesAnalytics")}
                      </Typography>
                    )}
                  </Box>
                </Paper>
              ))}
            </Box>
          </Paper>
        </Stack>
      )}
    </Box>
  );
};

export default AdminAnalytics;
