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

export const serializeBooking = (booking) => ({
  _id: booking.id,
  movie: booking.movie ? serializeMovie(booking.movie) : booking.movieId,
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
