import { NextResponse } from "next/server";
import { getSetting, setSetting } from "@/lib/repositories/settingsRepo";
import { isNewerVersion } from "@/lib/version";
import packageJson from "@/package.json";

const REPO = "elevatedphysiquefitness-code/budget-ledger";
const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours — no need to hit GitHub on every dashboard load

interface CachedCheck {
  checkedAt: number;
  latestVersion: string;
  releaseUrl: string;
}

function readCache(): CachedCheck | null {
  const raw = getSetting("update_check_cache");
  if (!raw) return null;
  try {
    return JSON.parse(raw) as CachedCheck;
  } catch {
    return null;
  }
}

export async function GET() {
  const currentVersion = packageJson.version;

  let cached = readCache();
  const isFresh = cached && Date.now() - cached.checkedAt < CACHE_TTL_MS;

  if (!isFresh) {
    try {
      const response = await fetch(`https://api.github.com/repos/${REPO}/releases/latest`, {
        headers: { Accept: "application/vnd.github+json" },
      });
      if (response.ok) {
        const data = await response.json();
        cached = {
          checkedAt: Date.now(),
          latestVersion: String(data.tag_name ?? "").replace(/^v/i, ""),
          releaseUrl: data.html_url ?? `https://github.com/${REPO}/releases/latest`,
        };
        setSetting("update_check_cache", JSON.stringify(cached));
      }
    } catch {
      // Offline, GitHub unreachable, rate-limited, etc. — fall back to
      // whatever's cached (possibly nothing) rather than surfacing an error
      // for a purely informational, best-effort check.
    }
  }

  if (!cached) {
    return NextResponse.json({
      currentVersion,
      latestVersion: null,
      updateAvailable: false,
      releaseUrl: null,
    });
  }

  return NextResponse.json({
    currentVersion,
    latestVersion: cached.latestVersion,
    updateAvailable: isNewerVersion(currentVersion, cached.latestVersion),
    releaseUrl: cached.releaseUrl,
  });
}
