/**
 * Coding engine abstraction.
 *
 * Codvly is not an AI wrapper: the coding engine (OpenCode today, others
 * later) is a replaceable integration. The rest of the platform talks to
 * this interface only, and the AI is restricted to typed intents — it can
 * request "configure_oauth()" but never execute arbitrary cloud commands.
 */

export type CodingIntent =
  | "detect_project"
  | "deploy"
  | "configure_oauth"
  | "create_database"
  | "get_logs"
  | "rotate_secret";

export interface CodingTask {
  id: string;
  intent: CodingIntent;
  /** Project working directory. */
  cwd: string;
  description: string;
}

export type CodingTaskStatus =
  | "queued"
  | "running"
  | "awaiting_input"
  | "done"
  | "failed";

export interface CodingEngine {
  run(task: CodingTask): Promise<CodingTaskStatus>;
  status(taskId: string): Promise<CodingTaskStatus>;
  cancel(taskId: string): Promise<void>;
}
