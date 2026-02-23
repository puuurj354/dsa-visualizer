import { VisualizationLayout, type Step } from '../../components/VisualizationLayout';
import { type ComplexityInfo } from '../../components/ComplexityCard';

// ─── State types ───────────────────────────────────────────────

interface TrieNodeData {
    char: string;
    isEnd: boolean;
    depth: number;
    x: number;          // layout position
    y: number;
    parentX?: number;
    parentY?: number;
    highlight?: 'active' | 'end' | 'search' | 'found' | 'notfound';
}

interface TrieState {
    nodes: TrieNodeData[];
    insertedWords: string[];
    currentOp?: string;
    searchTarget?: string;
    note?: string;
}

// ─── Code ─────────────────────────────────────────────────────

const codeLines = [
    'package main',
    '',
    'import "fmt"',
    '',
    'type TrieNode struct {',
    '    children [26]*TrieNode',
    '    isEnd    bool',
    '}',
    '',
    'type Trie struct { root *TrieNode }',
    '',
    'func NewTrie() *Trie {',
    '    return &Trie{root: &TrieNode{}}',
    '}',
    '',
    'func (t *Trie) Insert(word string) {',
    '    node := t.root',
    '    for _, ch := range word {',
    '        idx := ch - \'a\'',
    '        if node.children[idx] == nil {',
    '            node.children[idx] = &TrieNode{}',
    '        }',
    '        node = node.children[idx]',
    '    }',
    '    node.isEnd = true',
    '}',
    '',
    'func (t *Trie) Search(word string) bool {',
    '    node := t.root',
    '    for _, ch := range word {',
    '        idx := ch - \'a\'',
    '        if node.children[idx] == nil { return false }',
    '        node = node.children[idx]',
    '    }',
    '    return node.isEnd',
    '}',
    '',
    'func main() {',
    '    t := NewTrie()',
    '    t.Insert("go")',
    '    t.Insert("got")',
    '    t.Insert("get")',
    '    t.Insert("god")',
    '',
    '    fmt.Println(t.Search("go"))  // true',
    '    fmt.Println(t.Search("got")) // true',
    '    fmt.Println(t.Search("gob")) // false',
    '}',
];

// ─── Trie layout ───────────────────────────────────────────────
// We'll hardcode the layout for the known set of words: go, got, get, god
// Root → g → o (end), t(end), d(end)
//           → e → t (end)

const trieComplexity: ComplexityInfo = {
    time: {
        best: 'O(m)', // m = length of key (always traverses full key)
        average: 'O(m)',
        worst: 'O(m)', // always O(m) — independent of dictionary size n
    },
    space: 'O(n·m)', // n words × m average length — but shared prefixes reduce real usage
    notes: 'Insert and Search are strictly O(m) regardless of n. Prefix search and autocomplete are natural — O(m + results). Space is O(ALPHABET × n × m) in the worst case.',
};

type NodeSpec = {
    id: string; char: string; isEnd: boolean;
    x: number; y: number; parentId?: string;
    h?: TrieNodeData['highlight'];
};

function buildNodes(specs: NodeSpec[]): TrieNodeData[] {
    const byId = new Map(specs.map(s => [s.id, s]));
    return specs.map(s => {
        const parent = s.parentId ? byId.get(s.parentId) : undefined;
        return {
            char: s.char, isEnd: s.isEnd,
            depth: s.y / 55,
            x: s.x, y: s.y,
            parentX: parent?.x, parentY: parent?.y,
            highlight: s.h,
        };
    });
}

const ROOT_SPEC = { id: 'root', char: 'root', isEnd: false, x: 140, y: 10 };
const G_SPEC = { id: 'g', char: 'g', isEnd: false, x: 140, y: 65 };
const O_SPEC = { id: 'o', char: 'o', isEnd: true, x: 80, y: 120 };
const E_SPEC = { id: 'e', char: 'e', isEnd: false, x: 200, y: 120 };
const OT_SPEC = { id: 'ot', char: 't', isEnd: true, x: 40, y: 175 };
const OD_SPEC = { id: 'od', char: 'd', isEnd: true, x: 110, y: 175 };
const ET_SPEC = { id: 'et', char: 't', isEnd: true, x: 200, y: 175 };

const ALL_SPECS: NodeSpec[] = [
    ROOT_SPEC,
    { ...G_SPEC, parentId: 'root' },
    { ...O_SPEC, parentId: 'g' },
    { ...E_SPEC, parentId: 'g' },
    { ...OT_SPEC, parentId: 'o' },
    { ...OD_SPEC, parentId: 'o' },
    { ...ET_SPEC, parentId: 'e' },
];

