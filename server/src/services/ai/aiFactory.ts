import { AIServiceInterface } from "./aiServiceInterface";
import { DeterministicDemoAdapter } from "./demoAdapter";
import { GeminiMultimodalAdapter } from "./geminiAdapter";
import { config } from "../../config";

export class AIFactory {
  private static instance: AIServiceInterface | null = null;

  public static getService(): AIServiceInterface {
    if (this.instance) {
      return this.instance;
    }

    if (config.aiProvider === "gemini" && config.geminiApiKey) {
      console.log("[AI Factory] Initializing real Google Gemini Multimodal Adapter.");
      this.instance = new GeminiMultimodalAdapter(config.geminiApiKey);
      return this.instance;
    }

    if (config.aiProvider === "gemini" && !config.geminiApiKey) {
      console.warn(
        "[AI Factory] GEMINI_API_KEY is not configured. Falling back to Honest Deterministic Demo Mode with explicit disclosure."
      );
    } else {
      console.log("[AI Factory] Running in Honest Deterministic Demo Mode (Demo Adapter).");
    }

    this.instance = new DeterministicDemoAdapter();
    return this.instance;
  }

  // Allows injecting test adapters or resetting for test suites
  public static setServiceForTesting(service: AIServiceInterface | null) {
    this.instance = service;
  }
}
