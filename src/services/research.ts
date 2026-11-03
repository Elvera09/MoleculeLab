
import type { Molecule } from "./pubchem";

const STORAGE_KEY = "moleculelab.research.molecules.v1";

interface SavedMolecule {
  id: string;
  name: string;
  smiles: string;
  formula: string;
  projectId: string;
  notes: string;
  createdAt: string;
  cid?: number;
  source?: string;
}

export function saveMoleculeToResearch(
  molecule: Molecule
): boolean {
  if (!molecule?.CID) {
    throw new Error("Invalid molecule record.");
  }

  let saved: SavedMolecule[] = [];

  try {
    saved = JSON.parse(
      localStorage.getItem(STORAGE_KEY) || "[]"
    );
  } catch {
    throw new Error("Could not read your research library.");
  }

  const alreadyExists = saved.some(
    (item) => item.cid === molecule.CID
  );

  if (alreadyExists) {
    return false;
  }

  const record: SavedMolecule = {
    id: `${Date.now()}-${molecule.CID}`,
    name: molecule.Title || molecule.IUPACName || `CID ${molecule.CID}`,
    smiles: molecule.CanonicalSMILES || "",
    formula: molecule.MolecularFormula || "",
    projectId: "",
    notes: "Saved from Molecular Discovery",
    createdAt: new Date().toISOString(),
    cid: molecule.CID,
    source: "PubChem"
  };

  saved.unshift(record);

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(saved)
  );

  return true;
}
