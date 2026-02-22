import { VisualizationLayout, type Step } from '../../components/VisualizationLayout';

type GStatus = 'idle' | 'waiting-rlock' | 'reading' | 'waiting-lock' | 'writing' | 'done';

interface Goroutine {
  id: number;
  label: string;
  kind: 'reader' | 'writer';
  status: GStatus;
  color: string;
  valueRead?: number;
}

interface RWMutexState {
  lockState: 'unlocked' | 'read-locked' | 'write-locked';
  activeReaders: number;
  dataValue: number;
  goroutines: Goroutine[];
  output: string[];
  note?: string;
}

const codeLines = [
  'package main',
  '',
  'import (',
  '    "fmt"',
  '    "sync"',
  '    "time"',
  ')',
  '',
  'var (',
  '    mu   sync.RWMutex',
  '    data = 0',
  ')',
  '',
  'func read(id int, wg *sync.WaitGroup) {',
  '    defer wg.Done()',
  '    mu.RLock()           // shared read lock',
  '    defer mu.RUnlock()',
  '    fmt.Printf("R%d reads: %d\\n", id, data)',
  '}',
  '',
  'func write(val int, wg *sync.WaitGroup) {',
  '    defer wg.Done()',
  '    mu.Lock()            // exclusive write lock',
  '    defer mu.Unlock()',
  '    data = val',
  '    fmt.Printf("Writer sets data = %d\\n", val)',
  '}',
  '',
  'func main() {',
  '    var wg sync.WaitGroup',
  '    // 3 readers run concurrently',
  '    for i := 1; i <= 3; i++ {',
  '        wg.Add(1)',
  '        go read(i, &wg)',
  '    }',
  '    // Writer needs exclusive access',
  '    wg.Add(1)',
  '    go write(42, &wg)',
  '    wg.Wait()',
  '}',
];

const READER_COLORS = ['#00ACD7', '#79c0ff', '#3fb950'];
const WRITER_COLOR = '#f85149';

