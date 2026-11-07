
const API = (
  import.meta.env.VITE_API_URL || "https://moleculelab.onrender.com"
).replace(/\/$/, "");

export interface RDKitAnalysis {
  name: string;
  formula: string;
  canonical_smiles: string;
  molecular_weight: number;
  exact_mass: number;
  logp: number;
  tpsa: number;
  h_bond_donors: number;
  h_bond_acceptors: number;
  rotatable_bonds: number;
  ring_count: number;
  source: string;
}

async function postAnalysis(
  path: string,
  body: Record<string, string>
): Promise<RDKitAnalysis> {
  let response: Response;

  try {
    response = await fetch(`${API}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error(
      "Cannot connect to MoleculeLab Chemistry Engine. Check the deployed backend connection."
    );
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      typeof data.detail === "string"
        ? data.detail
        : "Molecular analysis failed. Check the structure."
    );
  }

  return data as RDKitAnalysis;
}

export async function analyzeSmiles(
  smiles: string
): Promise<RDKitAnalysis> {
  const query = smiles.trim();

  if (!query) {
    throw new Error("Please enter a valid SMILES structure.");
  }

  return postAnalysis("/analyze", { smiles: query });
}

export async function analyzeMolfile(
  molfile: string
): Promise<RDKitAnalysis> {
  const query = molfile.trim();

  if (!query) {
    throw new Error("Draw a structure before validating it.");
  }

  return postAnalysis("/analyze-molfile", { molfile: query });
}

export async function checkRDKitHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API}/health`);

    if (!response.ok) return false;

    const data = await response.json();

    return data.status === "healthy" && data.engine === "RDKit";
  } catch {
    return false;
  }
}
export interface DatasetMolecule extends RDKitAnalysis {
  id: string;
  category: string;
}

export interface DatasetAnalysisResponse {
  dataset: string;
  total_molecules: number;
  results: DatasetMolecule[];
}

export async function analyzeDataset(): Promise<DatasetAnalysisResponse> {
  let response: Response;

  try {
    response = await fetch(`${API}/dataset/analysis`, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });
  } catch {
    throw new Error(
      "Cannot connect to MoleculeLab Chemistry Engine. Check the backend connection."
    );
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      typeof data.detail === "string"
        ? data.detail
        : "Dataset analysis failed."
    );
  }

  return data as DatasetAnalysisResponse;
}

export interface DatasetSimilarityResult {
  id: string;
  name: string;
  category: string;
  formula: string;
  similarity: number;
  molecular_weight: number;
  logp: number;
}

export interface DatasetSimilarityResponse {
  results: DatasetSimilarityResult[];
  method: string;
  dataset_size: number;
}

export interface LipinskiResult {
  id: string;
  name: string;
  category: string;
  formula: string;
  molecular_weight: number;
  logp: number;
  tpsa: number;
  h_bond_donors: number;
  h_bond_acceptors: number;
  passes: boolean;
  reasons: string[];
}

export interface LipinskiResponse {
  results: LipinskiResult[];
  total_molecules: number;
  passing: number;
  failing: number;
  explanation: string;
}

export async function findDatasetSimilarity(
  smiles: string
): Promise<DatasetSimilarityResponse> {
  const query = smiles.trim();

  if (!query) {
    throw new Error("Enter a valid SMILES structure.");
  }

  let response: Response;

  try {
    response = await fetch(`${API}/dataset/similarity`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ smiles: query }),
    });
  } catch {
    throw new Error("Cannot connect to the MoleculeLab Chemistry Engine.");
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      typeof data.detail === "string"
        ? data.detail
        : "Molecular similarity analysis failed."
    );
  }

  return data as DatasetSimilarityResponse;
}

export async function screenDataset(): Promise<LipinskiResponse> {
  let response: Response;

  try {
    response = await fetch(`${API}/dataset/screen`, {
      method: "GET",
      headers: { Accept: "application/json" },
    });
  } catch {
    throw new Error("Cannot connect to the MoleculeLab Chemistry Engine.");
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      typeof data.detail === "string"
        ? data.detail
        : "Lipinski screening failed."
    );
  }

  return data as LipinskiResponse;
}
