import { VisualizationLayout, type Step } from '../../components/VisualizationLayout';
import type { ComplexityInfo } from '../../components/ComplexityCard';

interface StackState {
  items: number[];
  action?: 'push' | 'pop' | 'peek';
  actionVal?: number;
  peekVal?: number;
}

const codeLines = [
  'package main',
  '',
  'import "fmt"',
  '',
  '// Stack implemented using a slice',
  'type Stack struct {',
  '    data []int',
  '}',
  '',
  'func (s *Stack) Push(v int) {',
  '    s.data = append(s.data, v)',
  '}',
  '',
  'func (s *Stack) Pop() (int, bool) {',
  '    if len(s.data) == 0 {',
  '        return 0, false',
  '    }',
  '    top := s.data[len(s.data)-1]',
  '    s.data = s.data[:len(s.data)-1]',
  '    return top, true',
  '}',
  '',
  'func (s *Stack) Peek() int {',
  '    return s.data[len(s.data)-1]',
  '}',
  '',
  'func main() {',
  '    s := Stack{}',
  '    s.Push(10)',
  '    s.Push(20)',
  '    s.Push(30)',
  '    top, _ := s.Pop()  // 30',
  '    fmt.Println(top)',
  '    fmt.Println(s.Peek()) // 20',
  '}',
];

const steps: Step<StackState>[] = [
  { description: 'Create an empty Stack. The stack uses a Go slice as its underlying data structure.', highlightLines: [28], state: { items: [] } },
  { description: 'Push(10) — append 10 to the slice. 10 is now at the bottom of the stack.', highlightLines: [10, 11], state: { items: [10], action: 'push', actionVal: 10 } },
  { description: 'Push(20) — append 20. Stack grows upward. 20 is now on top.', highlightLines: [30], state: { items: [10, 20], action: 'push', actionVal: 20 } },
  { description: 'Push(30) — append 30. 30 is now the top of the stack.', highlightLines: [31], state: { items: [10, 20, 30], action: 'push', actionVal: 30 } },
  { description: 'Pop() — access s.data[len-1] = s.data[2] = 30. This is the LIFO principle!', highlightLines: [18], state: { items: [10, 20, 30], action: 'pop', actionVal: 30 } },
  { description: 'Shrink the slice: s.data = s.data[:len-1]. 30 is removed. top = 30.', highlightLines: [19], state: { items: [10, 20], action: 'pop', actionVal: 30 } },
  { description: 'Pop() returned (30, true). Print 30.', highlightLines: [32, 33], state: { items: [10, 20], actionVal: 30 } },
  { description: 'Peek() — return s.data[len-1] = 20, WITHOUT removing it.', highlightLines: [24, 34], state: { items: [10, 20], action: 'peek', peekVal: 20 } },
];

const itemColors = ['#3fb950', '#ffa657', '#79c0ff', '#d2a8ff', '#00ACD7', '#f85149'];

/** Stack complexity: Push/Pop/Peek are all O(1) */
const stackComplexity: ComplexityInfo = {
  time: {
    best: 'O(1)', // Push, Pop, Peek — constant time operations
    average: 'O(1)',
    worst: 'O(1)',
  },
  space: 'O(n)',    // Stack grows linearly with the number of elements
  notes: 'All core operations are O(1). Go slices handle growth amortized.',
};

