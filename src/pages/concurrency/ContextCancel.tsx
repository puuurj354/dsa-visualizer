import { VisualizationLayout, type Step } from '../../components/VisualizationLayout';

interface CtxNode {
  id: string;
  label: string;
  type: 'background' | 'cancel' | 'timeout' | 'worker';
  status: 'active' | 'cancelled' | 'done' | 'timed-out';
  parentId?: string;
  detail?: string;
  color: string;
}

interface WorkerGoroutine {
  id: number;
  label: string;
  status: 'working' | 'checking' | 'cancelled' | 'done';
  color: string;
  iteration: number;
  stopped?: string;
}

interface ContextState {
  phase: 'setup' | 'working' | 'cancelled' | 'timeout-demo';
  contexts: CtxNode[];
  workers: WorkerGoroutine[];
  cancelCalled: boolean;
  doneSignal: boolean;
  doneChanState: 'open' | 'closed';
  output: string[];
  note?: string;
  deadline?: string;
}

const codeLines = [
  'package main',
  '',
  'import (',
  '    "context"',
  '    "fmt"',
  '    "time"',
  ')',
  '',
  'func worker(ctx context.Context, id int) {',
  '    for {',
  '        select {',
  '        case <-ctx.Done():',
  '            // Context cancelled or timed out',
  '            fmt.Printf("W%d stopped: %v\\n", id, ctx.Err())',
  '            return',
  '        default:',
  '            fmt.Printf("W%d working...\\n", id)',
  '            time.Sleep(200 * time.Millisecond)',
  '        }',
  '    }',
  '}',
  '',
  'func main() {',
  '    // WithCancel: manual cancellation',
  '    ctx, cancel := context.WithCancel(',
  '        context.Background(),',
  '    )',
  '    defer cancel() // always call cancel!',
  '',
  '    go worker(ctx, 1)',
  '    go worker(ctx, 2)',
  '    go worker(ctx, 3)',
  '',
  '    time.Sleep(600 * time.Millisecond)',
  '',
  '    cancel() // signal all workers to stop',
  '    fmt.Println("cancelled")',
  '',
  '    // WithTimeout: auto-cancels after duration',
  '    ctx2, cancel2 := context.WithTimeout(',
  '        context.Background(),',
  '        2*time.Second,',
  '    )',
  '    defer cancel2()',
  '}',
];

const WCOLORS = ['#00ACD7', '#3fb950', '#ffa657'];

