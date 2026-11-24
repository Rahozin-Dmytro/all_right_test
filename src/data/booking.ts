import type { Booking } from '../api/types';

function isoDate(daysFromToday: number): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + daysFromToday);
  return date.toISOString().slice(0, 10);
}

function uniqueSuffix(): string {
  return `${Date.now().toString(36)}${Math.floor(Math.random() * 1_000).toString(36)}`;
}

/** Valid booking with unique names; override only what the test is about. */
export function buildBooking(overrides: Partial<Booking> = {}): Booking {
  return {
    firstname: `Auto${uniqueSuffix()}`,
    lastname: 'Tester',
    totalprice: 150,
    depositpaid: true,
    bookingdates: { checkin: isoDate(7), checkout: isoDate(10) },
    additionalneeds: 'Breakfast',
    ...overrides,
  };
}
