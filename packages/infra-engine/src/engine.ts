import type { AppRequirements } from "@codvly/config";
import type { Provider, ProviderRegistry } from "@codvly/providers-core";

/** A single unit of work the engine will execute against a provider. */
export interface PlanStep {
  id: string;
  provider: string;
  operation: string;
  /** What we expect to exist after this step (for state comparison). */
  resource?: unknown;
  /** True when the step modifies an existing resource instead of creating one. */
  modifiesExisting?: boolean;
}

/** A declarative plan: the diff between current state and desired state. */
export interface Plan {
  requirements: AppRequirements;
  steps: PlanStep[];
  /** Human-readable summary shown to the user before applying. */
  summary: string[];
}

export type StepResult =
  | { ok: true; detail?: string }
  | { ok: false; error: string };

export interface ApplyResult {
  plan: Plan;
  stepResults: StepResult[];
  succeeded: boolean;
  /** URLs / endpoints the developer cares about, e.g. "Frontend: https://..." */
  outputs: Array<{ label: string; value: string }>;
}

export type EngineEvent =
  | { type: "plan"; plan: Plan }
  | { type: "step-start"; stepId: string }
  | { type: "step-end"; stepId: string; result: StepResult };

/**
 * InfraEngine — the product core.
 *
 * Convert app requirements into a plan, then execute it against providers
 * through their interfaces. The engine never talks to provider APIs directly
 * and never lets the AI execute shell commands; every action is a typed,
 * auditable step.
 *
 * State tracking (diff current vs desired resources) is the next milestone
 * and will live here.
 */
export class InfraEngine {
  constructor(
    private readonly providers: ProviderRegistry,
    private readonly emit?: (event: EngineEvent) => void,
  ) {}

  provider(name: string): Provider {
    const provider = this.providers[name];
    if (!provider) {
      throw new Error(`No provider registered: ${name}`);
    }
    return provider;
  }

  /** TODO: build a Plan from AppRequirements by matching provider capabilities. */
  plan(_requirements: AppRequirements): Plan {
    throw new Error("InfraEngine.plan not implemented yet");
  }

  /** TODO: execute a plan step by step, tracking state between steps. */
  apply(_plan: Plan): Promise<ApplyResult> {
    return Promise.reject(new Error("InfraEngine.apply not implemented yet"));
  }
}
