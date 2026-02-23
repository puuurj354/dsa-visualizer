import { VisualizationLayout, type Step } from '../../components/VisualizationLayout';
import { type ComplexityInfo } from '../../components/ComplexityCard';

// ─── State types ───────────────────────────────────────────────

interface PipelineStage {
    name: string;
    description: string;
    color: string;
    input: number[];
    output: number[];
    active: boolean;
}

interface PipelineState {
    stages: PipelineStage[];
    currentValues: Record<string, number[]>; // values flowing between stages
    finalOutput: number[];
    note?: string;
}

// ─── Code ─────────────────────────────────────────────────────

const pipelineComplexity: ComplexityInfo = {
    time: {
        best: 'O(n+s)', // n items, s stages — pipelined concurrency
        average: 'O(n+s)', // stages run in parallel; throughput ≈ 1 item per slowest stage
        worst: 'O(n·s)', // if stages are serialized (unbuffered + blocking)
    },
    space: 'O(s)', // s goroutines + s channel buffers
    notes: 'Pipeline latency = s × stage_time for first item. Throughput improves with buffered channels. Bottleneck is the slowest stage; tune with fan-out there.',
};

const codeLines = [
    'package main',
    '',
    'import "fmt"',
    '',
    '// Stage 1: generate numbers 1..n',
    'func generate(nums ...int) <-chan int {',
    '    out := make(chan int)',
    '    go func() {',
    '        for _, n := range nums {',
    '            out <- n',
    '        }',
    '        close(out)',
    '    }()',
    '    return out',
    '}',
    '',
    '// Stage 2: square each number',
    'func square(in <-chan int) <-chan int {',
    '    out := make(chan int)',
    '    go func() {',
    '        for n := range in {',
    '            out <- n * n',
    '        }',
    '        close(out)',
    '    }()',
    '    return out',
    '}',
    '',
    '// Stage 3: filter even numbers only',
    'func filterEven(in <-chan int) <-chan int {',
    '    out := make(chan int)',
    '    go func() {',
    '        for n := range in {',
    '            if n % 2 == 0 { out <- n }',
    '        }',
    '        close(out)',
    '    }()',
    '    return out',
    '}',
    '',
    'func main() {',
    '    // Connect stages into a pipeline',
    '    c1 := generate(1, 2, 3, 4, 5)',
    '    c2 := square(c1)',
    '    c3 := filterEven(c2)',
    '',
    '    for n := range c3 {',
    '        fmt.Println(n) // 4, 16',
    '    }',
    '}',
];

// ─── Steps ─────────────────────────────────────────────────────

const makeStages = (
    s1in: number[], s1out: number[],
    s2in: number[], s2out: number[],
    s3in: number[], s3out: number[],
    active: [boolean, boolean, boolean],
    final: number[],
    note?: string,
): PipelineState => ({
    stages: [
        { name: 'generate()', description: 'produces 1,2,3,4,5', color: '#3fb950', input: s1in, output: s1out, active: active[0] },
        { name: 'square()', description: 'n * n', color: '#00ACD7', input: s2in, output: s2out, active: active[1] },
        { name: 'filterEven()', description: 'n % 2 == 0', color: '#d2a8ff', input: s3in, output: s3out, active: active[2] },
    ],
    currentValues: {},
    finalOutput: final,
    note,
});

const steps: Step<PipelineState>[] = [
    {
        description: 'The Pipeline pattern chains goroutines via channels. Each stage reads from an inbound channel, transforms data, and writes to an outbound channel.',
        highlightLines: [41, 42, 43, 44, 45],
        state: makeStages([], [], [], [], [], [], [false, false, false], []),
    },
    {
        description: '`generate(1,2,3,4,5)` — Stage 1 goroutine starts. It will emit ints 1–5 into channel `c1` and then `close(c1)`, signalling completion.',
        highlightLines: [6, 7, 8, 43],
        state: makeStages([1, 2, 3, 4, 5], [], [], [], [], [], [true, false, false], [],
            'generate() sends values into channel c1'),
    },
    {
        description: '`square(c1)` — Stage 2 goroutine reads from `c1`. Each value is squared: 1→1, 2→4, 3→9, 4→16, 5→25. Results flow into channel `c2`.',
        highlightLines: [18, 21, 22, 44],
        state: makeStages([1, 2, 3, 4, 5], [1, 2, 3, 4, 5], [1, 2, 3, 4, 5], [], [], [], [true, true, false], []),
    },
    {
        description: '`filterEven(c2)` — Stage 3 goroutine reads from `c2`. Only even squares pass through: 4 (2²) and 16 (4²). 1, 9, 25 are discarded.',
        highlightLines: [30, 33, 45],
        state: makeStages([1, 2, 3, 4, 5], [1, 2, 3, 4, 5], [1, 4, 9, 16, 25], [1, 4, 9, 16, 25], [1, 4, 9, 16, 25], [], [true, true, true], []),
    },
    {
        description: 'Values flow through all 3 stages simultaneously! generate emits 1, square makes it 1, filterEven discards it (odd). The pipeline is live.',
        highlightLines: [9, 10, 21, 22, 33, 43, 44, 45],
        state: makeStages([1, 2, 3, 4, 5], [1, 2, 3, 4, 5], [1, 4, 9, 16, 25], [1, 4, 9, 16, 25], [4, 16], [4], [true, true, true], [4],
            '1² = 1 (odd, filtered) | 2² = 4 (even, passes!)'),
    },
    {
        description: '4 arrives at the consumer via `c3`. 16 is next in the pipeline. Stages run concurrently — generate is producing while square and filter are processing.',
        highlightLines: [47, 48],
        state: makeStages([1, 2, 3, 4, 5], [1, 2, 3, 4, 5], [1, 4, 9, 16, 25], [1, 4, 9, 16, 25], [4, 16], [4, 16], [true, true, true], [4, 16],
            '3²=9 (odd), 4²=16 (even!) → passes filter'),
    },
    {
        description: 'All values processed. `close()` propagates: generate closes c1 → square\'s `range` exits, closes c2 → filterEven closes c3 → main\'s `range` exits.',
        highlightLines: [12, 24, 36, 47],
        state: makeStages([1, 2, 3, 4, 5], [1, 2, 3, 4, 5], [1, 4, 9, 16, 25], [1, 4, 9, 16, 25], [4, 16], [4, 16], [false, false, false], [4, 16],
            'close() cascades: c1 → c2 → c3 → main exits'),
    },
];

