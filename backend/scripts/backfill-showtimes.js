import { prisma } from "../lib/prisma.js";

const LEGACY_HALL_NAME = "Legacy Hall";
const DEFAULT_TOTAL_SEATS = 48;

const main = async () => {
  const legacyBookings = await prisma.booking.findMany({
    where: {
      showtimeId: null,
    },
    include: {
      movie: true,
    },
    orderBy: {
      date: "asc",
    },
  });

  if (!legacyBookings.length) {
    console.log("No legacy bookings without showtimeId were found.");
    return;
  }

  let migratedCount = 0;

  for (const booking of legacyBookings) {
    const priceCandidates = [booking.totalPrice, booking.movie?.ticketPrice];
    const resolvedPrice = priceCandidates.find(
      (value) => Number.isFinite(Number(value)) && Number(value) > 0,
    );

    if (!resolvedPrice) {
      throw new Error(
        `Booking ${booking.id} does not have a valid ticket price to create a showtime.`,
      );
    }

    const showtime = await prisma.showtime.upsert({
      where: {
        movieId_startTime_hall: {
          movieId: booking.movieId,
          startTime: booking.date,
          hall: LEGACY_HALL_NAME,
        },
      },
      update: {},
      create: {
        movieId: booking.movieId,
        startTime: booking.date,
        hall: LEGACY_HALL_NAME,
        price: Number(resolvedPrice),
        totalSeats: DEFAULT_TOTAL_SEATS,
      },
    });

    await prisma.booking.update({
      where: {
        id: booking.id,
      },
      data: {
        showtimeId: showtime.id,
      },
    });

    migratedCount += 1;
  }

  console.log(`Migrated ${migratedCount} legacy bookings to showtimes.`);
};

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