const steps: Step<ContextState>[] = [
  {
    description: '`context.Background()` is the root context — always non-nil, never cancelled, has no values or deadline. It is the starting point for all context trees.',
    highlightLines: [25, 26],
    state: {
      phase: 'setup',
      contexts: [
        { id: 'bg', label: 'context.Background()', type: 'background', status: 'active', color: '#8b949e', detail: 'root — never cancelled' },
      ],
      workers: [],
      cancelCalled: false,
      doneSignal: false,
      doneChanState: 'open',
      output: [],
    },
  },
  {
    description: '`context.WithCancel(parent)` creates a CHILD context and a `cancel` function. The child inherits the parent\'s deadline/values. Calling `cancel()` closes `ctx.Done()`.',
    highlightLines: [24, 25, 26, 27],
    state: {
      phase: 'setup',
      contexts: [
        { id: 'bg', label: 'context.Background()', type: 'background', status: 'active', color: '#8b949e', detail: 'root' },
        { id: 'ctx', label: 'ctx (WithCancel)', type: 'cancel', status: 'active', parentId: 'bg', color: '#00ACD7', detail: 'cancel() not called yet' },
      ],
      workers: [],
      cancelCalled: false,
      doneSignal: false,
      doneChanState: 'open',
      output: [],
      note: 'ctx.Done() is a channel — open (blocking) until cancel() is called',
    },
  },
  {
    description: '3 worker goroutines are launched, each receiving the same `ctx`. They run a `select` loop: check `ctx.Done()` on every iteration. If not cancelled, do work.',
    highlightLines: [29, 30, 31],
    state: {
      phase: 'working',
      contexts: [
        { id: 'bg', label: 'context.Background()', type: 'background', status: 'active', color: '#8b949e', detail: 'root' },
        { id: 'ctx', label: 'ctx (WithCancel)', type: 'cancel', status: 'active', parentId: 'bg', color: '#00ACD7', detail: 'active — workers listening' },
      ],
      workers: WCOLORS.map((c, i) => ({ id: i + 1, label: `W${i + 1}`, status: 'working', color: c, iteration: 1 })),
      cancelCalled: false,
      doneSignal: false,
      doneChanState: 'open',
      output: ['W1 working...', 'W2 working...', 'W3 working...'],
    },
  },
  {
    description: 'Workers keep iterating. Each `select` hits the `default` branch because `ctx.Done()` is still open (blocking). Workers are happily doing their job.',
    highlightLines: [10, 11, 16, 17, 18],
    state: {
      phase: 'working',
      contexts: [
        { id: 'bg', label: 'context.Background()', type: 'background', status: 'active', color: '#8b949e', detail: 'root' },
        { id: 'ctx', label: 'ctx (WithCancel)', type: 'cancel', status: 'active', parentId: 'bg', color: '#00ACD7', detail: 'ctx.Done() → channel open' },
      ],
      workers: WCOLORS.map((c, i) => ({ id: i + 1, label: `W${i + 1}`, status: 'checking', color: c, iteration: 2 })),
      cancelCalled: false,
      doneSignal: false,
      doneChanState: 'open',
      output: ['W1 working...', 'W2 working...', 'W3 working...', 'W1 working...', 'W2 working...', 'W3 working...'],
      note: 'default branch fires — ctx.Done() channel is still open',
    },
  },
  {
    description: '`cancel()` is called! This CLOSES the `ctx.Done()` channel. A closed channel is immediately readable — all goroutines blocked on `<-ctx.Done()` wake up at once.',
    highlightLines: [34, 35],
    state: {
      phase: 'cancelled',
      contexts: [
        { id: 'bg', label: 'context.Background()', type: 'background', status: 'active', color: '#8b949e', detail: 'root' },
        { id: 'ctx', label: 'ctx (WithCancel)', type: 'cancel', status: 'cancelled', parentId: 'bg', color: '#f85149', detail: '🚫 CANCELLED — Done() closed' },
      ],
      workers: WCOLORS.map((c, i) => ({ id: i + 1, label: `W${i + 1}`, status: 'checking', color: c, iteration: 3 })),
      cancelCalled: true,
      doneSignal: true,
      doneChanState: 'closed',
      output: ['W1 working...', 'W2 working...', 'W3 working...', 'W1 working...', 'W2 working...', 'W3 working...', '--- cancel() called ---'],
      note: '💥 cancel() closes ctx.Done() channel — broadcast to ALL listeners simultaneously',
    },
  },
  {
    description: 'Each worker\'s `select` now takes the `case <-ctx.Done()` branch. `ctx.Err()` returns `context.Canceled`. All 3 workers stop gracefully.',
    highlightLines: [11, 12, 13, 14, 15],
    state: {
      phase: 'cancelled',
      contexts: [
        { id: 'bg', label: 'context.Background()', type: 'background', status: 'active', color: '#8b949e', detail: 'root' },
        { id: 'ctx', label: 'ctx (WithCancel)', type: 'cancel', status: 'cancelled', parentId: 'bg', color: '#f85149', detail: '🚫 CANCELLED' },
      ],
      workers: WCOLORS.map((c, i) => ({
        id: i + 1, label: `W${i + 1}`, status: 'cancelled', color: c, iteration: 3,
        stopped: 'context canceled',
      })),
      cancelCalled: true,
      doneSignal: true,
      doneChanState: 'closed',
      output: [
        'W1 working...', 'W2 working...', 'W3 working...', 'W1 working...', 'W2 working...', 'W3 working...',
        '--- cancel() called ---',
        'W1 stopped: context canceled',
        'W2 stopped: context canceled',
        'W3 stopped: context canceled',
      ],
      note: '✅ ctx.Err() = context.Canceled. Workers exited cleanly.',
    },
  },
  {
    description: '`context.WithTimeout(parent, 2s)` creates a context that auto-cancels after 2 seconds. No need to call cancel manually — the timer fires automatically. Great for HTTP requests, DB queries.',
    highlightLines: [38, 39, 40, 41, 42],
    state: {
      phase: 'timeout-demo',
      contexts: [
        { id: 'bg2', label: 'context.Background()', type: 'background', status: 'active', color: '#8b949e', detail: 'root' },
        {
          id: 'ctx2', label: 'ctx2 (WithTimeout 2s)', type: 'timeout', status: 'active',
          parentId: 'bg2', color: '#d2a8ff', detail: 'auto-cancels in 2s',
        },
      ],
      workers: [
        { id: 1, label: 'W1', status: 'working', color: '#d2a8ff', iteration: 1 },
      ],
      cancelCalled: false,
      doneSignal: false,
      doneChanState: 'open',
      deadline: '2s remaining',
      output: [],
      note: 'ctx.Err() = nil while active. ctx.Deadline() returns the expiry time.',
    },
  },
  {
    description: 'Timeout expires! The context is auto-cancelled. `ctx.Err()` now returns `context.DeadlineExceeded`. Workers stop just like with manual cancel.',
    highlightLines: [12, 13, 14],
    state: {
      phase: 'timeout-demo',
      contexts: [
        { id: 'bg2', label: 'context.Background()', type: 'background', status: 'active', color: '#8b949e', detail: 'root' },
        {
          id: 'ctx2', label: 'ctx2 (WithTimeout 2s)', type: 'timeout', status: 'timed-out',
          parentId: 'bg2', color: '#f85149', detail: '⏰ DEADLINE EXCEEDED',
        },
      ],
      workers: [
        { id: 1, label: 'W1', status: 'cancelled', color: '#d2a8ff', iteration: 5, stopped: 'context deadline exceeded' },
      ],
      cancelCalled: true,
      doneSignal: true,
      doneChanState: 'closed',
      deadline: 'expired',
      output: ['W1 stopped: context deadline exceeded'],
      note: '⏰ ctx.Err() = context.DeadlineExceeded — timeout fired automatically',
    },
  },
];

