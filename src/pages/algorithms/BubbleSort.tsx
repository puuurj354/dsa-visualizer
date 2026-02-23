import { VisualizationLayout, type Step } from '../../components/VisualizationLayout';
import type { ComplexityInfo } from '../../components/ComplexityCard';
import type { EditableInputConfig } from '../../components/EditableInputPanel';

interface SortState {
  arr: number[];
  comparing: [number, number] | null;
  sorted: number[];
  swapped?: boolean;
  pass: number;
  swapCount: number;
}

const codeLines = [
  'package main',
  '',
  'import "fmt"',
  '',
  'func bubbleSort(arr []int) []int {',
  '    n := len(arr)',
  '    for i := 0; i < n-1; i++ {',
  '        swapped := false',
  '        for j := 0; j < n-1-i; j++ {',
  '            if arr[j] > arr[j+1] {',
  '                arr[j], arr[j+1] = arr[j+1], arr[j]',
  '                swapped = true',
  '            }',
  '        }',
  '        if !swapped {',
  '            break  // already sorted',
  '        }',
  '    }',
  '    return arr',
  '}',
  '',
  'func main() {',
  '    arr := []int{64, 34, 25, 12, 22}',
  '    sorted := bubbleSort(arr)',
  '    fmt.Println(sorted)',
  '}',
];

/**
 * generateSteps
 * Builds the full step sequence for Bubble Sort given an initial array.
 * Accepts a custom array so the editable input feature can regenerate
 * steps without modifying the core algorithm logic.
 *
 * @param initial - The unsorted array to visualize
 * @returns       - Array of Step<SortState> for the VisualizationLayout
 */
function generateSteps(initial: number[]): Step<SortState>[] {

  const steps: Step<SortState>[] = [];
  const arr = [...initial];
  const sorted: number[] = [];
  let swapCount = 0;

  steps.push({
    description: 'Initial array: [64, 34, 25, 12, 22]. Bubble sort compares adjacent elements and swaps if out of order.',
    highlightLines: [5, 6, 23, 24],
    state: { arr: [...arr], comparing: null, sorted: [], pass: 0, swapCount: 0 },
  });

  const n = arr.length;
  for (let i = 0; i < n - 1; i++) {
    steps.push({
      description: `Pass ${i + 1}: Bubbling the largest unsorted element to position ${n - 1 - i}.`,
      highlightLines: [7, 8, 23, 24],
      state: { arr: [...arr], comparing: null, sorted: [...sorted], pass: i + 1, swapCount },
    });
    let swapped = false;
    for (let j = 0; j < n - 1 - i; j++) {
      steps.push({
        description: `Compare arr[${j}]=${arr[j]} and arr[${j + 1}]=${arr[j + 1]}: ${arr[j] > arr[j + 1] ? '> swap!' : '≤ no swap'}`,
        highlightLines: [9, 10, 23, 24],
        state: { arr: [...arr], comparing: [j, j + 1], sorted: [...sorted], pass: i + 1, swapCount, swapped: arr[j] > arr[j + 1] },
      });
      if (arr[j] > arr[j + 1]) {
        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
        swapped = true;
        swapCount++;
        steps.push({
          description: `Swapped! arr[${j}] ↔ arr[${j + 1}]. Array is now: [${arr.join(', ')}]`,
          highlightLines: [11, 12, 23, 24],
          state: { arr: [...arr], comparing: [j, j + 1], sorted: [...sorted], pass: i + 1, swapCount, swapped: true },
        });
      }
    }
    sorted.unshift(n - 1 - i);
    steps.push({
      description: swapped
        ? `Pass ${i + 1} complete. Element ${arr[n - 1 - i]} is now in its final sorted position.`
        : `Pass ${i + 1}: No swaps were made — array is already sorted! Early exit.`,
      highlightLines: [14, 15, 16, 23, 24],
      state: { arr: [...arr], comparing: null, sorted: [...sorted], pass: i + 1, swapCount },
    });
    if (!swapped) break;
  }

  if (!sorted.includes(0)) {
    steps.push({
      description: `Sorting complete! All ${n} elements are sorted. Total swaps: ${swapCount}.`,
      highlightLines: [18, 19, 23, 24, 25],
      state: { arr: [...arr], comparing: null, sorted: Array.from({ length: n }, (_, i) => i), pass: n - 1, swapCount },
    });
  }

  return steps;
}

// ─── Default steps (hardcoded initial array) ──────────────────
const DEFAULT_INITIAL = [64, 34, 25, 12, 22]; // Default dataset shown on first load
const defaultSteps = generateSteps(DEFAULT_INITIAL);

// ─── Complexity info for the Complexity Card ──────────────────
const bubbleSortComplexity: ComplexityInfo = {
  time: {
    best: 'O(n)',   // Already sorted — only one pass needed
    average: 'O(n²)', // Average case: many comparisons and swaps
    worst: 'O(n²)', // Reverse-sorted array
  },
  space: 'O(1)',      // In-place sort: only a few variables extra
  notes: 'Early exit optimization: stops if no swaps in a pass.',
};

