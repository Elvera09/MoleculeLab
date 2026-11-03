import ResearchWorkspace from "./pages/ResearchWorkplace/ResearchWorkspace";
import Intelligence from "./pages/Intelligence/Intelligence";
import Analytics from "./pages/Analytics/Analytics";
import PeriodicTable from "./pages/PeriodicTable/PeriodicTable";
import CosmicUniverse from "./components/cosmic/cosmic/CosmicUniverse";
import ScienceSuite from "./pages/ScienceSuite/ScienceSuite";
import Visualizer from "./pages/Visualizer/Visualizer";
import "./styles/MoleculeLabPremium.css";
import Discovery from "./pages/Discovery/Discovery";
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  BrowserRouter,
  NavLink,
  Routes,
  Route,
  useLocation,
  useNavigate,
} from "react-router-dom";
import {
  Atom,
  Search,
  LayoutDashboard,
  Compass,
  Table2,
  Orbit,
  ChartNoAxesCombined,
  PenTool,
  BrainCircuit,
  FlaskConical,
  FolderKanban,
  Settings,
  UserRound,
  BookOpen,
  Save,
  ChevronDown,
  ArrowUpRight,
  Sparkles,
  Plus,
  Menu,
  X,
  Database,
  Clock3,
  Command,
  CircleHelp,
} from "lucide-react";
import "./App.css";
import StructureStudio from "./pages/StructureStudio/StructureStudio";
import SettingsPage from "./pages/Settings/Settings";
import ComputationalLab from "./pages/ComputationalLab/ComputationalLab";

const modules = [
  { name: "Overview", path: "/", icon: LayoutDashboard, group: "WORKSPACE" },
  { name: "Discovery", path: "/discovery", icon: Compass, group: "EXPLORE" },
  { name: "Periodic Universe", path: "/periodic-table", icon: Table2, group: "EXPLORE" },
  { name: "3D Visualizer", path: "/visualizer", icon: Orbit, group: "EXPLORE" },
  { name: "Molecular Analytics", path: "/analytics", icon: ChartNoAxesCombined, group: "ANALYZE" },
  { name: "Structure Studio", path: "/structure-studio", icon: PenTool, group: "ANALYZE" },
  { name: "AI Intelligence", path: "/intelligence", icon: BrainCircuit, group: "INTELLIGENCE" },
  { name: "Computational Lab", path: "/computational-lab", icon: FlaskConical, group: "INTELLIGENCE" },
  { name: "Research Workspace", path: "/research", icon: FolderKanban, group: "WORKSPACE" },
];

const pageInfo: Record<
  string,
  { title: string; description: string; icon: typeof Atom }
> = {
  "/discovery": {
    title: "Molecular Discovery",
    description: "Search and investigate molecular identities.",
    icon: Compass,
  },
  "/periodic-table": {
    title: "Periodic Universe",
    description: "Explore all 118 chemical elements.",
    icon: Table2,
  },
  "/visualizer": {
    title: "3D Molecular Visualizer",
    description: "Explore molecular geometry in three dimensions.",
    icon: Orbit,
  },
  "/analytics": {
    title: "Molecular Analytics",
    description: "Investigate chemical descriptors and properties.",
    icon: ChartNoAxesCombined,
  },
  "/structure-studio": {
    title: "Structure Studio",
    description: "Create and edit chemical structures.",
    icon: PenTool,
  },
  "/intelligence": {
    title: "AI Molecular Intelligence",
    description: "Explore model-assisted molecular predictions.",
    icon: BrainCircuit,
  },
  "/computational-lab": {
    title: "Computational Chemistry Lab",
    description: "Build and run scientific computations.",
    icon: FlaskConical,
  },
  "/research": {
    title: "Research Workspace",
    description: "Organise molecules and research projects.",
    icon: FolderKanban,
  },
  "/settings": {
    title: "Laboratory Settings",
    description: "Manage your workspace preferences.",
    icon: Settings,
  },
  "/help": {
    title: "Help & Support",
    description: "Guides and practical help for using MoleculeLab.",
    icon: CircleHelp,
  },
  "/profile": {
    title: "Researcher Profile",
    description: "Personalise your local researcher workspace.",
    icon: UserRound,
  },
};

