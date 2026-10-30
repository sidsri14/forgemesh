import http from 'http';
import { ForgeMeshOrchestrator, OrchestrationRunResult } from './orchestrator.js';

const PORT = 3460;
let lastResult: OrchestrationRunResult | null = null;
const orchestrator = new ForgeMeshOrchestrator(35000);

// Pre-run default scenario on startup
(async () => {
  lastResult = await orchestrator.run(
    'goal-demo-init',
    'Synthesize resilient distributed rate-limiter with memory leak eviction and automated regression test suite.'
  );
})();

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://${req.headers.host}`);

  // API endpoint to trigger a new run
  if (req.method === 'POST' && url.pathname === '/api/run') {
    let body = '';
    req.on('data', chunk => (body += chunk));
    req.on('end', async () => {
      try {
        const parsed = JSON.parse(body || '{}');
        const goal = parsed.goal || 'Build a resilient multi-agent microservice with self-healing tests.';
        lastResult = await orchestrator.run(`goal-${Date.now()}`, goal);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(lastResult, (key, value) => {
          if (value instanceof Map) {
            return Object.fromEntries(value.entries());
          }
          return value;
        }));
      } catch (err: any) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // API endpoint to get current state
  if (req.method === 'GET' && url.pathname === '/api/state') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(lastResult, (key, value) => {
      if (value instanceof Map) {
        return Object.fromEntries(value.entries());
      }
      return value;
    }));
    return;
  }

  // HTML Web HUD
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>ForgeMesh — Multi-Agent DevOps Engine (WCC Forge 48)</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-950 text-slate-100 font-sans p-6 min-h-screen">
  <div class="max-w-6xl mx-auto space-y-6">
    <!-- Header -->
    <header class="border-b border-slate-800 pb-4 flex justify-between items-center">
      <div>
        <h1 class="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          <span class="w-3 h-3 bg-indigo-500 rounded-full animate-pulse"></span>
          ForgeMesh: Autonomous Multi-Agent DevOps
        </h1>
        <p class="text-sm text-slate-400">WCC Forge 48 Hackathon • Track: Agentic AI & Autonomous Systems • Builder: Siddharth Srivastava (@sidsri14)</p>
      </div>
      <div class="text-right">
        <span class="px-3 py-1 bg-indigo-950 border border-indigo-700 text-indigo-300 text-xs font-mono rounded-md">LIVE RUNTIME HUD</span>
      </div>
    </header>

    <!-- Telemetry Cards -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div class="bg-slate-900 border border-slate-800 p-4 rounded-lg">
        <div class="text-xs uppercase text-slate-400 font-mono">Security Score</div>
        <div id="stat-score" class="text-2xl font-bold text-emerald-400 mt-1">--</div>
        <div class="text-xs text-slate-500 mt-1">OWASP & Invariant Audit</div>
      </div>
      <div class="bg-slate-900 border border-slate-800 p-4 rounded-lg">
        <div class="text-xs uppercase text-slate-400 font-mono">Self-Healing Cycles</div>
        <div id="stat-interventions" class="text-2xl font-bold text-cyan-400 mt-1">--</div>
        <div class="text-xs text-slate-500 mt-1">Autonomous Bug Interventions</div>
      </div>
      <div class="bg-slate-900 border border-slate-800 p-4 rounded-lg">
        <div class="text-xs uppercase text-slate-400 font-mono">Frontier Capital Savings</div>
        <div id="stat-savings" class="text-2xl font-bold text-purple-400 mt-1">--</div>
        <div class="text-xs text-slate-500 mt-1">vs Commercial API Models</div>
      </div>
      <div class="bg-slate-900 border border-slate-800 p-4 rounded-lg">
        <div class="text-xs uppercase text-slate-400 font-mono">Execution Latency</div>
        <div id="stat-latency" class="text-2xl font-bold text-amber-400 mt-1">--</div>
        <div class="text-xs text-slate-500 mt-1">Total Pipeline Runtime</div>
      </div>
    </div>

    <!-- Interactive Execution Trigger -->
    <div class="bg-slate-900 border border-slate-800 p-4 rounded-lg space-y-3">
      <div class="text-sm font-semibold text-slate-300">Run Autonomous Agent Swarm</div>
      <div class="flex gap-3">
        <input id="input-goal" type="text" class="flex-1 bg-slate-950 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500" value="Implement a fault-tolerant rate-limiter with token-bucket leak eviction and regression tests." />
        <button id="btn-run" onclick="triggerRun()" class="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-md transition shadow">Trigger Run</button>
      </div>
    </div>

    <!-- Main Grid: DAG Pipeline & Logs -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <!-- DAG Pipeline Status -->
      <div class="bg-slate-900 border border-slate-800 p-4 rounded-lg space-y-4">
        <div class="text-sm font-semibold text-slate-300">Execution Graph (DAG Flow)</div>
        <div id="dag-container" class="space-y-2 font-mono text-xs">
          <!-- Populated by JS -->
        </div>
      </div>

      <!-- Execution Log Stream -->
      <div class="bg-slate-900 border border-slate-800 p-4 rounded-lg space-y-4">
        <div class="text-sm font-semibold text-slate-300">Swarm Telemetry & Audit Trail</div>
        <div id="log-container" class="h-80 overflow-y-auto bg-slate-950 border border-slate-800 rounded p-3 space-y-1 font-mono text-xs text-slate-400">
          <!-- Populated by JS -->
        </div>
      </div>
    </div>
  </div>

  <script>
    async function refreshState() {
      try {
        const res = await fetch('/api/state');
        const data = await res.json();
        if (!data) return;

        document.getElementById('stat-score').innerText = (data.securityReview?.score ?? 0) + '/100';
        document.getElementById('stat-interventions').innerText = data.telemetry?.interventionsHandled ?? 0;
        document.getElementById('stat-savings').innerText = (data.telemetry?.savingsVsCommercialFrontierPercent ?? 0) + '%';
        document.getElementById('stat-latency').innerText = (data.telemetry?.totalExecutionTimeMs ?? 0) + 'ms';

        // Render DAG
        const dagContainer = document.getElementById('dag-container');
        dagContainer.innerHTML = '';
        if (data.graph && data.graph.nodes) {
          for (const [id, node] of Object.entries(data.graph.nodes)) {
            const badgeColor = node.status === 'PASSED' ? 'bg-emerald-950 text-emerald-400 border-emerald-700' : 'bg-amber-950 text-amber-400 border-amber-700';
            dagContainer.innerHTML += \`
              <div class="p-2.5 bg-slate-950 border border-slate-800 rounded flex justify-between items-center">
                <div>
                  <div class="text-slate-200 font-semibold">\${node.title}</div>
                  <div class="text-slate-500 text-[11px]">\${node.description}</div>
                </div>
                <span class="px-2 py-0.5 border text-[10px] rounded \${badgeColor}">\${node.status}</span>
              </div>
            \`;
          }
        }

        // Render Logs
        const logContainer = document.getElementById('log-container');
        logContainer.innerHTML = '';
        if (data.executionLogs) {
          for (const log of data.executionLogs) {
            const color = log.includes('INTERVENTION') ? 'text-amber-400 font-bold' : log.includes('Verifier') ? 'text-cyan-400' : 'text-slate-400';
            logContainer.innerHTML += \`<div class="\${color}">\${log}</div>\`;
          }
          logContainer.scrollTop = logContainer.scrollHeight;
        }
      } catch (e) {
        console.error(e);
      }
    }

    async function triggerRun() {
      const btn = document.getElementById('btn-run');
      btn.innerText = 'Running Swarm...';
      btn.disabled = true;
      const goal = document.getElementById('input-goal').value;

      try {
        await fetch('/api/run', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ goal })
        });
        await refreshState();
      } finally {
        btn.innerText = 'Trigger Run';
        btn.disabled = false;
      }
    }

    refreshState();
    setInterval(refreshState, 3000);
  </script>
</body>
</html>`;
  res.end(html);
});

server.listen(PORT, () => {
  console.log(`ForgeMesh Web HUD visualizer live at: http://localhost:${PORT}`);
});