// ─── Context Tree visual ──────────────────────────────────────────────────────

function CtxTreeNode({ node }: { node: CtxNode }) {
  const statusColor = {
    active: node.color,
    cancelled: '#f85149',
    done: '#3fb950',
    'timed-out': '#f85149',
  }[node.status];

  return (
    <div
      className="rounded-xl border-2 px-4 py-3 transition-all duration-400 w-full"
      style={{
        borderColor: statusColor,
        backgroundColor: `${statusColor}10`,
        boxShadow: node.status === 'active' ? `0 0 12px ${statusColor}30` : 'none',
      }}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="font-mono text-xs" style={{ color: statusColor }}>{node.label}</span>
        <span
          className="text-[10px] px-2 py-0.5 rounded-full flex-shrink-0"
          style={{ backgroundColor: `${statusColor}25`, color: statusColor }}
        >
          {node.status}
        </span>
      </div>
      {node.detail && (
        <p className="text-[10px] text-[#8b949e] mt-1 font-mono">{node.detail}</p>
      )}
    </div>
  );
}

export function ContextCancel() {
  return (
    <VisualizationLayout
      title="Context Cancellation"
      description="context.WithCancel, WithTimeout — propagate cancellation signals across goroutines"
      tag="Concurrency"
      tagColor="bg-[#00ACD7]"
      steps={steps}
      codeLines={codeLines}
      renderVisual={(state: ContextState) => (
        <div className="w-full max-w-2xl space-y-4">

          {/* Context tree */}
          <div>
            <p className="text-[#8b949e] text-xs uppercase tracking-wide mb-2">Context Tree</p>
            <div className="space-y-2">
              {state.contexts.map((node, i) => (
                <div key={node.id} className={i > 0 ? 'ml-8 relative' : ''}>
                  {i > 0 && (
                    <div className="absolute -left-4 top-0 h-full flex flex-col items-center">
                      <div className="w-px flex-1 bg-[#30363d]" />
                      <div className="text-[#30363d] text-xs">└</div>
                    </div>
                  )}
                  <CtxTreeNode node={node} />
                </div>
              ))}
            </div>
          </div>

          {/* ctx.Done() channel state */}
          <div className="grid grid-cols-2 gap-3">
            <div
              className="rounded-lg border-2 p-3 text-center transition-all duration-400"
              style={{
                borderColor: state.doneChanState === 'closed' ? '#f85149' : '#3fb950',
                backgroundColor: state.doneChanState === 'closed' ? 'rgba(248,81,73,0.1)' : 'rgba(63,185,80,0.06)',
              }}
            >
              <p className="text-[#8b949e] text-xs mb-1">ctx.Done() channel</p>
              <p
                className="font-mono text-sm"
                style={{ color: state.doneChanState === 'closed' ? '#f85149' : '#3fb950' }}
              >
                {state.doneChanState === 'closed' ? '🔴 CLOSED' : '🟢 open'}
              </p>
              <p className="text-[#8b949e] text-[10px] mt-1">
                {state.doneChanState === 'closed' ? 'readable — all listeners wake up' : 'blocking — default branch fires'}
              </p>
            </div>

            <div className="rounded-lg border border-[#30363d] p-3 text-center bg-[#161b22]">
              <p className="text-[#8b949e] text-xs mb-1">ctx.Err()</p>
              <p className="font-mono text-xs"
                style={{
                  color: state.cancelCalled ? (state.phase === 'timeout-demo' && state.doneSignal ? '#ffa657' : '#f85149') : '#3fb950',
                }}>
                {state.cancelCalled
                  ? (state.phase === 'timeout-demo' && state.doneSignal ? 'DeadlineExceeded' : 'context.Canceled')
                  : 'nil'
                }
              </p>
              {state.deadline && (
                <p className="text-[#8b949e] text-[10px] mt-1">deadline: {state.deadline}</p>
              )}
            </div>
          </div>

          {/* Workers */}
          {state.workers.length > 0 && (
            <div>
              <p className="text-[#8b949e] text-xs uppercase tracking-wide mb-2">Worker Goroutines</p>
              <div className="space-y-2">
                {state.workers.map(w => {
                  const sColors: Record<string, string> = {
                    working: w.color,
                    checking: '#ffa657',
                    cancelled: '#f85149',
                    done: '#3fb950',
                  };
                  const col = sColors[w.status];

                  return (
                    <div
                      key={w.id}
                      className="rounded-lg border transition-all duration-300 p-3"
                      style={{
                        borderColor: col,
                        backgroundColor: `${col}0d`,
                        boxShadow: w.status === 'working' ? `0 0 8px ${col}25` : 'none',
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-9 h-9 rounded-full flex items-center justify-center text-xs flex-shrink-0"
                          style={{ backgroundColor: w.status === 'cancelled' ? '#f85149' : col, color: '#0d1117' }}
                        >
                          {w.label}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-mono text-xs text-[#e6edf3]">
                              {w.status === 'working' && `working... (iter ${w.iteration})`}
                              {w.status === 'checking' && 'select { case <-ctx.Done(): ...default }'}
                              {w.status === 'cancelled' && 'case <-ctx.Done() ← matched!'}
                              {w.status === 'done' && 'returned'}
                            </span>
                            <span
                              className="text-[10px] px-2 py-0.5 rounded-full flex-shrink-0 ml-2"
                              style={{ backgroundColor: `${col}25`, color: col }}
                            >
                              {w.status}
                            </span>
                          </div>
                          {w.stopped && (
                            <p className="text-xs font-mono" style={{ color: '#f85149' }}>
                              ctx.Err() = {w.stopped}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
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
                  style={{
                    color: line.includes('---') ? '#ffa657' : line.includes('stopped') ? '#f85149' : '#3fb950',
                  }}
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
                backgroundColor: state.note.includes('✅') ? 'rgba(63,185,80,0.08)' : state.note.includes('💥') ? 'rgba(248,81,73,0.08)' : state.note.includes('⏰') ? 'rgba(255,166,87,0.08)' : 'rgba(0,172,215,0.08)',
                borderColor: state.note.includes('✅') ? 'rgba(63,185,80,0.4)' : state.note.includes('💥') ? 'rgba(248,81,73,0.4)' : state.note.includes('⏰') ? 'rgba(255,166,87,0.4)' : 'rgba(0,172,215,0.4)',
              }}
            >
              <p
                className="text-xs"
                style={{ color: state.note.includes('✅') ? '#3fb950' : state.note.includes('💥') ? '#f85149' : state.note.includes('⏰') ? '#ffa657' : '#00ACD7' }}
              >
                {state.note}
              </p>
            </div>
          )}

          {/* Context API cheat sheet */}
          <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3">
            <p className="text-[#8b949e] text-xs uppercase tracking-wide mb-2">Context API</p>
            <div className="space-y-1.5 text-xs font-mono">
              {[
                { fn: 'context.Background()', color: '#8b949e', desc: 'root context' },
                { fn: 'WithCancel(parent)', color: '#00ACD7', desc: '→ (ctx, cancelFn)' },
                { fn: 'WithTimeout(parent, d)', color: '#ffa657', desc: '→ (ctx, cancelFn)' },
                { fn: 'WithDeadline(parent, t)', color: '#d2a8ff', desc: '→ (ctx, cancelFn)' },
                { fn: 'WithValue(parent, k, v)', color: '#3fb950', desc: 'attach key-value data' },
                { fn: 'ctx.Done()', color: '#f85149', desc: '← channel, closed on cancel' },
                { fn: 'ctx.Err()', color: '#f85149', desc: 'nil | Canceled | DeadlineExceeded' },
              ].map(item => (
                <div key={item.fn} className="flex items-center gap-2">
                  <span style={{ color: item.color }}>{item.fn}</span>
                  <span className="text-[#8b949e] ml-auto text-[10px]">// {item.desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    />
  );
}
