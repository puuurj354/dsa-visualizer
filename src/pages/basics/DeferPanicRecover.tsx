import { VisualizationLayout, type Step } from '../../components/VisualizationLayout';

interface DeferFrame {
  id: number;
  label: string;
  color: string;
  executed?: boolean;
}

interface CallStackFrame {
  name: string;
  status: 'active' | 'panicking' | 'recovering' | 'done';
}

interface DeferState {
  phase: 'normal' | 'panic' | 'recovering' | 'recovered';
  callStack: CallStackFrame[];
  deferStack: DeferFrame[];
  panicValue?: string;
  output: string[];
  note?: string;
}

const codeLines = [
  'package main',
  '',
  'import "fmt"',
  '',
  'func safeDiv(a, b int) (result int) {',
  '    defer func() {',
  '        if r := recover(); r != nil {',
  '            fmt.Println("Recovered:", r)',
  '            result = -1',
  '        }',
  '    }()',
  '',
  '    defer fmt.Println("deferred: cleanup")',
  '    defer fmt.Println("deferred: logging")',
  '',
  '    fmt.Println("Computing", a, "/", b)',
  '    if b == 0 {',
  '        panic("division by zero!")',
  '    }',
  '    return a / b',
  '}',
  '',
  'func main() {',
  '    fmt.Println(safeDiv(10, 2))  // 5',
  '    fmt.Println(safeDiv(10, 0))  // -1 (recovered)',
  '}',
];

