import { VisualizationLayout, type Step } from '../../components/VisualizationLayout';
import { type ComplexityInfo } from '../../components/ComplexityCard';

// ─── State types ───────────────────────────────────────────────

interface GraphNode {
    id: number;
    label: string;
    x: number;
    y: number;
    highlight?: 'default' | 'current' | 'visited' | 'queued' | 'path';
}

interface GraphEdge {
    from: number;
    to: number;
    weight?: number;
    highlight?: boolean;
}

interface GraphState {
    nodes: GraphNode[];
    edges: GraphEdge[];
    adjacencyList: Record<number, number[]>;
    visited: number[];
    queue: number[];
    currentOp?: string;
    note?: string;
}

// ─── Code ─────────────────────────────────────────────────────

const codeLines = [
    'package main',
    '',
    'import "fmt"',
    '',
    '// Graph with adjacency list representation',
    'type Graph struct {',
    '    adj map[int][]int',
    '}',
    '',
    'func NewGraph() *Graph {',
    '    return &Graph{adj: make(map[int][]int)}',
    '}',
    '',
    'func (g *Graph) AddEdge(u, v int) {',
    '    g.adj[u] = append(g.adj[u], v)',
    '    g.adj[v] = append(g.adj[v], u) // undirected',
    '}',
    '',
    '// BFS: Breadth-First Search from start',
    'func (g *Graph) BFS(start int) []int {',
    '    visited := make(map[int]bool)',
    '    queue  := []int{start}',
    '    order  := []int{}',
    '    visited[start] = true',
    '',
    '    for len(queue) > 0 {',
    '        node := queue[0]',
    '        queue = queue[1:]',
    '        order = append(order, node)',
    '',
    '        for _, neighbor := range g.adj[node] {',
    '            if !visited[neighbor] {',
    '                visited[neighbor] = true',
    '                queue = append(queue, neighbor)',
    '            }',
    '        }',
    '    }',
    '    return order',
    '}',
    '',
    'func main() {',
    '    g := NewGraph()',
    '    g.AddEdge(0, 1)',
    '    g.AddEdge(0, 2)',
    '    g.AddEdge(1, 3)',
    '    g.AddEdge(1, 4)',
    '    g.AddEdge(2, 5)',
    '',
    '    order := g.BFS(0)',
    '    fmt.Println(order) // [0 1 2 3 4 5]',
    '}',
];

// ─── Graph layout ──────────────────────────────────────────────
// Nodes: 0(root), 1, 2 (level 1), 3, 4, 5 (level 2)

const graphComplexity: ComplexityInfo = {
    time: {
        best: 'O(V+E)', // BFS always visits all reachable vertices and edges
        average: 'O(V+E)',
        worst: 'O(V+E)', // V = vertices, E = edges
    },
    space: 'O(V)', // queue + visited set hold at most V nodes
    notes: 'BFS guarantees the shortest path in unweighted graphs. Adjacency list uses O(V+E) space vs O(V²) for adjacency matrix — prefer lists for sparse graphs.',
};

const BASE_NODES: GraphNode[] = [
    { id: 0, label: '0', x: 140, y: 30 },
    { id: 1, label: '1', x: 70, y: 100 },
    { id: 2, label: '2', x: 210, y: 100 },
    { id: 3, label: '3', x: 30, y: 175 },
    { id: 4, label: '4', x: 110, y: 175 },
    { id: 5, label: '5', x: 210, y: 175 },
];

const BASE_EDGES: GraphEdge[] = [
    { from: 0, to: 1 },
    { from: 0, to: 2 },
    { from: 1, to: 3 },
    { from: 1, to: 4 },
    { from: 2, to: 5 },
];

const ADJ: Record<number, number[]> = {
    0: [1, 2],
    1: [0, 3, 4],
    2: [0, 5],
    3: [1],
    4: [1],
    5: [2],
};

function colorNodes(
    highlightMap: Record<number, GraphNode['highlight']>,
    highlightEdges: Array<[number, number]> = [],
): { nodes: GraphNode[]; edges: GraphEdge[] } {
    return {
        nodes: BASE_NODES.map(n => ({ ...n, highlight: highlightMap[n.id] ?? 'default' })),
        edges: BASE_EDGES.map(e => ({
            ...e,
            highlight: highlightEdges.some(
                ([a, b]) => (e.from === a && e.to === b) || (e.from === b && e.to === a),
            ),
        })),
    };
}

// ─── Steps ─────────────────────────────────────────────────────

