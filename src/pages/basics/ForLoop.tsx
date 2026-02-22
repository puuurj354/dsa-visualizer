import { VisualizationLayout, type Step } from '../../components/VisualizationLayout';

interface ForState {
  mode: 'classic' | 'while' | 'range';
  array: number[];
  currentIndex: number;
  i: number;
  sum: number;
  output: string[];
  done: boolean;
}

const codeLines = [
  'package main',
  '',
  'import "fmt"',
  '',
  'func main() {',
  '    nums := []int{10, 20, 30, 40, 50}',
  '',
  '    // Classic C-style for loop',
  '    sum := 0',
  '    for i := 0; i < len(nums); i++ {',
  '        sum += nums[i]',
  '    }',
  '    fmt.Println("Sum:", sum)',
  '',
  '    // While-style loop',
  '    i := 0',
  '    for i < 3 {',
  '        fmt.Println(i)',
  '        i++',
  '    }',
  '',
  '    // Range loop',
  '    for idx, val := range nums {',
  '        fmt.Printf("%d: %d\\n", idx, val)',
  '    }',
  '}',
];

const arr = [10, 20, 30, 40, 50];

function buildSteps(): Step<ForState>[] {
  const steps: Step<ForState>[] = [];

  steps.push({
    description: 'Declare nums slice with 5 elements.',
    highlightLines: [6],
    state: { mode: 'classic', array: arr, currentIndex: -1, i: -1, sum: 0, output: [], done: false },
  });

  steps.push({
    description: 'Initialize sum = 0 before the classic for loop.',
    highlightLines: [9],
    state: { mode: 'classic', array: arr, currentIndex: -1, i: -1, sum: 0, output: [], done: false },
  });

  // Classic for loop
  for (let i = 0; i < arr.length; i++) {
    steps.push({
      description: `Check condition: i(${i}) < len(nums)(${arr.length}) → true. Enter loop body.`,
      highlightLines: [10],
      state: { mode: 'classic', array: arr, currentIndex: i, i, sum: arr.slice(0, i).reduce((a, b) => a + b, 0), output: [], done: false },
    });
    const newSum = arr.slice(0, i + 1).reduce((a, b) => a + b, 0);
    steps.push({
      description: `sum += nums[${i}] (${arr[i]}) → sum is now ${newSum}`,
      highlightLines: [11],
      state: { mode: 'classic', array: arr, currentIndex: i, i, sum: newSum, output: [], done: false },
    });
  }

  steps.push({
    description: `Condition i(${arr.length}) < len(nums)(${arr.length}) → false. Loop ends. sum = ${arr.reduce((a, b) => a + b, 0)}`,
    highlightLines: [10],
    state: { mode: 'classic', array: arr, currentIndex: -1, i: arr.length, sum: arr.reduce((a, b) => a + b, 0), output: [`Sum: ${arr.reduce((a, b) => a + b, 0)}`], done: true },
  });

  // While style
  steps.push({
    description: 'Go has no "while" keyword — use for with just a condition. i := 0',
    highlightLines: [16],
    state: { mode: 'while', array: arr, currentIndex: -1, i: 0, sum: arr.reduce((a, b) => a + b, 0), output: [`Sum: ${arr.reduce((a, b) => a + b, 0)}`], done: false },
  });

  for (let i = 0; i < 3; i++) {
    steps.push({
      description: `While-style: i(${i}) < 3 → true. Print ${i}, then i++`,
      highlightLines: [17, 18, 19],
      state: { mode: 'while', array: arr, currentIndex: i, i, sum: arr.reduce((a, b) => a + b, 0), output: [...[...Array(i)].map((_, k) => String(k)), String(i)], done: false },
    });
  }

  // Range loop
  steps.push({
    description: 'Range loop: iterates over slice providing both index and value.',
    highlightLines: [23],
    state: { mode: 'range', array: arr, currentIndex: -1, i: -1, sum: arr.reduce((a, b) => a + b, 0), output: [], done: false },
  });

  for (let i = 0; i < arr.length; i++) {
    steps.push({
      description: `range: idx=${i}, val=${arr[i]} → print "${i}: ${arr[i]}"`,
      highlightLines: [23, 24],
      state: { mode: 'range', array: arr, currentIndex: i, i, sum: arr.reduce((a, b) => a + b, 0), output: arr.slice(0, i + 1).map((v, k) => `${k}: ${v}`), done: false },
    });
  }

  steps.push({
    description: 'Range loop complete! All 3 forms of Go for loops demonstrated.',
    highlightLines: [25],
    state: { mode: 'range', array: arr, currentIndex: -1, i: -1, sum: arr.reduce((a, b) => a + b, 0), output: arr.map((v, k) => `${k}: ${v}`), done: true },
  });

  return steps;
}

