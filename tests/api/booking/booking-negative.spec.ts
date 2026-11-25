import type { AuthErrorResponse, Booking } from '../../../src/api/types';
import { env } from '../../../src/config/env';
import { buildBooking } from '../../../src/data/booking';
import { expect, knownBug, test } from '../../../src/fixtures';

/** Booking ids are positive integers, so 0 is never issued. */
const NON_EXISTENT_BOOKING_ID = 0;
const WRONG_CREDENTIALS = { username: env.apiAdmin.username, password: 'wrong-password' };

test.describe('Booking API negative', { tag: ['@api', '@regression'] }, () => {
  test.describe('auth', () => {
    test('should not issue token when password is wrong', async ({ bookingClient }) => {
      const response = await bookingClient.auth(WRONG_CREDENTIALS);

      const body = (await response.json()) as AuthErrorResponse;
      expect(body).toEqual({ reason: 'Bad credentials' });
    });

    test.fixme(
      'should return 401 when password is wrong',
      { annotation: knownBug('bug-09') },
      async ({ bookingClient }) => {
        const response = await bookingClient.auth(WRONG_CREDENTIALS);

        expect(response.status()).toBe(401);
      },
    );
  });

  test.describe('booking', () => {
    test('should reject update and keep booking unchanged when token is missing', async ({
      bookingClient,
      createdBooking,
    }) => {
      const changed = { ...createdBooking.booking, totalprice: createdBooking.booking.totalprice + 1 };

      const response = await bookingClient.updateWithoutAuth(createdBooking.bookingid, changed);

      expect(response.status()).toBe(403);
      expect(await bookingClient.getAndParse(createdBooking.bookingid)).toEqual(createdBooking.booking);
    });

    test('should return 404 when booking does not exist', async ({ bookingClient }) => {
      const response = await bookingClient.get(NON_EXISTENT_BOOKING_ID);

      expect(response.status()).toBe(404);
    });

    test.fixme(
      'should return 400 when firstname is missing',
      { annotation: knownBug('bug-10') },
      async ({ bookingClient }) => {
        const withoutFirstname: Partial<Booking> = buildBooking();
        delete withoutFirstname.firstname;

        // No cleanup: today the API creates nothing (500). If it ever answers 2xx, this test fails and the booking
        // stays on the server; registering it would need an `if` in the test or a cleanup helper — not worth it
        // for a test assignment, accepted as a known gap.
        const response = await bookingClient.createRaw(withoutFirstname);

        expect(response.status()).toBe(400);
      },
    );
  });
});