const steps: Step<GraphState>[] = [
    {
        description: 'An adjacency list represents a graph as a map: each node → list of neighbors. Efficient for sparse graphs. O(V+E) space vs O(V²) for adjacency matrix.',
        highlightLines: [6, 7, 43],
        state: {
            ...colorNodes({}),
            adjacencyList: ADJ,
            visited: [],
            queue: [],
            currentOp: '6 nodes, 5 edges — adjacency list',
        },
    },
    {
        description: '`AddEdge(0,1)`, `AddEdge(0,2)` etc. — each undirected edge is stored TWICE (u→v and v→u). Graph built in O(E).',
        highlightLines: [14, 15, 16, 44, 45, 46, 47, 48],
        state: {
            ...colorNodes({ 0: 'current' }, [[0, 1], [0, 2]]),
            adjacencyList: ADJ,
            visited: [],
            queue: [],
            currentOp: 'Built graph: 0→[1,2], 1→[0,3,4], 2→[0,5]',
        },
    },
    {
        description: 'BFS starts at node 0. Mark it visited, enqueue it. Queue: [0]. BFS explores ALL nodes at distance 1 before distance 2 — guarantees shortest path in unweighted graphs.',
        highlightLines: [20, 21, 22, 23, 24, 50],
        state: {
            ...colorNodes({ 0: 'queued' }),
            adjacencyList: ADJ,
            visited: [],
            queue: [0],
            currentOp: 'BFS start: visited={0}, queue=[0]',
        },
    },
    {
        description: 'Dequeue 0. Visit it. Enqueue ALL unvisited neighbors: 1 and 2. Queue becomes [1, 2]. Both get marked visited immediately (to avoid duplicates).',
        highlightLines: [26, 27, 28, 30, 31, 32, 33, 50],
        state: {
            ...colorNodes({ 0: 'visited', 1: 'queued', 2: 'queued' }, [[0, 1], [0, 2]]),
            adjacencyList: ADJ,
            visited: [0],
            queue: [1, 2],
            currentOp: 'Dequeue 0; enqueue neighbors 1, 2',
        },
    },
    {
        description: 'Dequeue 1. Visit it. Unvisited neighbors: 3 and 4 (0 already visited). Enqueue both. Queue: [2, 3, 4].',
        highlightLines: [26, 27, 28, 30, 31, 32, 33, 50],
        state: {
            ...colorNodes({ 0: 'visited', 1: 'current', 2: 'queued', 3: 'queued', 4: 'queued' }, [[1, 3], [1, 4]]),
            adjacencyList: ADJ,
            visited: [0, 1],
            queue: [2, 3, 4],
            currentOp: 'Dequeue 1; enqueue neighbors 3, 4',
        },
    },
    {
        description: 'Dequeue 2. Visit it. Unvisited neighbor: 5. Enqueue 5. Queue: [3, 4, 5].',
        highlightLines: [26, 27, 28, 30, 31, 32, 33, 50],
        state: {
            ...colorNodes({ 0: 'visited', 1: 'visited', 2: 'current', 3: 'queued', 4: 'queued', 5: 'queued' }, [[2, 5]]),
            adjacencyList: ADJ,
            visited: [0, 1, 2],
            queue: [3, 4, 5],
            currentOp: 'Dequeue 2; enqueue neighbor 5',
        },
    },
    {
        description: 'Dequeue 3. Visit it. Its only neighbor 1 is already visited. No new enqueues. Queue: [4, 5].',
        highlightLines: [26, 27, 28, 30, 31, 32, 33, 50],
        state: {
            ...colorNodes({ 0: 'visited', 1: 'visited', 2: 'visited', 3: 'current', 4: 'queued', 5: 'queued' }),
            adjacencyList: ADJ,
            visited: [0, 1, 2, 3],
            queue: [4, 5],
            currentOp: 'Dequeue 3; all neighbors visited',
        },
    },
    {
        description: 'Dequeue 4 (visited), then 5 (visited). Queue empties. BFS complete! Visit order: [0, 1, 2, 3, 4, 5] — level by level. O(V + E) time.',
        highlightLines: [38, 50, 51],
        state: {
            ...colorNodes({ 0: 'visited', 1: 'visited', 2: 'visited', 3: 'visited', 4: 'visited', 5: 'visited' }),
            adjacencyList: ADJ,
            visited: [0, 1, 2, 3, 4, 5],
            queue: [],
            currentOp: 'BFS complete → [0, 1, 2, 3, 4, 5]',
            note: 'Shortest path from 0: dist(0)=0, dist(1)=dist(2)=1, dist(3)=dist(4)=dist(5)=2',
        },
    },
];

// ─── Colors ────────────────────────────────────────────────────

const NODE_COLORS: Record<string, { fill: string; stroke: string; text: string }> = {
    default: { fill: '#161b22', stroke: '#30363d', text: '#8b949e' },
    current: { fill: 'rgba(255,166,87,0.18)', stroke: '#ffa657', text: '#ffa657' },
    visited: { fill: 'rgba(63,185,80,0.15)', stroke: '#3fb950', text: '#3fb950' },
    queued: { fill: 'rgba(0,172,215,0.15)', stroke: '#00ACD7', text: '#00ACD7' },
    path: { fill: 'rgba(210,168,255,0.15)', stroke: '#d2a8ff', text: '#d2a8ff' },
};

// ─── Component ─────────────────────────────────────────────────

