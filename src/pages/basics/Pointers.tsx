import { VisualizationLayout, type Step } from '../../components/VisualizationLayout';

interface MemoryCell {
  address: string;
  name: string;
  value: string | number;
  isPointer?: boolean;
  pointsTo?: string; // address it points to
  color: string;
  highlighted?: boolean;
}

interface PointerState {
  cells: MemoryCell[];
  explanation: string;
  note?: string;
  output?: string[];
}

const codeLines = [
  'package main',
  '',
  'import "fmt"',
  '',
  'func main() {',
  '    // Declare an integer variable',
  '    x := 42',
  '',
  '    // & = "address of" — gets a pointer to x',
  '    p := &x',
  '',
  '    fmt.Println("x  =", x)   // 42',
  '    fmt.Println("&x =", p)   // 0xc000014088',
  '    fmt.Println("*p =", *p)  // 42  (dereference)',
  '',
  '    // Modify x through the pointer',
  '    *p = 100',
  '',
  '    fmt.Println("x after *p=100:", x) // 100',
  '',
  '    // Pointer to pointer',
  '    pp := &p',
  '    fmt.Println("**pp =", **pp) // 100',
  '}',
];

const steps: Step<PointerState>[] = [
  {
    description: 'Program starts. The Go runtime sets up the stack. No variables exist yet.',
    highlightLines: [5],
    state: {
      cells: [],
      explanation: 'Empty stack frame for main()',
    },
  },
  {
    description: '`x := 42` — declares an integer variable. Go allocates memory at some address (e.g. 0xc000) and stores 42 there.',
    highlightLines: [7],
    state: {
      cells: [
        { address: '0xc000', name: 'x', value: 42, color: '#3fb950', highlighted: true },
      ],
      explanation: 'Variable x lives at address 0xc000, value = 42',
    },
  },
  {
    description: '`p := &x` — the `&` operator gets the memory address of x. `p` is a pointer variable that stores 0xc000.',
    highlightLines: [10],
    state: {
      cells: [
        { address: '0xc000', name: 'x', value: 42, color: '#3fb950' },
        { address: '0xc008', name: 'p', value: '0xc000', isPointer: true, pointsTo: '0xc000', color: '#00ACD7', highlighted: true },
      ],
      explanation: 'p holds the address 0xc000 — it "points to" x',
    },
  },
  {
    description: '`fmt.Println("x =", x)` — reading x directly gives its value: 42.',
    highlightLines: [12],
    state: {
      cells: [
        { address: '0xc000', name: 'x', value: 42, color: '#3fb950', highlighted: true },
        { address: '0xc008', name: 'p', value: '0xc000', isPointer: true, pointsTo: '0xc000', color: '#00ACD7' },
      ],
      explanation: 'Direct variable access: x = 42',
      output: ['x  = 42'],
    },
  },
  {
    description: '`fmt.Println("&x =", p)` — printing p shows the raw memory address where x is stored.',
    highlightLines: [13],
    state: {
      cells: [
        { address: '0xc000', name: 'x', value: 42, color: '#3fb950' },
        { address: '0xc008', name: 'p', value: '0xc000', isPointer: true, pointsTo: '0xc000', color: '#00ACD7', highlighted: true },
      ],
      explanation: 'p contains the address of x',
      output: ['x  = 42', '&x = 0xc000'],
    },
  },
  {
    description: '`fmt.Println("*p =", *p)` — the `*` operator DEREFERENCES the pointer: it follows the address stored in p and reads the value there.',
    highlightLines: [14],
    state: {
      cells: [
        { address: '0xc000', name: 'x', value: 42, color: '#3fb950', highlighted: true },
        { address: '0xc008', name: 'p', value: '0xc000', isPointer: true, pointsTo: '0xc000', color: '#00ACD7', highlighted: true },
      ],
      explanation: '*p → follow address 0xc000 → read value 42',
      output: ['x  = 42', '&x = 0xc000', '*p = 42'],
    },
  },
  {
    description: '`*p = 100` — writing through the pointer! This MODIFIES the value at address 0xc000, which is x. x is now 100.',
    highlightLines: [17],
    state: {
      cells: [
        { address: '0xc000', name: 'x', value: 100, color: '#3fb950', highlighted: true },
        { address: '0xc008', name: 'p', value: '0xc000', isPointer: true, pointsTo: '0xc000', color: '#00ACD7', highlighted: true },
      ],
      explanation: '*p = 100 → writes 100 to address 0xc000 → x changes!',
      output: ['x  = 42', '&x = 0xc000', '*p = 42'],
      note: 'Pointer mutation: x changed from 42 → 100',
    },
  },
  {
    description: 'Printing x confirms it changed to 100 — even though we never wrote `x = 100` directly. Pointers allow indirect mutation!',
    highlightLines: [19],
    state: {
      cells: [
        { address: '0xc000', name: 'x', value: 100, color: '#3fb950', highlighted: true },
        { address: '0xc008', name: 'p', value: '0xc000', isPointer: true, pointsTo: '0xc000', color: '#00ACD7' },
      ],
      explanation: 'x = 100, changed via pointer *p',
      output: ['x  = 42', '&x = 0xc000', '*p = 42', 'x after *p=100: 100'],
    },
  },
  {
    description: '`pp := &p` — a pointer TO a pointer! pp stores the address of p (0xc008). `**pp` dereferences twice: pp → p → x.',
    highlightLines: [22, 23],
    state: {
      cells: [
        { address: '0xc000', name: 'x', value: 100, color: '#3fb950' },
        { address: '0xc008', name: 'p', value: '0xc000', isPointer: true, pointsTo: '0xc000', color: '#00ACD7' },
        { address: '0xc010', name: 'pp', value: '0xc008', isPointer: true, pointsTo: '0xc008', color: '#d2a8ff', highlighted: true },
      ],
      explanation: '**pp: follow 0xc010 → p (0xc000) → x (100)',
      output: ['x  = 42', '&x = 0xc000', '*p = 42', 'x after *p=100: 100', '**pp = 100'],
      note: 'Pointer to pointer: pp → p → x',
    },
  },
];

