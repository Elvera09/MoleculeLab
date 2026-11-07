
import { useMemo, useState } from "react";
import {
  Atom,
  Search,
  X,
  ChevronRight,
  FlaskConical,
  Layers3,
  Hash,
  Scale,
  Info,
  Save,
  CheckCircle2,
} from "lucide-react";
import {
  CATEGORY_LABELS,
  ELEMENTS,
  type ChemicalElement,
  type ElementCategory,
} from "../../data/elements";
import "./PeriodicTable.css";

const categories = Object.keys(CATEGORY_LABELS) as ElementCategory[];

const ELEMENT_STORAGE_KEY = "moleculelab.research.elements.v1";
const HISTORY_STORAGE_KEY = "moleculelab.research.history.v1";

function ElementTile({
  element,
  selected,
  onClick,
}: {
  element: ChemicalElement;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={`element-tile cat-${element.category.replaceAll(" ", "-")} ${selected ? "selected" : ""}`}
      onClick={onClick}
      title={`${element.name} · ${element.number}`}
    >
      <span className="element-number">{element.number}</span>
      <strong>{element.symbol}</strong>
      <span className="element-name">{element.name}</span>
    </button>
  );
}

export default function PeriodicTable() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<ElementCategory | "all">("all");
  const [selected, setSelected] = useState<ChemicalElement>(ELEMENTS[5]);
  const [showDetails, setShowDetails] = useState(true);
  const [savedNumbers, setSavedNumbers] = useState<number[]>(() => {
    try {
      const saved = JSON.parse(
        localStorage.getItem(ELEMENT_STORAGE_KEY) || "[]"
      );
      return Array.isArray(saved)
        ? saved.map((item: { number: number }) => item.number)
        : [];
    } catch {
      return [];
    }
  });
  const [saveMessage, setSaveMessage] = useState("");

  const filtered = useMemo(
    () =>
      ELEMENTS.filter((element) => {
        const q = query.trim().toLowerCase();

        const matchesQuery =
          !q ||
          element.name.toLowerCase().includes(q) ||
          element.symbol.toLowerCase().includes(q) ||
          String(element.number) === q;

        return (
          matchesQuery &&
          (category === "all" || element.category === category)
        );
      }),
    [query, category]
  );

  const filteredNumbers = new Set(
    filtered.map((element) => element.number)
  );

  const lanthanides = ELEMENTS.filter(
    (element) => element.category === "lanthanide"
  );

  const actinides = ELEMENTS.filter(
    (element) => element.category === "actinide"
  );

  const pick = (element: ChemicalElement) => {
    setSelected(element);
    setShowDetails(true);
    setSaveMessage("");
  };

  function saveSelectedElement() {
    try {
      const existing = JSON.parse(
        localStorage.getItem(ELEMENT_STORAGE_KEY) || "[]"
      );

      if (!Array.isArray(existing)) {
        throw new Error("Your saved element collection could not be read.");
      }

      const alreadySaved = existing.some(
        (item: { number?: number }) =>
          item.number === selected.number
      );

      if (alreadySaved) {
        setSaveMessage("This element is already in your collection.");
        return;
      }

      const record = {
        id: `${Date.now()}-${selected.number}`,
        number: selected.number,
        name: selected.name,
        symbol: selected.symbol,
        mass: selected.mass,
        category: selected.category,
        period: selected.period,
        group: selected.group ?? null,
        block: selected.block,
        createdAt: new Date().toISOString(),
        source: "MoleculeLab Periodic Table",
      };

      existing.unshift(record);

      localStorage.setItem(
        ELEMENT_STORAGE_KEY,
        JSON.stringify(existing)
      );

      // Add the save action to Research Workspace activity history.
      const history = JSON.parse(
        localStorage.getItem(HISTORY_STORAGE_KEY) || "[]"
      );

      if (Array.isArray(history)) {
        history.unshift({
          id: `${Date.now()}-element`,
          title: "Element saved",
          detail: `${selected.name} (${selected.symbol}) · Atomic number ${selected.number}`,
          createdAt: new Date().toISOString(),
        });

        localStorage.setItem(
          HISTORY_STORAGE_KEY,
          JSON.stringify(history)
        );
      }

      setSavedNumbers((current) => [
        ...current,
        selected.number,
      ]);

      setSaveMessage(
        `${selected.name} saved to Research Workspace!`
      );
    } catch (error) {
      setSaveMessage(
        error instanceof Error
          ? error.message
          : "Could not save this element."
      );
    }
  }

  const isSaved = savedNumbers.includes(selected.number);

  return (
    <div className="page-content periodic-page">
      <div className="periodic-ambient" aria-hidden="true" />

      <div className="periodic-eyebrow">
        <span className="periodic-live" />
        MOLECULELAB / ELEMENT EXPLORER
      </div>

      <div className="periodic-heading-row">
        <div>
          <h1>
            Periodic <span>Universe</span>
          </h1>
          <p>
            Explore the building blocks of matter — all 118 known elements.
          </p>
        </div>

        <div className="periodic-count">
          <Atom size={18} />
          <strong>118</strong>
          <span>ELEMENTS</span>
        </div>
      </div>

      <div className="periodic-toolbar">
        <label className="periodic-search">
          <Search size={17} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by element, symbol or atomic number…"
          />
          <kbd>⌕</kbd>
        </label>

        <select
          aria-label="Filter by element category"
          value={category}
          onChange={(event) =>
            setCategory(
              event.target.value as ElementCategory | "all"
            )
          }
        >
          <option value="all">All categories</option>
          {categories.map((item) => (
            <option key={item} value={item}>
              {CATEGORY_LABELS[item]}
            </option>
          ))}
        </select>

        <button
          className="periodic-reset"
          onClick={() => {
            setQuery("");
            setCategory("all");
          }}
        >
          Reset
        </button>
      </div>

      <div className="periodic-legend">
        {categories.map((item) => (
          <button
            key={item}
            className={`legend-item cat-${item.replaceAll(" ", "-")} ${category === item ? "active" : ""}`}
            onClick={() =>
              setCategory(category === item ? "all" : item)
            }
          >
            <i />
            {CATEGORY_LABELS[item]}
          </button>
        ))}
      </div>

      <section className="periodic-workspace">
        <div className="periodic-table-scroll">
          <div
            className="periodic-grid"
            role="group"
            aria-label="Periodic table of elements"
          >
            {Array.from({ length: 7 }, (_, row) =>
              Array.from({ length: 18 }, (_, col) => {
                const element = ELEMENTS.find(
                  (item) =>
                    item.group === col + 1 &&
                    item.period === row + 1 &&
                    item.block !== "f"
                );

                if (!element) {
                  return (
                    <div
                      className="periodic-empty"
                      key={`${row}-${col}`}
                    />
                  );
                }

                const visible = filteredNumbers.has(element.number);

                return (
                  <div
                    className={`periodic-cell ${visible ? "" : "filtered-out"}`}
                    key={element.number}
                  >
                    <ElementTile
                      element={element}
                      selected={selected.number === element.number}
                      onClick={() => pick(element)}
                    />
                  </div>
                );
              })
            )}
          </div>

          <div className="f-block-labels">
            <span>57–71 · LANTHANIDES</span>
            <span>89–103 · ACTINIDES</span>
          </div>

          <div className="f-block">
            {[lanthanides, actinides].map((row, index) => (
              <div className="f-row" key={index}>
                {row.map((element) => (
                  <div
                    className={`periodic-cell ${filteredNumbers.has(element.number) ? "" : "filtered-out"}`}
                    key={element.number}
                  >
                    <ElementTile
                      element={element}
                      selected={selected.number === element.number}
                      onClick={() => pick(element)}
                    />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        <aside
          className={`element-inspector ${showDetails ? "open" : ""}`}
        >
          <div className="inspector-top">
            <span>
              <i /> SELECTED ELEMENT
            </span>

            <button
              onClick={() => setShowDetails(false)}
              aria-label="Collapse element details"
            >
              <X size={16} />
            </button>
          </div>

          <div
            className={`inspector-symbol cat-${selected.category.replaceAll(" ", "-")}`}
          >
            <span>{selected.number}</span>
            <strong>{selected.symbol}</strong>
            <small>{selected.name}</small>
          </div>

          <h2>{selected.name}</h2>
          <p className="inspector-category">
            {CATEGORY_LABELS[selected.category]}
          </p>

          <div className="element-properties">
            <div>
              <span><Hash size={14} /> Atomic number</span>
              <strong>{selected.number}</strong>
            </div>

            <div>
              <span><Scale size={14} /> Standard atomic weight</span>
              <strong>{selected.mass}</strong>
            </div>

            <div>
              <span><Layers3 size={14} /> Period</span>
              <strong>{selected.period}</strong>
            </div>

            <div>
              <span><FlaskConical size={14} /> Group</span>
              <strong>
                {selected.group ??
                  (selected.category === "lanthanide"
                    ? "Lanthanide series"
                    : "Actinide series")}
              </strong>
            </div>

            <div>
              <span><Atom size={14} /> Block</span>
              <strong>{selected.block.toUpperCase()} block</strong>
            </div>
          </div>

          <div className="inspector-note">
            <Info size={15} />
            <span>
              Atomic weights for elements without stable isotopes are
              shown as representative mass numbers in parentheses.
            </span>
          </div>

          <button
            type="button"
            className="periodic-save-element"
            onClick={saveSelectedElement}
          >
            {isSaved ? (
              <CheckCircle2 size={16} />
            ) : (
              <Save size={16} />
            )}
            {isSaved ? "Saved to Research" : "Save element to Research"}
          </button>

          {saveMessage && (
            <p className="periodic-save-message">
              {saveMessage}
            </p>
          )}

          <div className="inspector-footer">
            ELEMENT {String(selected.number).padStart(3, "0")}
            <ChevronRight size={14} />
          </div>
        </aside>
      </section>

      <div className="periodic-footnote">
        Showing {filtered.length} of 118 elements · Select any element
        to inspect its profile.
      </div>
    </div>
  );
}
