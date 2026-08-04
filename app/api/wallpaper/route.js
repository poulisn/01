import { ImageResponse } from "next/og";

export const runtime = "edge";

function hex(value, fallback) {
  const v = (value || fallback).replace("#", "").trim();
  return `#${v}`;
}

function parseDate(value) {
  if (!value) return null;
  const [y, m, d] = value.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(Date.UTC(y, m - 1, d));
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);

  const startParam = searchParams.get("start") || searchParams.get("start_date");
  const endParam = searchParams.get("end") || searchParams.get("goal_date");
  const name = searchParams.get("name") || "";
  const bg = hex(searchParams.get("bg"), "000000");
  const accent = hex(searchParams.get("accent"), "FFFFFF");
  const dim = hex(searchParams.get("dim"), "333333");
  const width = Math.min(3000, Math.max(200, parseInt(searchParams.get("width") || "1290", 10)));
  const height = Math.min(3000, Math.max(200, parseInt(searchParams.get("height") || "2796", 10)));
  const showLabel = (searchParams.get("label") || "on") !== "off";

  const start = parseDate(startParam);
  const end = parseDate(endParam);

  if (!start || !end) {
    return new Response("Missing or invalid dates. Use ?start=YYYY-MM-DD&end=YYYY-MM-DD", { status: 400 });
  }

  const MS_PER_DAY = 86400000;
  const now = new Date();
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

  const totalDays = Math.max(1, Math.round((end - start) / MS_PER_DAY));
  let elapsedDays = Math.round((today - start) / MS_PER_DAY);
  elapsedDays = Math.max(0, Math.min(elapsedDays, totalDays));
  const remainingDays = totalDays - elapsedDays;

  const paddingX = Math.round(width * 0.07);
  const paddingY = Math.round(height * 0.06);
  const nameHeight = name ? Math.round(height * 0.045) : 0;
  const labelHeight = showLabel ? Math.round(height * 0.06) : 0;
  const gapAllowance = Math.round(height * 0.02) * ((name ? 1 : 0) + (showLabel ? 1 : 0));

  const availWidth = width - paddingX * 2;
  const availHeight = height - paddingY * 2 - nameHeight - labelHeight - gapAllowance;

  const aspect = availWidth / availHeight;
  const cols = Math.max(1, Math.ceil(Math.sqrt(totalDays * aspect)));
  const rows = Math.max(1, Math.ceil(totalDays / cols));

  const cellW = availWidth / cols;
  const cellH = availHeight / rows;
  const cellSize = Math.min(cellW, cellH);
  const dotSize = Math.max(2, cellSize * 0.55);
  const gridWidth = cellSize * cols;

  const dots = [];
  for (let i = 0; i < totalDays; i++) {
    dots.push(i < elapsedDays);
  }

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", background: bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        {name ? (
          <div style={{ display: "flex", color: accent, fontSize: Math.round(nameHeight * 0.6), opacity: 0.85, marginBottom: Math.round(height * 0.02), letterSpacing: 1 }}>
            {name}
          </div>
        ) : null}
        <div style={{ display: "flex", flexWrap: "wrap", width: gridWidth }}>
          {dots.map((filled, i) => (
            <div key={i} style={{ width: cellSize, height: cellSize, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ width: dotSize, height: dotSize, borderRadius: dotSize, background: filled ? accent : dim }} />
            </div>
          ))}
        </div>
        {showLabel ? (
          <div style={{ display: "flex", color: accent, fontSize: Math.round(labelHeight * 0.55), fontWeight: 700, marginTop: Math.round(height * 0.02) }}>
            {remainingDays === 0 ? "Today" : `${remainingDays} days left`}
          </div>
        ) : null}
      </div>
    ),
    { width, height }
  );
}
