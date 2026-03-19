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

const labelStyle = { mt: 1, mb: 1 };
const AuthForm = ({ onSubmit, isAdmin }) => {
  const [inputs, setInputs] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [isSignup, setIsSignup] = useState(false);
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
      PaperProps={{
        sx: {
          width: "min(100% - 24px, 980px)",
          borderRadius: 8,
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
          gridTemplateColumns: { xs: "1fr", md: "0.95fr 1.05fr" },
        }}
      >
        <Box
          sx={{
            p: { xs: 3, md: 5 },
            background:
              "linear-gradient(180deg, rgba(255,122,69,0.12), rgba(109,211,255,0.08))",
            borderRight: { xs: "none", md: "1px solid rgba(255,255,255,0.08)" },
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
            {isAdmin ? "Administrator access" : "Cinema account"}
          </Typography>
          <Typography
            variant="h3"
            sx={{
              mt: 2,
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: { xs: "2rem", md: "3rem" },
              lineHeight: 1.02,
            }}
          >
            {isAdmin ? "Control your movie lineup." : "Step inside and book faster."}
          </Typography>
          <Typography sx={{ mt: 2, color: "rgba(255,255,255,0.68)", lineHeight: 1.8 }}>
            {isAdmin
              ? "Sign in to add fresh releases, manage sessions and keep the cinema feed up to date."
              : "Create an account or log in to reserve seats, track bookings and enjoy a smoother movie night."}
          </Typography>
        </Box>
        <Box sx={{ position: "relative", p: { xs: 3, md: 5 } }}>
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
            }}
          >
            {isSignup ? "Signup" : "Login"}
          </Typography>
          <form onSubmit={handleSubmit}>
            <Box
              paddingTop={3}
              display="flex"
              justifyContent="center"
              flexDirection="column"
              width="100%"
              margin="auto"
              alignContent="center"
            >
              {!isAdmin && isSignup && (
                <>
                  <FormLabel sx={{ ...labelStyle, color: "rgba(255,255,255,0.76)" }}>
                    Name
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
                Email
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
                Password
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
                {isSignup ? "Signup" : "Login"}
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
                  Switch To {isSignup ? "Login" : "Signup"}
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