const steps: Step<RWMutexState>[] = [
  {
    description: 'sync.RWMutex has two lock modes: RLock() for SHARED reads (multiple readers OK simultaneously), and Lock() for EXCLUSIVE writes (no other reader or writer). Start: unlocked.',
    highlightLines: [10],
    state: {
      lockState: 'unlocked',
      activeReaders: 0,
      dataValue: 0,
      goroutines: [],
      output: [],
      note: 'RWMutex: many can read at once, but writes need exclusive access',
    },
  },
  {
    description: 'R1, R2, R3 are launched. Each calls mu.RLock(). The lock is free — R1 acquires a read lock. READ locks are SHARED: R2 and R3 can also acquire RLock simultaneously!',
    highlightLines: [15, 16, 17],
    state: {
      lockState: 'read-locked',
      activeReaders: 1,
      dataValue: 0,
      goroutines: [
        { id: 1, label: 'R1', kind: 'reader', status: 'reading', color: READER_COLORS[0] },
        { id: 2, label: 'R2', kind: 'reader', status: 'waiting-rlock', color: READER_COLORS[1] },
        { id: 3, label: 'R3', kind: 'reader', status: 'waiting-rlock', color: READER_COLORS[2] },
        { id: 4, label: 'W', kind: 'writer', status: 'idle', color: WRITER_COLOR },
      ],
      output: [],
      note: 'RLock(): shared — does NOT block other RLock() calls',
    },
  },
  {
    description: 'R2 and R3 also acquire RLock immediately! All 3 readers hold the lock concurrently — this is the KEY advantage of RWMutex over plain Mutex. 3 concurrent reads!',
    highlightLines: [15, 16, 17, 18],
    state: {
      lockState: 'read-locked',
      activeReaders: 3,
      dataValue: 0,
      goroutines: [
        { id: 1, label: 'R1', kind: 'reader', status: 'reading', color: READER_COLORS[0] },
        { id: 2, label: 'R2', kind: 'reader', status: 'reading', color: READER_COLORS[1] },
        { id: 3, label: 'R3', kind: 'reader', status: 'reading', color: READER_COLORS[2] },
        { id: 4, label: 'W', kind: 'writer', status: 'idle', color: WRITER_COLOR },
      ],
      output: [],
      note: '⚡ 3 goroutines reading SIMULTANEOUSLY — no blocking between readers!',
    },
  },
  {
    description: 'The Writer goroutine calls mu.Lock() for exclusive write access. But 3 readers currently hold RLocks! The writer BLOCKS — it must wait for ALL readers to call RUnlock.',
    highlightLines: [22, 23],
    state: {
      lockState: 'read-locked',
      activeReaders: 3,
      dataValue: 0,
      goroutines: [
        { id: 1, label: 'R1', kind: 'reader', status: 'reading', color: READER_COLORS[0] },
        { id: 2, label: 'R2', kind: 'reader', status: 'reading', color: READER_COLORS[1] },
        { id: 3, label: 'R3', kind: 'reader', status: 'reading', color: READER_COLORS[2] },
        { id: 4, label: 'W', kind: 'writer', status: 'waiting-lock', color: WRITER_COLOR },
      ],
      output: [],
      note: '⏸ Writer blocked: mu.Lock() waits for activeReaders to reach 0',
    },
  },
  {
    description: 'R1 finishes and calls mu.RUnlock(). Active readers: 3 → 2. Once a writer is waiting, NEW RLock() calls also queue up — preventing writer starvation.',
    highlightLines: [16, 17, 18],
    state: {
      lockState: 'read-locked',
      activeReaders: 2,
      dataValue: 0,
      goroutines: [
        { id: 1, label: 'R1', kind: 'reader', status: 'done', color: READER_COLORS[0], valueRead: 0 },
        { id: 2, label: 'R2', kind: 'reader', status: 'reading', color: READER_COLORS[1] },
        { id: 3, label: 'R3', kind: 'reader', status: 'reading', color: READER_COLORS[2] },
        { id: 4, label: 'W', kind: 'writer', status: 'waiting-lock', color: WRITER_COLOR },
      ],
      output: ['R1 reads: 0'],
      note: 'R1 released RLock. Writer still waits: activeReaders = 2',
    },
  },
  {
    description: 'R2 and R3 finish reading and call RUnlock(). Active readers: 2 → 1 → 0. When activeReaders hits 0, the Writer is UNBLOCKED!',
    highlightLines: [16, 17, 18],
    state: {
      lockState: 'unlocked',
      activeReaders: 0,
      dataValue: 0,
      goroutines: [
        { id: 1, label: 'R1', kind: 'reader', status: 'done', color: READER_COLORS[0], valueRead: 0 },
        { id: 2, label: 'R2', kind: 'reader', status: 'done', color: READER_COLORS[1], valueRead: 0 },
        { id: 3, label: 'R3', kind: 'reader', status: 'done', color: READER_COLORS[2], valueRead: 0 },
        { id: 4, label: 'W', kind: 'writer', status: 'waiting-lock', color: WRITER_COLOR },
      ],
      output: ['R1 reads: 0', 'R2 reads: 0', 'R3 reads: 0'],
      note: 'activeReaders = 0 → Writer can now acquire exclusive lock!',
    },
  },
  {
    description: 'Writer acquires the exclusive Lock! No readers, no other writers. It modifies data = 42 safely. During this time, any new RLock() or Lock() call BLOCKS.',
    highlightLines: [22, 23, 24, 25, 26],
    state: {
      lockState: 'write-locked',
      activeReaders: 0,
      dataValue: 42,
      goroutines: [
        { id: 1, label: 'R1', kind: 'reader', status: 'done', color: READER_COLORS[0], valueRead: 0 },
        { id: 2, label: 'R2', kind: 'reader', status: 'done', color: READER_COLORS[1], valueRead: 0 },
        { id: 3, label: 'R3', kind: 'reader', status: 'done', color: READER_COLORS[2], valueRead: 0 },
        { id: 4, label: 'W', kind: 'writer', status: 'writing', color: WRITER_COLOR },
      ],
      output: ['R1 reads: 0', 'R2 reads: 0', 'R3 reads: 0', 'Writer sets data = 42'],
      note: '🔒 Exclusive write lock: NO concurrent readers or writers allowed',
    },
  },
  {
    description: 'Writer calls Unlock(). The RWMutex returns to unlocked state. If new readers were queued, they can all acquire RLock simultaneously again.',
    highlightLines: [23, 24],
    state: {
      lockState: 'unlocked',
      activeReaders: 0,
      dataValue: 42,
      goroutines: [
        { id: 1, label: 'R1', kind: 'reader', status: 'done', color: READER_COLORS[0], valueRead: 0 },
        { id: 2, label: 'R2', kind: 'reader', status: 'done', color: READER_COLORS[1], valueRead: 0 },
        { id: 3, label: 'R3', kind: 'reader', status: 'done', color: READER_COLORS[2], valueRead: 0 },
        { id: 4, label: 'W', kind: 'writer', status: 'done', color: WRITER_COLOR },
      ],
      output: ['R1 reads: 0', 'R2 reads: 0', 'R3 reads: 0', 'Writer sets data = 42'],
      note: '✅ All done. data = 42. RWMutex ideal when reads vastly outnumber writes.',
    },
  },
];

