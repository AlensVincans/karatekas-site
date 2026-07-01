export function getDb() {
  throw new Error(
    "Server database adapter is not configured for DigitalOcean yet. The storefront currently uses the local seed data and browser/admin storage.",
  );
}
