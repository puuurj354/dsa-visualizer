import { VisualizationLayout, type Step } from '../../components/VisualizationLayout';

interface FuncState {
  callStack: { name: string; params: { key: string; val: string }[]; ret?: string }[];
  output: string[];
  highlight?: string;
}

const codeLines = [
  'package main',
  '',
  'import "fmt"',
  '',
  '// Multiple return values',
  'func divide(a, b float64) (float64, error) {',
  '    if b == 0 {',
  '        return 0, fmt.Errorf("division by zero")',
  '    }',
  '    return a / b, nil',
  '}',
  '',
  '// Variadic function',
  'func sum(nums ...int) int {',
  '    total := 0',
  '    for _, n := range nums {',
  '        total += n',
  '    }',
  '    return total',
  '}',
  '',
  'func main() {',
  '    result, err := divide(10, 2)',
  '    if err != nil {',
  '        fmt.Println("Error:", err)',
  '    }',
  '    fmt.Println(result) // 5',
  '',
  '    total := sum(1, 2, 3, 4, 5)',
  '    fmt.Println(total)  // 15',
  '}',
];

const steps: Step<FuncState>[] = [
  { description: 'Program starts. main() is called and pushed onto the call stack.', highlightLines: [22], state: { callStack: [{ name: 'main', params: [] }], output: [] } },
  { description: 'main() calls divide(10, 2). A new stack frame is created for divide.', highlightLines: [23], state: { callStack: [{ name: 'main', params: [{ key: 'calling', val: 'divide(10, 2)' }] }, { name: 'divide', params: [{ key: 'a', val: '10' }, { key: 'b', val: '2' }] }], output: [] } },
  { description: 'Inside divide: check if b == 0. b is 2, so the condition is FALSE.', highlightLines: [7], state: { callStack: [{ name: 'main', params: [] }, { name: 'divide', params: [{ key: 'a', val: '10' }, { key: 'b', val: '2' }] }], output: [] } },
  { description: 'Return a/b (10/2 = 5.0) and nil (no error). Stack frame for divide is popped.', highlightLines: [10], state: { callStack: [{ name: 'main', params: [{ key: 'result', val: '5' }, { key: 'err', val: 'nil' }] }], output: [] } },
  { description: 'Back in main: err is nil, so skip the error branch.', highlightLines: [24], state: { callStack: [{ name: 'main', params: [{ key: 'result', val: '5' }, { key: 'err', val: 'nil' }] }], output: [] } },
  { description: 'fmt.Println(result) → prints 5', highlightLines: [27], state: { callStack: [{ name: 'main', params: [{ key: 'result', val: '5' }, { key: 'err', val: 'nil' }] }], output: ['5'] } },
  { description: 'main() calls sum(1, 2, 3, 4, 5). Variadic params are passed as a slice.', highlightLines: [29], state: { callStack: [{ name: 'main', params: [{ key: 'result', val: '5' }] }, { name: 'sum', params: [{ key: 'nums', val: '[1,2,3,4,5]' }] }], output: ['5'] } },
  { description: 'sum() iterates through nums, accumulating total: 0+1+2+3+4+5 = 15.', highlightLines: [15, 16, 17], state: { callStack: [{ name: 'main', params: [{ key: 'result', val: '5' }] }, { name: 'sum', params: [{ key: 'nums', val: '[1,2,3,4,5]' }, { key: 'total', val: '15' }] }], output: ['5'] } },
  { description: 'sum() returns 15. Stack frame popped.', highlightLines: [19], state: { callStack: [{ name: 'main', params: [{ key: 'result', val: '5' }, { key: 'total', val: '15' }] }], output: ['5'] } },
  { description: 'fmt.Println(total) → prints 15. Both functions demonstrate Go\'s multiple return values and variadic params.', highlightLines: [30], state: { callStack: [{ name: 'main', params: [{ key: 'result', val: '5' }, { key: 'total', val: '15' }] }], output: ['5', '15'] } },
];

const stackColors = ['#00ACD7', '#3fb950', '#ffa657', '#d2a8ff'];

export function Functions() {
  return (
    <VisualizationLayout
      title="Functions"
      description="Multiple return values, variadic functions, and the call stack"
      tag="Basics"
      tagColor="bg-[#3fb950]"
      steps={steps}
      codeLines={codeLines}
      renderVisual={(state: FuncState) => (
        <div className="w-full max-w-xl space-y-5">
          {/* Call stack */}
          <div>
            <p className="text-[#8b949e] text-xs uppercase tracking-wide mb-3">Call Stack (top = active)</p>
            <div className="space-y-2">
              {[...state.callStack].reverse().map((frame, ri) => {
                const idx = state.callStack.length - 1 - ri;
                const color = stackColors[idx % stackColors.length];
                const isActive = ri === 0;
                return (
                  <div
                    key={`${frame.name}-${idx}`}
                    className="rounded-lg border-2 p-3 transition-all duration-300"
                    style={{
                      borderColor: isActive ? color : '#30363d',
                      backgroundColor: isActive ? `${color}10` : '#161b22',
                      opacity: isActive ? 1 : 0.7,
                    }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-mono text-sm" style={{ color }}>{frame.name}()</span>
                      {isActive && (
                        <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: `${color}20`, color }}>
                          active
                        </span>
                      )}
                    </div>
                    {frame.params.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {frame.params.map(p => (
                          <div key={p.key} className="bg-[#0d1117] border border-[#30363d] rounded px-2 py-1 text-xs font-mono">
                            <span className="text-[#8b949e]">{p.key}: </span>
                            <span className="text-[#ffa657]">{p.val}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
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

          {/* Key concepts */}
          <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
            <p className="text-[#8b949e] text-xs uppercase tracking-wide mb-3">Go Function Features</p>
            <div className="space-y-2 text-sm">
              {[
                { label: 'Multiple returns', example: 'func f() (int, error)', color: '#79c0ff' },
                { label: 'Variadic params', example: 'func f(nums ...int)', color: '#ffa657' },
                { label: 'Named returns', example: 'func f() (x int)', color: '#d2a8ff' },
                { label: 'First-class funcs', example: 'fn := func() {}', color: '#3fb950' },
              ].map(c => (
                <div key={c.label} className="flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: c.color }} />
                  <span className="text-[#8b949e]">{c.label}</span>
                  <code className="ml-auto text-xs font-mono" style={{ color: c.color }}>{c.example}</code>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    />
  );
}