export function Stack() {
  return (
    <VisualizationLayout
      title="Stack"
      description="LIFO data structure implemented with a Go slice"
      tag="Data Structures"
      tagColor="bg-[#79c0ff]"
      steps={steps}
      codeLines={codeLines}
      complexity={stackComplexity}
      renderVisual={(state: StackState) => (
        <div className="w-full max-w-sm">
          {/* Stack visualization */}
          <div className="flex gap-6 items-end">
            {/* Stack column */}
            <div className="flex-1">
              <p className="text-[#8b949e] text-xs uppercase tracking-wide mb-3 text-center">Stack</p>

              {/* TOP label */}
              {state.items.length > 0 && (
                <div className="flex items-center gap-2 mb-1 justify-center">
                  <span className="text-[#00ACD7] text-xs">← TOP</span>
                </div>
              )}

              {/* Items (top to bottom) */}
              <div className="space-y-1.5 min-h-[200px] flex flex-col justify-end">
                {state.items.length === 0 && (
                  <div className="border-2 border-dashed border-[#30363d] rounded-lg h-16 flex items-center justify-center text-[#8b949e] text-sm">
                    empty
                  </div>
                )}
                {[...state.items].reverse().map((item, ri) => {
                  const idx = state.items.length - 1 - ri;
                  const isTop = idx === state.items.length - 1;
                  const color = itemColors[idx % itemColors.length];
                  const isAction = isTop && (state.action === 'push' || state.action === 'pop' || state.action === 'peek');
                  return (
                    <div
                      key={`${item}-${idx}`}
                      className="flex items-center rounded-lg border-2 px-4 h-12 transition-all duration-300"
                      style={{
                        borderColor: isAction ? color : '#30363d',
                        backgroundColor: isAction ? `${color}15` : '#161b22',
                        transform: isAction && state.action === 'push' ? 'translateY(-4px)' : 'none',
                        boxShadow: isAction ? `0 0 12px ${color}40` : undefined,
                      }}
                    >
                      <span className="font-mono text-lg flex-1 text-center" style={{ color: isTop ? color : '#e6edf3' }}>
                        {item}
                      </span>
                      {isTop && (
                        <span className="text-xs ml-2" style={{ color }}>← top</span>
                      )}
                      {state.action === 'peek' && isTop && (
                        <span className="text-xs ml-1 text-[#00ACD7]">👁</span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Bottom base */}
              <div className="h-2 bg-[#30363d] rounded-full mt-1.5" />
            </div>

            {/* Info panel */}
            <div className="w-36 space-y-3">
              <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3 text-center">
                <p className="text-[#8b949e] text-xs mb-1">size</p>
                <p className="text-[#e6edf3] font-mono text-2xl">{state.items.length}</p>
              </div>
              {state.action === 'pop' && state.actionVal !== undefined && (
                <div className="bg-[#f85149]/10 border border-[#f85149]/30 rounded-lg p-3 text-center">
                  <p className="text-[#f85149] text-xs mb-1">popped</p>
                  <p className="text-[#f85149] font-mono text-xl">{state.actionVal}</p>
                </div>
              )}
              {state.action === 'push' && state.actionVal !== undefined && (
                <div className="bg-[#3fb950]/10 border border-[#3fb950]/30 rounded-lg p-3 text-center">
                  <p className="text-[#3fb950] text-xs mb-1">pushed</p>
                  <p className="text-[#3fb950] font-mono text-xl">{state.actionVal}</p>
                </div>
              )}
              {state.action === 'peek' && state.peekVal !== undefined && (
                <div className="bg-[#00ACD7]/10 border border-[#00ACD7]/30 rounded-lg p-3 text-center">
                  <p className="text-[#00ACD7] text-xs mb-1">peek</p>
                  <p className="text-[#00ACD7] font-mono text-xl">{state.peekVal}</p>
                </div>
              )}
              <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3 text-xs text-[#8b949e]">
                <p className="font-medium text-[#e6edf3] mb-1">LIFO</p>
                <p>Last In,</p>
                <p>First Out</p>
              </div>
            </div>
          </div>

          {/* Operations guide */}
          <div className="mt-6 grid grid-cols-3 gap-2">
            {[
              { op: 'Push(v)', desc: 'Add to top', color: '#3fb950', complexity: 'O(1)' },
              { op: 'Pop()', desc: 'Remove top', color: '#f85149', complexity: 'O(1)' },
              { op: 'Peek()', desc: 'View top', color: '#00ACD7', complexity: 'O(1)' },
            ].map(o => (
              <div key={o.op} className="bg-[#161b22] border border-[#30363d] rounded-lg p-2 text-center">
                <p className="font-mono text-xs" style={{ color: o.color }}>{o.op}</p>
                <p className="text-[#8b949e] text-xs">{o.desc}</p>
                <p className="text-[#ffa657] text-xs">{o.complexity}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    />
  );
}