function withHighlights(highlights: Record<string, TrieNodeData['highlight']>): TrieNodeData[] {
    return buildNodes(ALL_SPECS.map(s => ({ ...s, h: highlights[s.id] })));
}

// ─── Steps ─────────────────────────────────────────────────────

const steps: Step<TrieState>[] = [
    {
        description: 'A Trie (prefix tree) stores strings by their common prefixes. Each node represents one character. The root is empty. O(m) insert and search where m = word length.',
        highlightLines: [5, 6, 7, 39],
        state: {
            nodes: buildNodes([ROOT_SPEC]),
            insertedWords: [],
            currentOp: 'Empty Trie — only root node',
        },
    },
    {
        description: '`Insert("go")` — traverse from root, creating nodes for g → o. Mark node o as `isEnd = true` (complete word).',
        highlightLines: [16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 40],
        state: {
            nodes: buildNodes([
                ROOT_SPEC,
                { ...G_SPEC, parentId: 'root', h: 'active' },
                { ...O_SPEC, parentId: 'g', h: 'end' },
            ]),
            insertedWords: ['go'],
            currentOp: 'Insert "go": root → g → o (end)',
        },
    },
    {
        description: '`Insert("got")` — g and o nodes already exist (shared prefix!). Only CREATE a new node for t, then mark t as end.',
        highlightLines: [16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 41],
        state: {
            nodes: buildNodes([
                ROOT_SPEC,
                { ...G_SPEC, parentId: 'root', h: 'active' },
                { ...O_SPEC, parentId: 'g', h: 'active' },
                { ...OT_SPEC, parentId: 'o', h: 'end' },
            ]),
            insertedWords: ['go', 'got'],
            currentOp: 'Insert "got": reuse g→o, add t (end)',
            note: 'Shared prefix "go" stored only once — Trie advantage!',
        },
    },
    {
        description: '`Insert("get")` — g node reused. e is new (branch). t under e is new. Trie branches to represent different second characters (o and e) under g.',
        highlightLines: [16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 42],
        state: {
            nodes: buildNodes([
                ROOT_SPEC,
                { ...G_SPEC, parentId: 'root', h: 'active' },
                { ...O_SPEC, parentId: 'g' },
                { ...E_SPEC, parentId: 'g', h: 'active' },
                { ...OT_SPEC, parentId: 'o' },
                { ...ET_SPEC, parentId: 'e', h: 'end' },
            ]),
            insertedWords: ['go', 'got', 'get'],
            currentOp: 'Insert "get": reuse g, add e → t (end)',
        },
    },
    {
        description: '`Insert("god")` — g and o reused. d is a new child of o. The "go" prefix now has 3 completions: end (go), t (got), d (god).',
        highlightLines: [16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 43],
        state: {
            nodes: withHighlights({ od: 'end' }),
            insertedWords: ['go', 'got', 'get', 'god'],
            currentOp: 'Insert "god": reuse g→o, add d (end)',
        },
    },
    {
        description: '`Search("go")` — walk g → o. Node o has `isEnd = true`. ✅ Found! Search is O(m) — just follow the characters, no comparison needed across the whole dictionary.',
        highlightLines: [28, 29, 30, 31, 32, 33, 34, 35, 45],
        state: {
            nodes: withHighlights({ g: 'search', o: 'found' }),
            insertedWords: ['go', 'got', 'get', 'god'],
            searchTarget: 'go',
            currentOp: 'Search("go"): g → o (isEnd=true) → true',
        },
    },
    {
        description: '`Search("got")` — walk g → o → t. Node t has `isEnd = true`. ✅ Found! Prefix "go" is shared — all 4 words benefit from O(m) lookup.',
        highlightLines: [28, 29, 30, 31, 32, 33, 34, 35, 46],
        state: {
            nodes: withHighlights({ g: 'search', o: 'search', ot: 'found' }),
            insertedWords: ['go', 'got', 'get', 'god'],
            searchTarget: 'got',
            currentOp: 'Search("got"): g → o → t (isEnd=true) → true',
        },
    },
    {
        description: '`Search("gob")` — walk g → o, look for child b. Node b is NULL! ❌ Return false immediately. No wasted traversal through the rest of the trie.',
        highlightLines: [28, 29, 30, 31, 32, 33, 34, 35, 47],
        state: {
            nodes: withHighlights({ g: 'search', o: 'search', ot: 'notfound', od: 'notfound' }),
            insertedWords: ['go', 'got', 'get', 'god'],
            searchTarget: 'gob',
            currentOp: 'Search("gob"): g → o → b? nil → false',
            note: 'Real use: autocomplete, spell-check, IP routing tables',
        },
    },
];

// ─── Colors ────────────────────────────────────────────────────

