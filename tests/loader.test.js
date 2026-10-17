import { test } from "node:test";
import assert from "node:assert/strict";
import { domiLoaderHtml } from "../src/domain.js";

test("domiLoaderHtml generates 60fps circular animated loader with mascot and light trail elements", () => {
  const html = domiLoaderHtml("global");
  assert.ok(html.includes("domi-loader domi-loader-global"), "Has global class");
  assert.ok(html.includes("domi-ambient-glow"), "Has ambient neon glow");
  assert.ok(html.includes("domi-ring-track"), "Has static ring track");
  assert.ok(html.includes("domi-spinner-rotator"), "Has 60fps rotating container");
  assert.ok(html.includes("domi-conic-arc"), "Has glowing conic arc");
  assert.ok(html.includes("domi-comet-head"), "Has comet light trail head");
  assert.ok(html.includes("domi-mascot-pod"), "Has centered mascot pod");
  assert.ok(html.includes("/domi-loader.png"), "Uses the optimized DOMI mascot");
  assert.ok(html.includes("/icon-192.png"), "Has a cached icon fallback");
  assert.ok(html.includes("domi-sr-only"), "Has screen-reader accessibility text");
  assert.ok(!html.includes("Loading...</span></div>"), "Does not render visible text captions beneath mascot");
});

test("domiLoaderHtml generates compact and button sizes properly", () => {
  const btnHtml = domiLoaderHtml("button");
  assert.ok(btnHtml.includes("domi-loader-button"), "Has button class");
  assert.ok(btnHtml.includes("domi-spinner-rotator"), "Button has spinning ring");
  assert.ok(!btnHtml.includes("domi-mascot-pod"), "Button loader excludes mascot pod");

  const pageHtml = domiLoaderHtml("page");
  assert.ok(pageHtml.includes("domi-loader-page"), "Has page loader class");
  assert.ok(pageHtml.includes("domi-mascot-pod"), "Page loader includes mascot pod");
});

test("domiLoaderHtml generates determinate progress bar for file uploads", () => {
  const progressHtml = domiLoaderHtml("global", 75);
  assert.ok(progressHtml.includes('role="progressbar"'), "Has progressbar role");
  assert.ok(progressHtml.includes('aria-valuenow="75"'), "Reflects 75% progress");
  assert.ok(progressHtml.includes("75% completed"), "Has accessible percent text");
});