// ─── Component ─────────────────────────────────────────────────

const arrows = ['→', '→'];

export function Pipeline() {
    return (
        <VisualizationLayout
            title="Pipeline Pattern"
            description="Channel-chained stages — each goroutine transforms and forwards data"
            tag="Concurrency"
            tagColor="bg-[#00ACD7]"
            steps={steps}
            complexity={pipelineComplexity}
            codeLines={codeLines}
            renderVisual={(state: PipelineState) => (
                <div className="w-full max-w-xl space-y-4">

                    {/* Pipeline diagram */}
                    <div>
                        <p className="text-[#8b949e] text-xs uppercase tracking-wide mb-3">Pipeline stages</p>
                        <div className="flex items-start gap-1 flex-wrap">
                            {state.stages.map((stage, i) => (
                                <div key={stage.name} className="flex items-center gap-1">
                                    {/* Stage box */}
                                    <div
                                        className="flex flex-col items-center gap-2 px-3 py-3 rounded-lg border transition-all duration-300 min-w-[110px]"
                                        style={{
                                            borderColor: stage.active ? stage.color : '#30363d',
                                            backgroundColor: stage.active ? `${stage.color}10` : '#161b22',
                                            boxShadow: stage.active ? `0 0 12px ${stage.color}25` : 'none',
                                        }}
                                    >
                                        <span className="text-xs font-mono font-bold" style={{ color: stage.color }}>
                                            {stage.name}
                                        </span>
                                        <span className="text-[10px] text-[#8b949e] text-center">{stage.description}</span>
                                        {/* Output values */}
                                        {stage.output.length > 0 && (
                                            <div className="flex flex-wrap gap-1 justify-center">
                                                {stage.output.slice(0, 6).map((v, vi) => (
                                                    <span key={vi} className="text-[10px] px-1.5 rounded font-mono"
                                                        style={{ color: stage.color, backgroundColor: `${stage.color}20` }}>
                                                        {v}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                        <span
                                            className="text-[10px] px-2 py-0.5 rounded-full"
                                            style={{
                                                color: stage.active ? stage.color : '#8b949e',
                                                backgroundColor: stage.active ? `${stage.color}20` : 'rgba(139,148,158,0.15)',
                                            }}
                                        >
                                            {stage.active ? 'running' : 'idle'}
                                        </span>
                                    </div>

                                    {/* Arrow between stages */}
                                    {i < state.stages.length - 1 && (
                                        <div className="flex flex-col items-center gap-0.5 px-1">
                                            <span className="text-[10px] text-[#8b949e] font-mono">c{i + 1}</span>
                                            <span className="text-[#58a6ff] text-lg">{arrows[i]}</span>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Data flow trace */}
                    <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3">
                        <p className="text-[#8b949e] text-xs uppercase tracking-wide mb-2">Data transformation</p>
                        <div className="font-mono text-xs space-y-1">
                            {[
                                { in: '1,2,3,4,5', label: 'input', color: '#3fb950' },
                                { in: '1,4,9,16,25', label: '→ square()', color: '#00ACD7' },
                                { in: '4, 16', label: '→ filterEven()', color: '#d2a8ff' },
                            ].map(row => (
                                <div key={row.label} className="flex items-center gap-3">
                                    <span className="text-[#8b949e] w-28 flex-shrink-0">{row.label}</span>
                                    <span style={{ color: row.color }}>{row.in}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Final output */}
                    {state.finalOutput.length > 0 && (
                        <div className="bg-[#0d1117] border border-[#30363d] rounded-lg p-3">
                            <p className="text-[#8b949e] text-xs uppercase tracking-wide mb-2">Consumer output (c3)</p>
                            <div className="flex gap-2">
                                {state.finalOutput.map((v, i) => (
                                    <span key={i} className="text-[#3fb950] font-mono text-sm bg-[#3fb950]/10 px-3 py-1 rounded-lg">
                                        {v}
                                    </span>
                                ))}
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
