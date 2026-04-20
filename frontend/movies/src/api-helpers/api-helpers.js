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

const getAuthHeaders = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  },
});

export const getAllMovies = async (params = {}) => {
  const normalizedParams = Object.entries(params).reduce((accumulator, [key, value]) => {
    if (value !== undefined && value !== null && `${value}`.trim() !== "") {
      accumulator[key] = value;
    }

    return accumulator;
  }, {});

  return request(
    () => axios.get("/movie", { params: normalizedParams }),
    "Unable to fetch movies"
  );
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

export const addMovieReview = async (movieId, data) => {
  return request(
    () =>
      axios.post(
        `/movie/${movieId}/reviews`,
        {
          user: localStorage.getItem("userId"),
          rating: data.rating,
          comment: data.comment,
        },
        getAuthHeaders(),
      ),
    "Unable to save review"
  );
};

export const deleteMovieReview = async (movieId, reviewId) => {
  return request(
    () => axios.delete(`/movie/${movieId}/reviews/${reviewId}`, getAuthHeaders()),
    "Unable to delete review",
  );
};

export const newBooking = async (data) => {
  return request(
    () =>
      axios.post(
        "/booking",
        {
          showtime: data.showtime,
          seatNumber: data.seatNumber,
          customerFirstName: data.customerFirstName,
          customerLastName: data.customerLastName,
          phoneNumber: data.phoneNumber,
          paymentMethod: data.paymentMethod,
          stripePaymentIntentId: data.stripePaymentIntentId,
          user: localStorage.getItem("userId"),
        },
        getAuthHeaders(),
      ),
    "Unable to create booking"
  );
};

export const getStripeConfig = async () => {
  return request(() => axios.get("/booking/payment/config"), "Unable to load Stripe settings");
};

export const createPaymentIntent = async (data) => {
  return request(
    () =>
      axios.post(
        "/booking/payment/intent",
        {
          showtime: data.showtime,
          seatNumber: data.seatNumber,
          customerFirstName: data.customerFirstName,
          customerLastName: data.customerLastName,
          phoneNumber: data.phoneNumber,
          paymentMethod: data.paymentMethod,
          user: localStorage.getItem("userId"),
        },
        getAuthHeaders(),
      ),
    "Unable to initialize Stripe payment"
  );
};

export const completePaymentBooking = async (paymentIntentId) => {
  return request(
    () =>
      axios.post(
        "/booking/payment/complete",
        { paymentIntentId },
        getAuthHeaders(),
      ),
    "Unable to complete Stripe payment"
  );
};

export const getBookedSeats = async (showtimeId) => {
  return request(
    () => axios.get(`/booking/showtime/${showtimeId}/seats`),
    "Unable to fetch booked seats"
  );
};

export const getUserBooking = async () => {
  const id = localStorage.getItem("userId");

  return request(
    () => axios.get(`/user/bookings/${id}`, getAuthHeaders()),
    "Unable to fetch bookings"
  );
};

export const deleteBooking = async (id) => {
  return request(
    () => axios.delete(`/booking/${id}`, getAuthHeaders()),
    "Unable to delete booking",
  );
};

export const getUserDetails = async () => {
  const id = localStorage.getItem("userId");

  return request(
    () => axios.get(`/user/${id}`, getAuthHeaders()),
    "Unable to fetch user details",
  );
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
        ticketPrice: data.ticketPrice,
        showtimes: data.showtimes,
        admin: localStorage.getItem("adminId"),
        },
        getAuthHeaders()
      ),
    "Unable to add movie"
  );
};

export const updateMovie = async (id, data) => {
  return request(
    () =>
      axios.put(
        `/movie/${id}`,
        {
          title: data.title,
          description: data.description,
          releaseDate: data.releaseDate,
          posterUrl: data.posterUrl,
          featured: data.featured,
          actors: data.actors,
          ticketPrice: data.ticketPrice,
          showtimes: data.showtimes,
        },
        getAuthHeaders()
      ),
    "Unable to update movie"
  );
};

export const deleteMovie = async (id) => {
  return request(
    () =>
      axios.delete(`/movie/${id}`, getAuthHeaders()),
    "Unable to delete movie"
  );
};

export const getAdminById = async () => {
  const adminId = localStorage.getItem("adminId");

  return request(() => axios.get(`/admin/${adminId}`), "Unable to fetch admin");
};

export const deleteAdminBooking = async (id) => {
  return request(
    () => axios.delete(`/admin/booking/${id}`, getAuthHeaders()),
    "Unable to delete booking",
  );
};

export const deleteAdminReview = async (id) => {
  return request(
    () => axios.delete(`/admin/review/${id}`, getAuthHeaders()),
    "Unable to delete review",
  );
};
