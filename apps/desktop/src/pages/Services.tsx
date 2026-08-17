import { useEffect, useState } from "react";
import type { ComponentType } from "react";
import {
  Archive,
  BellRing,
  Database,
  Globe,
  KeyRound,
} from "lucide-react";
import {
  listServices,
  setServiceEnabled,
  setServiceOption,
} from "../lib/db";

type ServiceIcon = ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;

function GitHubLogo({ size = 15, className }: { size?: number; strokeWidth?: number; className?: string }) {
  return (
    <img
      src="https://cdn.simpleicons.org/github/e6e6ec"
      width={size}
      height={size}
      className={className}
      alt="GitHub"
    />
  );
}

interface ServiceRow {
  name: string;
  desc: string;
  icon: ServiceIcon;
  control: "toggle" | "select";
  options?: string[];
}

const METADATA: ServiceRow[] = [
  {
    name: "Google Authentication",
    desc: "Google OAuth · redirect URIs · credentials",
    icon: KeyRound,
    control: "toggle",
  },
  {
    name: "GitHub Authentication",
    desc: "GitHub OAuth application and callback configuration",
    icon: GitHubLogo,
    control: "toggle",
  },
  {
    name: "Database",
    desc: "PostgreSQL database and connection environment",
    icon: Database,
    control: "select",
    options: ["Supabase", "Neon", "AWS RDS"],
  },
  {
    name: "Push Notifications",
    desc: "Firebase Cloud Messaging · Android configuration",
    icon: BellRing,
    control: "toggle",
  },
  {
    name: "Object Storage",
    desc: "Uploads, files and images",
    icon: Archive,
    control: "select",
    options: ["Supabase Storage", "S3", "Cloudflare R2"],
  },
  {
    name: "Custom Domain",
    desc: "DNS and TLS configuration",
    icon: Globe,
    control: "toggle",
  },
];

interface RowState {
  on: boolean;
  option: string;
}

export function Services() {
  const [rows, setRows] = useState<RowState[] | null>(null);

  useEffect(() => {
    listServices().then((services) => {
      const byName = new Map(services.map((s) => [s.name, s]));
      setRows(
        METADATA.map((m) => {
          const stored = byName.get(m.name);
          return {
            on: stored ? stored.enabled === 1 : false,
            option: stored?.option ?? m.options?.[0] ?? "",
          };
        }),
      );
    });
  }, []);

  const toggle = (index: number) => {
    const meta = METADATA[index];
    if (!meta) return;
    setRows((prev) => {
      if (!prev) return prev;
      const next = prev.map((r, i) => (i === index ? { ...r, on: !r.on } : r));
      void setServiceEnabled(meta.name, next[index]?.on ?? false);
      return next;
    });
  };

  const pickOption = (index: number, option: string) => {
    const meta = METADATA[index];
    if (!meta) return;
    setRows((prev) => {
      if (!prev) return prev;
      const next = prev.map((r, i) => (i === index ? { ...r, option } : r));
      void setServiceOption(meta.name, option);
      return next;
    });
  };

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Services</h1>
          <div className="sub">
            Enable capabilities. Codvly handles the provider configuration.
          </div>
        </div>
      </div>

      <div className="list">
        {METADATA.map((r, i) => (
          <div className="row service-row" key={r.name}>
            <div className="rowleft">
              <r.icon size={15} strokeWidth={1.75} className="service-icon" />
              <div>
                <div className="service-name">{r.name}</div>
                <div className="service-desc">{r.desc}</div>
              </div>
            </div>
            {r.control === "toggle" ? (
              <button
                className={rows?.[i]?.on ? "toggle on" : "toggle"}
                onClick={() => toggle(i)}
                aria-label={`Toggle ${r.name}`}
              />
            ) : (
              <select
                className="select"
                value={rows?.[i]?.option ?? r.options?.[0]}
                onChange={(e) => pickOption(i, e.target.value)}
              >
                {r.options?.map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
