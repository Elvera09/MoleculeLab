
import { useState } from "react";
import {
  Activity,
  BrainCircuit,
  CheckCircle2,
  FlaskConical,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  Save
} from "lucide-react";
import "./Intelligence.css";

const API = "https://moleculelab.onrender.com";
const EXAMPLES = [
  { name: "Aspirin", smiles: "CC(=O)OC1=CC=CC=C1C(=O)O" },
  { name: "Caffeine", smiles: "Cn1c(=O)c2c(ncn2C)n(C)c1=O" },
  { name: "Ibuprofen", smiles: "CC(C)CC1=CC=C(C=C1)C(C)C(=O)O" },
  { name: "Paracetamol", smiles: "CC(=O)NC1=CC=C(O)C=C1" }
];

type Hit = {
  name: string;
  formula: string;
  similarity: number;
  molecular_weight: number;
  logp: number;
};

type ScreenItem = {
  name: string;
  formula: string;
  molecular_weight: number;
  logp: number;
  tpsa: number;
  passes: boolean;
  reasons: string[];
};

async function post<T>(path: string, body: unknown): Promise<T> {
  let response: Response;

  try {
    response = await fetch(API + path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
  } catch {
    throw new Error(
      "Cannot connect to the chemistry engine. Make sure the backend is running."
    );
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || "Request failed.");
  }

  return data as T;
}

