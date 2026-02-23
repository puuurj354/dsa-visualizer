import { VisualizationLayout, type Step } from '../../components/VisualizationLayout';
import { type ComplexityInfo } from '../../components/ComplexityCard';

// ─── State types ───────────────────────────────────────────────

interface CapturedVar {
    name: string;
    value: string | number;
    color: string;
    highlighted?: boolean;
}

interface ClosureInstance {
    name: string;
    capturedEnv: CapturedVar[];
    calls: number;
    lastReturn?: string | number;
}

interface ClosureState {
    instances: ClosureInstance[];
    output: string[];
    note?: string;
}

// ─── Complexity ────────────────────────────────────────────────

const closuresComplexity: ComplexityInfo = {
    time: {
        best: 'O(1)', // closure call itself is O(1); body complexity depends on logic
        average: 'O(1)',
        worst: 'O(1)', // captured variable access is a single pointer dereference
    },
    space: 'O(c)', // c = number of captured variables (stored on heap by Go's escape analysis)
    notes: "Each call to the outer function creates a new independent environment (O(c) allocation). Captured vars are heap-allocated by Go automatically — no manual memory management.",
};

// ─── Code ─────────────────────────────────────────────────────

const codeLines = [
    'package main',
    '',
    'import "fmt"',
    '',
    '// makeCounter returns a closure that captures `count`.',
    '// Each call to the returned function increments *its own* counter.',
    'func makeCounter() func() int {',
    '    count := 0       // captured variable (lives on heap)',
    '    return func() int {',
    '        count++      // modifies the captured variable',
    '        return count',
    '    }',
    '}',
    '',
    '// makeAdder closes over the parameter `x`.',
    'func makeAdder(x int) func(int) int {',
    '    return func(y int) int {',
    '        return x + y  // x is captured from outer scope',
    '    }',
    '}',
    '',
    'func main() {',
    '    // Two independent counters — each has its OWN `count`',
    '    counter1 := makeCounter()',
    '    counter2 := makeCounter()',
    '',
    '    fmt.Println(counter1()) // 1',
    '    fmt.Println(counter1()) // 2',
    '    fmt.Println(counter2()) // 1  ← independent!',
    '',
    '    add5 := makeAdder(5)',
    '    add10 := makeAdder(10)',
    '',
    '    fmt.Println(add5(3))   // 8',
    '    fmt.Println(add10(3))  // 13',
    '}',
];

// ─── Steps ─────────────────────────────────────────────────────

const steps: Step<ClosureState>[] = [
    {
        description: 'A closure is a function that "closes over" variables from its surrounding scope. The captured variables outlive the outer function — Go moves them to the heap automatically.',
        highlightLines: [7, 8, 9],
        state: { instances: [], output: [] },
    },
    {
        description: '`counter1 := makeCounter()` — calling makeCounter() creates a NEW closure with its own `count = 0` variable on the heap. The returned function*is* the closure.',
        highlightLines: [24],
        state: {
            instances: [
                { name: 'counter1', capturedEnv: [{ name: 'count', value: 0, color: '#3fb950', highlighted: true }], calls: 0 },
            ],
            output: [],
            note: 'count escapes to heap so the closure can outlive makeCounter()',
        },
    },
    {
        description: '`counter2 := makeCounter()` — a SECOND call creates an INDEPENDENT closure with its own separate `count = 0`. The two closures do NOT share state.',
        highlightLines: [25],
        state: {
            instances: [
                { name: 'counter1', capturedEnv: [{ name: 'count', value: 0, color: '#3fb950' }], calls: 0 },
                { name: 'counter2', capturedEnv: [{ name: 'count', value: 0, color: '#00ACD7', highlighted: true }], calls: 0 },
            ],
            output: [],
        },
    },
    {
        description: '`counter1()` — calling the closure increments counter1\'s captured `count` to 1. counter2\'s count remains 0.',
        highlightLines: [27, 10, 11],
        state: {
            instances: [
                { name: 'counter1', capturedEnv: [{ name: 'count', value: 1, color: '#3fb950', highlighted: true }], calls: 1, lastReturn: 1 },
                { name: 'counter2', capturedEnv: [{ name: 'count', value: 0, color: '#00ACD7' }], calls: 0 },
            ],
            output: ['1'],
        },
    },
    {
        description: '`counter1()` again — counter1\'s count becomes 2. Each call mutates the same captured variable.',
        highlightLines: [28, 10, 11],
        state: {
            instances: [
                { name: 'counter1', capturedEnv: [{ name: 'count', value: 2, color: '#3fb950', highlighted: true }], calls: 2, lastReturn: 2 },
                { name: 'counter2', capturedEnv: [{ name: 'count', value: 0, color: '#00ACD7' }], calls: 0 },
            ],
            output: ['1', '2'],
        },
    },
    {
        description: '`counter2()` — counter2 returns 1, NOT 3! Proof that counter1 and counter2 are fully independent — each closure has its own copy of the `count` variable.',
        highlightLines: [29, 10, 11],
        state: {
            instances: [
                { name: 'counter1', capturedEnv: [{ name: 'count', value: 2, color: '#3fb950' }], calls: 2 },
                { name: 'counter2', capturedEnv: [{ name: 'count', value: 1, color: '#00ACD7', highlighted: true }], calls: 1, lastReturn: 1 },
            ],
            output: ['1', '2', '1'],
            note: 'Independent environments: counter1.count=2, counter2.count=1',
        },
    },
    {
        description: '`add5 := makeAdder(5)` — closes over parameter `x=5`. `add10 := makeAdder(10)` closes over `x=10`. Parameters are captured just like local variables.',
        highlightLines: [31, 32],
        state: {
            instances: [
                { name: 'add5', capturedEnv: [{ name: 'x', value: 5, color: '#ffa657', highlighted: true }], calls: 0 },
                { name: 'add10', capturedEnv: [{ name: 'x', value: 10, color: '#d2a8ff', highlighted: true }], calls: 0 },
            ],
            output: ['1', '2', '1'],
        },
    },
    {
        description: '`add5(3)` returns 8 (5+3). `add10(3)` returns 13 (10+3). Same function body, different captured environments. This is the power of closures!',
        highlightLines: [34, 35, 17, 18],
        state: {
            instances: [
                { name: 'add5', capturedEnv: [{ name: 'x', value: 5, color: '#ffa657', highlighted: true }], calls: 1, lastReturn: 8 },
                { name: 'add10', capturedEnv: [{ name: 'x', value: 10, color: '#d2a8ff', highlighted: true }], calls: 1, lastReturn: 13 },
            ],
            output: ['1', '2', '1', '8', '13'],
            note: 'Real-world use: middleware, functional options pattern, callbacks, memoization',
        },
    },
];