type ResearcherProfile = {
  name: string;
  field: string;
  institution: string;
};

const DEFAULT_PROFILE: ResearcherProfile = {
  name: "Researcher",
  field: "Molecular research",
  institution: "",
};

function readResearcherProfile(): ResearcherProfile {
  try {
    const saved = localStorage.getItem("moleculelab-researcher-profile");
    return saved ? { ...DEFAULT_PROFILE, ...JSON.parse(saved) } : DEFAULT_PROFILE;
  } catch {
    return DEFAULT_PROFILE;
  }
}

function initials(name: string) {
  return name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0].toUpperCase()).join("") || "R";
}

function Sidebar({ close, researcherName }: { close?: () => void; researcherName: string }) {
  const groups = ["WORKSPACE", "EXPLORE", "ANALYZE", "INTELLIGENCE"];

  return (
    <aside className="sidebar">
      <NavLink to="/" className="brand" onClick={close}>
        <span className="brand-symbol">
          <Atom size={25} />
        </span>

        <span className="brand-name">
          Molecule<span>Lab</span>
          <small>MOLECULAR INTELLIGENCE</small>
        </span>
      </NavLink>

      <div className="workspace-switch">
        <span className="workspace-avatar">
          <Atom size={17} />
        </span>

        <span>
          <b>My Laboratory</b>
          <small>Personal workspace</small>
        </span>

        <ChevronDown size={15} />
      </div>

      <nav className="side-navigation">
        {groups.map((group) => (
          <div className="nav-group" key={group}>
            <div className="nav-label">{group}</div>

            {modules
              .filter((item) => item.group === group)
              .map((item) => {
                const Icon = item.icon;

                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.path === "/"}
                    onClick={close}
                    className={({ isActive }) =>
                      `nav-link ${isActive ? "active" : ""}`
                    }
                  >
                    <Icon size={17} strokeWidth={1.8} />
                    <span>{item.name}</span>

                    {item.name === "AI Intelligence" && (
                      <span className="nav-new">AI</span>
                    )}
                  </NavLink>
                );
              })}
          </div>
        ))}
      </nav>

      <div className="sidebar-bottom">
        <div className="usage-card">
          <div className="usage-heading">
            <Sparkles size={15} /> LAB STATUS
          </div>

          <div className="usage-copy">
            Your molecular universe is taking shape.
          </div>

          <div className="usage-line">
            <span />
          </div>

          <small>Cosmic foundation Ãƒâ€šÃ‚Â· v1.0</small>
        </div>

        <NavLink
          to="/settings"
          onClick={close}
          className={({ isActive }) =>
            `nav-link ${isActive ? "active" : ""}`
          }
        >
          <Settings size={17} />
          Settings
        </NavLink>

        <NavLink to="/profile" onClick={close} className="profile profile-link" aria-label="Open researcher profile">
          <div className="profile-avatar">{initials(researcherName)}</div>
          <div>
            <b>{researcherName}</b>
            <small>Researcher profile</small>
          </div>
          <ChevronDown size={15} />
        </NavLink>
      </div>
    </aside>
  );
}

