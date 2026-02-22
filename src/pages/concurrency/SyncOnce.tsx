import { VisualizationLayout, type Step } from '../../components/VisualizationLayout';

interface GoroutineOnce {
  id: number;
  label: string;
  status: 'spawning' | 'calling-do' | 'executing-init' | 'waiting' | 'done' | 'idle';
  color: string;
  doCallResult?: 'ran' | 'skipped';
}

interface OnceState {
  onceState: 'fresh' | 'done';
  onceCallCount: number;       // how many times Do() was called
  initRunCount: number;        // how many times the init fn actually ran
  goroutines: GoroutineOnce[];
  initLog: string[];
  output: string[];
  note?: string;
  withoutOnce?: boolean;
  withoutOnceLog?: string[];
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
  '    once     sync.Once',
  '    instance string',
  ')',
  '',
  'func initialize() {',
  '    instance = "DB connection ready"',
  '    fmt.Println("init() called — expensive setup!")',
  '}',
  '',
  'func getConnection(id int, wg *sync.WaitGroup) {',
  '    defer wg.Done()',
  '    // No matter how many goroutines call this,',
  '    // initialize() runs EXACTLY once',
  '    once.Do(initialize)',
  '    fmt.Printf("G%d using: %s\\n", id, instance)',
  '}',
  '',
  'func main() {',
  '    var wg sync.WaitGroup',
  '    for i := 1; i <= 4; i++ {',
  '        wg.Add(1)',
  '        go getConnection(i, &wg)',
  '    }',
  '    wg.Wait()',
  '}',
];

const COLORS = ['#00ACD7', '#3fb950', '#ffa657', '#d2a8ff'];

const steps: Step<OnceState>[] = [
  {
    description: 'The problem: 4 goroutines all need the same database connection. Without sync.Once, `initialize()` would run 4 times — wasteful and unsafe!',
    highlightLines: [13, 14, 15, 16],
    state: {
      onceState: 'fresh',
      onceCallCount: 4,
      initRunCount: 4,
      goroutines: COLORS.map((c, i) => ({ id: i + 1, label: `G${i + 1}`, status: 'executing-init', color: c })),
      withoutOnce: true,
      withoutOnceLog: [
        'G1 → init() called — expensive setup!',
        'G2 → init() called — expensive setup!',
        'G3 → init() called — expensive setup!',
        'G4 → init() called — expensive setup!',
      ],
      initLog: [],
      output: [],
      note: '⚠️ Without sync.Once: init runs 4 times — data races possible!',
    },
  },
  {
    description: '`sync.Once` is a struct with a single method: `Do(f func())`. It guarantees `f` runs exactly once, no matter how many goroutines call `Do`. The state starts as "fresh".',
    highlightLines: [9, 22],
    state: {
      onceState: 'fresh',
      onceCallCount: 0,
      initRunCount: 0,
      goroutines: [],
      initLog: [],
      output: [],
      note: 'sync.Once internal state: done=0 (not yet executed)',
    },
  },
  {
    description: '4 goroutines are launched, all calling `getConnection`. Each will reach `once.Do(initialize)`. They race to be first.',
    highlightLines: [28, 29, 30, 31],
    state: {
      onceState: 'fresh',
      onceCallCount: 0,
      initRunCount: 0,
      goroutines: COLORS.map((c, i) => ({ id: i + 1, label: `G${i + 1}`, status: 'spawning', color: c })),
      initLog: [],
      output: [],
    },
  },
  {
    description: 'All 4 goroutines reach `once.Do(initialize)`. G1 wins the race — it calls `initialize()`. G2, G3, G4 are BLOCKED waiting for the Do to complete.',
    highlightLines: [22],
    state: {
      onceState: 'fresh',
      onceCallCount: 1,
      initRunCount: 0,
      goroutines: [
        { id: 1, label: 'G1', status: 'executing-init', color: COLORS[0] },
        { id: 2, label: 'G2', status: 'waiting', color: COLORS[1] },
        { id: 3, label: 'G3', status: 'waiting', color: COLORS[2] },
        { id: 4, label: 'G4', status: 'waiting', color: COLORS[3] },
      ],
      initLog: [],
      output: [],
      note: 'G2, G3, G4 block inside Do() until G1 finishes initialize()',
    },
  },
  {
    description: 'G1 executes `initialize()` — the expensive setup runs ONCE. It sets `instance` and prints the log message. sync.Once internally sets done=1.',
    highlightLines: [13, 14, 15, 16],
    state: {
      onceState: 'fresh',
      onceCallCount: 1,
      initRunCount: 1,
      goroutines: [
        { id: 1, label: 'G1', status: 'executing-init', color: COLORS[0], doCallResult: 'ran' },
        { id: 2, label: 'G2', status: 'waiting', color: COLORS[1] },
        { id: 3, label: 'G3', status: 'waiting', color: COLORS[2] },
        { id: 4, label: 'G4', status: 'waiting', color: COLORS[3] },
      ],
      initLog: ['init() called — expensive setup!', 'instance = "DB connection ready"'],
      output: ['init() called — expensive setup!'],
    },
  },
  {
    description: 'G1 finishes. sync.Once marks itself done (done=1). G2, G3, G4 are UNBLOCKED — they each call `once.Do` but since done=1 the init function is SKIPPED immediately.',
    highlightLines: [22],
    state: {
      onceState: 'done',
      onceCallCount: 4,
      initRunCount: 1,
      goroutines: [
        { id: 1, label: 'G1', status: 'done', color: COLORS[0], doCallResult: 'ran' },
        { id: 2, label: 'G2', status: 'calling-do', color: COLORS[1], doCallResult: 'skipped' },
        { id: 3, label: 'G3', status: 'calling-do', color: COLORS[2], doCallResult: 'skipped' },
        { id: 4, label: 'G4', status: 'calling-do', color: COLORS[3], doCallResult: 'skipped' },
      ],
      initLog: ['init() called — expensive setup!', 'instance = "DB connection ready"'],
      output: ['init() called — expensive setup!'],
      note: '⚡ done=1: G2, G3, G4 calls to Do() return immediately — init skipped!',
    },
  },
  {
    description: 'All 4 goroutines proceed to use `instance`. `initialize()` ran exactly ONCE despite 4 concurrent `Do()` calls. Safe, efficient, and race-free.',
    highlightLines: [23],
    state: {
      onceState: 'done',
      onceCallCount: 4,
      initRunCount: 1,
      goroutines: COLORS.map((c, i) => ({ id: i + 1, label: `G${i + 1}`, status: 'done', color: c, doCallResult: i === 0 ? 'ran' : 'skipped' })),
      initLog: ['init() called — expensive setup!', 'instance = "DB connection ready"'],
      output: [
        'init() called — expensive setup!',
        'G1 using: DB connection ready',
        'G2 using: DB connection ready',
        'G3 using: DB connection ready',
        'G4 using: DB connection ready',
      ],
      note: '✅ init() ran exactly once. All 4 goroutines share the result.',
    },
  },
];

