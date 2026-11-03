
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "motion/react";
import {
  Search, Atom, LoaderCircle, AlertCircle, ExternalLink, Copy,
  Dna, FlaskConical, Fingerprint, Database, Sparkles, Check,
} from "lucide-react";
import "./Discovery.batch05.css";

import {
  searchMolecule,
  getMoleculeImage,
  getPubChemUrl,
  type Molecule,
  type SearchMode,
} from "../../services/pubchem";

import { saveMoleculeToResearch } from "../../services/research";

const MODES: { value: SearchMode; label: string }[] = [
  { value: "auto", label: "Auto detect" },
  { value: "name", label: "Name / synonym" },
  { value: "formula", label: "Formula" },
  { value: "cid", label: "PubChem CID" },
  { value: "smiles", label: "SMILES" },
  { value: "inchi", label: "InChI" },
];

const QUICK = [
  "Caffeine",
  "Aspirin",
  "Glucose",
  "Water",
  "Ibuprofen",
  "Paracetamol",
];

export default function Discovery() {
  const [params] = useSearchParams();

  const [query, setQuery] = useState(params.get("q") ?? "");
  const [mode, setMode] = useState<SearchMode>("auto");
  const [molecule, setMolecule] = useState<Molecule | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState("");
  const [showSynonyms, setShowSynonyms] = useState(false);
  const [savedToResearch, setSavedToResearch] = useState(false);

  async function run(value: string, searchMode: SearchMode = mode) {
    if (!value.trim()) {
      setError("Enter a molecule name, formula or chemical identifier.");
      return;
    }

    setLoading(true);
    setError("");
    setMolecule(null);
    setShowSynonyms(false);
    setSavedToResearch(false);

    try {
      const result = await searchMolecule(value, searchMode);
      setMolecule(result);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "The molecular search failed."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const q = params.get("q");

    if (q) {
      setQuery(q);
      void run(q, "auto");
    }

    // Search only when the URL query changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  async function copy(label: string, value?: string) {
    if (!value) return;

    try {
      await navigator.clipboard.writeText(value);
      setCopied(label);
      window.setTimeout(() => setCopied(""), 1500);
    } catch {
      setError(
        "Clipboard access is unavailable. You can select and copy the value manually."
      );
    }
  }

  function saveToResearch() {
    if (!molecule) return;

    try {
      const added = saveMoleculeToResearch(molecule);

      if (added) {
        setSavedToResearch(true);
        setError("");
      } else {
        setSavedToResearch(true);
        setError("This molecule is already in your Research Workspace.");
      }
    } catch {
      setError("Could not save this molecule. Please try again.");
    }
  }

  const properties = molecule
    ? [
        ["Molecular formula", molecule.MolecularFormula],
        ["Molecular weight", `${molecule.MolecularWeight} g/mol`],
        ["Exact mass", molecule.ExactMass ?? "Not reported"],
        ["XLogP", molecule.XLogP ?? "Not reported"],
        ["Topological polar surface area", molecule.TPSA ?? "Not reported"],
        ["Hydrogen-bond donors", molecule.HBondDonorCount ?? "Not reported"],
        ["Hydrogen-bond acceptors", molecule.HBondAcceptorCount ?? "Not reported"],
        ["Formal charge", molecule.Charge ?? "Not reported"],
      ] as [string, string | number][]
    : [];

  return (
    <div className="page discovery">
      <div className="eyebrow">
        <i /> MOLECULAR INTELLIGENCE · DISCOVERY ENGINE
      </div>

      <div className="discovery-title">
        <h1>
          Find a molecule. <em>Understand its identity.</em>
        </h1>
        <p>
          Search chemical records using names, formulas and structure
          identifiers, then inspect the source properties.
        </p>
      </div>

      <form
        className="search-box"
        onSubmit={(event) => {
          event.preventDefault();
          void run(query);
        }}
      >
        <Search size={20} />

        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Try caffeine, C8H10N4O2, a CID or a SMILES string"
          aria-label="Molecule search"
        />

        <button disabled={loading}>
          {loading ? (
            <LoaderCircle className="spin" />
          ) : (
            <Search size={17} />
          )}
          Search
        </button>
      </form>

      <div className="discovery-controls">
        <label>
          Search type
          <select
            value={mode}
            onChange={(event) =>
              setMode(event.target.value as SearchMode)
            }
          >
            {MODES.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>

        <div className="suggestions">
          <span>QUICK SEARCH</span>

          {QUICK.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => {
                setQuery(item);
                void run(item, "name");
              }}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className="search-capabilities">
        <span><Fingerprint size={15} /> Names & synonyms</span>
        <span><FlaskConical size={15} /> Molecular formulas</span>
        <span><Dna size={15} /> SMILES & InChI</span>
        <span><Database size={15} /> PubChem CID</span>
      </div>

      {loading && (
        <div className="empty">
          <LoaderCircle className="spin" size={32} />
          <h2>Searching molecular records...</h2>
          <p>
            Resolving the identifier and retrieving the PubChem compound
            record.
          </p>
        </div>
      )}

      {error && !loading && (
        <div className="error">
          <AlertCircle />
          {error}
        </div>
      )}

      {molecule && !loading && (
        <motion.section
          className="result"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="result-head">
            <div>
              <div className="eyebrow">
                PUBCHEM RECORD · CID {molecule.CID}
              </div>

              <h2>{query || molecule.IUPACName}</h2>
              <p>{molecule.IUPACName}</p>

              <small>
                Resolved as: {molecule.SearchMode ?? "unknown"} · Source:{" "}
                {molecule.Source}
              </small>
            </div>

            <div className="discovery-actions">
              <a
                href={getPubChemUrl(molecule.CID)}
                target="_blank"
                rel="noreferrer"
              >
                Open PubChem <ExternalLink size={14} />
              </a>

              <button
                type="button"
                onClick={saveToResearch}
                disabled={savedToResearch}
              >
                {savedToResearch ? (
                  <Check size={15} />
                ) : (
                  <Database size={15} />
                )}

                {savedToResearch
                  ? "Saved to Research"
                  : "Save to Research Workspace"}
              </button>
            </div>
          </div>

          <div className="result-grid">
            <div className="structure">
              <h3>
                <Atom size={16} /> 2D MOLECULAR STRUCTURE
              </h3>

              <img
                src={getMoleculeImage(molecule.CID)}
                alt={`2D structure of ${query}`}
              />

              <small>
                2D structure image supplied by PubChem. Use the 3D
                Visualizer to request a 3D conformer.
              </small>

              <a
                className="visualizer-link"
                href={`/visualizer?q=${encodeURIComponent(
                  molecule.IUPACName || query
                )}`}
              >
                <Sparkles size={15} /> Explore in 3D Visualizer
              </a>
            </div>

            <div className="properties">
              <h3>CHEMICAL IDENTITY & SOURCE PROPERTIES</h3>

              <div className="property-grid">
                {properties.map(([label, value]) => (
                  <Property
                    key={label}
                    label={label}
                    value={value}
                  />
                ))}
              </div>

              <Property
                label="InChIKey"
                value={molecule.InChIKey || "Not reported"}
                copy={() => void copy("InChIKey", molecule.InChIKey)}
                copied={copied === "InChIKey"}
              />

              <Property
                label="Canonical SMILES"
                value={molecule.CanonicalSMILES || "Not reported"}
                copy={() =>
                  void copy(
                    "Canonical SMILES",
                    molecule.CanonicalSMILES
                  )
                }
                copied={copied === "Canonical SMILES"}
              />

              {molecule.IsomericSMILES && (
                <Property
                  label="Isomeric SMILES"
                  value={molecule.IsomericSMILES}
                  copy={() =>
                    void copy(
                      "Isomeric SMILES",
                      molecule.IsomericSMILES
                    )
                  }
                  copied={copied === "Isomeric SMILES"}
                />
              )}

              <button
                className="synonym-toggle"
                type="button"
                onClick={() =>
                  setShowSynonyms((current) => !current)
                }
              >
                {showSynonyms
                  ? "Hide synonyms"
                  : `View synonyms (${molecule.Synonyms?.length ?? 0})`}
              </button>

              {showSynonyms && (
                <div className="synonyms">
                  {(molecule.Synonyms ?? []).length ? (
                    molecule.Synonyms?.map((synonym) => (
                      <span key={synonym}>{synonym}</span>
                    ))
                  ) : (
                    <span>
                      No synonyms were returned for this record.
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="source">
            <Database size={14} />
            Source: PubChem PUG REST. “Not reported” means the field
            was not returned in this record; it is not a zero value.
          </div>
        </motion.section>
      )}

      {!molecule && !loading && !error && (
        <div className="empty">
          <div className="empty-atom">
            <Atom size={42} />
          </div>
          <h2>Your next discovery awaits.</h2>
          <p>
            Enter a compound name or identifier to retrieve its molecular
            identity and available source properties.
          </p>
        </div>
      )}
    </div>
  );
}

function Property({
  label,
  value,
  copy,
  copied,
}: {
  label: string;
  value: string | number;
  copy?: () => void;
  copied?: boolean;
}) {
  return (
    <div className="property">
      <span>{label}</span>
      <b>{value}</b>

      {copy && (
        <button
          type="button"
          onClick={copy}
          aria-label={`Copy ${label}`}
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
        </button>
      )}
    </div>
  );
}