// ─── Component ─────────────────────────────────────────────────

export function Closures() {
    return (
        <VisualizationLayout
            title="Closures"
            description="Functions that capture and carry their surrounding environment"
            tag="Basics"
            tagColor="bg-[#3fb950]"
            steps={steps}
            complexity={closuresComplexity}
            codeLines={codeLines}
            renderVisual={(state: ClosureState) => (
                <div className="w-full max-w-xl space-y-4">

                    {/* Closure instances */}
                    {state.instances.length === 0 ? (
                        <div className="border border-dashed border-[#30363d] rounded-lg p-8 text-center text-[#8b949e] text-sm">
                            No closures created yet
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {state.instances.map((inst) => (
                                <div key={inst.name} className="bg-[#161b22] border border-[#30363d] rounded-lg overflow-hidden">
                                    {/* Header */}
                                    <div className="px-4 py-2 border-b border-[#30363d] flex items-center justify-between bg-[#0d1117]">
                                        <span className="font-mono text-sm text-[#e6edf3]">{inst.name}</span>
                                        <div className="flex items-center gap-3">
                                            {inst.lastReturn != null && (
                                                <span className="text-xs text-[#3fb950] font-mono">→ {inst.lastReturn}</span>
                                            )}
                                            <span className="text-xs text-[#8b949e]">called {inst.calls}×</span>
                                        </div>
                                    </div>

                                    {/* Captured environment */}
                                    <div className="p-3">
                                        <p className="text-[#8b949e] text-[10px] uppercase tracking-wide mb-2">Captured environment</p>
                                        <div className="flex gap-2 flex-wrap">
                                            {inst.capturedEnv.map(v => (
                                                <div
                                                    key={v.name}
                                                    className="flex items-center gap-2 px-3 py-2 rounded-lg border transition-all duration-300"
                                                    style={{
                                                        borderColor: v.highlighted ? v.color : `${v.color}40`,
                                                        backgroundColor: v.highlighted ? `${v.color}15` : `${v.color}08`,
                                                        boxShadow: v.highlighted ? `0 0 8px ${v.color}30` : 'none',
                                                    }}
                                                >
                                                    <span className="font-mono text-xs text-[#8b949e]">{v.name}:</span>
                                                    <span className="font-mono text-sm font-bold" style={{ color: v.color }}>
                                                        {v.value}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Output */}
                    {state.output.length > 0 && (
                        <div className="bg-[#0d1117] border border-[#30363d] rounded-lg p-3">
                            <p className="text-[#8b949e] text-xs uppercase tracking-wide mb-2">Output</p>
                            {state.output.map((line, i) => (
                                <p key={i} className="text-[#3fb950] font-mono text-xs">{line}</p>
                            ))}
                        </div>
                    )}

                    {/* Closure anatomy reference */}
                    {state.instances.length === 0 && (
                        <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3">
                            <p className="text-[#8b949e] text-xs uppercase tracking-wide mb-2">Closure = function + environment</p>
                            <div className="text-xs space-y-1.5 font-mono">
                                <p><span className="text-[#ff7b72]">func()</span> <span className="text-[#8b949e]">+ captured vars = closure</span></p>
                                <p><span className="text-[#ffa657]">captured vars</span> <span className="text-[#8b949e]">live on the heap</span></p>
                                <p><span className="text-[#3fb950]">each call</span> <span className="text-[#8b949e]">to outer func → new env</span></p>
                            </div>
                        </div>
                    )}

                    {state.note && (
                        <div className="bg-[#ffa657]/10 border border-[#ffa657]/30 rounded-lg p-3">
                            <p className="text-[#ffa657] text-xs">⚡ {state.note}</p>
                        </div>
                    )}
                </div>
            )}
        />
    );
}
