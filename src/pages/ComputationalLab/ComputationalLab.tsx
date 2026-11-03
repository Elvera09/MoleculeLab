import { useEffect, useState } from "react";
import {
  Atom,
  FlaskConical,
  Cpu,
  Settings2,
  Database,
  Plus,
  Trash2,
  Download,
  Clock,
  CheckCircle2,
  CircleAlert,
  Beaker,
  Layers3,
  Zap,
} from "lucide-react";
import "./ComputationalLab.css";

type CalculationJob = {
  id: string;
  molecule: string;
  smiles: string;
  method: string;
  basisSet: string;
  charge: number;
  multiplicity: number;
  createdAt: string;
  status: "Draft";
};

const STORAGE_KEY = "moleculelab.computational.jobs.v1";

const presets = [
  { name: "Water", formula: "H₂O", smiles: "O" },
  { name: "Methane", formula: "CH₄", smiles: "C" },
  { name: "Ethanol", formula: "C₂H₆O", smiles: "CCO" },
  { name: "Benzene", formula: "C₆H₆", smiles: "c1ccccc1" },
  { name: "Caffeine", formula: "C₈H₁₀N₄O₂", smiles: "Cn1c(=O)c2c(ncn2C)n(C)c1=O" },
  { name: "Glucose", formula: "C₆H₁₂O₆", smiles: "C(C1C(C(C(C(O1)O)O)O)O)O" },
];

