import {
  Box,
  Button,
  Dialog,
  FormLabel,
  IconButton,
  TextField,
  Typography,
} from "@mui/material";
import React, { useState } from "react";
import { Link } from "react-router-dom";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import { useI18n } from "../../i18n/LanguageContext";

const labelStyle = { mt: 1, mb: 1 };
const AuthForm = ({ onSubmit, isAdmin }) => {
  const [inputs, setInputs] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [isSignup, setIsSignup] = useState(false);
  const { t } = useI18n();
  const handleChange = (e) => {
    setInputs((prevState) => ({
      ...prevState,
      [e.target.name]: e.target.value,
    }));
  };
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ inputs, signup: isAdmin ? false : isSignup });
  };
  return (
    <Dialog
      fullWidth
      maxWidth={false}
      PaperProps={{
        sx: {
          width: "min(calc(100vw - 32px), 1100px)",
          m: { xs: 2, sm: 3 },
          borderRadius: { xs: 4, md: 8 },
          overflow: "hidden",
          background: "rgba(10, 17, 27, 0.9)",
          backdropFilter: "blur(22px)",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 28px 90px rgba(0,0,0,0.45)",
          color: "white",
        },
      }}
      open={true}
    >
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", lg: "minmax(0, 0.95fr) minmax(0, 1.05fr)" },
        }}
      >
        <Box
          sx={{
            p: { xs: 3, md: 5 },
            minWidth: 0,
            background:
              "linear-gradient(180deg, rgba(255,122,69,0.12), rgba(109,211,255,0.08))",
            borderRight: { xs: "none", lg: "1px solid rgba(255,255,255,0.08)" },
          }}
        >
          <Typography
            sx={{
              color: "#ffb08d",
              textTransform: "uppercase",
              letterSpacing: "0.16em",
              fontWeight: 800,
              fontSize: "0.76rem",
            }}
          >
            {isAdmin ? t("authAdminAccess") : t("authCinemaAccount")}
          </Typography>
          <Typography
            variant="h3"
            sx={{
              mt: 2,
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: { xs: "2.5rem", sm: "3rem", md: "3.5rem", lg: "4.4rem" },
              lineHeight: 1.04,
              overflowWrap: "anywhere",
            }}
          >
            {isAdmin ? t("authAdminHeadline") : t("authUserHeadline")}
          </Typography>
          <Typography sx={{ mt: 2, color: "rgba(255,255,255,0.68)", lineHeight: 1.8 }}>
            {isAdmin
              ? t("authAdminDescription")
              : t("authUserDescription")}
          </Typography>
        </Box>
        <Box sx={{ position: "relative", p: { xs: 3, md: 5 }, minWidth: 0 }}>
          <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
            <IconButton
              LinkComponent={Link}
              to="/"
              sx={{ color: "rgba(255,255,255,0.72)" }}
            >
              <CloseRoundedIcon />
            </IconButton>
          </Box>
          <Typography
            variant="h4"
            textAlign="left"
            sx={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 700,
              fontSize: { xs: "2rem", sm: "2.3rem", md: "2.7rem" },
              lineHeight: 1.08,
              overflowWrap: "anywhere",
            }}
          >
            {isSignup ? t("authSignup") : t("authLogin")}
          </Typography>
          <form onSubmit={handleSubmit}>
            <Box
              paddingTop={3}
              display="flex"
              justifyContent="center"
              flexDirection="column"
              width="100%"
              maxWidth={{ xs: "100%", lg: 440 }}
              margin="auto"
              alignContent="center"
            >
              {!isAdmin && isSignup && (
                <>
                  <FormLabel sx={{ ...labelStyle, color: "rgba(255,255,255,0.76)" }}>
                    {t("authName")}
                  </FormLabel>
                  <TextField
                    value={inputs.name}
                    onChange={handleChange}
                    margin="normal"
                    variant="outlined"
                    type="text"
                    name="name"
                    sx={fieldStyles}
                  />
                </>
              )}
              <FormLabel sx={{ ...labelStyle, color: "rgba(255,255,255,0.76)" }}>
                {t("authEmail")}
              </FormLabel>
              <TextField
                value={inputs.email}
                onChange={handleChange}
                margin="normal"
                variant="outlined"
                type="email"
                name="email"
                sx={fieldStyles}
              />
              <FormLabel sx={{ ...labelStyle, color: "rgba(255,255,255,0.76)" }}>
                {t("authPassword")}
              </FormLabel>
              <TextField
                value={inputs.password}
                onChange={handleChange}
                margin="normal"
                variant="outlined"
                type="password"
                name="password"
                sx={fieldStyles}
              />
              <Button
                sx={{
                  mt: 3,
                  py: 1.3,
                  borderRadius: 999,
                  bgcolor: "#ff7a45",
                  color: "#08111b",
                  fontWeight: 800,
                  "&:hover": {
                    bgcolor: "#ff925d",
                  },
                }}
                type="submit"
                fullWidth
                variant="contained"
              >
                {isSignup ? t("authSignup") : t("authLogin")}
              </Button>
              {!isAdmin && (
                <Button
                  onClick={() => setIsSignup(!isSignup)}
                  sx={{
                    mt: 2,
                    borderRadius: 999,
                    color: "#6dd3ff",
                    fontWeight: 700,
                  }}
                  fullWidth
                >
                  {isSignup ? t("authSwitchToLogin") : t("authSwitchToSignup")}
                </Button>
              )}
            </Box>
          </form>
        </Box>
      </Box>
    </Dialog>
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

export default AuthForm;
