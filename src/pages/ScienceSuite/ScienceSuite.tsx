import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Atom, Search, FlaskConical, BrainCircuit, Bookmark, Table2, ChartNoAxesCombined, Dna, Sparkles, X } from 'lucide-react';
import './ScienceSuite.css';

type ElementRecord = { n:number; s:string; name:string; mass:string; group:string; period:number; col:number };
const raw = `1|H|Hydrogen|1.008|Nonmetal|1|1
2|He|Helium|4.003|Noble gas|1|18
3|Li|Lithium|6.94|Alkali metal|2|1
4|Be|Beryllium|9.012|Alkaline earth|2|2
5|B|Boron|10.81|Metalloid|2|13
6|C|Carbon|12.011|Nonmetal|2|14
7|N|Nitrogen|14.007|Nonmetal|2|15
8|O|Oxygen|15.999|Nonmetal|2|16
9|F|Fluorine|18.998|Halogen|2|17
10|Ne|Neon|20.180|Noble gas|2|18
11|Na|Sodium|22.990|Alkali metal|3|1
12|Mg|Magnesium|24.305|Alkaline earth|3|2
13|Al|Aluminium|26.982|Post-transition metal|3|13
14|Si|Silicon|28.085|Metalloid|3|14
15|P|Phosphorus|30.974|Nonmetal|3|15
16|S|Sulfur|32.06|Nonmetal|3|16
17|Cl|Chlorine|35.45|Halogen|3|17
18|Ar|Argon|39.948|Noble gas|3|18
19|K|Potassium|39.098|Alkali metal|4|1
20|Ca|Calcium|40.078|Alkaline earth|4|2
21|Sc|Scandium|44.956|Transition metal|4|3
22|Ti|Titanium|47.867|Transition metal|4|4
23|V|Vanadium|50.942|Transition metal|4|5
24|Cr|Chromium|51.996|Transition metal|4|6
25|Mn|Manganese|54.938|Transition metal|4|7
26|Fe|Iron|55.845|Transition metal|4|8
27|Co|Cobalt|58.933|Transition metal|4|9
28|Ni|Nickel|58.693|Transition metal|4|10
29|Cu|Copper|63.546|Transition metal|4|11
30|Zn|Zinc|65.38|Transition metal|4|12
31|Ga|Gallium|69.723|Post-transition metal|4|13
32|Ge|Germanium|72.630|Metalloid|4|14
33|As|Arsenic|74.922|Metalloid|4|15
34|Se|Selenium|78.971|Nonmetal|4|16
35|Br|Bromine|79.904|Halogen|4|17
36|Kr|Krypton|83.798|Noble gas|4|18
37|Rb|Rubidium|85.468|Alkali metal|5|1
38|Sr|Strontium|87.62|Alkaline earth|5|2
39|Y|Yttrium|88.906|Transition metal|5|3
40|Zr|Zirconium|91.224|Transition metal|5|4
41|Nb|Niobium|92.906|Transition metal|5|5
42|Mo|Molybdenum|95.95|Transition metal|5|6
43|Tc|Technetium|98|Transition metal|5|7
44|Ru|Ruthenium|101.07|Transition metal|5|8
45|Rh|Rhodium|102.906|Transition metal|5|9
46|Pd|Palladium|106.42|Transition metal|5|10
47|Ag|Silver|107.868|Transition metal|5|11
48|Cd|Cadmium|112.414|Transition metal|5|12
49|In|Indium|114.818|Post-transition metal|5|13
50|Sn|Tin|118.710|Post-transition metal|5|14
51|Sb|Antimony|121.760|Metalloid|5|15
52|Te|Tellurium|127.60|Metalloid|5|16
53|I|Iodine|126.904|Halogen|5|17
54|Xe|Xenon|131.293|Noble gas|5|18
55|Cs|Caesium|132.905|Alkali metal|6|1
56|Ba|Barium|137.327|Alkaline earth|6|2
57|La|Lanthanum|138.905|Lanthanide|8|3
58|Ce|Cerium|140.116|Lanthanide|8|4
59|Pr|Praseodymium|140.908|Lanthanide|8|5
60|Nd|Neodymium|144.242|Lanthanide|8|6
61|Pm|Promethium|145|Lanthanide|8|7
62|Sm|Samarium|150.36|Lanthanide|8|8
63|Eu|Europium|151.964|Lanthanide|8|9
64|Gd|Gadolinium|157.25|Lanthanide|8|10
65|Tb|Terbium|158.925|Lanthanide|8|11
66|Dy|Dysprosium|162.500|Lanthanide|8|12
67|Ho|Holmium|164.930|Lanthanide|8|13
68|Er|Erbium|167.259|Lanthanide|8|14
69|Tm|Thulium|168.934|Lanthanide|8|15
70|Yb|Ytterbium|173.045|Lanthanide|8|16
71|Lu|Lutetium|174.967|Lanthanide|8|17
72|Hf|Hafnium|178.49|Transition metal|6|4
73|Ta|Tantalum|180.948|Transition metal|6|5
74|W|Tungsten|183.84|Transition metal|6|6
75|Re|Rhenium|186.207|Transition metal|6|7
76|Os|Osmium|190.23|Transition metal|6|8
77|Ir|Iridium|192.217|Transition metal|6|9
78|Pt|Platinum|195.084|Transition metal|6|10
79|Au|Gold|196.967|Transition metal|6|11
80|Hg|Mercury|200.592|Transition metal|6|12
81|Tl|Thallium|204.38|Post-transition metal|6|13
82|Pb|Lead|207.2|Post-transition metal|6|14
83|Bi|Bismuth|208.980|Post-transition metal|6|15
84|Po|Polonium|209|Post-transition metal|6|16
85|At|Astatine|210|Halogen|6|17
86|Rn|Radon|222|Noble gas|6|18
87|Fr|Francium|223|Alkali metal|7|1
88|Ra|Radium|226|Alkaline earth|7|2
89|Ac|Actinium|227|Actinide|9|3
90|Th|Thorium|232.038|Actinide|9|4
91|Pa|Protactinium|231.036|Actinide|9|5
92|U|Uranium|238.029|Actinide|9|6
93|Np|Neptunium|237|Actinide|9|7
94|Pu|Plutonium|244|Actinide|9|8
95|Am|Americium|243|Actinide|9|9
96|Cm|Curium|247|Actinide|9|10
97|Bk|Berkelium|247|Actinide|9|11
98|Cf|Californium|251|Actinide|9|12
99|Es|Einsteinium|252|Actinide|9|13
100|Fm|Fermium|257|Actinide|9|14
101|Md|Mendelevium|258|Actinide|9|15
102|No|Nobelium|259|Actinide|9|16
103|Lr|Lawrencium|266|Actinide|9|17
104|Rf|Rutherfordium|267|Transition metal|7|4
105|Db|Dubnium|268|Transition metal|7|5
106|Sg|Seaborgium|269|Transition metal|7|6
107|Bh|Bohrium|270|Transition metal|7|7
108|Hs|Hassium|277|Transition metal|7|8
109|Mt|Meitnerium|278|Transition metal|7|9
110|Ds|Darmstadtium|281|Transition metal|7|10
111|Rg|Roentgenium|282|Transition metal|7|11
112|Cn|Copernicium|285|Transition metal|7|12
113|Nh|Nihonium|286|Post-transition metal|7|13
114|Fl|Flerovium|289|Post-transition metal|7|14
115|Mc|Moscovium|290|Post-transition metal|7|15
116|Lv|Livermorium|293|Post-transition metal|7|16
117|Ts|Tennessine|294|Halogen|7|17
118|Og|Oganesson|294|Noble gas|7|18`;
const elements:ElementRecord[]=raw.split('\n').map(line=>{const [n,s,name,mass,group,period,col]=line.split('|');return {n:+n,s,name,mass,group,period:+period,col:+col};});
const modules=[['periodic','Periodic Table','118 elements, searchable explorer'],['analytics','Molecular Analytics','Inspect reported molecular properties'],['studio','Structure Studio','Submit a SMILES or molecule name'],['intelligence','Molecular Intelligence','Similarity workflow foundation'],['workspace','Research Workspace','Your saved molecule collection']];
const api='https://pubchem.ncbi.nlm.nih.gov/rest/pug';
async function lookup(name:string){const r=await fetch(`${api}/compound/name/${encodeURIComponent(name)}/property/MolecularFormula,MolecularWeight,CanonicalSMILES,InChIKey,XLogP,TPSA/JSON`);if(!r.ok)throw new Error('PubChem could not find this molecule or return the requested properties. Try a common name or CID.');const j=await r.json();return j.PropertyTable.Properties[0];}
export default function ScienceSuite(){
 const [tab,setTab]=useState('periodic');const [filter,setFilter]=useState('');const [selected,setSelected]=useState<ElementRecord|null>(elements[5]);const [query,setQuery]=useState('caffeine');const [molecule,setMolecule]=useState<any>(null);const [busy,setBusy]=useState(false);const [error,setError]=useState('');const [saved,setSaved]=useState<any[]>(()=>{try{return JSON.parse(localStorage.getItem('mlab_saved')||'[]')}catch{return []}});
 const matches=useMemo(()=>elements.filter(e=>`${e.n} ${e.s} ${e.name} ${e.group}`.toLowerCase().includes(filter.toLowerCase())),[filter]);
 async function search(){setBusy(true);setError('');try{const p=await lookup(query.trim());setMolecule(p)}catch(e:any){setError(e.message||'Search failed.');setMolecule(null)}finally{setBusy(false)}}
 function save(){if(!molecule)return;const next=[molecule,...saved.filter(x=>x.CID!==molecule.CID)];setSaved(next);localStorage.setItem('mlab_saved',JSON.stringify(next))}
 return <main className="ml-suite"><div className="ml-nebula"/><div className="ml-suite-head"><div><div className="ml-eyebrow"><Sparkles size={14}/> MOLECULAR INTELLIGENCE PLATFORM</div><h1>Science <span>Suite</span></h1><p>Explore elements, inspect molecular records and organise your research.</p></div><div className="ml-orbit"><Atom size={42}/><i/><b/></div></div>
 <nav className="ml-tabs">{modules.map(([id,label])=><button key={id} className={tab===id?'active':''} onClick={()=>setTab(id)}>{id==='periodic'?<Table2/>:id==='analytics'?<ChartNoAxesCombined/>:id==='studio'?<FlaskConical/>:id==='intelligence'?<BrainCircuit/>:<Bookmark/>}<span>{label}</span></button>)}</nav>
 <AnimatePresence mode="wait"><motion.section key={tab} className="ml-panel" initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}} transition={{duration:.2}}>
 {tab==='periodic'&&<><div className="ml-section-title"><div><h2>Periodic Table Explorer</h2><p>Search and select an element to inspect its basic identity.</p></div><label className="ml-search"><Search/><input value={filter} onChange={e=>setFilter(e.target.value)} placeholder="Find element, symbol or atomic number"/></label></div><div className="ml-periodic-layout"><div className="ml-periodic-grid">{matches.map(e=><button key={e.n} className={`ml-element ${selected?.n===e.n?'chosen':''} ${e.group.toLowerCase().replaceAll(' ','-')}`} style={{gridColumn:e.col,gridRow:e.period}} onClick={()=>setSelected(e)} title={e.name}><small>{e.n}</small><strong>{e.s}</strong><span>{e.name}</span></button>)}</div><aside className="ml-element-detail">{selected?<><div className="ml-big-symbol">{selected.s}</div><div className="ml-eyebrow">ELEMENT PROFILE Â· #{selected.n}</div><h2>{selected.name}</h2><p>{selected.group}</p><dl><div><dt>Atomic number</dt><dd>{selected.n}</dd></div><div><dt>Standard atomic weight</dt><dd>{selected.mass}</dd></div><div><dt>Period</dt><dd>{selected.period>7?'f-block':selected.period}</dd></div><div><dt>Classification</dt><dd>{selected.group}</dd></div></dl><small className="ml-note">Basic reference fields. Detailed isotope, electron configuration and physical-property records are part of the verified data expansion.</small></>:<p>Select an element.</p>}</aside></div></>}
 {['analytics','studio','intelligence'].includes(tab)&&<><div className="ml-section-title"><div><h2>{modules.find(x=>x[0]===tab)?.[1]}</h2><p>{tab==='analytics'?'Retrieve PubChem molecular properties. Values are database records, not model predictions.':tab==='studio'?'Enter a molecule name, PubChem CID or supported identifier to retrieve its chemical record.':'A transparent starting point for molecular similarity and ML workflows.'}</p></div><div className="ml-icon-tile">{tab==='analytics'?<ChartNoAxesCombined/>:tab==='studio'?<FlaskConical/>:<BrainCircuit/>}</div></div><div className="ml-lookup"><Search/><input value={query} onChange={e=>setQuery(e.target.value)} onKeyDown={e=>e.key==='Enter'&&search()} placeholder="e.g. caffeine, aspirin, glucose"/><button onClick={search} disabled={busy}>{busy?'Searchingâ€¦':'Retrieve molecule'}</button></div>{error&&<div className="ml-error">{error}</div>}{molecule&&<div className="ml-molecule-card"><div className="ml-molecule-top"><div><span className="ml-eyebrow">PUBCHEM RECORD</span><h3>{molecule.MolecularFormula}</h3><p>Compound CID {molecule.CID}</p></div><button className="ml-save" onClick={save}><Bookmark size={16}/> Save</button></div><div className="ml-property-grid">{[['Molecular weight',molecule.MolecularWeight,'g/mol'],['XLogP',molecule.XLogP??'Not reported',''],['TPSA',molecule.TPSA??'Not reported','Ã…Â²'],['InChIKey',molecule.InChIKey??'Not returned','']].map(([a,b,c])=><div key={String(a)}><small>{a}</small><strong>{b} {c}</strong></div>)}</div><div className="ml-smiles"><small>Canonical SMILES</small><code>{molecule.CanonicalSMILES||'Not returned by source'}</code></div><p className="ml-note">Source: PubChem PUG REST. Some fields may be unavailable for a given compound. TPSA and other derived descriptors will be calculated through the RDKit backend in the next engineering phase.</p></div>}{!molecule&&!error&&<div className="ml-empty"><Atom size={34}/><strong>Ready for molecular exploration</strong><span>Search a molecule to load its available database record.</span></div>}{tab==='intelligence'&&<div className="ml-honesty"><Sparkles/><div><strong>Prediction engine is not connected yet</strong><p>This screen does not generate fabricated AI scores. The next backend phase will connect versioned models, training-domain checks and prediction provenance.</p></div></div>}</>}
 {tab==='workspace'&&<><div className="ml-section-title"><div><h2>Research Workspace</h2><p>Saved records are stored locally in this browser on this device.</p></div><div className="ml-icon-tile"><Bookmark/></div></div>{saved.length?<div className="ml-saved-list">{saved.map((m,i)=><article key={m.CID||i}><div><strong>{m.MolecularFormula}</strong><span>PubChem CID {m.CID} Â· {m.MolecularWeight} g/mol</span></div><button onClick={()=>{const next=saved.filter((_,idx)=>idx!==i);setSaved(next);localStorage.setItem('mlab_saved',JSON.stringify(next))}} aria-label="Remove saved molecule"><X/></button></article>)}</div>:<div className="ml-empty"><Bookmark size={34}/><strong>Your workspace is ready</strong><span>Look up a molecule in Analytics or Structure Studio, then choose Save.</span></div>}<div className="ml-honesty"><Dna/><div><strong>Local storage only</strong><p>These saved records are not synced across devices and are not uploaded to a research database. Cloud projects and collaboration require the upcoming account and database layer.</p></div></div></>}
 </motion.section></AnimatePresence><footer className="ml-suite-footer">MOLECULELAB Â· COSMIC SCIENCE INTERFACE <span>Research-grade computation is being connected in stages.</span></footer></main>
}
