import { Router, Request, Response } from "express";
import multer from "multer";
import {
  AnalyzeProblemRequestSchema,
  SubmitFollowUpAnswersRequestSchema,
  UserFeedbackSchema,
  AttemptRecord,
} from "@fixit/shared";
import { config } from "../config";
import { validateImageBuffer } from "../utils/fileValidation";
import { AIFactory } from "../services/ai/aiFactory";
import { SessionStore } from "../services/session/sessionStore";

const router = Router();

// Configure Multer for in-memory uploads with size limits
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: config.maxUploadSizeBytes,
  },
});

/**
 * POST /api/v1/problems/analyze
 * Accepts multipart/form-data (with optional 'image' file) or JSON body
 */
router.post(
  "/analyze",
  upload.single("image"),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const parsedBody = AnalyzeProblemRequestSchema.safeParse(req.body);
      if (!parsedBody.success) {
        res.status(400).json({
          success: false,
          error: "Invalid request data",
          details: parsedBody.error.flatten(),
        });
        return;
      }

      const { description, problemId: clientProblemId } = parsedBody.data;

      let imageBuffer: Buffer | undefined;
      let imageMime: string | undefined;
      let fileName: string | undefined;

      if (req.file) {
        // Validate actual file signature / magic bytes
        const validation = validateImageBuffer(req.file.buffer);
        if (!validation.isValid) {
          res.status(400).json({
            success: false,
            error: validation.error || "Invalid image file format.",
          });
          return;
        }
        imageBuffer = req.file.buffer;
        imageMime = validation.detectedMimeType;
        fileName = req.file.originalname;
      }

      const aiService = AIFactory.getService();
      const analysis = await aiService.analyzeProblem({
        text: description,
        imageBuffer,
        imageMime,
        fileName,
        problemId: clientProblemId,
      });

      // Save to in-memory session
      const session = SessionStore.getOrCreate(analysis.problemId);
      session.analysis = analysis;
      SessionStore.save(session);

      res.status(200).json({
        success: true,
        data: analysis,
      });
    } catch (err: any) {
      console.error("[Problem Route Error] /analyze:", err);
      res.status(500).json({
        success: false,
        error: err.message || "An unexpected error occurred during problem analysis.",
      });
    }
  }
);

/**
 * POST /api/v1/problems/:problemId/follow-up
 * Submits answers to follow-up questions
 */
router.post(
  "/:problemId/follow-up",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { problemId } = req.params;
      const session = SessionStore.get(problemId);
      if (!session || !session.analysis) {
        res.status(404).json({
          success: false,
          error: "Problem session not found or expired. Please re-submit your issue.",
        });
        return;
      }

      const parsedBody = SubmitFollowUpAnswersRequestSchema.safeParse(req.body);
      if (!parsedBody.success) {
        res.status(400).json({
          success: false,
          error: "Invalid follow-up answers payload.",
          details: parsedBody.error.flatten(),
        });
        return;
      }

      session.followUpAnswers = {
        ...(session.followUpAnswers || {}),
        ...parsedBody.data.answers,
      };

      const aiService = AIFactory.getService();
      const solution = await aiService.generateSolution({
        analysis: session.analysis,
        followUpAnswers: session.followUpAnswers,
      });

      session.solution = solution;
      SessionStore.save(session);

      res.status(200).json({
        success: true,
        data: {
          solution,
          updatedFollowUpAnswers: session.followUpAnswers,
        },
      });
    } catch (err: any) {
      console.error("[Problem Route Error] /follow-up:", err);
      res.status(500).json({
        success: false,
        error: err.message || "Failed to process follow-up answers.",
      });
    }
  }
);

/**
 * POST /api/v1/problems/:problemId/solution
 * Generates initial or direct solution plan if no follow-ups were needed
 */
router.post(
  "/:problemId/solution",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { problemId } = req.params;
      const session = SessionStore.get(problemId);
      if (!session || !session.analysis) {
        res.status(404).json({
          success: false,
          error: "Problem session not found or expired.",
        });
        return;
      }

      const aiService = AIFactory.getService();
      const solution = await aiService.generateSolution({
        analysis: session.analysis,
        followUpAnswers: session.followUpAnswers,
      });

      session.solution = solution;
      SessionStore.save(session);

      res.status(200).json({
        success: true,
        data: solution,
      });
    } catch (err: any) {
      console.error("[Problem Route Error] /solution:", err);
      res.status(500).json({
        success: false,
        error: err.message || "Failed to generate solution plan.",
      });
    }
  }
);

