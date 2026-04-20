const toIsoString = (value) =>
  value instanceof Date ? value.toISOString() : value;

export const serializeUser = (user) => ({
  _id: user.id,
  name: user.name,
  email: user.email,
  password: user.password,
});

export const serializeMovie = (movie) => ({
  _id: movie.id,
  title: movie.title,
  description: movie.description,
  actors: movie.actors,
  releaseDate: toIsoString(movie.releaseDate),
  posterUrl: movie.posterUrl,
  ticketPrice: movie.ticketPrice,
  featured: movie.featured,
  admin: movie.adminId,
  showtimes: Array.isArray(movie.showtimes)
    ? movie.showtimes.map(serializeShowtime)
    : undefined,
});

export const serializeAdmin = (admin) => ({
  _id: admin.id,
  email: admin.email,
  password: admin.password,
  addedMovies: admin.movies?.map((movie) => movie.id) || [],
});

export const serializeComment = (comment) => ({
  _id: comment.id,
  movie: comment.movieId,
  movieTitle: comment.movieTitle,
  user: comment.userId,
  userName: comment.userName,
  userEmail: comment.userEmail,
  text: comment.text,
  rating: comment.rating,
  createdAt: toIsoString(comment.createdAt),
  updatedAt: toIsoString(comment.updatedAt),
});

export const serializeShowtime = (showtime) => ({
  _id: showtime.id,
  movie: showtime.movie ? serializeMovie(showtime.movie) : showtime.movieId,
  startTime: toIsoString(showtime.startTime),
  hall: showtime.hall,
  price: showtime.price,
  totalSeats: showtime.totalSeats,
  createdAt: toIsoString(showtime.createdAt),
  updatedAt: toIsoString(showtime.updatedAt),
});

export const serializeBooking = (booking) => ({
  _id: booking.id,
  movie: booking.movie ? serializeMovie(booking.movie) : booking.movieId,
  showtime: booking.showtime
    ? serializeShowtime(booking.showtime)
    : booking.showtimeId,
  date: toIsoString(booking.date),
  seatNumber: booking.seatNumber,
  customerFirstName: booking.customerFirstName,
  customerLastName: booking.customerLastName,
  phoneNumber: booking.phoneNumber,
  paymentMethod: booking.paymentMethod,
  paymentStatus: booking.paymentStatus,
  totalPrice: booking.totalPrice,
  ticketCode: booking.ticketCode,
  qrCodeValue: booking.qrCodeValue,
  user: booking.user ? serializeUser(booking.user) : booking.userId,
  createdAt: toIsoString(booking.createdAt),
  updatedAt: toIsoString(booking.updatedAt),
});
