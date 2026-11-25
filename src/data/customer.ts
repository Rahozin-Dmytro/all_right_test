import type { CustomerInformation } from '../pages/CheckoutInformationPage';
import { uniqueSuffix } from './unique';

/** Valid checkout customer with unique names; override only the field the test is about. */
export function buildCustomer(overrides: Partial<CustomerInformation> = {}): CustomerInformation {
  return {
    firstName: `Auto${uniqueSuffix()}`,
    lastName: 'Tester',
    postalCode: '01001',
    ...overrides,
  };
}
