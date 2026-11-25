import type { APIRequestContext, APIResponse } from '@playwright/test';
import type { z } from 'zod';
import { env } from '../config/env';
import type { AuthRequest, Booking, CreatedBooking } from './types';
import { authErrorResponseSchema, authResponseSchema, bookingSchema, createdBookingSchema } from './types';

/** Throws with status and trimmed body if the response is not 2xx, then validates the body against the schema. */
async function parseOk<T>(response: APIResponse, action: string, schema: z.ZodType<T>): Promise<T> {
  if (!response.ok()) {
    const body = (await response.text()).slice(0, 300);
    throw new Error(`${action} failed: ${response.status()} ${response.statusText()} — ${body}`);
  }
  return schema.parse(await response.json());
}

export class BookingClient {
  private token: string | undefined;

  constructor(private readonly request: APIRequestContext) {}

  async auth(credentials: AuthRequest): Promise<APIResponse> {
    return this.request.post('/auth', { data: credentials });
  }

  /** Use a token from `auth()` for the next write requests instead of authenticating on demand. */
  useToken(token: string): void {
    this.token = token;
  }

  async create(booking: Booking): Promise<APIResponse> {
    return this.createRaw(booking);
  }

  /** For negative tests only: sends a body that may miss required fields. */
  async createRaw(body: Partial<Booking>): Promise<APIResponse> {
    return this.request.post('/booking', { data: body });
  }

  async createAndParse(booking: Booking): Promise<CreatedBooking> {
    return parseOk(await this.create(booking), 'Create booking', createdBookingSchema);
  }

  async get(id: number): Promise<APIResponse> {
    return this.request.get(`/booking/${id}`);
  }

  async getAndParse(id: number): Promise<Booking> {
    return parseOk(await this.get(id), `Get booking ${id}`, bookingSchema);
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
    this.token ??= await this.issueToken();
    return { Cookie: `token=${this.token}` };
  }

  /** The API answers rejected credentials with 200 and a `reason` (README.md#bug-09), so both shapes are accepted here. */
  private async issueToken(): Promise<string> {
    const response = await this.auth(env.apiAdmin);
    const body = await parseOk(response, 'Auth', authResponseSchema.or(authErrorResponseSchema));
    if (!('token' in body)) throw new Error(`Auth failed: ${response.status()} — ${body.reason}`);
    return body.token;
  }
}
