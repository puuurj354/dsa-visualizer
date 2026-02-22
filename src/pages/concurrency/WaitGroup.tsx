import { VisualizationLayout, type Step } from '../../components/VisualizationLayout';

interface Worker { id: number; status: 'pending' | 'running' | 'done'; color: string }
interface WGState {
  counter: number;
  workers: Worker[];
  mainBlocked: boolean;
  mainDone: boolean;
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
  'func worker(id int, wg *sync.WaitGroup) {',
  '    defer wg.Done()  // decrement when done',
  '    fmt.Printf("Worker %d running\\n", id)',
  '}',
  '',
  'func main() {',
  '    var wg sync.WaitGroup',
  '',
  '    for i := 1; i <= 4; i++ {',
  '        wg.Add(1)      // increment counter',
  '        go worker(i, &wg)',
  '    }',
  '',
  '    wg.Wait()  // blocks until counter == 0',
  '    fmt.Println("All workers done!")',
  '}',
];

const workerColors = ['#00ACD7', '#3fb950', '#ffa657', '#d2a8ff'];

const steps: Step<WGState>[] = [
  { description: 'var wg sync.WaitGroup — declare a WaitGroup. Counter starts at 0.', highlightLines: [14], state: { counter: 0, workers: [], mainBlocked: false, mainDone: false, output: [] } },
  { description: 'Loop i=1: wg.Add(1) — increment counter to 1. Then launch goroutine for worker 1.', highlightLines: [16, 17, 18], state: { counter: 1, workers: [{ id: 1, status: 'running', color: workerColors[0] }], mainBlocked: false, mainDone: false, output: ['Worker 1 running'] } },
  { description: 'i=2: wg.Add(1) → counter=2. Launch worker 2.', highlightLines: [17, 18], state: { counter: 2, workers: [{ id: 1, status: 'running', color: workerColors[0] }, { id: 2, status: 'running', color: workerColors[1] }], mainBlocked: false, mainDone: false, output: ['Worker 1 running', 'Worker 2 running'] } },
  { description: 'i=3: wg.Add(1) → counter=3. Launch worker 3.', highlightLines: [17, 18], state: { counter: 3, workers: [{ id: 1, status: 'running', color: workerColors[0] }, { id: 2, status: 'running', color: workerColors[1] }, { id: 3, status: 'running', color: workerColors[2] }], mainBlocked: false, mainDone: false, output: ['Worker 1 running', 'Worker 2 running', 'Worker 3 running'] } },
  { description: 'i=4: wg.Add(1) → counter=4. All 4 workers launched.', highlightLines: [17, 18], state: { counter: 4, workers: workerColors.map((c, i) => ({ id: i + 1, status: 'running' as const, color: c })), mainBlocked: false, mainDone: false, output: ['Worker 1 running', 'Worker 2 running', 'Worker 3 running', 'Worker 4 running'] } },
  { description: 'wg.Wait() — main goroutine BLOCKS here. It waits until counter reaches 0. All 4 workers are running concurrently.', highlightLines: [21], state: { counter: 4, workers: workerColors.map((c, i) => ({ id: i + 1, status: 'running' as const, color: c })), mainBlocked: true, mainDone: false, output: ['Worker 1 running', 'Worker 2 running', 'Worker 3 running', 'Worker 4 running'] } },
  { description: 'Worker 1 finishes. `defer wg.Done()` runs → counter decrements: 4→3.', highlightLines: [9], state: { counter: 3, workers: [{ id: 1, status: 'done', color: workerColors[0] }, { id: 2, status: 'running', color: workerColors[1] }, { id: 3, status: 'running', color: workerColors[2] }, { id: 4, status: 'running', color: workerColors[3] }], mainBlocked: true, mainDone: false, output: ['Worker 1 running', 'Worker 2 running', 'Worker 3 running', 'Worker 4 running'] } },
  { description: 'Worker 2 finishes. wg.Done() → counter: 3→2.', highlightLines: [9], state: { counter: 2, workers: [{ id: 1, status: 'done', color: workerColors[0] }, { id: 2, status: 'done', color: workerColors[1] }, { id: 3, status: 'running', color: workerColors[2] }, { id: 4, status: 'running', color: workerColors[3] }], mainBlocked: true, mainDone: false, output: ['Worker 1 running', 'Worker 2 running', 'Worker 3 running', 'Worker 4 running'] } },
  { description: 'Worker 3 finishes. wg.Done() → counter: 2→1.', highlightLines: [9], state: { counter: 1, workers: [{ id: 1, status: 'done', color: workerColors[0] }, { id: 2, status: 'done', color: workerColors[1] }, { id: 3, status: 'done', color: workerColors[2] }, { id: 4, status: 'running', color: workerColors[3] }], mainBlocked: true, mainDone: false, output: ['Worker 1 running', 'Worker 2 running', 'Worker 3 running', 'Worker 4 running'] } },
  { description: 'Worker 4 finishes. wg.Done() → counter: 1→0. Counter reached 0!', highlightLines: [9], state: { counter: 0, workers: workerColors.map((c, i) => ({ id: i + 1, status: 'done' as const, color: c })), mainBlocked: true, mainDone: false, output: ['Worker 1 running', 'Worker 2 running', 'Worker 3 running', 'Worker 4 running'] } },
  { description: 'Counter == 0 → wg.Wait() UNBLOCKS main goroutine! Print "All workers done!"', highlightLines: [21, 22], state: { counter: 0, workers: workerColors.map((c, i) => ({ id: i + 1, status: 'done' as const, color: c })), mainBlocked: false, mainDone: true, output: ['Worker 1 running', 'Worker 2 running', 'Worker 3 running', 'Worker 4 running', 'All workers done!'] } },
];

