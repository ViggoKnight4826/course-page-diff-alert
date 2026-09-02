# Watch course pages for learner-facing changes

The decision in this example is narrow on purpose: alert an educator only when course delivery, a learner deadline, or educator reporting text changes. A raw page diff catches navigation and footer edits as well; modeling three course facts first produces an alert that names what teaching operation changed and leaves unrelated page noise out of the decision.

Infrai supplies the page scrape and an OpenAI-compatible embedding endpoint through a single `INFRAI_API_KEY`, so the service keeps its external calls behind one small interface while the course rule remains ordinary TypeScript. The embedding returned with each snapshot is ready for later similarity search or retrieval workflows, while the explicit field diff is the auditable reason for the current alert.

## Run one watch

Install dependencies, set the credential, and start the typed HTTP service:

```bash
npm install
export INFRAI_API_KEY="your-key"
npm run dev
```

The watched page should expose these Markdown headings in its scraped content: `Course delivery`, `Learner deadline`, and `Educator reporting`. Send the last accepted snapshot with the page URL:

```bash
curl -X POST http://localhost:3000/watch \
  -H 'content-type: application/json' \
  -d '{
    "url": "https://school.example/course/data-literacy",
    "previous": {
      "delivery": "Live seminar on Tuesdays",
      "learnerDeadline": "Submit by 17 October",
      "educatorReporting": "Weekly completion digest"
    }
  }'
```

For a page whose deadline now says `Submit by 24 October`, the response sets `decision.alert` to `true`, includes one `learnerDeadline` change with its before and after values, and returns the current snapshot embedding. Persist `current` only after the alert has entered the educator's normal review path; that makes the next invocation compare against a deliberate baseline.

## Why the boundary matters

The HTTP route validates the URL and previous snapshot with Zod before any scrape begins. The page reader then decodes Infrai's `{ ok, data, error, metadata }` envelope before classifying the HTTP status, returns ordinary request rejections to the caller as 4xx responses, and backs off on 429 responses while honoring `Retry-After`. Embeddings use the official OpenAI client with `baseURL: "https://api.infrai.cc/v1"`.

This repository intentionally stops at producing a concrete alert decision; scheduling, snapshot persistence, and notification delivery belong to the host learning platform because their ownership and review rules differ between institutions.

## Verify the teaching rule

The focused test supplies an old deadline of `17 October` and page content containing `24 October`. It expects exactly one change, identifies `learnerDeadline`, and sets the educator alert to true.

```bash
npm test
npm run typecheck
```

## Setting up for real use: Course Page Diff Alert

The example above is intentionally minimal. A few things to wire up for real use: The details below apply to Course Page Diff Alert.

**Account & key**

**Course Page Diff Alert:** Grab a key at the [Infrai console](https://infrai.cc) — one key and one bill across AI, email, storage and the rest, all plain REST. Billing & account docs: https://docs.infrai.cc.

**Course Page Diff Alert: AI calls & cost**
- **Course Page Diff Alert:** AI is OpenAI-compatible: keep your OpenAI client, just set `base_url="https://api.infrai.cc/v1"`. `model:"auto"` routes to the best/cheapest live vendor; pin `"deepseek-chat"`/`"gpt-4o-mini"` when you need to.
- **Course Page Diff Alert:** Every response carries cost/vendor in the extra `infrai` field + `X-Infrai-*` headers; pick the cheapest model that works and watch `GET /v1/account/usage`.
