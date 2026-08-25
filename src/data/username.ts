/**
 * A worker signs in with a username, which Firebase Auth can only accept as an email
 * address — so the username is turned into one. Everything outside this character set
 * is dropped in that translation, which means a name typed in Hebrew reduces to an
 * empty string and two different people end up on the SAME account.
 *
 * These rules live here, in plain data, so the screens can warn about a name before it
 * is used and the auth module can build the address from the same definition.
 */
export function normalizeUsername(username: string): string {
  return username.trim().toLowerCase().replace(/[^a-z0-9_.-]/g, "");
}

/** Two usable characters is the floor: below that the address is effectively shared. */
export function isUsernameUsable(username: string): boolean {
  return normalizeUsername(username).length >= 2;
}

export const USERNAME_HINT = "שם המשתמש באותיות באנגלית או בספרות (לפחות 2 תווים)";
