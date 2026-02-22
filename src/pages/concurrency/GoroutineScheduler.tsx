import { VisualizationLayout, type Step } from '../../components/VisualizationLayout';

// GMP Model: G = Goroutine, M = OS Thread, P = Logical Processor
interface Goroutine {
  id: number;
  label: string;
  status: 'runqueue' | 'running' | 'blocked' | 'done' | 'stealing';
  color: string;
  onP?: number; // which P it's running on
}

interface OsThread {
  id: number; // M id
  pId?: number; // which P is attached
  status: 'idle' | 'running' | 'syscall';
}

interface Processor {
  id: number; // P id
  mId?: number; // which M is attached
  runQueue: number[]; // goroutine IDs in local run queue
  runningG?: number; // currently running goroutine ID
  status: 'idle' | 'running' | 'stealing';
}

interface SchedulerState {
  gomaxprocs: number;
  goroutines: Goroutine[];
  threads: OsThread[];
  processors: Processor[];
  globalQueue: number[]; // goroutine IDs in global run queue
  event: string;
  note?: string;
}

const codeLines = [
  'package main',
  '',
  'import (',
  '    "fmt"',
  '    "runtime"',
  '    "sync"',
  ')',
  '',
  'func main() {',
  '    // GOMAXPROCS = number of logical processors',
  '    runtime.GOMAXPROCS(2)',
  '    fmt.Println("CPUs:", runtime.NumCPU())',
  '',
  '    var wg sync.WaitGroup',
  '',
  '    // Launch 5 goroutines',
  '    for i := 0; i < 5; i++ {',
  '        wg.Add(1)',
  '        go func(id int) {',
  '            defer wg.Done()',
  '            // Go scheduler decides which P/M runs this',
  '            fmt.Printf("G%d running\\n", id)',
  '        }(i)',
  '    }',
  '',
  '    wg.Wait()',
  '    fmt.Println("All goroutines done")',
  '}',
];

const COLORS = ['#00ACD7', '#3fb950', '#ffa657', '#d2a8ff', '#f85149', '#79c0ff'];

