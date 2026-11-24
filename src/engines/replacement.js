export function parseReference(value) { return String(value).split(/[\s,]+/).filter(Boolean).map(Number).filter(n => Number.isInteger(n) && n >= 0); }
export function runReplacement(reference, frameCount, algorithm = 'FIFO') {
  if (!Number.isInteger(frameCount) || frameCount < 1) throw new Error('Frame count must be at least 1.');
  const frames = Array(frameCount).fill(null), steps = []; let faults = 0, hits = 0, fifo = 0; const used = new Map();
  reference.forEach((page, index) => { let frame = frames.indexOf(page), victim = null, fault = frame === -1;
    if (fault) { faults++; frame = frames.indexOf(null); if (frame === -1) { if (algorithm === 'FIFO') frame = fifo; else if (algorithm === 'LRU') frame = frames.reduce((best, p, i) => used.get(p) < used.get(frames[best]) ? i : best, 0); else { frame = frames.reduce((best, p, i) => { const a = reference.slice(index + 1).indexOf(p), b = reference.slice(index + 1).indexOf(frames[best]); return (a === -1 ? Infinity : a) > (b === -1 ? Infinity : b) ? i : best; }, 0); } victim = frames[frame]; } frames[frame] = page; if (algorithm === 'FIFO') fifo = (frame + 1) % frameCount; } else hits++; used.set(page, index); steps.push({ index, page, frames: [...frames], fault, victim }); });
  return { algorithm, faults, hits, steps };
}
