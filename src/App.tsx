
import { useMemo, useState } from 'react'
import './App.css'

type ElementData = {
  number: number
  symbol: string
  name: string
  mass: string
  category: string
  group: string
  period: number
  configuration: string
}

const elements: ElementData[] = [
  { number: 1, symbol: 'H', name: 'Hydrogen', mass: '1.008', category: 'Nonmetal', group: 'Reactive nonmetal', period: 1, configuration: '1s¹' },
  { number: 2, symbol: 'He', name: 'Helium', mass: '4.0026', category: 'Noble gas', group: 'Noble gas', period: 1, configuration: '1s²' },
  { number: 3, symbol: 'Li', name: 'Lithium', mass: '6.94', category: 'Alkali metal', group: 'Alkali metal', period: 2, configuration: '[He] 2s¹' },
  { number: 4, symbol: 'Be', name: 'Beryllium', mass: '9.0122', category: 'Alkaline earth', group: 'Alkaline earth metal', period: 2, configuration: '[He] 2s²' },
  { number: 5, symbol: 'B', name: 'Boron', mass: '10.81', category: 'Metalloid', group: 'Metalloid', period: 2, configuration: '[He] 2s² 2p¹' },
  { number: 6, symbol: 'C', name: 'Carbon', mass: '12.011', category: 'Nonmetal', group: 'Reactive nonmetal', period: 2, configuration: '[He] 2s² 2p²' },
  { number: 7, symbol: 'N', name: 'Nitrogen', mass: '14.007', category: 'Nonmetal', group: 'Reactive nonmetal', period: 2, configuration: '[He] 2s² 2p³' },
  { number: 8, symbol: 'O', name: 'Oxygen', mass: '15.999', category: 'Nonmetal', group: 'Reactive nonmetal', period: 2, configuration: '[He] 2s² 2p⁴' },
  { number: 9, symbol: 'F', name: 'Fluorine', mass: '18.998', category: 'Halogen', group: 'Halogen', period: 2, configuration: '[He] 2s² 2p⁵' },
  { number: 10, symbol: 'Ne', name: 'Neon', mass: '20.180', category: 'Noble gas', group: 'Noble gas', period: 2, configuration: '[He] 2s² 2p⁶' },
  { number: 11, symbol: 'Na', name: 'Sodium', mass: '22.990', category: 'Alkali metal', group: 'Alkali metal', period: 3, configuration: '[Ne] 3s¹' },
  { number: 12, symbol: 'Mg', name: 'Magnesium', mass: '24.305', category: 'Alkaline earth', group: 'Alkaline earth metal', period: 3, configuration: '[Ne] 3s²' },
  { number: 13, symbol: 'Al', name: 'Aluminium', mass: '26.982', category: 'Post-transition metal', group: 'Post-transition metal', period: 3, configuration: '[Ne] 3s² 3p¹' },
  { number: 14, symbol: 'Si', name: 'Silicon', mass: '28.085', category: 'Metalloid', group: 'Metalloid', period: 3, configuration: '[Ne] 3s² 3p²' },
  { number: 15, symbol: 'P', name: 'Phosphorus', mass: '30.974', category: 'Nonmetal', group: 'Reactive nonmetal', period: 3, configuration: '[Ne] 3s² 3p³' },
  { number: 16, symbol: 'S', name: 'Sulfur', mass: '32.06', category: 'Nonmetal', group: 'Reactive nonmetal', period: 3, configuration: '[Ne] 3s² 3p⁴' },
  { number: 17, symbol: 'Cl', name: 'Chlorine', mass: '35.45', category: 'Halogen', group: 'Halogen', period: 3, configuration: '[Ne] 3s² 3p⁵' },
  { number: 18, symbol: 'Ar', name: 'Argon', mass: '39.948', category: 'Noble gas', group: 'Noble gas', period: 3, configuration: '[Ne] 3s² 3p⁶' },
  { number: 19, symbol: 'K', name: 'Potassium', mass: '39.098', category: 'Alkali metal', group: 'Alkali metal', period: 4, configuration: '[Ar] 4s¹' },
  { number: 20, symbol: 'Ca', name: 'Calcium', mass: '40.078', category: 'Alkaline earth', group: 'Alkaline earth metal', period: 4, configuration: '[Ar] 4s²' },
]

const tabs = ['Overview', 'Explore', 'Workspace', 'About']

