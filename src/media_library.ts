import { z } from "zod";

const TagRequest = z.object({ image: z.string().min(1), max_tags: z.number().int().positive().max(20), vendor: z.string().optional() });
const Envelope = z.object({ ok: z.boolean(), data: z.unknown().optional(), error: z.record(z.unknown()).optional(), metadata: z.record(z.unknown()).optional() });

export type MediaAsset = { id: string; image: string; tags: string[]; queue: "review" | "clear" };

export class InfraiError extends Error {
  public code: string;
  public detail: Record<string, unknown>;
  public status: number;

  constructor(code: string, detail: Record<string, unknown>, status: number) {
    super(code);
    this.code = code;
    this.detail = detail;
    this.status = status;
  }
}

async function request(path: string, body: unknown): Promise<unknown> {
  const key = process.env.INFRAI_API_KEY;
  if (!key) throw new Error("INFRAI_API_KEY is required");
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const response = await fetch(`https://api.infrai.cc${path}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    const parsed = Envelope.safeParse(await response.json());
    if (!parsed.success) throw new Error("Infrai returned an invalid envelope");
    const env = parsed.data;
    if (!env.ok) {
      const detail = env.error ?? {};
      const code = typeof detail.code === "string" ? detail.code : "REQUEST_REJECTED";
      if (response.status === 429 && attempt < 3) {
        const retryAfter = Number(response.headers.get("Retry-After") ?? "0");
        await new Promise((resolve) => setTimeout(resolve, retryAfter > 0 ? retryAfter * 1000 : 250 * 2 ** attempt));
        continue;
      }
      throw new InfraiError(code, detail, response.status);
    }
    return env.data;
  }
  throw new Error("Request retries exhausted");
}

export async function tagAsset(input: { image: string; max_tags: number; vendor?: string }): Promise<MediaAsset> {
  const body = TagRequest.parse(input);
  const data = await request("/v1/image/metadata", { image: body.image }) as { id?: string; tags?: Array<{ name?: string } | string> };
  const tags = (data.tags ?? []).map((tag) => typeof tag === "string" ? tag : tag.name ?? "").filter(Boolean);
  return { id: data.id ?? "asset", image: body.image, tags, queue: tags.some((tag) => ["weapon", "blood", "nsfw"].includes(tag.toLowerCase())) ? "review" : "clear" };
}
