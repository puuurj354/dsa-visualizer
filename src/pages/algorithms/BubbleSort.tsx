import { VisualizationLayout, type Step } from '../../components/VisualizationLayout';

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

function generateSteps(): Step<SortState>[] {
  const initial = [64, 34, 25, 12, 22];
  const steps: Step<SortState>[] = [];
  const arr = [...initial];
  const sorted: number[] = [];
  let swapCount = 0;

  steps.push({
    description: 'Initial array: [64, 34, 25, 12, 22]. Bubble sort compares adjacent elements and swaps if out of order.',
    highlightLines: [23],
    state: { arr: [...arr], comparing: null, sorted: [], pass: 0, swapCount: 0 },
  });

  const n = arr.length;
  for (let i = 0; i < n - 1; i++) {
    steps.push({
      description: `Pass ${i + 1}: Bubbling the largest unsorted element to position ${n - 1 - i}.`,
      highlightLines: [7, 8],
      state: { arr: [...arr], comparing: null, sorted: [...sorted], pass: i + 1, swapCount },
    });
    let swapped = false;
    for (let j = 0; j < n - 1 - i; j++) {
      steps.push({
        description: `Compare arr[${j}]=${arr[j]} and arr[${j + 1}]=${arr[j + 1]}: ${arr[j] > arr[j + 1] ? '> swap!' : '≤ no swap'}`,
        highlightLines: [9, 10],
        state: { arr: [...arr], comparing: [j, j + 1], sorted: [...sorted], pass: i + 1, swapCount, swapped: arr[j] > arr[j + 1] },
      });
      if (arr[j] > arr[j + 1]) {
        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
        swapped = true;
        swapCount++;
        steps.push({
          description: `Swapped! arr[${j}] ↔ arr[${j + 1}]. Array is now: [${arr.join(', ')}]`,
          highlightLines: [11, 12],
          state: { arr: [...arr], comparing: [j, j + 1], sorted: [...sorted], pass: i + 1, swapCount, swapped: true },
        });
      }
    }
    sorted.unshift(n - 1 - i);
    steps.push({
      description: swapped
        ? `Pass ${i + 1} complete. Element ${arr[n - 1 - i]} is now in its final sorted position.`
        : `Pass ${i + 1}: No swaps were made — array is already sorted! Early exit.`,
      highlightLines: [14, 15, 16],
      state: { arr: [...arr], comparing: null, sorted: [...sorted], pass: i + 1, swapCount },
    });
    if (!swapped) break;
  }

  if (!sorted.includes(0)) {
    steps.push({
      description: `Sorting complete! All ${n} elements are sorted. Total swaps: ${swapCount}.`,
      highlightLines: [18, 19],
      state: { arr: [...arr], comparing: null, sorted: Array.from({ length: n }, (_, i) => i), pass: n - 1, swapCount },
    });
  }

  return steps;
}

const steps = generateSteps();

const MAX_VAL = 70;

export function BubbleSort() {
  return (
    <VisualizationLayout
      title="Bubble Sort"
      description="Compare adjacent elements, swap if out of order, repeat"
      tag="Algorithms"
      tagColor="bg-[#ffa657]"
      steps={steps}
      codeLines={codeLines}
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