function App() {
  const [activeTab, setActiveTab] = useState('Overview')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<ElementData>(elements[5])

  const filteredElements = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return elements
    return elements.filter((element) =>
      element.name.toLowerCase().includes(query) ||
      element.symbol.toLowerCase().includes(query) ||
      String(element.number) === query
    )
  }, [search])

  return (
    <main className="app-shell">
      <div className="cosmic-glow glow-one" />
      <div className="cosmic-glow glow-two" />
      <div className="star-field" />

      <header className="topbar">
        <button className="brand" onClick={() => setActiveTab('Overview')}>
          <span className="brand-mark">✦</span>
          <span>MOLECULE<span className="brand-highlight">LAB</span></span>
        </button>

        <nav className="main-nav">
          {tabs.map((tab) => (
            <button
              key={tab}
              className={activeTab === tab ? 'nav-item active' : 'nav-item'}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </nav>

        <div className="system-status">
          <span className="status-dot" />
          SCIENCE SYSTEM ONLINE
        </div>
      </header>

      <section className="intro-section">
        <div className="intro-copy">
          <div className="eyebrow">
            <span>✧</span> MOLECULAR INTELLIGENCE STUDIO
          </div>
          <h1>
            Explore the
            <span className="gradient-heading"> chemistry of everything.</span>
          </h1>
          <p>
            Enter a universe of elements, molecular structures and scientific
            discovery. Explore the building blocks of matter.
          </p>
        </div>

        <div className="intro-orbit" aria-label="Decorative atomic illustration">
          <div className="orbit-ring ring-a" />
          <div className="orbit-ring ring-b" />
          <div className="orbit-ring ring-c" />
          <div className="orbit-nucleus">✦</div>
          <span className="orbit-electron electron-a">e⁻</span>
          <span className="orbit-electron electron-b">e⁻</span>
          <span className="orbit-electron electron-c">e⁻</span>
        </div>
      </section>

      <section className="explorer-section">
        <div className="section-heading">
          <div>
            <span className="section-kicker">THE ELEMENTAL ARCHIVE</span>
            <h2>Periodic <span>Universe</span></h2>
            <p>Select an element to explore its atomic identity.</p>
          </div>

          <label className="element-search">
            <span>⌕</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search element, symbol or atomic number..."
            />
            <kbd>SEARCH</kbd>
          </label>
        </div>

        <div className="explorer-layout">
          <div className="periodic-panel">
            <div className="panel-topline">
              <span>ELEMENT DATABASE</span>
              <span>{filteredElements.length} ELEMENTS DISPLAYED</span>
            </div>

            <div className="element-grid">
              {filteredElements.map((element) => (
                <button
                  key={element.number}
                  className={`element-tile ${element.category.toLowerCase().replaceAll(' ', '-')} ${selected.number === element.number ? 'selected' : ''}`}
                  onClick={() => setSelected(element)}
                  title={`${element.name} — atomic number ${element.number}`}
                >
                  <span className="atomic-number">{element.number}</span>
                  <strong>{element.symbol}</strong>
                  <span className="element-name">{element.name}</span>
                </button>
              ))}
              {filteredElements.length === 0 && (
                <div className="empty-state">
                  No matching elements. Try another search.
                </div>
              )}
            </div>

            <div className="legend">
              <span><i className="legend-dot nonmetal-dot" /> Nonmetals</span>
              <span><i className="legend-dot metal-dot" /> Metals</span>
              <span><i className="legend-dot metalloid-dot" /> Metalloids</span>
              <span><i className="legend-dot noble-dot" /> Noble gases</span>
            </div>
          </div>

          <aside className="element-details">
            <div className="detail-topline">
              <span>ELEMENT PROFILE</span>
              <span className="live-tag"><i /> LIVE SELECTION</span>
            </div>

            <div className="detail-symbol">
              <span>{selected.number}</span>
              <strong>{selected.symbol}</strong>
              <small>{selected.name}</small>
            </div>

            <div className="detail-category">{selected.category}</div>

            <div className="property-list">
              <div><span>Atomic number</span><strong>{selected.number}</strong></div>
              <div><span>Atomic mass</span><strong>{selected.mass} u</strong></div>
              <div><span>Period</span><strong>{selected.period}</strong></div>
              <div><span>Classification</span><strong>{selected.group}</strong></div>
              <div><span>Electron configuration</span><strong>{selected.configuration}</strong></div>
            </div>

            <div className="detail-note">
              <span>✧</span>
              <p>Select another element to update this scientific profile.</p>
            </div>
          </aside>
        </div>
      </section>

      <section className="bottom-strip">
        <div><span>01</span><strong>DISCOVER ELEMENTS</strong></div>
        <div><span>02</span><strong>EXPLORE ATOMIC DATA</strong></div>
        <div><span>03</span><strong>INVESTIGATE MATTER</strong></div>
        <div><span>04</span><strong>UNLOCK MOLECULAR SCIENCE</strong></div>
      </section>

      <footer className="site-footer">
        <span>MOLECULELAB · MOLECULAR INTELLIGENCE STUDIO</span>
        <span>BUILT FOR SCIENTIFIC DISCOVERY ✦</span>
      </footer>
    </main>
  )
}

export default App
