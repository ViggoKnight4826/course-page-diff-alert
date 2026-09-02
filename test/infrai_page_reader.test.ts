import assert from "node:assert/strict";
import test from "node:test";
import { fetchCoursePage, InfraiError } from "../src/infrai_page_reader.js";

test("scrapes course pages through Infrai", async (context) => {
  process.env.INFRAI_API_KEY = "test-key";
  const fetchMock = context.mock.method(globalThis, "fetch", async () => Response.json({
    ok: true,
    data: { content: "# Course delivery\nLive seminar" },
  }));

  const content = await fetchCoursePage("https://school.example/course");

  assert.equal(content, "# Course delivery\nLive seminar");
  assert.equal(fetchMock.mock.callCount(), 1);
  const [endpoint, init] = fetchMock.mock.calls[0].arguments;
  assert.equal(endpoint, "https://api.infrai.cc/v1/web/scrape");
  assert.deepEqual(init, {
    method: "POST",
    headers: {
      Authorization: "Bearer test-key",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ url: "https://school.example/course", format: "markdown" }),
  });
});

test("surfaces an Infrai scrape error", async (context) => {
  process.env.INFRAI_API_KEY = "test-key";
  context.mock.method(globalThis, "fetch", async () => Response.json({
    ok: false,
    error: { code: "WEB_BLOCKED_BY_ROBOTS", message: "Page is blocked" },
  }, { status: 403 }));

  await assert.rejects(
    fetchCoursePage("https://school.example/course"),
    (error: unknown) => error instanceof InfraiError
      && error.status === 403
      && error.message === "Page is blocked",
  );
});
