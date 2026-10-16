import {
  ProblemAnalysis,
  SolutionPlan,
  UserFeedback,
  TroubleshootingResult,
  AttemptRecord,
} from "@fixit/shared";

export interface SessionData {
  problemId: string;
  createdAt: number;
  lastActiveAt: number;
  analysis?: ProblemAnalysis;
  followUpAnswers?: Record<string, string>;
  solution?: SolutionPlan;
  feedbackHistory: UserFeedback[];
  troubleshootingHistory: TroubleshootingResult[];
  attemptHistory: AttemptRecord[];
}

export class SessionStore {
  private static store = new Map<string, SessionData>();
  private static readonly TTL_MS = 2 * 60 * 60 * 1000; // 2 hours

  public static getOrCreate(problemId: string): SessionData {
    this.cleanExpired();
    let session = this.store.get(problemId);
    if (!session) {
      session = {
        problemId,
        createdAt: Date.now(),
        lastActiveAt: Date.now(),
        feedbackHistory: [],
        troubleshootingHistory: [],
        attemptHistory: [],
      };
      this.store.set(problemId, session);
    } else {
      session.lastActiveAt = Date.now();
    }
    return session;
  }

  public static get(problemId: string): SessionData | undefined {
    this.cleanExpired();
    const session = this.store.get(problemId);
    if (session) {
      session.lastActiveAt = Date.now();
    }
    return session;
  }

  public static save(session: SessionData): void {
    session.lastActiveAt = Date.now();
    this.store.set(session.problemId, session);
  }

  public static delete(problemId: string): boolean {
    return this.store.delete(problemId);
  }

  public static clearAll(): void {
    this.store.clear();
  }

  private static cleanExpired(): void {
    const now = Date.now();
    for (const [id, session] of this.store.entries()) {
      if (now - session.lastActiveAt > this.TTL_MS) {
        this.store.delete(id);
      }
    }
  }
}
