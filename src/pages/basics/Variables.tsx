import { VisualizationLayout, type Step } from '../../components/VisualizationLayout';

interface VarState {
  vars: { name: string; type: string; value: string | number; color: string; visible: boolean }[];
  highlight?: string;
}

const codeLines = [
  'package main',
  '',
  'func main() {',
  '    // Zero value declaration',
  '    var x int',
  '    var s string',
  '    var b bool',
  '',
  '    // Assignment',
  '    x = 42',
  '    s = "gopher"',
  '    b = true',
  '',
  '    // Short variable declaration',
  '    y := 3.14',
  '    name := "Go"',
  '',
  '    // Multiple assignment',
  '    a, c := 10, 20',
  '    _ = a + c',
  '}',
];

const steps: Step<VarState>[] = [
  {
    description: 'We start inside the main() function. No variables exist yet in memory.',
    highlightLines: [3],
    state: { vars: [] },
  },
  {
    description: '`var x int` — declares an integer variable x. Its zero value is 0. In Go, all variables have zero values.',
    highlightLines: [5],
    state: {
      vars: [{ name: 'x', type: 'int', value: 0, color: '#79c0ff', visible: true }],
      highlight: 'x',
    },
  },
  {
    description: '`var s string` — declares a string variable s. The zero value for string is "" (empty string).',
    highlightLines: [6],
    state: {
      vars: [
        { name: 'x', type: 'int', value: 0, color: '#79c0ff', visible: true },
        { name: 's', type: 'string', value: '""', color: '#a5d6ff', visible: true },
      ],
      highlight: 's',
    },
  },
  {
    description: '`var b bool` — declares a boolean variable b. The zero value for bool is false.',
    highlightLines: [7],
    state: {
      vars: [
        { name: 'x', type: 'int', value: 0, color: '#79c0ff', visible: true },
        { name: 's', type: 'string', value: '""', color: '#a5d6ff', visible: true },
        { name: 'b', type: 'bool', value: 'false', color: '#3fb950', visible: true },
      ],
      highlight: 'b',
    },
  },
  {
    description: '`x = 42` — assigns the integer value 42 to variable x. The memory box updates.',
    highlightLines: [10],
    state: {
      vars: [
        { name: 'x', type: 'int', value: 42, color: '#79c0ff', visible: true },
        { name: 's', type: 'string', value: '""', color: '#a5d6ff', visible: true },
        { name: 'b', type: 'bool', value: 'false', color: '#3fb950', visible: true },
      ],
      highlight: 'x',
    },
  },
  {
    description: '`s = "gopher"` — assigns the string "gopher" to s.',
    highlightLines: [11],
    state: {
      vars: [
        { name: 'x', type: 'int', value: 42, color: '#79c0ff', visible: true },
        { name: 's', type: 'string', value: '"gopher"', color: '#a5d6ff', visible: true },
        { name: 'b', type: 'bool', value: 'false', color: '#3fb950', visible: true },
      ],
      highlight: 's',
    },
  },
  {
    description: '`b = true` — assigns true to b.',
    highlightLines: [12],
    state: {
      vars: [
        { name: 'x', type: 'int', value: 42, color: '#79c0ff', visible: true },
        { name: 's', type: 'string', value: '"gopher"', color: '#a5d6ff', visible: true },
        { name: 'b', type: 'bool', value: 'true', color: '#3fb950', visible: true },
      ],
      highlight: 'b',
    },
  },
  {
    description: '`:=` short declaration — `y := 3.14` declares AND assigns in one step. Go infers the type as float64.',
    highlightLines: [15],
    state: {
      vars: [
        { name: 'x', type: 'int', value: 42, color: '#79c0ff', visible: true },
        { name: 's', type: 'string', value: '"gopher"', color: '#a5d6ff', visible: true },
        { name: 'b', type: 'bool', value: 'true', color: '#3fb950', visible: true },
        { name: 'y', type: 'float64', value: '3.14', color: '#ffa657', visible: true },
      ],
      highlight: 'y',
    },
  },
  {
    description: '`name := "Go"` — short declaration for a string. Type is inferred as string.',
    highlightLines: [16],
    state: {
      vars: [
        { name: 'x', type: 'int', value: 42, color: '#79c0ff', visible: true },
        { name: 's', type: 'string', value: '"gopher"', color: '#a5d6ff', visible: true },
        { name: 'b', type: 'bool', value: 'true', color: '#3fb950', visible: true },
        { name: 'y', type: 'float64', value: '3.14', color: '#ffa657', visible: true },
        { name: 'name', type: 'string', value: '"Go"', color: '#a5d6ff', visible: true },
      ],
      highlight: 'name',
    },
  },
  {
    description: '`a, c := 10, 20` — multiple assignment! Go supports declaring and assigning multiple variables at once.',
    highlightLines: [19],
    state: {
      vars: [
        { name: 'x', type: 'int', value: 42, color: '#79c0ff', visible: true },
        { name: 's', type: 'string', value: '"gopher"', color: '#a5d6ff', visible: true },
        { name: 'b', type: 'bool', value: 'true', color: '#3fb950', visible: true },
        { name: 'y', type: 'float64', value: '3.14', color: '#ffa657', visible: true },
        { name: 'name', type: 'string', value: '"Go"', color: '#a5d6ff', visible: true },
        { name: 'a', type: 'int', value: 10, color: '#79c0ff', visible: true },
        { name: 'c', type: 'int', value: 20, color: '#79c0ff', visible: true },
      ],
      highlight: 'a',
    },
  },
];

