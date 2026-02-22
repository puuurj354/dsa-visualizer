import { VisualizationLayout, type Step } from '../../components/VisualizationLayout';

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

const arr = [2, 5, 8, 12, 16, 23, 38, 42, 57, 72];
const target = 23;

function buildSteps(): Step<BSState>[] {
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

const steps = buildSteps();

export function BinarySearch() {
  return (
    <VisualizationLayout
      title="Binary Search"
      description="O(log n) search on a sorted array by halving the search space"
      tag="Algorithms"
      tagColor="bg-[#ffa657]"
      steps={steps}
      codeLines={codeLines}
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
              For n=10, max {Math.ceil(Math.log2(arr.length))} comparisons.
            </div>
          </div>
        </div>
      )}
    />
  );
}
