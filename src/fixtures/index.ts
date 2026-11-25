import { test as base } from '@playwright/test';
import { BookingClient } from '../api/BookingClient';
import type { CreatedBooking } from '../api/types';
import { buildBooking } from '../data/booking';
import { CartPage } from '../pages/CartPage';
import { CheckoutCompletePage } from '../pages/CheckoutCompletePage';
import { CheckoutInformationPage } from '../pages/CheckoutInformationPage';
import { CheckoutOverviewPage } from '../pages/CheckoutOverviewPage';
import { InventoryPage } from '../pages/InventoryPage';
import { LoginPage } from '../pages/LoginPage';
import { ProductDetailsPage } from '../pages/ProductDetailsPage';

/** Teardown delete that fails loudly, so a booking left on the shared server does not go unnoticed. */
async function deleteBooking(bookingClient: BookingClient, id: number): Promise<void> {
  const response = await bookingClient.delete(id);
  // 405: the test already deleted the booking (the API answers 405 instead of 404, BUG-14 in docs/exploratory.md).
  if (!response.ok() && response.status() !== 405) {
    throw new Error(`Cleanup: delete booking ${id} failed: ${response.status()} ${await response.text()}`);
  }
}

interface Pages {
  loginPage: LoginPage;
  inventoryPage: InventoryPage;
  productDetailsPage: ProductDetailsPage;
  cartPage: CartPage;
  checkoutInformationPage: CheckoutInformationPage;
  checkoutOverviewPage: CheckoutOverviewPage;
  checkoutCompletePage: CheckoutCompletePage;
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
  productDetailsPage: async ({ page }, use) => {
    await use(new ProductDetailsPage(page));
  },
  cartPage: async ({ page }, use) => {
    await use(new CartPage(page));
  },
  checkoutInformationPage: async ({ page }, use) => {
    await use(new CheckoutInformationPage(page));
  },
  checkoutOverviewPage: async ({ page }, use) => {
    await use(new CheckoutOverviewPage(page));
  },
  checkoutCompletePage: async ({ page }, use) => {
    await use(new CheckoutCompletePage(page));
  },

  bookingClient: async ({ request }, use) => {
    await use(new BookingClient(request));
  },
  createdBooking: async ({ bookingClient }, use) => {
    const created = await bookingClient.createAndParse(buildBooking());
    await use(created);
    await deleteBooking(bookingClient, created.bookingid);
  },
  cleanup: async ({ bookingClient }, use) => {
    const bookingIds: number[] = [];
    await use({ booking: (id) => bookingIds.push(id) });
    await Promise.all(bookingIds.map((id) => deleteBooking(bookingClient, id)));
  },
});

/** Annotation for a test of a known app bug: the test asserts the correct behaviour and stays `fixme` until the fix. */
export function knownBug(id: string): { type: string; description: string } {
  return { type: 'issue', description: `README.md#${id}` };
}

export { expect } from '@playwright/test';
