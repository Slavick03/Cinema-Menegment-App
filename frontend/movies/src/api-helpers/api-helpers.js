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

const getMultipartAuthHeaders = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem("token")}`,
    "Content-Type": "multipart/form-data",
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

export const updateMovieReview = async (movieId, reviewId, data) => {
  return request(
    () =>
      axios.put(
        `/movie/${movieId}/reviews/${reviewId}`,
        {
          rating: data.rating,
          comment: data.comment,
        },
        getAuthHeaders(),
      ),
    "Unable to update review"
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

export const reserveBooking = async (data) => {
  return request(
    () =>
      axios.post(
        "/booking/reserve",
        {
          showtime: data.showtime,
          seatNumber: data.seatNumber,
          customerFirstName: data.customerFirstName,
          customerLastName: data.customerLastName,
          phoneNumber: data.phoneNumber,
          user: localStorage.getItem("userId"),
        },
        getAuthHeaders(),
      ),
    "Unable to reserve booking"
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

  return request(
    () => axios.get(`/admin/${adminId}`, getAuthHeaders()),
    "Unable to fetch admin",
  );
};

export const getHomeHeroSettings = async () => {
  return request(
    () => axios.get("/movie/home-hero"),
    "Unable to fetch home hero settings",
  );
};

export const updateHomeHeroSettings = async (data) => {
  return request(
    () =>
      axios.put(
        "/admin/home-hero",
        {
          badgeLabel: data.badgeLabel,
          title: data.title,
          description: data.description,
          posterUrl: data.posterUrl,
        },
        getAuthHeaders(),
      ),
    "Unable to update home hero settings",
  );
};

export const getThemeSettings = async () => {
  return request(
    () => axios.get("/movie/theme"),
    "Unable to fetch theme settings",
  );
};

export const getAdminThemeSettings = async () => {
  return request(
    () => axios.get("/admin/theme", getAuthHeaders()),
    "Unable to fetch theme settings",
  );
};

export const updateThemeSettings = async (data) => {
  return request(
    () =>
      axios.put(
        "/admin/theme",
        {
          primaryColor: data.primaryColor,
          secondaryColor: data.secondaryColor,
          backgroundColor: data.backgroundColor,
          fontFamily: data.fontFamily,
          companyName: data.companyName,
        },
        getAuthHeaders(),
      ),
    "Unable to update theme settings",
  );
};

const uploadThemeAsset = async (endpoint, file, fallbackMessage) => {
  const formData = new FormData();
  formData.append("file", file);

  return request(
    () => axios.post(endpoint, formData, getMultipartAuthHeaders()),
    fallbackMessage,
  );
};

export const uploadThemeLogo = async (file) =>
  uploadThemeAsset("/admin/theme/upload-logo", file, "Unable to upload theme logo");

export const uploadThemeFavicon = async (file) =>
  uploadThemeAsset("/admin/theme/upload-favicon", file, "Unable to upload theme favicon");

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
