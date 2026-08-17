import { useState } from "react";
import { StackIcon } from "./StackIcon";
import { WindowChrome } from "./WindowChrome";
import codvlyMark from "../assets/codvly-mark.svg";
import { createSession, makeId, type SessionAccount } from "../lib/session";

const CONTOUR_PATHS = [
  "M0 260 C110 170 160 90 285 70 C390 53 440 10 500 0",
  "M0 290 C120 195 175 120 292 98 C390 79 447 32 500 20",
  "M0 320 C130 220 185 150 302 126 C398 106 455 58 500 43",
  "M0 350 C135 247 198 180 311 154 C407 132 462 84 500 66",
  "M0 380 C145 275 208 208 321 181 C415 158 469 111 500 91",
  "M0 410 C150 305 220 237 330 209 C423 185 475 139 500 117",
];

function Contour({ className, paths }: { className: string; paths: number }) {
  return (
    <div className={`contour ${className}`}>
      <svg viewBox="0 0 500 500" aria-hidden>
        {CONTOUR_PATHS.slice(0, paths).map((d, i) => (
          <path key={i} d={d} />
        ))}
      </svg>
    </div>
  );
}

interface AuthProps {
  onEnter: (account: SessionAccount) => void;
}

export function Auth({ onEnter }: AuthProps) {
  const [connecting, setConnecting] = useState<string | null>(null);
  const [email, setEmail] = useState("");

  const login = (provider: string) => {
    if (connecting) return;
    setConnecting(provider === "Email" ? "Opening workspace…" : `Connecting to ${provider}…`);
    const accountEmail =
      provider === "Email" && email.trim()
        ? email.trim()
        : `${provider.toLowerCase()}@codvly.local`;
    // Optimistic sign-in: access is granted immediately. Session persistence
    // (keychain + SQLite) is best-effort and must never block the flow.
    const account: SessionAccount = {
      id: makeId(),
      name: "Aryanil",
      email: accountEmail,
      provider,
    };
    createSession(provider, accountEmail, "Aryanil").catch((err) => {
      console.warn("session persistence failed, continuing without it:", err);
    });
    window.setTimeout(() => {
      setConnecting(null);
      onEnter(account);
    }, 900);
  };

  return (
    <div className="auth-page">
      <WindowChrome />
      <div className="grid" />
      <div className="grid-small" />
      <div className="center-fade" />

      <Contour className="tl" paths={6} />
      <Contour className="br" paths={6} />
      <Contour className="tr" paths={4} />
      <Contour className="bl" paths={4} />

      <div className="cross c1" />
      <div className="cross c2" />

      <div className="tech t1">CODVLY / AUTH_01</div>
      <div className="tech t2">
        SYSTEM ONLINE
        <br />
        REGION: GLOBAL
      </div>
      <div className="tech t3">BUILD 0.1.0</div>
      <div className="tech t4">SECURE CONNECTION</div>

      <main className="auth">
        <img className="logo" src={codvlyMark} alt="codvly" />

        <div className="kicker">DEVELOPER INFRASTRUCTURE</div>

        <h1>Welcome to codvly</h1>
        <div className="subtitle">Your development environment, simplified.</div>

        <div className="panel">
          <button className="oauth" onClick={() => login("GitHub")}>
            <StackIcon slug="github" size={15} title="GitHub" />
            {connecting === "Connecting to GitHub…" ? "Connecting to GitHub…" : "Continue with GitHub"}
          </button>

          <button className="oauth" onClick={() => login("Google")}>
            <StackIcon slug="google" size={15} title="Google" />
            {connecting === "Connecting to Google…" ? "Connecting to Google…" : "Continue with Google"}
          </button>

          <div className="divider">OR</div>

          <input
            className="input"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") login("Email");
            }}
          />
          <button className="continue" onClick={() => login("Email")}>
            {connecting === "Opening workspace…" ? "Opening workspace…" : "Continue"}
          </button>

          <div className="note">
            By continuing, you agree to the codvly terms and privacy policy.
          </div>
        </div>
      </main>

      <footer className="footer">
        CODVLY <span>·</span> INFRASTRUCTURE / DEVELOPER TOOLS <span>·</span> © 2026
      </footer>
    </div>
  );
}