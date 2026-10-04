const REVIEWER_EMAILS = new Set(["asreera110@gmail.com", "asreera110@scientificml.net"]);

/** UI hint only. The API still checks a verified Neon token. */
export function isReviewer(email: string | null | undefined): boolean {
  return REVIEWER_EMAILS.has((email ?? "").trim().toLowerCase());
}
