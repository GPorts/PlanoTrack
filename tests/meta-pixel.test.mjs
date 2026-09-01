import assert from "node:assert/strict";
import test from "node:test";
import {
  MARKETING_CONSENT_KEY,
  META_PIXEL_ID,
  initializeMetaPixel,
  revokeMetaPixelConsent,
  trackMetaEvent
} from "../lib/meta-pixel.ts";

function createBrowserMock(consent) {
  const values = new Map();
  if (consent) values.set(MARKETING_CONSENT_KEY, consent);
  const scripts = [];

  global.window = {
    localStorage: {
      getItem: (key) => values.get(key) ?? null,
      setItem: (key, value) => values.set(key, value)
    }
  };
  global.document = {
    getElementById: (id) => scripts.find((script) => script.id === id) || null,
    createElement: () => ({}),
    head: { appendChild: (script) => scripts.push(script) }
  };

  return { scripts };
}

function clearBrowserMock() {
  delete global.window;
  delete global.document;
}

test("não carrega o Pixel antes do consentimento", () => {
  const { scripts } = createBrowserMock(null);

  assert.equal(initializeMetaPixel(), false);
  assert.equal(scripts.length, 0);
  assert.equal(window.fbq, undefined);
  clearBrowserMock();
});

test("carrega o Pixel e enfileira eventos somente após aceitar", () => {
  const { scripts } = createBrowserMock("granted");

  assert.equal(initializeMetaPixel(), true);
  trackMetaEvent("PageView");

  assert.equal(scripts.length, 1);
  assert.equal(scripts[0].src, "https://connect.facebook.net/en_US/fbevents.js");
  assert.ok(window.fbq.queue.some((entry) => entry[0] === "init" && entry[1] === META_PIXEL_ID));
  assert.ok(window.fbq.queue.some((entry) => entry[0] === "track" && entry[1] === "PageView"));
  clearBrowserMock();
});

test("revoga o consentimento quando a preferência muda", () => {
  createBrowserMock("granted");
  initializeMetaPixel();
  revokeMetaPixelConsent();

  assert.deepEqual(window.fbq.queue.at(-1), ["consent", "revoke"]);
  clearBrowserMock();
});