const steps: Step<SchedulerState>[] = [
  {
    description: 'The Go runtime starts. By default GOMAXPROCS = number of CPU cores. Here we set it to 2 explicitly. This creates 2 Logical Processors (P).',
    highlightLines: [11],
    state: {
      gomaxprocs: 2,
      goroutines: [
        { id: 0, label: 'main', status: 'running', color: '#d2a8ff', onP: 0 },
      ],
      threads: [
        { id: 0, pId: 0, status: 'running' },
        { id: 1, status: 'idle' },
      ],
      processors: [
        { id: 0, mId: 0, runQueue: [], runningG: 0, status: 'running' },
        { id: 1, runQueue: [], status: 'idle' },
      ],
      globalQueue: [],
      event: 'runtime.GOMAXPROCS(2) — 2 Ps created',
      note: 'GMP Model: G=Goroutine, M=OS Thread, P=Logical Processor',
    },
  },
  {
    description: 'The GMP model: Each M (OS thread) must hold a P to run Go code. P has a local run queue of goroutines. GOMAXPROCS limits concurrent Go execution.',
    highlightLines: [11, 12],
    state: {
      gomaxprocs: 2,
      goroutines: [
        { id: 0, label: 'main', status: 'running', color: '#d2a8ff', onP: 0 },
      ],
      threads: [
        { id: 0, pId: 0, status: 'running' },
        { id: 1, status: 'idle' },
      ],
      processors: [
        { id: 0, mId: 0, runQueue: [], runningG: 0, status: 'running' },
        { id: 1, runQueue: [], status: 'idle' },
      ],
      globalQueue: [],
      event: 'GMP architecture: M holds P, P holds G',
      note: 'P0 is attached to M0 and running G0 (main)',
    },
  },
  {
    description: '`go func(0)` — G1 is created and placed in P0\'s local run queue. The `go` keyword creates a goroutine and schedules it; it doesn\'t run immediately.',
    highlightLines: [17, 18, 19],
    state: {
      gomaxprocs: 2,
      goroutines: [
        { id: 0, label: 'main', status: 'running', color: '#d2a8ff', onP: 0 },
        { id: 1, label: 'G1', status: 'runqueue', color: COLORS[0] },
      ],
      threads: [
        { id: 0, pId: 0, status: 'running' },
        { id: 1, status: 'idle' },
      ],
      processors: [
        { id: 0, mId: 0, runQueue: [1], runningG: 0, status: 'running' },
        { id: 1, runQueue: [], status: 'idle' },
      ],
      globalQueue: [],
      event: 'G1 spawned → placed in P0 local run queue',
    },
  },
  {
    description: '`go func(1), go func(2)` — G2 and G3 are created. P0\'s local queue fills up. The scheduler may distribute to P1 or the global queue.',
    highlightLines: [17, 18, 19],
    state: {
      gomaxprocs: 2,
      goroutines: [
        { id: 0, label: 'main', status: 'running', color: '#d2a8ff', onP: 0 },
        { id: 1, label: 'G1', status: 'runqueue', color: COLORS[0] },
        { id: 2, label: 'G2', status: 'runqueue', color: COLORS[1] },
        { id: 3, label: 'G3', status: 'runqueue', color: COLORS[2] },
      ],
      threads: [
        { id: 0, pId: 0, status: 'running' },
        { id: 1, status: 'idle' },
      ],
      processors: [
        { id: 0, mId: 0, runQueue: [1, 2], runningG: 0, status: 'running' },
        { id: 1, runQueue: [3], status: 'idle' },
      ],
      globalQueue: [],
      event: 'G1, G2 in P0 queue; G3 in P1 queue',
      note: 'Scheduler balances goroutines across processors',
    },
  },
  {
    description: 'All 5 goroutines spawned. The for loop places them across processor queues. The global run queue holds overflow goroutines.',
    highlightLines: [17, 18, 19, 20, 21, 22, 23],
    state: {
      gomaxprocs: 2,
      goroutines: [
        { id: 0, label: 'main', status: 'running', color: '#d2a8ff', onP: 0 },
        { id: 1, label: 'G1', status: 'runqueue', color: COLORS[0] },
        { id: 2, label: 'G2', status: 'runqueue', color: COLORS[1] },
        { id: 3, label: 'G3', status: 'runqueue', color: COLORS[2] },
        { id: 4, label: 'G4', status: 'runqueue', color: COLORS[3] },
        { id: 5, label: 'G5', status: 'runqueue', color: COLORS[4] },
      ],
      threads: [
        { id: 0, pId: 0, status: 'running' },
        { id: 1, status: 'idle' },
      ],
      processors: [
        { id: 0, mId: 0, runQueue: [1, 2], runningG: 0, status: 'running' },
        { id: 1, runQueue: [3, 4], status: 'idle' },
      ],
      globalQueue: [5],
      event: '5 goroutines queued — P0: [G1,G2], P1: [G3,G4], global: [G5]',
    },
  },
  {
    description: 'The Go scheduler preempts main() (it called wg.Wait). P0 is now free. The scheduler picks G1 from P0\'s local queue to run on M0.',
    highlightLines: [26],
    state: {
      gomaxprocs: 2,
      goroutines: [
        { id: 0, label: 'main', status: 'blocked', color: '#d2a8ff' },
        { id: 1, label: 'G1', status: 'running', color: COLORS[0], onP: 0 },
        { id: 2, label: 'G2', status: 'runqueue', color: COLORS[1] },
        { id: 3, label: 'G3', status: 'runqueue', color: COLORS[2] },
        { id: 4, label: 'G4', status: 'runqueue', color: COLORS[3] },
        { id: 5, label: 'G5', status: 'runqueue', color: COLORS[4] },
      ],
      threads: [
        { id: 0, pId: 0, status: 'running' },
        { id: 1, pId: 1, status: 'running' },
      ],
      processors: [
        { id: 0, mId: 0, runQueue: [2], runningG: 1, status: 'running' },
        { id: 1, mId: 1, runQueue: [3, 4], status: 'running' },
      ],
      globalQueue: [5],
      event: 'main blocked on wg.Wait() → P0 runs G1, P1 activates',
      note: 'main goroutine is parked — it yields its P',
    },
  },
  {
    description: 'P1 picks up G3 and M1 (a new OS thread) gets attached to P1. Now both P0 (running G1) and P1 (running G3) execute TRULY in parallel on separate OS threads!',
    highlightLines: [21, 22],
    state: {
      gomaxprocs: 2,
      goroutines: [
        { id: 0, label: 'main', status: 'blocked', color: '#d2a8ff' },
        { id: 1, label: 'G1', status: 'running', color: COLORS[0], onP: 0 },
        { id: 2, label: 'G2', status: 'runqueue', color: COLORS[1] },
        { id: 3, label: 'G3', status: 'running', color: COLORS[2], onP: 1 },
        { id: 4, label: 'G4', status: 'runqueue', color: COLORS[3] },
        { id: 5, label: 'G5', status: 'runqueue', color: COLORS[4] },
      ],
      threads: [
        { id: 0, pId: 0, status: 'running' },
        { id: 1, pId: 1, status: 'running' },
      ],
      processors: [
        { id: 0, mId: 0, runQueue: [2], runningG: 1, status: 'running' },
        { id: 1, mId: 1, runQueue: [4], runningG: 3, status: 'running' },
      ],
      globalQueue: [5],
      event: 'TRUE parallelism: G1 on M0/P0, G3 on M1/P1 simultaneously',
      note: '⚡ GOMAXPROCS=2 means 2 goroutines run at the same instant',
    },
  },
  {
    description: 'G1 finishes. P0 picks the next goroutine (G2) from its local queue. G3 is still running on P1. Work continues in parallel.',
    highlightLines: [21, 22, 23],
    state: {
      gomaxprocs: 2,
      goroutines: [
        { id: 0, label: 'main', status: 'blocked', color: '#d2a8ff' },
        { id: 1, label: 'G1', status: 'done', color: COLORS[0] },
        { id: 2, label: 'G2', status: 'running', color: COLORS[1], onP: 0 },
        { id: 3, label: 'G3', status: 'running', color: COLORS[2], onP: 1 },
        { id: 4, label: 'G4', status: 'runqueue', color: COLORS[3] },
        { id: 5, label: 'G5', status: 'runqueue', color: COLORS[4] },
      ],
      threads: [
        { id: 0, pId: 0, status: 'running' },
        { id: 1, pId: 1, status: 'running' },
      ],
      processors: [
        { id: 0, mId: 0, runQueue: [], runningG: 2, status: 'running' },
        { id: 1, mId: 1, runQueue: [4], runningG: 3, status: 'running' },
      ],
      globalQueue: [5],
      event: 'G1 done → P0 picks G2 from local queue',
    },
  },
  {
    description: 'WORK STEALING in action! P0\'s local queue is now empty after G2 finishes. P0 "steals" half of P1\'s queue (G4). This prevents idle processors.',
    highlightLines: [21, 22],
    state: {
      gomaxprocs: 2,
      goroutines: [
        { id: 0, label: 'main', status: 'blocked', color: '#d2a8ff' },
        { id: 1, label: 'G1', status: 'done', color: COLORS[0] },
        { id: 2, label: 'G2', status: 'done', color: COLORS[1] },
        { id: 3, label: 'G3', status: 'running', color: COLORS[2], onP: 1 },
        { id: 4, label: 'G4', status: 'stealing', color: COLORS[3] },
        { id: 5, label: 'G5', status: 'runqueue', color: COLORS[4] },
      ],
      threads: [
        { id: 0, pId: 0, status: 'running' },
        { id: 1, pId: 1, status: 'running' },
      ],
      processors: [
        { id: 0, mId: 0, runQueue: [4], runningG: undefined, status: 'stealing' },
        { id: 1, mId: 1, runQueue: [], runningG: 3, status: 'running' },
      ],
      globalQueue: [5],
      event: '⚡ WORK STEALING: P0 steals G4 from P1\'s queue!',
      note: 'Work stealing keeps all processors busy — a key Go scheduler optimization',
    },
  },
  {
    description: 'P0 runs the stolen G4. G5 is pulled from the global queue. Both processors are fully utilized. G3 also finishes.',
    highlightLines: [21, 22],
    state: {
      gomaxprocs: 2,
      goroutines: [
        { id: 0, label: 'main', status: 'blocked', color: '#d2a8ff' },
        { id: 1, label: 'G1', status: 'done', color: COLORS[0] },
        { id: 2, label: 'G2', status: 'done', color: COLORS[1] },
        { id: 3, label: 'G3', status: 'done', color: COLORS[2] },
        { id: 4, label: 'G4', status: 'running', color: COLORS[3], onP: 0 },
        { id: 5, label: 'G5', status: 'running', color: COLORS[4], onP: 1 },
      ],
      threads: [
        { id: 0, pId: 0, status: 'running' },
        { id: 1, pId: 1, status: 'running' },
      ],
      processors: [
        { id: 0, mId: 0, runQueue: [], runningG: 4, status: 'running' },
        { id: 1, mId: 1, runQueue: [], runningG: 5, status: 'running' },
      ],
      globalQueue: [],
      event: 'G4 on P0, G5 from global queue on P1. G3 done.',
    },
  },
  {
    description: 'All 5 goroutines complete. Each called wg.Done(). The WaitGroup counter reaches 0, waking up the main goroutine.',
    highlightLines: [20, 26],
    state: {
      gomaxprocs: 2,
      goroutines: [
        { id: 0, label: 'main', status: 'running', color: '#d2a8ff', onP: 0 },
        { id: 1, label: 'G1', status: 'done', color: COLORS[0] },
        { id: 2, label: 'G2', status: 'done', color: COLORS[1] },
        { id: 3, label: 'G3', status: 'done', color: COLORS[2] },
        { id: 4, label: 'G4', status: 'done', color: COLORS[3] },
        { id: 5, label: 'G5', status: 'done', color: COLORS[4] },
      ],
      threads: [
        { id: 0, pId: 0, status: 'running' },
        { id: 1, status: 'idle' },
      ],
      processors: [
        { id: 0, mId: 0, runQueue: [], runningG: 0, status: 'running' },
        { id: 1, runQueue: [], status: 'idle' },
      ],
      globalQueue: [],
      event: 'All goroutines done → WaitGroup releases main',
      note: '✅ GOMAXPROCS=2 achieved true parallelism across 2 OS threads',
    },
  },
];

