import { VisualizationLayout, type Step } from '../../components/VisualizationLayout';
import type { ComplexityInfo } from '../../components/ComplexityCard';
import type { EditableInputConfig } from '../../components/EditableInputPanel';

interface BSState {
  arr: number[];
  left: number;
  right: number;
  mid: number;
  target: number;
  found: boolean | null;
  eliminated: number[];
}

const codeLines = [
  'package main',
  '',
  'import "fmt"',
  '',
  'func binarySearch(arr []int, target int) int {',
  '    left, right := 0, len(arr)-1',
  '',
  '    for left <= right {',
  '        mid := left + (right-left)/2',
  '',
  '        if arr[mid] == target {',
  '            return mid',
  '        } else if arr[mid] < target {',
  '            left = mid + 1',
  '        } else {',
  '            right = mid - 1',
  '        }',
  '    }',
  '    return -1',
  '}',
  '',
  'func main() {',
  '    arr := []int{2, 5, 8, 12, 16, 23, 38, 42, 57, 72}',
  '    idx := binarySearch(arr, 23)',
  '    fmt.Println(idx) // 5',
  '}',
];

// ─── Default dataset ──────────────────────────────────────────
const DEFAULT_ARR = [2, 5, 8, 12, 16, 23, 38, 42, 57, 72]; // Sorted array for default demo
const DEFAULT_TARGET = 23;                                    // Default search target

/**
 * buildSteps
 * Generates visualization steps for Binary Search given a sorted array and target.
 * Extracted into a standalone function so `editableInput.generateSteps` can call
 * it with custom data without duplicating algorithm logic.
 *
 * @param arr    - Pre-sorted integer array to search in
 * @param target - The integer value to search for
 * @returns      - Array of Step<BSState>
 */
function buildSteps(arr: number[], target: number): Step<BSState>[] {
  const steps: Step<BSState>[] = [];
  const eliminated: number[] = [];
  let left = 0;
  let right = arr.length - 1;

  steps.push({
    description: `Search for target=${target} in sorted array. Initialize left=0, right=${arr.length - 1}.`,
    highlightLines: [5, 6],
    state: { arr, left, right, mid: -1, target, found: null, eliminated: [] },
  });

  while (left <= right) {
    const mid = left + Math.floor((right - left) / 2);
    steps.push({
      description: `mid = left + (right-left)/2 = ${left} + (${right}-${left})/2 = ${mid}. arr[${mid}] = ${arr[mid]}.`,
      highlightLines: [8, 9],
      state: { arr, left, right, mid, target, found: null, eliminated: [...eliminated] },
    });

    if (arr[mid] === target) {
      steps.push({
        description: `arr[${mid}] = ${arr[mid]} == target(${target})! Found at index ${mid}. Return ${mid}.`,
        highlightLines: [11, 12],
        state: { arr, left, right, mid, target, found: true, eliminated: [...eliminated] },
      });
      break;
    } else if (arr[mid] < target) {
      steps.push({
        description: `arr[${mid}]=${arr[mid]} < target(${target}). Target is in the RIGHT half. left = mid+1 = ${mid + 1}.`,
        highlightLines: [13, 14],
        state: { arr, left, right, mid, target, found: null, eliminated: [...eliminated] },
      });
      for (let i = left; i <= mid; i++) eliminated.push(i);
      left = mid + 1;
    } else {
      steps.push({
        description: `arr[${mid}]=${arr[mid]} > target(${target}). Target is in the LEFT half. right = mid-1 = ${mid - 1}.`,
        highlightLines: [15, 16],
        state: { arr, left, right, mid, target, found: null, eliminated: [...eliminated] },
      });
      for (let i = mid; i <= right; i++) eliminated.push(i);
      right = mid - 1;
    }
  }

  return steps;
}

// ─── Default steps ────────────────────────────────────────────
const defaultSteps = buildSteps(DEFAULT_ARR, DEFAULT_TARGET);

// ─── Complexity info for the Complexity Card ──────────────────
const binarySearchComplexity: ComplexityInfo = {
  time: {
    best: 'O(1)',      // Target is the very first mid element checked
    average: 'O(log n)', // Halves the search space each iteration
    worst: 'O(log n)', // Target not found — log₂(n) iterations max
  },
  space: 'O(1)',         // Iterative approach uses only pointer variables
  notes: 'Requires a pre-sorted array. Beats linear search after ~20 elements.',
};

// ─── Editable Input Configuration ─────────────────────────────
const binarySearchInput: EditableInputConfig<BSState> = {
  label: 'Sorted array, target:',
  placeholder: 'e.g. 2, 5, 8, 12, 16, 23 | 23',

  /**
   * validate — expects two parts separated by "|": the sorted array and the target.
   * Format: "1, 2, 3, 4 | 3"
   *
   * @param raw - Raw input string
   * @returns   - Error string | null
   */
  validate(raw: string): string | null {
    const [arrPart, targetPart] = raw.split('|').map(s => s.trim()); // Split by pipe
    if (!arrPart || !targetPart) return 'Format: sorted numbers | target  e.g. 2,5,8 | 5';
    const nums = arrPart.split(',').map(s => parseInt(s.trim(), 10));  // Parse array
    if (nums.some(isNaN)) return 'Array must contain only integers.';
    if (nums.length < 2) return 'Array must have at least 2 elements.';
    if (nums.length > 12) return 'Maximum 12 elements allowed.';
    // Verify the array is sorted
    for (let i = 1; i < nums.length; i++) {
      if (nums[i] < nums[i - 1]) return 'Array must be sorted in ascending order.';
    }
    const target = parseInt(targetPart, 10);
    if (isNaN(target)) return 'Target must be an integer.';
    return null; // Valid
  },

  /**
   * generateSteps — parses array and target from the validated pipe-separated input.
   *
   * @param raw - Valid pipe-separated input string
   * @returns   - Step<BSState>[]
   */
  generateSteps(raw: string): Step<BSState>[] {
    const [arrPart, targetPart] = raw.split('|').map(s => s.trim());
    const arr = arrPart.split(',').map(s => parseInt(s.trim(), 10)); // Parse array
    const target = parseInt(targetPart.trim(), 10);                   // Parse target
    return buildSteps(arr, target);
  },
};

