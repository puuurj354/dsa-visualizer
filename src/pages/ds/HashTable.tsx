import { VisualizationLayout, type Step } from '../../components/VisualizationLayout';
import { type ComplexityInfo } from '../../components/ComplexityCard';

// ─── State types ───────────────────────────────────────────────

interface Bucket {
    index: number;
    entries: { key: string; value: string; collided?: boolean }[];
    highlighted?: boolean;
}

interface HashTableState {
    buckets: Bucket[];
    currentKey?: string;
    currentHash?: number;
    currentOp?: string;
    note?: string;
    output?: string[];
}

// ─── Code ─────────────────────────────────────────────────────

const codeLines = [
    'package main',
    '',
    'import "fmt"',
    '',
    '// Simple hash table with separate chaining',
    'const BUCKET_COUNT = 7',
    '',
    'type Entry struct {',
    '    key, value string',
    '    next       *Entry  // linked list chain',
    '}',
    '',
    'type HashMap struct {',
    '    buckets [BUCKET_COUNT]*Entry',
    '}',
    '',
    '// hash maps a key to a bucket index',
    'func hash(key string) int {',
    '    h := 0',
    '    for _, c := range key {',
    '        h = (h*31 + int(c)) % BUCKET_COUNT',
    '    }',
    '    return h',
    '}',
    '',
    'func (m *HashMap) Set(key, value string) {',
    '    idx := hash(key)',
    '    // Walk chain to update existing key',
    '    for e := m.buckets[idx]; e != nil; e = e.next {',
    '        if e.key == key { e.value = value; return }',
    '    }',
    '    // Prepend new entry (O(1))',
    '    m.buckets[idx] = &Entry{key, value, m.buckets[idx]}',
    '}',
    '',
    'func (m *HashMap) Get(key string) (string, bool) {',
    '    idx := hash(key)',
    '    for e := m.buckets[idx]; e != nil; e = e.next {',
    '        if e.key == key { return e.value, true }',
    '    }',
    '    return "", false',
    '}',
    '',
    'func main() {',
    '    m := &HashMap{}',
    '    m.Set("name", "Alice")',
    '    m.Set("city", "Jakarta")',
    '    m.Set("lang", "Go")    // may collide!',
    '    m.Set("age",  "25")    // may collide!',
    '',
    '    v, _ := m.Get("name")',
    '    fmt.Println(v) // Alice',
    '}',
];

// ─── Helpers ───────────────────────────────────────────────────

const hashTableComplexity: ComplexityInfo = {
    time: {
        best: 'O(1)',  // key lands in empty bucket
        average: 'O(1)', // with good hash fn & load factor < 0.75
        worst: 'O(n)', // all keys collide into one bucket (bad hash)
    },
    space: 'O(n)',
    notes: 'Average O(1) depends on a good hash function and low load factor. Go\'s built-in map uses open addressing + incremental rehashing.',
};

function simplehash(key: string, buckets = 7): number {
    let h = 0;
    for (let i = 0; i < key.length; i++) {
        h = (h * 31 + key.charCodeAt(i)) % buckets;
    }
    return h;
}

function emptyBuckets(n = 7): Bucket[] {
    return Array.from({ length: n }, (_, i) => ({ index: i, entries: [] }));
}

function insertKey(
    prev: Bucket[],
    key: string,
    value: string,
    highlighted?: number,
): Bucket[] {
    const idx = simplehash(key);
    return prev.map(b => {
        if (b.index !== idx) return { ...b, highlighted: b.index === highlighted };
        const existing = b.entries.some(e => e.key === key);
        const entries = existing
            ? b.entries.map(e => e.key === key ? { ...e, value } : e)
            : [{ key, value, collided: b.entries.length > 0 }, ...b.entries];
        return { ...b, entries, highlighted: b.index === highlighted };
    });
}

// ─── Steps ─────────────────────────────────────────────────────