function Header({ onMenu, researcherName }: { onMenu: () => void; researcherName: string }) {
  const location = useLocation();
  const current = modules.find((m) => m.path === location.pathname);
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  function handleSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (query.trim()) {
      navigate(`/discovery?q=${encodeURIComponent(query.trim())}`);
    }
  }

  return (
    <header className="topbar">
      <button
        className="mobile-menu icon-button"
        onClick={onMenu}
        aria-label="Open navigation"
      >
        <Menu size={20} />
      </button>

      <div className="breadcrumb">
        MOLECULELAB <span>/</span>{" "}
        <b>
          {current?.name ??
            pageInfo[location.pathname]?.title ??
            "Overview"}
        </b>
      </div>

      <div className="header-actions">
        <form className="global-search" onSubmit={handleSearch}>
          <Search size={16} />

          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search molecules or elements..."
            aria-label="Search molecules or elements"
          />

          <kbd>
            <Command size={11} /> K
          </kbd>
        </form>

        <NavLink to="/profile" className="header-avatar" aria-label="Open researcher profile" title="Researcher profile">
          {initials(researcherName)}
        </NavLink>
      </div>
    </header>
  );
}

function StarField() {
  return (
    <div className="star-field" aria-hidden="true">
      {Array.from({ length: 48 }, (_, i) => (
        <span
          key={i}
          className={`star star-${i % 6}`}
          style={{
            left: `${(i * 37 + 11) % 100}%`,
            top: `${(i * 53 + 7) % 100}%`,
            animationDelay: `${(i % 9) * -0.7}s`,
          }}
        />
      ))}
    </div>
  );
}

function CosmicMolecule() {
  return (
    <div className="cosmic-molecule" aria-hidden="true">
      <div className="molecule-halo" />
      <div className="molecule-orbit orbit-a">
        <span />
      </div>
      <div className="molecule-orbit orbit-b">
        <span />
      </div>
      <div className="molecule-orbit orbit-c">
        <span />
      </div>
      <div className="molecule-center">
        <Atom size={72} strokeWidth={1} />
      </div>
      <span className="molecule-satellite satellite-a" />
      <span className="molecule-satellite satellite-b" />
      <span className="molecule-satellite satellite-c" />
      <span className="molecule-satellite satellite-d" />
      <div className="molecule-caption">MOLECULAR FIELD / 001</div>
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  note,
  accent,
}: {
  icon: typeof Atom;
  label: string;
  value: string;
  note: string;
  accent: string;
}) {
  return (
    <motion.div
      className={`metric-card ${accent}`}
      whileHover={{ y: -5, scale: 1.015 }}
      transition={{ duration: 0.2 }}
    >
      <div className="metric-top">
        <span>{label}</span>
        <Icon size={19} />
      </div>

      <div className="metric-value">{value}</div>
      <div className="metric-note">{note}</div>
      <div className="metric-glow" />
    </motion.div>
  );
}