export function BinarySearch() {
  return (
    <VisualizationLayout
      title="Binary Search"
      description="O(log n) search on a sorted array by halving the search space"
      tag="Algorithms"
      tagColor="bg-[#ffa657]"
      steps={defaultSteps}
      codeLines={codeLines}
      complexity={binarySearchComplexity}
      editableInput={binarySearchInput}
      editableDefaultValue="2, 5, 8, 12, 16, 23, 38, 42, 57, 72 | 23"
      renderVisual={(state: BSState) => (
        <div className="w-full max-w-2xl space-y-5">
          {/* Target */}
          <div className="flex items-center gap-3">
            <span className="text-[#8b949e] text-sm">Looking for:</span>
            <div className="bg-[#d2a8ff]/10 border border-[#d2a8ff]/40 rounded-lg px-4 py-1.5 font-mono text-[#d2a8ff] text-lg">
              {state.target}
            </div>
          </div>

          {/* Array visualization */}
          <div>
            <div className="flex gap-1">
              {state.arr.map((val, idx) => {
                const isMid = idx === state.mid;
                const isElim = state.eliminated.includes(idx);
                const inRange = idx >= state.left && idx <= state.right;
                const isFound = isMid && state.found;
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                    {/* Pointer labels */}
                    <div className="h-5 flex items-end justify-center gap-0.5">
                      {idx === state.left && <span className="text-[10px] text-[#3fb950]">L</span>}
                      {idx === state.mid && state.mid >= 0 && <span className="text-[10px] text-[#00ACD7]">M</span>}
                      {idx === state.right && <span className="text-[10px] text-[#ffa657]">R</span>}
                    </div>
                    <div
                      className="w-full h-12 flex items-center justify-center rounded-lg border-2 font-mono text-sm transition-all duration-300"
                      style={{
                        borderColor: isFound ? '#3fb950' : isMid ? '#00ACD7' : isElim ? '#30363d33' : inRange ? '#30363d' : '#30363d33',
                        backgroundColor: isFound ? 'rgba(63,185,80,0.2)' : isMid ? 'rgba(0,172,215,0.2)' : isElim ? '#0d1117' : inRange ? '#161b22' : '#0d1117',
                        color: isFound ? '#3fb950' : isMid ? '#00ACD7' : isElim ? '#30363d' : inRange ? '#e6edf3' : '#30363d',
                        transform: isMid ? 'scale(1.08)' : 'scale(1)',
                        boxShadow: isFound ? '0 0 12px rgba(63,185,80,0.4)' : isMid ? '0 0 12px rgba(0,172,215,0.3)' : undefined,
                      }}
                    >
                      {val}
                    </div>
                    <span className="text-[8px] text-[#8b949e]">[{idx}]</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Pointers */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { name: 'left', val: state.left, color: '#3fb950' },
              { name: 'mid', val: state.mid, color: '#00ACD7' },
              { name: 'right', val: state.right, color: '#ffa657' },
            ].map(p => (
              <div key={p.name} className="bg-[#161b22] border border-[#30363d] rounded-lg p-3 text-center">
                <p className="text-xs mb-1" style={{ color: p.color }}>{p.name}</p>
                <p className="font-mono text-xl text-[#e6edf3]">{p.val >= 0 ? p.val : '—'}</p>
                <p className="text-xs text-[#8b949e]">{p.val >= 0 && p.val < state.arr.length ? `= ${state.arr[p.val]}` : ''}</p>
              </div>
            ))}
          </div>

          {/* Result */}
          {state.found !== null && state.found && (
            <div className="p-3 rounded-lg bg-[#3fb950]/10 border border-[#3fb950]/30 text-center">
              <span className="text-[#3fb950] font-mono">Found {state.target} at index {state.mid} ✓</span>
            </div>
          )}

          {/* Complexity note */}
          <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3 flex items-center gap-4 text-sm">
            <div className="text-center">
              <p className="text-[#8b949e] text-xs">Time</p>
              <p className="text-[#3fb950] font-mono">O(log n)</p>
            </div>
            <div className="text-center">
              <p className="text-[#8b949e] text-xs">Space</p>
              <p className="text-[#3fb950] font-mono">O(1)</p>
            </div>
            <div className="flex-1 text-[#8b949e] text-xs">
              Each step eliminates <span className="text-[#ffa657]">half</span> the remaining elements.
              For n={state.arr.length}, max {Math.ceil(Math.log2(state.arr.length))} comparisons.
            </div>
          </div>
        </div>
      )}
    />
  );
}
