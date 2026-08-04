export default function Home() {
  const example =
    "/api/wallpaper?start=2025-11-11&end=2026-11-11&width=1290&height=2796&bg=000000&accent=FFFFFF";

  return (
    <main style={{ maxWidth: 640, margin: "0 auto", padding: "48px 24px", lineHeight: 1.5 }}>
      <h1 style={{ fontSize: 28, marginBottom: 8 }}>Goal Grid Wallpaper</h1>
      <p style={{ opacity: 0.8 }}>
        Generates a dot-grid countdown image between two dates. Point your
        automation at <code>/api/wallpaper</code> with query params.
      </p>
      <h2 style={{ fontSize: 18, marginTop: 32 }}>Example</h2>
      <p>
        <a href={example} style={{ color: "#8ab4ff", wordBreak: "break-all" }}>
          {example}
        </a>
      </p>
      <img
        src={example}
        alt="Example wallpaper"
        style={{ width: "100%", maxWidth: 300, marginTop: 16, borderRadius: 12, border: "1px solid #222" }}
      />
    </main>
  );
}
