import { VisualizationLayout, type Step } from '../../components/VisualizationLayout';
import type { ComplexityInfo } from '../../components/ComplexityCard';

interface MapState {
  entries: { key: string; value: string | number; highlight?: 'add' | 'del' | 'get' }[];
  result?: string;
  ok?: boolean;
}

const codeLines = [
  'package main',
  '',
  'import "fmt"',
  '',
  'func main() {',
  '    // Create a map',
  '    m := make(map[string]int)',
  '',
  '    // Add key-value pairs',
  '    m["apple"]  = 5',
  '    m["banana"] = 3',
  '    m["cherry"] = 8',
  '',
  '    // Access a value',
  '    val := m["apple"]',
  '    fmt.Println(val) // 5',
  '',
  '    // Check existence (comma-ok idiom)',
  '    v, ok := m["banana"]',
  '    fmt.Println(v, ok) // 3 true',
  '',
  '    // Missing key returns zero value',
  '    v2, ok2 := m["grape"]',
  '    fmt.Println(v2, ok2) // 0 false',
  '',
  '    // Delete a key',
  '    delete(m, "banana")',
  '',
  '    // Iterate',
  '    for k, v := range m {',
  '        fmt.Println(k, v)',
  '    }',
  '}',
];

const steps: Step<MapState>[] = [
  { description: 'Create an empty map with make(map[string]int). Keys are strings, values are ints.', highlightLines: [7], state: { entries: [] } },
  { description: 'm["apple"] = 5 — insert key "apple" with value 5 into the hash map.', highlightLines: [10], state: { entries: [{ key: 'apple', value: 5, highlight: 'add' }] } },
  { description: 'm["banana"] = 3 — insert key "banana" with value 3.', highlightLines: [11], state: { entries: [{ key: 'apple', value: 5 }, { key: 'banana', value: 3, highlight: 'add' }] } },
  { description: 'm["cherry"] = 8 — insert key "cherry" with value 8.', highlightLines: [12], state: { entries: [{ key: 'apple', value: 5 }, { key: 'banana', value: 3 }, { key: 'cherry', value: 8, highlight: 'add' }] } },
  { description: 'val := m["apple"] — look up key "apple". Found! Returns 5.', highlightLines: [15], state: { entries: [{ key: 'apple', value: 5, highlight: 'get' }, { key: 'banana', value: 3 }, { key: 'cherry', value: 8 }], result: '5' } },
  { description: 'v, ok := m["banana"] — comma-ok idiom: v=3, ok=true. Always use this to check if key exists!', highlightLines: [19], state: { entries: [{ key: 'apple', value: 5 }, { key: 'banana', value: 3, highlight: 'get' }, { key: 'cherry', value: 8 }], result: '3', ok: true } },
  { description: 'v2, ok2 := m["grape"] — key "grape" does NOT exist. v2=0 (zero value), ok2=false.', highlightLines: [23], state: { entries: [{ key: 'apple', value: 5 }, { key: 'banana', value: 3 }, { key: 'cherry', value: 8 }], result: '0 (zero value)', ok: false } },
  { description: 'delete(m, "banana") — removes the "banana" key from the map.', highlightLines: [27], state: { entries: [{ key: 'apple', value: 5 }, { key: 'banana', value: 3, highlight: 'del' }, { key: 'cherry', value: 8 }] } },
  { description: '"banana" has been deleted from the map. Only "apple" and "cherry" remain.', highlightLines: [27], state: { entries: [{ key: 'apple', value: 5 }, { key: 'cherry', value: 8 }] } },
  { description: 'for k, v := range m — iterate over all remaining key-value pairs. Note: Go maps have no guaranteed iteration order!', highlightLines: [30, 31], state: { entries: [{ key: 'apple', value: 5, highlight: 'get' }, { key: 'cherry', value: 8, highlight: 'get' }] } },
];

const highlightStyles = {
  add: { border: '#3fb950', bg: 'rgba(63,185,80,0.1)', label: '+ added', labelColor: '#3fb950' },
  del: { border: '#f85149', bg: 'rgba(248,81,73,0.1)', label: '× deleted', labelColor: '#f85149' },
  get: { border: '#00ACD7', bg: 'rgba(0,172,215,0.1)', label: '→ accessed', labelColor: '#00ACD7' },
};