const steps: Step<DeferState>[] = [
  {
    description: 'main() calls safeDiv(10, 2). The function call stack is building up.',
    highlightLines: [23, 24],
    state: {
      phase: 'normal',
      callStack: [
        { name: 'main()', status: 'active' },
        { name: 'safeDiv(10, 2)', status: 'active' },
      ],
      deferStack: [],
      output: [],
    },
  },
  {
    description: '`defer func() { recover() }()` — this defer is registered FIRST. It will be the LAST to run (LIFO order). The anonymous recover function is pushed onto the defer stack.',
    highlightLines: [6, 7, 8, 9, 10, 11],
    state: {
      phase: 'normal',
      callStack: [
        { name: 'main()', status: 'active' },
        { name: 'safeDiv(10, 2)', status: 'active' },
      ],
      deferStack: [
        { id: 1, label: 'func() { recover() }', color: '#d2a8ff' },
      ],
      output: [],
      note: 'Defer stack grows downward. Last deferred = first to run.',
    },
  },
  {
    description: '`defer fmt.Println("deferred: cleanup")` — pushed onto the defer stack. Now 2 defers registered.',
    highlightLines: [13],
    state: {
      phase: 'normal',
      callStack: [
        { name: 'main()', status: 'active' },
        { name: 'safeDiv(10, 2)', status: 'active' },
      ],
      deferStack: [
        { id: 1, label: 'func() { recover() }', color: '#d2a8ff' },
        { id: 2, label: 'Println("deferred: cleanup")', color: '#ffa657' },
      ],
      output: [],
    },
  },
  {
    description: '`defer fmt.Println("deferred: logging")` — third defer pushed. The stack now has 3 items. LIFO: logging runs first, then cleanup, then the recover func.',
    highlightLines: [14],
    state: {
      phase: 'normal',
      callStack: [
        { name: 'main()', status: 'active' },
        { name: 'safeDiv(10, 2)', status: 'active' },
      ],
      deferStack: [
        { id: 1, label: 'func() { recover() }', color: '#d2a8ff' },
        { id: 2, label: 'Println("deferred: cleanup")', color: '#ffa657' },
        { id: 3, label: 'Println("deferred: logging")', color: '#3fb950' },
      ],
      output: [],
    },
  },
  {
    description: 'b=2, not zero — no panic. Function returns normally with result=5. Defers run in LIFO order now.',
    highlightLines: [16, 20],
    state: {
      phase: 'normal',
      callStack: [
        { name: 'main()', status: 'active' },
        { name: 'safeDiv(10, 2)', status: 'done' },
      ],
      deferStack: [
        { id: 1, label: 'func() { recover() }', color: '#d2a8ff' },
        { id: 2, label: 'Println("deferred: cleanup")', color: '#ffa657' },
        { id: 3, label: 'Println("deferred: logging")', color: '#3fb950', executed: true },
      ],
      output: ['Computing 10 / 2', 'deferred: logging'],
    },
  },
  {
    description: 'Defer #2 runs: "deferred: cleanup" is printed. Defer stack unwinding continues.',
    highlightLines: [13],
    state: {
      phase: 'normal',
      callStack: [
        { name: 'main()', status: 'active' },
        { name: 'safeDiv(10, 2)', status: 'done' },
      ],
      deferStack: [
        { id: 1, label: 'func() { recover() }', color: '#d2a8ff' },
        { id: 2, label: 'Println("deferred: cleanup")', color: '#ffa657', executed: true },
        { id: 3, label: 'Println("deferred: logging")', color: '#3fb950', executed: true },
      ],
      output: ['Computing 10 / 2', 'deferred: logging', 'deferred: cleanup'],
    },
  },
  {
    description: 'Defer #1 (recover func) runs. No panic occurred, so recover() returns nil — nothing to recover from. safeDiv returns 5.',
    highlightLines: [6, 7],
    state: {
      phase: 'normal',
      callStack: [
        { name: 'main()', status: 'done' },
      ],
      deferStack: [
        { id: 1, label: 'func() { recover() }', color: '#d2a8ff', executed: true },
        { id: 2, label: 'Println("deferred: cleanup")', color: '#ffa657', executed: true },
        { id: 3, label: 'Println("deferred: logging")', color: '#3fb950', executed: true },
      ],
      output: ['Computing 10 / 2', 'deferred: logging', 'deferred: cleanup', '5'],
      note: 'recover() returns nil when no panic — safe to call always',
    },
  },
  {
    description: 'Now safeDiv(10, 0) is called. Fresh defer stack. All 3 defers register again.',
    highlightLines: [23, 25],
    state: {
      phase: 'normal',
      callStack: [
        { name: 'main()', status: 'active' },
        { name: 'safeDiv(10, 0)', status: 'active' },
      ],
      deferStack: [
        { id: 1, label: 'func() { recover() }', color: '#d2a8ff' },
        { id: 2, label: 'Println("deferred: cleanup")', color: '#ffa657' },
        { id: 3, label: 'Println("deferred: logging")', color: '#3fb950' },
      ],
      output: ['Computing 10 / 2', 'deferred: logging', 'deferred: cleanup', '5', 'Computing 10 / 0'],
    },
  },
  {
    description: '`panic("division by zero!")` — PANIC! The function stops immediately. A panic value propagates up the call stack, unwinding defers along the way.',
    highlightLines: [17, 18],
    state: {
      phase: 'panic',
      callStack: [
        { name: 'main()', status: 'active' },
        { name: 'safeDiv(10, 0)', status: 'panicking' },
      ],
      deferStack: [
        { id: 1, label: 'func() { recover() }', color: '#d2a8ff' },
        { id: 2, label: 'Println("deferred: cleanup")', color: '#ffa657' },
        { id: 3, label: 'Println("deferred: logging")', color: '#3fb950' },
      ],
      panicValue: '"division by zero!"',
      output: ['Computing 10 / 2', 'deferred: logging', 'deferred: cleanup', '5', 'Computing 10 / 0'],
      note: '💥 PANIC! Normal execution stops. Defers still run.',
    },
  },
  {
    description: 'Even during panic, defers still execute LIFO. "deferred: logging" runs first.',
    highlightLines: [14],
    state: {
      phase: 'panic',
      callStack: [
        { name: 'main()', status: 'active' },
        { name: 'safeDiv(10, 0)', status: 'panicking' },
      ],
      deferStack: [
        { id: 1, label: 'func() { recover() }', color: '#d2a8ff' },
        { id: 2, label: 'Println("deferred: cleanup")', color: '#ffa657' },
        { id: 3, label: 'Println("deferred: logging")', color: '#3fb950', executed: true },
      ],
      panicValue: '"division by zero!"',
      output: ['Computing 10 / 2', 'deferred: logging', 'deferred: cleanup', '5', 'Computing 10 / 0', 'deferred: logging'],
    },
  },
  {
    description: '"deferred: cleanup" runs. The panic is still propagating. Defer #1 (the recover func) is next — this is our safety net!',
    highlightLines: [13],
    state: {
      phase: 'panic',
      callStack: [
        { name: 'main()', status: 'active' },
        { name: 'safeDiv(10, 0)', status: 'panicking' },
      ],
      deferStack: [
        { id: 1, label: 'func() { recover() }', color: '#d2a8ff' },
        { id: 2, label: 'Println("deferred: cleanup")', color: '#ffa657', executed: true },
        { id: 3, label: 'Println("deferred: logging")', color: '#3fb950', executed: true },
      ],
      panicValue: '"division by zero!"',
      output: ['Computing 10 / 2', 'deferred: logging', 'deferred: cleanup', '5', 'Computing 10 / 0', 'deferred: logging', 'deferred: cleanup'],
    },
  },
  {
    description: '`recover()` is called inside the deferred function! It catches the panic value, stops the panic, and prints "Recovered: division by zero!". The function returns -1.',
    highlightLines: [6, 7, 8, 9, 10],
    state: {
      phase: 'recovered',
      callStack: [
        { name: 'main()', status: 'active' },
        { name: 'safeDiv(10, 0)', status: 'recovering' },
      ],
      deferStack: [
        { id: 1, label: 'func() { recover() }', color: '#d2a8ff', executed: true },
        { id: 2, label: 'Println("deferred: cleanup")', color: '#ffa657', executed: true },
        { id: 3, label: 'Println("deferred: logging")', color: '#3fb950', executed: true },
      ],
      output: ['Computing 10 / 2', 'deferred: logging', 'deferred: cleanup', '5', 'Computing 10 / 0', 'deferred: logging', 'deferred: cleanup', 'Recovered: division by zero!', '-1'],
      note: '✅ Panic caught! Program continues normally. safeDiv returns -1.',
    },
  },
];

