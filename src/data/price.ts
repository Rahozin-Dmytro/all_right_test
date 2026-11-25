/** Extracts the amount from UI price text: "$29.99", "Item total: $39.98", "Tax: $3.20". */
export function parsePrice(text: string): number {
  const match = /\$(\d+(?:\.\d+)?)/.exec(text);
  if (!match) throw new Error(`No price found in "${text}"`);
  return Number(match[1]);
}
