import { prisma } from "../lib/prisma.js";

export const RESERVATION_PAYMENT_METHOD = "reservation";
export const PAID_PAYMENT_STATUS = "paid";
export const RESERVED_PAYMENT_STATUS = "reserved";
export const RESERVATION_LOCK_MINUTES = 45;

export const getReservationReleaseTime = (showtimeStartTime) =>
  new Date(
    new Date(showtimeStartTime).getTime() - RESERVATION_LOCK_MINUTES * 60 * 1000,
  );

export const cleanupExpiredReservations = async () => {
  const reservationReleaseThreshold = new Date(
    Date.now() + RESERVATION_LOCK_MINUTES * 60 * 1000,
  );

  return prisma.booking.deleteMany({
    where: {
      paymentStatus: RESERVED_PAYMENT_STATUS,
      showtime: {
        startTime: {
          lte: reservationReleaseThreshold,
        },
      },
    },
  });
};
