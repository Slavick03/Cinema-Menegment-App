import {
    Box,
    Button,
    Checkbox,
    FormLabel,
    TextField,
    Typography,
  } from "@mui/material";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { addMovie } from "../../api-helpers/api-helpers";
 
  const labelProps = {
    mt: 1,
    mb: 1,
  };
const AddMovie = () => {
    const navigate = useNavigate();
    const [inputs, setInputs] = useState({
      title: "",
      description: "",
      posterUrl: "",
      releaseDate: "",
      featured: false,
    });
    const [actors, setActors] = useState([]);
    const [actor, setActor] = useState("");
    const handleChange = (e) => {
      setInputs((prevState) => ({
        ...prevState,
        [e.target.name]: e.target.value,
      }));
    };
    const handleSubmit = (e) => {
      e.preventDefault();
      const trimmedActors = actors.map((item) => item.trim()).filter(Boolean);
      addMovie({ ...inputs, actors: trimmedActors })
        .then(() => navigate("/user-admin"))
        .catch((err) => console.log(err.message));
    };
  return (
    <div>
      <form onSubmit={handleSubmit}>
        <Box
          width={{ xs: "100%", md: "70%" }}
          padding={{ xs: 3, md: 6 }}
          margin="auto"
          display="flex"
          flexDirection="column"
          border="1px solid rgba(255,255,255,0.08)"
          borderRadius={6}
          bgcolor="rgba(11,20,31,0.84)"
          boxShadow="0 28px 70px rgba(0,0,0,0.28)"
        >
          <Typography
            textAlign="center"
            variant="h4"
            sx={{
              fontFamily: "'Space Grotesk', sans-serif",
              mb: 1,
            }}
          >
            Add New Movie
          </Typography>
          <Typography
            textAlign="center"
            sx={{ color: "rgba(255,255,255,0.62)", mb: 3 }}
          >
            Publish a fresh release to the cinema catalog.
          </Typography>
          <FormLabel sx={{ ...labelProps, color: "rgba(255,255,255,0.76)" }}>
            Title
          </FormLabel>
          <TextField
            value={inputs.title}
            onChange={handleChange}
            name="title"
            variant="outlined"
            margin="normal"
            sx={fieldStyles}
          />
          <FormLabel sx={{ ...labelProps, color: "rgba(255,255,255,0.76)" }}>
            Description
          </FormLabel>
          <TextField
            value={inputs.description}
            onChange={handleChange}
            name="description"
            variant="outlined"
            margin="normal"
            multiline
            minRows={4}
            sx={fieldStyles}
          />
          <FormLabel sx={{ ...labelProps, color: "rgba(255,255,255,0.76)" }}>
            Poster URL
          </FormLabel>
          <TextField
            value={inputs.posterUrl}
            onChange={handleChange}
            name="posterUrl"
            variant="outlined"
            margin="normal"
            sx={fieldStyles}
          />
          <FormLabel sx={{ ...labelProps, color: "rgba(255,255,255,0.76)" }}>
            Release Date
          </FormLabel>
          <TextField
            type={"date"}
            value={inputs.releaseDate}
            onChange={handleChange}
            name="releaseDate"
            variant="outlined"
            margin="normal"
            sx={fieldStyles}
          />
          <FormLabel sx={{ ...labelProps, color: "rgba(255,255,255,0.76)" }}>
            Actor
          </FormLabel>
          <Box display="flex" gap={1.5} flexDirection={{ xs: "column", sm: "row" }}>
            <TextField
              value={actor}
              name="actor"
              onChange={(e) => setActor(e.target.value)}
              variant="outlined"
              margin="normal"
              sx={{ ...fieldStyles, flex: 1 }}
            />
            <Button
              type="button"
              onClick={() => {
                if (!actor.trim()) {
                  return;
                }
                setActors([...actors, actor]);
                setActor("");
              }}
              variant="outlined"
              sx={{
                alignSelf: { xs: "stretch", sm: "center" },
                borderRadius: 999,
                borderColor: "rgba(255,255,255,0.18)",
                color: "#6dd3ff",
                px: 3,
                py: 1.25,
              }}
            >
              Add
            </Button>
          </Box>
          <Typography mt={1.5} sx={{ color: "rgba(255,255,255,0.56)" }}>
            Actors: {actors.length ? actors.join(", ") : "No actors added yet"}
          </Typography>
          <FormLabel sx={{ ...labelProps, color: "rgba(255,255,255,0.76)", mt: 2 }}>
            Featured
          </FormLabel>
          <Checkbox
            name="featured"
            checked={inputs.featured}
            onChange={(e) =>
              setInputs((prevState) => ({
                ...prevState,
                featured: e.target.checked,
              }))
            }
            sx={{
              mr: "auto",
              color: "rgba(255,255,255,0.54)",
              "&.Mui-checked": {
                color: "#ff7a45",
              },
            }}
          />
          <Button
            type="submit"
            variant="contained"
            sx={{
              width: { xs: "100%", sm: "40%", md: "32%" },
              margin: "24px auto 0",
              py: 1.35,
              borderRadius: 999,
              bgcolor: "#ff7a45",
              color: "#08111b",
              fontWeight: 800,
              ":hover": {
                bgcolor: "#ff925d",
              },
            }}
          >
            Add New Movie
          </Button>
        </Box>
      </form>
    </div>
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
  
export default AddMovie;
