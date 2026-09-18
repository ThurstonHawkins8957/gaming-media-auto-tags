import { z } from "zod";
import { tagAsset } from "./media_library.js";

const PlayerUpload = z.object({ image: z.string().url(), max_tags: z.number().int().positive().default(8), vendor: z.string().optional() });

export async function classifyPlayerUpload(input: unknown) {
  const upload = PlayerUpload.parse(input);
  return tagAsset(upload);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const image = process.env.DEMO_IMAGE;
  if (!image) throw new Error("Set DEMO_IMAGE to a public image URL");
  const result = await classifyPlayerUpload({ image, max_tags: 8 });
  console.log(JSON.stringify(result, null, 2));
}
