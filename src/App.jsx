import { useState } from "react";

// ─── Color Math Utilities ────────────────────────────────────────────────────
function hexToHsl(hex) {
  let r = parseInt(hex.slice(1, 3), 16) / 255;
  let g = parseInt(hex.slice(3, 5), 16) / 255;
  let b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;
  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      default: h = ((r - g) / d + 4) / 6;
    }
  }
  return [h * 360, s * 100, l * 100];
}

function hslToHex(h, s, l) {
  h /= 360; s /= 100; l /= 100;
  let r, g, b;
  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  return `#${[r, g, b].map(x => Math.round(x * 255).toString(16).padStart(2, '0')).join('')}`;
}

function hexToRgb(hex) {
  return [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];
}

function luminance(hex) {
  return hexToRgb(hex).map(c => {
    c /= 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  }).reduce((acc, c, i) => acc + c * [0.2126, 0.7152, 0.0722][i], 0);
}

function contrastRatio(h1, h2) {
  const l1 = luminance(h1), l2 = luminance(h2);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

// ─── Kadence Logic ───────────────────────────────────────────────────────────
function accentComplement(h, s, l, harmony) {
  if (harmony === 'mono') return { h, s: Math.max(10, s - 20), l: Math.min(85, l + 25) };
  if (harmony === 'analogous') return { h: (h + 30) % 360, s, l };
  if (harmony === 'triadic') return { h: (h + 120) % 360, s, l };
  return { h: (h + 150) % 360, s, l };
}

function generateKadencePalette(hex, harmony, bgMode) {
  const [h, s, l] = hexToHsl(hex);
  const ns = Math.max(5, s * 0.15);
  const comp = accentComplement(h, s, l, harmony);
  return {
    accent:            { name: "Accent",            slug: "palette1",  hex },
    accentAlt:         { name: "Accent Alt",         slug: "palette2",  hex: hslToHex(h, s, Math.max(10, l - 18)) },
    accentComplement:  { name: "Accent Complement",  slug: "palette3",  hex: hslToHex(comp.h, comp.s, Math.min(88, comp.l + 10)) },
    strongestText:     { name: "Strongest Text",     slug: "palette4",  hex: hslToHex(h, ns, 10) },
    strongText:        { name: "Strong Text",        slug: "palette5",  hex: hslToHex(h, ns, 18) },
    mediumText:        { name: "Medium Text",        slug: "palette6",  hex: hslToHex(h, ns, 33) },
    subtleText:        { name: "Subtle Text",        slug: "palette7",  hex: hslToHex(h, ns, 48) },
    subtleBg:          { name: "Subtle BG",          slug: "palette8",  hex: bgMode === 'neutral' ? '#edf2f7' : bgMode === 'warm' ? '#f5f0eb' : hslToHex(h, Math.max(5, s * 0.12), 93) },
    lighterBg:         { name: "Lighter BG",         slug: "palette9",  hex: bgMode === 'neutral' ? '#f7fafc' : bgMode === 'warm' ? '#faf7f4' : hslToHex(h, Math.max(3, s * 0.08), 96.5) },
    white:             { name: "White",              slug: "palette10", hex: "#ffffff" },
    success:           { name: "Success",            slug: "palette11", hex: "#16a34a" },
    warning:           { name: "Warning",            slug: "palette12", hex: "#d97706" },
    error:             { name: "Error",              slug: "palette13", hex: "#dc2626" },
    info:              { name: "Info",               slug: "palette14", hex: hslToHex(210, 80, 45) },
  };
}

const kadenceGroups = [
  { label: "Accents",          keys: ["accent", "accentAlt", "accentComplement"] },
  { label: "Contrast Scale",   keys: ["strongestText", "strongText", "mediumText", "subtleText"] },
  { label: "Base Backgrounds", keys: ["subtleBg", "lighterBg", "white"] },
  { label: "Notices",          keys: ["success", "warning", "error", "info"] },
];

// ─── Ollie Logic ─────────────────────────────────────────────────────────────
function generateOlliePalette(brandHex, altHex, theme = "light") {
  const [bh, bs, bl] = hexToHsl(brandHex);
  const [ah, as_, al] = hexToHsl(altHex);

  // Brand 4 — same for both themes
  // Brand Accent: clearly-tinted light version of brand (~85-93% L, ~50-65% S)
  const brandAccent    = hslToHex(bh, Math.max(Math.min(bs * 0.75, 65), 38), Math.min(bl + (100 - bl) * 0.75, 93));
  // Brand Alt Accent: dark text for use on the alt background (~22-28% L)
  const brandAltAccent = hslToHex(ah, Math.min(as_ * 0.80, 60), Math.max(al * 0.28, 18));

  // Neutral 7 — diverge by theme
  let contrast, contrastAccent, base, baseAccent, tint, borderBase, borderContrast;

  if (theme === "light") {
    contrast       = hslToHex(bh, Math.min(bs * 0.15, 12), 10);   // near-black text
    contrastAccent = hslToHex(bh, Math.min(bs * 0.25, 22), 88);   // muted on dark sections
    base           = "#FFFFFF";
    baseAccent     = hslToHex(bh, Math.min(bs * 0.55, 45), Math.max(bl * 0.6, 35));
    tint           = hslToHex(bh, Math.min(bs * 0.18, 14), 97);   // subtle tinted bg
    borderBase     = hslToHex(bh, Math.min(bs * 0.22, 18), 88);   // border on light
    borderContrast = hslToHex(bh, Math.min(bs * 0.18, 18), 28);   // border on dark
  } else {
    contrast       = hslToHex(bh, Math.min(bs * 0.10,  8), 93);   // near-white primary text
    contrastAccent = hslToHex(bh, Math.min(bs * 0.15, 12), 62);   // muted text on dark sections
    base           = hslToHex(bh, Math.min(bs * 0.18, 15),  8);   // near-black page bg
    baseAccent     = hslToHex(bh, Math.min(bs * 0.28, 22), 68);   // secondary text — light enough on dark bg
    tint           = hslToHex(bh, Math.min(bs * 0.20, 16), 14);   // raised dark section bg
    borderBase     = hslToHex(bh, Math.min(bs * 0.20, 16), 20);   // border on dark surfaces
    borderContrast = hslToHex(bh, Math.min(bs * 0.14, 12), 58);   // border on light sections
  }

  return [
    { name: "Brand",              slug: "primary",           hex: brandHex,      purpose: "Buttons, CTAs, key UI elements" },
    { name: "Brand Accent",       slug: "primary-accent",    hex: brandAccent,   purpose: "Text on Brand backgrounds" },
    { name: "Brand Alt",          slug: "primary-alt",       hex: altHex,        purpose: "Secondary brand, cards, sections" },
    { name: "Brand Alt Accent",   slug: "primary-alt-accent",hex: brandAltAccent,purpose: "Text on Brand Alt backgrounds" },
    { name: "Contrast",           slug: "main",              hex: contrast,      purpose: theme === "dark" ? "Primary text (light)" : "Default text color" },
    { name: "Contrast Accent",    slug: "main-accent",       hex: contrastAccent,purpose: theme === "dark" ? "Muted text on dark bg" : "Muted text on dark sections" },
    { name: "Base",               slug: "base",              hex: base,          purpose: theme === "dark" ? "Page background (dark)" : "Default page background" },
    { name: "Base Accent",        slug: "secondary",         hex: baseAccent,    purpose: "Secondary text / subheadings" },
    { name: "Tint",               slug: "tertiary",          hex: tint,          purpose: theme === "dark" ? "Raised section background" : "Subtle section backgrounds" },
    { name: "Border Base",        slug: "border-light",      hex: borderBase,    purpose: theme === "dark" ? "Borders on dark bg" : "Borders on light backgrounds" },
    { name: "Border Contrast",    slug: "border-dark",       hex: borderContrast,purpose: theme === "dark" ? "Borders on light sections" : "Borders on dark backgrounds" },
  ];
}

// ─── Ollie Site Mockup ────────────────────────────────────────────────────────
function OllieSiteMockup({ palette, theme }) {
  const c = Object.fromEntries(palette.map(p => [p.slug, p.hex]));
  const isDark = theme === "dark";
  const cardBg = isDark ? c["tertiary"] : c["base"];
  const cardBorder = isDark ? c["border-light"] : c["border-light"];

  return (
    <div style={{ borderRadius: "14px", overflow: "hidden", border: `1px solid ${isDark ? c["border-light"] : "#e8e4ff"}`, boxShadow: "0 4px 24px rgba(0,0,0,0.12)", fontFamily: "'DM Sans', sans-serif" }}>
      {/* Nav */}
      <div style={{ background: c["base"], borderBottom: `1px solid ${c["border-light"]}`, padding: "12px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontWeight: 700, color: c["main"], fontSize: "13px", letterSpacing: "-0.02em" }}>YourBrand</span>
        <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
          {["About", "Work", "Blog"].map(l => (
            <span key={l} style={{ fontSize: "11px", color: c["secondary"], cursor: "pointer" }}>{l}</span>
          ))}
          <span style={{ fontSize: "11px", color: "#fff", background: c["primary"], padding: "5px 14px", borderRadius: "20px", cursor: "pointer", fontWeight: 600 }}>Hire Us</span>
        </div>
      </div>

      {/* Hero */}
      <div style={{ background: c["primary"], padding: "36px 24px", textAlign: "center" }}>
        <div style={{ display: "inline-block", fontSize: "9px", fontWeight: 700, color: c["primary-accent"], background: `${c["primary-accent"]}22`, border: `1px solid ${c["primary-accent"]}44`, borderRadius: "20px", padding: "3px 10px", marginBottom: "12px", letterSpacing: "0.08em", textTransform: "uppercase" }}>
          Award-winning studio
        </div>
        <div style={{ fontSize: "22px", fontWeight: 700, color: c["primary-accent"], lineHeight: 1.2, marginBottom: "10px" }}>
          Build something<br />truly great
        </div>
        <div style={{ fontSize: "11px", color: `${c["primary-accent"]}bb`, marginBottom: "18px", maxWidth: "260px", margin: "0 auto 18px", lineHeight: 1.6 }}>
          We help brands grow with strategy, design, and results-driven execution.
        </div>
        <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
          <button style={{ background: c["primary-accent"], color: c["primary"], padding: "8px 18px", borderRadius: "20px", border: "none", fontWeight: 700, fontSize: "11px", cursor: "pointer" }}>Get Started</button>
          <button style={{ background: "transparent", color: c["primary-accent"], padding: "8px 18px", borderRadius: "20px", border: `1.5px solid ${c["primary-accent"]}55`, fontWeight: 600, fontSize: "11px", cursor: "pointer" }}>See Our Work</button>
        </div>
      </div>

      {/* Cards */}
      <div style={{ background: c["tertiary"], padding: "20px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
        {[["Strategy", "🎯"], ["Design", "✦"], ["Growth", "📈"]].map(([title, icon]) => (
          <div key={title} style={{ background: cardBg, borderRadius: "10px", padding: "14px", border: `1px solid ${cardBorder}` }}>
            <div style={{ fontSize: "16px", marginBottom: "8px" }}>{icon}</div>
            <div style={{ fontSize: "11px", fontWeight: 700, color: c["main"], marginBottom: "4px" }}>{title}</div>
            <div style={{ fontSize: "9px", color: c["secondary"], lineHeight: 1.6 }}>A short description of this service that you offer to clients.</div>
          </div>
        ))}
      </div>

      {/* Alt section */}
      <div style={{ background: c["primary-alt"], padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: "13px", fontWeight: 700, color: c["primary-alt-accent"], marginBottom: "2px" }}>Ready to start?</div>
          <div style={{ fontSize: "10px", color: `${c["primary-alt-accent"]}99` }}>Let's talk about your project today.</div>
        </div>
        <button style={{ background: c["primary"], color: "#fff", padding: "7px 16px", borderRadius: "20px", border: "none", fontWeight: 700, fontSize: "11px", cursor: "pointer" }}>Contact Us</button>
      </div>

      {/* Footer */}
      <div style={{ background: c["base"], borderTop: `1px solid ${c["border-light"]}`, padding: "12px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: "10px", color: c["secondary"] }}>YourBrand © 2025</span>
        <div style={{ display: "flex", gap: "12px" }}>
          {["Privacy", "Terms"].map(l => <span key={l} style={{ fontSize: "10px", color: c["secondary"], cursor: "pointer" }}>{l}</span>)}
        </div>
      </div>
    </div>
  );
}

function deriveAltColor(brandHex) {
  const [h, s] = hexToHsl(brandHex);
  // Alt is always a light (~87% L), moderately-saturated tint with a slight hue shift
  return hslToHex((h + 30) % 360, Math.min(s * 0.65, 60), 87);
}

const OLLIE_PRESETS = [
  { label: "Default", brand: "#5344F4", alt: "#DEC9FF" },
  { label: "Agency",  brand: "#495148", alt: "#CEF453" },
  { label: "Creator", brand: "#5A20FF", alt: "#E3D0FF" },
  { label: "Startup", brand: "#454DFF", alt: "#B1C2FF" },
  { label: "Studio",  brand: "#FF50A9", alt: "#FFCFD7" },
];

// ─── Shared: WCAG badge ──────────────────────────────────────────────────────
function wcagLabel(ratio) {
  if (ratio >= 7)   return { label: "AAA",      color: "#2e7d32", bg: "#e8f5e9" };
  if (ratio >= 4.5) return { label: "AA ✓",     color: "#1565c0", bg: "#e3f2fd" };
  if (ratio >= 3)   return { label: "AA Large", color: "#f57f17", bg: "#fff8e1" };
  return                   { label: "Fail",     color: "#c62828", bg: "#ffebee" };
}

// ─── Kadence Swatch ──────────────────────────────────────────────────────────
function KadenceSwatch({ item }) {
  const [copied, setCopied] = useState(false);
  const ratio = contrastRatio(item.hex, "#ffffff");
  const badge = wcagLabel(ratio);
  const copy = () => {
    navigator.clipboard.writeText(item.hex).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };
  return (
    <div
      onClick={copy}
      style={{ cursor: "pointer", borderRadius: "10px", overflow: "hidden", border: "1px solid rgba(0,0,0,0.08)", background: "#fff", transition: "transform 0.12s, box-shadow 0.12s" }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 6px 18px rgba(0,0,0,0.10)"; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}
    >
      <div style={{ background: item.hex, height: "52px", position: "relative" }}>
        {copied && (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.35)", color: "#fff", fontSize: "11px", fontWeight: 600 }}>
            COPIED
          </div>
        )}
      </div>
      <div style={{ padding: "7px 8px 8px" }}>
        <div style={{ fontSize: "11px", fontWeight: 600, color: "#1a1a1a", marginBottom: "2px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.name}</div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "4px" }}>
          <span style={{ fontSize: "10px", color: "#666", fontFamily: "monospace" }}>{item.hex.toUpperCase()}</span>
          <span style={{ fontSize: "9px", fontWeight: 700, color: badge.color, background: badge.bg, borderRadius: "4px", padding: "1px 4px" }}>{badge.label}</span>
        </div>
        <div style={{ fontSize: "9px", color: "#bbb", fontFamily: "monospace", marginTop: "1px" }}>{item.slug}</div>
      </div>
    </div>
  );
}

// ─── Ollie ColorSwatch ───────────────────────────────────────────────────────
function OllieColorSwatch({ color, size = "md" }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(color.hex);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  const textColor = luminance(color.hex) > 0.35 ? "#111" : "#fff";
  const isSmall = size === "sm";
  return (
    <div onClick={copy} style={{ cursor: "pointer", userSelect: "none" }}>
      <div
        style={{ background: color.hex, borderRadius: isSmall ? "8px" : "12px", height: isSmall ? "52px" : "72px", display: "flex", alignItems: "flex-end", padding: isSmall ? "6px 8px" : "8px 12px", marginBottom: "8px", transition: "transform 0.15s, box-shadow 0.15s", boxShadow: "0 1px 4px rgba(0,0,0,0.08)", position: "relative", overflow: "hidden" }}
        onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 6px 18px rgba(0,0,0,0.14)"; }}
        onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.08)"; }}
      >
        <span style={{ fontSize: "10px", fontFamily: "'JetBrains Mono', monospace", color: textColor, opacity: 0.85, letterSpacing: "0.04em" }}>
          {copied ? "Copied!" : color.hex.toUpperCase()}
        </span>
      </div>
      <div style={{ paddingLeft: "2px" }}>
        <div style={{ fontSize: "12px", fontWeight: 600, color: "#1a1a2e", lineHeight: 1.3, fontFamily: "'DM Sans', sans-serif" }}>{color.name}</div>
        {!isSmall && <div style={{ fontSize: "10px", color: "#8888a8", marginTop: "2px", fontFamily: "'DM Sans', sans-serif" }}>{color.purpose}</div>}
        <div style={{ fontSize: "10px", color: "#b0b0cc", marginTop: "1px", fontFamily: "'JetBrains Mono', monospace" }}>{color.slug}</div>
      </div>
    </div>
  );
}

function ContrastBadge({ bg, fg, label }) {
  const ratio = contrastRatio(bg, fg);
  const pass = ratio >= 4.5;
  const passLarge = ratio >= 3;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
      <div style={{ width: 18, height: 18, borderRadius: 4, background: bg, border: "1px solid #e0e0ef" }} />
      <div style={{ width: 18, height: 18, borderRadius: 4, background: fg, border: "1px solid #e0e0ef" }} />
      <span style={{ fontSize: 11, color: "#555", fontFamily: "'DM Sans', sans-serif" }}>{label}</span>
      <span style={{ fontSize: 10, padding: "1px 7px", borderRadius: 20, background: pass ? "#e8f5e9" : passLarge ? "#fff8e1" : "#ffebee", color: pass ? "#2e7d32" : passLarge ? "#f57f17" : "#c62828", fontWeight: 700, fontFamily: "'DM Sans', sans-serif" }}>
        {ratio.toFixed(1)}:1 {pass ? "AA ✓" : passLarge ? "AA Large" : "Fail"}
      </span>
    </div>
  );
}

// ─── Main App ────────────────────────────────────────────────────────────────
export default function ColorPaletteGenerator() {
  const [mode, setMode] = useState("kadence");

  // Shared seed color
  const [seedHex, setSeedHex] = useState("#5344F4");
  const [seedInput, setSeedInput] = useState("#5344F4");

  // Kadence-only state
  const [harmony, setHarmony] = useState("mono");
  const [bgMode, setBgMode] = useState("neutral");
  const [kadCopyMsg, setKadCopyMsg] = useState("");

  // Ollie-only state
  const [altHex, setAltHex] = useState(deriveAltColor("#5344F4"));
  const [altLocked, setAltLocked] = useState(false);
  const [ollieCopied, setOllieCopied] = useState(false);
  const [ollieTheme, setOllieTheme] = useState("light");

  // Shared color change handler
  const handleSeedChange = (hex) => {
    setSeedHex(hex);
    setSeedInput(hex);
    if (!altLocked) setAltHex(deriveAltColor(hex));
  };

  // ── Kadence derived ──
  const kadPaletteRaw = generateKadencePalette(seedHex, harmony, bgMode);
  const kadAllItems = kadenceGroups.flatMap(g => g.keys.map(k => kadPaletteRaw[k]));

  const handleKadInput = (val) => {
    setSeedInput(val);
    if (/^#[0-9a-fA-F]{6}$/.test(val)) handleSeedChange(val.toLowerCase());
  };

  const kadExportJSON = () => {
    const out = Object.fromEntries(Object.entries(kadPaletteRaw).map(([k, v]) => [k, v.hex]));
    const blob = new Blob([JSON.stringify(out, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "kadence-palette.json";
    a.click();
  };

  const kadCopyCSS = () => {
    const vars = Object.values(kadPaletteRaw).map(v => `  --wp--preset--color--${v.slug}: ${v.hex};`).join("\n");
    navigator.clipboard.writeText(`:root {\n${vars}\n}`).catch(() => {});
    setKadCopyMsg("Copied!");
    setTimeout(() => setKadCopyMsg(""), 2000);
  };

  // ── Ollie derived ──
  const olliePalette = generateOlliePalette(seedHex, altHex, ollieTheme);
  const ollieBySlug = Object.fromEntries(olliePalette.map(c => [c.slug, c.hex]));
  const brand4 = olliePalette.slice(0, 4);
  const neutral7 = olliePalette.slice(4);

  const applyPreset = (p) => {
    handleSeedChange(p.brand);
    setAltHex(p.alt);
    setAltLocked(true);
  };

  const ollieExportJSON = () => {
    const out = { palette: olliePalette.map(c => ({ name: c.name, slug: c.slug, color: c.hex })) };
    const blob = new Blob([JSON.stringify(out, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "ollie-palette.json";
    a.click();
  };

  const ollieCopyCSS = () => {
    const vars = olliePalette.map(c => `  --wp--preset--color--${c.slug}: ${c.hex};`).join("\n");
    navigator.clipboard.writeText(`:root {\n${vars}\n}`);
    setOllieCopied(true);
    setTimeout(() => setOllieCopied(false), 2000);
  };

  // ── Shared styles ──
  const pillStyle = (active, accentColor) => ({
    fontSize: "12px", padding: "5px 12px", borderRadius: "20px",
    border: `1.5px solid ${active ? accentColor : "rgba(0,0,0,0.15)"}`,
    cursor: "pointer",
    background: active ? accentColor + "18" : "transparent",
    color: active ? accentColor : "#555",
    fontWeight: active ? 600 : 400,
    transition: "all 0.12s",
    fontFamily: "'DM Sans', sans-serif",
  });

  const tabStyle = (active) => ({
    fontSize: "13px", fontWeight: active ? 700 : 500,
    padding: "7px 20px", borderRadius: "8px", border: "none",
    cursor: "pointer",
    background: active ? "#1a1a2e" : "transparent",
    color: active ? "#fff" : "#666",
    transition: "all 0.15s",
  });

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg,#f8f7ff 0%,#f3f0ff 40%,#f8f4ff 100%)", fontFamily: "'DM Sans', sans-serif", padding: 0 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Serif+Display&family=JetBrains+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; }
        input[type=color] { -webkit-appearance:none; appearance:none; border:none; padding:0; cursor:pointer; }
        input[type=color]::-webkit-color-swatch-wrapper { padding:0; }
        input[type=color]::-webkit-color-swatch { border:none; border-radius:8px; }
      `}</style>

      {/* ── Sticky Header ── */}
      <div style={{ background: "rgba(255,255,255,0.8)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(200,190,255,0.35)", padding: "16px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100 }}>
        <div>
          <span style={{ fontSize: "18px", fontWeight: 700, color: "#1a1a2e", fontFamily: "'DM Serif Display', serif", letterSpacing: "-0.02em" }}>WP Palette Generator</span>
          <div style={{ fontSize: "11px", color: "#8888aa", marginTop: "2px" }}>Kadence & Ollie theme palette builder</div>
        </div>
        <div style={{ display: "flex", gap: "4px", background: "rgba(0,0,0,0.06)", borderRadius: "10px", padding: "4px" }}>
          <button style={tabStyle(mode === "kadence")} onClick={() => setMode("kadence")}>Kadence</button>
          <button style={tabStyle(mode === "ollie")}   onClick={() => setMode("ollie")}>Ollie</button>
        </div>
      </div>

      {/* ══════════════ KADENCE VIEW ══════════════ */}
      {mode === "kadence" && (
        <div style={{ maxWidth: "900px", margin: "0 auto", padding: "32px 24px 64px" }}>

          {/* Controls card */}
          <div style={{ background: "#fff", borderRadius: "16px", padding: "24px 28px", marginBottom: "24px", boxShadow: "0 2px 24px rgba(0,0,0,0.06)", border: "1px solid rgba(0,0,0,0.07)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap", marginBottom: "20px" }}>
              <label style={{ position: "relative", cursor: "pointer" }}>
                <div style={{ width: 48, height: 48, borderRadius: "10px", background: seedHex, border: "2px solid rgba(0,0,0,0.1)", boxShadow: `0 0 0 4px ${seedHex}30` }} />
                <input type="color" value={seedHex} onChange={e => handleSeedChange(e.target.value)}
                  style={{ opacity: 0, position: "absolute", inset: 0, width: "100%", height: "100%", cursor: "pointer" }} />
              </label>
              <div>
                <div style={{ fontSize: "11px", color: "#aaa", marginBottom: "4px", fontWeight: 600, letterSpacing: "0.06em" }}>SEED COLOR</div>
                <input value={seedInput} onChange={e => handleKadInput(e.target.value)}
                  style={{ fontSize: "13px", fontWeight: 600, fontFamily: "'JetBrains Mono', monospace", padding: "7px 10px", borderRadius: "8px", border: "1.5px solid #e0e0ef", width: "108px", color: "#111", background: "#fafafa" }} />
              </div>
              <div style={{ marginLeft: "auto", display: "flex", gap: "8px" }}>
                <button onClick={kadCopyCSS} style={{ padding: "8px 16px", borderRadius: "8px", border: "1.5px solid #ddd", background: kadCopyMsg ? "#1a1a2e" : "#fff", color: kadCopyMsg ? "#fff" : "#333", fontWeight: 600, fontSize: "12px", cursor: "pointer", transition: "all 0.2s" }}>
                  {kadCopyMsg || "Copy CSS Vars"}
                </button>
                <button onClick={kadExportJSON} style={{ padding: "8px 16px", borderRadius: "8px", border: "none", background: seedHex, color: "#fff", fontWeight: 600, fontSize: "12px", cursor: "pointer" }}>
                  Export JSON
                </button>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <div style={{ fontSize: "11px", color: "#aaa", fontWeight: 600, marginBottom: "6px", letterSpacing: "0.06em" }}>ACCENT HARMONY</div>
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                  {[["mono", "Monochromatic"], ["analogous", "Analogous"], ["triadic", "Triadic"], ["split", "Split Complement"]].map(([val, label]) => (
                    <button key={val} style={pillStyle(harmony === val, seedHex)} onClick={() => setHarmony(val)}>{label}</button>
                  ))}
                </div>
              </div>
              <div>
                <div style={{ fontSize: "11px", color: "#aaa", fontWeight: 600, marginBottom: "6px", letterSpacing: "0.06em" }}>BACKGROUNDS</div>
                <div style={{ display: "flex", gap: "6px" }}>
                  {[["neutral", "Neutral (cool gray)"], ["warm", "Neutral (warm gray)"], ["tinted", "Tinted (hue-derived)"]].map(([val, label]) => (
                    <button key={val} style={pillStyle(bgMode === val, seedHex)} onClick={() => setBgMode(val)}>{label}</button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Palette strip */}
          <div style={{ display: "flex", height: "40px", borderRadius: "10px", overflow: "hidden", marginBottom: "24px", boxShadow: "0 2px 10px rgba(0,0,0,0.10)" }}>
            {kadAllItems.map(item => (
              <div key={item.slug} style={{ flex: 1, background: item.hex }} title={`${item.name}: ${item.hex}`} />
            ))}
          </div>

          {/* Swatch groups */}
          {kadenceGroups.map(group => (
            <div key={group.label} style={{ marginBottom: "24px" }}>
              <div style={{ fontSize: "11px", fontWeight: 700, color: "#888", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "10px" }}>{group.label}</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px,1fr))", gap: "10px" }}>
                {group.keys.map(k => <KadenceSwatch key={k} item={kadPaletteRaw[k]} />)}
              </div>
            </div>
          ))}

          {/* CSS preview */}
          <div style={{ background: "#1a1a2e", borderRadius: "16px", padding: "22px 28px", boxShadow: "0 2px 24px rgba(0,0,0,0.15)", marginTop: "8px" }}>
            <div style={{ fontSize: "13px", fontWeight: 700, color: "#8888cc", letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: "14px" }}>CSS Variables</div>
            <pre style={{ margin: 0, fontSize: "11px", fontFamily: "'JetBrains Mono', monospace", color: "#c8c8ef", lineHeight: 1.8, overflowX: "auto" }}>
              <span style={{ color: "#7c7cff" }}>:root</span>{" {"}{"\n"}
              {Object.values(kadPaletteRaw).map(v => (
                <span key={v.slug}>
                  {"  "}<span style={{ color: "#f0c0ff" }}>--wp--preset--color--{v.slug}</span>{": "}
                  <span style={{ color: "#88ffcc" }}>{v.hex}</span>{";\n"}
                </span>
              ))}
              {"}"}
            </pre>
          </div>
        </div>
      )}

      {/* ══════════════ OLLIE VIEW ══════════════ */}
      {mode === "ollie" && (
        <div style={{ maxWidth: "960px", margin: "0 auto", padding: "32px 24px 64px" }}>

          {/* Controls card */}
          <div style={{ background: "white", borderRadius: "16px", padding: "24px 28px", marginBottom: "28px", boxShadow: "0 2px 24px rgba(83,68,244,0.07)", border: "1px solid rgba(200,190,255,0.3)" }}>
            <div style={{ display: "flex", gap: "32px", flexWrap: "wrap", alignItems: "flex-start" }}>

              {/* Brand color */}
              <div>
                <label style={{ fontSize: "11px", fontWeight: 600, color: "#8888aa", letterSpacing: "0.08em", textTransform: "uppercase", display: "block", marginBottom: "8px" }}>Brand Color</label>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div style={{ width: 44, height: 44, borderRadius: "10px", overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.12)", position: "relative" }}>
                    <input type="color" value={seedHex} onChange={e => handleSeedChange(e.target.value)}
                      style={{ width: "200%", height: "200%", position: "absolute", top: "-25%", left: "-25%", cursor: "pointer" }} />
                  </div>
                  <input type="text" value={seedInput}
                    onChange={e => { if (/^#[0-9a-fA-F]{0,6}$/.test(e.target.value)) handleSeedChange(e.target.value.length === 7 ? e.target.value : seedHex); setSeedInput(e.target.value); }}
                    style={{ width: "92px", fontSize: "13px", fontFamily: "'JetBrains Mono', monospace", padding: "8px 10px", borderRadius: "8px", border: "1.5px solid #e8e4ff", color: "#1a1a2e", background: "#faf9ff" }} />
                </div>
              </div>

              {/* Alt color */}
              <div>
                <label style={{ fontSize: "11px", fontWeight: 600, color: "#8888aa", letterSpacing: "0.08em", textTransform: "uppercase", display: "block", marginBottom: "8px" }}>
                  Brand Alt Color
                  <span onClick={() => setAltLocked(!altLocked)} style={{ marginLeft: 8, cursor: "pointer", fontSize: "10px", padding: "1px 7px", borderRadius: 20, background: altLocked ? "#e8e4ff" : "#f0f0f0", color: altLocked ? "#5344F4" : "#999" }}>
                    {altLocked ? "🔒 Locked" : "🔓 Auto"}
                  </span>
                </label>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div style={{ width: 44, height: 44, borderRadius: "10px", overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.12)", position: "relative" }}>
                    <input type="color" value={altHex} onChange={e => { setAltHex(e.target.value); setAltLocked(true); }}
                      style={{ width: "200%", height: "200%", position: "absolute", top: "-25%", left: "-25%", cursor: "pointer" }} />
                  </div>
                  <input type="text" value={altHex}
                    onChange={e => { if (/^#[0-9a-fA-F]{0,6}$/.test(e.target.value) && e.target.value.length === 7) { setAltHex(e.target.value); setAltLocked(true); } }}
                    style={{ width: "92px", fontSize: "13px", fontFamily: "'JetBrains Mono', monospace", padding: "8px 10px", borderRadius: "8px", border: "1.5px solid #e8e4ff", color: "#1a1a2e", background: "#faf9ff" }} />
                </div>
              </div>

              {/* Presets */}
              <div style={{ marginLeft: "auto" }}>
                <label style={{ fontSize: "11px", fontWeight: 600, color: "#8888aa", letterSpacing: "0.08em", textTransform: "uppercase", display: "block", marginBottom: "8px" }}>Ollie Presets</label>
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                  {OLLIE_PRESETS.map(p => (
                    <button key={p.label} onClick={() => applyPreset(p)} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "6px 12px", borderRadius: "20px", border: seedHex.toLowerCase() === p.brand.toLowerCase() ? `2px solid ${p.brand}` : "1.5px solid #e8e4ff", background: seedHex.toLowerCase() === p.brand.toLowerCase() ? `${p.brand}15` : "white", cursor: "pointer", fontSize: "12px", fontWeight: 500, color: "#333", fontFamily: "'DM Sans', sans-serif" }}>
                      <div style={{ width: 12, height: 12, borderRadius: "50%", background: p.brand }} />
                      <div style={{ width: 12, height: 12, borderRadius: "50%", background: p.alt, marginLeft: -6, border: "1.5px solid white" }} />
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Theme toggle */}
            <div style={{ marginTop: "20px", paddingTop: "20px", borderTop: "1px solid rgba(200,190,255,0.3)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: "11px", fontWeight: 600, color: "#8888aa", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "8px" }}>Theme Mode</div>
                <div style={{ display: "flex", gap: "4px", background: "rgba(0,0,0,0.06)", borderRadius: "10px", padding: "4px", width: "fit-content" }}>
                  {[["light", "☀️ Light"], ["dark", "🌙 Dark"]].map(([val, label]) => (
                    <button key={val} onClick={() => setOllieTheme(val)} style={{ fontSize: "12px", fontWeight: ollieTheme === val ? 700 : 500, padding: "6px 16px", borderRadius: "7px", border: "none", cursor: "pointer", background: ollieTheme === val ? "#1a1a2e" : "transparent", color: ollieTheme === val ? "#fff" : "#666", transition: "all 0.15s", fontFamily: "'DM Sans', sans-serif" }}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: "flex", gap: "8px" }}>
                <button onClick={ollieCopyCSS} style={{ padding: "8px 16px", borderRadius: "8px", border: "1.5px solid #ddd8ff", background: ollieCopied ? "#5344F4" : "white", color: ollieCopied ? "white" : "#5344F4", fontWeight: 600, fontSize: "12px", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", transition: "all 0.2s" }}>
                  {ollieCopied ? "Copied!" : "Copy CSS Vars"}
                </button>
                <button onClick={ollieExportJSON} style={{ padding: "8px 16px", borderRadius: "8px", border: "none", background: seedHex, color: luminance(seedHex) > 0.35 ? "#111" : "#fff", fontWeight: 600, fontSize: "12px", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
                  Export JSON
                </button>
              </div>
            </div>
          </div>

          {/* Site mockup preview */}
          <div style={{ marginBottom: "28px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: ollieTheme === "dark" ? "#555" : seedHex }} />
              <span style={{ fontSize: "13px", fontWeight: 700, color: "#1a1a2e", letterSpacing: "0.04em", textTransform: "uppercase" }}>Site Preview</span>
              <span style={{ fontSize: "11px", color: "#aaa" }}>{ollieTheme === "dark" ? "Dark theme" : "Light theme"} · how your palette looks in context</span>
            </div>
            <OllieSiteMockup palette={olliePalette} theme={ollieTheme} />
          </div>

          {/* Brand colors */}
          <div style={{ marginBottom: "28px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: seedHex }} />
              <span style={{ fontSize: "13px", fontWeight: 700, color: "#1a1a2e", letterSpacing: "0.04em", textTransform: "uppercase" }}>Brand Colors</span>
              <span style={{ fontSize: "11px", color: "#aaa" }}>4 slots · Buttons, CTAs, identity elements</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "16px" }}>
              {brand4.map(c => <OllieColorSwatch key={c.slug} color={c} />)}
            </div>
          </div>

          {/* Neutral colors */}
          <div style={{ marginBottom: "28px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#888" }} />
              <span style={{ fontSize: "13px", fontWeight: 700, color: "#1a1a2e", letterSpacing: "0.04em", textTransform: "uppercase" }}>Neutral Colors</span>
              <span style={{ fontSize: "11px", color: "#aaa" }}>7 slots · Text, backgrounds, borders, UI</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "16px" }}>
              {neutral7.map(c => <OllieColorSwatch key={c.slug} color={c} size="sm" />)}
            </div>
          </div>

          {/* Palette strip */}
          <div style={{ marginBottom: "28px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: seedHex }} />
              <span style={{ fontSize: "13px", fontWeight: 700, color: "#1a1a2e", letterSpacing: "0.04em", textTransform: "uppercase" }}>Palette Strip</span>
            </div>
            <div style={{ display: "flex", borderRadius: "12px", overflow: "hidden", height: "48px", boxShadow: "0 2px 16px rgba(0,0,0,0.08)" }}>
              {olliePalette.map(c => <div key={c.slug} style={{ flex: 1, background: c.hex }} title={`${c.name}: ${c.hex}`} />)}
            </div>
            <div style={{ display: "flex", marginTop: "4px" }}>
              {olliePalette.map(c => (
                <div key={c.slug} style={{ flex: 1, textAlign: "center", fontSize: "8px", color: "#aaa", fontFamily: "'JetBrains Mono', monospace", overflow: "hidden" }}>
                  {c.name.split(" ")[0]}
                </div>
              ))}
            </div>
          </div>

          {/* Contrast checker */}
          <div style={{ background: "white", borderRadius: "16px", padding: "22px 28px", boxShadow: "0 2px 24px rgba(83,68,244,0.07)", border: "1px solid rgba(200,190,255,0.3)", marginBottom: "28px" }}>
            <div style={{ fontSize: "13px", fontWeight: 700, color: "#1a1a2e", letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: "14px" }}>Contrast Check</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 24px" }}>
              <ContrastBadge bg={ollieBySlug["primary"]}     fg={ollieBySlug["primary-accent"]}     label="Brand → Brand Accent" />
              <ContrastBadge bg={ollieBySlug["primary"]}     fg={ollieBySlug["base"]}               label="Brand → Base (white)" />
              <ContrastBadge bg={ollieBySlug["primary-alt"]} fg={ollieBySlug["primary-alt-accent"]} label="Brand Alt → Alt Accent" />
              <ContrastBadge bg={ollieBySlug["main"]}        fg={ollieBySlug["base"]}               label="Contrast → Base" />
              <ContrastBadge bg={ollieBySlug["tertiary"]}    fg={ollieBySlug["main"]}               label="Tint → Contrast" />
              <ContrastBadge bg={ollieBySlug["main"]}        fg={ollieBySlug["main-accent"]}        label="Contrast → Contrast Accent" />
            </div>
          </div>

          {/* CSS variables preview */}
          <div style={{ background: "#1a1a2e", borderRadius: "16px", padding: "22px 28px", boxShadow: "0 2px 24px rgba(0,0,0,0.15)" }}>
            <div style={{ fontSize: "13px", fontWeight: 700, color: "#8888cc", letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: "14px" }}>CSS Variables</div>
            <pre style={{ margin: 0, fontSize: "11px", fontFamily: "'JetBrains Mono', monospace", color: "#c8c8ef", lineHeight: 1.8, overflowX: "auto" }}>
              <span style={{ color: "#7c7cff" }}>:root</span>{" {"}{"\n"}
              {olliePalette.map(c => (
                <span key={c.slug}>
                  {"  "}<span style={{ color: "#f0c0ff" }}>--wp--preset--color--{c.slug}</span>{": "}
                  <span style={{ color: "#88ffcc" }}>{c.hex}</span>{";\n"}
                </span>
              ))}
              {"}"}
            </pre>
          </div>

          <div style={{ marginTop: "20px", textAlign: "center", fontSize: "11px", color: "#b0b0cc" }}>
            Click any swatch to copy its hex · Based on the{" "}
            <a href="https://olliewp.com/docs/ollie-block-theme/ollie-color-palette/" target="_blank" rel="noreferrer" style={{ color: seedHex }}>
              Ollie Color System
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
