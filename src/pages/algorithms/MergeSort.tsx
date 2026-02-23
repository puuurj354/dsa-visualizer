import { VisualizationLayout, type Step } from '../../components/VisualizationLayout';
import type { ComplexityInfo } from '../../components/ComplexityCard';

interface MergeBar {
  value: number;
  state: 'idle' | 'dividing' | 'merging' | 'comparing' | 'placing' | 'sorted';
  depth: number;
}

interface MergeBlock {
  values: number[];
  label: string;
  state: 'active' | 'merging' | 'sorted' | 'idle';
  left?: number[];
  right?: number[];
}

interface MergeSortState {
  bars: MergeBar[];
  phase: 'divide' | 'merge' | 'done';
  divideTree: MergeBlock[];
  comparingL?: number;
  comparingR?: number;
  comparingResult?: '<' | '>';
  mergeBuffer?: number[];
  depthLabel: string;
  comparisons: number;
  note?: string;
}

const codeLines = [
  'package main',
  '',
  'import "fmt"',
  '',
  'func mergeSort(arr []int) []int {',
  '    if len(arr) <= 1 {',
  '        return arr  // base case',
  '    }',
  '    mid := len(arr) / 2',
  '',
  '    // Divide: split into two halves',
  '    left  := mergeSort(arr[:mid])',
  '    right := mergeSort(arr[mid:])',
  '',
  '    // Conquer: merge sorted halves',
  '    return merge(left, right)',
  '}',
  '',
  'func merge(left, right []int) []int {',
  '    result := []int{}',
  '    i, j := 0, 0',
  '    for i < len(left) && j < len(right) {',
  '        if left[i] <= right[j] {',
  '            result = append(result, left[i])',
  '            i++',
  '        } else {',
  '            result = append(result, right[j])',
  '            j++',
  '        }',
  '    }',
  '    result = append(result, left[i:]...)',
  '    result = append(result, right[j:]...)',
  '    return result',
  '}',
  '',
  'func main() {',
  '    arr := []int{38, 27, 43, 3, 9, 82, 10}',
  '    fmt.Println(mergeSort(arr))',
  '}',
];

const INIT = [38, 27, 43, 3, 9, 82, 10];
const MAX_VAL = 90;

/** Complexity data for Merge Sort — O(n log n) in all cases */
const mergeSortComplexity: ComplexityInfo = {
  time: {
    best: 'O(n log n)', // Cannot be improved even if already sorted
    average: 'O(n log n)', // Always divides log n times, merges n per level
    worst: 'O(n log n)', // Consistent regardless of input order
  },
  space: 'O(n)',          // Requires extra array for merging at each level
  notes: 'Stable sort: equal elements maintain their relative order.',
};

function makeBar(value: number, state: MergeBar['state'] = 'idle', depth = 0): MergeBar {
  return { value, state, depth };
}

