import { VisualizationLayout, type Step } from '../../components/VisualizationLayout';
import { type ComplexityInfo } from '../../components/ComplexityCard';

// ─── State types ───────────────────────────────────────────────

interface HeapNode {
    value: number;
    index: number;        // 0-based array index
    highlight?: 'current' | 'compare' | 'swapped' | 'done';
}

interface HeapState {
    heap: HeapNode[];     // array representation (index 0 = root)
    operation: string;
    note?: string;
}

// ─── Code ─────────────────────────────────────────────────────

const codeLines = [
    'package main',
    '',
    'import (',
    '    "container/heap"',
    '    "fmt"',
    ')',
    '',
    '// MinHeap implements heap.Interface',
    'type MinHeap []int',
    '',
    'func (h MinHeap) Len() int           { return len(h) }',
    'func (h MinHeap) Less(i, j int) bool { return h[i] < h[j] }',
    'func (h MinHeap) Swap(i, j int)      { h[i], h[j] = h[j], h[i] }',
    '',
    'func (h *MinHeap) Push(x any) {',
    '    *h = append(*h, x.(int))',
    '}',
    '',
    'func (h *MinHeap) Pop() any {',
    '    old := *h',
    '    n := len(old)',
    '    x := old[n-1]',
    '    *h = old[:n-1]',
    '    return x',
    '}',
    '',
    'func main() {',
    '    h := &MinHeap{5, 3, 8, 1, 9, 2}',
    '    heap.Init(h)  // rearranges into valid heap',
    '',
    '    heap.Push(h, 4)',
    '',
    '    fmt.Println(heap.Pop(h)) // 1 — always the minimum',
    '    fmt.Println(heap.Pop(h)) // 2',
    '    fmt.Println(heap.Pop(h)) // 3',
    '}',
];

// ─── Helpers ───────────────────────────────────────────────────

const heapComplexity: ComplexityInfo = {
    time: {
        best: 'O(1)',     // peek (read root) is constant time
        average: 'O(log n)', // push / pop sift up or down one height
        worst: 'O(n)',     // heap.Init (heapify) — but O(n) amortized, not log n
    },
    space: 'O(n)',
    notes: 'Push and Pop are O(log n). heap.Init is O(n) — faster than n individual pushes. Peek (min/max) is always O(1).',
};

function makeNodes(values: number[], highlights: Record<number, HeapNode['highlight']> = {}): HeapNode[] {
    return values.map((v, i) => ({ value: v, index: i, highlight: highlights[i] }));
}

// ─── Steps ─────────────────────────────────────────────────────