export default function Intelligence() {
  const [smiles, setSmiles] = useState(EXAMPLES[0].smiles);
  const [hits, setHits] = useState<Hit[] | null>(null);
  const [screen, setScreen] = useState<ScreenItem[] | null>(null);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [savedMessage, setSavedMessage] = useState("");

  async function similarity() {
    setBusy("similarity");
    setError("");
    setSavedMessage("");
    setScreen(null);

    try {
      const r = await post<{ results: Hit[] }>("/ai/similarity", {
        smiles,
        limit: 8
      });

      setHits(r.results);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Similarity search failed."
      );
    } finally {
      setBusy("");
    }
  }

  async function screening() {
    setBusy("screen");
    setError("");
    setSavedMessage("");
    setHits(null);

    try {
      const r = await post<{ results: ScreenItem[] }>("/ai/screen", {
        smiles: EXAMPLES.map(x => x.smiles)
      });

      setScreen(r.results);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Screening failed."
      );
    } finally {
      setBusy("");
    }
  }

  // SAVE AI RESULTS TO RESEARCH WORKSPACE
  function saveToResearch() {
    if (!hits && !screen) return;

    try {
      const historyKey = "moleculelab.research.history.v1";

      const existing = JSON.parse(
        localStorage.getItem(historyKey) || "[]"
      );

      if (!Array.isArray(existing)) {
        throw new Error("Invalid research history.");
      }

      let title = "";
      let detail = "";

      if (hits) {
        title = "AI Molecular Similarity Analysis";

        const matchDetails = hits.map((item, index) =>
          `${index + 1}. ${item.name} | ${item.formula} | Similarity: ${(item.similarity * 100).toFixed(1)}% | MW: ${item.molecular_weight.toFixed(2)} | LogP: ${item.logp.toFixed(2)}`
        ).join("\n");

        detail =
          `Query SMILES: ${smiles}\n` +
          `Method: Morgan radius-2 fingerprints, Tanimoto similarity\n` +
          `Results:\n${matchDetails}`;
      } else if (screen) {
        title = "AI Compound Screening";

        const screenDetails = screen.map(item =>
          `${item.name} | ${item.formula} | ${item.passes ? "PASS" : "REVIEW"} | MW: ${item.molecular_weight.toFixed(1)} | LogP: ${item.logp.toFixed(2)} | TPSA: ${item.tpsa.toFixed(1)} | ${item.reasons.join(", ") || "Within selected descriptor cut-offs"}`
        ).join("\n");

        detail =
          "Method: Rule-based Lipinski-style descriptor screening\n" +
          `Reference compounds:\n${screenDetails}`;
      }

      existing.unshift({
        id: `${Date.now()}-ai`,
        title,
        detail,
        createdAt: new Date().toISOString()
      });

      localStorage.setItem(historyKey, JSON.stringify(existing));

      setSavedMessage("AI results saved to Research Workspace!");
      setError("");
    } catch {
      setError(
        "Could not save the AI results. Please check your browser storage."
      );
    }
  }

  return (
    <div className="page-content intelligence-page">
      <div className="ai-eyebrow">
        <span /> STAGE 04 · INTELLIGENCE / MOLECULAR AI
      </div>

      <header className="ai-heading">
        <div>
          <h1>
            Think beyond the <em>molecule.</em>
          </h1>
          <p>
            Explore molecular similarity and structure-based screening with
            RDKit fingerprints and calculated descriptors.
          </p>
        </div>
        <span className="ai-engine">
          <Activity size={14} /> CHEMISTRY ENGINE
        </span>
      </header>

      <section className="ai-panel ai-hero">
        <div>
          <span className="ai-kicker">
            <Sparkles size={13} /> MOLECULAR INTELLIGENCE
          </span>
          <h2>Find relationships hidden in chemical structures.</h2>
          <p>
            Rank related compounds and screen reference molecules with
            transparent chemical criteria.
          </p>
        </div>
        <div className="ai-hero-icon">
          <BrainCircuit size={60} />
        </div>
      </section>

      <section className="ai-panel ai-query">
        <div className="ai-kicker">01 / QUERY MOLECULE</div>
        <h2>Start with a chemical structure</h2>

        <label htmlFor="ai-smiles">Molecular SMILES</label>

        <textarea
          id="ai-smiles"
          value={smiles}
          onChange={e => setSmiles(e.target.value)}
          spellCheck={false}
        />

        <div className="ai-examples">
          <span>QUICK EXAMPLES</span>

          {EXAMPLES.map(x => (
            <button
              key={x.name}
              onClick={() => {
                setSmiles(x.smiles);
                setError("");
                setSavedMessage("");
              }}
            >
              {x.name}
            </button>
          ))}
        </div>

        {error && <div className="ai-error">{error}</div>}
      </section>

      <div className="ai-tools">
        <section className="ai-panel ai-tool">
          <div className="ai-tool-icon">
            <Target size={21} />
          </div>

          <div className="ai-kicker">STRUCTURE-BASED SEARCH</div>
          <h2>Molecular similarity</h2>

          <p>
            Rank reference compounds using Morgan fingerprints and Tanimoto
            similarity (0–1). This measures structural fingerprint overlap,
            not biological activity.
          </p>

          <button
            disabled={!!busy || !smiles.trim()}
            onClick={() => void similarity()}
          >
            <Search size={15} />
            {busy === "similarity"
              ? "Comparing…"
              : "Find similar molecules"}
          </button>
        </section>

        <section className="ai-panel ai-tool">
          <div className="ai-tool-icon violet">
            <ShieldCheck size={21} />
          </div>

          <div className="ai-kicker">RULE-BASED SCREENING</div>
          <h2>Compound screening</h2>

          <p>
            Check a reference set against common Lipinski-style descriptor
            cut-offs. This is a heuristic screen, not a drug efficacy or
            safety prediction.
          </p>

          <button
            disabled={!!busy}
            onClick={() => void screening()}
          >
            <FlaskConical size={15} />
            {busy === "screen"
              ? "Screening…"
              : "Screen reference compounds"}
          </button>
        </section>
      </div>

      {hits && (
        <section className="ai-panel ai-results">
          <div className="ai-kicker">SIMILARITY RESULTS</div>
          <h2>Closest reference structures</h2>

          <p>
            Ranked by Morgan radius-2, 2048-bit fingerprints and Tanimoto
            similarity.
          </p>

          {hits.map((x, i) => (
            <div className="ai-row" key={x.name}>
              <b>{String(i + 1).padStart(2, "0")}</b>

              <div>
                <strong>{x.name}</strong>
                <small>
                  {x.formula} · {x.molecular_weight.toFixed(2)} g/mol ·
                  LogP {x.logp.toFixed(2)}
                </small>
              </div>

              <div className="ai-score">
                <strong>{(x.similarity * 100).toFixed(1)}%</strong>
                <span>
                  <i style={{ width: `${x.similarity * 100}%` }} />
                </span>
              </div>
            </div>
          ))}

          <button className="ai-save-button" onClick={saveToResearch}>
            {savedMessage ? <CheckCircle2 size={15} /> : <Save size={15} />}
            {savedMessage ? "Saved to Research" : "Save similarity results"}
          </button>
        </section>
      )}

      {screen && (
        <section className="ai-panel ai-results">
          <div className="ai-kicker">SCREENING RESULTS</div>
          <h2>Reference compound assessment</h2>

          <p>
            Descriptor cut-offs: MW ≤ 500, LogP ≤ 5, H-bond donors ≤ 5,
            H-bond acceptors ≤ 10.
          </p>

          <div className="ai-screen-grid">
            {screen.map(x => (
              <article key={x.name}>
                <div>
                  <b>{x.name}</b>
                  <span className={x.passes ? "pass" : "review"}>
                    {x.passes ? "PASS" : "REVIEW"}
                  </span>
                </div>

                <small>{x.formula}</small>

                <p>
                  MW {x.molecular_weight.toFixed(1)} ·
                  LogP {x.logp.toFixed(2)} ·
                  TPSA {x.tpsa.toFixed(1)}
                </p>

                <small>
                  {x.reasons.length
                    ? x.reasons.join(" · ")
                    : "Within selected descriptor cut-offs."}
                </small>
              </article>
            ))}
          </div>

          <button className="ai-save-button" onClick={saveToResearch}>
            {savedMessage ? <CheckCircle2 size={15} /> : <Save size={15} />}
            {savedMessage ? "Saved to Research" : "Save screening results"}
          </button>
        </section>
      )}

      {savedMessage && (
        <div className="ai-save-success">
          <CheckCircle2 size={16} />
          {savedMessage}
          <span>Open Research Workspace → Activity History to view it.</span>
        </div>
      )}

      <section className="ai-panel ai-model">
        <BrainCircuit size={25} />

        <div>
          <div className="ai-kicker">SUPERVISED ML MODEL STATUS</div>
          <h2>Validated training data required</h2>

          <p>
            Scikit-learn is installed, but no labelled experimental dataset
            or fitted QSAR model has been supplied. MoleculeLab will not
            invent prediction scores. A real model can be trained and
            evaluated when validated data is available.
          </p>
        </div>

        <span>DATASET NEEDED</span>
      </section>

      <footer className="ai-footer">
        MOLECULELAB · AI MOLECULAR INTELLIGENCE
        <span>RDKit fingerprint search · transparent screening</span>
      </footer>
    </div>
  );
}
