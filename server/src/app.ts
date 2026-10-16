import express, { Express, Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { config } from "./config";
import problemRoutes from "./routes/problemRoutes";
import missionRoutes from "./routes/missionRoutes";
import { AIFactory } from "./services/ai/aiFactory";

export function createApp(): Express {
  const app = express();

  // Security headers
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" },
    })
  );

  // CORS
  app.use(
    cors({
      origin: [config.clientOrigin, "http://localhost:5173", "http://127.0.0.1:5173"],
      credentials: true,
    })
  );

  // Rate Limiting (120 requests per 15 minutes)
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 120,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      error: "Too many requests from this IP, please try again after 15 minutes.",
    },
  });
  app.use("/api/", limiter);

  // Parsers
  app.use(express.json({ limit: "5mb" }));
  app.use(express.urlencoded({ extended: true, limit: "5mb" }));

  // Health endpoint
  app.get("/api/v1/health", (_req: Request, res: Response) => {
    const aiService = AIFactory.getService();
    res.status(200).json({
      status: "ok",
      name: "FixIt AI Service",
      version: "1.0.0",
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      ai: {
        provider: aiService.providerName,
        isDemo: aiService.isDemo,
      },
    });
  });

  // REST API Routes
  app.use("/api/v1/problems", problemRoutes);
  app.use("/api/v1/missions", missionRoutes);

  // 404 Handler
  app.use((_req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      error: "Endpoint not found",
    });
  });

  // Global Error Handler
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error("[Unhandled Server Error]:", err);

    if (err.code === "LIMIT_FILE_SIZE") {
      res.status(413).json({
        success: false,
        error: `File upload too large. Maximum allowed size is ${Math.round(config.maxUploadSizeBytes / (1024 * 1024))} MB.`,
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: err.message || "Internal server error",
    });
  });

  return app;
}
