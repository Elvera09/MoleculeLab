
import { useMemo, useState, type MouseEvent } from "react";
import { analyzeMolfile, analyzeSmiles, type RDKitAnalysis } from "../../services/rdkit";
import {
  Activity,
  CheckCircle2,
  Download,
  Eraser,
  Link2,
  MousePointer2,
  Plus,
  RotateCcw,
  Sparkles,
  Trash2,
  Hexagon,
  Save
} from "lucide-react";
import "./StructureStudio.css";

type ElementSymbol = "C" | "N" | "O" | "S" | "P" | "F" | "Cl" | "Br";
type AtomNode = { id: number; element: ElementSymbol; x: number; y: number };
type BondEdge = { id: number; from: number; to: number; order: 1 | 2 | 3 };
type ToolMode = "select" | "add" | "bond" | "erase";

const ELEMENTS: ElementSymbol[] = ["C", "N", "O", "S", "P", "F", "Cl", "Br"];

const COLORS: Record<ElementSymbol, string> = {
  C: "#e7edf7",
  N: "#75aaff",
  O: "#ff7c91",
  S: "#f5d36c",
  P: "#ffad68",
  F: "#8ee0ae",
  Cl: "#8ee0ae",
  Br: "#d79aff"
};

function molfileFor(atoms: AtomNode[], bonds: BondEdge[]) {
  return [
    "MoleculeLab visual editor",
    "  MoleculeLab RDKit",
    "",
    `${String(atoms.length).padStart(3)}${String(bonds.length).padStart(3)}  0  0  0  0            999 V2000`,
    ...atoms.map(
      a =>
        `${(a.x / 40 - 10).toFixed(4).padStart(10)}${(10 - a.y / 40).toFixed(4).padStart(10)}${"0.0000".padStart(10)} ${a.element.padEnd(3)} 0  0  0  0  0  0  0  0  0  0  0  0`
    ),
    ...bonds.map(
      b =>
        `${String(atoms.findIndex(a => a.id === b.from) + 1).padStart(3)}${String(atoms.findIndex(a => a.id === b.to) + 1).padStart(3)}${String(b.order).padStart(3)}  0  0  0  0`
    ),
    "M  END",
    ""
  ].join("\n");
}

