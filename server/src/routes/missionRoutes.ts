import { Router, Request, Response } from "express";
import { MissionRegistry } from "../features/missions/missionRegistry";

const router = Router();

/**
 * GET /api/v1/missions
 * Lists all registered hackathon missions and their status
 */
router.get("/", (_req: Request, res: Response): void => {
  const missions = MissionRegistry.getAllDefinitions();
  res.status(200).json({
    success: true,
    data: missions,
  });
});

/**
 * POST /api/v1/missions/:missionId/toggle
 * Toggles a mission enabled/disabled state
 */
router.post("/:missionId/toggle", (req: Request, res: Response): void => {
  const { missionId } = req.params;
  const { enabled } = req.body;

  if (typeof enabled !== "boolean") {
    res.status(400).json({
      success: false,
      error: "Body parameter 'enabled' must be a boolean.",
    });
    return;
  }

  const success = MissionRegistry.setEnabled(missionId, enabled);
  if (!success) {
    res.status(404).json({
      success: false,
      error: `Mission '${missionId}' not found.`,
    });
    return;
  }

  res.status(200).json({
    success: true,
    message: `Mission '${missionId}' enabled state set to ${enabled}.`,
    mission: MissionRegistry.get(missionId)?.definition,
  });
});

/**
 * POST /api/v1/missions/:missionId/execute
 * Invokes an active mission's handler
 */
router.post("/:missionId/execute", async (req: Request, res: Response): Promise<void> => {
  const { missionId } = req.params;
  try {
    const result = await MissionRegistry.executeMission(missionId, req.body);
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err: any) {
    res.status(400).json({
      success: false,
      error: err.message || "Mission execution failed.",
    });
  }
});

export default router;
