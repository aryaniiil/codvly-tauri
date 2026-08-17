import { WindowControls } from "./WindowControls";

export function WindowChrome() {
  return (
    <div className="window-chrome" data-tauri-drag-region>
      <WindowControls />
    </div>
  );
}