export default function StructureStudio() {
  const [atoms, setAtoms] = useState<AtomNode[]>([]);
  const [bonds, setBonds] = useState<BondEdge[]>([]);
  const [mode, setMode] = useState<ToolMode>("add");
  const [element, setElement] = useState<ElementSymbol>("C");
  const [bondOrder, setBondOrder] = useState<1 | 2 | 3>(1);
  const [first, setFirst] = useState<number | null>(null);
  const [result, setResult] = useState<RDKitAnalysis | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [savedToResearch, setSavedToResearch] = useState(false);
  const [smiles, setSmiles] = useState("CCO");

  const molfile = useMemo(() => molfileFor(atoms, bonds), [atoms, bonds]);

  const resetResult = () => {
    setResult(null);
    setError("");
    setSavedToResearch(false);
  };

  // SAVE VALIDATED MOLECULE TO RESEARCH WORKSPACE
  function saveToResearch() {
    if (!result) return;

    try {
      const moleculeKey = "moleculelab.research.molecules.v1";
      const historyKey = "moleculelab.research.history.v1";

      const saved = JSON.parse(localStorage.getItem(moleculeKey) || "[]");
      const canonical = result.canonical_smiles || smiles.trim();

      const alreadySaved = saved.some(
        (item: { smiles?: string }) =>
          item.smiles && item.smiles === canonical
      );

      if (!alreadySaved) {
        saved.unshift({
          id: `${Date.now()}-structure`,
          name: result.name || result.formula || "Structure Studio molecule",
          smiles: canonical,
          formula: result.formula || "",
          projectId: "",
          notes: "Created and validated in Structure Studio",
          createdAt: new Date().toISOString(),
          source: "RDKit / Structure Studio"
        });

        localStorage.setItem(moleculeKey, JSON.stringify(saved));
      }

      const history = JSON.parse(localStorage.getItem(historyKey) || "[]");

      history.unshift({
        id: `${Date.now()}-structure-history`,
        title: alreadySaved
          ? "Structure already in Research Library"
          : "Structure saved from Structure Studio",
        detail: `${result.formula || "Molecular structure"} · ${canonical}`,
        createdAt: new Date().toISOString()
      });

      localStorage.setItem(historyKey, JSON.stringify(history));

      setSavedToResearch(true);
      setError("");
    } catch {
      setError(
        "Could not save this structure. Please check your browser storage and try again."
      );
    }
  }

  function addAt(e: MouseEvent<SVGSVGElement>) {
    if (mode !== "add") return;

    const r = e.currentTarget.getBoundingClientRect();

    setAtoms(v => [
      ...v,
      {
        id: Date.now() + Math.random(),
        element,
        x: ((e.clientX - r.left) / r.width) * 800,
        y: ((e.clientY - r.top) / r.height) * 500
      }
    ]);

    resetResult();
  }

  function atomClick(id: number) {
    if (mode === "erase") {
      setAtoms(v => v.filter(a => a.id !== id));
      setBonds(v => v.filter(b => b.from !== id && b.to !== id));
      setFirst(null);
      resetResult();
      return;
    }

    if (mode === "bond") {
      if (first === null) {
        setFirst(id);
      } else if (first !== id) {
        if (
          !bonds.some(
            b =>
              (b.from === first && b.to === id) ||
              (b.from === id && b.to === first)
          )
        ) {
          setBonds(v => [
            ...v,
            {
              id: Date.now() + Math.random(),
              from: first,
              to: id,
              order: bondOrder
            }
          ]);
        }

        setFirst(null);
        resetResult();
      }
    }
  }

  function clear() {
    setAtoms([]);
    setBonds([]);
    setFirst(null);
    resetResult();
  }

  function loadRing(count: 5 | 6, aromatic = false) {
    const cx = 400;
    const cy = 245;
    const r = 112;
    const start = -Math.PI / 2;

    const nodes: AtomNode[] = Array.from({ length: count }, (_, i) => ({
      id: Date.now() + Math.random() + i,
      element: "C",
      x: cx + r * Math.cos(start + (i * 2 * Math.PI) / count),
      y: cy + r * Math.sin(start + (i * 2 * Math.PI) / count)
    }));

    const edges: BondEdge[] = nodes.map((a, i) => ({
      id: Date.now() + Math.random() + i,
      from: a.id,
      to: nodes[(i + 1) % count].id,
      order: (aromatic && i % 2 === 0 ? 2 : 1) as 1 | 2 | 3
    }));

    setAtoms(nodes);
    setBonds(edges);
    setMode("select");
    setFirst(null);
    resetResult();
  }

  function loadChain(count: number) {
    const nodes: AtomNode[] = Array.from({ length: count }, (_, i) => ({
      id: Date.now() + Math.random() + i,
      element: "C",
      x: 210 + i * 95,
      y: 245
    }));

    const edges: BondEdge[] = nodes.slice(0, -1).map((a, i) => ({
      id: Date.now() + Math.random() + i,
      from: a.id,
      to: nodes[i + 1].id,
      order: 1
    }));

    setAtoms(nodes);
    setBonds(edges);
    setMode("select");
    setFirst(null);
    resetResult();
  }

  function undo() {
    if (atoms.length) {
      const a = atoms[atoms.length - 1];
      setAtoms(v => v.slice(0, -1));
      setBonds(v => v.filter(b => b.from !== a.id && b.to !== a.id));
    } else if (bonds.length) {
      setBonds(v => v.slice(0, -1));
    }

    setFirst(null);
    resetResult();
  }

  async function validateDrawing() {
    if (!atoms.length) {
      setError("Add atoms or choose a template first.");
      return;
    }

    setBusy(true);
    setError("");
    setResult(null);

    try {
      setResult(await analyzeMolfile(molfile));
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "RDKit could not validate this drawing."
      );
    } finally {
      setBusy(false);
    }
  }

  async function validateSmiles() {
    if (!smiles.trim()) {
      setError("Enter a SMILES string first.");
      return;
    }

    setBusy(true);
    setError("");
    setResult(null);

    try {
      setResult(await analyzeSmiles(smiles));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Invalid SMILES input.");
    } finally {
      setBusy(false);
    }
  }

  function exportMol() {
    if (!atoms.length) {
      setError("Choose a template or draw a structure first.");
      return;
    }

    const url = URL.createObjectURL(
      new Blob([molfile], { type: "chemical/x-mdl-molfile" })
    );

    const a = document.createElement("a");
    a.href = url;
    a.download = "moleculelab-structure.mol";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="page-content structure-studio-page">
      <div className="ss-eyebrow">
        <span /> STAGE 03 · CREATE / VISUAL STRUCTURE EDITOR
      </div>

      <header className="ss-heading">
        <div>
          <h1>
            Draw your <em>molecule.</em>
          </h1>
          <p>
            Build structures visually, start from common templates, and
            validate your work with RDKit.
          </p>
        </div>
        <div className="ss-live">
          <Activity size={14} /> RDKIT CONNECTED
        </div>
      </header>

      <section className="ss-intro ss-panel">
        <div className="ss-intro-icon">
          <Sparkles size={23} />
        </div>
        <div>
          <span className="ss-kicker">VISUAL CHEMISTRY WORKBENCH</span>
          <h2>Start from a template or draw from scratch</h2>
          <p>
            Choose a ring or chain template, edit its atoms and bonds, or build
            your own structure on the canvas.
          </p>
        </div>
      </section>

      <section className="ss-panel ss-draw-panel">
        <div className="ss-template-bar">
          <div>
            <span className="ss-kicker">QUICK STRUCTURE TEMPLATES</span>
            <p>
              Insert a ready-made carbon skeleton, then validate or modify it.
            </p>
          </div>

          <div className="ss-template-buttons">
            <button onClick={() => loadRing(6, false)}>
              <Hexagon size={14} /> Cyclohexane
            </button>
            <button onClick={() => loadRing(6, true)}>
              <Hexagon size={14} /> Benzene ring
            </button>
            <button onClick={() => loadRing(5, false)}>
              <Hexagon size={14} /> Cyclopentane
            </button>
            <button onClick={() => loadChain(3)}>Propane chain</button>
          </div>
        </div>

        <div className="ss-toolbar">
          <div className="ss-tool-group">
            <button
              className={mode === "add" ? "active" : ""}
              onClick={() => {
                setMode("add");
                setFirst(null);
              }}
            >
              <Plus size={15} /> Add atom
            </button>

            <button
              className={mode === "bond" ? "active" : ""}
              onClick={() => {
                setMode("bond");
                setFirst(null);
              }}
            >
              <Link2 size={15} /> Bond
            </button>

            <button
              className={mode === "select" ? "active" : ""}
              onClick={() => {
                setMode("select");
                setFirst(null);
              }}
            >
              <MousePointer2 size={15} /> Select
            </button>

            <button
              className={mode === "erase" ? "active danger" : ""}
              onClick={() => {
                setMode("erase");
                setFirst(null);
              }}
            >
              <Eraser size={15} /> Erase
            </button>
          </div>

          <div className="ss-tool-group">
            <button onClick={undo}>
              <RotateCcw size={14} /> Undo
            </button>
            <button onClick={clear}>
              <Trash2 size={14} /> Clear
            </button>
            <button onClick={exportMol}>
              <Download size={14} /> Export MOL
            </button>
          </div>
        </div>

        <div className="ss-builder-row">
          <div className="ss-element-picker">
            <span className="ss-label">ELEMENT</span>
            <div>
              {ELEMENTS.map(x => (
                <button
                  key={x}
                  onClick={() => {
                    setElement(x);
                    setMode("add");
                  }}
                  className={element === x ? "selected" : ""}
                  style={{ "--atom-color": COLORS[x] } as React.CSSProperties}
                >
                  {x}
                </button>
              ))}
            </div>
          </div>

          <div className="ss-bond-picker">
            <span className="ss-label">BOND ORDER</span>
            <div>
              {([1, 2, 3] as const).map(x => (
                <button
                  key={x}
                  className={bondOrder === x ? "selected" : ""}
                  onClick={() => {
                    setBondOrder(x);
                    setMode("bond");
                  }}
                >
                  {x === 1 ? "Single" : x === 2 ? "Double" : "Triple"}
                </button>
              ))}
            </div>
          </div>

          <div className="ss-mode-hint">
            {mode === "add"
              ? `Click canvas to place ${element}`
              : mode === "bond"
                ? first === null
                  ? "Click two atoms to connect them"
                  : "Choose the second atom"
                : mode === "erase"
                  ? "Click an atom to remove it"
                  : "Choose a tool to edit"}
          </div>
        </div>

        <div className="ss-canvas-wrap">
          <svg
            className={`ss-canvas mode-${mode}`}
            viewBox="0 0 800 500"
            onClick={addAt}
            role="img"
            aria-label="Molecular drawing canvas"
          >
            <defs>
              <pattern
                id="ss-grid"
                width="25"
                height="25"
                patternUnits="userSpaceOnUse"
              >
                <circle
                  cx="1"
                  cy="1"
                  r="1"
                  fill="#9bb9df"
                  opacity=".17"
                />
              </pattern>
            </defs>

            <rect width="800" height="500" fill="url(#ss-grid)" />

            {bonds.map(b => {
              const a = atoms.find(x => x.id === b.from);
              const c = atoms.find(x => x.id === b.to);

              if (!a || !c) return null;

              const dx = c.x - a.x;
              const dy = c.y - a.y;
              const len = Math.max(1, Math.hypot(dx, dy));
              const ox = (-dy / len) * 5;
              const oy = (dx / len) * 5;

              return (
                <g
                  key={b.id}
                  stroke="#d8e7fa"
                  strokeWidth="3.2"
                  strokeLinecap="round"
                >
                  {b.order === 1 && (
                    <line x1={a.x} y1={a.y} x2={c.x} y2={c.y} />
                  )}

                  {b.order === 2 && (
                    <>
                      <line
                        x1={a.x + ox}
                        y1={a.y + oy}
                        x2={c.x + ox}
                        y2={c.y + oy}
                      />
                      <line
                        x1={a.x - ox}
                        y1={a.y - oy}
                        x2={c.x - ox}
                        y2={c.y - oy}
                      />
                    </>
                  )}

                  {b.order === 3 && (
                    <>
                      <line x1={a.x} y1={a.y} x2={c.x} y2={c.y} />
                      <line
                        x1={a.x + ox * 1.8}
                        y1={a.y + oy * 1.8}
                        x2={c.x + ox * 1.8}
                        y2={c.y + oy * 1.8}
                      />
                      <line
                        x1={a.x - ox * 1.8}
                        y1={a.y - oy * 1.8}
                        x2={c.x - ox * 1.8}
                        y2={c.y - oy * 1.8}
                      />
                    </>
                  )}
                </g>
              );
            })}

            {atoms.map(a => (
              <g
                key={a.id}
                onClick={e => {
                  e.stopPropagation();
                  atomClick(a.id);
                }}
                className="ss-atom-node"
              >
                <circle
                  cx={a.x}
                  cy={a.y}
                  r="19"
                  fill="#111d38"
                  stroke={first === a.id ? "#69e5d6" : COLORS[a.element]}
                  strokeWidth={first === a.id ? 4 : 2.5}
                />
                <text
                  x={a.x}
                  y={a.y + 5}
                  textAnchor="middle"
                  fill={COLORS[a.element]}
                  fontSize={a.element.length > 1 ? 13 : 16}
                  fontWeight="800"
                >
                  {a.element}
                </text>
              </g>
            ))}

            {!atoms.length && (
              <g pointerEvents="none">
                <text
                  x="400"
                  y="230"
                  textAnchor="middle"
                  fill="#91a9c8"
                  fontSize="18"
                >
                  Choose a template or place your first atom
                </text>
                <text
                  x="400"
                  y="258"
                  textAnchor="middle"
                  fill="#657f9f"
                  fontSize="12"
                >
                  Templates appear above the drawing tools
                </text>
              </g>
            )}
          </svg>
        </div>

        <div className="ss-canvas-footer">
          <span>
            {atoms.length} atoms · {bonds.length} bonds
          </span>
          <button
            className="ss-validate"
            onClick={() => void validateDrawing()}
            disabled={busy || !atoms.length}
          >
            {busy ? "Validating…" : "Validate drawing with RDKit"}
          </button>
        </div>
      </section>

      <section className="ss-panel ss-result-panel">
        <div className="ss-result-top">
          <div>
            <span className="ss-kicker">RDKit STRUCTURE REPORT</span>
            <h2>{result ? result.formula : "Validation results"}</h2>
          </div>

          {result && (
            <span className="ss-valid">
              <CheckCircle2 size={14} /> VALID STRUCTURE
            </span>
          )}
        </div>

        {error && <div className="ss-error">{error}</div>}

        {result ? (
          <>
            <div className="ss-canonical">
              <span>CANONICAL SMILES</span>
              <code>{result.canonical_smiles}</code>
            </div>

            <div className="ss-metrics">
              {[
                ["Molecular weight", `${result.molecular_weight} g/mol`],
                ["Exact mass", `${result.exact_mass} Da`],
                ["LogP", String(result.logp)],
                ["TPSA", `${result.tpsa} Å²`],
                ["H-bond donors", String(result.h_bond_donors)],
                ["H-bond acceptors", String(result.h_bond_acceptors)],
                ["Rotatable bonds", String(result.rotatable_bonds)],
                ["Ring count", String(result.ring_count)]
              ].map(([k, v]) => (
                <div key={k}>
                  <span>{k}</span>
                  <b>{v}</b>
                </div>
              ))}
            </div>

            <div className="ss-save-row">
              <button className="ss-validate" onClick={saveToResearch}>
                <Save size={15} />
                {savedToResearch ? "Saved to Research" : "Save to Research"}
              </button>

              {savedToResearch && (
                <span className="ss-valid">
                  <CheckCircle2 size={14} /> Added to Research Library
                </span>
              )}
            </div>

            <p className="ss-source">
              Calculated by RDKit from the submitted structure. These are
              computed descriptors, not experimental measurements.
            </p>
          </>
        ) : (
          <p className="ss-empty-note">
            Your molecular formula, canonical SMILES and descriptors will
            appear here after validation.
          </p>
        )}
      </section>

      <section className="ss-panel ss-smiles-panel">
        <div>
          <span className="ss-kicker">ALTERNATIVE INPUT</span>
          <h2>Validate an existing SMILES</h2>
          <p>Use this if you already have a SMILES string.</p>
        </div>

        <textarea
          value={smiles}
          onChange={e => setSmiles(e.target.value)}
          spellCheck={false}
        />

        <button
          className="ss-validate"
          onClick={() => void validateSmiles()}
          disabled={busy}
        >
          Validate SMILES
        </button>
      </section>

      <footer className="ss-footer">
        <span>MOLECULELAB · VISUAL STRUCTURE EDITOR</span>
        <span>RDKit-powered validation</span>
      </footer>
    </div>
  );
}
