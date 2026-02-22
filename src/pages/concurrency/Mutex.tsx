import { VisualizationLayout, type Step } from '../../components/VisualizationLayout';

interface GoroutineInfo { id: number; status: 'running' | 'waiting' | 'in-critical' | 'done'; color: string; increments: number }
interface MutexState {
  locked: boolean;
  owner?: number;
  counter: number;
  goroutines: GoroutineInfo[];
  withoutMutex?: boolean;
  raceResult?: number;
  output: string[];
}

const codeLines = [
  'package main',
  '',
  'import (',
  '    "fmt"',
  '    "sync"',
  ')',
  '',
  'var (',
  '    counter int',
  '    mu      sync.Mutex',
  ')',
  '',
  'func increment(wg *sync.WaitGroup) {',
  '    defer wg.Done()',
  '    mu.Lock()            // acquire lock',
  '    counter++            // critical section',
  '    mu.Unlock()          // release lock',
  '}',
  '',
  'func main() {',
  '    var wg sync.WaitGroup',
  '    for i := 0; i < 3; i++ {',
  '        wg.Add(1)',
  '        go increment(&wg)',
  '    }',
  '    wg.Wait()',
  '    fmt.Println(counter) // always 3',
  '}',
];

const gColors = ['#00ACD7', '#ffa657', '#d2a8ff'];

const steps: Step<MutexState>[] = [
  {
    description: 'Without Mutex: 3 goroutines all read counter=0, increment, and write back. Result is unpredictable — RACE CONDITION!',
    highlightLines: [9, 10],
    state: {
      locked: false, counter: 0,
      goroutines: gColors.map((c, i) => ({ id: i + 1, status: 'running', color: c, increments: 0 })),
      withoutMutex: true, raceResult: 1,
      output: ['Without Mutex: counter = 1 (should be 3!) 🐛'],
    },
  },
  {
    description: 'With Mutex: declare sync.Mutex. Only ONE goroutine can hold the lock at a time — protecting the critical section.',
    highlightLines: [10],
    state: { locked: false, counter: 0, goroutines: gColors.map((c, i) => ({ id: i + 1, status: 'running', color: c, increments: 0 })), output: [] },
  },
  {
    description: 'Goroutine 1 calls mu.Lock(). Lock is FREE → G1 acquires it immediately. Other goroutines must wait!',
    highlightLines: [15],
    state: {
      locked: true, owner: 1, counter: 0,
      goroutines: [
        { id: 1, status: 'in-critical', color: gColors[0], increments: 0 },
        { id: 2, status: 'waiting', color: gColors[1], increments: 0 },
        { id: 3, status: 'waiting', color: gColors[2], increments: 0 },
      ],
      output: [],
    },
  },
  {
    description: 'G1 is in the CRITICAL SECTION — executes counter++ safely. counter: 0→1. G2 and G3 are BLOCKED waiting for the lock.',
    highlightLines: [16],
    state: {
      locked: true, owner: 1, counter: 1,
      goroutines: [
        { id: 1, status: 'in-critical', color: gColors[0], increments: 1 },
        { id: 2, status: 'waiting', color: gColors[1], increments: 0 },
        { id: 3, status: 'waiting', color: gColors[2], increments: 0 },
      ],
      output: [],
    },
  },
  {
    description: 'G1 calls mu.Unlock() — releases the lock. G2 and G3 are woken up; one will acquire the lock next.',
    highlightLines: [17],
    state: {
      locked: false, owner: undefined, counter: 1,
      goroutines: [
        { id: 1, status: 'done', color: gColors[0], increments: 1 },
        { id: 2, status: 'running', color: gColors[1], increments: 0 },
        { id: 3, status: 'running', color: gColors[2], increments: 0 },
      ],
      output: [],
    },
  },
  {
    description: 'G2 acquires the lock. Enters critical section. G3 still waiting.',
    highlightLines: [15, 16],
    state: {
      locked: true, owner: 2, counter: 2,
      goroutines: [
        { id: 1, status: 'done', color: gColors[0], increments: 1 },
        { id: 2, status: 'in-critical', color: gColors[1], increments: 1 },
        { id: 3, status: 'waiting', color: gColors[2], increments: 0 },
      ],
      output: [],
    },
  },
  {
    description: 'G2 unlocks. G3 acquires lock, increments counter: 2→3, unlocks. All goroutines done.',
    highlightLines: [15, 16, 17],
    state: {
      locked: false, owner: undefined, counter: 3,
      goroutines: gColors.map((c, i) => ({ id: i + 1, status: 'done', color: c, increments: 1 })),
      output: ['counter = 3 ✓ (always correct with Mutex)'],
    },
  },
];