export function SyncOnce() {
  return (
    <VisualizationLayout
      title="sync.Once"
      description="Guarantee a function runs exactly once — perfect for lazy initialization"
      tag="Concurrency"
      tagColor="bg-[#00ACD7]"
      steps={steps}
      codeLines={codeLines}
      renderVisual={(state: OnceState) => (
        <div className="w-full max-w-xl space-y-4">

          {/* Without Once warning */}
          {state.withoutOnce && (
            <div className="bg-[#f85149]/10 border border-[#f85149]/40 rounded-xl p-4">
              <p className="text-[#f85149] text-sm mb-3">⚠️ WITHOUT sync.Once — init runs 4 times!</p>
              <div className="space-y-1">
                {state.withoutOnceLog?.map((line, i) => (
                  <p key={i} className="font-mono text-xs text-[#f85149]/80">{line}</p>
                ))}
              </div>
            </div>
          )}

          {/* sync.Once status box */}
          {!state.withoutOnce && (
            <div
              className="rounded-xl border-2 p-4 transition-all duration-500"
              style={{
                borderColor: state.onceState === 'done' ? '#3fb950' : '#00ACD7',
                backgroundColor: state.onceState === 'done' ? 'rgba(63,185,80,0.08)' : 'rgba(0,172,215,0.06)',
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <p className="font-mono text-sm text-[#e6edf3]">sync.Once</p>
                <div
                  className="px-3 py-1 rounded-full text-xs font-mono transition-all duration-300"
                  style={{
                    backgroundColor: state.onceState === 'done' ? 'rgba(63,185,80,0.2)' : 'rgba(0,172,215,0.2)',
                    color: state.onceState === 'done' ? '#3fb950' : '#00ACD7',
                  }}
                >
                  {state.onceState === 'done' ? '✓ done = 1 (executed)' : '○ done = 0 (fresh)'}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#0d1117] border border-[#30363d] rounded-lg p-3 text-center">
                  <p className="text-[#8b949e] text-xs mb-1">Do() called</p>
                  <p className="font-mono text-2xl" style={{ color: '#00ACD7' }}>{state.onceCallCount}</p>
                  <p className="text-[#8b949e] text-[10px]">times</p>
                </div>
                <div
                  className="border rounded-lg p-3 text-center transition-all duration-300"
                  style={{
                    backgroundColor: state.initRunCount > 0 ? 'rgba(63,185,80,0.08)' : '#0d1117',
                    borderColor: state.initRunCount > 0 ? '#3fb950' : '#30363d',
                  }}
                >
                  <p className="text-[#8b949e] text-xs mb-1">init() ran</p>
                  <p
                    className="font-mono text-2xl transition-all duration-300"
                    style={{ color: state.initRunCount > 0 ? '#3fb950' : '#8b949e' }}
                  >
                    {state.initRunCount}
                  </p>
                  <p className="text-[#8b949e] text-[10px]">time{state.initRunCount !== 1 ? 's' : ''}</p>
                </div>
              </div>
            </div>
          )}

          {/* Goroutines */}
          {!state.withoutOnce && state.goroutines.length > 0 && (
            <div>
              <p className="text-[#8b949e] text-xs uppercase tracking-wide mb-2">Goroutines</p>
              <div className="space-y-2">
                {state.goroutines.map(g => {
                  const statusMap: Record<string, { label: string; color: string }> = {
                    spawning:       { label: 'spawning', color: '#8b949e' },
                    'calling-do':   { label: 'once.Do() called', color: g.color },
                    'executing-init': { label: '▶ executing init()', color: '#ffa657' },
                    waiting:        { label: '⏸ blocked in Do()', color: '#ffa657' },
                    done:           { label: '✓ done', color: '#3fb950' },
                    idle:           { label: 'idle', color: '#30363d' },
                  };
                  const st = statusMap[g.status] ?? { label: g.status, color: '#8b949e' };

                  return (
                    <div
                      key={g.id}
                      className="flex items-center gap-3 p-3 rounded-lg border transition-all duration-300"
                      style={{
                        borderColor: g.status === 'waiting' ? '#ffa657' : g.status === 'executing-init' ? g.color : g.status === 'done' ? '#3fb950' : '#30363d',
                        backgroundColor: g.status === 'executing-init' ? `${g.color}12` : g.status === 'waiting' ? 'rgba(255,166,87,0.06)' : 'transparent',
                        boxShadow: g.status === 'executing-init' ? `0 0 10px ${g.color}30` : 'none',
                      }}
                    >
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-xs flex-shrink-0"
                        style={{ backgroundColor: g.status === 'done' ? '#3fb950' : g.color, color: '#0d1117' }}
                      >
                        {g.label}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[#e6edf3] font-mono text-sm">once.Do(initialize)</span>
                          <span className="text-xs" style={{ color: st.color }}>{st.label}</span>
                        </div>
                      </div>
                      {/* Do result badge */}
                      {g.doCallResult === 'ran' && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#3fb950]/20 text-[#3fb950] flex-shrink-0">ran init</span>
                      )}
                      {g.doCallResult === 'skipped' && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#30363d] text-[#8b949e] flex-shrink-0">skipped</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* init() log */}
          {state.initLog.length > 0 && (
            <div className="bg-[#161b22] border border-[#3fb950]/40 rounded-lg p-3">
              <p className="text-[#8b949e] text-xs uppercase tracking-wide mb-2">initialize() execution</p>
              {state.initLog.map((line, i) => (
                <p key={i} className="font-mono text-xs text-[#3fb950]">{line}</p>
              ))}
            </div>
          )}

          {/* Output */}
          {state.output.length > 0 && (
            <div className="bg-[#0d1117] border border-[#30363d] rounded-lg p-3 max-h-36 overflow-auto">
              <p className="text-[#8b949e] text-xs uppercase tracking-wide mb-2">Output</p>
              {state.output.map((line, i) => (
                <p
                  key={i}
                  className="font-mono text-xs"
                  style={{ color: line.includes('init()') ? '#ffa657' : '#3fb950' }}
                >
                  {line}
                </p>
              ))}
            </div>
          )}

          {/* Note */}
          {state.note && (
            <div
              className="border rounded-lg p-3"
              style={{
                backgroundColor: state.note.includes('✅') ? 'rgba(63,185,80,0.08)' : state.note.includes('⚡') ? 'rgba(0,172,215,0.08)' : 'rgba(248,81,73,0.08)',
                borderColor: state.note.includes('✅') ? 'rgba(63,185,80,0.4)' : state.note.includes('⚡') ? 'rgba(0,172,215,0.4)' : 'rgba(248,81,73,0.4)',
              }}
            >
              <p
                className="text-xs"
                style={{ color: state.note.includes('✅') ? '#3fb950' : state.note.includes('⚡') ? '#00ACD7' : '#f85149' }}
              >
                {state.note}
              </p>
            </div>
          )}

          {/* Key facts */}
          <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3">
            <p className="text-[#8b949e] text-xs uppercase tracking-wide mb-2">sync.Once — Key Facts</p>
            <div className="space-y-1.5 text-xs">
              {[
                { icon: '🔒', text: 'Thread-safe: safe for concurrent goroutines', color: '#00ACD7' },
                { icon: '1️⃣', text: 'The function runs exactly once, even under race conditions', color: '#3fb950' },
                { icon: '⏸', text: 'Other goroutines BLOCK inside Do() until the first call completes', color: '#ffa657' },
                { icon: '💡', text: 'Perfect for lazy singleton init, config loading, DB connections', color: '#d2a8ff' },
              ].map(item => (
                <div key={item.icon} className="flex items-start gap-2">
                  <span>{item.icon}</span>
                  <span style={{ color: item.color }}>{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    />
  );
}
