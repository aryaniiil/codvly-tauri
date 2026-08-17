interface AiFloatProps {
  open: boolean;
  onClose: () => void;
  onRun: () => void;
}

export function AiFloat({ open, onClose, onRun }: AiFloatProps) {
  if (!open) return null;
  return (
    <div className="ai-float">
      <div className="ai-float-head">
        <b>Project agent</b>
        <span className="provider">DeepSeek V4 Flash · Free</span>
      </div>
      <div className="ai-float-body">
        <p className="ai-blurb">
          I can modify code, inspect your project, configure connected
          services, or prepare a deployment plan.
        </p>
        <div className="ai-prompt">
          Add Google login and configure the required environment variables...
        </div>
        <div className="ai-actions">
          <button className="toolbtn" onClick={onClose}>
            Close
          </button>
          <button className="deploybtn" onClick={onRun}>
            Run
          </button>
        </div>
      </div>
    </div>
  );
}