const steps = buildSteps();

export function ForLoop() {
  return (
    <VisualizationLayout
      title="For Loop"
      description="Go's only loop construct — 3 powerful forms"
      tag="Basics"
      tagColor="bg-[#3fb950]"
      steps={steps}
      codeLines={codeLines}
      renderVisual={(state: ForState) => (
        <div className="w-full max-w-2xl space-y-6">
          {/* Array visualization */}
          <div>
            <p className="text-[#8b949e] text-xs uppercase tracking-wide mb-3">
              nums = []int{'{'}10, 20, 30, 40, 50{'}'}
            </p>
            <div className="flex gap-2">
              {state.array.map((val, idx) => (
                <div key={idx} className="flex flex-col items-center gap-1 flex-1">
                  <div
                    className="w-full h-14 flex items-center justify-center rounded-lg border-2 font-mono text-lg transition-all duration-300"
                    style={{
                      borderColor: state.currentIndex === idx ? '#00ACD7' : '#30363d',
                      backgroundColor: state.currentIndex === idx ? '#00ACD7/20' : '#161b22',
                      background: state.currentIndex === idx ? 'rgba(0,172,215,0.15)' : '#161b22',
                      color: state.currentIndex === idx ? '#00ACD7' : '#e6edf3',
                      transform: state.currentIndex === idx ? 'scale(1.08)' : 'scale(1)',
                      boxShadow: state.currentIndex === idx ? '0 0 16px rgba(0,172,215,0.3)' : undefined,
                    }}
                  >
                    {val}
                  </div>
                  <span className="text-[#8b949e] text-xs">[{idx}]</span>
                </div>
              ))}
            </div>
            {state.currentIndex >= 0 && (
              <div className="mt-2 text-center">
                <span className="text-[#8b949e] text-xs">↑ i = {state.currentIndex}</span>
              </div>
            )}
          </div>

          {/* Variables state */}
          <div className="grid grid-cols-2 gap-3">
            {state.mode === 'classic' && (
              <>
                <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3">
                  <p className="text-[#8b949e] text-xs mb-1">i</p>
                  <p className="text-[#79c0ff] font-mono text-xl">{state.i < 0 ? '-' : state.i}</p>
                </div>
                <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3">
                  <p className="text-[#8b949e] text-xs mb-1">sum</p>
                  <p className="text-[#3fb950] font-mono text-xl">{state.sum}</p>
                </div>
              </>
            )}
            {state.mode === 'while' && (
              <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3">
                <p className="text-[#8b949e] text-xs mb-1">i (while-style)</p>
                <p className="text-[#ffa657] font-mono text-xl">{state.currentIndex < 0 ? 0 : state.currentIndex}</p>
              </div>
            )}
            {state.mode === 'range' && state.currentIndex >= 0 && (
              <>
                <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3">
                  <p className="text-[#8b949e] text-xs mb-1">idx</p>
                  <p className="text-[#79c0ff] font-mono text-xl">{state.currentIndex}</p>
                </div>
                <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3">
                  <p className="text-[#8b949e] text-xs mb-1">val</p>
                  <p className="text-[#a5d6ff] font-mono text-xl">{state.array[state.currentIndex]}</p>
                </div>
              </>
            )}
          </div>

          {/* Output */}
          {state.output.length > 0 && (
            <div className="bg-[#0d1117] border border-[#30363d] rounded-lg p-3">
              <p className="text-[#8b949e] text-xs uppercase tracking-wide mb-2">Output</p>
              {state.output.map((line, i) => (
                <p key={i} className="text-[#3fb950] font-mono text-sm">{line}</p>
              ))}
            </div>
          )}
        </div>
      )}
    />
  );
}
