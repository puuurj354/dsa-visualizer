import { VisualizationLayout, type Step } from '../../components/VisualizationLayout';

interface SliceState {
  items: number[];
  len: number;
  cap: number;
  highlightIdx: number;
  sliceStart?: number;
  sliceEnd?: number;
  subSlice?: number[];
  label: string;
}

const codeLines = [
  'package main',
  '',
  'import "fmt"',
  '',
  'func main() {',
  '    // Array (fixed size)',
  '    arr := [5]int{1, 2, 3, 4, 5}',
  '',
  '    // Slice (dynamic)',
  '    s := []int{10, 20, 30}',
  '    fmt.Println(len(s), cap(s)) // 3 3',
  '',
  '    // append grows the slice',
  '    s = append(s, 40)',
  '    fmt.Println(len(s), cap(s)) // 4 6',
  '',
  '    s = append(s, 50, 60)',
  '    fmt.Println(len(s), cap(s)) // 6 6',
  '',
  '    // Slicing: s[1:4]',
  '    sub := s[1:4]',
  '    fmt.Println(sub) // [20 30 40]',
  '',
  '    // Access by index',
  '    fmt.Println(s[0]) // 10',
  '}',
];

const steps: Step<SliceState>[] = [
  { description: 'Arrays in Go have a fixed size declared at compile time.', highlightLines: [7], state: { items: [1,2,3,4,5], len: 5, cap: 5, highlightIdx: -1, label: 'arr [5]int' } },
  { description: 'Create a slice s with 3 elements. len=3, cap=3. Slices are backed by an underlying array.', highlightLines: [10], state: { items: [10,20,30], len: 3, cap: 3, highlightIdx: -1, label: 's []int' } },
  { description: 'len(s)=3, cap(s)=3. len is the number of elements, cap is the allocated capacity.', highlightLines: [11], state: { items: [10,20,30], len: 3, cap: 3, highlightIdx: -1, label: 's []int' } },
  { description: 'append(s, 40) — capacity is exceeded! Go allocates a new larger backing array (doubles cap to 6) and copies data.', highlightLines: [14], state: { items: [10,20,30,40], len: 4, cap: 6, highlightIdx: 3, label: 's after append 40' } },
  { description: 'Now len=4, cap=6. There are 2 extra slots pre-allocated to avoid frequent reallocations.', highlightLines: [15], state: { items: [10,20,30,40,0,0], len: 4, cap: 6, highlightIdx: 3, label: 's (cap=6, extra slots)' } },
  { description: 'append(s, 50, 60) — append multiple values. Fits within existing cap (4+2=6).', highlightLines: [17], state: { items: [10,20,30,40,50,60], len: 6, cap: 6, highlightIdx: 4, label: 's after append 50,60' } },
  { description: 'len=6, cap=6. Slice is now full. Next append would trigger reallocation.', highlightLines: [18], state: { items: [10,20,30,40,50,60], len: 6, cap: 6, highlightIdx: 5, label: 's fully used' } },
  { description: 'Slicing: s[1:4] creates a new slice header pointing to the SAME underlying array. Indices 1,2,3 (inclusive:exclusive).', highlightLines: [21], state: { items: [10,20,30,40,50,60], len: 6, cap: 6, highlightIdx: -1, sliceStart: 1, sliceEnd: 4, subSlice: [20,30,40], label: 's[1:4]' } },
  { description: 'sub = [20, 30, 40]. Modifying sub would also modify s since they share the same array!', highlightLines: [22], state: { items: [10,20,30,40,50,60], len: 6, cap: 6, highlightIdx: -1, sliceStart: 1, sliceEnd: 4, subSlice: [20,30,40], label: 'sub = s[1:4]' } },
  { description: 's[0] accesses the element at index 0 → 10.', highlightLines: [25], state: { items: [10,20,30,40,50,60], len: 6, cap: 6, highlightIdx: 0, label: 's[0] = 10' } },
];

