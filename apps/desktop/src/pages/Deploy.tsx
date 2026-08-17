import { Layers, Triangle } from "lucide-react";

interface DeployProps {
  onDeployed: () => void;
}

export function Deploy({ onDeployed }: DeployProps) {
  return (
    <>
      <div className="page-head">
        <div>
          <h1>Deploy</h1>
          <div className="sub">Choose how codvly should compose this environment.</div>
        </div>
      </div>

      <div className="card detect">
        <div className="detect-title">Detected application</div>
        <div className="detect-meta">Next.js 16 · Node 22 · GitHub · package manager: pnpm</div>
      </div>

      <div className="option-title">Frontend</div>
      <div className="option">
        <div className="option-left">
          <div className="option-icon">
            <Triangle size={16} strokeWidth={1.5} fill="currentColor" />
          </div>
          <div>
            <div className="option-name">Vercel</div>
            <div className="option-desc">
              Next.js optimized · preview deployments · generous free tier
            </div>
          </div>
        </div>
        <span className="recommended">Recommended</span>
      </div>

      <div className="option-title">Backend</div>
      <div className="option">
        <div className="option-left">
          <div className="option-icon">R</div>
          <div>
            <div className="option-name">Railway</div>
            <div className="option-desc">Automatic build and deployment · Railpack</div>
          </div>
        </div>
        <select className="select">
          <option>Railway</option>
          <option>AWS</option>
          <option>Docker</option>
        </select>
      </div>

      <div className="option-title">Database</div>
      <div className="option">
        <div className="option-left">
          <div className="option-icon">
            <SupabaseMark />
          </div>
          <div>
            <div className="option-name">Supabase</div>
            <div className="option-desc">PostgreSQL · Auth · Storage · Realtime</div>
          </div>
        </div>
        <span className="recommended">Recommended</span>
      </div>

      <div className="option-title">Plan</div>
      <div className="option">
        <div className="option-left">
          <div className="option-icon">
            <Layers size={16} strokeWidth={1.5} />
          </div>
          <div>
            <div className="option-name">Codvly optimized</div>
            <div className="option-desc">
              Uses the selected providers and minimizes unnecessary infrastructure.
            </div>
          </div>
        </div>
        <span className="tag">Estimated $0/mo</span>
      </div>

      <div className="deploy-footer">
        <button className="deploybtn" onClick={onDeployed}>
          Review & Deploy
        </button>
      </div>
    </>
  );
}

function SupabaseMark() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M20.55 1.59c-.17-.43-.62-.67-1.08-.6L8.75 2.17c-.27.03-.52.17-.68.39a1.14 1.14 0 0 0-.2.78l.87 5.39-6.05 6.84c-.37.41-.25 1.04.26 1.29.17.09.22.12.4.2.1.04.23.08.38.12.1.03.2.05.3.07l.04 0c.06.01.12.01.17 0 .4-.05.68-.2.75-.24l.1-.06 7.63-3.9a.65.65 0 0 1 .9.24c.03.05.09.11.16.21.24.34.74.37 1.05.08l7.05-4.53c.42-.27.58-.8.38-1.25L20.55 1.59Z" />
      <path d="M6.2 12.4c.44.5 1.18.56 1.72.2l4.87-3.28c.66-.44 1.46.09 1.46.91v10.44c0 1.01 1.1 1.68 1.99 1.16l.5-.28-9.38-9.2a.63.63 0 0 0-1.06.4v.56c0 .13.02.27.05.4l-.15-.3Z" opacity=".5" />
    </svg>
  );
}