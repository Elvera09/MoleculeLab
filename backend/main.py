
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from rdkit import Chem, DataStructs
from rdkit.Chem import Descriptors, rdMolDescriptors, Crippen, Lipinski, AllChem

app = FastAPI(
    title="MoleculeLab Chemistry Engine",
    description="RDKit molecular analysis and intelligence tools",
    version="1.2.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://molecule-lab-xi.vercel.app",
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class MoleculeRequest(BaseModel):
    smiles: str


class MolfileRequest(BaseModel):
    molfile: str


class SimilarityRequest(BaseModel):
    smiles: str
    limit: int = 8


class ScreenRequest(BaseModel):
    smiles: list[str]


REFERENCE = [
    ("Aspirin", "CC(=O)OC1=CC=CC=C1C(=O)O"),
    ("Caffeine", "Cn1c(=O)c2c(ncn2C)n(C)c1=O"),
    ("Ibuprofen", "CC(C)CC1=CC=C(C=C1)C(C)C(=O)O"),
    ("Paracetamol", "CC(=O)NC1=CC=C(O)C=C1"),
    ("Naproxen", "COC1=CC2=CC=CC=C2C=C1C(C)C(=O)O"),
    ("Theobromine", "Cn1c(=O)c2(ncn2)nc1O"),
    ("Theophylline", "Cn1c(=O)c2[nH]cnc2n(C)c1=O"),
    ("Benzoic acid", "O=C(O)c1ccccc1"),
    ("Phenacetin", "CCOc1ccc(NC(C)=O)cc1"),
    ("Acetylsalicylic acid", "CC(=O)OC1=CC=CC=C1C(=O)O")
]


def parse(smiles):
    mol = Chem.MolFromSmiles(smiles.strip())
    if mol is None:
        raise HTTPException(
            status_code=422,
            detail="RDKit could not parse this SMILES. Check the structure."
        )
    return mol


def props(mol):
    return {
        "name": "Molecule analysis",
        "formula": rdMolDescriptors.CalcMolFormula(mol),
        "canonical_smiles": Chem.MolToSmiles(mol),
        "molecular_weight": round(Descriptors.MolWt(mol), 4),
        "exact_mass": round(Descriptors.ExactMolWt(mol), 4),
        "logp": round(Crippen.MolLogP(mol), 4),
        "tpsa": round(Descriptors.TPSA(mol), 4),
        "h_bond_donors": Lipinski.NumHDonors(mol),
        "h_bond_acceptors": Lipinski.NumHAcceptors(mol),
        "rotatable_bonds": Lipinski.NumRotatableBonds(mol),
        "ring_count": rdMolDescriptors.CalcNumRings(mol),
        "source": "Calculated using RDKit"
    }


@app.get("/")
def home():
    return {
        "message": "MoleculeLab Chemistry Engine is running!",
        "engine": "RDKit"
    }


@app.get("/health")
def health():
    return {"status": "healthy", "engine": "RDKit"}


@app.post("/analyze")
def analyze(request: MoleculeRequest):
    return props(parse(request.smiles))


@app.post("/analyze-molfile")
def analyze_molfile(request: MolfileRequest):
    try:
        mol = Chem.MolFromMolBlock(
            request.molfile, sanitize=True, removeHs=True
        )
    except Exception:
        mol = None

    if mol is None:
        raise HTTPException(
            status_code=422,
            detail="Invalid MOL drawing. Check atoms, bonds and valences."
        )

    return props(mol)


@app.post("/ai/similarity")
def similarity(request: SimilarityRequest):
    query = parse(request.smiles)
    query_fp = AllChem.GetMorganFingerprintAsBitVect(
        query, 2, nBits=2048
    )

    found = []

    for name, smiles in REFERENCE:
        mol = Chem.MolFromSmiles(smiles)
        if mol is None:
            continue

        fingerprint = AllChem.GetMorganFingerprintAsBitVect(
            mol, 2, nBits=2048
        )

        found.append({
            "name": name,
            "formula": rdMolDescriptors.CalcMolFormula(mol),
            "similarity": round(
                float(DataStructs.TanimotoSimilarity(
                    query_fp, fingerprint
                )), 4
            ),
            "molecular_weight": Descriptors.MolWt(mol),
            "logp": Crippen.MolLogP(mol)
        })

    found.sort(key=lambda item: item["similarity"], reverse=True)

    return {
        "results": found[:max(1, min(request.limit, 10))],
        "method": "Morgan radius-2 · 2048-bit · Tanimoto"
    }


@app.post("/ai/screen")
def screen(request: ScreenRequest):
    if not request.smiles:
        raise HTTPException(
            status_code=422,
            detail="No molecules supplied."
        )

    results = []

    for index, smiles in enumerate(request.smiles):
        mol = parse(smiles)

        mw = Descriptors.MolWt(mol)
        logp = Crippen.MolLogP(mol)
        donors = Lipinski.NumHDonors(mol)
        acceptors = Lipinski.NumHAcceptors(mol)

        reasons = []

        if mw > 500:
            reasons.append("MW > 500")
        if logp > 5:
            reasons.append("LogP > 5")
        if donors > 5:
            reasons.append("HBD > 5")
        if acceptors > 10:
            reasons.append("HBA > 10")

        results.append({
            "name": (
                REFERENCE[index][0]
                if index < len(REFERENCE)
                else f"Compound {index + 1}"
            ),
            "formula": rdMolDescriptors.CalcMolFormula(mol),
            "molecular_weight": mw,
            "logp": logp,
            "tpsa": Descriptors.TPSA(mol),
            "passes": not reasons,
            "reasons": reasons
        })

    return {
        "results": results,
        "explanation": (
            "Rule-based screening using common Lipinski cut-offs. "
            "Passing does not establish efficacy, safety or biological activity."
        )
    }