const NODE_COLORS: Record<string, { fill: string; stroke: string; text: string }> = {
    active: { fill: 'rgba(0,172,215,0.15)', stroke: '#00ACD7', text: '#00ACD7' },
    end: { fill: 'rgba(63,185,80,0.15)', stroke: '#3fb950', text: '#3fb950' },
    search: { fill: 'rgba(255,166,87,0.15)', stroke: '#ffa657', text: '#ffa657' },
    found: { fill: 'rgba(63,185,80,0.2)', stroke: '#3fb950', text: '#3fb950' },
    notfound: { fill: 'rgba(255,123,114,0.15)', stroke: '#ff7b72', text: '#ff7b72' },
    default: { fill: '#161b22', stroke: '#30363d', text: '#8b949e' },
};

// ─── Component ─────────────────────────────────────────────────

export function Trie() {
    const nodeRadius = 18;
    return (
        <VisualizationLayout
            title="Trie (Prefix Tree)"
            description="O(m) insert and search — keys share prefixes, no duplicate storage"
            tag="Data Structures"
            tagColor="bg-[#79c0ff]"
            steps={steps}
            complexity={trieComplexity}
            codeLines={codeLines}
            renderVisual={(state: TrieState) => (
                <div className="w-full max-w-xl space-y-4">

                    {/* Trie tree diagram */}
                    <div>
                        <p className="text-[#8b949e] text-xs uppercase tracking-wide mb-2">Trie structure</p>
                        <div className="bg-[#0d1117] border border-[#30363d] rounded-lg p-2">
                            <svg width="100%" height="220" viewBox="0 0 280 210" preserveAspectRatio="xMidYMid meet">
                                {/* Edges */}
                                {state.nodes.map((node, i) => {
                                    if (node.parentX == null || node.parentY == null) return null;
                                    const col = NODE_COLORS[node.highlight ?? 'default'];
                                    return (
                                        <line
                                            key={`edge-${i}`}
                                            x1={node.parentX} y1={node.parentY}
                                            x2={node.x} y2={node.y}
                                            stroke={col.stroke}
                                            strokeWidth={node.highlight ? 2 : 1.2}
                                            strokeOpacity={node.highlight ? 0.8 : 0.4}
                                        />
                                    );
                                })}
                                {/* Nodes */}
                                {state.nodes.map((node, i) => {
                                    const col = NODE_COLORS[node.highlight ?? 'default'];
                                    const isRoot = node.char === 'root';
                                    return (
                                        <g key={`node-${i}`}>
                                            <circle
                                                cx={node.x} cy={node.y} r={nodeRadius}
                                                fill={col.fill}
                                                stroke={col.stroke}
                                                strokeWidth={node.highlight ? 2.5 : 1.5}
                                            />
                                            <text
                                                x={node.x} y={node.y + 1}
                                                textAnchor="middle" dominantBaseline="middle"
                                                fill={isRoot ? '#8b949e' : col.text}
                                                fontSize={isRoot ? '9' : '14'}
                                                fontWeight="bold"
                                                fontFamily="monospace"
                                            >
                                                {isRoot ? 'root' : node.char}
                                            </text>
                                            {/* isEnd marker */}
                                            {node.isEnd && !isRoot && (
                                                <circle
                                                    cx={node.x + nodeRadius - 5}
                                                    cy={node.y - nodeRadius + 5}
                                                    r={5}
                                                    fill="#3fb950"
                                                />
                                            )}
                                        </g>
                                    );
                                })}
                            </svg>
                        </div>
                        <p className="text-[#8b949e] text-[10px] mt-1">
                            <span className="inline-block w-2 h-2 rounded-full bg-[#3fb950] mr-1" />
                            green dot = word ends here (isEnd)
                        </p>
                    </div>

                    {/* Inserted words */}
                    {state.insertedWords.length > 0 && (
                        <div>
                            <p className="text-[#8b949e] text-xs uppercase tracking-wide mb-2">Inserted words</p>
                            <div className="flex flex-wrap gap-2">
                                {state.insertedWords.map(w => (
                                    <span
                                        key={w}
                                        className="font-mono text-sm px-3 py-1 rounded-lg border"
                                        style={{
                                            borderColor: state.searchTarget === w ? '#3fb950' : '#30363d',
                                            backgroundColor: state.searchTarget === w ? 'rgba(63,185,80,0.1)' : '#161b22',
                                            color: state.searchTarget === w ? '#3fb950' : '#e6edf3',
                                        }}
                                    >
                                        {w}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Operation */}
                    {state.currentOp && (
                        <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3">
                            <p className="text-[#8b949e] text-xs uppercase tracking-wide mb-1">Operation</p>
                            <p className="text-[#e6edf3] text-sm font-mono">{state.currentOp}</p>
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
