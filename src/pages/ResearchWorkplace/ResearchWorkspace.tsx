
import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  Archive,
  Atom,
  BookOpen,
  BriefcaseBusiness,
  Download,
  FileText,
  FlaskConical,
  FolderPlus,
  History,
  Plus,
  Search,
  Trash2,
  X,
  Scale,
  Hash,
  Layers3,
} from "lucide-react";
import "./ResearchWorkspace.css";

type MoleculeRecord = {
  id: string;
  name: string;
  smiles: string;
  formula: string;
  projectId: string;
  notes: string;
  createdAt: string;
  cid?: number;
  source?: string;
};

type ElementRecord = {
  id: string;
  number: number;
  name: string;
  symbol: string;
  mass: string | number;
  category: string;
  period: number;
  group: number | null;
  block: string;
  createdAt: string;
  source?: string;
};

type Project = {
  id: string;
  name: string;
  description: string;
  createdAt: string;
};

type HistoryRecord = {
  id: string;
  title: string;
  detail: string;
  createdAt: string;
};

type Tab =
  | "library"
  | "elements"
  | "projects"
  | "history"
  | "reports";

const KEYS = {
  molecules: "moleculelab.research.molecules.v1",
  elements: "moleculelab.research.elements.v1",
  projects: "moleculelab.research.projects.v1",
  history: "moleculelab.research.history.v1",
};

function readStore<T>(key: string): T[] {
  try {
    const value = localStorage.getItem(key);
    return value ? (JSON.parse(value) as T[]) : [];
  } catch {
    return [];
  }
}

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function dateLabel(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString();
}

