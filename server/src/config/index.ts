import dotenv from "dotenv";
import path from "path";

// Load .env from server directory or root directory
dotenv.config();
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

export const config = {
  port: parseInt(process.env.PORT || "4000", 10),
  nodeEnv: process.env.NODE_ENV || "development",
  aiProvider: (process.env.AI_PROVIDER || (process.env.GEMINI_API_KEY ? "gemini" : "demo")).toLowerCase(),
  geminiApiKey: process.env.GEMINI_API_KEY || "",
  clientOrigin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
  maxUploadSizeBytes: parseInt(process.env.MAX_UPLOAD_SIZE_BYTES || "5242880", 10), // 5MB default
};
