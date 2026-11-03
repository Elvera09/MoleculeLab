const API = "https://pubchem.ncbi.nlm.nih.gov/rest/pug";
export function getPubChemUrl(cid: number): string {
  return `https://pubchem.ncbi.nlm.nih.gov/compound/${cid}`;
}

export type SearchMode = "auto" | "name" | "formula" | "cid" | "smiles" | "inchi";

export interface Molecule {
  CID: number;
  MolecularFormula: string;
  MolecularWeight: string;
  IUPACName: string;
  InChIKey: string;
  CanonicalSMILES: string;
  IsomericSMILES?: string;
  XLogP?: number;
  ExactMass?: string;
  TPSA?: number;
  HBondDonorCount?: number;
  HBondAcceptorCount?: number;
  Complexity?: number;
  Charge?: number;
  Title?: string;
  Synonyms?: string[];
  Source?: string;
  SearchInput?: string;
  SearchMode?: SearchMode;
}

const PROPERTY_LIST = [
  "MolecularFormula",
  "MolecularWeight",
  "IUPACName",
  "InChIKey",
  "CanonicalSMILES",
  "IsomericSMILES",
  "XLogP",
  "ExactMass",
  "TPSA",
  "HBondDonorCount",
  "HBondAcceptorCount",
  "Complexity",
  "Charge",
].join(",");

async function requestJson(url: string): Promise<any> {
  let response: Response;
  try {
    response = await fetch(url, { headers: { Accept: "application/json" } });
  } catch {
    throw new Error("Could not connect to PubChem. Check your internet connection and try again.");
  }
  if (response.status === 404) {
    throw new Error("No matching PubChem record was found. Check the spelling or try another search type.");
  }
  if (response.status === 400) {
    throw new Error("PubChem could not interpret that identifier. Check the formula, SMILES, InChI or CID.");
  }
  if (response.status === 429) {
    throw new Error("PubChem is receiving too many requests right now. Wait a moment and try again.");
  }
  if (!response.ok) {
    throw new Error(`PubChem returned an error (${response.status}). Please try again shortly.`);
  }
  return response.json();
}

function detectMode(value: string): SearchMode {
  const q = value.trim();
  if (/^\d+$/.test(q)) return "cid";
  if (q.startsWith("InChI=")) return "inchi";
  // SMILES commonly contains bond, branch, ring, charge or bracket notation.
  if (/[\[\]@+\-=#$\\/().]/.test(q)) return "smiles";
  // A plain element-symbol formula such as C6H12O6.
  if (/^(?:[A-Z][a-z]?\d*){1,}$/.test(q) && /\d/.test(q)) return "formula";
  return "name";
}

async function resolveCid(query: string, mode: SearchMode): Promise<number> {
  if (mode === "cid") {
    const cid = Number(query.trim());
    if (!Number.isSafeInteger(cid) || cid <= 0) throw new Error("Enter a valid positive PubChem CID.");
    return cid;
  }

  const route =
    mode === "formula" ? "fastformula" :
    mode === "smiles" ? "smiles" :
    mode === "inchi" ? "inchi" :
    "name";

  const url = `${API}/compound/${route}/${encodeURIComponent(query.trim())}/cids/JSON`;
  const data = await requestJson(url);
  const cid = data?.IdentifierList?.CID?.[0];
  if (!cid) throw new Error("PubChem did not return a compound identifier for that search.");
  return Number(cid);
}

async function getProperties(cid: number): Promise<Molecule> {
  const data = await requestJson(
    `${API}/compound/cid/${cid}/property/${PROPERTY_LIST}/JSON`
  );
  const record = data?.PropertyTable?.Properties?.[0];
  if (!record) throw new Error("The PubChem record exists, but its molecular properties were unavailable.");
  return record as Molecule;
}

async function getSynonyms(cid: number): Promise<string[]> {
  try {
    const data = await requestJson(`${API}/compound/cid/${cid}/synonyms/JSON`);
    return (data?.InformationList?.Information?.[0]?.Synonym ?? []).slice(0, 12);
  } catch {
    // Synonyms are supplementary; a missing synonym response should not invalidate the molecule.
    return [];
  }
}

export async function searchMolecule(
  input: string,
  requestedMode: SearchMode = "auto"
): Promise<Molecule> {
  const query = input.trim();
  if (!query) throw new Error("Enter a molecule name or identifier first.");

  const mode = requestedMode === "auto" ? detectMode(query) : requestedMode;
  const cid = await resolveCid(query, mode);
  const [molecule, synonyms] = await Promise.all([
    getProperties(cid),
    getSynonyms(cid),
  ]);

  return {
    ...molecule,
    CID: cid,
    Synonyms: synonyms,
    Source: "PubChem PUG REST",
    SearchInput: query,
    SearchMode: mode,
  };
}

export function getMoleculeImage(cid: number): string {
  return `${API}/compound/cid/${cid}/PNG?image_size=large`;
}

export function getMolecule3D(cid: number): string {
  return `${API}/compound/cid/${cid}/record/SDF?record_type=3d`;
}

