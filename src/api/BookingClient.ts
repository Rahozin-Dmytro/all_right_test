import type { APIRequestContext, APIResponse } from '@playwright/test';
import { env } from '../config/env';
import type { AuthResponse, Booking, CreatedBooking } from './types';

async function parseOk<T>(response: APIResponse, action: string): Promise<T> {
  if (!response.ok()) {
    const body = (await response.text()).slice(0, 300);
    throw new Error(`${action} failed: ${response.status()} ${response.statusText()} — ${body}`);
  }
  return (await response.json()) as T;
}

export class BookingClient {
  private token: string | undefined;

  constructor(private readonly request: APIRequestContext) {}

  async create(booking: Booking): Promise<APIResponse> {
    return this.request.post('/booking', { data: booking });
  }

  async createAndParse(booking: Booking): Promise<CreatedBooking> {
    return parseOk<CreatedBooking>(await this.create(booking), 'Create booking');
  }

  async get(id: number): Promise<APIResponse> {
    return this.request.get(`/booking/${id}`);
  }

  async getAndParse(id: number): Promise<Booking> {
    return parseOk<Booking>(await this.get(id), `Get booking ${id}`);
  }

  async update(id: number, booking: Booking): Promise<APIResponse> {
    return this.request.put(`/booking/${id}`, { data: booking, headers: await this.authHeaders() });
  }

  async updateWithoutAuth(id: number, booking: Booking): Promise<APIResponse> {
    return this.request.put(`/booking/${id}`, { data: booking });
  }

  async delete(id: number): Promise<APIResponse> {
    return this.request.delete(`/booking/${id}`, { headers: await this.authHeaders() });
  }

  private async authHeaders(): Promise<Record<string, string>> {
    if (!this.token) {
      const response = await this.request.post('/auth', { data: env.apiAdmin });
      this.token = (await parseOk<AuthResponse>(response, 'Auth')).token;
    }
    return { Cookie: `token=${this.token}` };
  }
}