// ─── Visual helpers ─────────────────────────────────────────────────────────

function GoroutinePill({
  g,
  small = false,
}: {
  g: { id: number; label: string; status: string; color: string };
  small?: boolean;
}) {
  const statusColors: Record<string, string> = {
    running: g.color,
    runqueue: '#8b949e',
    blocked: '#ffa657',
    done: '#3fb950',
    stealing: '#d2a8ff',
  };
  const col = statusColors[g.status] ?? '#8b949e';
  return (
    <div
      className={`rounded-lg border flex items-center justify-center transition-all duration-300 ${small ? 'w-10 h-8 text-[10px]' : 'w-12 h-10 text-xs'}`}
      style={{
        borderColor: col,
        backgroundColor: `${col}18`,
        color: col,
        boxShadow: g.status === 'running' ? `0 0 8px ${col}60` : g.status === 'stealing' ? `0 0 8px #d2a8ff60` : 'none',
        opacity: g.status === 'done' ? 0.5 : 1,
      }}
    >
      <span className="font-mono">{g.label}</span>
    </div>
  );
}

export function GoroutineScheduler() {
  return (
    <VisualizationLayout
      title="Goroutine Scheduler"
      description="GMP model: GOMAXPROCS, OS threads (M), Logical Processors (P), work stealing"
      tag="Concurrency"
      tagColor="bg-[#00ACD7]"
      steps={steps}
      codeLines={codeLines}
      renderVisual={(state: SchedulerState) => {
        const allGoroutines = state.goroutines;

        return (
          <div className="w-full max-w-2xl space-y-4 text-sm">

            {/* GOMAXPROCS badge */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-[#00ACD7]/10 border border-[#00ACD7]/30 rounded-lg px-3 py-1.5">
                <span className="text-[#00ACD7] font-mono text-xs">GOMAXPROCS</span>
                <span
                  className="w-7 h-7 rounded-full bg-[#00ACD7] flex items-center justify-center font-mono text-white text-sm"
                >
                  {state.gomaxprocs}
                </span>
              </div>
              <div className="flex items-center gap-2 bg-[#161b22] border border-[#30363d] rounded-lg px-3 py-1.5">
                <span className="text-[#8b949e] text-xs">Active M (threads):</span>
                <span className="text-[#e6edf3] font-mono text-xs">{state.threads.filter(m => m.status !== 'idle').length}</span>
              </div>
              <div className="flex items-center gap-2 bg-[#161b22] border border-[#30363d] rounded-lg px-3 py-1.5">
                <span className="text-[#8b949e] text-xs">Goroutines:</span>
                <span className="text-[#e6edf3] font-mono text-xs">{allGoroutines.length}</span>
              </div>
            </div>

            {/* GMP Architecture */}
            <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-4">
              <p className="text-[#8b949e] text-xs uppercase tracking-wide mb-3">GMP Architecture</p>

              <div className="grid grid-cols-2 gap-3">
                {state.processors.map((p) => {
                  const m = state.threads.find(t => t.pId === p.id);
                  const runningG = allGoroutines.find(g => g.id === p.runningG);
                  const queueGs = p.runQueue.map(id => allGoroutines.find(g => g.id === id)).filter(Boolean) as typeof allGoroutines;

                  const pColors = {
                    running: '#00ACD7',
                    idle: '#30363d',
                    stealing: '#d2a8ff',
                  }[p.status];

                  return (
                    <div
                      key={p.id}
                      className="rounded-xl border-2 p-3 transition-all duration-300"
                      style={{
                        borderColor: pColors,
                        backgroundColor: `${pColors}08`,
                        boxShadow: p.status === 'running' ? `0 0 16px ${pColors}30` : 'none',
                      }}
                    >
                      {/* P header */}
                      <div className="flex items-center justify-between mb-2">
                        <div
                          className="px-2 py-0.5 rounded font-mono text-xs"
                          style={{ backgroundColor: `${pColors}25`, color: pColors }}
                        >
                          P{p.id}
                        </div>
                        {m && (
                          <div
                            className="px-2 py-0.5 rounded font-mono text-xs"
                            style={{
                              backgroundColor: 'rgba(121,192,255,0.15)',
                              color: '#79c0ff',
                            }}
                          >
                            M{m.id}
                            <span className="ml-1 opacity-60 text-[10px]">({m.status})</span>
                          </div>
                        )}
                        {!m && (
                          <div className="px-2 py-0.5 rounded font-mono text-xs text-[#8b949e] bg-[#30363d]/40">
                            no thread
                          </div>
                        )}
                      </div>

                      {/* Running goroutine */}
                      <div className="mb-2">
                        <p className="text-[10px] text-[#8b949e] mb-1">Running:</p>
                        <div className="h-10 bg-[#0d1117] rounded-lg flex items-center justify-center border border-[#30363d]">
                          {runningG ? (
                            <GoroutinePill g={runningG} small />
                          ) : (
                            <span className="text-[#30363d] text-xs">—</span>
                          )}
                        </div>
                      </div>

                      {/* Local run queue */}
                      <div>
                        <p className="text-[10px] text-[#8b949e] mb-1">Local queue ({queueGs.length}):</p>
                        <div className="flex gap-1 flex-wrap min-h-[2rem] bg-[#0d1117] rounded-lg p-1 border border-[#30363d]">
                          {queueGs.length === 0 && (
                            <span className="text-[#30363d] text-[10px] self-center mx-auto">empty</span>
                          )}
                          {queueGs.map(g => (
                            <GoroutinePill key={g.id} g={g} small />
                          ))}
                        </div>
                      </div>

                      {/* Stealing indicator */}
                      {p.status === 'stealing' && (
                        <div className="mt-2 text-center text-[10px] text-[#d2a8ff] bg-[#d2a8ff]/10 rounded py-1 border border-[#d2a8ff]/30">
                          ⚡ stealing work...
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Global Run Queue */}
            <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[#8b949e] text-xs uppercase tracking-wide">Global Run Queue</p>
                <span className="text-xs text-[#8b949e]">{state.globalQueue.length} goroutines</span>
              </div>
              <div className="flex gap-2 flex-wrap min-h-[2.5rem] items-center">
                {state.globalQueue.length === 0 && (
                  <span className="text-[#30363d] text-xs">empty</span>
                )}
                {state.globalQueue.map(id => {
                  const g = allGoroutines.find(g => g.id === id);
                  return g ? <GoroutinePill key={id} g={g} small /> : null;
                })}
              </div>
            </div>

            {/* All goroutines status */}
            <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3">
              <p className="text-[#8b949e] text-xs uppercase tracking-wide mb-2">All Goroutines</p>
              <div className="flex flex-wrap gap-2">
                {allGoroutines.map(g => (
                  <div key={g.id} className="flex flex-col items-center gap-1">
                    <GoroutinePill g={g} />
                    <span
                      className="text-[10px]"
                      style={{
                        color: g.status === 'running' ? g.color : g.status === 'done' ? '#3fb950' : g.status === 'blocked' ? '#ffa657' : '#8b949e',
                      }}
                    >
                      {g.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Event */}
            <div className="bg-[#0d1117] border border-[#30363d] rounded-lg p-3">
              <p className="text-[#8b949e] text-xs uppercase tracking-wide mb-1">Scheduler Event</p>
              <p className="text-[#e6edf3] text-xs font-mono">{state.event}</p>
            </div>

            {/* Note */}
            {state.note && (
              <div
                className="border rounded-lg p-3"
                style={{
                  backgroundColor: state.note.includes('✅') ? 'rgba(63,185,80,0.08)' : state.note.includes('⚡') ? 'rgba(0,172,215,0.08)' : 'rgba(255,166,87,0.08)',
                  borderColor: state.note.includes('✅') ? 'rgba(63,185,80,0.4)' : state.note.includes('⚡') ? 'rgba(0,172,215,0.4)' : 'rgba(255,166,87,0.4)',
                }}
              >
                <p
                  className="text-xs"
                  style={{
                    color: state.note.includes('✅') ? '#3fb950' : state.note.includes('⚡') ? '#00ACD7' : '#ffa657',
                  }}
                >
                  {state.note}
                </p>
              </div>
            )}

            {/* GMP Legend */}
            <div className="grid grid-cols-3 gap-2 text-xs">
              {[
                { label: 'G — Goroutine', color: '#00ACD7', desc: 'Lightweight thread' },
                { label: 'M — OS Thread', color: '#79c0ff', desc: 'System thread' },
                { label: 'P — Processor', color: '#d2a8ff', desc: 'Execution context' },
              ].map(item => (
                <div
                  key={item.label}
                  className="bg-[#161b22] border border-[#30363d] rounded-lg p-2"
                >
                  <p className="font-mono mb-0.5" style={{ color: item.color }}>{item.label}</p>
                  <p className="text-[#8b949e] text-[10px]">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        );
      }}
    />
  );
}
