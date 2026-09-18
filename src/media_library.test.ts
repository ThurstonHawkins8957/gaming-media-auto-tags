import assert from "node:assert/strict";
import test from "node:test";
import { classifyPlayerUpload } from "./media_library_example.js";

test("player assets with moderation tags enter the review queue", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({ ok: true, data: { id: "p1", tags: ["weapon", "arena"] }, metadata: {} }), { status: 200 });
  process.env.INFRAI_API_KEY = "test-key";
  const result = await classifyPlayerUpload({ image: "https://example.com/player.png", max_tags: 4 });
  assert.deepEqual(result.tags, ["weapon", "arena"]);
  assert.equal(result.queue, "review");
  globalThis.fetch = originalFetch;
});