export function Pointers() {
  return (
    <VisualizationLayout
      title="Pointers"
      description="Memory addresses, & (address-of), * (dereference), and pointer chains"
      tag="Basics"
      tagColor="bg-[#3fb950]"
      steps={steps}
      codeLines={codeLines}
      renderVisual={(state: PointerState) => (
        <div className="w-full max-w-2xl space-y-4">
          {/* Memory diagram */}
          <div>
            <p className="text-[#8b949e] text-xs uppercase tracking-wide mb-3">Memory Layout (Stack)</p>

            {state.cells.length === 0 && (
              <div className="border border-dashed border-[#30363d] rounded-lg p-8 text-center text-[#8b949e] text-sm">
                Stack frame is empty — no variables yet
              </div>
            )}

            <div className="space-y-2">
              {state.cells.map((cell) => (
                <div
                  key={cell.address}
                  className="flex items-stretch rounded-lg overflow-hidden border transition-all duration-300"
                  style={{
                    borderColor: cell.highlighted ? cell.color : '#30363d',
                    boxShadow: cell.highlighted ? `0 0 12px ${cell.color}40` : 'none',
                  }}
                >
                  {/* Address column */}
                  <div
                    className="px-3 py-3 flex items-center justify-center min-w-[90px] border-r"
                    style={{ backgroundColor: `${cell.color}15`, borderColor: '#30363d' }}
                  >
                    <span className="font-mono text-xs" style={{ color: cell.color }}>
                      {cell.address}
                    </span>
                  </div>

                  {/* Name column */}
                  <div className="px-4 py-3 flex items-center min-w-[60px] border-r border-[#30363d] bg-[#161b22]">
                    <span className="font-mono text-sm text-[#e6edf3]">{cell.name}</span>
                    {cell.isPointer && (
                      <span className="ml-1 text-xs text-[#8b949e]">*</span>
                    )}
                  </div>

                  {/* Value column */}
                  <div className="px-4 py-3 flex items-center flex-1 bg-[#0d1117]">
                    <span
                      className="font-mono text-sm"
                      style={{ color: cell.isPointer ? '#00ACD7' : '#a5d6ff' }}
                    >
                      {cell.value}
                    </span>
                    {cell.isPointer && (
                      <span className="ml-2 text-xs text-[#8b949e]">(pointer)</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pointer arrow diagram */}
          {state.cells.length >= 2 && (
            <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
              <p className="text-[#8b949e] text-xs uppercase tracking-wide mb-3">Pointer Relationships</p>
              <div className="flex items-center gap-3 flex-wrap">
                {state.cells.map((cell, i) => (
                  <div key={cell.address} className="flex items-center gap-3">
                    {/* Box */}
                    <div
                      className="flex flex-col items-center"
                    >
                      <div
                        className="w-16 h-12 rounded-lg border-2 flex items-center justify-center"
                        style={{
                          borderColor: cell.highlighted ? cell.color : `${cell.color}60`,
                          backgroundColor: `${cell.color}10`,
                        }}
                      >
                        <span
                          className="font-mono text-xs text-center"
                          style={{ color: cell.isPointer ? '#00ACD7' : '#a5d6ff' }}
                        >
                          {cell.isPointer ? cell.value : String(cell.value)}
                        </span>
                      </div>
                      <span className="text-xs mt-1 font-mono" style={{ color: cell.color }}>{cell.name}</span>
                    </div>

                    {/* Arrow if this is a pointer */}
                    {cell.isPointer && i < state.cells.length - 1 && (
                      <div className="flex items-center gap-1">
                        <div className="w-6 h-px" style={{ backgroundColor: cell.color }} />
                        <span style={{ color: cell.color }}>→</span>
                      </div>
                    )}
                    {cell.isPointer && i === state.cells.length - 1 && (
                      <div className="flex items-center gap-1">
                        <div className="w-6 h-px" style={{ backgroundColor: cell.color }} />
                        <span style={{ color: cell.color }}>→</span>
                        <div
                          className="w-16 h-12 rounded-lg border-2 border-dashed flex items-center justify-center"
                          style={{ borderColor: state.cells[0].color, backgroundColor: `${state.cells[0].color}10` }}
                        >
                          <span className="font-mono text-xs" style={{ color: '#a5d6ff' }}>
                            {state.cells[0].value}
                          </span>
                        </div>
                        <span className="text-xs mt-1 font-mono ml-1" style={{ color: state.cells[0].color }}>*x</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Explanation */}
          <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3">
            <p className="text-[#8b949e] text-xs uppercase tracking-wide mb-1">Current State</p>
            <p className="text-[#e6edf3] text-sm font-mono">{state.explanation}</p>
          </div>

          {/* Output */}
          {state.output && state.output.length > 0 && (
            <div className="bg-[#0d1117] border border-[#30363d] rounded-lg p-3">
              <p className="text-[#8b949e] text-xs uppercase tracking-wide mb-2">Output</p>
              {state.output.map((line, i) => (
                <p key={i} className="text-[#3fb950] font-mono text-xs">{line}</p>
              ))}
            </div>
          )}

          {/* Note */}
          {state.note && (
            <div className="bg-[#ffa657]/10 border border-[#ffa657]/30 rounded-lg p-3">
              <p className="text-[#ffa657] text-xs">📌 {state.note}</p>
            </div>
          )}

          {/* Quick reference */}
          <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3">
            <p className="text-[#8b949e] text-xs uppercase tracking-wide mb-2">Pointer Cheat Sheet</p>
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="flex items-center gap-2">
                <span className="text-[#ff7b72]">&amp;x</span>
                <span className="text-[#8b949e]">→ address of x</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[#ff7b72]">*p</span>
                <span className="text-[#8b949e]">→ value at address p</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[#ff7b72]">*p = v</span>
                <span className="text-[#8b949e]">→ write through pointer</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[#ff7b72]">**pp</span>
                <span className="text-[#8b949e]">→ double dereference</span>
              </div>
            </div>
          </div>
        </div>
      )}
    />
  );
}