function hashBucket(key: string): number {
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) % 8;
  return h;
}

/** Map complexity: O(1) average for all operations using hash function */
const mapComplexity: ComplexityInfo = {
  time: {
    best: 'O(1)', // Hash computed in constant time, no collision
    average: 'O(1)', // Average case with a good hash function
    worst: 'O(n)', // Extreme hash collisions cause linear probing
  },
  space: 'O(n)',    // Proportional to the number of key-value pairs
  notes: 'Go maps use a hash table internally. Order of iteration is randomized.',
};

export function Maps() {
  return (
    <VisualizationLayout
      title="Maps (Hash Maps)"
      description="Go maps: creation, insertion, lookup, deletion, and the comma-ok idiom"
      tag="Data Structures"
      tagColor="bg-[#79c0ff]"
      steps={steps}
      codeLines={codeLines}
      complexity={mapComplexity}
      renderVisual={(state: MapState) => (
        <div className="w-full max-w-xl space-y-5">
          {/* Hash buckets visualization */}
          <div>
            <p className="text-[#8b949e] text-xs uppercase tracking-wide mb-3">Hash Map Internals (8 buckets)</p>
            <div className="grid grid-cols-8 gap-1 mb-3">
              {Array.from({ length: 8 }, (_, i) => {
                const entry = state.entries.find(e => hashBucket(e.key) === i && e.highlight !== 'del');
                return (
                  <div key={i} className="flex flex-col items-center">
                    <div
                      className="w-full h-10 rounded border flex items-center justify-center text-xs font-mono transition-all duration-300"
                      style={{
                        borderColor: entry ? (entry.highlight ? highlightStyles[entry.highlight].border : '#30363d') : '#30363d',
                        backgroundColor: entry ? (entry.highlight ? highlightStyles[entry.highlight].bg : '#161b22') : '#0d1117',
                        color: entry ? '#e6edf3' : '#30363d',
                      }}
                    >
                      {entry ? entry.key.slice(0, 3) : '·'}
                    </div>
                    <span className="text-[#8b949e] text-[10px] mt-0.5">{i}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Key-value entries */}
          <div className="space-y-2">
            <p className="text-[#8b949e] text-xs uppercase tracking-wide">Map Entries</p>
            {state.entries.length === 0 && (
              <div className="text-center py-8 text-[#8b949e] bg-[#161b22] rounded-xl border border-[#30363d]">
                Empty map
              </div>
            )}
            {state.entries.map((entry) => {
              const style = entry.highlight ? highlightStyles[entry.highlight] : null;
              return (
                <div
                  key={entry.key}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg border-2 transition-all duration-300"
                  style={{
                    borderColor: style ? style.border : '#30363d',
                    backgroundColor: style ? style.bg : '#161b22',
                  }}
                >
                  <div className="w-8 h-8 rounded bg-[#0d1117] border border-[#30363d] flex items-center justify-center text-[#8b949e] text-xs">
                    {hashBucket(entry.key)}
                  </div>
                  <div className="flex-1 flex items-center gap-3 font-mono">
                    <span className="text-[#a5d6ff]">"{entry.key}"</span>
                    <span className="text-[#8b949e]">:</span>
                    <span className="text-[#ffa657] text-lg">{entry.value}</span>
                  </div>
                  {style && (
                    <span className="text-xs px-2 py-0.5 rounded" style={{ color: style.labelColor, backgroundColor: `${style.border}20` }}>
                      {style.label}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Result */}
          {state.result !== undefined && (
            <div
              className="flex items-center gap-3 p-3 rounded-lg border"
              style={{
                borderColor: state.ok === false ? '#f85149' : '#3fb950',
                backgroundColor: state.ok === false ? 'rgba(248,81,73,0.08)' : 'rgba(63,185,80,0.08)',
              }}
            >
              <span className="text-[#8b949e] text-sm">Result:</span>
              <span className="font-mono text-[#e6edf3]">{state.result}</span>
              {state.ok !== undefined && (
                <span className="ml-auto font-mono text-sm" style={{ color: state.ok ? '#3fb950' : '#f85149' }}>
                  ok={state.ok ? 'true' : 'false'}
                </span>
              )}
            </div>
          )}
        </div>
      )}
    />
  );
}
