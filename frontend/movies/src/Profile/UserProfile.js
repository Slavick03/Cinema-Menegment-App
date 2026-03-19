import { Box } from "@mui/system";
import React, { Fragment, useEffect, useState } from "react";
import {
  deleteBooking,
  getUserBooking,
  getUserDetails,
} from "../api-helpers/api-helpers";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import {
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Typography,
} from "@mui/material";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
const UserProfile = () => {
  const [bookings, setBookings] = useState([]);
  const [user, setUser] = useState();

  useEffect(() => {
    getUserBooking()
      .then((res) => setBookings(res.bookings || []))
      .catch((err) => console.log(err.message));

    getUserDetails()
      .then((res) => setUser(res.user))
      .catch((err) => console.log(err.message));
  }, []);

  const handleDelete = (id) => {
    deleteBooking(id)
      .then(() => setBookings((prevState) => prevState.filter((item) => item._id !== id)))
      .catch((err) => console.log(err.message));
  };
  return (
    <Box width="100%" display="flex" flexDirection={{ xs: "column", md: "row" }}>
      <Fragment>
        {" "}
        {user && (
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
              sx={{ fontSize: "8rem", textAlign: "center", color: "#6dd3ff" }}
            />
            <Typography
              padding={1}
              width="100%"
              textAlign={"center"}
              border={"1px solid rgba(255,255,255,0.08)"}
              borderRadius={4}
              bgcolor="rgba(255,255,255,0.03)"
            >
              Name: {user.name}
            </Typography>
            <Typography
              mt={1}
              padding={1}
              width="100%"
              textAlign={"center"}
              border={"1px solid rgba(255,255,255,0.08)"}
              borderRadius={4}
              bgcolor="rgba(255,255,255,0.03)"
            >
              Email: {user.email}
            </Typography>
          </Box>
        )}
        {bookings.length > 0 && (
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
              Bookings
            </Typography>
            <Divider sx={{ borderColor: "rgba(255,255,255,0.08)", mb: 2 }} />
            <Box margin={"auto"} display="flex" flexDirection={"column"} width="100%">
              <List>
                {bookings.map((booking) => (
                  <ListItem
                    key={booking._id}
                    sx={{
                      bgcolor: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      color: "white",
                      textAlign: "center",
                      marginY: 1,
                      borderRadius: 4,
                      flexWrap: "wrap",
                    }}
                  >
                    <ListItemText
                      sx={{ margin: 1, minWidth: 180, textAlign: "left" }}
                    >
                      Movie: {booking.movie.title}
                    </ListItemText>
                    <ListItemText
                      sx={{ margin: 1, minWidth: 120, textAlign: "left" }}
                    >
                      Seat: {booking.seatNumber}
                    </ListItemText>
                    <ListItemText
                      sx={{ margin: 1, minWidth: 170, textAlign: "left" }}
                    >
                      Date: {new Date(booking.date).toDateString()}
                    </ListItemText>
                    <IconButton
                      onClick={() => handleDelete(booking._id)}
                      color="error"
                    >
                      <DeleteForeverIcon />
                    </IconButton>
                  </ListItem>
                ))}
              </List>
            </Box>
          </Box>
        )}
      </Fragment>
    </Box>
  );
};

export default UserProfile;
