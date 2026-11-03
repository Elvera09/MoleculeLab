import { useState, type ChangeEvent, type FormEvent } from "react";
import { motion } from "motion/react";
import { BrainCircuit, Upload, Activity, AlertCircle, CheckCircle2, LoaderCircle, Info } from "lucide-react";
import "./MLPrediction.css";

const API = "http://127.0.0.1:8000";

type TrainingResult = {
  property_name: string; rows_used: number; train_rows: number; test_rows: number;
  metrics: { r2: number | null; mae: number; rmse: number };
  model: string; features: string; note: string;
};

export default function MLPrediction() {
  const [file, setFile] = useState<File | null>(null);
  const [propertyName, setPropertyName] = useState("Property");
  const [training, setTraining] = useState(false);
  const [result, setResult] = useState<TrainingResult | null>(null);
  const [smiles, setSmiles] = useState("CC(=O)OC1=CC=CC=C1C(=O)O");
  const [prediction, setPrediction] = useState<number | null>(null);
  const [predicting, setPredicting] = useState(false);
  const [error, setError] = useState("");

  function chooseFile(e: ChangeEvent<HTMLInputElement>) {
    setFile(e.target.files?.[0] ?? null); setResult(null); setPrediction(null); setError("");
  }

  async function trainModel(e: FormEvent) {
    e.preventDefault();
    if (!file) { setError("Choose a CSV dataset first."); return; }
    setTraining(true); setError(""); setResult(null); setPrediction(null);
    const body = new FormData(); body.append("file", file); body.append("property_name", propertyName);
    try {
      const response = await fetch(`${API}/ml/train`, { method: "POST", body });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Model training failed.");
      setResult(data);
    } catch (err) { setError(err instanceof Error ? err.message : "Could not connect to the backend."); }
    finally { setTraining(false); }
  }

  async function runPrediction() {
    setPredicting(true); setError(""); setPrediction(null);
    try {
      const response = await fetch(`${API}/ml/predict`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ smiles }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Prediction failed.");
      setPrediction(data.prediction);
    } catch (err) { setError(err instanceof Error ? err.message : "Prediction failed."); }
    finally { setPredicting(false); }
  }

  return <div className="ml-page">
    <header className="ml-header">
      <div><span className="ml-eyebrow">MOLECULAR INTELLIGENCE / MACHINE LEARNING</span>
        <h1>Property Prediction Lab</h1>
        <p>Train a model from your molecular dataset, inspect its test performance, then predict a property for a new SMILES.</p>
      </div>
      <div className="ml-icon"><BrainCircuit size={27}/></div>
    </header>

    <motion.section className="ml-panel" initial={{opacity:0,y:12}} animate={{opacity:1,y:0}}>
      <div className="ml-title"><Upload size={18}/><h2>1. Upload a training dataset</h2></div>
      <p className="ml-copy">Your CSV must contain two columns: <code>smiles</code> and <code>target</code>. Each row is one molecule and its measured property value.</p>
      <div className="ml-format"><strong>Example CSV format</strong><pre>{`smiles,target\nCCO, -0.001\nCC(=O)O, 0.09\nc1ccccc1, 2.13`}</pre>
        <a href="/ml-dataset-template.csv" download>Download CSV template</a>
      </div>
      <form onSubmit={trainModel}>
        <label className="ml-label" htmlFor="ml-property">Property name (e.g. measured LogP, solubility)</label>
        <input id="ml-property" value={propertyName} onChange={e=>setPropertyName(e.target.value)} placeholder="Property name"/>
        <label className="ml-upload" htmlFor="ml-file"><Upload size={19}/><span>{file ? file.name : "Choose your CSV dataset"}</span><input id="ml-file" type="file" accept=".csv,text/csv" onChange={chooseFile}/></label>
        <button className="ml-primary" type="submit" disabled={training || !file}>{training ? <><LoaderCircle className="ml-spin" size={18}/> Training model…</> : <><BrainCircuit size={18}/> Train and evaluate model</>}</button>
      </form>
    </motion.section>

    {result && <motion.section className="ml-panel" initial={{opacity:0,y:12}} animate={{opacity:1,y:0}}>
      <div className="ml-title"><CheckCircle2 size={18}/><h2>2. Model evaluation</h2></div>
      <div className="ml-metrics">
        <div><span>MAE</span><strong>{result.metrics.mae.toFixed(4)}</strong></div>
        <div><span>RMSE</span><strong>{result.metrics.rmse.toFixed(4)}</strong></div>
        <div><span>R²</span><strong>{result.metrics.r2 === null ? "N/A" : result.metrics.r2.toFixed(4)}</strong></div>
      </div>
      <div className="ml-details"><p><b>Property:</b> {result.property_name}</p><p><b>Valid molecules:</b> {result.rows_used} ({result.train_rows} train / {result.test_rows} test)</p><p><b>Model:</b> {result.model}</p><p><b>Features:</b> {result.features}</p><p>{result.note}</p></div>
    </motion.section>}

    <section className="ml-panel">
      <div className="ml-title"><Activity size={18}/><h2>3. Predict a new molecule</h2></div>
      <p className="ml-copy">Train a model first. Then enter a molecule's SMILES to estimate the same property.</p>
      <label className="ml-label" htmlFor="ml-smiles">Molecule SMILES</label>
      <textarea id="ml-smiles" rows={2} value={smiles} onChange={e=>setSmiles(e.target.value)}/>
      <button className="ml-primary" type="button" onClick={runPrediction} disabled={predicting || !result || !smiles.trim()}>{predicting ? <><LoaderCircle className="ml-spin" size={18}/> Predicting…</> : "Predict property"}</button>
      {prediction !== null && <div className="ml-prediction"><span>Predicted {result?.property_name}</span><strong>{prediction.toFixed(5)}</strong></div>}
      {!result && <p className="ml-muted">Prediction becomes available after a successful training run.</p>}
    </section>

    {error && <div className="ml-error"><AlertCircle size={18}/>{error}</div>}
    <div className="ml-warning"><Info size={18}/><span>Model output is an estimate, not an experimental measurement. Performance depends on dataset size, quality, chemical diversity and the train/test split. Do not use this starter model for clinical, safety or regulatory decisions.</span></div>
  </div>;
}
