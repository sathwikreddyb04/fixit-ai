import { MissionDefinition } from "@fixit/shared";
import { Router } from "express";

export interface MissionModule {
  definition: MissionDefinition;
  getRouter?: () => Router;
  execute?: (payload: any) => Promise<any>;
}

export class MissionRegistry {
  private static missions = new Map<string, MissionModule>();

  static {
    // Initial planned hackathon mission slots
    this.register({
      definition: {
        id: "care_label_symbols",
        name: "Care Label Symbol Reference",
        description:
          "Lookup and translation of international textile care symbols (ISO 3758) with washing temperature rules.",
        version: "1.0.0",
        dependencies: ["@fixit/shared"],
        enabled: true,
        capabilities: ["textile_symbols", "care_tag_lookup"],
        status: "implemented",
        routePrefix: "/care-labels",
        authorNotes: "Initial low-risk reference mission for fabric care symbols.",
      },
      execute: async (payload: { symbolCode: string }) => {
        const symbolDatabase: Record<string, string> = {
          wash_cold: "Machine wash at max 30°C / 85°F (gentle cycle recommended).",
          wash_warm: "Machine wash at max 40°C / 105°F.",
          dry_clean_only: "Professional dry cleaning required. Do not submerge in home wash basin.",
          do_not_bleach: "Bleach of any type (chlorine or oxygen) will damage fabric fibers or dyes.",
          tumble_dry_low: "Tumble dry on low heat only. High heat will shrink or melt synthetic elastic.",
        };
        const result = symbolDatabase[payload.symbolCode] || "Symbol definition not found in reference database.";
        return { symbolCode: payload.symbolCode, interpretation: result };
      },
    });

    this.register({
      definition: {
        id: "eco_friendly_recipes",
        name: "Green & Non-Toxic Cleaning Formulations",
        description:
          "Safe, low-VOC household cleaning formulations using kitchen staples (baking soda, mild castile soap).",
        version: "0.1.0",
        dependencies: ["@fixit/shared"],
        enabled: false,
        capabilities: ["low_voc", "food_grade_cleaners"],
        status: "planned",
        authorNotes: "Scheduled for Hackathon Mission slot 2.",
      },
    });

    this.register({
      definition: {
        id: "surface_porosity_analyzer",
        name: "Surface Porosity & pH Matrix",
        description:
          "Deep compatibility check between surface porosity (marble, granite, hardwood, quartz) and acidic cleaners.",
        version: "0.1.0",
        dependencies: ["@fixit/shared"],
        enabled: false,
        capabilities: ["ph_validation", "surface_porosity"],
        status: "planned",
        authorNotes: "Scheduled for Hackathon Mission slot 3.",
      },
    });

    this.register({
      definition: {
        id: "stain_soak_timer",
        name: "Pre-Treat Soak & Wash Countdown",
        description:
          "Session timers for optimal enzyme activity soak duration before washing.",
        version: "0.1.0",
        dependencies: ["@fixit/shared"],
        enabled: false,
        capabilities: ["timers", "session_notifications"],
        status: "planned",
        authorNotes: "Scheduled for Hackathon Mission slot 4.",
      },
    });

    this.register({
      definition: {
        id: "dorm_emergency_triage",
        name: "Dormitory & Rental Rapid Move-Out Triage",
        description:
          "Rapid checklist for common dorm move-out stain inspections (carpet spots, wall scuffs, stove grease).",
        version: "0.1.0",
        dependencies: ["@fixit/shared"],
        enabled: false,
        capabilities: ["rental_triage", "batch_checklist"],
        status: "planned",
        authorNotes: "Scheduled for Hackathon Mission slot 5.",
      },
    });
  }

  public static register(module: MissionModule): void {
    this.missions.set(module.definition.id, module);
  }

  public static get(id: string): MissionModule | undefined {
    return this.missions.get(id);
  }

  public static getAllDefinitions(): MissionDefinition[] {
    return Array.from(this.missions.values()).map((m) => m.definition);
  }

  public static setEnabled(id: string, enabled: boolean): boolean {
    const mod = this.missions.get(id);
    if (!mod) return false;
    mod.definition.enabled = enabled;
    if (mod.definition.status === "implemented" && !enabled) {
      mod.definition.status = "disabled";
    } else if (mod.definition.status === "disabled" && enabled) {
      mod.definition.status = "implemented";
    }
    return true;
  }

  public static async executeMission(id: string, payload: any): Promise<any> {
    const mod = this.missions.get(id);
    if (!mod) {
      throw new Error(`Mission '${id}' not found in registry.`);
    }
    if (!mod.definition.enabled || mod.definition.status !== "implemented") {
      throw new Error(`Mission '${id}' is not currently active or enabled.`);
    }
    if (!mod.execute) {
      throw new Error(`Mission '${id}' has no registered execute handler.`);
    }
    return await mod.execute(payload);
  }
}
