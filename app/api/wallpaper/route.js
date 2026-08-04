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

async function loadGoogleFont(family, weight, text) {
  const url = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(
    family
  )}:wght@${weight}&text=${encodeURIComponent(text)}`;
  const css = await (await fetch(url)).text();
  const match = css.match(
    /src: url\(([^)]+)\) format\('(opentype|truetype)'\)/
  );
  if (match) {
    const res = await fetch(match[1]);
    if (res.status === 200) return await res.arrayBuffer();
  }
  return null;
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);

  const startParam =
    searchParams.get("start") || searchParams.get("start_date");
  const endParam =
    searchParams.get("end") || searchParams.get("goal_date");
  const name = searchParams.get("name") || "";
  const bg = hex(searchParams.get("bg"), "000000");
  const accent = hex(searchParams.get("accent"), "E5533D");
  const dim = hex(searchParams.get("dim"), "262626");

  const width = Math.min(
    3000,
    Math.max(200, parseInt(searchParams.get("width") || "1290", 10))
  );
  const height = Math.min(
    3000,
    Math.max(200, parseInt(searchParams.get("height") || "2796", 10))
  );

  const showLabel = (searchParams.get("label") || "on") !== "off";
  const cols = Math.max(
    3,
    parseInt(searchParams.get("cols") || "15", 10)
  );
  const dotScale = Math.min(
    0.9,
    Math.max(0.1, parseFloat(searchParams.get("dotScale") || "0.4"))
  );
  const marginPct = Math.min(
    0.4,
    Math.max(0.02, parseFloat(searchParams.get("margin") || "0.18"))
  );

  // Vertical offset: fraction of image height to push content down from the top.
  // Overridable via ?offset=0.25 (0 = flush top, 0.5 = roughly centered).
  const offsetPct = Math.min(
    0.8,
    Math.max(0, parseFloat(searchParams.get("offset") || "0.28"))
  );
  const topOffset = Math.round(height * offsetPct);

  const start = parseDate(startParam);
  const end = parseDate(endParam);

  if (!start || !end) {
    return new Response(
      "Missing or invalid dates. Use ?start=YYYY-MM-DD&end=YYYY-MM-DD",
      { status: 400 }
    );
  }

  const MS_PER_DAY = 86400000;
  const now = new Date();
  const today = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  );

  const totalDays = Math.max(1, Math.round((end - start) / MS_PER_DAY));

  let elapsedDays = Math.round((today - start) / MS_PER_DAY);
  elapsedDays = Math.max(0, Math.min(elapsedDays, totalDays));

  const remainingDays = totalDays - elapsedDays;
  const percent = Math.round((elapsedDays / totalDays) * 100);

  const paddingX = Math.round(width * marginPct);
  const availWidth = width - paddingX * 2;
  const rows = Math.max(1, Math.ceil(totalDays / cols));

  const cellSize = availWidth / cols;
  const dotSize = Math.max(2, cellSize * dotScale);

  const gridWidth = cellSize * cols;
  const gridHeight = cellSize * rows;

  const nameFontSize = Math.round(width * 0.032);
  const labelFontSize = Math.round(width * 0.034);

  const dots = [];
  for (let i = 0; i < totalDays; i++) {
    dots.push(i < elapsedDays);
  }

  const labelText =
    remainingDays === 0 ? "Today" : `${remainingDays} days left`;

  let fonts = undefined;

  try {
    const sampleText =
      (name || "") + labelText + "% complete0123456789· Today";

    const [regular, medium] = await Promise.all([
      loadGoogleFont("Geist", 400, sampleText),
      loadGoogleFont("Geist", 600, sampleText),
    ]);

    if (regular) {
      fonts = [{ name: "Geist", data: regular, weight: 400, style: "normal" }];
      if (medium) {
        fonts.push({ name: "Geist", data: medium, weight: 600, style: "normal" });
      }
    }
  } catch (e) {
    fonts = undefined;
  }

  const fontFamily = fonts ? "Geist" : "-apple-system, sans-serif";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: bg,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          // "flex-start" anchors the block to the top; topOffset (padding)
          // is what actually pushes it down. Increase ?offset= to push
          // further down, decrease to bring it back up.
          justifyContent: "flex-start",
          paddingTop: topOffset,
          fontFamily,
        }}
      >
        {name ? (
          <div
            style={{
              display: "flex",
              color: accent,
              fontSize: nameFontSize,
              fontWeight: 600,
              opacity: 0.9,
              marginBottom: Math.round(height * 0.02),
              letterSpacing: 1,
            }}
          >
            {name}
          </div>
        ) : null}

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            width: gridWidth,
            height: gridHeight,
          }}
        >
          {dots.map((filled, i) => (
            <div
              key={i}
              style={{
                width: cellSize,
                height: cellSize,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  width: dotSize,
                  height: dotSize,
                  borderRadius: dotSize,
                  background: filled ? accent : dim,
                }}
              />
            </div>
          ))}
        </div>

        {showLabel ? (
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              marginTop: Math.round(height * 0.030),
              fontSize: labelFontSize,
              fontWeight: 600,
            }}
          >
            <span style={{ color: accent }}>{labelText}</span>
            <span style={{ color: "#8a8a8a", marginLeft: 10, marginRight: 10, fontWeight: 400 }}>
              ·
            </span>
            <span style={{ color: "#8a8a8a", fontWeight: 400 }}>
              {percent}% complete
            </span>
          </div>
        ) : null}
      </div>
    ),
    {
      width,
      height,
      fonts,
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    }
  );
}
