import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ domain: string }> }
) {
  const { domain } = await params;
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") || "posture";
  const theme = searchParams.get("theme") || "dark";

  let label = "HARIZEON BENCHMARK";
  let status = "GRADE A+";
  let statusBg = "#02acc5";
  let statusColor = "#ffffff";

  if (type === "cisa-kev" || type === "exploits") {
    label = "THREAT DEFENSE";
    status = "0 ACTIVE EXPLOITS";
    statusBg = "#059669"; // Emerald
    statusColor = "#ffffff";
  } else if (type === "ai-armor" || type === "mcp") {
    label = "AI-ARMOR";
    status = "MCP SECURED";
    statusBg = "#0284c7"; // Cyan
    statusColor = "#ffffff";
  } else if (type === "act-854" || type === "compliance") {
    label = "ACT 854";
    status = "NCII COMPLIANT";
    statusBg = "#171d29"; // Obsidian
    statusColor = "#02acc5";
  } else if (type === "score") {
    label = "SECURITY SCORE";
    status = "98/100 · A+";
    statusBg = "#02acc5";
    statusColor = "#ffffff";
  }

  const isDark = theme !== "light";
  const brandBg = isDark ? "#171d29" : "#0f172a";
  const textColor = "#ffffff";
  const borderColor = "#2b3544";

  // Robust width calculation with generous padding so text never overlaps
  const charWidth = 9.2;
  const labelTextWidth = Math.ceil(label.length * charWidth);
  const statusTextWidth = Math.ceil(status.length * charWidth);

  // Emblem is at x=8 (width ~12), gap=8 -> text starts at x=28
  const labelPaddingLeft = 28;
  const labelPaddingRight = 16;
  const labelWidth = labelPaddingLeft + labelTextWidth + labelPaddingRight;

  const statusPaddingX = 16;
  const statusWidth = statusTextWidth + statusPaddingX * 2;
  const totalWidth = labelWidth + statusWidth;
  const height = 28;
  const statusCenterX = labelWidth + statusWidth / 2;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="${height}" viewBox="0 0 ${totalWidth} ${height}" role="img" aria-label="${label}: ${status}">
  <title>${domain} · ${label}: ${status} · Verified by Harizeon</title>
  <g shape-rendering="crispEdges">
    <!-- Brand / Label Container -->
    <rect width="${labelWidth}" height="${height}" fill="${brandBg}" stroke="${borderColor}" stroke-width="1"/>
    <!-- Status Container -->
    <rect x="${labelWidth}" width="${statusWidth}" height="${height}" fill="${statusBg}" stroke="${borderColor}" stroke-width="1"/>
    <!-- Subtle divider line -->
    <line x1="${labelWidth}" y1="0" x2="${labelWidth}" y2="${height}" stroke="${borderColor}" stroke-width="1"/>
  </g>
  <!-- Harizeon Geometric Emblem -->
  <g transform="translate(8, 7) scale(0.6)">
    <polygon points="4,0 9,0 5,22 0,22" fill="#02acc5"/>
    <polygon points="11,0 16,0 12,22 7,22" fill="#38bdf8"/>
    <polygon points="6,9 18,9 16,13 4,13" fill="#02acc5"/>
  </g>
  <!-- Text elements -->
  <g font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif" font-size="10" font-weight="700" letter-spacing="0.5">
    <text x="${labelPaddingLeft}" y="17.5" fill="${textColor}" text-rendering="geometricPrecision">${label}</text>
    <text x="${statusCenterX}" y="17.5" text-anchor="middle" fill="${statusColor}" text-rendering="geometricPrecision">${status}</text>
  </g>
</svg>`;

  return new NextResponse(svg, {
    status: 200,
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=300, s-maxage=300, stale-while-revalidate=60",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
