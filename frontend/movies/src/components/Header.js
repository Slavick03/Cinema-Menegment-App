import React, { useEffect, useState } from "react";
import {
  AppBar,
  Autocomplete,
  Box,
  Chip,
  Tab,
  Tabs,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Toolbar,
  Typography,
} from "@mui/material";
import MovieCreationIcon from "@mui/icons-material/MovieCreation";
import TranslateRoundedIcon from "@mui/icons-material/TranslateRounded";
import { getAllMovies } from "../api-helpers/api-helpers";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { adminActions, userActions } from "../store";
import { useI18n } from "../i18n/LanguageContext";
// const dummyArray = ["eMemory", "Brahmastra", "OK", "PK"];

const Header = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const isAdminLoggedIn = useSelector((state) => state.admin.isLoggedIn);
  const isUserLoggedIn = useSelector((state) => state.user.isLoggedIn);
  const [movies, setMovies] = useState([]);
  const [value, setValue] = useState(false);
  const { language, setLanguage, availableLanguages, t } = useI18n();

  useEffect(() => {
    getAllMovies()
      .then((data) => setMovies(data.movies || []))
      .catch((err) => console.log(err.message));
  }, []);

  const logout = (isAdmin) => {
    dispatch(isAdmin ? adminActions.logout() : userActions.logout());
    navigate("/");
  };

  const handleChange = (e, val) => {
    const movie = movies.find((m) => m.title === val);

    if (!movie) {
      return;
    }

    navigate(isUserLoggedIn ? `/booking/${movie._id}` : "/auth");
  };

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        bgcolor: "rgba(7, 12, 20, 0.82)",
        backdropFilter: "blur(16px)",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <Toolbar
        sx={{
          width: "min(1240px, calc(100% - 24px))",
          minHeight: { xs: 92, md: 96 },
          margin: "0 auto",
          gap: 2,
          flexWrap: { xs: "wrap", md: "nowrap" },
          py: 1,
        }}
      >
        <Box
          width={{ xs: "100%", md: "auto" }}
          display="flex"
          alignItems="center"
          justifyContent={{ xs: "center", md: "flex-start" }}
        >
          <Link
            to="/"
            style={{
              color: "white",
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: "14px",
                display: "grid",
                placeItems: "center",
                background:
                  "linear-gradient(135deg, rgba(255,122,69,0.95), rgba(109,211,255,0.85))",
                boxShadow: "0 14px 34px rgba(255, 122, 69, 0.28)",
              }}
            >
              <MovieCreationIcon sx={{ color: "#08111b" }} />
            </Box>
            <Box>
              <Typography
                sx={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontWeight: 700,
                  fontSize: { xs: "1.1rem", md: "1.2rem" },
                  lineHeight: 1.1,
                }}
              >
                {t("appName")}
              </Typography>
              <Typography
                sx={{
                  color: "rgba(255,255,255,0.62)",
                  fontSize: "0.74rem",
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                }}
              >
                {t("appTagline")}
              </Typography>
            </Box>
          </Link>
        </Box>
        <Box
          display="flex"
          alignItems="center"
          justifyContent={{ xs: "center", md: "flex-start" }}
          width={{ xs: "100%", md: "auto" }}
        >
          <Box
            sx={{
              display: "inline-flex",
              alignItems: "center",
              gap: 1,
              px: 1,
              py: 0.7,
              borderRadius: 999,
              bgcolor: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              backdropFilter: "blur(10px)",
            }}
          >
            <TranslateRoundedIcon
              sx={{ color: "#6dd3ff", fontSize: "1.05rem" }}
            />
            <ToggleButtonGroup
              exclusive
              size="small"
              value={language}
              onChange={(_, nextLanguage) => {
                if (nextLanguage) {
                  setLanguage(nextLanguage);
                }
              }}
              aria-label={t("languageLabel")}
              sx={{
                gap: 0.6,
                "& .MuiToggleButtonGroup-grouped": {
                  border: "0 !important",
                  borderRadius: "999px !important",
                  px: 1.2,
                  py: 0.45,
                  color: "rgba(255,255,255,0.7)",
                  fontWeight: 800,
                  fontSize: "0.72rem",
                  letterSpacing: "0.08em",
                  minWidth: 44,
                },
              }}
            >
              {availableLanguages.map((option) => (
                <ToggleButton
                  key={option.code}
                  value={option.code}
                  sx={{
                    bgcolor:
                      language === option.code
                        ? "rgba(109,211,255,0.18)"
                        : "transparent",
                    color:
                      language === option.code
                        ? "#dff8ff"
                        : "rgba(255,255,255,0.72)",
                    "&.Mui-selected": {
                      bgcolor: "rgba(109,211,255,0.18)",
                      color: "#dff8ff",
                    },
                    "&.Mui-selected:hover": {
                      bgcolor: "rgba(109,211,255,0.22)",
                      color: "#ffffff",
                    },
                    boxShadow:
                      language === option.code
                        ? "inset 0 0 0 1px rgba(109,211,255,0.18)"
                        : "none",
                    "&:hover": {
                      bgcolor:
                        language === option.code
                          ? "rgba(109,211,255,0.22)"
                          : "rgba(255,255,255,0.06)",
                    },
                  }}
                >
                  {option.shortLabel}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          </Box>
        </Box>
        <Box
          width={{ xs: "100%", md: "min(420px, 100%)" }}
          marginRight={{ xs: 0, md: "auto" }}
          marginLeft={{ xs: 0, md: "auto" }}
        >
          <Autocomplete
            onChange={handleChange}
            freeSolo
            options={movies.map((option) => option.title)}
            renderInput={(params) => (
              <TextField
                variant="outlined"
                {...params}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 999,
                    color: "white",
                    bgcolor: "rgba(255,255,255,0.04)",
                    backdropFilter: "blur(10px)",
                    "& fieldset": {
                      borderColor: "rgba(255,255,255,0.12)",
                    },
                    "&:hover fieldset": {
                      borderColor: "rgba(255,255,255,0.24)",
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: "#ff7a45",
                    },
                  },
                }}
                placeholder={t("searchMovies")}
              />
            )}
          />
        </Box>
        <Box
          display="flex"
          alignItems="center"
          justifyContent={{ xs: "space-between", md: "flex-end" }}
          width={{ xs: "100%", md: "auto" }}
          gap={1.5}
          flexWrap="wrap"
        >
          <Chip
            label={
              isAdminLoggedIn
                ? t("modeAdmin")
                : isUserLoggedIn
                  ? t("modeUser")
                  : t("modeGuest")
            }
            sx={{
              display: { xs: "inline-flex", md: "none" },
              bgcolor: "rgba(255,255,255,0.06)",
              color: "white",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          />
          <Tabs
            onChange={(e, val) => setValue(val)}
            value={value}
            textColor="inherit"
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              minHeight: 48,
              "& .MuiTabs-indicator": {
                height: 3,
                borderRadius: 999,
                background:
                  "linear-gradient(90deg, #ff7a45 0%, #6dd3ff 100%)",
              },
              "& .MuiTab-root": {
                minHeight: 48,
                textTransform: "none",
                fontWeight: 700,
                color: "rgba(255,255,255,0.76)",
              },
              "& .Mui-selected": {
                color: "#ffffff",
              },
            }}
          >
            <Tab LinkComponent={Link} to="/movies" label={t("navMovies")}></Tab>
            {!isAdminLoggedIn && !isUserLoggedIn && (
              <Tab label={t("navAdmin")} LinkComponent={Link} to="/admin" />
            )}
            {!isAdminLoggedIn && !isUserLoggedIn && (
              <Tab label={t("navAuth")} LinkComponent={Link} to="/auth" />
            )}
            {isUserLoggedIn && (
              <Tab label={t("navProfile")} LinkComponent={Link} to="/user" />
            )}
            {isUserLoggedIn && (
              <Tab
                onClick={() => logout(false)}
                label={t("navLogout")}
                LinkComponent={Link}
                to="/"
              />
            )}
            {isAdminLoggedIn && (
              <Tab label={t("navAddMovie")} LinkComponent={Link} to="/add" />
            )}
            {isAdminLoggedIn && (
              <Tab label={t("navProfile")} LinkComponent={Link} to="/user-admin" />
            )}
            {isAdminLoggedIn && (
              <Tab
                onClick={() => logout(true)}
                label={t("navLogout")}
                LinkComponent={Link}
                to="/"
              />
            )}
          </Tabs>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
