
import { useMemo, useState, type FormEvent } from "react";
import { motion } from "motion/react";
import {
  Activity, AlertCircle, ArrowLeftRight, BarChart3, CheckCircle2,
  Database, Download, LoaderCircle, Plus, Search, Trash2, Printer,
  Save, FlaskConical
} from "lucide-react";

import {
  searchMolecule,
  type Molecule,
} from "../../services/pubchem";

import {
  analyzeSmiles,
  type RDKitAnalysis,
} from "../../services/rdkit";

import "./Analytics.css";

type Metric = {
  key: keyof Molecule;
  label: string;
  unit: string;
  description: string;
};

const METRICS: Metric[] = [
  { key: "MolecularWeight", label: "Molecular weight", unit: "g/mol", description: "Average molecular mass reported by PubChem." },
  { key: "ExactMass", label: "Exact mass", unit: "Da", description: "Monoisotopic mass reported by PubChem." },
  { key: "XLogP", label: "XLogP", unit: "", description: "Computed octanol/water partition coefficient reported by PubChem." },
  { key: "TPSA", label: "Topological polar surface area", unit: "Å²", description: "Polar surface area descriptor reported by PubChem." },
  { key: "HBondDonorCount", label: "H-bond donors", unit: "", description: "Hydrogen-bond donor count reported by PubChem." },
  { key: "HBondAcceptorCount", label: "H-bond acceptors", unit: "", description: "Hydrogen-bond acceptor count reported by PubChem." },
  { key: "Complexity", label: "Complexity", unit: "", description: "PubChem complexity score." },
  { key: "Charge", label: "Formal charge", unit: "", description: "Net formal charge reported by PubChem." },
];

const QUICK = ["Caffeine", "Aspirin", "Glucose", "Ibuprofen", "Paracetamol", "Nicotine"];