export function Graph() {
    const nodeRadius = 20;
    return (
        <VisualizationLayout
            title="Graph (Adjacency List)"
            description="BFS traversal on an undirected graph — level-by-level exploration"
            tag="Data Structures"
            tagColor="bg-[#79c0ff]"
            steps={steps}
            complexity={graphComplexity}
            codeLines={codeLines}
            renderVisual={(state: GraphState) => (
                <div className="w-full max-w-xl space-y-4">

                    {/* Graph SVG */}
                    <div>
                        <p className="text-[#8b949e] text-xs uppercase tracking-wide mb-2">Graph</p>
                        <div className="bg-[#0d1117] border border-[#30363d] rounded-lg p-2">
                            <svg width="100%" height="220" viewBox="0 0 280 220" preserveAspectRatio="xMidYMid meet">
                                {/* Edges */}
                                {state.edges.map((edge, i) => {
                                    const fromNode = state.nodes.find(n => n.id === edge.from)!;
                                    const toNode = state.nodes.find(n => n.id === edge.to)!;
                                    return (
                                        <line
                                            key={i}
                                            x1={fromNode.x} y1={fromNode.y}
                                            x2={toNode.x} y2={toNode.y}
                                            stroke={edge.highlight ? '#ffa657' : '#30363d'}
                                            strokeWidth={edge.highlight ? 2.5 : 1.5}
                                            strokeOpacity={edge.highlight ? 1 : 0.5}
                                        />
                                    );
                                })}
                                {/* Nodes */}
                                {state.nodes.map(node => {
                                    const col = NODE_COLORS[node.highlight ?? 'default'];
                                    return (
                                        <g key={node.id}>
                                            <circle
                                                cx={node.x} cy={node.y} r={nodeRadius}
                                                fill={col.fill}
                                                stroke={col.stroke}
                                                strokeWidth={node.highlight !== 'default' ? 2.5 : 1.5}
                                            />
                                            <text
                                                x={node.x} y={node.y + 1}
                                                textAnchor="middle" dominantBaseline="middle"
                                                fill={col.text}
                                                fontSize="14"
                                                fontWeight="bold"
                                                fontFamily="monospace"
                                            >
                                                {node.label}
                                            </text>
                                        </g>
                                    );
                                })}
                            </svg>
                        </div>
                    </div>

                    {/* Adjacency list */}
                    <div>
                        <p className="text-[#8b949e] text-xs uppercase tracking-wide mb-2">Adjacency list</p>
                        <div className="grid grid-cols-2 gap-1.5 text-xs font-mono">
                            {Object.entries(state.adjacencyList).map(([node, neighbors]) => {
                                const nd = state.nodes.find(n => n.id === Number(node));
                                const col = NODE_COLORS[nd?.highlight ?? 'default'];
                                return (
                                    <div key={node} className="flex items-center gap-2">
                                        <span
                                            className="w-6 h-6 rounded flex items-center justify-center font-bold text-[10px]"
                                            style={{ backgroundColor: col.fill, color: col.text, border: `1.5px solid ${col.stroke}` }}
                                        >
                                            {node}
                                        </span>
                                        <span className="text-[#8b949e]">→</span>
                                        <span className="text-[#e6edf3]">[{neighbors.join(', ')}]</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* BFS state */}
                    <div className="grid grid-cols-2 gap-2">
                        <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-2">
                            <p className="text-[#8b949e] text-[10px] uppercase tracking-wide mb-1">Visited</p>
                            <div className="flex gap-1 flex-wrap">
                                {state.visited.length === 0
                                    ? <span className="text-[#8b949e] text-xs">∅</span>
                                    : state.visited.map(v => (
                                        <span key={v} className="text-[#3fb950] font-mono text-xs bg-[#3fb950]/10 px-1.5 py-0.5 rounded">{v}</span>
                                    ))
                                }
                            </div>
                        </div>
                        <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-2">
                            <p className="text-[#8b949e] text-[10px] uppercase tracking-wide mb-1">Queue</p>
                            <div className="flex gap-1 flex-wrap">
                                {state.queue.length === 0
                                    ? <span className="text-[#8b949e] text-xs">empty</span>
                                    : state.queue.map((v, i) => (
                                        <span key={i} className="text-[#00ACD7] font-mono text-xs bg-[#00ACD7]/10 px-1.5 py-0.5 rounded">{v}</span>
                                    ))
                                }
                            </div>
                        </div>
                    </div>

                    {/* Operation */}
                    {state.currentOp && (
                        <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3">
                            <p className="text-[#8b949e] text-xs uppercase tracking-wide mb-1">Operation</p>
                            <p className="text-[#e6edf3] text-sm font-mono">{state.currentOp}</p>
                        </div>
                    )}

                    {/* Legend */}
                    <div className="flex flex-wrap gap-3 text-xs">
                        {[
                            { label: 'current', color: '#ffa657' },
                            { label: 'queued', color: '#00ACD7' },
                            { label: 'visited', color: '#3fb950' },
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
