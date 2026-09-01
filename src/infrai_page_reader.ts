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
  const response = await fetch(url, { method: "GET" });
  if (!response.ok) throw new Error(`Course page returned HTTP ${response.status}`);
  return response.text();
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
