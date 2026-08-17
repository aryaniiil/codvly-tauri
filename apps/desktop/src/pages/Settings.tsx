import { useEffect, useState } from "react";
import { getSettings, setSetting } from "../lib/db";

interface SettingsProps {
  projectName: string;
  onToast: (message: string) => void;
}

const SECTIONS = ["General", "Environment", "Git", "Providers", "Danger zone"];

interface SettingsValues {
  project_name: string;
  git_repo: string;
  prod_branch: string;
}

const DEFAULTS: SettingsValues = {
  project_name: "",
  git_repo: "",
  prod_branch: "main",
};

export function Settings({ projectName, onToast }: SettingsProps) {
  const [section, setSection] = useState("General");
  const [values, setValues] = useState<SettingsValues>(DEFAULTS);

  useEffect(() => {
    getSettings().then((stored) => {
      setValues({
        project_name: stored.project_name ?? DEFAULTS.project_name,
        git_repo: stored.git_repo ?? DEFAULTS.git_repo,
        prod_branch: stored.prod_branch ?? DEFAULTS.prod_branch,
      });
    });
  }, []);

  const set = (key: string, value: string) =>
    setValues((prev) => ({ ...prev, [key]: value }));

  const save = () => {
    void setSetting("project_name", values.project_name);
    void setSetting("git_repo", values.git_repo);
    void setSetting("prod_branch", values.prod_branch);
    onToast("Settings saved");
  };

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Settings</h1>
          <div className="sub">Project configuration</div>
        </div>
      </div>
      <div className="settings">
        <div className="settings-nav">
          {SECTIONS.map((s) => (
            <div
              key={s}
              className={section === s ? "active" : ""}
              onClick={() => setSection(s)}
            >
              {s}
            </div>
          ))}
        </div>
        <div className="settings-panel">
          <div className="field">
            <label>Project name</label>
            <input
              className="input"
              value={values.project_name}
              placeholder={projectName}
              onChange={(e) => set("project_name", e.target.value)}
            />
            <small>Shown throughout the codvly workspace.</small>
          </div>
          <div className="field">
            <label>Git repository</label>
            <input
              className="input"
              value={values.git_repo}
              placeholder="https://github.com/codvly/your-project"
              onChange={(e) => set("git_repo", e.target.value)}
            />
            <small>Connected through GitHub OAuth.</small>
          </div>
          <div className="field">
            <label>Production branch</label>
            <input
              className="input"
              value={values.prod_branch}
              onChange={(e) => set("prod_branch", e.target.value)}
            />
          </div>
          <div className="field">
            <button className="primary" onClick={save}>
              Save changes
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