const steps: Step<HashTableState>[] = [
    {
        description: 'A Hash Table maps keys to values in O(1) average time. Keys are hashed to a BUCKET index. When two keys hash to the same bucket, a COLLISION occurs — handled by chaining (linked list).',
        highlightLines: [5, 6, 13, 14, 45],
        state: { buckets: emptyBuckets(), currentOp: '7 empty buckets (indices 0–6)' },
    },
    {
        description: '`hash("name")` — each character\'s ASCII value is combined: h = (h*31 + char) % 7. For "name": h lands on bucket 1. The 31 multiplier distributes keys evenly.',
        highlightLines: [18, 19, 20, 21, 22, 23, 46],
        state: {
            buckets: emptyBuckets().map(b => ({ ...b, highlighted: b.index === 1 })),
            currentKey: 'name',
            currentHash: simplehash('name'),
            currentOp: `hash("name") = ${simplehash('name')}`,
        },
    },
    {
        description: '`Set("name", "Alice")` — bucket 1 is empty, so prepend a new Entry. O(1).',
        highlightLines: [26, 27, 33, 46],
        state: {
            buckets: insertKey(emptyBuckets(), 'name', 'Alice', simplehash('name')),
            currentKey: 'name',
            currentHash: simplehash('name'),
            currentOp: 'Inserted "name"→"Alice" at bucket ' + simplehash('name'),
        },
    },
    {
        description: '`Set("city", "Jakarta")` — hash("city") maps to bucket 3. No collision, direct insert.',
        highlightLines: [26, 27, 33, 47],
        state: {
            buckets: insertKey(insertKey(emptyBuckets(), 'name', 'Alice'), 'city', 'Jakarta', simplehash('city')),
            currentKey: 'city',
            currentHash: simplehash('city'),
            currentOp: `hash("city") = ${simplehash('city')} → bucket ${simplehash('city')}`,
        },
    },
    {
        description: '`Set("lang", "Go")` — if hash("lang") equals an occupied bucket, a COLLISION happens. The new entry is PREPENDED to the chain (linked list). Both entries remain accessible.',
        highlightLines: [26, 27, 33, 48],
        state: (() => {
            let b = emptyBuckets();
            b = insertKey(b, 'name', 'Alice');
            b = insertKey(b, 'city', 'Jakarta');
            b = insertKey(b, 'lang', 'Go', simplehash('lang'));
            return {
                buckets: b,
                currentKey: 'lang',
                currentHash: simplehash('lang'),
                currentOp: `hash("lang") = ${simplehash('lang')} → ${simplehash('lang') === simplehash('name') || simplehash('lang') === simplehash('city') ? 'COLLISION!' : 'no collision'}`,
                note: 'Chaining: new entry prepended to bucket list',
            };
        })(),
    },
    {
        description: '`Set("age", "25")` — another insert. The table grows with O(1) average cost per insertion. Worst case O(n) if all keys collide (bad hash function).',
        highlightLines: [26, 27, 33, 49],
        state: (() => {
            let b = emptyBuckets();
            b = insertKey(b, 'name', 'Alice');
            b = insertKey(b, 'city', 'Jakarta');
            b = insertKey(b, 'lang', 'Go');
            b = insertKey(b, 'age', '25', simplehash('age'));
            return {
                buckets: b,
                currentKey: 'age',
                currentHash: simplehash('age'),
                currentOp: `hash("age") = ${simplehash('age')} → bucket ${simplehash('age')}`,
            };
        })(),
    },
    {
        description: '`Get("name")` — hash("name") = bucket 1. Walk the chain until key matches. Found in O(1) average (1-entry chain). Returns "Alice".',
        highlightLines: [36, 37, 38, 39, 51, 52],
        state: (() => {
            let b = emptyBuckets();
            b = insertKey(b, 'name', 'Alice');
            b = insertKey(b, 'city', 'Jakarta');
            b = insertKey(b, 'lang', 'Go');
            b = insertKey(b, 'age', '25');
            b = b.map(bk => ({ ...bk, highlighted: bk.index === simplehash('name') }));
            return {
                buckets: b,
                currentKey: 'name',
                currentHash: simplehash('name'),
                currentOp: `Get("name"): bucket ${simplehash('name')} → found!`,
                output: ['Alice'],
            };
        })(),
    },
    {
        description: 'Final state: 4 entries distributed across 7 buckets. Load factor = 4/7 ≈ 0.57. When load factor exceeds ~0.75, Go\'s built-in map doubles capacity and rehashes.',
        highlightLines: [46, 47, 48, 49, 51, 52],
        state: (() => {
            let b = emptyBuckets();
            b = insertKey(b, 'name', 'Alice');
            b = insertKey(b, 'city', 'Jakarta');
            b = insertKey(b, 'lang', 'Go');
            b = insertKey(b, 'age', '25');
            return {
                buckets: b,
                currentOp: 'Load factor 4/7 ≈ 0.57 — healthy distribution',
                note: 'Go\'s built-in map uses open addressing (not chaining) for better cache performance',
            };
        })(),
    },
];

