import assert from "node:assert/strict";
import test from "node:test";
import { fmtPrice, fmtNum, fmtSignedPct, fmtVol, fmtRatioPct, deltaColor, sign, daysUntil, relFromMs, relFromUnix } from "../src/lib/format.js";

test("missing or malformed numbers never become zero money or gains", () => {
  for (const value of ["", "  ", false, true, [], [1], {}, Symbol("missing")]) {
    for (const format of [fmtPrice, fmtNum, fmtSignedPct, fmtVol, fmtRatioPct]) assert.equal(format(value), "—");
    assert.equal(deltaColor(value), "text-muted");
    assert.equal(sign(value), 0);
  }
});
test("valid numbers and numeric strings retain existing formats", () => {
  assert.equal(fmtPrice("1234.5"), "$1,234.50");
  assert.equal(fmtNum(0), "0.00");
  assert.equal(fmtSignedPct(-1.5), "-1.50%");
  assert.equal(fmtVol(1500), "1.5K");
  assert.equal(fmtRatioPct(0.62), "62%");
});
test("invalid precision cannot crash rendering", () => {
  for (const precision of [-1, 101, NaN, Infinity, "bad"]) {
    assert.equal(fmtPrice(1, precision), "$1.00");
    assert.equal(fmtNum(1, precision), "1.00");
    assert.equal(fmtSignedPct(1, precision), "+1.00%");
    assert.equal(fmtRatioPct(0.1, precision), "10%");
  }
});
test("invalid calendar dates do not silently roll into another month", () => {
  for (const date of ["2026-02-30", "2025-02-29", "2026-13-01", "2026-01-32", "2026-01-01-extra", "2026-1-1", "0000-01-01"]) assert.equal(daysUntil(date), null, date);
  assert.ok(Number.isInteger(daysUntil("2024-02-29")));
});
test("small clock skew is just now, large future skew is not described as fresh", () => {
  assert.equal(relFromMs(Date.now() + 30_000), "just now");
  assert.match(relFromMs(Date.now() + 2 * 3600_000 + 60_000), /^in (1|2)h$/);
});
test("epoch zero is unset, malformed values are unknown", () => {
  assert.equal(relFromMs(0), "");
  assert.equal(relFromUnix(0), "");
  assert.equal(relFromMs(" "), "");
  assert.equal(relFromUnix(false), "");
});
test("local calendar today and tomorrow retain their day count", () => {
  const date = new Date();
  const key = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
  assert.equal(daysUntil(key(date)), 0);
  date.setDate(date.getDate()+1);
  assert.equal(daysUntil(key(date)), 1);
});
test("nonfinite numbers remain unknown", () => {
  for (const value of [NaN, Infinity, -Infinity, "NaN"]) {
    assert.equal(fmtPrice(value), "—");
    assert.equal(relFromMs(value), "");
  }
});