const steps: Step<MergeSortState>[] = [
  {
    description: 'Initial array [38, 27, 43, 3, 9, 82, 10]. Merge Sort uses divide-and-conquer: recursively SPLIT in half until single elements, then MERGE back in sorted order. O(n log n) guaranteed.',
    highlightLines: [5, 6, 35, 36],
    state: {
      bars: INIT.map(v => makeBar(v)),
      phase: 'divide',
      divideTree: [{ values: INIT, label: 'Input', state: 'active' }],
      depthLabel: 'Level 0 — full array',
      comparisons: 0,
    },
  },
  {
    description: 'DIVIDE phase: split [38,27,43,3,9,82,10] at mid=3 into [38,27,43] and [3,9,82,10]. mergeSort() is called recursively on each half.',
    highlightLines: [6, 9, 12, 13, 35, 36],
    state: {
      bars: INIT.map((v, i) => makeBar(v, i < 3 ? 'dividing' : 'idle')),
      phase: 'divide',
      divideTree: [
        { values: INIT, label: 'mergeSort([38,27,43,3,9,82,10])', state: 'active', left: [38, 27, 43], right: [3, 9, 82, 10] },
        { values: [38, 27, 43], label: 'mergeSort([38,27,43])', state: 'active' },
        { values: [3, 9, 82, 10], label: 'mergeSort([3,9,82,10])', state: 'idle' },
      ],
      depthLabel: 'Level 1 — split into halves',
      comparisons: 0,
      note: 'mid = len(arr)/2 = 7/2 = 3',
    },
  },
  {
    description: 'Recursively divide [38,27,43] → [38] and [27,43]. Keep splitting until every subarray has 1 element (base case: len ≤ 1).',
    highlightLines: [6, 7, 9, 12, 13, 35, 36],
    state: {
      bars: INIT.map((v, i) => makeBar(v, i === 0 ? 'sorted' : i < 3 ? 'dividing' : 'idle')),
      phase: 'divide',
      divideTree: [
        { values: INIT, label: 'mergeSort([38,27,43,3,9,82,10])', state: 'idle', left: [38, 27, 43], right: [3, 9, 82, 10] },
        { values: [38, 27, 43], label: 'mergeSort([38,27,43])', state: 'active', left: [38], right: [27, 43] },
        { values: [38], label: '[38] ← base case', state: 'sorted' },
        { values: [27, 43], label: 'mergeSort([27,43])', state: 'active' },
        { values: [27], label: '[27] ← base case', state: 'sorted' },
        { values: [43], label: '[43] ← base case', state: 'sorted' },
      ],
      depthLabel: 'Level 2-3 — down to single elements',
      comparisons: 0,
      note: 'Base case: single element is already sorted',
    },
  },
  {
    description: 'MERGE phase begins: merge([27],[43]) — compare 27 vs 43. 27 ≤ 43 → take 27 into result. Then take remaining 43.',
    highlightLines: [19, 20, 21, 22, 23, 24, 35, 36],
    state: {
      bars: INIT.map((v, i) => makeBar(v, i === 1 || i === 2 ? 'comparing' : i === 0 ? 'sorted' : 'idle')),
      phase: 'merge',
      divideTree: [
        { values: [27, 43], label: 'merge([27],[43])', state: 'merging', left: [27], right: [43] },
      ],
      comparingL: 27,
      comparingR: 43,
      comparingResult: '<',
      mergeBuffer: [27, 43],
      depthLabel: 'Merging [27] + [43]',
      comparisons: 1,
      note: '27 ≤ 43 → take from left. Result: [27, 43]',
    },
  },
  {
    description: 'Now merge([38], [27,43]) — compare 38 vs 27. 38 > 27 → take 27. Then compare 38 vs 43: 38 ≤ 43 → take 38. Remaining [43] appended.',
    highlightLines: [22, 23, 24, 25, 26, 27, 28, 31, 32, 35, 36],
    state: {
      bars: INIT.map((v, i) => makeBar(v, i < 3 ? 'merging' : 'idle')),
      phase: 'merge',
      divideTree: [
        { values: [27, 38, 43], label: 'merge([38],[27,43]) → [27,38,43]', state: 'sorted', left: [38], right: [27, 43] },
      ],
      comparingL: 38,
      comparingR: 27,
      comparingResult: '>',
      mergeBuffer: [27, 38, 43],
      depthLabel: 'Merging [38] + [27,43]',
      comparisons: 3,
      note: '38 > 27 → take right. 38 ≤ 43 → take left. Append [43].',
    },
  },
  {
    description: 'Left half fully sorted: [27, 38, 43] ✓. Now recursively sort the right half [3,9,82,10] — same process: split into [3,9] and [82,10], then single elements.',
    highlightLines: [12, 13, 6, 7, 35, 36],
    state: {
      bars: INIT.map((v, i) => makeBar(v, i < 3 ? 'sorted' : i < 7 ? 'dividing' : 'idle')),
      phase: 'divide',
      divideTree: [
        { values: [27, 38, 43], label: '✓ [27, 38, 43]', state: 'sorted' },
        { values: [3, 9, 82, 10], label: 'mergeSort([3,9,82,10])', state: 'active', left: [3, 9], right: [82, 10] },
        { values: [3], label: '[3] ← base case', state: 'sorted' },
        { values: [9], label: '[9] ← base case', state: 'sorted' },
        { values: [82], label: '[82] ← base case', state: 'sorted' },
        { values: [10], label: '[10] ← base case', state: 'sorted' },
      ],
      depthLabel: 'Splitting right half → single elements',
      comparisons: 3,
    },
  },
  {
    description: 'merge([3],[9]) → [3,9]. merge([82],[10]): 82 > 10 → take 10, then 82. Result: [10,82]. Both right sub-halves sorted.',
    highlightLines: [22, 23, 24, 25, 26, 27, 28, 35, 36],
    state: {
      bars: INIT.map((v, i) => makeBar(v, i < 3 ? 'sorted' : 'merging')),
      phase: 'merge',
      divideTree: [
        { values: [27, 38, 43], label: '✓ [27, 38, 43]', state: 'sorted' },
        { values: [3, 9], label: 'merge([3],[9]) → [3,9]', state: 'sorted', left: [3], right: [9] },
        { values: [10, 82], label: 'merge([82],[10]) → [10,82]', state: 'sorted', left: [82], right: [10] },
      ],
      comparingL: 82,
      comparingR: 10,
      comparingResult: '>',
      mergeBuffer: [3, 9, 10, 82],
      depthLabel: 'Merging pairs in right half',
      comparisons: 5,
      note: '82 > 10 → take right (10), then append left (82)',
    },
  },
  {
    description: 'merge([3,9],[10,82]): compare pairs — 3≤10 take 3, 9≤10 take 9, then append [10,82]. Right half sorted: [3,9,10,82] ✓',
    highlightLines: [22, 23, 24, 25, 26, 27, 28, 31, 32, 35, 36],
    state: {
      bars: INIT.map((v, i) => makeBar(v, i < 3 ? 'sorted' : 'merging')),
      phase: 'merge',
      divideTree: [
        { values: [27, 38, 43], label: '✓ [27, 38, 43]', state: 'sorted' },
        { values: [3, 9, 10, 82], label: 'merge([3,9],[10,82]) → [3,9,10,82]', state: 'sorted', left: [3, 9], right: [10, 82] },
      ],
      comparingL: 3,
      comparingR: 10,
      comparingResult: '<',
      mergeBuffer: [3, 9, 10, 82],
      depthLabel: 'Right half merged: [3,9,10,82]',
      comparisons: 7,
      note: '3 ≤ 10 → left, 9 ≤ 10 → left, append [10,82]',
    },
  },
  {
    description: 'FINAL MERGE: merge([27,38,43],[3,9,10,82]). Compare element by element — always take the smaller. This is the last merge call.',
    highlightLines: [15, 16, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 35, 36],
    state: {
      bars: INIT.map(v => makeBar(v, 'merging')),
      phase: 'merge',
      divideTree: [
        { values: [27, 38, 43], label: 'LEFT: [27, 38, 43]', state: 'active', left: [27, 38, 43] },
        { values: [3, 9, 10, 82], label: 'RIGHT: [3, 9, 10, 82]', state: 'active', right: [3, 9, 10, 82] },
        { values: [3, 9, 10, 27, 38, 43, 82], label: 'merge(...) in progress...', state: 'merging' },
      ],
      comparingL: 27,
      comparingR: 3,
      comparingResult: '>',
      mergeBuffer: [3, 9, 10, 27],
      depthLabel: 'Final merge of both halves',
      comparisons: 10,
      note: 'merge picks smaller: 3, 9, 10, 27, 38, 43, 82',
    },
  },
  {
    description: 'Sorting COMPLETE! Final sorted array: [3, 9, 10, 27, 38, 43, 82]. Merge Sort is stable, O(n log n) in all cases — best, average, and worst.',
    highlightLines: [15, 16, 35, 36],
    state: {
      bars: [3, 9, 10, 27, 38, 43, 82].map(v => makeBar(v, 'sorted')),
      phase: 'done',
      divideTree: [
        { values: [3, 9, 10, 27, 38, 43, 82], label: '✓ [3, 9, 10, 27, 38, 43, 82] — sorted!', state: 'sorted' },
      ],
      depthLabel: 'Done! O(n log n)',
      comparisons: 13,
      note: '✅ Stable sort | O(n log n) always | O(n) extra space',
    },
  },
];

