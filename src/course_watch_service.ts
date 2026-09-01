import express, { type NextFunction, type Request, type Response } from "express";
import { z } from "zod";
import { decideCourseAlert, parseCourseSnapshot } from "./course_change_monitor.js";
import { embedSnapshot, InfraiError, fetchCoursePage } from "./infrai_page_reader.js";

const snapshotSchema = z.object({
  delivery: z.string().min(1),
  learnerDeadline: z.string().min(1),
  educatorReporting: z.string().min(1),
});

const watchRequestSchema = z.object({
  url: z.url(),
  previous: snapshotSchema,
});

const app = express();
app.use(express.json({ limit: "32kb" }));

app.post("/watch", async (request: Request, response: Response, next: NextFunction) => {
  const parsed = watchRequestSchema.safeParse(request.body);
  if (!parsed.success) {
    response.status(400).json({ error: "Invalid watch request", issues: parsed.error.issues });
    return;
  }

  try {
    const page = await fetchCoursePage(parsed.data.url);
    const current = parseCourseSnapshot(page);
    const decision = decideCourseAlert(parsed.data.previous, current);
    const embedding = await embedSnapshot(JSON.stringify(current));
    response.json({
      url: parsed.data.url,
      current,
      decision,
      snapshotEmbedding: embedding,
    });
  } catch (error) {
    next(error);
  }
});

app.use((error: unknown, _request: Request, response: Response, _next: NextFunction) => {
  if (error instanceof InfraiError) {
    const status = error.status >= 400 && error.status < 500 ? error.status : 502;
    response.status(status).json({ error: error.message, detail: error.detail });
    return;
  }
  response.status(422).json({ error: error instanceof Error ? error.message : "Page could not be modeled" });
});

const port = Number(process.env.PORT ?? 3000);
app.listen(port, () => {
  console.log(`Course watch service listening on http://localhost:${port}`);
});