/**
 * POST /api/v1/problems/:problemId/feedback
 * Records user feedback and triggers troubleshooting adaptation if problem persists
 */
router.post(
  "/:problemId/feedback",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { problemId } = req.params;
      const session = SessionStore.get(problemId);
      if (!session || !session.solution) {
        res.status(404).json({
          success: false,
          error: "Problem solution session not found or expired.",
        });
        return;
      }

      const parsedFeedback = UserFeedbackSchema.safeParse(req.body);
      if (!parsedFeedback.success) {
        res.status(400).json({
          success: false,
          error: "Invalid feedback structure.",
          details: parsedFeedback.error.flatten(),
        });
        return;
      }

      const feedback = parsedFeedback.data;
      session.feedbackHistory.push(feedback);

      // Build an AttemptRecord for this attempt
      const attemptRecord: AttemptRecord = {
        attemptNumber: session.attemptHistory.length + 1,
        timestamp: new Date().toISOString(),
        planSummary: session.solution?.problemSummary || "Unknown plan",
        stepsAttempted: feedback.stepStatuses,
        productsUsed: feedback.productsUsed,
        symptomsReported: feedback.symptoms,
        outcome: feedback.outcome as AttemptRecord["outcome"],
        userNotes: feedback.userComments,
      };
      session.attemptHistory.push(attemptRecord);

      // If outcome was successful or abandoned, record and acknowledge
      if (feedback.outcome === "worked" || feedback.outcome === "abandoned") {
        SessionStore.save(session);
        res.status(200).json({
          success: true,
          data: {
            status: "recorded",
            message:
              feedback.outcome === "worked"
                ? "Glad to hear the solution worked! Always ensure items are fully dried before storage."
                : "Session closed as requested.",
          },
        });
        return;
      }

      // If solution did not work or alternative needed, trigger adaptation
      const aiService = AIFactory.getService();
      const troubleshootResult = await aiService.troubleshoot({
        currentPlan: session.solution!,
        feedback,
        history: session.feedbackHistory.slice(0, -1), // previous feedbacks excluding current
        attemptHistory: session.attemptHistory,
        analysis: session.analysis,
        followUpAnswers: {
          ...(session.followUpAnswers || {}),
          ...(feedback.followUpAnswers || {}),
        },
        adaptationCount: session.troubleshootingHistory.length + 1,
      });

      // Merge any follow-up answers from this feedback into session
      if (feedback.followUpAnswers) {
        session.followUpAnswers = {
          ...(session.followUpAnswers || {}),
          ...feedback.followUpAnswers,
        };
      }

      session.troubleshootingHistory.push(troubleshootResult);
      if (troubleshootResult.revisedSolution) {
        session.solution = troubleshootResult.revisedSolution;
      }
      SessionStore.save(session);

      res.status(200).json({
        success: true,
        data: troubleshootResult,
      });
    } catch (err: any) {
      console.error("[Problem Route Error] /feedback:", err);
      res.status(500).json({
        success: false,
        error: err.message || "Failed to process feedback.",
      });
    }
  }
);

/**
 * GET /api/v1/problems/:problemId/history
 * Returns the attempt history for a session
 */
router.get(
  "/:problemId/history",
  (req: Request, res: Response): void => {
    const { problemId } = req.params;
    const session = SessionStore.get(problemId);
    if (!session) {
      res.status(404).json({
        success: false,
        error: "Problem session not found or expired.",
      });
      return;
    }
    res.status(200).json({
      success: true,
      data: {
        problemId,
        attemptHistory: session.attemptHistory,
        troubleshootingHistory: session.troubleshootingHistory,
        adaptationCount: session.troubleshootingHistory.length,
      },
    });
  }
);

/**
 * POST /api/v1/problems/clear-session
 * Clears current session or all sessions
 */
router.post("/clear-session", (req: Request, res: Response): void => {
  const { problemId } = req.body;
  if (problemId) {
    SessionStore.delete(problemId);
  } else {
    SessionStore.clearAll();
  }
  res.status(200).json({ success: true, message: "Session cleared successfully." });
});

export default router;
