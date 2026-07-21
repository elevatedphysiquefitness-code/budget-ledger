import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Minimal self-contained server bundle, used when packaging the Electron desktop app.
  output: "standalone",
  // Keep the native module as a real require() instead of being traced/bundled.
  serverExternalPackages: ["better-sqlite3"],
  // db/client.ts opens the SQLite file at module-load time, which Next's build-time
  // page-data collection can trigger for real. Never let personal data get traced
  // into the standalone bundle, regardless of what the build happens to touch.
  outputFileTracingExcludes: {
    "*": ["./data/**", "./budget-data-export.json", "./budget-data-export.example.json"],
  },
};

export default nextConfig;
