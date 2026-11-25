/** Short value that differs on every call, so parallel tests never share data. */
export function uniqueSuffix(): string {
  return `${Date.now().toString(36)}${Math.floor(Math.random() * 1_000).toString(36)}`;
}
