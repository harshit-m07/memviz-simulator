import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { runReplacement, parseReference } from './engines/replacement.js';
import { createMemoryState, createProcess, accessPage, translateAddress } from './engines/osEngine.js';
import { hardwareAccess } from './engines/coaEngine.js';
import './styles.css';

const SAMPLE = '7,0,1,2,0,3,0,4,2,3,0,3,2';
const algorithms = ['FIFO', 'LRU', 'Optimal'];

function Card({ title, value, detail }) { return <section className="card metric"><span>{title}</span><strong>{value}</strong><small>{detail}</small></section>; }
function Frame({ frame, active }) { return <div className={`frame ${active ? 'active' : ''} ${frame ? 'used' : ''}`}><b>F{frame?.id ?? '—'}</b><span>{frame ? `${frame.processId} · P${frame.page}` : 'Empty'}</span></div>; }

function App() {
  const [referenceText, setReferenceText] = useState(SAMPLE);
  const [frameCount, setFrameCount] = useState(3);
  const [algorithm, setAlgorithm] = useState('FIFO');
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [processName, setProcessName] = useState('Editor');
  const [processPages, setProcessPages] = useState(4);
  const [memory, setMemory] = useState(() => createMemoryState(3));
  const [logicalAddress, setLogicalAddress] = useState('2050');
  const [translation, setTranslation] = useState(null);
  const [hardware, setHardware] = useState(null);
  const refs = useMemo(() => parseReference(referenceText), [referenceText]);
  const simulations = useMemo(() => Object.fromEntries(algorithms.map(a => [a, runReplacement(refs, Number(frameCount), a)])), [refs, frameCount]);
  const result = simulations[algorithm];
  const current = result.steps[Math.min(step, Math.max(0, result.steps.length - 1))];
  const activeStep = current?.index ?? -1;

  useEffect(() => { setStep(0); setPlaying(false); }, [referenceText, frameCount, algorithm]);
  useEffect(() => {
    if (!playing || step >= result.steps.length - 1) return undefined;
    const timer = setTimeout(() => setStep(s => s + 1), 650);
    return () => clearTimeout(timer);
  }, [playing, step, result.steps.length]);
  useEffect(() => { if (step >= result.steps.length - 1) setPlaying(false); }, [step, result.steps.length]);

  function resetMemory(frames = Number(frameCount)) { setMemory(createMemoryState(frames)); setTranslation(null); setHardware(null); }
  function addProcess() { setMemory(m => createProcess(m, processName.trim() || 'Process', Number(processPages))); }
  function demoAccess(page = 0) {
    let event;
    setMemory(m => { const next = accessPage(m, 'P1', page, algorithm, refs); event = next.lastEvent; return next; });
    setHardware(hardwareAccess({ logicalAddress: page * memory.pageSize, event }));
  }
  function translate() {
    const output = translateAddress(memory, 'P1', Number(logicalAddress), algorithm, refs);
    setMemory(output.state); setTranslation(output); setHardware(hardwareAccess({ logicalAddress: Number(logicalAddress), event: output.event, physicalAddress: output.physicalAddress }));
  }
  const stats = memory.stats;

  return <main>
    <header><div className="brand"><div className="brand-mark">M</div><div><p className="eyebrow">OS + COA EDUCATIONAL SIMULATOR</p><h1>Mem<span>Viz</span></h1></div></div><div className="header-actions"><div className="status"><i /> Live simulation state</div><button className="secondary demo-button" onClick={() => { setReferenceText(SAMPLE); setFrameCount(3); resetMemory(3); }}>↻ Load verified demo</button></div></header>
    <nav className="app-nav" aria-label="Simulator sections"><a href="#lab">Simulation lab</a><a href="#memory">Memory manager</a><a href="#hardware">Hardware flow</a><a href="#events">Event log</a><span>⌘ Interactive workspace</span></nav>
    <section className="intro"><div><div className="hero-label"><i /> READY FOR A MEMORY REQUEST</div><h2>Virtual memory,<br /><em>made visible.</em></h2><p>Trace every request from CPU through MMU/TLB and cache to RAM — including page faults, replacement decisions, and address translation.</p><div className="hero-pills"><span>Deterministic engines</span><span>Shared state</span><span>Step-by-step learning</span></div></div><div className="hero-visual"><div className="orb orb-one" /><div className="orb orb-two" /><div className="memory-chip"><span>PHYSICAL</span><b>RAM</b><small>{memory.frames.filter(Boolean).length} / {memory.frames.length} frames</small></div><div className="signal signal-a" /><div className="signal signal-b" /></div></section>
    <section className="metrics"><Card title="Active processes" value={memory.processes.length} detail="Managed by OS engine" /><Card title="RAM utilization" value={`${Math.round((memory.frames.filter(Boolean).length / memory.frames.length) * 100)}%`} detail={`${memory.frames.filter(Boolean).length}/${memory.frames.length} frames occupied`} /><Card title="Page faults" value={stats.faults} detail="Live memory session" /><Card title="TLB hit rate" value={stats.accesses ? `${Math.round(stats.tlbHits / stats.accesses * 100)}%` : '—'} detail={`${stats.tlbHits} hits / ${stats.accesses} accesses`} /></section>

    <section id="lab" className="grid primary-grid"><div className="panel lab-panel"><div className="panel-head"><div><p className="eyebrow">CORE ENGINE</p><h3>Page replacement lab</h3><p className="panel-subtitle">Run the reference stream one decision at a time.</p></div><label>Algorithm<select value={algorithm} onChange={e => setAlgorithm(e.target.value)}>{algorithms.map(a => <option key={a}>{a}</option>)}</select></label></div><div className="controls"><label>Reference string<input value={referenceText} onChange={e => setReferenceText(e.target.value)} /></label><label>Frames<input type="number" min="1" max="8" value={frameCount} onChange={e => setFrameCount(e.target.value)} /></label></div><div className="run-controls"><button onClick={() => setStep(s => Math.max(0, s - 1))}>← Previous</button><button className="accent play-button" onClick={() => setPlaying(p => !p)}>{playing ? 'Ⅱ Pause' : '▶ Play'}</button><button onClick={() => setStep(s => Math.min(result.steps.length - 1, s + 1))}>Next →</button><button onClick={() => setStep(0)}>↺ Reset</button></div><div className="timeline">{refs.map((page, i) => <button key={`${page}-${i}`} aria-label={`Go to request ${i + 1}, page ${page}`} className={i === activeStep ? 'selected' : i < activeStep ? 'done' : ''} onClick={() => setStep(i)}>{page}</button>)}</div>{current && <div className="step"><div className="step-top"><b>Step {current.index + 1}<small>of {result.steps.length}</small></b><span className={current.fault ? 'fault' : 'hit'}>{current.fault ? `PAGE FAULT${current.victim !== null ? ` · replaced ${current.victim}` : ''}` : 'PAGE HIT'}</span></div><div className="accessing">Requesting virtual page <strong>{current.page}</strong></div><div className="frame-row">{current.frames.map((p, i) => <div className={p === current.page ? 'algorithm-frame active' : 'algorithm-frame'} key={i}><span>FRAME {i}</span><em>{p ?? '—'}</em></div>)}</div></div>}</div>
    <div className="panel"><p className="eyebrow">VERIFIED COMPARISON</p><h3>Same reference, every policy</h3><div className="compare">{algorithms.map(a => { const r = simulations[a]; return <div className={a === algorithm ? 'comparison selected-comparison' : 'comparison'} key={a}><b>{a}</b><strong>{r.faults}</strong><span>faults · {r.hits} hits</span><button onClick={() => setAlgorithm(a)}>Inspect</button></div>; })}</div><p className="note">For the supplied sample with 3 frames: FIFO 10, LRU 9, Optimal 7.</p></div></section>

    <section className="grid"><div id="memory" className="panel"><div className="panel-head"><div><p className="eyebrow">OS ENGINE</p><h3>Process & physical RAM</h3><p className="panel-subtitle">Create workload, inspect mappings, trigger an access.</p></div><button onClick={() => resetMemory()}>⌫ Clear session</button></div><div className="controls"><label>Name<input value={processName} onChange={e => setProcessName(e.target.value)} /></label><label>Virtual pages<input type="number" min="1" max="16" value={processPages} onChange={e => setProcessPages(e.target.value)} /></label><button className="accent add" onClick={addProcess}>+ Create process</button></div><div className="processes">{memory.processes.map(p => <div key={p.id}><b>{p.id}</b> {p.name}<span>{p.pages} pages</span><button onClick={() => demoAccess(0)}>Access P0 →</button></div>)}{!memory.processes.length && <p className="muted">Create a process to begin a live paging session.</p>}</div><h4><span>01</span> Physical frames</h4><div className="ram">{memory.frames.map((f, i) => <Frame key={i} frame={f} active={memory.lastEvent?.frame === i} />)}</div><h4><span>02</span> Page table</h4><div className="table">{memory.pageTable.length ? memory.pageTable.map(e => <div key={`${e.processId}-${e.page}`}><span>{e.processId}</span><span>P{e.page}</span><span>{e.present ? `F${e.frame}` : 'Not present'}</span></div>) : <p className="muted">No page-table entries yet.</p>}</div></div>
    <div id="hardware" className="panel hardware-panel"><p className="eyebrow">MMU + COA ENGINE</p><h3>Address translation</h3><p className="panel-subtitle">See how the machine resolves an address.</p><div className="controls translate"><label>Logical address<input type="number" min="0" value={logicalAddress} onChange={e => setLogicalAddress(e.target.value)} /></label><button className="accent" onClick={translate} disabled={!memory.processes.length}>Translate P1 →</button></div>{translation ? <div className="translation"><b>Logical {translation.logicalAddress}</b><span>Page {translation.page} + offset {translation.offset}</span><span>{translation.event?.type === 'PAGE_FAULT' ? 'Page fault handled → ' : ''}Frame {translation.frame}</span><strong>Physical address {translation.physicalAddress}</strong></div> : <p className="muted">Create a process, then translate a logical address. Page size: {memory.pageSize} bytes.</p>}<div className="hardware">{['CPU request', 'MMU / TLB', 'Cache', 'MAR', 'RAM', 'MDR'].map((name, i) => <div className={hardware && i <= hardware.stage ? 'hardware-node lit' : 'hardware-node'} key={name}><b>{name}</b><span>{hardware?.labels?.[i] || (i === 1 ? 'page table' : 'waiting')}</span></div>)}</div>{hardware && <p className="flow-note">{hardware.message}</p>}</div></section>

    <section id="events" className="panel log"><div className="panel-head"><div><p className="eyebrow">SHARED EVENT LOG</p><h3>Simulation history</h3><p className="panel-subtitle">A chronological trace across the OS and COA engines.</p></div><span className="event-count">{memory.events.length} events</span></div>{memory.events.length ? memory.events.slice(0, 8).map(e => <div className="event" key={e.id}><b>{e.type.replace('_', ' ')}</b><span>{e.message}</span><time>{e.time}</time></div>) : <p className="muted">Actions from both engines appear here.</p>}</section>
    <footer>MemViz MVP · deterministic, client-side simulation · page size {memory.pageSize} B</footer>
  </main>;
}
createRoot(document.getElementById('root')).render(<App />);