const gStatusLabel: Record<GStatus, string> = {
  idle: 'idle',
  'waiting-rlock': '⏸ waiting RLock',
  reading: '📖 reading',
  'waiting-lock': '⏸ waiting Lock',
  writing: '✏️ writing',
  done: '✓ done',
};

const gStatusColor: Record<GStatus, (g: Goroutine) => string> = {
  idle: () => '#8b949e',
  'waiting-rlock': () => '#ffa657',
  reading: (g) => g.color,
  'waiting-lock': () => '#f85149',
  writing: () => '#f85149',
  done: () => '#3fb950',
};

export function RWMutex() {
  return (
    <VisualizationLayout
      title="sync.RWMutex"
      description="Concurrent reads with shared RLock vs exclusive writes with Lock — maximise read throughput"
      tag="Concurrency"
      tagColor="bg-[#00ACD7]"
      steps={steps}
      codeLines={codeLines}
      renderVisual={(state: RWMutexState) => (
        <div className="w-full max-w-xl space-y-4">

          {/* RWMutex lock state */}
          <div
            className="rounded-xl border-2 p-4 transition-all duration-400"
            style={{
              borderColor: state.lockState === 'write-locked' ? '#f85149' : state.lockState === 'read-locked' ? '#00ACD7' : '#3fb950',
              backgroundColor:
                state.lockState === 'write-locked' ? 'rgba(248,81,73,0.08)' :
                  state.lockState === 'read-locked' ? 'rgba(0,172,215,0.07)' : 'rgba(63,185,80,0.05)',
              boxShadow:
                state.lockState === 'write-locked' ? '0 0 20px rgba(248,81,73,0.2)' :
                  state.lockState === 'read-locked' ? '0 0 20px rgba(0,172,215,0.15)' : 'none',
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <p className="font-mono text-sm text-[#e6edf3]">sync.RWMutex</p>
              <div
                className="flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono"
                style={{
                  backgroundColor:
                    state.lockState === 'write-locked' ? 'rgba(248,81,73,0.2)' :
                      state.lockState === 'read-locked' ? 'rgba(0,172,215,0.2)' : 'rgba(63,185,80,0.2)',
                  color:
                    state.lockState === 'write-locked' ? '#f85149' :
                      state.lockState === 'read-locked' ? '#00ACD7' : '#3fb950',
                }}
              >
                <span className="text-base">
                  {state.lockState === 'write-locked' ? '🔒' : state.lockState === 'read-locked' ? '📖' : '🔓'}
                </span>
                {state.lockState === 'write-locked' ? 'WRITE LOCKED (exclusive)' :
                  state.lockState === 'read-locked' ? `READ LOCKED (${state.activeReaders} reader${state.activeReaders !== 1 ? 's' : ''})` :
                    'UNLOCKED'}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#0d1117] border border-[#30363d] rounded-lg p-3 text-center">
                <p className="text-[#8b949e] text-xs mb-1">Active Readers</p>
                <p className="font-mono text-3xl" style={{ color: '#00ACD7' }}>{state.activeReaders}</p>
                <p className="text-[10px] text-[#8b949e]">concurrent reads OK</p>
              </div>
              <div
                className="border rounded-lg p-3 text-center transition-all duration-300"
                style={{
                  backgroundColor: state.lockState === 'write-locked' ? 'rgba(248,81,73,0.1)' : '#0d1117',
                  borderColor: state.lockState === 'write-locked' ? '#f85149' : '#30363d',
                }}
              >
                <p className="text-[#8b949e] text-xs mb-1">data</p>
                <p
                  className="font-mono text-3xl transition-all duration-300"
                  style={{ color: state.lockState === 'write-locked' ? '#f85149' : '#ffa657' }}
                >
                  {state.dataValue}
                </p>
                <p className="text-[10px] text-[#8b949e]">shared value</p>
              </div>
            </div>
          </div>

          {/* Read vs Write visual comparison */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-[#161b22] border border-[#00ACD7]/40 rounded-lg p-3">
              <p className="text-[#00ACD7] mb-1.5">mu.RLock() / RUnlock()</p>
              <p className="text-[#8b949e]">✓ Multiple goroutines can hold simultaneously</p>
              <p className="text-[#8b949e]">✓ Blocks only if a write lock is held</p>
              <p className="text-[#8b949e]">✓ Use for read-only operations</p>
            </div>
            <div className="bg-[#161b22] border border-[#f85149]/40 rounded-lg p-3">
              <p className="text-[#f85149] mb-1.5">mu.Lock() / Unlock()</p>
              <p className="text-[#8b949e]">✗ Only ONE goroutine at a time</p>
              <p className="text-[#8b949e]">✗ Blocks if ANY reads or writes active</p>
              <p className="text-[#8b949e]">✓ Required for mutations</p>
            </div>
          </div>

          {/* Goroutines */}
          <div>
            <p className="text-[#8b949e] text-xs uppercase tracking-wide mb-2">Goroutines</p>
            <div className="space-y-2">
              {state.goroutines.map(g => {
                const col = gStatusColor[g.status](g);
                return (
                  <div
                    key={g.id}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-all duration-300"
                    style={{
                      borderColor: col,
                      backgroundColor: `${col}0d`,
                      boxShadow: (g.status === 'reading' || g.status === 'writing') ? `0 0 8px ${col}30` : 'none',
                    }}
                  >
                    {/* Avatar */}
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-xs flex-shrink-0"
                      style={{
                        backgroundColor: g.status === 'done' ? '#3fb950' : g.color,
                        color: '#0d1117',
                      }}
                    >
                      {g.label}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-xs text-[#e6edf3]">
                          {g.kind === 'reader' ? 'mu.RLock() → read(data)' : 'mu.Lock() → write(42)'}
                        </span>
                        <span
                          className="text-[10px] px-2 py-0.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: `${col}20`, color: col }}
                        >
                          {gStatusLabel[g.status]}
                        </span>
                      </div>
                      {g.valueRead !== undefined && g.status === 'done' && (
                        <p className="text-[10px] text-[#8b949e] font-mono mt-0.5">read value = {g.valueRead}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Output */}
          {state.output.length > 0 && (
            <div className="bg-[#0d1117] border border-[#30363d] rounded-lg p-3 max-h-32 overflow-auto">
              <p className="text-[#8b949e] text-xs uppercase tracking-wide mb-2">Output</p>
              {state.output.map((line, i) => (
                <p key={i} className="font-mono text-xs" style={{ color: line.includes('Writer') ? '#f85149' : '#3fb950' }}>
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
                backgroundColor: state.note.startsWith('✅') ? 'rgba(63,185,80,0.08)' : state.note.startsWith('⚡') ? 'rgba(0,172,215,0.08)' : state.note.includes('🔒') ? 'rgba(248,81,73,0.08)' : 'rgba(255,166,87,0.08)',
                borderColor: state.note.startsWith('✅') ? 'rgba(63,185,80,0.4)' : state.note.startsWith('⚡') ? 'rgba(0,172,215,0.4)' : state.note.includes('🔒') ? 'rgba(248,81,73,0.4)' : 'rgba(255,166,87,0.4)',
              }}
            >
              <p className="text-xs" style={{
                color: state.note.startsWith('✅') ? '#3fb950' : state.note.startsWith('⚡') ? '#00ACD7' : state.note.includes('🔒') ? '#f85149' : '#ffa657',
              }}>
                {state.note}
              </p>
            </div>
          )}

          {/* When to use */}
          <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3">
            <p className="text-[#8b949e] text-xs uppercase tracking-wide mb-2">Mutex vs RWMutex</p>
            <div className="space-y-1 text-xs">
              <div className="flex items-start gap-2">
                <span className="text-[#ffa657] flex-shrink-0">Mutex</span>
                <span className="text-[#8b949e]">Use when reads and writes are equally frequent, or data is always mutated.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-[#00ACD7] flex-shrink-0">RWMutex</span>
                <span className="text-[#8b949e]">Use when reads vastly outnumber writes (e.g. caches, config, registries). Improves throughput dramatically.</span>
              </div>
            </div>
          </div>
        </div>
      )}
    />
  );
}