const statusStyles: Record<string, { border: string; bg: string; label: string; labelColor: string }> = {
  running: { border: '#30363d', bg: 'transparent', label: 'running', labelColor: '#8b949e' },
  waiting: { border: '#ffa657', bg: 'rgba(255,166,87,0.08)', label: '⏸ blocked', labelColor: '#ffa657' },
  'in-critical': { border: '#f85149', bg: 'rgba(248,81,73,0.1)', label: '🔒 in critical', labelColor: '#f85149' },
  done: { border: '#3fb950', bg: 'rgba(63,185,80,0.08)', label: '✓ done', labelColor: '#3fb950' },
};

export function Mutex() {
  return (
    <VisualizationLayout
      title="Mutex"
      description="sync.Mutex — mutual exclusion lock for protecting shared state"
      tag="Concurrency"
      tagColor="bg-[#00ACD7]"
      steps={steps}
      codeLines={codeLines}
      renderVisual={(state: MutexState) => (
        <div className="w-full max-w-xl space-y-5">
          {/* Race condition warning */}
          {state.withoutMutex && (
            <div className="bg-[#f85149]/10 border border-[#f85149]/30 rounded-xl p-4">
              <p className="text-[#f85149] text-sm mb-2">⚠️ Race Condition — WITHOUT Mutex</p>
              <p className="text-[#8b949e] text-xs">All goroutines read counter=0 simultaneously, increment locally, and write back. Two writes overwrite each other!</p>
              <div className="mt-2 font-mono text-xs text-center bg-[#0d1117] rounded-lg p-2">
                <span className="text-[#8b949e]">Expected: </span>
                <span className="text-[#3fb950]">3</span>
                <span className="text-[#8b949e] mx-2">→ Actual: </span>
                <span className="text-[#f85149]">{state.raceResult} 🐛</span>
              </div>
            </div>
          )}

          {/* Mutex lock visualization */}
          {!state.withoutMutex && (
            <div
              className="rounded-xl border-2 p-4 transition-all duration-300"
              style={{
                borderColor: state.locked ? '#f85149' : '#3fb950',
                backgroundColor: state.locked ? 'rgba(248,81,73,0.08)' : 'rgba(63,185,80,0.05)',
              }}
            >
              <div className="flex items-center gap-4">
                <div className="text-4xl">{state.locked ? '🔒' : '🔓'}</div>
                <div>
                  <p className="text-[#e6edf3] font-mono">sync.Mutex</p>
                  <p
                    className="text-sm"
                    style={{ color: state.locked ? '#f85149' : '#3fb950' }}
                  >
                    {state.locked ? `LOCKED by G${state.owner}` : 'UNLOCKED (free)'}
                  </p>
                </div>
                <div className="ml-auto text-right">
                  <p className="text-[#8b949e] text-xs">counter</p>
                  <p className="text-[#00ACD7] font-mono text-3xl">{state.counter}</p>
                </div>
              </div>
            </div>
          )}

          {/* Goroutines */}
          <div className="space-y-2">
            <p className="text-[#8b949e] text-xs uppercase tracking-wide">Goroutines</p>
            {state.goroutines.map(g => {
              const style = statusStyles[g.status];
              return (
                <div
                  key={g.id}
                  className="flex items-center gap-3 p-3 rounded-lg border-2 transition-all duration-300"
                  style={{ borderColor: style.border, backgroundColor: style.bg }}
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all duration-300"
                    style={{
                      backgroundColor: g.status === 'done' ? '#3fb950' : g.color,
                      color: '#0d1117',
                      transform: g.status === 'in-critical' ? 'scale(1.15)' : 'scale(1)',
                    }}
                  >
                    G{g.id}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[#e6edf3] text-sm font-mono">goroutine {g.id}</span>
                      <span className="text-xs" style={{ color: style.labelColor }}>{style.label}</span>
                    </div>
                    {g.status === 'in-critical' && (
                      <div className="mt-1 text-xs font-mono text-[#ffa657]">
                        mu.Lock() → counter++ → mu.Unlock()
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Output */}
          {state.output.length > 0 && (
            <div className="bg-[#0d1117] border border-[#30363d] rounded-lg p-3">
              <p className="text-[#8b949e] text-xs uppercase tracking-wide mb-2">Result</p>
              {state.output.map((line, i) => (
                <p key={i} className={`font-mono text-sm ${line.includes('🐛') ? 'text-[#f85149]' : 'text-[#3fb950]'}`}>{line}</p>
              ))}
            </div>
          )}

          {/* Key rule */}
          <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3 text-xs text-[#8b949e]">
            <span className="text-[#00ACD7]">Rule:</span> Only one goroutine can hold the mutex lock at any time.
            All others calling Lock() will <span className="text-[#ffa657]">BLOCK</span> until the current holder calls <span className="text-[#3fb950]">Unlock()</span>.
          </div>
        </div>
      )}
    />
  );
}