const steps: Step<HeapState>[] = [
    {
        description: 'A Min-Heap is a binary tree stored as an ARRAY where every parent is ≤ its children. Root (index 0) is always the MINIMUM. Children of i are at 2i+1 and 2i+2.',
        highlightLines: [9, 11, 12, 29],
        state: {
            heap: makeNodes([5, 3, 8, 1, 9, 2]),
            operation: 'Initial array — not a valid heap yet',
        },
    },
    {
        description: '`heap.Init(h)` — heapifies in O(n) by running sift-down from each non-leaf node bottom-up. First sift: index 2 has value 8. Children: 2 (left/idx5). 2 < 8 → swap.',
        highlightLines: [15, 16, 30],
        state: {
            heap: makeNodes([5, 3, 8, 1, 9, 2], { 2: 'current', 5: 'compare' }),
            operation: 'sift-down(2): 8 vs child 2 → swap',
        },
    },
    {
        description: 'After first swap: index 2 is now 2. Sift-down continues at index 1 (value 3). Children: 1 (idx3) and 9 (idx4). 1 < 3 → swap.',
        highlightLines: [15, 16, 30],
        state: {
            heap: makeNodes([5, 3, 2, 1, 9, 8], { 1: 'current', 3: 'compare' }),
            operation: 'sift-down(1): 3 vs child 1 → swap',
        },
    },
    {
        description: 'After second swap. Now sift-down starts at root (0, value 5). Smallest child is 1 (idx1). 1 < 5 → swap.',
        highlightLines: [15, 16, 30],
        state: {
            heap: makeNodes([5, 1, 2, 3, 9, 8], { 0: 'current', 1: 'compare' }),
            operation: 'sift-down(0): 5 vs child 1 → swap',
        },
    },
    {
        description: '`heap.Init` complete! Valid min-heap: [1, 3, 2, 5, 9, 8]. Root is 1 (minimum). Every parent ≤ its children. O(n) total — faster than n individual inserts.',
        highlightLines: [11, 12, 13, 30],
        state: {
            heap: makeNodes([1, 3, 2, 5, 9, 8], { 0: 'done' }),
            operation: 'Valid min-heap: root = 1 (minimum)',
            note: 'Parent at i: children at 2i+1 and 2i+2',
        },
    },
    {
        description: '`heap.Push(h, 4)` — append 4 at the end (index 6), then SIFT UP: compare with parent at (6-1)/2=2 (value 2). 4 > 2, so no swap. 4 stays at index 6.',
        highlightLines: [15, 16, 32],
        state: {
            heap: makeNodes([1, 3, 2, 5, 9, 8, 4], { 6: 'current', 2: 'compare' }),
            operation: 'Push 4: append then sift-up',
        },
    },
    {
        description: 'Heap after Push(4). 4 is correctly placed at index 6 — it\'s a leaf child of 2. The heap property is maintained. O(log n) for Push.',
        highlightLines: [15, 16, 32],
        state: {
            heap: makeNodes([1, 3, 2, 5, 9, 8, 4], { 6: 'done' }),
            operation: '[1, 3, 2, 5, 9, 8, 4] — valid min-heap',
        },
    },
    {
        description: '`heap.Pop(h)` — returns root (1 = minimum). To maintain shape: SWAP root with last element (4), remove last, then SIFT DOWN the new root.',
        highlightLines: [19, 20, 21, 22, 23, 24, 25, 34],
        state: {
            heap: makeNodes([4, 3, 2, 5, 9, 8], { 0: 'swapped' }),
            operation: 'Pop: swap root(1) with last(4), remove 1, sift-down',
            note: 'Output: 1',
        },
    },
    {
        description: 'Sift-down the new root 4: smallest child is 2 (idx2). 2 < 4 → swap. Continue until 4 reaches a leaf or is ≤ all children. O(log n).',
        highlightLines: [19, 20, 21, 22, 23, 24, 25, 34],
        state: {
            heap: makeNodes([2, 3, 4, 5, 9, 8], { 2: 'swapped' }),
            operation: 'Sift-down: 4 → 2 rises to root',
        },
    },
    {
        description: '`heap.Pop(h)` again → returns 2. Then 3. Priority Queue property: Pop always returns the global minimum in O(log n). Total sort = O(n log n) = Heap Sort.',
        highlightLines: [19, 20, 21, 22, 23, 24, 25, 34, 35, 36],
        state: {
            heap: makeNodes([3, 5, 4, 8, 9], { 0: 'done' }),
            operation: 'Pops in order: 1, 2, 3... always minimum first',
            note: 'Use case: Dijkstra, task schedulers, top-K elements',
        },
    },
];

// ─── Visual helpers ────────────────────────────────────────────

const HIGHLIGHT_COLORS: Record<string, { border: string; bg: string; text: string }> = {
    current: { border: '#ffa657', bg: 'rgba(255,166,87,0.15)', text: '#ffa657' },
    compare: { border: '#00ACD7', bg: 'rgba(0,172,215,0.12)', text: '#00ACD7' },
    swapped: { border: '#d2a8ff', bg: 'rgba(210,168,255,0.12)', text: '#d2a8ff' },
    done: { border: '#3fb950', bg: 'rgba(63,185,80,0.12)', text: '#3fb950' },
    default: { border: '#30363d', bg: '#161b22', text: '#e6edf3' },
};

function getColor(h?: HeapNode['highlight']) {
    return HIGHLIGHT_COLORS[h ?? 'default'];
}

// ─── Tree layout: position each node in a centered tree ────────

function getTreePositions(n: number): { x: number; y: number }[] {
    const positions: { x: number; y: number }[] = [];
    for (let i = 0; i < n; i++) {
        const level = Math.floor(Math.log2(i + 1));
        const posInLevel = i - (Math.pow(2, level) - 1);
        const nodesInLevel = Math.pow(2, level);
        const totalWidth = 280;
        const xSpacing = totalWidth / nodesInLevel;
        positions.push({
            x: xSpacing * posInLevel + xSpacing / 2,
            y: level * 58 + 20,
        });
    }
    return positions;
}

// ─── Component ─────────────────────────────────────────────────

