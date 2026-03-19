import axios from "axios";

const extractErrorMessage = (error, fallbackMessage) =>
  error?.response?.data?.message || fallbackMessage;

const request = async (callback, fallbackMessage) => {
  try {
    const res = await callback();
    return res.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error, fallbackMessage));
  }
};

export const getAllMovies = async () => {
  return request(() => axios.get("/movie"), "Unable to fetch movies");
};

export const sendUserAuthRequest = async (data, signup) => {
  return request(
    () =>
      axios.post(`/user/${signup ? "signup" : "login"}`, {
      name: signup ? data.name : "",
      email: data.email,
      password: data.password,
      }),
    "Unable to authenticate user"
  );
};

export const sendAdminAuthRequest = async (data) => {
  return request(
    () =>
      axios.post("/admin/login", {
      email: data.email,
      password: data.password,
      }),
    "Unable to authenticate admin"
  );
};

export const getMovieDetails = async (id) => {
  return request(() => axios.get(`/movie/${id}`), "Unable to fetch movie");
};

export const newBooking = async (data) => {
  return request(
    () =>
      axios.post("/booking", {
      movie: data.movie,
      seatNumber: data.seatNumber,
      date: data.date,
      user: localStorage.getItem("userId"),
      }),
    "Unable to create booking"
  );
};

export const getBookedSeats = async (movieId, date) => {
  return request(
    () => axios.get(`/booking/movie/${movieId}/seats`, { params: { date } }),
    "Unable to fetch booked seats"
  );
};

export const getUserBooking = async () => {
  const id = localStorage.getItem("userId");

  return request(
    () => axios.get(`/user/bookings/${id}`),
    "Unable to fetch bookings"
  );
};

export const deleteBooking = async (id) => {
  return request(() => axios.delete(`/booking/${id}`), "Unable to delete booking");
};

export const getUserDetails = async () => {
  const id = localStorage.getItem("userId");

  return request(() => axios.get(`/user/${id}`), "Unable to fetch user details");
};

export const addMovie = async (data) => {
  return request(
    () =>
      axios.post(
        "/movie",
        {
        title: data.title,
        description: data.description,
        releaseDate: data.releaseDate,
        posterUrl: data.posterUrl,
        featured: data.featured,
        actors: data.actors,
        admin: localStorage.getItem("adminId"),
        },
        {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        }
      ),
    "Unable to add movie"
  );
};

export const getAdminById = async () => {
  const adminId = localStorage.getItem("adminId");

  return request(() => axios.get(`/admin/${adminId}`), "Unable to fetch admin");
};
