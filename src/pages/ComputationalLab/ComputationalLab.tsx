
import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  Atom,
  CheckCircle2,
  CircleAlert,
  Database,
  Download,
  FlaskConical,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  XCircle,
} from "lucide-react";

import {
  analyzeDataset,
  checkRDKitHealth,
  findDatasetSimilarity,
  screenDataset,
  type DatasetMolecule,
  type DatasetSimilarityResult,
  type LipinskiResponse,
} from "../../services/rdkit";

import "./ComputationalLab.css";

type EngineStatus = "checking" | "connected" | "offline";
type WorkspaceTab = "library" | "similarity" | "screening";

const formatValue = (value: number, digits = 2) =>
  Number.isFinite(value) ? value.toFixed(digits) : "—";

function downloadCSV(rows: Record<string, string | number | boolean>[], filename: string) {
  if (!rows.length) return;

  const headers = Object.keys(rows[0]);
  const escapeCSV = (value: string | number | boolean) =>
    `"${String(value).replace(/"/g, '""')}"`;

  const csv = [
    headers.map(escapeCSV).join(","),
    ...rows.map((row) =>
      headers.map((header) => escapeCSV(row[header])).join(",")
    ),
  ].join("\r\n");

  const blob = new Blob(["\uFEFF", csv], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export default function ComputationalLab() {
  const [dataset, setDataset] = useState<DatasetMolecule[]>([]);
  const [engineStatus, setEngineStatus] = useState<EngineStatus>("checking");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [activeTab, setActiveTab] = useState<WorkspaceTab>("library");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const [similaritySmiles, setSimilaritySmiles] = useState("");
  const [similarityResults, setSimilarityResults] =
    useState<DatasetSimilarityResult[]>([]);
  const [similarityLoading, setSimilarityLoading] = useState(false);
  const [similarityError, setSimilarityError] = useState("");

  const [screening, setScreening] = useState<LipinskiResponse | null>(null);
  const [screeningLoading, setScreeningLoading] = useState(false);
  const [screeningError, setScreeningError] = useState("");
  const [screeningFilter, setScreeningFilter] = useState<"all" | "pass" | "fail">("all");

  const loadWorkspace = async () => {
    setLoading(true);
    setError("");

    try {
      const [datasetResponse, healthy] = await Promise.all([
        analyzeDataset(),
        checkRDKitHealth(),
      ]);

      setDataset(datasetResponse.results);
      setEngineStatus(healthy ? "connected" : "offline");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load the molecular dataset."
      );
      setEngineStatus("offline");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadWorkspace();
  }, []);

  const categories = useMemo(
    () => ["All", ...Array.from(new Set(dataset.map((item) => item.category))).sort()],
    [dataset]
  );

  const filteredDataset = useMemo(() => {
    const query = search.trim().toLowerCase();

    return dataset.filter((item) => {
      const matchesCategory = category === "All" || item.category === category;
      const matchesSearch =
        !query ||
        item.name.toLowerCase().includes(query) ||
        item.formula.toLowerCase().includes(query) ||
        item.canonical_smiles.toLowerCase().includes(query) ||
        item.id.toLowerCase().includes(query);

      return matchesCategory && matchesSearch;
    });
  }, [dataset, search, category]);

  const selectedMolecules = useMemo(
    () => dataset.filter((item) => selectedIds.includes(item.id)),
    [dataset, selectedIds]
  );

  const toggleSelection = (id: string) => {
    setSelectedIds((previous) =>
      previous.includes(id)
        ? previous.filter((item) => item !== id)
        : [...previous, id]
    );
  };

  const selectVisible = () => {
    const visibleIds = filteredDataset.map((item) => item.id);
    setSelectedIds((previous) =>
      Array.from(new Set([...previous, ...visibleIds]))
    );
  };

  const clearSelection = () => setSelectedIds([]);

  const runSimilarity = async () => {
    if (!similaritySmiles.trim()) {
      setSimilarityError("Enter a SMILES structure to search for similar molecules.");
      return;
    }

    setSimilarityLoading(true);
    setSimilarityError("");
    setSimilarityResults([]);

    try {
      const response = await findDatasetSimilarity(similaritySmiles);
      setSimilarityResults(response.results);
      setEngineStatus("connected");
    } catch (err) {
      setSimilarityError(
        err instanceof Error ? err.message : "Similarity analysis failed."
      );
    } finally {
      setSimilarityLoading(false);
    }
  };

  const runScreening = async () => {
    setScreeningLoading(true);
    setScreeningError("");

    try {
      const response = await screenDataset();
      setScreening(response);
      setEngineStatus("connected");
    } catch (err) {
      setScreeningError(
        err instanceof Error ? err.message : "Lipinski screening failed."
      );
    } finally {
      setScreeningLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "screening" && !screening && !screeningLoading) {
      void runScreening();
    }
  }, [activeTab]);

  const filteredScreening = useMemo(() => {
    if (!screening) return [];
    if (screeningFilter === "pass") {
      return screening.results.filter((item) => item.passes);
    }
    if (screeningFilter === "fail") {
      return screening.results.filter((item) => !item.passes);
    }
    return screening.results;
  }, [screening, screeningFilter]);

  const exportDataset = () => {
    const rows = selectedMolecules.length ? selectedMolecules : dataset;

    downloadCSV(
      rows.map((item) => ({
        ID: item.id,
        Name: item.name,
        Category: item.category,
        Formula: item.formula,
        SMILES: item.canonical_smiles,
        Molecular_Weight: item.molecular_weight,
        Exact_Mass: item.exact_mass,
        LogP: item.logp,
        TPSA: item.tpsa,
        HBD: item.h_bond_donors,
        HBA: item.h_bond_acceptors,
        Rotatable_Bonds: item.rotatable_bonds,
        Ring_Count: item.ring_count,
      })),
      selectedMolecules.length
        ? "moleculelab-selected-molecules.csv"
        : "moleculelab-dataset-analysis.csv"
    );
  };

  const exportScreening = () => {
    if (!screening) return;

    downloadCSV(
      screening.results.map((item) => ({
        ID: item.id,
        Name: item.name,
        Category: item.category,
        Formula: item.formula,
        Molecular_Weight: item.molecular_weight,
        LogP: item.logp,
        TPSA: item.tpsa,
        HBD: item.h_bond_donors,
        HBA: item.h_bond_acceptors,
        Passes_Lipinski: item.passes,
        Reasons: item.reasons.join("; "),
      })),
      "moleculelab-lipinski-screening.csv"
    );
  };

  const exportSimilarity = () => {
    downloadCSV(
      similarityResults.map((item) => ({
        ID: item.id,
        Name: item.name,
        Category: item.category,
        Formula: item.formula,
        Tanimoto_Similarity: item.similarity,
        Molecular_Weight: item.molecular_weight,
        LogP: item.logp,
      })),
      "moleculelab-similarity-results.csv"
    );
  };

  const engineLabel =
    engineStatus === "connected"
      ? "RDKit connected"
      : engineStatus === "checking"
        ? "Checking engine..."
        : "RDKit unavailable";

  return (
    <div className="page-content computational-page">
      <div className="comp-ambient comp-ambient-one" />
      <div className="comp-ambient comp-ambient-two" />

      <header className="comp-header">
        <div>
          <div className="comp-eyebrow">
            <span className="comp-live-dot" />
            MOLECULELAB / SCIENTIFIC COMPUTATION
          </div>
          <h1>
            Computational <span>Lab.</span>
          </h1>
          <p>
            Explore a curated molecular dataset, calculate chemical descriptors,
            investigate structural similarity and screen molecular properties.
          </p>
        </div>

        <div className="comp-header-icon">
          <FlaskConical size={34} />
          <span>LAB 001</span>
        </div>
      </header>

      <section className="comp-stats">
        <div className="comp-stat-card">
          <span className="comp-stat-icon cyan"><Database size={19} /></span>
          <div>
            <small>CURATED DATASET</small>
            <strong>{loading ? "Loading..." : `${dataset.length} molecules`}</strong>
          </div>
        </div>

        <div className="comp-stat-card">
          <span className="comp-stat-icon violet"><Activity size={19} /></span>
          <div>
            <small>RDKit ENGINE</small>
            <strong>{engineStatus === "connected" ? "Connected" : engineStatus === "checking" ? "Checking..." : "Offline"}</strong>
          </div>
        </div>

        <div className="comp-stat-card">
          <span className="comp-stat-icon pink"><Target size={19} /></span>
          <div>
            <small>SELECTED MOLECULES</small>
            <strong>{selectedIds.length}</strong>
          </div>
        </div>
      </section>

      <div className="comp-engine-banner">
        <span className={`comp-engine-indicator ${engineStatus}`} />
        <span>{engineLabel}</span>
        <button type="button" onClick={() => void loadWorkspace()}>
          <RefreshCw size={14} /> Refresh dataset
        </button>
      </div>

      {error && (
        <div className="comp-message comp-error" role="alert">
          <CircleAlert size={17} /> {error}
        </div>
      )}

      <nav className="comp-tabs" aria-label="Computational Lab tools">
        <button
          type="button"
          className={activeTab === "library" ? "active" : ""}
          onClick={() => setActiveTab("library")}
        >
          <Database size={16} /> Dataset & Descriptors
        </button>
        <button
          type="button"
          className={activeTab === "similarity" ? "active" : ""}
          onClick={() => setActiveTab("similarity")}
        >
          <Sparkles size={16} /> Similarity Search
        </button>
        <button
          type="button"
          className={activeTab === "screening" ? "active" : ""}
          onClick={() => setActiveTab("screening")}
        >
          <ShieldCheck size={16} /> Lipinski Screening
        </button>
      </nav>

      {activeTab === "library" && (
        <section className="comp-panel comp-dataset-panel">
          <div className="comp-section-heading">
            <span className="comp-section-icon"><Atom size={21} /></span>
            <div>
              <h2>Curated Molecular Dataset</h2>
              <p>RDKit-calculated descriptors for every molecule in the library.</p>
            </div>
            <span className="comp-step">{dataset.length} RECORDS</span>
          </div>

          <div className="comp-toolbar">
            <div className="comp-search">
              <Search size={17} />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search name, formula, ID or SMILES..."
              />
            </div>
            <select
              className="comp-filter-select"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              aria-label="Filter by category"
            >
              {categories.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </div>

          <div className="comp-selection-toolbar">
            <span>{selectedIds.length} selected · {filteredDataset.length} visible</span>
            <div>
              <button type="button" onClick={selectVisible}>Select visible</button>
              <button type="button" onClick={clearSelection}>Clear selection</button>
              <button
                type="button"
                className="comp-export-button"
                onClick={exportDataset}
                disabled={dataset.length === 0}
              >
                <Download size={15} /> Export CSV
              </button>
            </div>
          </div>

          {loading ? (
            <div className="comp-loading-state">
              <RefreshCw className="comp-loading-icon" size={24} />
              <span>Calculating molecular descriptors...</span>
            </div>
          ) : filteredDataset.length === 0 ? (
            <div className="comp-empty">
              <Search size={27} />
              <h3>No molecules found</h3>
              <p>Try another search term or category.</p>
            </div>
          ) : (
            <div className="comp-table-wrap">
              <table className="comp-data-table">
                <thead>
                  <tr>
                    <th>Select</th>
                    <th>Molecule</th>
                    <th>Formula</th>
                    <th>Category</th>
                    <th>MW (g/mol)</th>
                    <th>LogP</th>
                    <th>TPSA (Å²)</th>
                    <th>HBD / HBA</th>
                    <th>Rings</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDataset.map((item) => (
                    <tr key={item.id} className={selectedIds.includes(item.id) ? "selected" : ""}>
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(item.id)}
                          onChange={() => toggleSelection(item.id)}
                          aria-label={`Select ${item.name}`}
                        />
                      </td>
                      <td>
                        <div className="comp-molecule-name">
                          <strong>{item.name}</strong>
                          <small>{item.id}</small>
                        </div>
                      </td>
                      <td>{item.formula}</td>
                      <td><span className="comp-category-tag">{item.category}</span></td>
                      <td>{formatValue(item.molecular_weight, 3)}</td>
                      <td>{formatValue(item.logp, 3)}</td>
                      <td>{formatValue(item.tpsa, 2)}</td>
                      <td>{item.h_bond_donors} / {item.h_bond_acceptors}</td>
                      <td>{item.ring_count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="comp-dataset-footnote">
            <CheckCircle2 size={15} />
            Descriptor values are calculated by RDKit from the molecular structures.
            They are computational descriptors, not experimental measurements.
          </div>

          {selectedMolecules.length > 0 && (
            <div className="comp-selection-summary">
              <strong>Selected molecules</strong>
              <div>
                {selectedMolecules.map((item) => (
                  <span key={item.id}>{item.name}</span>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {activeTab === "similarity" && (
        <section className="comp-panel">
          <div className="comp-section-heading">
            <span className="comp-section-icon violet"><Sparkles size={21} /></span>
            <div>
              <h2>Molecular Similarity Search</h2>
              <p>Compare an input structure against all molecules in the curated dataset.</p>
            </div>
            <span className="comp-step">MORGAN / Tanimoto</span>
          </div>

          <div className="comp-field">
            <label htmlFor="similarity-smiles">Query SMILES</label>
            <textarea
              id="similarity-smiles"
              rows={3}
              value={similaritySmiles}
              onChange={(event) => setSimilaritySmiles(event.target.value)}
              placeholder="Enter a molecular SMILES structure, e.g. CCO"
            />
            <small>
              The query is compared with the 20 dataset molecules using Morgan
              radius-2 fingerprints and Tanimoto similarity.
            </small>
          </div>

          <div className="comp-actions">
            <button
              type="button"
              className="comp-prepare-button"
              onClick={() => void runSimilarity()}
              disabled={similarityLoading || engineStatus === "offline"}
            >
              {similarityLoading
                ? <RefreshCw size={16} className="comp-loading-icon" />
                : <Search size={16} />}
              {similarityLoading ? "Searching..." : "Find Similar Molecules"}
            </button>
          </div>

          {similarityError && (
            <div className="comp-message comp-error" role="alert">
              <CircleAlert size={17} /> {similarityError}
            </div>
          )}

          {similarityResults.length > 0 && (
            <div className="comp-results-section">
              <div className="comp-results-heading">
                <div>
                  <h3>Similarity Results</h3>
                  <p>{similarityResults.length} dataset matches · ranked by Tanimoto score</p>
                </div>
                <button type="button" className="comp-export-button" onClick={exportSimilarity}>
                  <Download size={15} /> Export CSV
                </button>
              </div>

              <div className="comp-similarity-list">
                {similarityResults.map((item, index) => (
                  <article className="comp-similarity-row" key={item.id}>
                    <span className="comp-rank">{String(index + 1).padStart(2, "0")}</span>
                    <div className="comp-similarity-details">
                      <strong>{item.name}</strong>
                      <small>{item.formula} · {item.category}</small>
                      <div className="comp-similarity-track">
                        <span style={{ width: `${item.similarity * 100}%` }} />
                      </div>
                    </div>
                    <div className="comp-similarity-score">
                      <strong>{(item.similarity * 100).toFixed(1)}%</strong>
                      <small>Tanimoto</small>
                    </div>
                  </article>
                ))}
              </div>

              <div className="comp-dataset-footnote">
                Similarity is a fingerprint-based structural comparison. It does
                not establish equivalent biological activity or therapeutic effect.
              </div>
            </div>
          )}
        </section>
      )}

      {activeTab === "screening" && (
        <section className="comp-panel">
          <div className="comp-section-heading">
            <span className="comp-section-icon pink"><ShieldCheck size={21} /></span>
            <div>
              <h2>Lipinski Rule-of-Five Screening</h2>
              <p>Evaluate common physicochemical cut-offs across the curated dataset.</p>
            </div>
            <span className="comp-step">RULE-BASED</span>
          </div>

          {screeningLoading && (
            <div className="comp-loading-state">
              <RefreshCw className="comp-loading-icon" size={24} />
              <span>Screening molecular properties...</span>
            </div>
          )}

          {screeningError && (
            <div className="comp-message comp-error" role="alert">
              <CircleAlert size={17} /> {screeningError}
              <button type="button" onClick={() => void runScreening()}>Retry</button>
            </div>
          )}

          {screening && (
            <>
              <div className="comp-screen-stats">
                <div>
                  <small>TOTAL SCREENED</small>
                  <strong>{screening.total_molecules}</strong>
                </div>
                <div className="pass">
                  <small>PASSING</small>
                  <strong>{screening.passing}</strong>
                </div>
                <div className="fail">
                  <small>FLAGGED</small>
                  <strong>{screening.failing}</strong>
                </div>
              </div>

              <div className="comp-rule-list">
                <span>Screening criteria</span>
                <div>MW ≤ 500 g/mol</div>
                <div>LogP ≤ 5</div>
                <div>H-bond donors ≤ 5</div>
                <div>H-bond acceptors ≤ 10</div>
              </div>

              <div className="comp-selection-toolbar comp-screen-toolbar">
                <span>{filteredScreening.length} results shown</span>
                <div>
                  <select
                    className="comp-filter-select"
                    value={screeningFilter}
                    onChange={(event) =>
                      setScreeningFilter(event.target.value as "all" | "pass" | "fail")
                    }
                    aria-label="Filter screening results"
                  >
                    <option value="all">All molecules</option>
                    <option value="pass">Passing only</option>
                    <option value="fail">Flagged only</option>
                  </select>
                  <button
                    type="button"
                    className="comp-export-button"
                    onClick={exportScreening}
                  >
                    <Download size={15} /> Export CSV
                  </button>
                </div>
              </div>

              <div className="comp-table-wrap">
                <table className="comp-data-table comp-screen-table">
                  <thead>
                    <tr>
                      <th>Molecule</th>
                      <th>MW</th>
                      <th>LogP</th>
                      <th>TPSA</th>
                      <th>HBD</th>
                      <th>HBA</th>
                      <th>Result</th>
                      <th>Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredScreening.map((item) => (
                      <tr key={item.id}>
                        <td>
                          <div className="comp-molecule-name">
                            <strong>{item.name}</strong>
                            <small>{item.id}</small>
                          </div>
                        </td>
                        <td>{formatValue(item.molecular_weight, 2)}</td>
                        <td>{formatValue(item.logp, 2)}</td>
                        <td>{formatValue(item.tpsa, 2)}</td>
                        <td>{item.h_bond_donors}</td>
                        <td>{item.h_bond_acceptors}</td>
                        <td>
                          <span className={`comp-screen-badge ${item.passes ? "pass" : "fail"}`}>
                            {item.passes
                              ? <><CheckCircle2 size={13} /> Pass</>
                              : <><XCircle size={13} /> Flagged</>}
                          </span>
                        </td>
                        <td>{item.reasons.length ? item.reasons.join(", ") : "Within cut-offs"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="comp-dataset-footnote">
                <CircleAlert size={15} />
                {screening.explanation}
              </div>
            </>
          )}
        </section>
      )}

      <footer className="comp-footer">
        <span>MOLECULELAB · COMPUTATIONAL CHEMISTRY</span>
        <span>SCIENTIFIC WORKSPACE / 001</span>
      </footer>
    </div>
  );
}
