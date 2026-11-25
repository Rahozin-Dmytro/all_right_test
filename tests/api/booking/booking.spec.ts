import type { Booking } from '../../../src/api/types';
import { authResponseSchema, createdBookingSchema } from '../../../src/api/types';
import { env } from '../../../src/config/env';
import { buildBooking } from '../../../src/data/booking';
import { expect, test } from '../../../src/fixtures';

test.describe('Booking API', { tag: ['@api'] }, () => {
  test(
    'should create, update and delete booking when admin is authenticated',
    { tag: ['@smoke'] },
    async ({ bookingClient, cleanup }) => {
      await test.step('Authenticate', async () => {
        const response = await bookingClient.auth(env.apiAdmin);
        expect(response.status()).toBe(200);
        const body: unknown = await response.json();
        expect(body).toEqual({ token: expect.stringMatching(/^\w+$/) });
        bookingClient.useToken(authResponseSchema.parse(body).token);
      });

      const booking = buildBooking();

      const bookingId = await test.step('Create booking', async () => {
        const response = await bookingClient.create(booking);
        expect(response.status()).toBe(200);
        const created = createdBookingSchema.parse(await response.json());
        // Safety net: if a later step fails, teardown still deletes the booking.
        cleanup.booking(created.bookingid);
        expect(created.bookingid).toBeGreaterThan(0);
        expect(created.booking).toEqual(booking);
        return created.bookingid;
      });

      const changed: Booking = {
        ...booking,
        firstname: `${booking.firstname}Updated`,
        totalprice: booking.totalprice + 50,
        depositpaid: !booking.depositpaid,
      };

      await test.step('Update booking', async () => {
        const response = await bookingClient.update(bookingId, changed);
        expect(response.status()).toBe(200);
        expect(await response.json()).toEqual(changed);
      });

      await test.step('Read back updated booking', async () => {
        const response = await bookingClient.get(bookingId);
        expect(response.status()).toBe(200);
        expect(await response.json()).toEqual(changed);
      });

      await test.step('Delete booking', async () => {
        const response = await bookingClient.delete(bookingId);
        // Success is checked as 2xx: the API answers 201 instead of 200/204 (BUG-15 in docs/exploratory.md).
        await expect(response).toBeOK();
      });

      await test.step('Verify booking is gone', async () => {
        const response = await bookingClient.get(bookingId);
        expect(response.status()).toBe(404);
      });
    },
  );
});