export function Variables() {
  return (
    <VisualizationLayout
      title="Variables & Types"
      description="How Go declares variables, zero values, and type inference"
      tag="Basics"
      tagColor="bg-[#3fb950]"
      steps={steps}
      codeLines={codeLines}
      renderVisual={(state: VarState) => (
        <div className="w-full max-w-2xl">
          <p className="text-[#8b949e] text-xs uppercase tracking-wide mb-4">Memory</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {state.vars.map((v) => (
              <div
                key={v.name}
                className={`rounded-lg border-2 p-3 transition-all duration-300 ${
                  state.highlight === v.name
                    ? 'scale-105 shadow-lg'
                    : ''
                }`}
                style={{
                  borderColor: state.highlight === v.name ? v.color : '#30363d',
                  backgroundColor: state.highlight === v.name ? `${v.color}15` : '#161b22',
                  boxShadow: state.highlight === v.name ? `0 0 20px ${v.color}30` : undefined,
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[#e6edf3] text-sm font-mono">{v.name}</span>
                  <span
                    className="text-xs px-1.5 py-0.5 rounded font-mono"
                    style={{ color: v.color, backgroundColor: `${v.color}20` }}
                  >
                    {v.type}
                  </span>
                </div>
                <div
                  className="text-center py-2 rounded font-mono text-sm"
                  style={{ backgroundColor: `${v.color}10`, color: v.color }}
                >
                  {String(v.value)}
                </div>
              </div>
            ))}
          </div>
          {state.vars.length === 0 && (
            <div className="text-center text-[#8b949e] py-16">
              <div className="text-4xl mb-3">🧠</div>
              <p>Memory is empty — no variables declared yet</p>
            </div>
          )}

          {/* Zero values legend */}
          <div className="mt-6 p-4 rounded-lg bg-[#161b22] border border-[#30363d]">
            <p className="text-[#8b949e] text-xs uppercase tracking-wide mb-3">Go Zero Values</p>
            <div className="grid grid-cols-2 gap-2 text-sm font-mono">
              {[
                { type: 'int', zero: '0', color: '#79c0ff' },
                { type: 'float64', zero: '0.0', color: '#ffa657' },
                { type: 'string', zero: '""', color: '#a5d6ff' },
                { type: 'bool', zero: 'false', color: '#3fb950' },
                { type: 'pointer', zero: 'nil', color: '#d2a8ff' },
                { type: 'slice', zero: 'nil', color: '#d2a8ff' },
              ].map(z => (
                <div key={z.type} className="flex justify-between items-center px-2 py-1 rounded bg-[#0d1117]">
                  <span style={{ color: z.color }}>{z.type}</span>
                  <span className="text-[#8b949e]">→</span>
                  <span className="text-[#ffa657]">{z.zero}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    />
  );
}