const barStateColor: Record<string, string> = {
  idle: '#00ACD7',
  dividing: '#ffa657',
  merging: '#d2a8ff',
  comparing: '#f85149',
  placing: '#79c0ff',
  sorted: '#3fb950',
};

const blockStateStyle: Record<MergeBlock['state'], { border: string; bg: string; text: string }> = {
  active: { border: '#ffa657', bg: 'rgba(255,166,87,0.1)', text: '#ffa657' },
  merging: { border: '#d2a8ff', bg: 'rgba(210,168,255,0.1)', text: '#d2a8ff' },
  sorted: { border: '#3fb950', bg: 'rgba(63,185,80,0.08)', text: '#3fb950' },
  idle: { border: '#30363d', bg: 'transparent', text: '#8b949e' },
};

export function MergeSort() {
  return (
    <VisualizationLayout
      title="Merge Sort"
      description="Divide-and-conquer: recursively split, then merge sorted halves — O(n log n)"
      tag="Algorithms"
      tagColor="bg-[#ffa657]"
      steps={steps}
      codeLines={codeLines}
      complexity={mergeSortComplexity}
      renderVisual={(state: MergeSortState) => (
        <div className="w-full max-w-xl space-y-4">

          {/* Phase badge */}
          <div className="flex items-center gap-3">
            <span
              className="px-3 py-1 rounded-full text-xs font-mono"
              style={{
                backgroundColor: state.phase === 'divide' ? 'rgba(255,166,87,0.15)' : state.phase === 'merge' ? 'rgba(210,168,255,0.15)' : 'rgba(63,185,80,0.15)',
                color: state.phase === 'divide' ? '#ffa657' : state.phase === 'merge' ? '#d2a8ff' : '#3fb950',
                border: `1px solid ${state.phase === 'divide' ? 'rgba(255,166,87,0.4)' : state.phase === 'merge' ? 'rgba(210,168,255,0.4)' : 'rgba(63,185,80,0.4)'}`,
              }}
            >
              {state.phase === 'divide' ? '✂ DIVIDE' : state.phase === 'merge' ? '⟵⟶ MERGE' : '✅ DONE'}
            </span>
            <span className="text-[#8b949e] text-xs">{state.depthLabel}</span>
            <span className="ml-auto text-xs text-[#8b949e]">comparisons: <span className="text-[#00ACD7] font-mono">{state.comparisons}</span></span>
          </div>

          {/* Bar chart */}
          <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-4">
            <div className="flex items-end gap-1.5 h-44 justify-center">
              {state.bars.map((bar, idx) => {
                const col = barStateColor[bar.state] ?? '#00ACD7';
                const heightPct = (bar.value / MAX_VAL) * 100;
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-[10px] font-mono" style={{ color: col }}>{bar.value}</span>
                    <div
                      className="w-full rounded-t-md transition-all duration-400"
                      style={{
                        height: `${heightPct}%`,
                        backgroundColor: col,
                        boxShadow: bar.state === 'comparing' || bar.state === 'merging' ? `0 0 10px ${col}70` : 'none',
                        transform: bar.state === 'comparing' ? 'scaleY(1.04)' : 'scaleY(1)',
                      }}
                    />
                    <span className="text-[9px] text-[#8b949e]">[{idx}]</span>
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t border-[#30363d]">
              {[
                { color: '#00ACD7', label: 'Idle' },
                { color: '#ffa657', label: 'Dividing' },
                { color: '#d2a8ff', label: 'Merging' },
                { color: '#f85149', label: 'Comparing' },
                { color: '#3fb950', label: 'Sorted' },
              ].map(l => (
                <div key={l.label} className="flex items-center gap-1.5 text-xs">
                  <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: l.color }} />
                  <span className="text-[#8b949e]">{l.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Active comparison */}
          {state.comparingL !== undefined && state.comparingR !== undefined && (
            <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3">
              <p className="text-[#8b949e] text-xs uppercase tracking-wide mb-2">Current Comparison</p>
              <div className="flex items-center justify-center gap-4">
                <div className="bg-[#d2a8ff]/10 border border-[#d2a8ff]/30 rounded-lg px-5 py-2 text-center">
                  <p className="text-[#8b949e] text-xs">left</p>
                  <p className="text-[#d2a8ff] font-mono text-2xl">{state.comparingL}</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl" style={{ color: state.comparingResult === '<' ? '#3fb950' : '#f85149' }}>
                    {state.comparingResult}
                  </p>
                  <p className="text-[10px]" style={{ color: state.comparingResult === '<' ? '#3fb950' : '#f85149' }}>
                    {state.comparingResult === '<' ? 'take left' : 'take right'}
                  </p>
                </div>
                <div className="bg-[#d2a8ff]/10 border border-[#d2a8ff]/30 rounded-lg px-5 py-2 text-center">
                  <p className="text-[#8b949e] text-xs">right</p>
                  <p className="text-[#d2a8ff] font-mono text-2xl">{state.comparingR}</p>
                </div>
              </div>
              {state.mergeBuffer && (
                <div className="mt-2 text-center">
                  <span className="text-[#8b949e] text-xs">result buffer: </span>
                  <span className="font-mono text-xs text-[#3fb950]">[{state.mergeBuffer.join(', ')}]</span>
                </div>
              )}
            </div>
          )}

          {/* Divide tree / active subproblems */}
          <div>
            <p className="text-[#8b949e] text-xs uppercase tracking-wide mb-2">Subproblem Stack</p>
            <div className="space-y-1.5">
              {state.divideTree.map((block, i) => {
                const style = blockStateStyle[block.state];
                return (
                  <div
                    key={i}
                    className="rounded-lg border px-3 py-2 transition-all duration-300 flex items-center justify-between gap-3"
                    style={{ borderColor: style.border, backgroundColor: style.bg }}
                  >
                    <span className="font-mono text-xs" style={{ color: style.text }}>{block.label}</span>
                    <div className="flex gap-1 flex-shrink-0">
                      {block.values.map((v, j) => (
                        <span
                          key={j}
                          className="w-7 h-6 rounded flex items-center justify-center text-[10px] font-mono"
                          style={{ backgroundColor: `${style.border}20`, color: style.text }}
                        >
                          {v}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Note */}
          {state.note && (
            <div
              className="border rounded-lg p-3"
              style={{
                backgroundColor: state.note.startsWith('✅') ? 'rgba(63,185,80,0.08)' : 'rgba(0,172,215,0.08)',
                borderColor: state.note.startsWith('✅') ? 'rgba(63,185,80,0.35)' : 'rgba(0,172,215,0.35)',
              }}
            >
              <p className="text-xs" style={{ color: state.note.startsWith('✅') ? '#3fb950' : '#00ACD7' }}>
                {state.note}
              </p>
            </div>
          )}

          {/* Complexity card */}
          <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3">
            <p className="text-[#8b949e] text-xs uppercase tracking-wide mb-2">Complexity</p>
            <div className="grid grid-cols-3 gap-2 text-xs text-center">
              {[
                { label: 'Best', val: 'O(n log n)', color: '#3fb950' },
                { label: 'Average', val: 'O(n log n)', color: '#ffa657' },
                { label: 'Worst', val: 'O(n log n)', color: '#f85149' },
              ].map(c => (
                <div key={c.label} className="bg-[#0d1117] border border-[#30363d] rounded p-2">
                  <p className="text-[#8b949e] mb-0.5">{c.label}</p>
                  <p className="font-mono" style={{ color: c.color }}>{c.val}</p>
                </div>
              ))}
            </div>
            <p className="text-[#8b949e] text-xs mt-2">Space: O(n) — extra array for merging. Stable sort ✓</p>
          </div>
        </div>
      )}
    />
  );
}
