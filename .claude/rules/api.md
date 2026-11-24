---
paths:
  - 'src/api/**/*.ts'
  - 'tests/api/**/*.ts'
  - 'src/data/**/*.ts'
---

# API clients and API tests

- One client per resource (`BookingClient`) over Playwright `APIRequestContext`; created in fixtures.
- Client methods return the raw `APIResponse` (for status/header checks) plus typed helpers that parse JSON:
  `create(body) → APIResponse`, `createAndParse(body) → Booking` (throws with status + body text if not ok).
- Request/response types live next to the client (`types.ts`). No `any`; validate shape with assertions in the spec.
- Auth token is obtained once per client instance and cached; never hardcode tokens.
- Specs assert: status code, key fields, and for writes — read-back (GET after POST/PUT).
- Every created entity is deleted in fixture teardown, even if the test fails.
- Test data comes from builders in `src/data`: valid defaults + overrides, unique values per run:
  ```ts
  const booking = buildBooking({ totalprice: 0 });
  ```
- Negative tests: one invalid aspect per test (missing field, wrong type, no auth), assert status and error body.
- Never log full responses with secrets; error messages may include status and trimmed body.
