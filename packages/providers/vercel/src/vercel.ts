import {
  Deployment,
  DeploymentInput,
  EnvVar,
  HostingProvider,
  ProviderError,
  ProviderHealth,
  SecretRef,
} from "@codvly/providers-core";

const API_BASE = "https://api.vercel.com";

interface VercelCredentials {
  token: string;
  teamId?: string;
}

/**
 * Vercel hosting adapter — MVP #1 vertical slice:
 * create project → set env vars → deploy from git → resolve live URL.
 */
export class VercelProvider implements HostingProvider {
  readonly name = "vercel";
  readonly capabilities = ["hosting"] as const;

  private token?: string;
  private teamId?: string;

  async connect(credentials: unknown): Promise<void> {
    const creds = credentials as VercelCredentials;
    if (!creds?.token) {
      throw new ProviderError("vercel", "unauthorized", "Missing Vercel token");
    }
    this.token = creds.token;
    this.teamId = creds.teamId;
  }

  async health(): Promise<ProviderHealth> {
    try {
      await this.request("/v2/user");
      return { state: "connected", checkedAt: new Date().toISOString() };
    } catch (err) {
      return {
        state: "failed",
        message: err instanceof Error ? err.message : "unknown",
        checkedAt: new Date().toISOString(),
      };
    }
  }

  async disconnect(): Promise<void> {
    this.token = undefined;
    this.teamId = undefined;
  }

  /** Create a Vercel project linked to a git repository. */
  async createProject(input: DeploymentInput): Promise<string> {
    const [owner, repo] = input.source.split("/");
    if (!owner || !repo) {
      throw new ProviderError("vercel", "validation", "source must be owner/repo");
    }
    const body = await this.request<{ id: string }>("/v9/projects", {
      method: "POST",
      body: JSON.stringify({
        name: repo.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
        gitRepository: { type: "github", repo: input.source },
        framework: "nextjs",
      }),
    });
    return body.id;
  }

  async deploy(input: DeploymentInput): Promise<Deployment> {
    // TODO: reuse project if it exists (infra state), create if not.
    const projectId = await this.createProject(input);
    const body = await this.request<{ id: string; url: string }>("/v13/deployments", {
      method: "POST",
      body: JSON.stringify({
        name: projectId,
        gitSource: {
          type: "github",
          repo: input.source,
          ref: input.branch ?? "main",
        },
        target: input.production ? "production" : "preview",
      }),
    });
    return {
      id: body.id,
      projectId,
      status: "queued",
      url: `https://${body.url}`,
      createdAt: new Date().toISOString(),
      commitRef: input.branch,
    };
  }

  async getDeploymentUrl(projectId: string): Promise<string | undefined> {
    const body = await this.request<{ url: string }>(
      `/v13/deployments?projectId=${projectId}&state=READY&limit=1&target=production`,
    );
    return body.url ? `https://${body.url}` : undefined;
  }

  async setEnvVars(projectId: string, env: EnvVar[]): Promise<SecretRef[]> {
    const refs: SecretRef[] = [];
    for (const [index, item] of env.entries()) {
      if (item.value === undefined) continue;
      await this.request(`/v10/projects/${projectId}/env`, {
        method: "POST",
        body: JSON.stringify({
          key: item.key,
          value: item.value,
          type: item.sensitive ? "encrypted" : "plain",
          target: ["production", "preview"],
        }),
      });
      refs.push({
        key: item.key,
        vaultRef: `vercel:${projectId}:env:${index}`,
        masked: `${item.key}=••••`,
        updatedAt: new Date().toISOString(),
      });
    }
    return refs;
  }

  async listEnvVars(projectId: string): Promise<EnvVar[]> {
    const body = await this.request<{ envs: Array<{ key: string; type: string }> }>(
      `/v10/projects/${projectId}/env?decrypt=false`,
    );
    return (body.envs ?? []).map((e) => ({
      key: e.key,
      sensitive: e.type === "encrypted",
    }));
  }

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    if (!this.token) {
      throw new ProviderError("vercel", "unauthorized", "Not connected to Vercel");
    }
    const url = new URL(API_BASE + path);
    if (this.teamId) url.searchParams.set("teamId", this.teamId);

    let res: Response;
    try {
      res = await fetch(url, {
        ...init,
        headers: {
          Authorization: `Bearer ${this.token}`,
          "Content-Type": "application/json",
          ...init?.headers,
        },
      });
    } catch {
      throw new ProviderError("vercel", "unknown", "Network error talking to Vercel");
    }

    if (!res.ok) {
      throw new ProviderError(
        "vercel",
        this.errorCode(res.status),
        `Vercel API ${res.status}: ${await res.text()}`,
        res.status,
      );
    }
    return (await res.json()) as T;
  }

  private errorCode(status: number) {
    if (status === 401 || status === 403) return "unauthorized";
    if (status === 429) return "rate_limited";
    if (status === 404) return "not_found";
    if (status === 409) return "conflict";
    return "unknown";
  }
}