export function WaitGroup() {
  return (
    <VisualizationLayout
      title="WaitGroup"
      description="sync.WaitGroup — wait for a collection of goroutines to finish"
      tag="Concurrency"
      tagColor="bg-[#00ACD7]"
      steps={steps}
      codeLines={codeLines}
      renderVisual={(state: WGState) => (
        <div className="w-full max-w-xl space-y-5">
          {/* WaitGroup counter */}
          <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-[#8b949e] text-xs uppercase tracking-wide">sync.WaitGroup</p>
                <p className="text-[#e6edf3] text-sm mt-0.5">internal counter</p>
              </div>
              <div
                className="w-20 h-20 rounded-full border-4 flex items-center justify-center transition-all duration-500"
                style={{
                  borderColor: state.counter === 0 ? '#3fb950' : '#00ACD7',
                  backgroundColor: state.counter === 0 ? 'rgba(63,185,80,0.1)' : 'rgba(0,172,215,0.1)',
                  boxShadow: state.counter === 0 ? '0 0 20px rgba(63,185,80,0.3)' : '0 0 20px rgba(0,172,215,0.2)',
                }}
              >
                <span
                  className="font-mono text-3xl transition-all duration-300"
                  style={{ color: state.counter === 0 ? '#3fb950' : '#00ACD7' }}
                >
                  {state.counter}
                </span>
              </div>
            </div>

            {/* Counter diagram */}
            <div className="flex gap-1 mb-3">
              {Array.from({ length: 4 }, (_, i) => (
                <div
                  key={i}
                  className="flex-1 h-3 rounded-full transition-all duration-500"
                  style={{ backgroundColor: i < state.counter ? '#00ACD7' : '#30363d' }}
                />
              ))}
            </div>

            {/* Methods */}
            <div className="grid grid-cols-3 gap-2 text-xs font-mono text-center">
              {[
                { method: 'wg.Add(n)', desc: 'counter += n', color: '#3fb950' },
                { method: 'wg.Done()', desc: 'counter -= 1', color: '#f85149' },
                { method: 'wg.Wait()', desc: 'block until 0', color: '#ffa657' },
              ].map(m => (
                <div key={m.method} className="bg-[#0d1117] rounded-lg p-2" style={{ borderTop: `2px solid ${m.color}` }}>
                  <p style={{ color: m.color }}>{m.method}</p>
                  <p className="text-[#8b949e] mt-0.5">{m.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Workers */}
          <div>
            <p className="text-[#8b949e] text-xs uppercase tracking-wide mb-2">Goroutines</p>
            <div className="grid grid-cols-2 gap-2">
              {state.workers.map(w => (
                <div
                  key={w.id}
                  className="flex items-center gap-3 p-3 rounded-lg border-2 transition-all duration-300"
                  style={{
                    borderColor: w.status === 'done' ? '#3fb950' : w.status === 'running' ? w.color : '#30363d',
                    backgroundColor: w.status === 'done' ? 'rgba(63,185,80,0.08)' : `${w.color}08`,
                  }}
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{ backgroundColor: w.status === 'done' ? '#3fb950' : w.color, color: '#0d1117' }}
                  >
                    {w.status === 'done' ? '✓' : `G${w.id}`}
                  </div>
                  <div>
                    <p className="text-[#e6edf3] text-sm font-mono">worker({w.id})</p>
                    <p className="text-xs" style={{ color: w.status === 'done' ? '#3fb950' : w.color }}>
                      {w.status === 'done' ? 'wg.Done() called' : 'running...'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Main status */}
          <div
            className="p-4 rounded-xl border-2 transition-all duration-300"
            style={{
              borderColor: state.mainDone ? '#3fb950' : state.mainBlocked ? '#ffa657' : '#30363d',
              backgroundColor: state.mainDone ? 'rgba(63,185,80,0.08)' : state.mainBlocked ? 'rgba(255,166,87,0.05)' : 'transparent',
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center font-bold"
                style={{ backgroundColor: '#d2a8ff', color: '#0d1117' }}
              >
                M
              </div>
              <div>
                <p className="text-[#e6edf3] font-mono">main()</p>
                <p className="text-xs" style={{ color: state.mainDone ? '#3fb950' : state.mainBlocked ? '#ffa657' : '#8b949e' }}>
                  {state.mainDone ? '✓ All done! Continues...' : state.mainBlocked ? '⏸ wg.Wait() — BLOCKED' : 'Running'}
                </p>
              </div>
            </div>
          </div>

          {/* Output */}
          {state.output.length > 0 && (
            <div className="bg-[#0d1117] border border-[#30363d] rounded-lg p-3 max-h-28 overflow-auto">
              <p className="text-[#8b949e] text-xs uppercase tracking-wide mb-2">Output</p>
              {state.output.map((line, i) => (
                <p key={i} className={`font-mono text-xs ${line.includes('All workers') ? 'text-[#3fb950] font-bold' : 'text-[#3fb950]'}`}>{line}</p>
              ))}
            </div>
          )}
        </div>
      )}
    />
  );
}