export function Heap() {
    return (
        <VisualizationLayout
            title="Heap / Priority Queue"
            description="Min-heap stored as array — root is always the minimum element"
            tag="Data Structures"
            tagColor="bg-[#79c0ff]"
            steps={steps}
            complexity={heapComplexity}
            codeLines={codeLines}
            renderVisual={(state: HeapState) => (
                <div className="w-full max-w-xl space-y-4">

                    {/* Tree diagram */}
                    <div>
                        <p className="text-[#8b949e] text-xs uppercase tracking-wide mb-2">Tree representation</p>
                        <div className="bg-[#0d1117] border border-[#30363d] rounded-lg p-3 relative" style={{ height: '220px' }}>
                            {(() => {
                                const positions = getTreePositions(state.heap.length);
                                const nodeRadius = 20;
                                return (
                                    <svg width="100%" height="200" viewBox="0 0 280 200" preserveAspectRatio="xMidYMid meet">
                                        {/* Edges */}
                                        {state.heap.map((node) => {
                                            const leftChild = 2 * node.index + 1;
                                            const rightChild = 2 * node.index + 2;
                                            const parent = positions[node.index];
                                            return [leftChild, rightChild].map(childIdx => {
                                                if (childIdx >= state.heap.length) return null;
                                                const child = positions[childIdx];
                                                return (
                                                    <line
                                                        key={`${node.index}-${childIdx}`}
                                                        x1={parent.x} y1={parent.y}
                                                        x2={child.x} y2={child.y}
                                                        stroke="#30363d" strokeWidth="1.5"
                                                    />
                                                );
                                            });
                                        })}
                                        {/* Nodes */}
                                        {state.heap.map((node) => {
                                            const pos = positions[node.index];
                                            const col = getColor(node.highlight);
                                            return (
                                                <g key={node.index}>
                                                    <circle
                                                        cx={pos.x} cy={pos.y} r={nodeRadius}
                                                        fill={col.bg}
                                                        stroke={col.border}
                                                        strokeWidth={node.highlight ? 2 : 1}
                                                    />
                                                    <text
                                                        x={pos.x} y={pos.y + 1}
                                                        textAnchor="middle" dominantBaseline="middle"
                                                        fill={col.text}
                                                        fontSize="13"
                                                        fontWeight={node.highlight ? 'bold' : 'normal'}
                                                        fontFamily="monospace"
                                                    >
                                                        {node.value}
                                                    </text>
                                                    {/* Array index label */}
                                                    <text
                                                        x={pos.x} y={pos.y + nodeRadius + 11}
                                                        textAnchor="middle"
                                                        fill="#8b949e"
                                                        fontSize="9"
                                                        fontFamily="monospace"
                                                    >
                                                        [{node.index}]
                                                    </text>
                                                </g>
                                            );
                                        })}
                                    </svg>
                                );
                            })()}
                        </div>
                    </div>

                    {/* Array representation */}
                    <div>
                        <p className="text-[#8b949e] text-xs uppercase tracking-wide mb-2">Array (heap storage)</p>
                        <div className="flex gap-1 flex-wrap">
                            {state.heap.map((node) => {
                                const col = getColor(node.highlight);
                                return (
                                    <div key={node.index} className="flex flex-col items-center gap-0.5">
                                        <div
                                            className="w-10 h-10 rounded border-2 flex items-center justify-center font-mono text-sm transition-all duration-300"
                                            style={{ borderColor: col.border, backgroundColor: col.bg, color: col.text }}
                                        >
                                            {node.value}
                                        </div>
                                        <span className="text-[#8b949e] text-[10px] font-mono">[{node.index}]</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Operation info */}
                    <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3">
                        <p className="text-[#8b949e] text-xs uppercase tracking-wide mb-1">Operation</p>
                        <p className="text-[#e6edf3] text-sm font-mono">{state.operation}</p>
                    </div>

                    {/* Legend */}
                    <div className="flex flex-wrap gap-3 text-xs">
                        {[
                            { label: 'current', color: '#ffa657' },
                            { label: 'compare', color: '#00ACD7' },
                            { label: 'swapped', color: '#d2a8ff' },
                            { label: 'done', color: '#3fb950' },
                        ].map(l => (
                            <div key={l.label} className="flex items-center gap-1.5">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: l.color }} />
                                <span className="text-[#8b949e]">{l.label}</span>
                            </div>
                        ))}
                    </div>

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