// ─── Editable Input Configuration ─────────────────────────────
const bubbleSortInput: EditableInputConfig<SortState> = {
  label: 'Custom array:',
  placeholder: 'e.g. 64, 34, 25, 12, 22',

  /**
   * validate — ensures the raw input is a comma-separated list of
   * integers between 1 and 999, with at most 10 elements.
   * Returns null if valid, or an error message string if invalid.
   *
   * @param raw - The raw string from the input field
   * @returns   - Error message | null
   */
  validate(raw: string): string | null {
    const parts = raw.split(',').map(s => s.trim()).filter(Boolean); // Split and clean
    if (parts.length < 2) return 'Enter at least 2 numbers.';         // Min 2 for comparison
    if (parts.length > 10) return 'Maximum 10 elements allowed.';      // Keep visual manageable
    for (const p of parts) {
      const n = Number(p);
      if (!Number.isInteger(n) || n < 1 || n > 999) {                 // Strict integer check
        return `"${p}" is not a valid integer (1–999).`;
      }
    }
    return null; // All checks passed
  },

  /**
   * generateSteps — converts the validated input string into steps.
   * Re-uses the core generateSteps function so the algorithm logic
   * is never duplicated.
   *
   * @param raw - Valid comma-separated integer string
   * @returns   - Step<SortState>[] for the new custom input
   */
  generateSteps(raw: string): Step<SortState>[] {
    const arr = raw.split(',').map(s => parseInt(s.trim(), 10)); // Parse integers
    return generateSteps(arr);                                    // Re-use core logic
  },
};

const MAX_VAL = 70;

export function BubbleSort() {
  return (
    <VisualizationLayout
      title="Bubble Sort"
      description="Compare adjacent elements, swap if out of order, repeat"
      tag="Algorithms"
      tagColor="bg-[#ffa657]"
      steps={defaultSteps}
      codeLines={codeLines}
      complexity={bubbleSortComplexity}
      editableInput={bubbleSortInput}
      editableDefaultValue="64, 34, 25, 12, 22"
      renderVisual={(state: SortState) => (
        <div className="w-full max-w-lg space-y-5">
          {/* Bar chart */}
          <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-4">
            <div className="flex items-end gap-2 h-48 justify-center">
              {state.arr.map((val, idx) => {
                const isComparing = state.comparing && (idx === state.comparing[0] || idx === state.comparing[1]);
                const isSorted = state.sorted.includes(idx);
                const isSwapping = isComparing && state.swapped;
                const heightPct = (val / MAX_VAL) * 100;
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-xs font-mono" style={{ color: isSwapping ? '#f85149' : isComparing ? '#ffa657' : isSorted ? '#3fb950' : '#8b949e' }}>
                      {val}
                    </span>
                    <div
                      className="w-full rounded-t-md transition-all duration-300"
                      style={{
                        height: `${heightPct}%`,
                        backgroundColor: isSwapping ? '#f85149' : isComparing ? '#ffa657' : isSorted ? '#3fb950' : '#00ACD7',
                        boxShadow: isComparing ? `0 0 12px ${isSwapping ? '#f85149' : '#ffa657'}60` : undefined,
                        transform: isComparing ? 'scaleY(1.03)' : 'scaleY(1)',
                      }}
                    />
                    <span className="text-[10px] text-[#8b949e]">[{idx}]</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Comparison arrows */}
          {state.comparing && (
            <div className="flex items-center justify-center gap-3 bg-[#161b22] border border-[#30363d] rounded-lg p-3">
              <div className="bg-[#ffa657]/10 border border-[#ffa657]/30 rounded-lg px-4 py-2 text-center">
                <p className="text-[#8b949e] text-xs">[{state.comparing[0]}]</p>
                <p className="text-[#ffa657] font-mono text-xl">{state.arr[state.comparing[0]]}</p>
              </div>
              <div className="text-center">
                <p className="text-[#8b949e] text-xs mb-1">compare</p>
                <p className="text-lg">{state.swapped ? '>' : '≤'}</p>
                <p className="text-[10px]" style={{ color: state.swapped ? '#f85149' : '#3fb950' }}>
                  {state.swapped ? 'SWAP!' : 'no swap'}
                </p>
              </div>
              <div className="bg-[#ffa657]/10 border border-[#ffa657]/30 rounded-lg px-4 py-2 text-center">
                <p className="text-[#8b949e] text-xs">[{state.comparing[1]}]</p>
                <p className="text-[#ffa657] font-mono text-xl">{state.arr[state.comparing[1]]}</p>
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3 text-center">
              <p className="text-[#8b949e] text-xs mb-1">Pass</p>
              <p className="text-[#00ACD7] font-mono text-xl">{state.pass}</p>
            </div>
            <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3 text-center">
              <p className="text-[#8b949e] text-xs mb-1">Swaps</p>
              <p className="text-[#f85149] font-mono text-xl">{state.swapCount}</p>
            </div>
            <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3 text-center">
              <p className="text-[#8b949e] text-xs mb-1">Sorted</p>
              <p className="text-[#3fb950] font-mono text-xl">{state.sorted.length}</p>
            </div>
          </div>

          {/* Legend */}
          <div className="flex gap-4 text-xs">
            {[
              { color: '#00ACD7', label: 'Unsorted' },
              { color: '#ffa657', label: 'Comparing' },
              { color: '#f85149', label: 'Swapping' },
              { color: '#3fb950', label: 'Sorted' },
            ].map(l => (
              <div key={l.label} className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded" style={{ backgroundColor: l.color }} />
                <span className="text-[#8b949e]">{l.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    />
  );
}