export function ArraysSlices() {
  return (
    <VisualizationLayout
      title="Arrays & Slices"
      description="Fixed arrays, dynamic slices, append, and slicing operations"
      tag="Data Structures"
      tagColor="bg-[#79c0ff]"
      steps={steps}
      codeLines={codeLines}
      renderVisual={(state: SliceState) => (
        <div className="w-full max-w-2xl space-y-5">
          {/* Label */}
          <p className="text-[#8b949e] text-xs uppercase tracking-wide">{state.label}</p>

          {/* Slice visualization */}
          <div className="space-y-2">
            <div className="flex gap-1.5">
              {state.items.map((val, idx) => {
                const isActive = state.highlightIdx === idx;
                const inSubSlice = state.sliceStart !== undefined && idx >= state.sliceStart && idx < (state.sliceEnd ?? 0);
                const isEmpty = idx >= state.len;
                return (
                  <div key={idx} className="flex flex-col items-center flex-1">
                    <div
                      className="w-full h-14 flex items-center justify-center rounded-lg border-2 font-mono text-sm transition-all duration-300"
                      style={{
                        borderColor: isActive ? '#00ACD7' : inSubSlice ? '#ffa657' : isEmpty ? '#30363d33' : '#30363d',
                        backgroundColor: isActive ? 'rgba(0,172,215,0.15)' : inSubSlice ? 'rgba(255,166,87,0.1)' : isEmpty ? '#0d1117' : '#161b22',
                        color: isActive ? '#00ACD7' : inSubSlice ? '#ffa657' : isEmpty ? '#30363d' : '#e6edf3',
                        transform: isActive ? 'scale(1.08)' : 'scale(1)',
                      }}
                    >
                      {isEmpty ? '·' : val}
                    </div>
                    <span className="text-[#8b949e] text-xs mt-1">[{idx}]</span>
                  </div>
                );
              })}
            </div>

            {/* Sub-slice bracket */}
            {state.sliceStart !== undefined && state.sliceEnd !== undefined && (
              <div className="flex">
                {state.items.map((_, idx) => (
                  <div key={idx} className="flex-1 flex justify-center">
                    {idx === state.sliceStart && (
                      <span className="text-[#ffa657] text-xs">s[{state.sliceStart}:</span>
                    )}
                    {idx === (state.sliceEnd! - 1) && state.sliceStart !== state.sliceEnd! - 1 && (
                      <span className="text-[#ffa657] text-xs">{state.sliceEnd}]</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* len / cap bars */}
          <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-4 space-y-3">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-[#3fb950]">len = {state.len}</span>
                <span className="text-[#8b949e]">used elements</span>
              </div>
              <div className="h-3 bg-[#0d1117] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#3fb950] rounded-full transition-all duration-500"
                  style={{ width: `${(state.len / state.cap) * 100}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-[#ffa657]">cap = {state.cap}</span>
                <span className="text-[#8b949e]">allocated capacity</span>
              </div>
              <div className="h-3 bg-[#0d1117] rounded-full overflow-hidden">
                <div className="h-full bg-[#ffa657] rounded-full w-full" />
              </div>
            </div>
          </div>

          {/* Sub slice result */}
          {state.subSlice && (
            <div className="bg-[#ffa657]/10 border border-[#ffa657]/30 rounded-lg p-4">
              <p className="text-[#ffa657] text-xs mb-2 uppercase tracking-wide">sub = s[{state.sliceStart}:{state.sliceEnd}]</p>
              <div className="flex gap-2">
                {state.subSlice.map((v, i) => (
                  <div key={i} className="w-12 h-12 flex items-center justify-center rounded-lg bg-[#ffa657]/20 border border-[#ffa657]/40 font-mono text-[#ffa657]">
                    {v}
                  </div>
                ))}
              </div>
              <p className="text-[#8b949e] text-xs mt-2">⚠️ Shares underlying array with s</p>
            </div>
          )}
        </div>
      )}
    />
  );
}