export default function ResearchWorkspace() {
  const [tab, setTab] = useState<Tab>("library");

  const [molecules, setMolecules] = useState<MoleculeRecord[]>(
    () => readStore<MoleculeRecord>(KEYS.molecules)
  );

  const [elements, setElements] = useState<ElementRecord[]>(
    () => readStore<ElementRecord>(KEYS.elements)
  );

  const [projects, setProjects] = useState<Project[]>(
    () => readStore<Project>(KEYS.projects)
  );

  const [history, setHistory] = useState<HistoryRecord[]>(
    () => readStore<HistoryRecord>(KEYS.history)
  );

  const [search, setSearch] = useState("");
  const [showMoleculeForm, setShowMoleculeForm] = useState(false);
  const [showProjectForm, setShowProjectForm] = useState(false);

  const [selectedMolecule, setSelectedMolecule] =
    useState<MoleculeRecord | null>(null);

  const [moleculeForm, setMoleculeForm] = useState({
    name: "",
    smiles: "",
    formula: "",
    projectId: "",
    notes: "",
  });

  const [projectForm, setProjectForm] = useState({
    name: "",
    description: "",
  });

  useEffect(() => {
    localStorage.setItem(KEYS.molecules, JSON.stringify(molecules));
  }, [molecules]);

  useEffect(() => {
    localStorage.setItem(KEYS.elements, JSON.stringify(elements));
  }, [elements]);

  useEffect(() => {
    localStorage.setItem(KEYS.projects, JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    localStorage.setItem(KEYS.history, JSON.stringify(history));
  }, [history]);

  const filteredMolecules = useMemo(
    () =>
      molecules.filter((item) =>
        `${item.name} ${item.smiles} ${item.formula}`
          .toLowerCase()
          .includes(search.toLowerCase())
      ),
    [molecules, search]
  );

  const filteredElements = useMemo(
    () =>
      elements.filter((item) =>
        `${item.name} ${item.symbol} ${item.number} ${item.category}`
          .toLowerCase()
          .includes(search.toLowerCase())
      ),
    [elements, search]
  );

  function addHistory(title: string, detail: string) {
    setHistory((current) => [
      {
        id: makeId(),
        title,
        detail,
        createdAt: new Date().toISOString(),
      },
      ...current,
    ]);
  }

  function saveMolecule(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const record: MoleculeRecord = {
      id: makeId(),
      ...moleculeForm,
      createdAt: new Date().toISOString(),
    };

    setMolecules((current) => [record, ...current]);

    addHistory(
      "Molecule saved",
      `${record.name}${record.formula ? ` · ${record.formula}` : ""}`
    );

    setMoleculeForm({
      name: "",
      smiles: "",
      formula: "",
      projectId: "",
      notes: "",
    });

    setShowMoleculeForm(false);
  }

  function saveProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const project: Project = {
      id: makeId(),
      ...projectForm,
      createdAt: new Date().toISOString(),
    };

    setProjects((current) => [project, ...current]);
    addHistory("Project created", project.name);

    setProjectForm({ name: "", description: "" });
    setShowProjectForm(false);
  }

  function deleteMolecule(id: string) {
    const item = molecules.find((molecule) => molecule.id === id);

    setMolecules((current) =>
      current.filter((molecule) => molecule.id !== id)
    );

    if (item) {
      addHistory("Molecule removed", item.name);
    }

    if (selectedMolecule?.id === id) {
      setSelectedMolecule(null);
    }
  }

  function deleteElement(id: string) {
    const item = elements.find((element) => element.id === id);

    setElements((current) =>
      current.filter((element) => element.id !== id)
    );

    if (item) {
      addHistory(
        "Element removed",
        `${item.name} (${item.symbol}) · Atomic number ${item.number}`
      );
    }
  }

  function deleteProject(id: string) {
    const project = projects.find((item) => item.id === id);

    setProjects((current) =>
      current.filter((item) => item.id !== id)
    );

    setMolecules((current) =>
      current.map((item) =>
        item.projectId === id
          ? { ...item, projectId: "" }
          : item
      )
    );

    if (project) {
      addHistory("Project removed", project.name);
    }
  }

  function downloadReport() {
    const lines = [
      "MoleculeLab — Research Workspace Report",
      `Generated: ${new Date().toLocaleString()}`,
      "",
      `Projects (${projects.length})`,
      ...projects.map(
        (project) =>
          `- ${project.name}: ${project.description || "No description"}`
      ),
      "",
      `Saved molecules (${molecules.length})`,
      ...molecules.map(
        (item) =>
          `- ${item.name} | Formula: ${item.formula || "Not supplied"} | SMILES: ${item.smiles || "Not supplied"} | Project: ${projects.find((project) => project.id === item.projectId)?.name || "Unassigned"} | Notes: ${item.notes || "None"}`
      ),
      "",
      `Saved elements (${elements.length})`,
      ...elements.map(
        (item) =>
          `- ${item.name} (${item.symbol}) | Atomic number: ${item.number} | Atomic mass: ${item.mass} | Category: ${item.category} | Period: ${item.period} | Group: ${item.group ?? "Series"} | Block: ${item.block}`
      ),
      "",
      `Activity history (${history.length})`,
      ...history.map(
        (item) =>
          `- ${dateLabel(item.createdAt)} | ${item.title} | ${item.detail}`
      ),
      "",
      "Note: This report contains user-saved workspace data. It does not independently verify chemical structures or calculated properties.",
    ];

    const blob = new Blob([lines.join("\n")], {
      type: "text/plain;charset=utf-8",
    });

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = "MoleculeLab-Research-Report.txt";
    anchor.click();

    URL.revokeObjectURL(url);

    addHistory(
      "Research report exported",
      "MoleculeLab-Research-Report.txt"
    );
  }

  const navItems: {
    id: Tab;
    label: string;
    icon: typeof Archive;
  }[] = [
    { id: "library", label: "Molecule Library", icon: Archive },
    { id: "elements", label: "Element Collection", icon: Atom },
    { id: "projects", label: "Research Projects", icon: BriefcaseBusiness },
    { id: "history", label: "Activity History", icon: History },
    { id: "reports", label: "Reports", icon: FileText },
  ];

  return (
    <main className="research-workspace">
      <header className="rw-hero">
        <div className="rw-eyebrow">
          <FlaskConical size={15} />
          MOLECULELAB / RESEARCH
        </div>

        <div className="rw-hero-row">
          <div>
            <h1>Research Workspace</h1>
            <p>
              Your central space for saved compounds, elements,
              projects and research activity.
            </p>
          </div>

          <div className="rw-hero-mark">
            <BookOpen size={30} />
          </div>
        </div>

        <div className="rw-stats">
          <div>
            <strong>{molecules.length}</strong>
            <span>Saved molecules</span>
          </div>

          <div>
            <strong>{elements.length}</strong>
            <span>Saved elements</span>
          </div>

          <div>
            <strong>{projects.length}</strong>
            <span>Research projects</span>
          </div>

          <div>
            <strong>{history.length}</strong>
            <span>Activity records</span>
          </div>
        </div>
      </header>

      <nav className="rw-tabs" aria-label="Research workspace sections">
        {navItems.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            className={tab === id ? "active" : ""}
            onClick={() => {
              setTab(id);
              setSearch("");
            }}
          >
            <Icon size={17} />
            {label}
          </button>
        ))}
      </nav>

      {tab === "library" && (
        <section className="rw-section">
          <div className="rw-section-heading">
            <div>
              <h2>Molecule Library</h2>
              <p>Keep the compounds you want to revisit.</p>
            </div>

            <button
              className="rw-primary"
              onClick={() => setShowMoleculeForm(true)}
            >
              <Plus size={17} /> Save molecule
            </button>
          </div>

          <label className="rw-search">
            <Search size={17} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by name, formula or SMILES..."
            />
          </label>

          {filteredMolecules.length === 0 ? (
            <div className="rw-empty">
              <Archive size={28} />
              <h3>
                {molecules.length
                  ? "No matching molecules"
                  : "Your library is empty"}
              </h3>
              <p>
                {molecules.length
                  ? "Try another search term."
                  : "Save a molecule to start building your research collection."}
              </p>

              {!molecules.length && (
                <button
                  className="rw-secondary"
                  onClick={() => setShowMoleculeForm(true)}
                >
                  <Plus size={16} /> Add your first molecule
                </button>
              )}
            </div>
          ) : (
            <div className="rw-molecule-grid">
              {filteredMolecules.map((item) => (
                <article className="rw-molecule-card" key={item.id}>
                  <div className="rw-card-top">
                    <span className="rw-molecule-icon">
                      <FlaskConical size={18} />
                    </span>

                    <button
                      className="rw-icon-button"
                      title="Delete molecule"
                      onClick={() => deleteMolecule(item.id)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <h3>{item.name}</h3>
                  <div className="rw-formula">
                    {item.formula || "Formula not supplied"}
                  </div>

                  <p className="rw-smiles">
                    {item.smiles || "No SMILES supplied"}
                  </p>

                  <div className="rw-card-foot">
                    <span>
                      {projects.find(
                        (project) => project.id === item.projectId
                      )?.name || "Unassigned"}
                    </span>

                    <button onClick={() => setSelectedMolecule(item)}>
                      View details
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      {tab === "elements" && (
        <section className="rw-section">
          <div className="rw-section-heading">
            <div>
              <h2>Element Collection</h2>
              <p>
                Elements saved from your Periodic Universe explorer.
              </p>
            </div>

            <span className="rw-element-total">
              <Atom size={16} />
              {elements.length} saved
            </span>
          </div>

          <label className="rw-search">
            <Search size={17} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by element, symbol, atomic number or category..."
            />
          </label>

          {filteredElements.length === 0 ? (
            <div className="rw-empty">
              <Atom size={30} />

              <h3>
                {elements.length
                  ? "No matching elements"
                  : "Your element collection is empty"}
              </h3>

              <p>
                {elements.length
                  ? "Try another search term."
                  : "Open the Periodic Table, select an element and save it to Research Workspace."}
              </p>
            </div>
          ) : (
            <div className="rw-element-grid">
              {filteredElements.map((item) => (
                <article className="rw-element-card" key={item.id}>
                  <div className="rw-element-card-top">
                    <span className="rw-element-number">
                      {item.number}
                    </span>

                    <button
                      className="rw-icon-button"
                      title="Remove element"
                      onClick={() => deleteElement(item.id)}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>

                  <div className="rw-element-symbol">
                    {item.symbol}
                  </div>

                  <h3>{item.name}</h3>
                  <span className="rw-element-category">
                    {item.category}
                  </span>

                  <div className="rw-element-properties">
                    <div>
                      <span><Scale size={13} /> Atomic mass</span>
                      <strong>{item.mass}</strong>
                    </div>

                    <div>
                      <span><Layers3 size={13} /> Period</span>
                      <strong>{item.period}</strong>
                    </div>

                    <div>
                      <span><Hash size={13} /> Group</span>
                      <strong>{item.group ?? "Series"}</strong>
                    </div>

                    <div>
                      <span><Atom size={13} /> Block</span>
                      <strong>{item.block.toUpperCase()}</strong>
                    </div>
                  </div>

                  <p className="rw-element-date">
                    Saved {dateLabel(item.createdAt)}
                  </p>
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      {tab === "projects" && (
        <section className="rw-section">
          <div className="rw-section-heading">
            <div>
              <h2>Research Projects</h2>
              <p>Organise molecules into focused investigations.</p>
            </div>

            <button
              className="rw-primary"
              onClick={() => setShowProjectForm(true)}
            >
              <FolderPlus size={17} /> New project
            </button>
          </div>

          {projects.length === 0 ? (
            <div className="rw-empty">
              <BriefcaseBusiness size={28} />
              <h3>No research projects yet</h3>
              <p>
                Create a project, then assign saved molecules to it.
              </p>

              <button
                className="rw-secondary"
                onClick={() => setShowProjectForm(true)}
              >
                <Plus size={16} /> Create project
              </button>
            </div>
          ) : (
            <div className="rw-project-list">
              {projects.map((project) => {
                const count = molecules.filter(
                  (item) => item.projectId === project.id
                ).length;

                return (
                  <article className="rw-project-card" key={project.id}>
                    <div className="rw-project-symbol">
                      <BriefcaseBusiness size={20} />
                    </div>

                    <div className="rw-project-copy">
                      <h3>{project.name}</h3>
                      <p>{project.description || "No project description"}</p>
                      <span>
                        {count} saved molecule{count === 1 ? "" : "s"} ·
                        Created {dateLabel(project.createdAt)}
                      </span>
                    </div>

                    <button
                      className="rw-icon-button"
                      title="Delete project"
                      onClick={() => deleteProject(project.id)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      )}

      {tab === "history" && (
        <section className="rw-section">
          <div className="rw-section-heading">
            <div>
              <h2>Activity History</h2>
              <p>A record of actions performed in this workspace.</p>
            </div>
          </div>

          {history.length === 0 ? (
            <div className="rw-empty">
              <History size={28} />
              <h3>No activity yet</h3>
              <p>
                Saving a molecule or creating a project will appear here.
              </p>
            </div>
          ) : (
            <div className="rw-history-list">
              {history.map((item) => (
                <article key={item.id} className="rw-history-item">
                  <span className="rw-history-dot" />

                  <div>
                    <strong>{item.title}</strong>
                    <p>{item.detail}</p>
                    <time>{dateLabel(item.createdAt)}</time>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      {tab === "reports" && (
        <section className="rw-section">
          <div className="rw-section-heading">
            <div>
              <h2>Research Reports</h2>
              <p>Export a snapshot of your saved workspace data.</p>
            </div>
          </div>

          <article className="rw-report-card">
            <div className="rw-report-icon">
              <FileText size={25} />
            </div>

            <div className="rw-report-copy">
              <h3>Workspace summary report</h3>
              <p>
                Includes your projects, saved molecules, saved elements
                and activity history. Exported as a plain-text file.
              </p>

              <div className="rw-report-meta">
                {projects.length} projects · {molecules.length} molecules ·
                {elements.length} elements · {history.length} activity records
              </div>
            </div>

            <button className="rw-primary" onClick={downloadReport}>
              <Download size={17} /> Export report
            </button>
          </article>

          <p className="rw-note">
            Reports contain the information you saved. Chemical structures
            and properties are not independently revalidated during export.
          </p>
        </section>
      )}

      {showMoleculeForm && (
        <div
          className="rw-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setShowMoleculeForm(false);
            }
          }}
        >
          <form className="rw-modal" onSubmit={saveMolecule}>
            <div className="rw-modal-head">
              <div>
                <h2>Save a molecule</h2>
                <p>Add a compound to your research library.</p>
              </div>

              <button
                type="button"
                className="rw-icon-button"
                onClick={() => setShowMoleculeForm(false)}
              >
                <X size={19} />
              </button>
            </div>

            <label>
              Molecule name
              <input
                required
                value={moleculeForm.name}
                onChange={(event) =>
                  setMoleculeForm({
                    ...moleculeForm,
                    name: event.target.value,
                  })
                }
                placeholder="e.g. Caffeine"
              />
            </label>

            <label>
              SMILES
              <input
                value={moleculeForm.smiles}
                onChange={(event) =>
                  setMoleculeForm({
                    ...moleculeForm,
                    smiles: event.target.value,
                  })
                }
                placeholder="Molecular SMILES"
              />
            </label>

            <label>
              Molecular formula
              <input
                value={moleculeForm.formula}
                onChange={(event) =>
                  setMoleculeForm({
                    ...moleculeForm,
                    formula: event.target.value,
                  })
                }
                placeholder="e.g. C8H10N4O2"
              />
            </label>

            <label>
              Research project
              <select
                value={moleculeForm.projectId}
                onChange={(event) =>
                  setMoleculeForm({
                    ...moleculeForm,
                    projectId: event.target.value,
                  })
                }
              >
                <option value="">Unassigned</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Notes
              <textarea
                rows={3}
                value={moleculeForm.notes}
                onChange={(event) =>
                  setMoleculeForm({
                    ...moleculeForm,
                    notes: event.target.value,
                  })
                }
                placeholder="Why are you saving this molecule?"
              />
            </label>

            <div className="rw-modal-actions">
              <button
                type="button"
                className="rw-secondary"
                onClick={() => setShowMoleculeForm(false)}
              >
                Cancel
              </button>

              <button type="submit" className="rw-primary">
                Save molecule
              </button>
            </div>
          </form>
        </div>
      )}

      {showProjectForm && (
        <div
          className="rw-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setShowProjectForm(false);
            }
          }}
        >
          <form className="rw-modal" onSubmit={saveProject}>
            <div className="rw-modal-head">
              <div>
                <h2>Create research project</h2>
                <p>Give your investigation a name and purpose.</p>
              </div>

              <button
                type="button"
                className="rw-icon-button"
                onClick={() => setShowProjectForm(false)}
              >
                <X size={19} />
              </button>
            </div>

            <label>
              Project name
              <input
                required
                value={projectForm.name}
                onChange={(event) =>
                  setProjectForm({
                    ...projectForm,
                    name: event.target.value,
                  })
                }
                placeholder="e.g. Anti-inflammatory compounds"
              />
            </label>

            <label>
              Description
              <textarea
                rows={4}
                value={projectForm.description}
                onChange={(event) =>
                  setProjectForm({
                    ...projectForm,
                    description: event.target.value,
                  })
                }
                placeholder="What are you investigating?"
              />
            </label>

            <div className="rw-modal-actions">
              <button
                type="button"
                className="rw-secondary"
                onClick={() => setShowProjectForm(false)}
              >
                Cancel
              </button>

              <button type="submit" className="rw-primary">
                Create project
              </button>
            </div>
          </form>
        </div>
      )}

      {selectedMolecule && (
        <div
          className="rw-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedMolecule(null);
            }
          }}
        >
          <div className="rw-modal">
            <div className="rw-modal-head">
              <div>
                <h2>{selectedMolecule.name}</h2>
                <p>Saved molecule details</p>
              </div>

              <button
                className="rw-icon-button"
                onClick={() => setSelectedMolecule(null)}
              >
                <X size={19} />
              </button>
            </div>

            <div className="rw-detail-grid">
              <div>
                <span>Formula</span>
                <strong>
                  {selectedMolecule.formula || "Not supplied"}
                </strong>
              </div>

              <div>
                <span>Project</span>
                <strong>
                  {projects.find(
                    (project) =>
                      project.id === selectedMolecule.projectId
                  )?.name || "Unassigned"}
                </strong>
              </div>
            </div>

            <label>
              SMILES
              <pre className="rw-code-value">
                {selectedMolecule.smiles || "Not supplied"}
              </pre>
            </label>

            <label>
              Notes
              <p className="rw-detail-notes">
                {selectedMolecule.notes || "No notes added."}
              </p>
            </label>

            <p className="rw-note">
              Saved {dateLabel(selectedMolecule.createdAt)}
            </p>

            <div className="rw-modal-actions">
              <button
                className="rw-secondary"
                onClick={() => setSelectedMolecule(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="rw-footer">
        <span>MOLECULELAB RESEARCH WORKSPACE</span>
        <span>Local workspace storage · This browser</span>
      </footer>
    </main>
  );
}
