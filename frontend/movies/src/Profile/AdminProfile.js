import { Box } from "@mui/system";
import React, { Fragment, useEffect, useState } from "react";
import { deleteMovie, getAdminById } from "../api-helpers/api-helpers";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import { Button, Divider, List, ListItem, ListItemText, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useI18n } from "../i18n/LanguageContext";

const AdminProfile = () => {
  const navigate = useNavigate();
  const [admin, setAdmin] = useState();
  const [errorMessage, setErrorMessage] = useState("");
  const [deletingMovieId, setDeletingMovieId] = useState("");
  const { t } = useI18n();

  useEffect(() => {
    getAdminById()
      .then((res) => setAdmin(res.admin))
      .catch((err) => console.log(err.message));
  }, []);

  const handleDeleteMovie = async (movieId) => {
    setErrorMessage("");
    setDeletingMovieId(movieId);

    try {
      await deleteMovie(movieId);
      setAdmin((prevAdmin) => {
        if (!prevAdmin) {
          return prevAdmin;
        }

        return {
          ...prevAdmin,
          addedMovies: prevAdmin.addedMovies.filter((movie) => movie._id !== movieId),
        };
      });
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setDeletingMovieId("");
    }
  };

  return (
    <Box width="100%" display="flex" flexDirection={{ xs: "column", md: "row" }}>
      <Fragment>
        {" "}
        {admin && (
          <Box
            display="flex"
            flexDirection={"column"}
            justifyContent="center"
            alignItems={"center"}
            width={{ xs: "100%", md: "32%" }}
            padding={3}
            borderRadius={6}
            border="1px solid rgba(255,255,255,0.08)"
            bgcolor="rgba(11,20,31,0.84)"
            boxShadow="0 24px 60px rgba(0,0,0,0.28)"
          >
            <AccountCircleIcon
              sx={{ fontSize: "8rem", textAlign: "center", color: "#ff7a45" }}
            />

            <Typography
              mt={1}
              padding={1}
              width="100%"
              textAlign={"center"}
              border={"1px solid rgba(255,255,255,0.08)"}
              borderRadius={4}
              bgcolor="rgba(255,255,255,0.03)"
            >
              {t("profileEmail")}: {admin.email}
            </Typography>
          </Box>
        )}
        {admin && (
          <Box
            width={{ xs: "100%", md: "68%" }}
            display="flex"
            flexDirection={"column"}
            ml={{ xs: 0, md: 3 }}
            mt={{ xs: 3, md: 0 }}
            p={{ xs: 3, md: 4 }}
            borderRadius={6}
            border="1px solid rgba(255,255,255,0.08)"
            bgcolor="rgba(11,20,31,0.84)"
            boxShadow="0 24px 60px rgba(0,0,0,0.28)"
          >
            <Typography
              variant="h3"
              sx={{
                fontFamily: "'Space Grotesk', sans-serif",
                textAlign: "center",
                pb: 2,
                fontSize: { xs: "2rem", md: "2.6rem" },
              }}
            >
              {t("adminAddedMovies")}
            </Typography>
            <Divider sx={{ borderColor: "rgba(255,255,255,0.08)", mb: 2 }} />
            {errorMessage && (
              <Typography sx={{ color: "#ff9aa2", mb: 2, textAlign: "center" }}>
                {errorMessage}
              </Typography>
            )}
            <Box margin={"auto"} display="flex" flexDirection={"column"} width="100%">
              {admin.addedMovies.length > 0 ? (
                <List>
                  {admin.addedMovies.map((movie) => (
                    <ListItem
                      key={movie._id}
                      sx={{
                        bgcolor: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        color: "white",
                        textAlign: "center",
                        marginY: 1,
                        borderRadius: 4,
                        gap: 2,
                        flexDirection: { xs: "column", sm: "row" },
                        alignItems: { xs: "stretch", sm: "center" },
                      }}
                    >
                      <ListItemText
                        sx={{ margin: 1, width: "auto", textAlign: "left" }}
                        primary={`${t("adminMovieLabel")}: ${movie.title}`}
                        secondary={`${t("addMovieTicketPrice")}: $${Number(movie.ticketPrice || 0).toFixed(2)}`}
                        secondaryTypographyProps={{ sx: { color: "rgba(255,255,255,0.52)" } }}
                      />
                      <Box
                        display="flex"
                        gap={1.25}
                        width={{ xs: "100%", sm: "auto" }}
                        flexDirection={{ xs: "column", sm: "row" }}
                      >
                        <Button
                          variant="outlined"
                          onClick={() => navigate(`/edit/${movie._id}`)}
                          sx={{
                            borderRadius: 999,
                            borderColor: "rgba(109,211,255,0.24)",
                            color: "#6dd3ff",
                            fontWeight: 800,
                            px: 3,
                            ":hover": {
                              borderColor: "#6dd3ff",
                              bgcolor: "rgba(109,211,255,0.08)",
                            },
                          }}
                        >
                          {t("commonEdit")}
                        </Button>
                        <Button
                          variant="contained"
                          onClick={() => handleDeleteMovie(movie._id)}
                          disabled={deletingMovieId === movie._id}
                          sx={{
                            borderRadius: 999,
                            bgcolor: "#ff6b6b",
                            color: "#08111b",
                            fontWeight: 800,
                            px: 3,
                            ":hover": {
                              bgcolor: "#ff8585",
                            },
                          }}
                        >
                          {deletingMovieId === movie._id ? t("commonDeleting") : t("commonDelete")}
                        </Button>
                      </Box>
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography sx={{ color: "rgba(255,255,255,0.62)", textAlign: "center" }}>
                  {t("adminNoMovies")}
                </Typography>
              )}
            </Box>
          </Box>
        )}
      </Fragment>
    </Box>
  );
};

export default AdminProfile;
