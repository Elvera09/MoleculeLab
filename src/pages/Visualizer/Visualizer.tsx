
import { useEffect, useRef, useState } from "react";
import * as $3Dmol from "3dmol";
import { CheckCircle2, Save } from "lucide-react";
import { searchMolecule, getMolecule3D } from "../../services/pubchem";
import type { Molecule } from "../../services/pubchem";
import "./Visualizer.css";

type Viewer = {
  clear(): void;
  addModel(data: string, format: string): unknown;
  setStyle(selection: object, style: object): void;
  zoomTo(selection?: object): void;
  render(): void;
  resize(): void;
  setBackgroundColor?(color: string): void;
};

type DisplayStyle = "ball" | "stick" | "sphere";

export default function Visualizer() {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const viewerRef = useRef<Viewer | null>(null);

  const [query, setQuery] = useState("Caffeine");
  const [molecule, setMolecule] = useState<Molecule | null>(null);
  const [displayStyle, setDisplayStyle] = useState<DisplayStyle>("ball");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);
  const [savedMessage, setSavedMessage] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!hostRef.current) return;

    const viewer = $3Dmol.createViewer(hostRef.current, {
      backgroundColor: "#080d20",
      antialias: true,
    }) as Viewer;

    viewerRef.current = viewer;

    return () => {
      viewerRef.current = null;
      try {
        (viewer as any).clear();
      } catch {
        // The viewer may already have been disposed.
      }
    };
  }, []);

  function applyStyle(style: DisplayStyle) {
    const viewer = viewerRef.current;
    if (!viewer) return;

    if (style === "ball") {
      viewer.setStyle({}, {
        stick: { radius: 0.16 },
        sphere: { scale: 0.27 },
      });
    } else if (style === "stick") {
      viewer.setStyle({}, { stick: { radius: 0.22 } });
    } else {
      viewer.setStyle({}, { sphere: { scale: 0.38 } });
    }

    viewer.render();
    setDisplayStyle(style);
  }

  async function loadMolecule(name: string) {
    if (!name.trim()) {
      setError("Enter a molecule name first.");
      return;
    }

    setLoading(true);
    setError("");
    setSavedMessage("");
    setReady(false);

    try {
      const result = await searchMolecule(name);
      const sdfResponse = await fetch(getMolecule3D(result.CID));

      if (!sdfResponse.ok) {
        throw new Error(
          "PubChem does not currently provide a 3D conformer for this molecule. Try another molecule."
        );
      }

      const sdf = await sdfResponse.text();

      if (
        !sdf.trim() ||
        (!sdf.includes("V2000") && !sdf.includes("V3000"))
      ) {
        throw new Error(
          "A usable 3D structure was not returned for this molecule."
        );
      }

      const viewer = viewerRef.current;

      if (!viewer) {
        throw new Error(
          "The 3D viewer is still starting. Please try again."
        );
      }

      viewer.clear();
      viewer.addModel(sdf, "sdf");
      viewer.setStyle({}, {
        stick: { radius: 0.16 },
        sphere: { scale: 0.27 },
      });
      viewer.zoomTo();
      viewer.render();

      setMolecule(result);
      setDisplayStyle("ball");
      setReady(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not load this molecule."
      );
    } finally {
      setLoading(false);
    }
  }

  // GET A VALID SMILES RECORD DIRECTLY FROM PUBCHEM
  async function getMoleculeSmiles(cid: number): Promise<string> {
    const urls = [
      `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${cid}/property/CanonicalSMILES,IsomericSMILES/JSON`,
      `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${cid}/property/ConnectivitySMILES/JSON`,
    ];

    for (const url of urls) {
      try {
        const response = await fetch(url);

        if (!response.ok) continue;

        const data = await response.json();
        const properties = data?.PropertyTable?.Properties?.[0];

        const smiles =
          properties?.CanonicalSMILES ||
          properties?.ConnectivitySMILES ||
          properties?.IsomericSMILES ||
          "";

        if (smiles) return smiles;
      } catch {
        // Try the next PubChem property endpoint.
      }
    }

    throw new Error(
      "Could not retrieve a valid SMILES record from PubChem. Please try again."
    );
  }

  // SAVE THE CURRENT MOLECULE TO RESEARCH WORKSPACE
  async function saveToResearch() {
    if (!molecule || saving) return;

    setSaving(true);
    setError("");
    setSavedMessage("");

    try {
      const storageKey = "moleculelab.research.molecules.v1";

      const existing = JSON.parse(
        localStorage.getItem(storageKey) || "[]"
      );

      if (!Array.isArray(existing)) {
        throw new Error("Invalid research library.");
      }

      // Retrieve SMILES if it is missing from the search result.
      const smiles =
        molecule.CanonicalSMILES ||
        molecule.IsomericSMILES ||
        await getMoleculeSmiles(molecule.CID);

      if (!smiles) {
        throw new Error("No valid SMILES record was found.");
      }

      // Check for duplicates using CID or SMILES.
      const alreadySaved = existing.some(
        (item: { smiles?: string; cid?: number }) =>
          item.smiles === smiles ||
          item.cid === molecule.CID
      );

      if (alreadySaved) {
        setSavedMessage(
          "This molecule is already in your Research Library."
        );
        return;
      }

      const record = {
        id: `${Date.now()}-${molecule.CID}`,
        name:
          molecule.Title ||
          molecule.IUPACName ||
          `CID ${molecule.CID}`,
        smiles,
        formula: molecule.MolecularFormula || "",
        projectId: "",
        notes: "Saved from the 3D Molecular Visualizer",
        createdAt: new Date().toISOString(),
        cid: molecule.CID,
        source: "PubChem",
      };

      existing.unshift(record);

      localStorage.setItem(
        storageKey,
        JSON.stringify(existing)
      );

      setSavedMessage(
        "Molecule saved to Research Workspace!"
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not save this molecule."
      );
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadMolecule("Caffeine");
    }, 250);

    return () => window.clearTimeout(timer);
    // Load the initial example once when the viewer mounts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="ml-visualizer-page">
      <header className="ml-visualizer-heading">
        <div>
          <p className="ml-eyebrow">
            MOLECULAR INTELLIGENCE STUDIO · 3D LAB
          </p>

          <h1>
            Explore molecular space<span>.</span>
          </h1>

          <p className="ml-visualizer-subtitle">
            Rotate, inspect and explore molecular geometry in an interactive
            3D workspace.
          </p>
        </div>

        <div className="ml-live-indicator">
          <i /> LIVE 3D VIEWPORT
        </div>
      </header>

      <section className="ml-visualizer-search">
        <div className="ml-search-field">
          <span aria-hidden="true">⌕</span>

          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") void loadMolecule(query);
            }}
            placeholder="Search a molecule, e.g. caffeine"
            aria-label="Molecule name"
          />
        </div>

        <button
          onClick={() => void loadMolecule(query)}
          disabled={loading}
        >
          {loading ? "Loading structure…" : "Load molecule"}
        </button>
      </section>

      <div className="ml-visualizer-grid">
        <section className="ml-viewport-card">
          <div className="ml-card-topline">
            <div>
              <p className="ml-eyebrow">INTERACTIVE VIEWPORT</p>

              <h2>
                {molecule?.IUPACName ||
                  molecule?.MolecularFormula ||
                  "Molecular structure"}
              </h2>
            </div>

            <span className={ready ? "ml-status ready" : "ml-status"}>
              <i />{" "}
              {ready
                ? "STRUCTURE LOADED"
                : loading
                  ? "LOADING"
                  : "AWAITING STRUCTURE"}
            </span>
          </div>

          <div className="ml-3d-stage">
            <div
              ref={hostRef}
              className="ml-3d-canvas"
              aria-label="Interactive 3D molecular structure"
            />

            {!ready && !loading && !error && (
              <div className="ml-stage-hint">
                Your molecular model will appear here
              </div>
            )}

            {loading && (
              <div className="ml-stage-message">
                Retrieving 3D coordinates from PubChem…
              </div>
            )}

            {error && (
              <div className="ml-stage-error">{error}</div>
            )}
          </div>

          <div className="ml-viewport-footer">
            <span>DRAG TO ROTATE</span>
            <span>SCROLL TO ZOOM</span>
            <span>3D CONFORMER · PUBCHEM</span>
          </div>
        </section>

        <aside className="ml-visualizer-side">
          <section className="ml-tool-card">
            <p className="ml-eyebrow">RENDERING MODE</p>
            <h3>Choose a representation</h3>

            <div className="ml-style-options">
              <button
                className={displayStyle === "ball" ? "active" : ""}
                onClick={() => applyStyle("ball")}
              >
                <b>●—●</b>
                <span>Ball & stick</span>
              </button>

              <button
                className={displayStyle === "stick" ? "active" : ""}
                onClick={() => applyStyle("stick")}
              >
                <b>—</b>
                <span>Stick</span>
              </button>

              <button
                className={displayStyle === "sphere" ? "active" : ""}
                onClick={() => applyStyle("sphere")}
              >
                <b>●</b>
                <span>Space-filling</span>
              </button>
            </div>
          </section>

          <section className="ml-tool-card ml-molecule-info">
            <p className="ml-eyebrow">MOLECULAR IDENTITY</p>

            <h3>
              {molecule
                ? molecule.MolecularFormula
                : "No molecule loaded"}
            </h3>

            {molecule ? (
              <dl>
                <div>
                  <dt>PubChem CID</dt>
                  <dd>{molecule.CID}</dd>
                </div>

                <div>
                  <dt>Molecular weight</dt>
                  <dd>{molecule.MolecularWeight} g/mol</dd>
                </div>

                <div>
                  <dt>IUPAC name</dt>
                  <dd>{molecule.IUPACName}</dd>
                </div>
              </dl>
            ) : (
              <p className="ml-muted">
                Load a molecule to see its identity details.
              </p>
            )}

            <button
              type="button"
              className="ml-save-button"
              onClick={() => void saveToResearch()}
              disabled={!molecule || saving}
            >
              {savedMessage ? (
                <CheckCircle2 size={16} />
              ) : (
                <Save size={16} />
              )}

              {saving
                ? "Saving molecule…"
                : "Save to Research Workspace"}
            </button>

            {savedMessage && (
              <p className="ml-save-message">
                {savedMessage}
              </p>
            )}
          </section>

          <section className="ml-tool-card ml-controls-note">
            <p className="ml-eyebrow">VIEWPORT CONTROLS</p>

            <p>
              <strong>Rotate</strong>
              <span>Click and drag inside the model.</span>
            </p>

            <p>
              <strong>Zoom</strong>
              <span>Use your mouse wheel or trackpad.</span>
            </p>

            <p>
              <strong>Explore</strong>
              <span>Change representation using the controls above.</span>
            </p>
          </section>
        </aside>
      </div>

      <p className="ml-science-note">
        <strong>Scientific note:</strong> 3D coordinates are supplied by
        PubChem when available. A displayed conformer is a computational
        3D representation, not necessarily an experimentally determined
        structure or the molecule's only conformation.
      </p>
    </main>
  );
}
