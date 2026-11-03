
import { useEffect, useState } from "react";
import {
  Atom,
  Palette,
  SlidersHorizontal,
  Cpu,
  Database,
  Download,
  RotateCcw,
  CheckCircle2,
  Settings as SettingsIcon,
  Save,
} from "lucide-react";

import "./Settings.css";

type SettingsData = {
  workspaceName: string;
  appearance: string;
  accent: string;
  animations: boolean;
  showFormula: boolean;
  autoSave: boolean;
  calculationMethod: string;
  precision: string;
};

const STORAGE_KEY = "moleculelab.settings.v1";

const defaultSettings: SettingsData = {
  workspaceName: "MoleculeLab",
  appearance: "Dark",
  accent: "Violet",
  animations: true,
  showFormula: true,
  autoSave: true,
  calculationMethod: "DFT",
  precision: "High",
};

function loadSettings(): SettingsData {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (saved) {
      return { ...defaultSettings, ...JSON.parse(saved) };
    }
  } catch (error) {
    console.error("Unable to load settings:", error);
  }

  return defaultSettings;
}

export default function Settings() {
  const [settings, setSettings] = useState<SettingsData>(loadSettings);
  const [savedMessage, setSavedMessage] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error("Unable to save settings:", error);
    }
  }, [settings]);

  const updateSetting = <K extends keyof SettingsData>(
    key: K,
    value: SettingsData[K]
  ) => {
    setSettings((previous) => ({
      ...previous,
      [key]: value,
    }));

    setSavedMessage(false);
  };

  const saveSettings = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      setSavedMessage(true);
      window.setTimeout(() => setSavedMessage(false), 2500);
    } catch (error) {
      console.error("Unable to save settings:", error);
    }
  };

  const restoreDefaults = () => {
    setSettings({ ...defaultSettings });
    setSavedMessage(false);
  };

  const exportSettings = () => {
    const researchElements = localStorage.getItem(
      "moleculelab.research.elements.v1"
    );

    const researchHistory = localStorage.getItem(
      "moleculelab.research.history.v1"
    );

    const exportData = {
      application: "MoleculeLab",
      exportedAt: new Date().toISOString(),
      settings,
      researchElements: researchElements
        ? JSON.parse(researchElements)
        : [],
      researchHistory: researchHistory
        ? JSON.parse(researchHistory)
        : [],
    };

    const blob = new Blob(
      [JSON.stringify(exportData, null, 2)],
      { type: "application/json" }
    );

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "moleculelab-settings-backup.json";
    link.click();

    URL.revokeObjectURL(url);
  };

  return (
    <div className="page-content settings-page">
      <div className="settings-ambient" />

      <div className="settings-header">
        <div>
          <div className="settings-eyebrow">
            <SettingsIcon size={15} />
            LABORATORY CONFIGURATION
          </div>

          <h1>Laboratory Settings</h1>

          <p>
            Configure your MoleculeLab workspace, scientific
            preferences and laboratory environment.
          </p>
        </div>

        <button
          className="settings-save-button"
          onClick={saveSettings}
        >
          {savedMessage ? (
            <CheckCircle2 size={17} />
          ) : (
            <Save size={17} />
          )}
          {savedMessage ? "Saved" : "Save Settings"}
        </button>
      </div>

      <div className="settings-layout">
        <main className="settings-main">

          {/* WORKSPACE SETTINGS */}
          <section className="settings-card">
            <div className="settings-section-heading">
              <div className="settings-icon">
                <Atom size={20} />
              </div>

              <div>
                <h2>Workspace</h2>
                <p>Manage your laboratory identity.</p>
              </div>
            </div>

            <div className="settings-field">
              <label>Workspace Name</label>

              <input
                type="text"
                value={settings.workspaceName}
                onChange={(event) =>
                  updateSetting("workspaceName", event.target.value)
                }
                placeholder="Enter workspace name"
              />
            </div>
          </section>

          {/* APPEARANCE */}
          <section className="settings-card">
            <div className="settings-section-heading">
              <div className="settings-icon">
                <Palette size={20} />
              </div>

              <div>
                <h2>Appearance</h2>
                <p>Choose your preferred visual environment.</p>
              </div>
            </div>

            <div className="settings-field">
              <label>Interface Theme</label>

              <select
                value={settings.appearance}
                onChange={(event) =>
                  updateSetting("appearance", event.target.value)
                }
              >
                <option value="Dark">Dark</option>
                <option value="Light">Light</option>
                <option value="System">System Default</option>
              </select>
            </div>

            <div className="settings-field">
              <label>Accent Colour</label>

              <select
                value={settings.accent}
                onChange={(event) =>
                  updateSetting("accent", event.target.value)
                }
              >
                <option value="Violet">Nebula Violet</option>
                <option value="Cyan">Electric Cyan</option>
                <option value="Blue">Cosmic Blue</option>
                <option value="Pink">Stellar Pink</option>
                <option value="Teal">Aurora Teal</option>
              </select>
            </div>
          </section>

          {/* INTERFACE PREFERENCES */}
          <section className="settings-card">
            <div className="settings-section-heading">
              <div className="settings-icon">
                <SlidersHorizontal size={20} />
              </div>

              <div>
                <h2>Interface Preferences</h2>
                <p>Control your workspace behaviour.</p>
              </div>
            </div>

            <div className="settings-toggle-row">
              <div>
                <h3>Interface Animations</h3>
                <p>Enable visual transitions and animations.</p>
              </div>

              <input
                type="checkbox"
                checked={settings.animations}
                onChange={(event) =>
                  updateSetting("animations", event.target.checked)
                }
              />
            </div>

            <div className="settings-toggle-row">
              <div>
                <h3>Display Molecular Formulas</h3>
                <p>Prefer showing molecular formulas in the workspace.</p>
              </div>

              <input
                type="checkbox"
                checked={settings.showFormula}
                onChange={(event) =>
                  updateSetting("showFormula", event.target.checked)
                }
              />
            </div>

            <div className="settings-toggle-row">
              <div>
                <h3>Research Auto-save</h3>
                <p>Enable the research auto-save preference.</p>
              </div>

              <input
                type="checkbox"
                checked={settings.autoSave}
                onChange={(event) =>
                  updateSetting("autoSave", event.target.checked)
                }
              />
            </div>
          </section>

          {/* COMPUTATIONAL SETTINGS */}
          <section className="settings-card">
            <div className="settings-section-heading">
              <div className="settings-icon">
                <Cpu size={20} />
              </div>

              <div>
                <h2>Computational Chemistry</h2>
                <p>Set your preferred calculation defaults.</p>
              </div>
            </div>

            <div className="settings-field">
              <label>Default Calculation Method</label>

              <select
                value={settings.calculationMethod}
                onChange={(event) =>
                  updateSetting("calculationMethod", event.target.value)
                }
              >
                <option value="DFT">Density Functional Theory (DFT)</option>
                <option value="Hartree-Fock">Hartree-Fock</option>
                <option value="Molecular Mechanics">Molecular Mechanics</option>
                <option value="Choose when running">Choose when running</option>
              </select>
            </div>

            <div className="settings-field">
              <label>Calculation Precision</label>

              <select
                value={settings.precision}
                onChange={(event) =>
                  updateSetting("precision", event.target.value)
                }
              >
                <option value="Standard">Standard</option>
                <option value="High">High</option>
                <option value="Very High">Very High</option>
              </select>
            </div>
          </section>

          {/* DATA MANAGEMENT */}
          <section className="settings-card">
            <div className="settings-section-heading">
              <div className="settings-icon">
                <Database size={20} />
              </div>

              <div>
                <h2>Data Management</h2>
                <p>Manage your locally stored preferences and research.</p>
              </div>
            </div>

            <div className="settings-data-actions">
              <div>
                <h3>Export Laboratory Data</h3>
                <p>
                  Download your settings, saved elements and
                  research activity as a JSON backup.
                </p>
              </div>

              <button
                className="settings-secondary-button"
                onClick={exportSettings}
              >
                <Download size={16} />
                Export Data
              </button>
            </div>

            <div className="settings-data-actions">
              <div>
                <h3>Restore Default Settings</h3>
                <p>
                  Reset your preferences to their original values.
                </p>
              </div>

              <button
                className="settings-reset-button"
                onClick={restoreDefaults}
              >
                <RotateCcw size={16} />
                Restore Defaults
              </button>
            </div>
          </section>
        </main>

        {/* SETTINGS SUMMARY */}
        <aside className="settings-sidebar">
          <div className="settings-card settings-summary">
            <div className="settings-section-heading">
              <div className="settings-icon">
                <CheckCircle2 size={20} />
              </div>

              <div>
                <h2>Current Configuration</h2>
                <p>Your saved preferences.</p>
              </div>
            </div>

            <div className="settings-summary-item">
              <span>Workspace</span>
              <strong>{settings.workspaceName || "MoleculeLab"}</strong>
            </div>

            <div className="settings-summary-item">
              <span>Theme</span>
              <strong>{settings.appearance}</strong>
            </div>

            <div className="settings-summary-item">
              <span>Accent</span>
              <strong>{settings.accent}</strong>
            </div>

            <div className="settings-summary-item">
              <span>Calculation</span>
              <strong>{settings.calculationMethod}</strong>
            </div>

            <div className="settings-summary-item">
              <span>Precision</span>
              <strong>{settings.precision}</strong>
            </div>

            <div className="settings-status">
              <CheckCircle2 size={16} />
              Preferences stored locally
            </div>
          </div>

          <div className="settings-info-card">
            <Atom size={22} />
            <h3>MoleculeLab</h3>
            <p>
              Your molecular science workspace. Configure your
              environment and keep your research organised.
            </p>
          </div>
        </aside>
      </div>

      <p className="settings-disclaimer">
        Note: These preferences are stored locally in your browser.
        Theme, animation, and computational defaults are configuration
        preferences; they do not yet control the global application
        theme or calculation engine.
      </p>
    </div>
  );
}