// ─── Component ─────────────────────────────────────────────────

export function HashTable() {
    return (
        <VisualizationLayout
            title="Hash Table"
            description="O(1) average key-value lookup using hash function + separate chaining for collisions"
            tag="Data Structures"
            tagColor="bg-[#79c0ff]"
            steps={steps}
            complexity={hashTableComplexity}
            codeLines={codeLines}
            renderVisual={(state: HashTableState) => (
                <div className="w-full max-w-xl space-y-4">

                    {/* Hash function indicator */}
                    {state.currentKey && (
                        <div className="bg-[#00ACD7]/10 border border-[#00ACD7]/30 rounded-lg p-3">
                            <div className="flex items-center gap-3 font-mono text-sm">
                                <span className="text-[#8b949e]">hash(</span>
                                <span className="text-[#e6edf3]">"{state.currentKey}"</span>
                                <span className="text-[#8b949e]">)</span>
                                <span className="text-[#8b949e]">=</span>
                                <span className="text-[#00ACD7] font-bold text-lg">{state.currentHash}</span>
                            </div>
                        </div>
                    )}

                    {/* Buckets */}
                    <div>
                        <p className="text-[#8b949e] text-xs uppercase tracking-wide mb-2">
                            Buckets (separate chaining)
                        </p>
                        <div className="space-y-1.5">
                            {state.buckets.map(bucket => (
                                <div
                                    key={bucket.index}
                                    className="flex gap-2 transition-all duration-300"
                                >
                                    {/* Bucket index */}
                                    <div
                                        className="w-8 h-9 rounded border-2 flex-shrink-0 flex items-center justify-center font-mono text-xs transition-all duration-300"
                                        style={{
                                            borderColor: bucket.highlighted ? '#ffa657' : '#30363d',
                                            backgroundColor: bucket.highlighted ? 'rgba(255,166,87,0.12)' : '#161b22',
                                            color: bucket.highlighted ? '#ffa657' : '#8b949e',
                                        }}
                                    >
                                        {bucket.index}
                                    </div>

                                    {/* Chain entries */}
                                    <div className="flex items-center gap-1 flex-wrap">
                                        {bucket.entries.length === 0 ? (
                                            <div className="h-9 px-3 rounded border border-dashed border-[#30363d] flex items-center">
                                                <span className="text-[#8b949e] text-xs">nil</span>
                                            </div>
                                        ) : (
                                            bucket.entries.map((entry, ei) => (
                                                <div key={ei} className="flex items-center gap-1">
                                                    <div
                                                        className="h-9 px-3 rounded border-2 flex items-center gap-1.5 transition-all duration-300"
                                                        style={{
                                                            borderColor: entry.collided ? '#ff7b72' : (bucket.highlighted ? '#ffa657' : '#79c0ff'),
                                                            backgroundColor: entry.collided ? 'rgba(255,123,114,0.1)' : (bucket.highlighted ? 'rgba(255,166,87,0.08)' : 'rgba(121,192,255,0.08)'),
                                                        }}
                                                    >
                                                        <span className="font-mono text-xs text-[#79c0ff]">{entry.key}</span>
                                                        <span className="text-[#30363d]">:</span>
                                                        <span className="font-mono text-xs text-[#3fb950]">{entry.value}</span>
                                                        {entry.collided && (
                                                            <span className="text-[10px] text-[#ff7b72] ml-0.5">⚡</span>
                                                        )}
                                                    </div>
                                                    {ei < bucket.entries.length - 1 && (
                                                        <span className="text-[#58a6ff] text-sm">→</span>
                                                    )}
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Operation status */}
                    {state.currentOp && (
                        <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3">
                            <p className="text-[#8b949e] text-xs uppercase tracking-wide mb-1">Operation</p>
                            <p className="text-[#e6edf3] text-sm font-mono">{state.currentOp}</p>
                        </div>
                    )}

                    {/* Output */}
                    {state.output && state.output.length > 0 && (
                        <div className="bg-[#0d1117] border border-[#30363d] rounded-lg p-3">
                            <p className="text-[#8b949e] text-xs uppercase tracking-wide mb-2">Output</p>
                            {state.output.map((line, i) => (
                                <p key={i} className="text-[#3fb950] font-mono text-xs">{line}</p>
                            ))}
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
