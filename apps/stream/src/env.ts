import { z } from "zod";

const schema = z.object({
  STREAM_PORT: z.coerce.number().default(4100),
  WEB_ORIGIN: z.string().url(),
  MONGODB_URI: z.string().min(1),
  STREAM_SIGNING_SECRET: z.string().min(32),
});

export const env = schema.parse(process.env);