export function DeferPanicRecover() {
  return (
    <VisualizationLayout
      title="Defer / Panic / Recover"
      description="Defer stack (LIFO), panic propagation, and recover() — Go's error handling trio"
      tag="Basics"
      tagColor="bg-[#3fb950]"
      steps={steps}
      codeLines={codeLines}
      renderVisual={(state: DeferState) => (
        <div className="w-full max-w-2xl space-y-4">

          {/* Panic banner */}
          {state.phase === 'panic' && (
            <div className="bg-[#f85149]/10 border border-[#f85149]/50 rounded-lg p-3 flex items-center gap-3">
              <span className="text-xl">💥</span>
              <div>
                <p className="text-[#f85149] text-sm">PANIC in progress</p>
                <p className="text-[#f85149] font-mono text-xs">{state.panicValue}</p>
              </div>
            </div>
          )}
          {state.phase === 'recovered' && (
            <div className="bg-[#3fb950]/10 border border-[#3fb950]/50 rounded-lg p-3 flex items-center gap-3">
              <span className="text-xl">✅</span>
              <div>
                <p className="text-[#3fb950] text-sm">Panic RECOVERED</p>
                <p className="text-[#8b949e] text-xs">Program continues normally</p>
              </div>
            </div>
          )}

          {/* Call Stack */}
          <div>
            <p className="text-[#8b949e] text-xs uppercase tracking-wide mb-2">Call Stack</p>
            <div className="space-y-1">
              {state.callStack.map((frame, i) => {
                const colors = {
                  active: { border: '#3fb950', bg: 'rgba(63,185,80,0.08)', text: '#3fb950' },
                  panicking: { border: '#f85149', bg: 'rgba(248,81,73,0.12)', text: '#f85149' },
                  recovering: { border: '#00ACD7', bg: 'rgba(0,172,215,0.1)', text: '#00ACD7' },
                  done: { border: '#30363d', bg: 'rgba(48,54,61,0.3)', text: '#8b949e' },
                }[frame.status];
                return (
                  <div
                    key={i}
                    className="flex items-center justify-between px-4 py-2 rounded-lg border transition-all duration-300"
                    style={{ borderColor: colors.border, backgroundColor: colors.bg }}
                  >
                    <span className="font-mono text-sm text-[#e6edf3]">{frame.name}</span>
                    <span
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: `${colors.border}25`, color: colors.text }}
                    >
                      {frame.status}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Defer Stack */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[#8b949e] text-xs uppercase tracking-wide">Defer Stack (LIFO — top runs first)</p>
              <span className="text-xs text-[#8b949e]">← runs first</span>
            </div>

            {state.deferStack.length === 0 ? (
              <div className="border border-dashed border-[#30363d] rounded-lg p-4 text-center text-[#8b949e] text-xs">
                No deferred calls registered yet
              </div>
            ) : (
              <div className="relative space-y-1">
                {[...state.deferStack].reverse().map((frame, i) => (
                  <div
                    key={frame.id}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-all duration-300"
                    style={{
                      borderColor: frame.executed ? '#30363d' : frame.color,
                      backgroundColor: frame.executed ? 'rgba(48,54,61,0.2)' : `${frame.color}12`,
                      opacity: frame.executed ? 0.5 : 1,
                    }}
                  >
                    {/* Stack position indicator */}
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0"
                      style={{
                        backgroundColor: frame.executed ? '#30363d' : `${frame.color}25`,
                        color: frame.executed ? '#8b949e' : frame.color,
                      }}
                    >
                      {i === 0 ? '▶' : i + 1}
                    </div>
                    <span
                      className="font-mono text-xs flex-1"
                      style={{ color: frame.executed ? '#8b949e' : '#e6edf3' }}
                    >
                      {frame.label}
                    </span>
                    {frame.executed && (
                      <span className="text-xs text-[#3fb950] ml-2">✓ ran</span>
                    )}
                    {i === 0 && !frame.executed && (
                      <span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: `${frame.color}20`, color: frame.color }}>
                        next
                      </span>
                    )}
                  </div>
                ))}

                {/* Stack bottom label */}
                <div className="flex items-center gap-2 pt-1">
                  <div className="flex-1 h-px bg-[#30363d]" />
                  <span className="text-xs text-[#8b949e]">stack bottom (registered first)</span>
                  <div className="flex-1 h-px bg-[#30363d]" />
                </div>
              </div>
            )}
          </div>

          {/* Output terminal */}
          {state.output.length > 0 && (
            <div className="bg-[#0d1117] border border-[#30363d] rounded-lg p-3 max-h-36 overflow-auto">
              <p className="text-[#8b949e] text-xs uppercase tracking-wide mb-2">Output</p>
              {state.output.map((line, i) => (
                <p
                  key={i}
                  className="font-mono text-xs"
                  style={{
                    color: line.startsWith('Recovered') ? '#f85149' : line === '-1' ? '#ffa657' : '#3fb950',
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
                backgroundColor: state.note.includes('💥') ? 'rgba(248,81,73,0.08)' : state.note.includes('✅') ? 'rgba(63,185,80,0.08)' : 'rgba(255,166,87,0.08)',
                borderColor: state.note.includes('💥') ? 'rgba(248,81,73,0.4)' : state.note.includes('✅') ? 'rgba(63,185,80,0.4)' : 'rgba(255,166,87,0.4)',
              }}
            >
              <p className="text-sm" style={{ color: state.note.includes('💥') ? '#f85149' : state.note.includes('✅') ? '#3fb950' : '#ffa657' }}>
                {state.note}
              </p>
            </div>
          )}

          {/* Quick reference */}
          <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3">
            <p className="text-[#8b949e] text-xs uppercase tracking-wide mb-2">Key Rules</p>
            <div className="space-y-1 text-xs">
              <div className="flex items-start gap-2">
                <span className="text-[#00ACD7] flex-shrink-0">defer</span>
                <span className="text-[#8b949e]">Runs when surrounding function returns — always, even on panic. LIFO order.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-[#f85149] flex-shrink-0">panic</span>
                <span className="text-[#8b949e]">Stops normal execution, unwinds stack running defers, crashes program if uncaught.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-[#3fb950] flex-shrink-0">recover</span>
                <span className="text-[#8b949e]">Only works inside a deferred function. Stops panic and returns the panic value.</span>
              </div>
            </div>
          </div>
        </div>
      )}
    />
  );
}
