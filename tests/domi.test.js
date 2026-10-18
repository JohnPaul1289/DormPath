import { test } from "node:test";
import assert from "node:assert/strict";
import handler from "../netlify/functions/domi.mjs";

test("domi function rejects non-POST request methods", async () => {
  const res = await handler(
    new Request("https://example.test/.netlify/functions/domi", {
      method: "GET",
    }),
  );
  assert.equal(res.status, 405);
  const data = await res.json();
  assert.match(data.error, /Method not allowed/i);
});

test("domi function fails closed when GROQ_API_KEY is missing", async () => {
  const origKey = process.env.GROQ_API_KEY;
  delete process.env.GROQ_API_KEY;
  try {
    const res = await handler(
      new Request("https://example.test/.netlify/functions/domi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [{ role: "user", content: "hello" }] }),
      }),
    );
    assert.equal(res.status, 503);
    const data = await res.json();
    assert.match(data.error, /GROQ_API_KEY is not configured/i);
  } finally {
    if (origKey !== undefined) process.env.GROQ_API_KEY = origKey;
  }
});

test("domi function validates messages array and content structure", async () => {
  const origKey = process.env.GROQ_API_KEY;
  process.env.GROQ_API_KEY = "gsk_test_key";
  try {
    // Missing messages array
    const r1 = await handler(
      new Request("https://example.test/.netlify/functions/domi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      }),
    );
    assert.equal(r1.status, 400);

    // Invalid role
    const r2 = await handler(
      new Request("https://example.test/.netlify/functions/domi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [{ role: "hacker", content: "hi" }] }),
      }),
    );
    assert.equal(r2.status, 400);

    // Empty message content
    const r3 = await handler(
      new Request("https://example.test/.netlify/functions/domi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [{ role: "user", content: "   " }] }),
      }),
    );
    assert.equal(r3.status, 400);
  } finally {
    if (origKey !== undefined) process.env.GROQ_API_KEY = origKey;
    else delete process.env.GROQ_API_KEY;
  }
});

test("domi function dispatches to Groq and returns formatted reply", async () => {
  const origKey = process.env.GROQ_API_KEY;
  const origFetch = globalThis.fetch;
  process.env.GROQ_API_KEY = "gsk_valid_mock_key";

  let capturedUrl = "";
  let capturedBody = null;
  let capturedAuth = "";

  globalThis.fetch = async (url, options) => {
    capturedUrl = url;
    capturedBody = JSON.parse(options.body);
    capturedAuth = options.headers?.Authorization;
    return new Response(
      JSON.stringify({
        choices: [
          {
            message: {
              role: "assistant",
              content: "Kumusta! I found 3 affordable dorms near SPUP on Mabini St.",
            },
          },
        ],
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  };

  try {
    const res = await handler(
      new Request("https://example.test/.netlify/functions/domi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            { role: "system", content: "You are DOMI" },
            { role: "user", content: "Rooms near SPUP please" },
          ],
        }),
      }),
    );

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.reply, "Kumusta! I found 3 affordable dorms near SPUP on Mabini St.");
    assert.equal(data.model, "qwen/qwen3.8-27b");
    assert.equal(capturedUrl, "https://api.groq.com/openai/v1/chat/completions");
    assert.equal(capturedAuth, "Bearer gsk_valid_mock_key");
    assert.equal(capturedBody.model, "qwen/qwen3.8-27b");
    assert.equal(capturedBody.messages.length, 2);
  } finally {
    globalThis.fetch = origFetch;
    if (origKey !== undefined) process.env.GROQ_API_KEY = origKey;
    else delete process.env.GROQ_API_KEY;
  }
});

test("domi function falls back to openai/gpt-oss-20b when primary model is busy", async () => {
  const origKey = process.env.GROQ_API_KEY;
  const origFetch = globalThis.fetch;
  process.env.GROQ_API_KEY = "gsk_valid_mock_key";

  const attemptedModels = [];

  globalThis.fetch = async (url, options) => {
    const parsed = JSON.parse(options.body);
    attemptedModels.push(parsed.model);

    if (parsed.model === "qwen/qwen3.8-27b") {
      // Simulate rate limit or upstream load on Qwen
      return new Response(JSON.stringify({ error: { message: "Model is overloaded" } }), {
        status: 429,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        choices: [
          {
            message: {
              role: "assistant",
              content: "Fallback reply from 20B model.",
            },
          },
        ],
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  };

  try {
    const res = await handler(
      new Request("https://example.test/.netlify/functions/domi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: "help" }],
        }),
      }),
    );

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.reply, "Fallback reply from 20B model.");
    assert.equal(data.model, "openai/gpt-oss-20b");
    assert.deepEqual(attemptedModels, ["qwen/qwen3.8-27b", "openai/gpt-oss-20b"]);
  } finally {
    globalThis.fetch = origFetch;
    if (origKey !== undefined) process.env.GROQ_API_KEY = origKey;
    else delete process.env.GROQ_API_KEY;
  }
});
