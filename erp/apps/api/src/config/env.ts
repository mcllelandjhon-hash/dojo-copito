import "dotenv/config";
import { z } from "zod";

const schema = z.object({
  DATABASE_URL: z.string().default("file:./dev.db"),
  JWT_SECRET: z.string().min(8).default("dev-secret-change-me"),
  JWT_EXPIRES_IN: z.string().default("8h"),
  PORT: z.coerce.number().int().positive().default(4000),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
  NODE_ENV: z.string().default("development"),
});

export const env = schema.parse(process.env);
export const isTest = env.NODE_ENV === "test";