function Overview() {
  const navigate = useNavigate();

  const shortcuts = [
    {
      title: "Discover molecules",
      desc: "Search chemical identities and structures",
      icon: Search,
      path: "/discovery",
      colour: "cyan",
    },
    {
      title: "Explore the elements",
      desc: "Navigate the periodic universe",
      icon: Table2,
      path: "/periodic-table",
      colour: "violet",
    },
    {
      title: "Enter the 3D lab",
      desc: "Inspect molecular geometry",
      icon: Orbit,
      path: "/visualizer",
      colour: "blue",
    },
    {
      title: "Analyse properties",
      desc: "Explore molecular descriptors",
      icon: ChartNoAxesCombined,
      path: "/analytics",
      colour: "pink",
    },
  ];

  return (
    <div className="page-content overview-page">
      <StarField />

      <section className="welcome-row">
        <div>
          <div className="eyebrow">
            <span className="live-dot" /> YOUR SCIENTIFIC UNIVERSE
          </div>

          <h1>
            Where molecules meet <span>possibility.</span>
          </h1>

          <p>
            A connected space to discover, visualise, investigate and
            understand the molecular world.
          </p>
        </div>

        <motion.button
          className="primary-button"
          whileHover={{ y: -3 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate("/discovery")}
        >
          <Plus size={17} /> Begin discovery <ArrowUpRight size={15} />
        </motion.button>
      </section>

      <section className="hero-panel">
        <div className="hero-nebula nebula-one" />
        <div className="hero-nebula nebula-two" />
        <div className="hero-grid" />

        <div className="hero-copy">
          <div className="hero-tag">
            <Sparkles size={14} /> MOLECULAR INTELLIGENCE STUDIO
          </div>

          <h2>
            Explore beyond
            <br />
            the <span>visible.</span>
          </h2>

          <p>
            From atomic structures to molecular intelligence, your
            scientific journey begins here.
          </p>

          <button
            className="hero-button"
            onClick={() => navigate("/discovery")}
          >
            Enter the universe <ArrowUpRight size={16} />
          </button>

          <div className="hero-footnote">
            <span className="live-dot" /> A NEW SPACE FOR SCIENTIFIC
            EXPLORATION
          </div>
        </div>

        <CosmicMolecule />

        <div className="hero-index">
          FIELD 001 <span>ÃƒÂ¢Ã…â€œÃ‚Â¦</span> MOLECULELAB
        </div>
      </section>

      <section className="section-heading">
        <div>
          <div className="eyebrow">THE LABORATORY</div>
          <h2>Your universe at a glance</h2>
        </div>

        <span className="subtle-label">
          CONNECTED SCIENTIFIC WORKSPACE
        </span>
      </section>

      <section className="metrics-grid">
        <MetricCard
          icon={Database}
          label="MOLECULAR ANALYSIS"
          value="RDKit powered"
          note="Calculate formula, molecular weight, LogP and more."
          accent="metric-cyan"
        />

        <MetricCard
          icon={Orbit}
          label="3D VISUALISATION"
          value="Explore structures"
          note="Open the visualiser to inspect molecular geometry."
          accent="metric-violet"
        />

        <MetricCard
          icon={Table2}
          label="PERIODIC UNIVERSE"
          value="118 elements"
          note="Explore the elements and their chemical information."
          accent="metric-blue"
        />

        <MetricCard
          icon={BrainCircuit}
          label="RESEARCH TOOLS"
          value="Connected workspace"
          note="Discover, compare, analyse and organise your work."
          accent="metric-pink"
        />
      </section>

      <section className="lower-grid">
        <div className="panel quick-panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">CHOOSE YOUR PATH</span>
              <h3>Explore the laboratory</h3>
            </div>

            <Sparkles size={19} />
          </div>

          <div className="quick-links">
            {shortcuts.map((item) => {
              const Icon = item.icon;

              return (
                <NavLink
                  to={item.path}
                  className="quick-link"
                  key={item.title}
                >
                  <span className={`quick-icon ${item.colour}`}>
                    <Icon size={19} />
                  </span>

                  <span>
                    <b>{item.title}</b>
                    <small>{item.desc}</small>
                  </span>

                  <ArrowUpRight size={16} className="quick-arrow" />
                </NavLink>
              );
            })}
          </div>
        </div>

        <div className="panel activity-panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">YOUR RESEARCH</span>
              <h3>Laboratory activity</h3>
            </div>

            <Clock3 size={18} />
          </div>

          <div className="activity-empty">
            <div className="empty-orbit">
              <Atom size={29} />
            </div>

            <b>Your next discovery awaits</b>

            <p>
              Start with a molecule and build your own connected
              research workspace.
            </p>

            <button onClick={() => navigate("/discovery")}>
              Start exploring <ArrowUpRight size={14} />
            </button>
          </div>
        </div>
      </section>

      <footer className="app-footer">
        <span>MOLECULELAB Ãƒâ€šÃ‚Â© 2026</span>
        <span>
          Designed for discovery <Atom size={13} />
        </span>
      </footer>
    </div>
  );
}

function ModulePage({
  title,
  description,
  icon: Icon,
}: {
  title: string;
  description: string;
  icon: typeof Atom;
}) {
  return (
    <div className="page-content module-page">
      <StarField />

      <div className="eyebrow">
        <span className="live-dot" /> MOLECULELAB / LABORATORY
      </div>

      <div className="module-heading">
        <span className="module-icon">
          <Icon size={28} />
        </span>

        <div>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
      </div>

      <div className="module-placeholder panel">
        <div className="empty-orbit">
          <Icon size={30} />
        </div>

        <h2>A new scientific space is taking shape.</h2>

        <p>
          This module is part of the MoleculeLab roadmap. Its
          scientific tools and data connections will be implemented
          in upcoming development stages.
        </p>

        <span className="development-label">
          <span className="live-dot" /> INTERFACE FOUNDATION Ãƒâ€šÃ‚Â·
          SCIENTIFIC FEATURES IN DEVELOPMENT
        </span>
      </div>
    </div>
  );
}

function HelpPage() {
  const navigate = useNavigate();
  const guides = [
    { title: "Discover a molecule", detail: "Open Discovery to search for a molecule by its name or chemical identity.", path: "/discovery", action: "Open Discovery", icon: Search },
    { title: "Analyse molecular properties", detail: "Use Molecular Analytics to inspect calculated descriptors such as molecular weight, formula and LogP.", path: "/analytics", action: "Open Analytics", icon: ChartNoAxesCombined },
    { title: "Visualise a structure", detail: "Open the 3D Visualizer to explore molecular geometry and structure.", path: "/visualizer", action: "Open Visualizer", icon: Orbit },
    { title: "Explore the elements", detail: "Use Periodic Universe to browse the chemical elements.", path: "/periodic-table", action: "Open Periodic Universe", icon: Table2 },
    { title: "Organise research", detail: "Use Research Workspace to keep your research work organised.", path: "/research", action: "Open Workspace", icon: FolderKanban },
  ];

  return (
    <div className="page-content module-page support-page">
      <StarField />
      <div className="eyebrow"><span className="live-dot" /> MOLECULELAB / SUPPORT</div>
      <div className="module-heading">
        <span className="module-icon"><CircleHelp size={28} /></span>
        <div><h1>Help & Support</h1><p>Quick guides to help you get more from your molecular workspace.</p></div>
      </div>
      <section className="support-intro panel">
        <div className="support-intro-icon"><BookOpen size={23} /></div>
        <div><span className="eyebrow">GETTING STARTED</span><h2>Welcome to your laboratory.</h2><p>Choose a guide below to jump directly to the relevant MoleculeLab tool. Some scientific capabilities depend on the connected chemistry engine and the data available in your workspace.</p></div>
      </section>
      <div className="support-guides">
        {guides.map((guide) => {
          const Icon = guide.icon;
          return <article className="support-guide panel" key={guide.title}>
            <span className="support-guide-icon"><Icon size={19} /></span>
            <div className="support-guide-copy"><h3>{guide.title}</h3><p>{guide.detail}</p></div>
            <button className="support-guide-action" onClick={() => navigate(guide.path)}>{guide.action}<ArrowUpRight size={14} /></button>
          </article>;
        })}
      </div>
    </div>
  );
}

function ProfilePage({ researcherName, onSave }: { researcherName: string; onSave: (profile: ResearcherProfile) => void }) {
  const [profile, setProfile] = useState<ResearcherProfile>(() => readResearcherProfile());
  const [saved, setSaved] = useState(false);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanProfile = { ...profile, name: profile.name.trim() || "Researcher", field: profile.field.trim(), institution: profile.institution.trim() };
    onSave(cleanProfile);
    setProfile(cleanProfile);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2200);
  }

  return (
    <div className="page-content module-page profile-page">
      <StarField />
      <div className="eyebrow"><span className="live-dot" /> MOLECULELAB / PERSONAL WORKSPACE</div>
      <div className="module-heading">
        <span className="module-icon"><UserRound size={28} /></span>
        <div><h1>Researcher Profile</h1><p>Personalise the details shown in your local workspace.</p></div>
      </div>
      <div className="profile-layout">
        <section className="profile-summary panel">
          <div className="profile-large-avatar">{initials(researcherName)}</div>
          <h2>{researcherName}</h2>
          <p>Personal researcher workspace</p>
          <span className="profile-local-note">Saved on this device only</span>
        </section>
        <form className="profile-editor panel" onSubmit={handleSubmit}>
          <div className="panel-heading"><div><span className="eyebrow">YOUR DETAILS</span><h3>Edit profile</h3></div><UserRound size={19} /></div>
          <label className="profile-field">Display name<input value={profile.name} maxLength={48} onChange={(event) => setProfile({ ...profile, name: event.target.value })} placeholder="Enter your display name" /></label>
          <label className="profile-field">Research interest<input value={profile.field} maxLength={80} onChange={(event) => setProfile({ ...profile, field: event.target.value })} placeholder="e.g. Computational chemistry" /></label>
          <label className="profile-field">Institution (optional)<input value={profile.institution} maxLength={100} onChange={(event) => setProfile({ ...profile, institution: event.target.value })} placeholder="Your institution or organisation" /></label>
          <div className="profile-editor-footer"><span>{saved ? "Profile saved on this device." : "No login or online account is required."}</span><button className="primary-button" type="submit"><Save size={15} /> Save profile</button></div>
        </form>
      </div>
    </div>
  );
}

function AppLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [researcherName, setResearcherName] = useState(() => readResearcherProfile().name);
  const location = useLocation();

  function saveResearcherProfile(profile: ResearcherProfile) {
    localStorage.setItem("moleculelab-researcher-profile", JSON.stringify(profile));
    setResearcherName(profile.name);
  }

  return (
    <div className="app-shell">
      <CosmicUniverse />

      <div className="ambient ambient-left" />
      <div className="ambient ambient-right" />

      <Sidebar researcherName={researcherName} />

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            className="mobile-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMenuOpen(false)}
          >
            <motion.div
              className="mobile-sidebar"
              initial={{ x: -290 }}
              animate={{ x: 0 }}
              exit={{ x: -290 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="icon-button close-menu"
                onClick={() => setMenuOpen(false)}
              >
                <X size={20} />
              </button>

              <Sidebar close={() => setMenuOpen(false)} researcherName={researcherName} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="main-area">
        <Header onMenu={() => setMenuOpen(true)} researcherName={researcherName} />

        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25 }}
          >
            <Routes>
              <Route
                path="/structure-studio"
                element={<StructureStudio />}
              />

              <Route
                path="/research"
                element={<ResearchWorkspace />}
              />

              <Route path="/suite" element={<ScienceSuite />} />

              <Route path="/" element={<Overview />} />
              <Route path="/help" element={<HelpPage />} />
              <Route path="/profile" element={<ProfilePage researcherName={researcherName} onSave={saveResearcherProfile} />} />

              <Route path="/discovery" element={<Discovery />} />

              <Route
                path="/intelligence"
                element={<Intelligence />}
              />

              <Route path="/visualizer" element={<Visualizer />} />

              <Route
                path="/periodic-table"
                element={<PeriodicTable />}
              />

              <Route path="/analytics" element={<Analytics />} />

              <Route
                path="/settings"
                element={<SettingsPage />}
              />

              {/* COMPUTATIONAL CHEMISTRY LAB */}
              <Route
                path="/computational-lab"
                element={<ComputationalLab />}
              />

              {Object.entries(pageInfo)
                .filter(
                  ([path]) =>
                    ![
                      "/discovery",
                      "/visualizer",
                      "/periodic-table",
                      "/analytics",
                      "/structure-studio",
                      "/intelligence",
                      "/research",
                      "/settings",
                      "/help",
                      "/profile",
                      "/computational-lab",
                    ].includes(path)
                )
                .map(([path, info]) => (
                  <Route
                    key={path}
                    path={path}
                    element={<ModulePage {...info} />}
                  />
                ))}

              <Route path="*" element={<Overview />} />
            </Routes>
          </motion.div>
        </AnimatePresence>

        <NavLink to="/help" className="help-float" title="Help and support" aria-label="Open Help and Support">
          <CircleHelp size={18} />
        </NavLink>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  );
}