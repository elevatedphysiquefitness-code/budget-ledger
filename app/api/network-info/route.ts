import os from "node:os";
import { NextResponse } from "next/server";

// VPN tunnels, AirDrop/AirPlay, virtual bridges, container/VM adapters, etc.
// These commonly hand out their own non-internal IPv4 too, and can appear
// before the real WiFi/Ethernet interface in os.networkInterfaces() — picking
// the "first" non-internal address blindly can point at an address nothing
// else on the LAN can actually reach.
const VIRTUAL_INTERFACE_PATTERN = /^(utun|awdl|llw|bridge|vmnet|tailscale|docker|veth|tun|ppp|anpi|ap\d)/i;

function isPrivateLanAddress(address: string): boolean {
  return (
    /^192\.168\./.test(address) ||
    /^10\./.test(address) ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(address)
  );
}

export async function GET() {
  const interfaces = os.networkInterfaces();
  const candidates: { name: string; address: string }[] = [];

  for (const [name, entries] of Object.entries(interfaces)) {
    if (!entries) continue;
    for (const entry of entries) {
      if (entry.family === "IPv4" && !entry.internal) {
        candidates.push({ name, address: entry.address });
      }
    }
  }

  // Prefer real network interfaces on typical private-LAN ranges over
  // VPN/virtual adapters, since those are the ones another device on the
  // same WiFi can actually reach.
  const ranked = [...candidates].sort((a, b) => {
    const aVirtual = VIRTUAL_INTERFACE_PATTERN.test(a.name);
    const bVirtual = VIRTUAL_INTERFACE_PATTERN.test(b.name);
    if (aVirtual !== bVirtual) return aVirtual ? 1 : -1;
    const aPrivate = isPrivateLanAddress(a.address);
    const bPrivate = isPrivateLanAddress(b.address);
    if (aPrivate !== bPrivate) return aPrivate ? -1 : 1;
    return 0;
  });

  const port = process.env.PORT ?? "3000";
  const urls = ranked.map((c) => `http://${c.address}:${port}`);

  return NextResponse.json({
    lanUrl: urls[0] ?? null,
    // Shown as fallbacks in Settings in case the first guess isn't the
    // interface the phone can actually reach.
    alternateUrls: urls.slice(1),
  });
}
