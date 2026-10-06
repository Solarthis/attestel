// Number/format helpers for the terminal UI. Kept UI-only (no API coupling). The api.js module
// still owns fmtPct/fmtMoney/fmtB used by existing panels; these are additive.

// Missing API values must stay unknown rather than turn into zero through coercion.
function numeric(value) {
  if (typeof value !== "number" && typeof value !== "string") return NaN;
  if (typeof value === "string" && !value.trim()) return NaN;
  return Number(value);
}
function precision(value, fallback = 2) {
  return Number.isInteger(value) && value >= 0 && value <= 20 ? value : fallback;
}

// Price with thousands separators and fixed decimals — "$1,234.56".
export function fmtPrice(n, d = 2) {
  if (!Number.isFinite(numeric(n))) return "—";
  return `$${Number(n).toLocaleString("en-US", { minimumFractionDigits: precision(d), maximumFractionDigits: precision(d) })}`;
}

// Bare number with thousands separators.
export function fmtNum(n, d = 2) {
  if (!Number.isFinite(numeric(n))) return "—";
  return Number(n).toLocaleString("en-US", { minimumFractionDigits: precision(d), maximumFractionDigits: precision(d) });
}

// Signed percent — "+1.2%" / "-0.4%". decimals default 2.
export function fmtSignedPct(n, d = 2) {
  if (!Number.isFinite(numeric(n))) return "—";
  const v = Number(n);
  return `${v >= 0 ? "+" : ""}${v.toFixed(precision(d))}%`;
}

// Compact volume — 1.2K / 3.4M / 5.6B.
export function fmtVol(n) {
  if (!Number.isFinite(numeric(n))) return "—";
  const v = Number(n);
  const abs = Math.abs(v);
  if (abs >= 1e9) return `${(v / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `${(v / 1e6).toFixed(2)}M`;
  if (abs >= 1e3) return `${(v / 1e3).toFixed(1)}K`;
  return String(Math.round(v));
}

// Fraction (0..1) → "62%".
export function fmtRatioPct(n, d = 0) {
  if (!Number.isFinite(numeric(n))) return "—";
  return `${(Number(n) * 100).toFixed(precision(d, 0))}%`;
}

// Tailwind text-color class from a signed number (or null → muted).
export function deltaColor(n) {
  if (!Number.isFinite(numeric(n))) return "text-muted";
  return Number(n) >= 0 ? "text-up" : "text-down";
}

// -1 / 0 / +1 sign for flash direction.
export function sign(n) {
  if (!Number.isFinite(numeric(n))) return 0;
  return Number(n) > 0 ? 1 : Number(n) < 0 ? -1 : 0;
}

// relFromMs — coarse relative age from an epoch-milliseconds value. Source age matters on the Today
// workspace (a 4-hour-old brief is a different thing from a fresh one), so it is rendered next to every
// dated item rather than left implicit.
export function relFromMs(ms) {
  const time = numeric(ms);
  if (!Number.isFinite(time)) return "";
  const delta = Date.now() - time;
  const s = Math.floor(Math.abs(delta) / 1000);
  const future = delta < 0;
  if (s < 60) return future ? "in less than a minute" : "just now";
  const age = s < 3600 ? `${Math.floor(s / 60)}m`
    : s < 86400 ? `${Math.floor(s / 3600)}h` : `${Math.floor(s / 86400)}d`;
  return future ? `in ${age}` : `${age} ago`;
}

// relFromUnix — same, for the unix-SECONDS timestamps the Go services use (alert events, thesis checks).
export function relFromUnix(sec) {
  return Number.isFinite(numeric(sec)) ? relFromMs(Number(sec) * 1000) : "";
}

// relFromISO — same, for the RFC3339 strings the providers and gateway return (news publishedAt, asOf).
export function relFromISO(iso) {
  if (!iso) return "";
  const t = Date.parse(iso);
  return Number.isNaN(t) ? "" : relFromMs(t);
}

// daysUntil — whole days from today (local) to a "YYYY-MM-DD" date. Negative for the past, null if
// unparseable. Used for "in 3 days" on upcoming events.
export function daysUntil(ymd) {
  if (typeof ymd !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return null;
  const [y, m, d] = ymd.split("-").map(Number);
  if (y < 1 || m < 1 || m > 12 || d < 1 || d > 31) return null;
  const then = new Date(0);
  then.setUTCFullYear(y, m - 1, d);
  if (then.getUTCFullYear() !== y || then.getUTCMonth() !== m - 1 || then.getUTCDate() !== d) return null;
  const now = new Date();
  // Compare calendar dates, not elapsed local-midnight hours across DST changes.
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((then.getTime() - today) / 86400000);
}

// relDay — "today" / "tomorrow" / "in 4 days" / "4 days ago" from a "YYYY-MM-DD" date.
export function relDay(ymd) {
  const n = daysUntil(ymd);
  if (n == null) return "";
  if (n === 0) return "today";
  if (n === 1) return "tomorrow";
  if (n === -1) return "yesterday";
  return n > 0 ? `in ${n} days` : `${-n} days ago`;
}
