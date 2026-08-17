import { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { listServices } from "../lib/db";

interface OverviewProps {
  projectName: string;
  onDeploy: () => void;
}

const STATS = [
  { title: "Frontend", status: "Live", provider: "Vercel · Next.js" },
  { title: "Backend", status: "Live", provider: "Railway · Node 22" },
  { title: "Database", status: "Connected", provider: "Supabase · PostgreSQL" },
];

const SERVICE_TAGS: Record<string, string> = {
  "Google Authentication": "Google",
  "GitHub Authentication": "GitHub",
  "Database": "SQL",
  "Push Notifications": "Firebase FCM",
  "Object Storage": "Storage",
  "Custom Domain": "DNS",
};

const FALLBACK_SERVICES = [
  "Google Authentication",
  "GitHub Authentication",
  "Push Notifications",
  "Object Storage",
];

const ACTIVITY = [
  { text: "Production deployment completed", time: "2 min ago" },
  { text: "Firebase FCM credentials synced", time: "18 min ago" },
  { text: "Google OAuth redirect updated", time: "31 min ago" },
  { text: "Database migration applied", time: "1 hr ago" },
];

export function Overview({ projectName, onDeploy }: OverviewProps) {
  const [connected, setConnected] = useState<string[] | null>(null);

  useEffect(() => {
    listServices().then((services) => {
      const enabled = services.filter((s) => s.enabled === 1).map((s) => s.name);
      setConnected(enabled.length > 0 ? enabled : FALLBACK_SERVICES);
    });
  }, []);

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Overview</h1>
          <div className="sub">{projectName} · production</div>
        </div>
        <button className="deploybtn" onClick={onDeploy}>
          Deploy
        </button>
      </div>

      <div className="grid3">
        {STATS.map((s) => (
          <div className="card stat" key={s.title}>
            <div className="stat-head">
              <span className="stat-title">{s.title}</span>
              <span className="status">
                <i className="dot" /> {s.status}
              </span>
            </div>
            <div className="provider">{s.provider}</div>
          </div>
        ))}
      </div>

      <div className="section">
        <div className="section-label">Connected services</div>
        <div className="list">
          {connected === null &&
            FALLBACK_SERVICES.map((name) => (
              <div className="row" key={name}>
                <div className="rowleft">
                  <CheckCircle2 size={15} strokeWidth={2} className="check" />
                  <span>{name}</span>
                </div>
                <span className="tag">{SERVICE_TAGS[name] ?? "Service"}</span>
              </div>
            ))}
          {connected?.map((name) => (
            <div className="row" key={name}>
              <div className="rowleft">
                <CheckCircle2 size={15} strokeWidth={2} className="check" />
                <span>{name}</span>
              </div>
              <span className="tag">{SERVICE_TAGS[name] ?? "Service"}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="section">
        <div className="section-label">Recent activity</div>
        <div className="list">
          {ACTIVITY.map((a) => (
            <div className="row" key={a.text}>
              <span>{a.text}</span>
              <span className="time">{a.time}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
