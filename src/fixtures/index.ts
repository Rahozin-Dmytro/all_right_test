import { test as base } from '@playwright/test';
import { BookingClient } from '../api/BookingClient';
import type { CreatedBooking } from '../api/types';
import { buildBooking } from '../data/booking';
import { CartPage } from '../pages/CartPage';
import { InventoryPage } from '../pages/InventoryPage';
import { LoginPage } from '../pages/LoginPage';

interface Pages {
  loginPage: LoginPage;
  inventoryPage: InventoryPage;
  cartPage: CartPage;
}

interface Cleanup {
  /** Register an entity created inside the test; it is deleted after the test, even if the test fails. */
  booking: (id: number) => void;
}

interface Api {
  bookingClient: BookingClient;
  /** Booking created via API before the test and deleted after it, even if the test fails. */
  createdBooking: CreatedBooking;
  cleanup: Cleanup;
}

export const test = base.extend<Pages & Api>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  inventoryPage: async ({ page }, use) => {
    await use(new InventoryPage(page));
  },
  cartPage: async ({ page }, use) => {
    await use(new CartPage(page));
  },

  bookingClient: async ({ request }, use) => {
    await use(new BookingClient(request));
  },
  createdBooking: async ({ bookingClient }, use) => {
    const created = await bookingClient.createAndParse(buildBooking());
    await use(created);
    await bookingClient.delete(created.bookingid);
  },
  cleanup: async ({ bookingClient }, use) => {
    const bookingIds: number[] = [];
    await use({ booking: (id) => bookingIds.push(id) });
    await Promise.all(bookingIds.map((id) => bookingClient.delete(id)));
  },
});

export { expect } from '@playwright/test';
