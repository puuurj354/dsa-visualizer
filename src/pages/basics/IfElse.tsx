import { VisualizationLayout, type Step } from '../../components/VisualizationLayout';

interface IfState {
  score: number;
  branch: 'none' | 'A' | 'B' | 'C' | 'F';
  grade: string;
  shortVar?: number;
  err?: boolean;
}

const codeLines = [
  'package main',
  '',
  'import "fmt"',
  '',
  'func getGrade(score int) string {',
  '    if score >= 90 {',
  '        return "A"',
  '    } else if score >= 80 {',
  '        return "B"',
  '    } else if score >= 70 {',
  '        return "C"',
  '    } else {',
  '        return "F"',
  '    }',
  '}',
  '',
  'func main() {',
  '    fmt.Println(getGrade(95))  // A',
  '    fmt.Println(getGrade(82))  // B',
  '    fmt.Println(getGrade(65))  // F',
  '',
  '    // If with short statement',
  '    if n := 42; n%2 == 0 {',
  '        fmt.Println("even")',
  '    } else {',
  '        fmt.Println("odd")',
  '    }',
  '}',
];

const steps: Step<IfState>[] = [
  { description: 'Calling getGrade(95). Score = 95.', highlightLines: [18], state: { score: 95, branch: 'none', grade: '' } },
  { description: 'score(95) >= 90 → TRUE. Enter first if block.', highlightLines: [6], state: { score: 95, branch: 'A', grade: '' } },
  { description: 'Return "A". Grade is A!', highlightLines: [7], state: { score: 95, branch: 'A', grade: 'A' } },
  { description: 'Calling getGrade(82). Score = 82.', highlightLines: [19], state: { score: 82, branch: 'none', grade: '' } },
  { description: 'score(82) >= 90 → FALSE. Check else if.', highlightLines: [6], state: { score: 82, branch: 'none', grade: '' } },
  { description: 'score(82) >= 80 → TRUE. Enter else-if block.', highlightLines: [8], state: { score: 82, branch: 'B', grade: '' } },
  { description: 'Return "B". Grade is B!', highlightLines: [9], state: { score: 82, branch: 'B', grade: 'B' } },
  { description: 'Calling getGrade(65). Score = 65.', highlightLines: [20], state: { score: 65, branch: 'none', grade: '' } },
  { description: 'score(65) >= 90 → FALSE.', highlightLines: [6], state: { score: 65, branch: 'none', grade: '' } },
  { description: 'score(65) >= 80 → FALSE.', highlightLines: [8], state: { score: 65, branch: 'none', grade: '' } },
  { description: 'score(65) >= 70 → FALSE.', highlightLines: [10], state: { score: 65, branch: 'none', grade: '' } },
  { description: 'All conditions failed — enter else block.', highlightLines: [12], state: { score: 65, branch: 'F', grade: '' } },
  { description: 'Return "F". Grade is F!', highlightLines: [13], state: { score: 65, branch: 'F', grade: 'F' } },
  { description: 'Go allows a short variable declaration in the if statement: `if n := 42; n%2 == 0`. n is scoped to the if/else block!', highlightLines: [23], state: { score: 0, branch: 'none', grade: '', shortVar: 42 } },
  { description: 'n(42) % 2 == 0 → TRUE. Print "even". n is only visible inside this if/else block.', highlightLines: [24], state: { score: 0, branch: 'A', grade: 'even', shortVar: 42 } },
];

const branchColors: Record<string, string> = {
  A: '#3fb950', B: '#79c0ff', C: '#ffa657', F: '#f85149',
};

export function IfElse() {
  return (
    <VisualizationLayout
      title="If / Else"
      description="Conditional branching and Go's if-with-statement"
      tag="Basics"
      tagColor="bg-[#3fb950]"
      steps={steps}
      codeLines={codeLines}
      renderVisual={(state: IfState) => (
        <div className="w-full max-w-lg space-y-5">
          {/* Score input display */}
          {state.score > 0 && (
            <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-5">
              <p className="text-[#8b949e] text-xs mb-2">Input: score</p>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-xl border-2 border-[#00ACD7] flex items-center justify-center bg-[#00ACD7]/10">
                  <span className="text-[#00ACD7] font-mono text-2xl">{state.score}</span>
                </div>
                <div className="flex-1 space-y-2">
                  {[
                    { label: '≥ 90', result: 'A', pass: state.score >= 90 },
                    { label: '≥ 80', result: 'B', pass: state.score >= 80 && state.score < 90 },
                    { label: '≥ 70', result: 'C', pass: state.score >= 70 && state.score < 80 },
                    { label: '< 70', result: 'F', pass: state.score < 70 },
                  ].map(cond => (
                    <div
                      key={cond.result}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors"
                      style={{
                        backgroundColor:
                          state.branch === cond.result ? `${branchColors[cond.result]}20` : '#0d1117',
                        borderLeft: state.branch === cond.result
                          ? `3px solid ${branchColors[cond.result]}`
                          : '3px solid transparent',
                      }}
                    >
                      <span className="text-[#8b949e] text-sm font-mono">score {cond.label}</span>
                      <span className="ml-auto font-mono" style={{ color: branchColors[cond.result] }}>
                        → "{cond.result}"
                      </span>
                      {state.branch === cond.result && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: `${branchColors[cond.result]}30`, color: branchColors[cond.result] }}>
                          ✓ MATCH
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {state.grade && (
                <div className="mt-4 text-center">
                  <p className="text-[#8b949e] text-xs mb-1">Return value</p>
                  <span
                    className="text-4xl font-mono px-6 py-2 rounded-xl"
                    style={{
                      color: branchColors[state.grade] || '#e6edf3',
                      backgroundColor: `${branchColors[state.grade] || '#30363d'}20`,
                    }}
                  >
                    "{state.grade}"
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Short var in if */}
          {state.shortVar !== undefined && (
            <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-5">
              <p className="text-[#8b949e] text-xs mb-3">If with short statement</p>
              <div className="font-mono text-sm bg-[#0d1117] rounded-lg p-3 mb-3">
                <span className="text-[#ff7b72]">if</span>
                <span className="text-[#e6edf3]"> n </span>
                <span className="text-[#ff7b72]">:=</span>
                <span className="text-[#ffa657]"> 42</span>
                <span className="text-[#e6edf3]">; n</span>
                <span className="text-[#c9d1d9]">%</span>
                <span className="text-[#ffa657]">2</span>
                <span className="text-[#c9d1d9]"> == </span>
                <span className="text-[#ffa657]">0</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-[#0d1117] border border-[#30363d] rounded-lg px-4 py-2">
                  <p className="text-[#8b949e] text-xs">n (scoped)</p>
                  <p className="text-[#ffa657] font-mono">{state.shortVar}</p>
                </div>
                <span className="text-[#8b949e]">→</span>
                <div className="bg-[#3fb950]/10 border border-[#3fb950]/30 rounded-lg px-4 py-2">
                  <p className="text-[#8b949e] text-xs">42 % 2 == 0</p>
                  <p className="text-[#3fb950] font-mono">true → "even"</p>
                </div>
              </div>
              <p className="text-[#8b949e] text-xs mt-3">⚠️ n is only accessible inside this if/else block</p>
            </div>
          )}

          {state.score === 0 && state.shortVar === undefined && (
            <div className="text-center text-[#8b949e] py-16">
              <div className="text-4xl mb-3">🔀</div>
              <p>Step through to see conditional branching in action</p>
            </div>
          )}
        </div>
      )}
    />
  );
}
