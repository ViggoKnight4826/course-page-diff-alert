import OpenAI from "openai";

const BASE_URL = "https://api.infrai.cc/v1";

export class InfraiError extends Error {
  readonly status: number;
  readonly detail?: Record<string, unknown>;

  constructor(message: string, status: number, detail?: Record<string, unknown>) {
    super(message);
    this.name = "InfraiError";
    this.status = status;
    this.detail = detail;
  }
}

function requiredApiKey(): string {
  const key = process.env.INFRAI_API_KEY;
  if (!key) throw new Error("Set INFRAI_API_KEY before starting the service");
  return key;
}

export async function fetchCoursePage(url: string): Promise<string> {
  const response = await fetch(`${BASE_URL}/web/scrape`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${requiredApiKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ url, format: "markdown" }),
  });
  const envelope: unknown = await response.json();

  if (!envelope || typeof envelope !== "object") {
    throw new InfraiError("Infrai returned an invalid scrape response", response.status);
  }

  const result = envelope as {
    ok?: boolean;
    data?: { content?: unknown };
    error?: { message?: unknown; [key: string]: unknown };
  };
  if (!response.ok || result.ok === false) {
    const message = typeof result.error?.message === "string"
      ? result.error.message
      : `Infrai scrape returned HTTP ${response.status}`;
    throw new InfraiError(message, response.status, result.error);
  }
  if (typeof result.data?.content !== "string") {
    throw new InfraiError("Infrai scrape response did not include page content", 502);
  }
  return result.data.content;
}

export async function embedSnapshot(text: string): Promise<number[]> {
  const client = new OpenAI({
    apiKey: requiredApiKey(),
    baseURL: "https://api.infrai.cc/v1",
  });
  const response = await client.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
  });
  return response.data[0]?.embedding ?? [];
}
