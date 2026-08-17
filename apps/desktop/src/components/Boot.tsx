import codvlyMark from "../assets/codvly-mark.svg";
import { WindowChrome } from "./WindowChrome";

export function Boot() {
  return (
    <section className="screen boot">
      <WindowChrome />
      <div className="boot-inner">
        <img className="logo" src={codvlyMark} alt="codvly" />
        <div className="boot-name">codvly</div>
        <div className="boot-status">Starting workspace</div>
        <div className="progress">
          <i />
        </div>
      </div>
    </section>
  );
}