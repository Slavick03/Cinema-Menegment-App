import React, { useEffect, useState } from "react";
import {
  AppBar,
  Autocomplete,
  Box,
  Chip,
  Tab,
  Tabs,
  TextField,
  Toolbar,
  Typography,
} from "@mui/material";
import MovieCreationIcon from "@mui/icons-material/MovieCreation";
import { getAllMovies } from "../api-helpers/api-helpers";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { adminActions, userActions } from "../store";
// const dummyArray = ["eMemory", "Brahmastra", "OK", "PK"];

const Header = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const isAdminLoggedIn = useSelector((state) => state.admin.isLoggedIn);
  const isUserLoggedIn = useSelector((state) => state.user.isLoggedIn);
  const [movies, setMovies] = useState([]);
  const [value, setValue] = useState(false);

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
          width={{ xs: "100%", md: "20%" }}
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
                Cinema Lounge
              </Typography>
              <Typography
                sx={{
                  color: "rgba(255,255,255,0.62)",
                  fontSize: "0.74rem",
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                }}
              >
                Book the next premiere
              </Typography>
            </Box>
          </Link>
        </Box>
        <Box
          width={{ xs: "100%", md: "42%" }}
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
                placeholder="Search Movies"
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
            label={isAdminLoggedIn ? "Admin mode" : isUserLoggedIn ? "User mode" : "Guest"}
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
            <Tab LinkComponent={Link} to="/movies" label="Movies"></Tab>
            {!isAdminLoggedIn && !isUserLoggedIn && (
              <Tab label="Admin" LinkComponent={Link} to="/admin" />
            )}
            {!isAdminLoggedIn && !isUserLoggedIn && (
              <Tab label="Auth" LinkComponent={Link} to="/auth" />
            )}
            {isUserLoggedIn && (
              <Tab label="Profile" LinkComponent={Link} to="/user" />
            )}
            {isUserLoggedIn && (
              <Tab
                onClick={() => logout(false)}
                label="Logout"
                LinkComponent={Link}
                to="/"
              />
            )}
            {isAdminLoggedIn && (
              <Tab label="Add Movie" LinkComponent={Link} to="/add" />
            )}
            {isAdminLoggedIn && (
              <Tab label="Profile" LinkComponent={Link} to="/user-admin" />
            )}
            {isAdminLoggedIn && (
              <Tab
                onClick={() => logout(true)}
                label="Logout"
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