function loadJobs(): CalculationJob[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

export default function ComputationalLab() {
  const [molecule, setMolecule] = useState("");
  const [smiles, setSmiles] = useState("");
  const [method, setMethod] = useState("DFT");
  const [basisSet, setBasisSet] = useState("6-31G(d)");
  const [charge, setCharge] = useState(0);
  const [multiplicity, setMultiplicity] = useState(1);
  const [jobs, setJobs] = useState<CalculationJob[]>(loadJobs);
  const [message, setMessage] = useState("");

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(jobs));
  }, [jobs]);

  const selectPreset = (preset: typeof presets[number]) => {
    setMolecule(preset.name);
    setSmiles(preset.smiles);
    setCharge(0);
    setMultiplicity(1);
    setMessage("");
  };

  const prepareJob = () => {
    if (!molecule.trim()) {
      setMessage("Please enter a molecule name.");
      return;
    }

    if (!smiles.trim()) {
      setMessage("Please enter a SMILES structure.");
      return;
    }

    if (!Number.isInteger(charge)) {
      setMessage("Charge must be a whole number.");
      return;
    }

    if (!Number.isInteger(multiplicity) || multiplicity < 1) {
      setMessage("Multiplicity must be a positive whole number.");
      return;
    }

    const newJob: CalculationJob = {
      id: crypto.randomUUID(),
      molecule: molecule.trim(),
      smiles: smiles.trim(),
      method,
      basisSet: method === "Molecular Mechanics" ? "Not applicable" : basisSet,
      charge,
      multiplicity,
      createdAt: new Date().toISOString(),
      status: "Draft",
    };

    setJobs((previous) => [newJob, ...previous]);
    setMessage("Calculation setup saved successfully.");
  };

  const deleteJob = (id: string) => {
    setJobs((previous) => previous.filter((job) => job.id !== id));
  };

  const exportJobs = () => {
    const data = {
      application: "MoleculeLab",
      section: "Computational Chemistry Lab",
      exportedAt: new Date().toISOString(),
      calculationSetups: jobs,
    };

    const blob = new Blob(
      [JSON.stringify(data, null, 2)],
      { type: "application/json" }
    );

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "moleculelab-computational-jobs.json";
    link.click();

    URL.revokeObjectURL(url);
  };

  const clearForm = () => {
    setMolecule("");
    setSmiles("");
    setMethod("DFT");
    setBasisSet("6-31G(d)");
    setCharge(0);
    setMultiplicity(1);
    setMessage("");
  };

  return (
    <div className="page-content computational-page">

      <div className="comp-ambient comp-ambient-one" />
      <div className="comp-ambient comp-ambient-two" />

      {/* HEADER */}
      <header className="comp-header">
        <div>
          <div className="comp-eyebrow">
            <span className="comp-live-dot" />
            MOLECULELAB / SCIENTIFIC COMPUTATION
          </div>

          <h1>Computational <span>Lab.</span></h1>

          <p>
            Configure molecular calculations, explore computational
            methods and organise your scientific workflows.
          </p>
        </div>

        <div className="comp-header-icon">
          <FlaskConical size={34} />
          <span>LAB 001</span>
        </div>
      </header>

      {/* STATUS CARDS */}
      <section className="comp-stats">
        <div className="comp-stat-card">
          <span className="comp-stat-icon cyan">
            <Database size={19} />
          </span>
          <div>
            <small>SAVED SETUPS</small>
            <strong>{jobs.length}</strong>
          </div>
        </div>

        <div className="comp-stat-card">
          <span className="comp-stat-icon violet">
            <Cpu size={19} />
          </span>
          <div>
            <small>COMPUTATION ENGINE</small>
            <strong>Not connected</strong>
          </div>
        </div>

        <div className="comp-stat-card">
          <span className="comp-stat-icon pink">
            <Layers3 size={19} />
          </span>
          <div>
            <small>AVAILABLE METHODS</small>
            <strong>3 methods</strong>
          </div>
        </div>
      </section>

      {/* MAIN WORKSPACE */}
      <div className="comp-workspace">

        <main className="comp-main">

          {/* MOLECULAR INPUT */}
          <section className="comp-panel">

            <div className="comp-section-heading">
              <span className="comp-section-icon">
                <Atom size={21} />
              </span>

              <div>
                <h2>Molecular Input</h2>
                <p>Define the molecule for your computational study.</p>
              </div>

              <span className="comp-step">01</span>
            </div>

            <div className="comp-field">
              <label>Molecule Name</label>
              <input
                value={molecule}
                onChange={(e) => setMolecule(e.target.value)}
                placeholder="Example: Benzene"
              />
            </div>

            <div className="comp-field">
              <label>SMILES Representation</label>
              <textarea
                value={smiles}
                onChange={(e) => setSmiles(e.target.value)}
                placeholder="Enter molecular SMILES..."
                rows={3}
              />
              <small>
                SMILES describes the molecular connectivity and structure.
              </small>
            </div>

            <div className="comp-presets-heading">
              <span>QUICK MOLECULE PRESETS</span>
              <span>SELECT TO LOAD</span>
            </div>

            <div className="comp-presets">
              {presets.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  className={`comp-preset ${
                    molecule === preset.name ? "selected" : ""
                  }`}
                  onClick={() => selectPreset(preset)}
                >
                  <strong>{preset.formula}</strong>
                  <span>{preset.name}</span>
                </button>
              ))}
            </div>
          </section>

          {/* COMPUTATIONAL METHOD */}
          <section className="comp-panel">

            <div className="comp-section-heading">
              <span className="comp-section-icon violet">
                <Cpu size={21} />
              </span>

              <div>
                <h2>Computational Method</h2>
                <p>Select the theoretical approach for your study.</p>
              </div>

              <span className="comp-step">02</span>
            </div>

            <div className="comp-method-grid">

              <button
                type="button"
                className={`comp-method ${
                  method === "DFT" ? "active" : ""
                }`}
                onClick={() => setMethod("DFT")}
              >
                <span className="comp-method-icon cyan">
                  <Atom size={22} />
                </span>
                <strong>Density Functional Theory</strong>
                <small>DFT</small>
                <span className="comp-method-description">
                  Electronic structure calculations using electron density.
                </span>
              </button>

              <button
                type="button"
                className={`comp-method ${
                  method === "Hartree-Fock" ? "active" : ""
                }`}
                onClick={() => setMethod("Hartree-Fock")}
              >
                <span className="comp-method-icon violet">
                  <Layers3 size={22} />
                </span>
                <strong>Hartree–Fock</strong>
                <small>HF</small>
                <span className="comp-method-description">
                  An approximate quantum mechanical electronic structure method.
                </span>
              </button>

              <button
                type="button"
                className={`comp-method ${
                  method === "Molecular Mechanics" ? "active" : ""
                }`}
                onClick={() => setMethod("Molecular Mechanics")}
              >
                <span className="comp-method-icon pink">
                  <Zap size={22} />
                </span>
                <strong>Molecular Mechanics</strong>
                <small>MM</small>
                <span className="comp-method-description">
                  Classical force-field modelling of molecular systems.
                </span>
              </button>

            </div>

            {method !== "Molecular Mechanics" && (
              <div className="comp-field">
                <label>Basis Set</label>
                <select
                  value={basisSet}
                  onChange={(e) => setBasisSet(e.target.value)}
                >
                  <option value="STO-3G">STO-3G</option>
                  <option value="3-21G">3-21G</option>
                  <option value="6-31G">6-31G</option>
                  <option value="6-31G(d)">6-31G(d)</option>
                  <option value="6-31+G(d,p)">6-31+G(d,p)</option>
                  <option value="def2-SVP">def2-SVP</option>
                  <option value="def2-TZVP">def2-TZVP</option>
                </select>
              </div>
            )}
          </section>

          {/* SYSTEM SETTINGS */}
          <section className="comp-panel">

            <div className="comp-section-heading">
              <span className="comp-section-icon pink">
                <Settings2 size={21} />
              </span>

              <div>
                <h2>System Configuration</h2>
                <p>Define the electronic state of your molecular system.</p>
              </div>

              <span className="comp-step">03</span>
            </div>

            <div className="comp-config-grid">

              <div className="comp-field">
                <label>Net Molecular Charge</label>
                <input
                  type="number"
                  step="1"
                  value={charge}
                  onChange={(e) => setCharge(Number(e.target.value))}
                />
                <small>Neutral molecules have charge 0.</small>
              </div>

              <div className="comp-field">
                <label>Spin Multiplicity</label>
                <select
                  value={multiplicity}
                  onChange={(e) => setMultiplicity(Number(e.target.value))}
                >
                  <option value={1}>1 — Singlet</option>
                  <option value={2}>2 — Doublet</option>
                  <option value={3}>3 — Triplet</option>
                  <option value={4}>4 — Quartet</option>
                  <option value={5}>5 — Quintet</option>
                  <option value={6}>6 — Sextet</option>
                </select>
                <small>Choose the intended electronic spin state.</small>
              </div>

            </div>

            <div className="comp-info-note">
              <CircleAlert size={17} />
              <span>
                Ensure the charge and multiplicity are chemically
                appropriate for the molecule before running a calculation.
              </span>
            </div>
          </section>

          {/* ACTIONS */}
          <section className="comp-actions">
            <button
              className="comp-clear-button"
              type="button"
              onClick={clearForm}
            >
              Clear Form
            </button>

            <button
              className="comp-prepare-button"
              type="button"
              onClick={prepareJob}
            >
              <Plus size={17} />
              Save Calculation Setup
            </button>
          </section>

          {message && (
            <div className="comp-message">
              <CheckCircle2 size={17} />
              {message}
            </div>
          )}

        </main>

        {/* RIGHT SIDEBAR */}
        <aside className="comp-sidebar">

          <section className="comp-panel comp-summary">
            <div className="comp-section-heading">
              <span className="comp-section-icon">
                <Beaker size={20} />
              </span>

              <div>
                <h2>Calculation Summary</h2>
                <p>Current configuration.</p>
              </div>
            </div>

            <div className="comp-summary-item">
              <span>Molecule</span>
              <strong>{molecule || "Not selected"}</strong>
            </div>

            <div className="comp-summary-item">
              <span>Method</span>
              <strong>{method}</strong>
            </div>

            <div className="comp-summary-item">
              <span>Basis Set</span>
              <strong>
                {method === "Molecular Mechanics" ? "N/A" : basisSet}
              </strong>
            </div>

            <div className="comp-summary-item">
              <span>Charge</span>
              <strong>{charge}</strong>
            </div>

            <div className="comp-summary-item">
              <span>Multiplicity</span>
              <strong>{multiplicity}</strong>
            </div>

            <div className="comp-engine-status">
              <span className="comp-status-dot" />
              Engine not connected
            </div>
          </section>

          <section className="comp-panel comp-guide">
            <span className="comp-guide-icon">
              <FlaskConical size={23} />
            </span>

            <h3>Scientific Workflow</h3>

            <p>
              Prepare your molecular system, choose a method,
              configure its electronic state and save the setup.
            </p>

            <div className="comp-guide-step">
              <span>01</span> Molecular input
            </div>

            <div className="comp-guide-step">
              <span>02</span> Method selection
            </div>

            <div className="comp-guide-step">
              <span>03</span> System configuration
            </div>

            <div className="comp-guide-step">
              <span>04</span> Save calculation setup
            </div>
          </section>

        </aside>
      </div>

      {/* SAVED JOBS */}
      <section className="comp-panel comp-history">

        <div className="comp-section-heading">
          <span className="comp-section-icon">
            <Clock size={21} />
          </span>

          <div>
            <h2>Calculation Workspace</h2>
            <p>Your saved calculation configurations.</p>
          </div>

          <button
            className="comp-export-button"
            type="button"
            onClick={exportJobs}
            disabled={jobs.length === 0}
          >
            <Download size={16} />
            Export
          </button>
        </div>

        {jobs.length === 0 ? (
          <div className="comp-empty">
            <div className="comp-empty-icon">
              <Atom size={29} />
            </div>

            <h3>No calculation setups yet</h3>

            <p>
              Configure a molecule above and save your first
              computational setup.
            </p>
          </div>
        ) : (
          <div className="comp-job-list">
            {jobs.map((job) => (
              <article className="comp-job-card" key={job.id}>

                <div className="comp-job-molecule">
                  <Atom size={22} />
                </div>

                <div className="comp-job-details">
                  <strong>{job.molecule}</strong>
                  <span>{job.smiles}</span>
                  <small>
                    {job.method} · {job.basisSet}
                  </small>
                  <small>
                    Charge: {job.charge} · Multiplicity: {job.multiplicity}
                  </small>
                </div>

                <div className="comp-job-status">
                  <span>Draft</span>
                  <small>
                    {new Date(job.createdAt).toLocaleDateString()}
                  </small>
                </div>

                <button
                  className="comp-delete-button"
                  type="button"
                  onClick={() => deleteJob(job.id)}
                  aria-label={`Delete ${job.molecule} setup`}
                >
                  <Trash2 size={17} />
                </button>

              </article>
            ))}
          </div>
        )}

      </section>

      <footer className="comp-footer">
        <span>MOLECULELAB · COMPUTATIONAL CHEMISTRY</span>
        <span>SCIENTIFIC WORKSPACE / 001</span>
      </footer>

    </div>
  );
}