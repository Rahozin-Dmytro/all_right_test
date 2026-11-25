import { z } from 'zod';

/** Schemas are the single source: each type below is inferred, so a response is typed only after it is validated. */

export const bookingSchema = z.object({
  firstname: z.string(),
  lastname: z.string(),
  totalprice: z.number(),
  depositpaid: z.boolean(),
  bookingdates: z.object({ checkin: z.string(), checkout: z.string() }),
  additionalneeds: z.string().optional(),
});

export const createdBookingSchema = z.object({
  bookingid: z.number().int().positive(),
  booking: bookingSchema,
});

export const authResponseSchema = z.object({ token: z.string().min(1) });

/** Body that `POST /auth` returns instead of a token when credentials are rejected (README.md#bug-09). */
export const authErrorResponseSchema = z.object({ reason: z.string() });

export type Booking = z.infer<typeof bookingSchema>;
export type BookingDates = Booking['bookingdates'];
export type CreatedBooking = z.infer<typeof createdBookingSchema>;
export type AuthResponse = z.infer<typeof authResponseSchema>;
export type AuthErrorResponse = z.infer<typeof authErrorResponseSchema>;

export interface AuthRequest {
  username: string;
  password: string;
}
