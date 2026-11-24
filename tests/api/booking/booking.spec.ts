import type { CreatedBooking } from '../../../src/api/types';
import { buildBooking } from '../../../src/data/booking';
import { expect, test } from '../../../src/fixtures';

test.describe('Booking API', { tag: ['@api'] }, () => {
  test(
    'should create booking and return it by id',
    { tag: ['@smoke'] },
    async ({ bookingClient, cleanup }) => {
      const booking = buildBooking();

      const response = await bookingClient.create(booking);
      expect(response.status()).toBe(200);
      const created = (await response.json()) as CreatedBooking;
      cleanup.booking(created.bookingid);

      expect(created.bookingid).toBeGreaterThan(0);
      expect(created.booking).toEqual(booking);
      expect(await bookingClient.getAndParse(created.bookingid)).toEqual(booking);
    },
  );

  test('should update booking when token is valid', async ({ bookingClient, createdBooking }) => {
    const changed = { ...createdBooking.booking, totalprice: 999, depositpaid: false };

    const response = await bookingClient.update(createdBooking.bookingid, changed);

    expect(response.status()).toBe(200);
    expect(await bookingClient.getAndParse(createdBooking.bookingid)).toEqual(changed);
  });

  test('should reject update when token is missing', async ({ bookingClient, createdBooking }) => {
    const changed = { ...createdBooking.booking, totalprice: 1 };

    const response = await bookingClient.updateWithoutAuth(createdBooking.bookingid, changed);

    expect(response.status()).toBe(403);
    expect(await bookingClient.getAndParse(createdBooking.bookingid)).toEqual(createdBooking.booking);
  });

  test('should return 404 for deleted booking', async ({ bookingClient }) => {
    const { bookingid } = await bookingClient.createAndParse(buildBooking());

    const deleteResponse = await bookingClient.delete(bookingid);
    expect(deleteResponse.status()).toBe(201);

    const getResponse = await bookingClient.get(bookingid);
    expect(getResponse.status()).toBe(404);
  });
});
