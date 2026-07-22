/** Parses "v1.2.3" or "1.2.3" into [1, 2, 3], padding missing parts with 0. */
function parseVersion(version: string): number[] {
  const cleaned = version.trim().replace(/^v/i, "");
  return cleaned.split(".").map((part) => Number(part) || 0);
}

/** True if `latest` is a strictly newer version than `current`. Simple
 *  numeric x.y.z comparison — no pre-release/build-metadata support, which
 *  this app's plain version numbers don't use. */
export function isNewerVersion(current: string, latest: string): boolean {
  const a = parseVersion(current);
  const b = parseVersion(latest);
  const length = Math.max(a.length, b.length);

  for (let i = 0; i < length; i++) {
    const currentPart = a[i] ?? 0;
    const latestPart = b[i] ?? 0;
    if (latestPart > currentPart) return true;
    if (latestPart < currentPart) return false;
  }
  return false;
}