const numberValue = (m: Molecule, key: keyof Molecule): number | null => {
  const value = m[key];
  if (value === undefined || value === null || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const moleculeName = (m: Molecule) =>
  m.Title || m.SearchInput || m.IUPACName || `CID ${m.CID}`;

const displayValue = (m: Molecule, metric: Metric) => {
  const value = m[metric.key];
  if (value === undefined || value === null || value === "") return "Not reported";
  return `${value}${metric.unit ? ` ${metric.unit}` : ""}`;
};

const csvCell = (value: string | number) =>
  `"${String(value).replace(/"/g, '""')}"`;

export default function Analytics() {
  const [input, setInput] = useState("");
  const [items, setItems] = useState<Molecule[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [busyName, setBusyName] = useState("");
  const [selectedMetric, setSelectedMetric] =
    useState<keyof Molecule>("MolecularWeight");

  const [rdkitSmiles, setRdkitSmiles] = useState("CCO");
  const [rdkitResult, setRdkitResult] =
    useState<RDKitAnalysis | null>(null);
  const [rdkitLoading, setRdkitLoading] = useState(false);
  const [rdkitError, setRdkitError] = useState("");
  const [rdkitMoleculeName, setRdkitMoleculeName] =
    useState("Manual SMILES input");
  const [analysisSaved, setAnalysisSaved] = useState(false);

  async function calculateStructure(smiles: string, name: string) {
    if (!smiles.trim()) {
      setRdkitError("This molecule does not have a usable canonical SMILES.");
      return;
    }

    setRdkitSmiles(smiles);
    setRdkitMoleculeName(name);
    setRdkitLoading(true);
    setRdkitError("");
    setRdkitResult(null);
    setAnalysisSaved(false);

    try {
      const result = await analyzeSmiles(smiles);
      setRdkitResult(result);
    } catch (reason) {
      setRdkitError(
        reason instanceof Error
          ? reason.message
          : "RDKit analysis failed."
      );
    } finally {
      setRdkitLoading(false);
    }
  }

  async function runRDKitAnalysis(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await calculateStructure(rdkitSmiles, "Manual SMILES input");
  }

  function saveAnalysisToResearch() {
    if (!rdkitResult) return;

    try {
      const key = "moleculelab.research.history.v1";
      const existing = JSON.parse(
        localStorage.getItem(key) || "[]"
      );

      const record = {
        id: `${Date.now()}-rdkit`,
        title: "RDKit molecular analysis",
        detail: [
          `Molecule: ${rdkitMoleculeName}`,
          `Formula: ${rdkitResult.formula}`,
          `SMILES: ${rdkitResult.canonical_smiles}`,
          `Molecular weight: ${rdkitResult.molecular_weight} g/mol`,
          `Exact mass: ${rdkitResult.exact_mass} Da`,
          `LogP: ${rdkitResult.logp}`,
          `TPSA: ${rdkitResult.tpsa} Å²`,
          `H-bond donors: ${rdkitResult.h_bond_donors}`,
          `H-bond acceptors: ${rdkitResult.h_bond_acceptors}`,
          `Source: ${rdkitResult.source}`,
        ].join(" | "),
        createdAt: new Date().toISOString(),
      };

      localStorage.setItem(
        key,
        JSON.stringify([record, ...existing])
      );

      setAnalysisSaved(true);
    } catch {
      setRdkitError("Could not save the analysis to Research Workspace.");
    }
  }

  async function addMolecule(value: string) {
    const query = value.trim();

    if (!query) {
      setError("Enter a molecule name or PubChem identifier.");
      return;
    }

    if (items.length >= 4) {
      setError("You can compare up to four molecules at a time.");
      return;
    }

    setLoading(true);
    setBusyName(query);
    setError("");

    try {
      const result = await searchMolecule(query, "auto");

      setItems((current) =>
        current.some((m) => m.CID === result.CID)
          ? current
          : [...current, result]
      );

      setInput("");
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Could not retrieve this molecule."
      );
    } finally {
      setLoading(false);
      setBusyName("");
    }
  }

  const activeMetric =
    METRICS.find((metric) => metric.key === selectedMetric) ?? METRICS[0];

  const selectedValues = useMemo(
    () =>
      items.map((molecule) => ({
        molecule,
        value: numberValue(molecule, selectedMetric),
      })),
    [items, selectedMetric]
  );

  const availableValues = selectedValues
    .map((entry) => entry.value)
    .filter((value): value is number => value !== null);

  const minValue = availableValues.length
    ? Math.min(...availableValues)
    : null;

  const maxValue = availableValues.length
    ? Math.max(...availableValues)
    : null;

  const chartMetrics = useMemo(
    () =>
      METRICS.filter((metric) =>
        items.some((m) => numberValue(m, metric.key) !== null)
      ),
    [items]
  );

  function exportCsv() {
    if (!items.length) return;

    const rows = [
      ["Descriptor", ...items.map(moleculeName)],
      ...METRICS.map((metric) => [
        metric.label,
        ...items.map((molecule) => {
          const value = molecule[metric.key];
          return value === undefined || value === null || value === ""
            ? "Not reported"
            : String(value);
        }),
      ]),
    ];

    const csv = rows
      .map((row) => row.map(csvCell).join(","))
      .join("\r\n");

    const blob = new Blob(["\uFEFF", csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = "moleculelab-comparison.csv";

    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();

    URL.revokeObjectURL(url);
  }

  function exportPdf() {
    if (!items.length) return;
    window.print();
  }

  return (
    <div className="page analytics-page">
      <div className="analytics-eyebrow">
        <Activity size={14} />
        MOLECULAR INTELLIGENCE · ANALYTICS
      </div>

      <header className="analytics-heading">
        <div>
          <h1>Measure the <em>molecule.</em></h1>
          <p>
            Inspect physicochemical descriptors and compare
            source-reported molecular properties.
          </p>
        </div>
        <div className="analytics-status">
          <span /> PUBCHEM CONNECTED
        </div>
      </header>

      <section className="analytics-search panel">
        <div className="analytics-search-copy">
          <span className="section-kicker">BUILD A COMPARISON</span>
          <h2>Add molecules to your analysis</h2>
          <p>
            Search by compound name, formula, CID, SMILES or InChI.
          </p>
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            void addMolecule(input);
          }}
        >
          <Search size={18} />
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="e.g. caffeine, aspirin, C8H10N4O2"
            aria-label="Molecule to analyze"
          />
          <button disabled={loading || items.length >= 4}>
            {loading ? (
              <LoaderCircle className="analytics-spin" size={16} />
            ) : (
              <Plus size={16} />
            )}
            Add
          </button>
        </form>

        <div className="analytics-quick">
          <span>QUICK ADD</span>
          {QUICK.map((name) => (
            <button
              key={name}
              type="button"
              disabled={loading || items.length >= 4}
              onClick={() => void addMolecule(name)}
            >
              {name}
            </button>
          ))}
        </div>

        {loading && (
          <div className="analytics-loading">
            <LoaderCircle className="analytics-spin" size={16} />
            Retrieving {busyName} from PubChem…
          </div>
        )}

        {error && (
          <div className="analytics-error">
            <AlertCircle size={16} />
            {error}
          </div>
        )}
      </section>

      <section className="analytics-panel panel rdkit-panel">
        <div className="analytics-panel-title">
          <div>
            <span className="section-kicker">
              COMPUTATIONAL CHEMISTRY · RDKIT
            </span>
            <h2>RDKit molecular analysis</h2>
          </div>
          <span className="source-tag">
            <Activity size={13} /> Live calculation engine
          </span>
        </div>

        <p className="chart-note">
          Enter a SMILES structure or select a molecule from your
          comparison set to calculate molecular descriptors directly
          with the RDKit chemistry engine.
        </p>

        <form className="rdkit-form" onSubmit={runRDKitAnalysis}>
          <label htmlFor="rdkit-smiles">Molecular SMILES</label>

          <div className="rdkit-input-row">
            <input
              id="rdkit-smiles"
              value={rdkitSmiles}
              onChange={(event) => {
                setRdkitSmiles(event.target.value);
                setAnalysisSaved(false);
              }}
              placeholder="Example: CCO"
              spellCheck={false}
              autoComplete="off"
            />

            <button
              type="submit"
              disabled={rdkitLoading || !rdkitSmiles.trim()}
            >
              {rdkitLoading ? (
                <LoaderCircle className="analytics-spin" size={16} />
              ) : (
                <Activity size={16} />
              )}
              {rdkitLoading ? "Calculating…" : "Analyze structure"}
            </button>
          </div>

          <div className="rdkit-examples">
            <span>TRY:</span>
            <button
              type="button"
              onClick={() => {
                setRdkitSmiles("CCO");
                setRdkitError("");
                setRdkitMoleculeName("Ethanol");
              }}
            >
              Ethanol
            </button>
            <button
              type="button"
              onClick={() => {
                setRdkitSmiles("CC(=O)OC1=CC=CC=C1C(=O)O");
                setRdkitError("");
                setRdkitMoleculeName("Aspirin");
              }}
            >
              Aspirin
            </button>
            <button
              type="button"
              onClick={() => {
                setRdkitSmiles("Cn1c(=O)c2c(ncn2C)n(C)c1=O");
                setRdkitError("");
                setRdkitMoleculeName("Caffeine");
              }}
            >
              Caffeine
            </button>
          </div>
        </form>

        {items.length > 0 && (
          <div className="rdkit-examples">
            <span>ANALYSE COMPARISON MOLECULE:</span>
            {items.map((molecule) => (
              <button
                key={molecule.CID}
                type="button"
                disabled={rdkitLoading || !molecule.CanonicalSMILES}
                onClick={() =>
                  void calculateStructure(
                    molecule.CanonicalSMILES,
                    moleculeName(molecule)
                  )
                }
              >
                <FlaskConical size={13} />
                {moleculeName(molecule)}
              </button>
            ))}
          </div>
        )}

        {rdkitError && (
          <div className="analytics-error">
            <AlertCircle size={16} />
            {rdkitError}
          </div>
        )}

        {rdkitResult && (
          <div className="rdkit-results">
            <div className="rdkit-result-heading">
              <div>
                <span className="section-kicker">
                  CALCULATION COMPLETE
                </span>
                <h3>{rdkitMoleculeName} · {rdkitResult.formula}</h3>
                <p>
                  Canonical SMILES:{" "}
                  <code>{rdkitResult.canonical_smiles}</code>
                </p>
              </div>
              <span className="source-tag">
                <CheckCircle2 size={13} />
                {rdkitResult.source}
              </span>
            </div>

            <div className="rdkit-property-grid">
              {[
                ["Molecular weight", `${rdkitResult.molecular_weight} g/mol`],
                ["Exact mass", `${rdkitResult.exact_mass} Da`],
                ["LogP", rdkitResult.logp],
                ["TPSA", `${rdkitResult.tpsa} Å²`],
                ["H-bond donors", rdkitResult.h_bond_donors],
                ["H-bond acceptors", rdkitResult.h_bond_acceptors],
                ["Rotatable bonds", rdkitResult.rotatable_bonds],
                ["Ring count", rdkitResult.ring_count],
              ].map(([label, value]) => (
                <div className="rdkit-property" key={String(label)}>
                  <span>{label}</span>
                  <strong>{value}</strong>
                </div>
              ))}
            </div>

            <div className="analytics-actions">
              <button
                className="export-button"
                type="button"
                onClick={saveAnalysisToResearch}
                disabled={analysisSaved}
              >
                {analysisSaved ? (
                  <CheckCircle2 size={14} />
                ) : (
                  <Save size={14} />
                )}
                {analysisSaved
                  ? "Saved to Research"
                  : "Save analysis to Research"}
              </button>
            </div>

            <p className="rdkit-provenance">
              These values were calculated from the submitted SMILES by
              RDKit. They are calculated descriptors, separate from
              PubChem-retrieved records in the comparison workspace.
            </p>
          </div>
        )}
      </section>

      {items.length === 0 ? (
        <section className="analytics-empty panel">
          <div className="analytics-empty-icon">
            <BarChart3 size={30} />
          </div>
          <h2>Your analysis workspace is ready</h2>
          <p>
            Add one or more molecules to inspect their descriptors
            and compare values side by side.
          </p>
          <div className="analytics-empty-chips">
            {["Caffeine", "Aspirin", "Glucose"].map((name) => (
              <button
                key={name}
                onClick={() => void addMolecule(name)}
              >
                {name}
              </button>
            ))}
          </div>
        </section>
      ) : (
        <>
          <section className="analytics-section-head">
            <div>
              <span className="section-kicker">ACTIVE COMPOUNDS</span>
              <h2>Analysis set <small>{items.length}/4</small></h2>
            </div>

            <div className="analytics-actions">
              <button className="export-button" onClick={exportCsv}>
                <Download size={14} /> Export CSV
              </button>
              <button className="export-button" onClick={exportPdf}>
                <Printer size={14} /> Print / Save PDF
              </button>
              <button
                className="clear-analysis"
                onClick={() => {
                  setItems([]);
                  setError("");
                }}
              >
                <Trash2 size={14} /> Clear all
              </button>
            </div>
          </section>

          <section className="analytics-molecule-grid">
            {items.map((molecule) => (
              <motion.article
                className="analytics-molecule panel"
                key={molecule.CID}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="analytics-molecule-top">
                  <span className="cid">
                    PUBCHEM CID {molecule.CID}
                  </span>
                  <button
                    aria-label={`Remove ${molecule.IUPACName}`}
                    onClick={() =>
                      setItems((current) =>
                        current.filter((m) => m.CID !== molecule.CID)
                      )
                    }
                  >
                    <Trash2 size={15} />
                  </button>
                </div>

                <h3>{moleculeName(molecule)}</h3>
                <div className="molecule-formula">
                  {molecule.MolecularFormula || "Formula not reported"}
                </div>
                <div className="molecule-primary-value">
                  {molecule.MolecularWeight || "—"} <small>g/mol</small>
                </div>
                <div className="molecule-primary-label">
                  Molecular weight · PubChem
                </div>

                <button
                  className="export-button"
                  type="button"
                  disabled={!molecule.CanonicalSMILES || rdkitLoading}
                  onClick={() =>
                    void calculateStructure(
                      molecule.CanonicalSMILES,
                      moleculeName(molecule)
                    )
                  }
                >
                  <FlaskConical size={14} />
                  Analyse with RDKit
                </button>

                <a
                  href={`https://pubchem.ncbi.nlm.nih.gov/compound/${molecule.CID}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open source record ↗
                </a>
              </motion.article>
            ))}
          </section>

          <section className="analytics-panel panel">
            <div className="analytics-panel-title">
              <div>
                <span className="section-kicker">DESCRIPTOR MATRIX</span>
                <h2>Property comparison</h2>
              </div>
              <span className="source-tag">
                <Database size={13} /> PubChem-reported
              </span>
            </div>

            <p className="chart-note">
              Highest and lowest values are highlighted for each
              descriptor. These are numerical extremes, not claims
              that a value is scientifically better.
            </p>

            <div className="analytics-table-wrap">
              <table className="analytics-table">
                <thead>
                  <tr>
                    <th>Descriptor</th>
                    {items.map((m) => (
                      <th key={m.CID}>{moleculeName(m)}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {METRICS.map((metric) => {
                    const values = items.map((m) =>
                      numberValue(m, metric.key)
                    );
                    const valid = values.filter(
                      (value): value is number => value !== null
                    );
                    const min = valid.length ? Math.min(...valid) : null;
                    const max = valid.length ? Math.max(...valid) : null;

                    return (
                      <tr key={metric.key}>
                        <td>
                          <strong>{metric.label}</strong>
                          <small>{metric.description}</small>
                        </td>

                        {items.map((m, index) => {
                          const value = values[index];
                          const isHigh =
                            value !== null &&
                            max !== null &&
                            value === max &&
                            valid.length > 1 &&
                            max !== min;

                          const isLow =
                            value !== null &&
                            min !== null &&
                            value === min &&
                            valid.length > 1 &&
                            max !== min;

                          return (
                            <td
                              key={m.CID}
                              className={
                                isHigh
                                  ? "metric-high"
                                  : isLow
                                    ? "metric-low"
                                    : ""
                              }
                            >
                              {displayValue(m, metric)}
                              {isHigh && (
                                <span className="extreme-label">Highest</span>
                              )}
                              {isLow && (
                                <span className="extreme-label">Lowest</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="analytics-legend">
              <span className="legend-high">Highest reported value</span>
              <span className="legend-low">Lowest reported value</span>
            </div>
          </section>

          {chartMetrics.length > 0 && (
            <section className="analytics-panel panel">
              <div className="analytics-panel-title">
                <div>
                  <span className="section-kicker">
                    INTERACTIVE VISUAL COMPARISON
                  </span>
                  <h2>Compare a descriptor</h2>
                </div>
                <span className="source-tag">
                  Select a property to update the chart
                </span>
              </div>

              <label className="metric-select-label">
                Descriptor
                <select
                  value={selectedMetric as string}
                  onChange={(event) =>
                    setSelectedMetric(
                      event.target.value as keyof Molecule
                    )
                  }
                >
                  {chartMetrics.map((metric) => (
                    <option
                      key={metric.key as string}
                      value={metric.key as string}
                    >
                      {metric.label}
                    </option>
                  ))}
                </select>
              </label>

              <p className="chart-note">
                {activeMetric.description} Bars show absolute
                magnitude on a shared scale for this descriptor;
                values remain source-reported.
              </p>

              <div className="analytics-bars">
                <div className="analytics-bar-group">
                  <div className="analytics-bar-heading">
                    <strong>{activeMetric.label}</strong>
                    <span>{activeMetric.unit || "value"}</span>
                  </div>

                  {selectedValues.map(({ molecule, value }) => {
                    const maxMagnitude = Math.max(
                      ...availableValues.map(Math.abs),
                      0
                    );

                    const width =
                      value === null || maxMagnitude === 0
                        ? 0
                        : Math.max(
                            2,
                            Math.abs(value) / maxMagnitude * 100
                          );

                    const isHigh =
                      value !== null &&
                      maxValue !== null &&
                      value === maxValue &&
                      maxValue !== minValue;

                    const isLow =
                      value !== null &&
                      minValue !== null &&
                      value === minValue &&
                      maxValue !== minValue;

                    return (
                      <div
                        className="analytics-bar-row interactive-bar-row"
                        key={molecule.CID}
                      >
                        <span title={moleculeName(molecule)}>
                          {moleculeName(molecule)}
                        </span>
                        <div className="analytics-bar-track">
                          <i
                            className={
                              isHigh
                                ? "bar-high"
                                : isLow
                                  ? "bar-low"
                                  : ""
                            }
                            style={{ width: `${width}%` }}
                          />
                        </div>
                        <b>{value === null ? "N/R" : value}</b>
                      </div>
                    );
                  })}
                </div>
              </div>

              <p className="chart-footnote">
                Highest: {maxValue === null ? "Not available" : maxValue}
                {" · "}
                Lowest: {minValue === null ? "Not available" : minValue}.
                Missing values are excluded.
              </p>
            </section>
          )}

          <div className="analytics-provenance">
            <CheckCircle2 size={16} />
            <div>
              <strong>Data provenance</strong>
              <p>
                Values are retrieved from PubChem PUG REST. “Not reported”
                means the field was not returned; it does not mean zero.
                Highest and lowest labels describe numerical extremes only.
                Charts are visual comparisons, not predictive scores.
              </p>
            </div>
          </div>
        </>
      )}

      <footer className="analytics-footer">
        <ArrowLeftRight size={14} />
        Add up to four compounds for side-by-side comparison.
        Data source: PubChem.
      </footer>

      <section className="analytics-print-report" aria-hidden="true">
        <h1>MoleculeLab · Molecular Comparison Report</h1>
        <p>
          Data source: PubChem PUG REST · Generated from the current
          comparison workspace
        </p>
        <p>
          Highest and lowest indicate numerical extremes only,
          not biological or clinical superiority.
        </p>

        <table>
          <thead>
            <tr>
              <th>Descriptor</th>
              {items.map((m) => (
                <th key={m.CID}>{moleculeName(m)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {METRICS.map((metric) => (
              <tr key={metric.key}>
                <td>
                  {metric.label}
                  {metric.unit ? ` (${metric.unit})` : ""}
                </td>
                {items.map((m) => (
                  <td key={m.CID}>{displayValue(m, metric)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        <p className="print-source">
          Missing source fields are shown as “Not reported”; they are not
          treated as zero. This report contains source-reported values
          and does not make predictions.
        </p>
      </section>
    </div>
  );
}
