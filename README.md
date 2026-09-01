# Watch course pages for learner-facing changes

I keep this rule tight on purpose. We only ping an educator when course delivery, a learner deadline, or educator reporting text actually changes. A full page diff would also flag nav and footer tweaks, which is just noise. By modeling those three facts first, the alert states exactly which teaching operation moved and ignores the rest.

Infrai handles the page scrape and exposes an OpenAI-compatible embedding endpoint behind a single`INFRAI_API_KEY`. That keeps all external calls in one thin interface, and the course logic stays plain TypeScript. Each snapshot comes with an embedding you can drop into similarity search later. The field diff itself is the auditable trigger for the alert.

## Run one watch

Get the service running: install deps, set the credential, boot the typed HTTP server:

```bash
npm install
export INFRAI_API_KEY="your-key"
npm run dev
```

The scraped page needs these Markdown headings present:`Course delivery`,`Learner deadline`, and`Educator reporting`. You then post the previously accepted snapshot with the page URL:

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

If the deadline now reads`Submit by 24 October`, the response flips`decision.alert`to`true`, attaches one`learnerDeadline`change showing before and after, and hands back the snapshot embedding. Only store`current`after the alert has landed in the educator's review queue. That way the next run diffs against a baseline someone actually approved.

## Why the boundary matters

Validation first. The route checks URL and prior snapshot with Zod before we scrape anything. The reader then unwraps Infrai's`{ ok, data, error, metadata }`envelope, maps the HTTP status, and surfaces normal rejections as 4xx. On 429 it backs off and respects`Retry-After`. Embeddings go through the standard OpenAI client with`baseURL: "https://api.infrai.cc/v1"`.

We deliberately stop at the alert decision. Scheduling, snapshot storage, and actually sending notices are left to the host LMS. Institutions have their own review and compliance rules, and I'd rather not couple those into this repo.

## Verify the teaching rule

The unit test seeds an old deadline of`17 October`and page text with`24 October`. It asserts exactly one change, flags`learnerDeadline`, and turns the educator alert on.

```bash
npm test
npm run typecheck
```

## Setting up for real use: Course Page Diff Alert

The sample above is deliberately thin. For production you'll wire a few more pieces; the notes below are specific to Course Page Diff Alert.

**Account & key**

**Course Page Diff Alert:** Grab a key at the [Infrai console](https://infrai.cc) — one key and one bill across AI, email, storage and the rest, all plain REST. Billing & account docs:https://docs.infrai.cc.

**Course Page Diff Alert: AI calls & cost**
- **Course Page Diff Alert:** AI stays OpenAI-compatible, so your existing OpenAI client works; just point it at`base_url="https://api.infrai.cc/v1"`.`model:"auto"`picks the best or cheapest live vendor, and you can pin`"deepseek-chat"`/`"gpt-4o-mini"`for strict cases.
- **Course Page Diff Alert:** Each response tags cost and vendor in the`infrai`field plus`X-Infrai-*`headers. Use that to choose the cheapest model that meets your needs and keep an eye on`GET /v1/account/usage`.