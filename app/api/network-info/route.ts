import os from "node:os";
import { NextResponse } from "next/server";

export async function GET() {
  const interfaces = os.networkInterfaces();
  let lanIp: string | null = null;

  for (const entries of Object.values(interfaces)) {
    if (!entries) continue;
    for (const entry of entries) {
      if (entry.family === "IPv4" && !entry.internal) {
        lanIp = entry.address;
        break;
      }
    }
    if (lanIp) break;
  }

  const port = process.env.PORT ?? "3000";
  const lanUrl = lanIp ? `http://${lanIp}:${port}` : null;

  return NextResponse.json({ lanUrl });
}
