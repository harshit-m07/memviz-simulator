# MemViz

Interactive React/Vite prototype for visualizing virtual memory and the CPU-to-memory hardware path.

## Run

```powershell
npm install
npm run dev
```

Open the URL shown by Vite (normally `http://localhost:5173`).

## Verify

```powershell
npm test
npm run build
```

The built-in reference string is `7,0,1,2,0,3,0,4,2,3,0,3,2` with three frames. It produces FIFO 10, LRU 9 and Optimal 7 faults.

## Publish with GitHub Pages

The repository includes a Pages workflow at `.github/workflows/deploy-pages.yml`.

1. Push the project to a GitHub repository on its `main` branch.
2. In GitHub, open **Settings → Pages** and choose **GitHub Actions** as the source.
3. The workflow publishes the site after every push to `main`. GitHub will show the public URL in the workflow summary.

## Architecture

- `src/engines/replacement.js`: deterministic FIFO/LRU/Optimal step engine.
- `src/engines/osEngine.js`: shared processes, page tables, frames, page faults, TLB, event log, and MMU translation.
- `src/engines/coaEngine.js`: turns the shared memory-access event into CPU → MMU/TLB → cache → MAR → RAM → MDR flow data.
- `src/main.jsx`: unified application state and views.

This MVP deliberately has no backend: all state is deterministic, local, and immediately visible for a dependable demonstration.
