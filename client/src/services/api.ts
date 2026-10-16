import {
  ProblemAnalysis,
  SolutionPlan,
  UserFeedback,
  TroubleshootingResult,
  MissionDefinition,
} from "@fixit/shared";

const API_BASE = "/api/v1";

export interface HealthResponse {
  status: string;
  name: string;
  version: string;
  uptimeSeconds: number;
  ai: {
    provider: string;
    isDemo: boolean;
  };
}

export const api = {
  async getHealth(): Promise<HealthResponse> {
    const res = await fetch(`${API_BASE}/health`);
    if (!res.ok) throw new Error("Backend service unreachable");
    return res.json();
  },

  async analyzeProblem(
    description: string,
    imageFile?: File,
    problemId?: string
  ): Promise<ProblemAnalysis> {
    const formData = new FormData();
    formData.append("description", description);
    if (problemId) {
      formData.append("problemId", problemId);
    }
    if (imageFile) {
      formData.append("image", imageFile);
    }

    const res = await fetch(`${API_BASE}/problems/analyze`, {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || "Failed to analyze problem");
    }
    return data.data;
  },

  async submitFollowUp(
    problemId: string,
    answers: Record<string, string>
  ): Promise<{ solution: SolutionPlan; updatedFollowUpAnswers: Record<string, string> }> {
    const res = await fetch(`${API_BASE}/problems/${problemId}/follow-up`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || "Failed to submit follow-up answers");
    }
    return data.data;
  },

  async getDirectSolution(problemId: string): Promise<SolutionPlan> {
    const res = await fetch(`${API_BASE}/problems/${problemId}/solution`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || "Failed to generate solution");
    }
    return data.data;
  },

  async submitFeedback(
    feedback: UserFeedback
  ): Promise<{ status?: string; message?: string } | TroubleshootingResult> {
    const res = await fetch(`${API_BASE}/problems/${feedback.problemId}/feedback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(feedback),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || "Failed to submit feedback");
    }
    return data.data;
  },

  async clearSession(problemId?: string): Promise<void> {
    await fetch(`${API_BASE}/problems/clear-session`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ problemId }),
    });
  },

  async getMissions(): Promise<MissionDefinition[]> {
    const res = await fetch(`${API_BASE}/missions`);
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || "Failed to load missions");
    }
    return data.data;
  },

  async toggleMission(missionId: string, enabled: boolean): Promise<MissionDefinition> {
    const res = await fetch(`${API_BASE}/missions/${missionId}/toggle`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || "Failed to toggle mission");
    }
    return data.mission;
  },

  async executeMission(missionId: string, payload: any): Promise<any> {
    const res = await fetch(`${API_BASE}/missions/${missionId}/execute`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || "Mission execution failed");
    }
    return data.data;
  },
};
