import { VisualizationLayout, type Step } from '../../components/VisualizationLayout';

interface ConcreteType {
  name: string;
  fields: { key: string; val: string }[];
  methodImpls: string[];
  color: string;
  active?: boolean;
  assertResult?: 'ok' | 'fail' | null;
}

interface InterfaceBox {
  name: string;
  methods: string[];
  heldType?: string;
  heldValue?: string;
  color?: string;
}

interface TypeSwitchCase {
  typeName: string;
  matched: boolean;
  color: string;
}

interface InterfaceState {
  phase: 'define' | 'implement' | 'polymorphism' | 'assertion' | 'typeswitch';
  interfaceBox: InterfaceBox;
  concreteTypes: ConcreteType[];
  currentCall?: { method: string; receiver: string; result: string };
  typeSwitch?: { input: string; cases: TypeSwitchCase[]; result: string };
  assertion?: { expr: string; result: string; ok: boolean; note: string };
  output: string[];
  note?: string;
}

const codeLines = [
  'package main',
  '',
  'import ("fmt"; "math")',
  '',
  '// Interface definition',
  'type Shape interface {',
  '    Area() float64',
  '    Name() string',
  '}',
  '',
  '// Circle implements Shape',
  'type Circle struct{ Radius float64 }',
  'func (c Circle) Area() float64 { return math.Pi * c.Radius * c.Radius }',
  'func (c Circle) Name() string  { return "Circle" }',
  '',
  '// Rect implements Shape',
  'type Rect struct{ W, H float64 }',
  'func (r Rect) Area() float64 { return r.W * r.H }',
  'func (r Rect) Name() string  { return "Rect" }',
  '',
  'func printShape(s Shape) {',
  '    fmt.Printf("%s area = %.2f\\n", s.Name(), s.Area())',
  '}',
  '',
  'func main() {',
  '    shapes := []Shape{',
  '        Circle{Radius: 5},',
  '        Rect{W: 4, H: 6},',
  '    }',
  '    for _, s := range shapes {',
  '        printShape(s)',
  '    }',
  '',
  '    // Type assertion',
  '    var s Shape = Circle{Radius: 3}',
  '    c, ok := s.(Circle)   // ok = true',
  '    fmt.Println(c.Radius, ok)',
  '',
  '    _, ok2 := s.(Rect)    // ok2 = false',
  '    fmt.Println(ok2)',
  '',
  '    // Type switch',
  '    switch v := s.(type) {',
  '    case Circle:',
  '        fmt.Println("Circle r =", v.Radius)',
  '    case Rect:',
  '        fmt.Println("Rect w =", v.W)',
  '    }',
  '}',
];

const steps: Step<InterfaceState>[] = [
  {
    description: 'Define the `Shape` interface. An interface is a CONTRACT — any type that implements ALL its methods satisfies the interface. No `implements` keyword needed in Go!',
    highlightLines: [6, 7, 8, 9],
    state: {
      phase: 'define',
      interfaceBox: { name: 'Shape', methods: ['Area() float64', 'Name() string'] },
      concreteTypes: [],
      output: [],
      note: 'Go interfaces are satisfied IMPLICITLY — no "implements" declaration',
    },
  },
  {
    description: '`Circle` struct has a `Radius` field. It implements `Area()` and `Name()` — so it automatically satisfies the `Shape` interface.',
    highlightLines: [12, 13, 14],
    state: {
      phase: 'implement',
      interfaceBox: { name: 'Shape', methods: ['Area() float64', 'Name() string'] },
      concreteTypes: [
        {
          name: 'Circle',
          fields: [{ key: 'Radius', val: 'float64' }],
          methodImpls: ['Area() → π × r²', 'Name() → "Circle"'],
          color: '#00ACD7',
          active: true,
        },
      ],
      output: [],
    },
  },
  {
    description: '`Rect` also implements `Area()` and `Name()`. Both Circle and Rect satisfy Shape — two different types, one interface. This is Go polymorphism!',
    highlightLines: [17, 18, 19],
    state: {
      phase: 'implement',
      interfaceBox: { name: 'Shape', methods: ['Area() float64', 'Name() string'] },
      concreteTypes: [
        {
          name: 'Circle',
          fields: [{ key: 'Radius', val: 'float64' }],
          methodImpls: ['Area() → π × r²', 'Name() → "Circle"'],
          color: '#00ACD7',
        },
        {
          name: 'Rect',
          fields: [{ key: 'W', val: 'float64' }, { key: 'H', val: 'float64' }],
          methodImpls: ['Area() → W × H', 'Name() → "Rect"'],
          color: '#ffa657',
          active: true,
        },
      ],
      output: [],
      note: 'Both types satisfy Shape — duck typing: "if it quacks like a duck..."',
    },
  },
  {
    description: 'A `Shape` interface value is a (type, value) pair internally. Assigning `Circle{Radius: 5}` to a Shape variable stores both the concrete type AND value.',
    highlightLines: [26, 27, 28],
    state: {
      phase: 'polymorphism',
      interfaceBox: {
        name: 'Shape',
        methods: ['Area() float64', 'Name() string'],
        heldType: 'Circle',
        heldValue: '{Radius: 5}',
        color: '#00ACD7',
      },
      concreteTypes: [
        { name: 'Circle', fields: [{ key: 'Radius', val: '5' }], methodImpls: ['Area() → 78.54', 'Name() → "Circle"'], color: '#00ACD7', active: true },
        { name: 'Rect', fields: [{ key: 'W', val: '4' }, { key: 'H', val: '6' }], methodImpls: ['Area() → 24.00', 'Name() → "Rect"'], color: '#ffa657' },
      ],
      output: [],
    },
  },
  {
    description: '`printShape(s)` is called with Circle{Radius:5}. The function receives a `Shape` interface. It calls `s.Name()` and `s.Area()` — dispatched to Circle\'s methods at runtime.',
    highlightLines: [21, 22, 23, 31],
    state: {
      phase: 'polymorphism',
      interfaceBox: {
        name: 'Shape',
        methods: ['Area() float64', 'Name() string'],
        heldType: 'Circle',
        heldValue: '{Radius: 5}',
        color: '#00ACD7',
      },
      concreteTypes: [
        { name: 'Circle', fields: [{ key: 'Radius', val: '5' }], methodImpls: ['Area() → 78.54', 'Name() → "Circle"'], color: '#00ACD7', active: true },
        { name: 'Rect', fields: [{ key: 'W', val: '4' }, { key: 'H', val: '6' }], methodImpls: ['Area() → 24.00', 'Name() → "Rect"'], color: '#ffa657' },
      ],
      currentCall: { method: 'printShape(s)', receiver: 'Circle{Radius:5}', result: 'Circle area = 78.54' },
      output: ['Circle area = 78.54'],
    },
  },
  {
    description: 'Same `printShape` function called with Rect{W:4, H:6}. The Shape interface now holds a Rect. Same call — different runtime behavior. This is POLYMORPHISM!',
    highlightLines: [21, 22, 23, 31],
    state: {
      phase: 'polymorphism',
      interfaceBox: {
        name: 'Shape',
        methods: ['Area() float64', 'Name() string'],
        heldType: 'Rect',
        heldValue: '{W:4, H:6}',
        color: '#ffa657',
      },
      concreteTypes: [
        { name: 'Circle', fields: [{ key: 'Radius', val: '5' }], methodImpls: ['Area() → 78.54', 'Name() → "Circle"'], color: '#00ACD7' },
        { name: 'Rect', fields: [{ key: 'W', val: '4' }, { key: 'H', val: '6' }], methodImpls: ['Area() → 24.00', 'Name() → "Rect"'], color: '#ffa657', active: true },
      ],
      currentCall: { method: 'printShape(s)', receiver: 'Rect{W:4,H:6}', result: 'Rect area = 24.00' },
      output: ['Circle area = 78.54', 'Rect area = 24.00'],
    },
  },
  {
    description: '**Type Assertion** — `s.(Circle)` extracts the concrete Circle value from the interface. Returns (value, ok). ok=true because s actually holds a Circle.',
    highlightLines: [35, 36, 37],
    state: {
      phase: 'assertion',
      interfaceBox: {
        name: 'Shape',
        methods: ['Area() float64', 'Name() string'],
        heldType: 'Circle',
        heldValue: '{Radius: 3}',
        color: '#00ACD7',
      },
      concreteTypes: [
        { name: 'Circle', fields: [{ key: 'Radius', val: '3' }], methodImpls: ['Area() → 28.27', 'Name() → "Circle"'], color: '#00ACD7', active: true, assertResult: 'ok' },
        { name: 'Rect', fields: [{ key: 'W', val: '4' }, { key: 'H', val: '6' }], methodImpls: ['Area() → 24.00', 'Name() → "Rect"'], color: '#ffa657', assertResult: null },
      ],
      assertion: {
        expr: 'c, ok := s.(Circle)',
        result: 'c = Circle{Radius:3}, ok = true',
        ok: true,
        note: 'Safe assertion: use the two-value form to avoid panic',
      },
      output: ['Circle area = 78.54', 'Rect area = 24.00', '3 true'],
    },
  },
  {
    description: '`s.(Rect)` — type assertion against Rect FAILS because s holds a Circle. With the two-value form, ok=false and we get the zero value — no panic!',
    highlightLines: [39, 40],
    state: {
      phase: 'assertion',
      interfaceBox: {
        name: 'Shape',
        methods: ['Area() float64', 'Name() string'],
        heldType: 'Circle',
        heldValue: '{Radius: 3}',
        color: '#00ACD7',
      },
      concreteTypes: [
        { name: 'Circle', fields: [{ key: 'Radius', val: '3' }], methodImpls: ['Area() → 28.27', 'Name() → "Circle"'], color: '#00ACD7', assertResult: null },
        { name: 'Rect', fields: [{ key: 'W', val: '4' }, { key: 'H', val: '6' }], methodImpls: ['Area() → 24.00', 'Name() → "Rect"'], color: '#ffa657', assertResult: 'fail' },
      ],
      assertion: {
        expr: '_, ok2 := s.(Rect)',
        result: 'ok2 = false (s holds Circle, not Rect)',
        ok: false,
        note: 'Single-value form s.(Rect) would PANIC here! Always use comma-ok.',
      },
      output: ['Circle area = 78.54', 'Rect area = 24.00', '3 true', 'false'],
    },
  },
  {
    description: '**Type Switch** — `switch v := s.(type)` checks the concrete type of an interface value across multiple cases. Cleaner than chained type assertions.',
    highlightLines: [43, 44, 45, 46, 47, 48],
    state: {
      phase: 'typeswitch',
      interfaceBox: {
        name: 'Shape',
        methods: ['Area() float64', 'Name() string'],
        heldType: 'Circle',
        heldValue: '{Radius: 3}',
        color: '#00ACD7',
      },
      concreteTypes: [
        { name: 'Circle', fields: [{ key: 'Radius', val: '3' }], methodImpls: ['Area() → 28.27', 'Name() → "Circle"'], color: '#00ACD7', active: true },
        { name: 'Rect', fields: [{ key: 'W', val: '4' }, { key: 'H', val: '6' }], methodImpls: ['Area() → 24.00', 'Name() → "Rect"'], color: '#ffa657' },
      ],
      typeSwitch: {
        input: 's (holds Circle{Radius:3})',
        cases: [
          { typeName: 'Circle', matched: true, color: '#00ACD7' },
          { typeName: 'Rect', matched: false, color: '#ffa657' },
        ],
        result: 'case Circle → v.Radius = 3',
      },
      output: ['Circle area = 78.54', 'Rect area = 24.00', '3 true', 'false', 'Circle r = 3'],
      note: 'Type switch gives you the concrete typed variable `v` in each case',
    },
  },
];

export function Interfaces() {
  return (
    <VisualizationLayout
      title="Interfaces & Type Assertions"
      description="Go's implicit interface satisfaction, polymorphism, type assertions, and type switches"
      tag="Basics"
      tagColor="bg-[#3fb950]"
      steps={steps}
      codeLines={codeLines}
      renderVisual={(state: InterfaceState) => (
        <div className="w-full max-w-2xl space-y-4">

          {/* Interface box */}
          <div>
            <p className="text-[#8b949e] text-xs uppercase tracking-wide mb-2">Interface</p>
            <div
              className="rounded-xl border-2 p-4 transition-all duration-300"
              style={{
                borderColor: state.interfaceBox.color ?? '#79c0ff',
                backgroundColor: `${state.interfaceBox.color ?? '#79c0ff'}0d`,
              }}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-mono text-sm mb-2" style={{ color: state.interfaceBox.color ?? '#79c0ff' }}>
                    type {state.interfaceBox.name} interface
                  </p>
                  <div className="space-y-1 ml-3">
                    {state.interfaceBox.methods.map(m => (
                      <p key={m} className="font-mono text-xs text-[#e6edf3]">
                        <span className="text-[#d2a8ff]">{m.split('(')[0]}</span>
                        <span className="text-[#e6edf3]">({m.split('(')[1]}</span>
                      </p>
                    ))}
                  </div>
                </div>

                {/* Interface internal value */}
                {state.interfaceBox.heldType && (
                  <div className="flex-shrink-0 bg-[#0d1117] border border-[#30363d] rounded-lg p-3 text-xs">
                    <p className="text-[#8b949e] mb-1">Interface value = (type, value)</p>
                    <div className="flex gap-2">
                      <div
                        className="px-2 py-1 rounded font-mono"
                        style={{ backgroundColor: `${state.interfaceBox.color}25`, color: state.interfaceBox.color }}
                      >
                        type: {state.interfaceBox.heldType}
                      </div>
                      <div className="px-2 py-1 rounded font-mono bg-[#161b22] text-[#a5d6ff]">
                        val: {state.interfaceBox.heldValue}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Concrete types */}
          {state.concreteTypes.length > 0 && (
            <div>
              <p className="text-[#8b949e] text-xs uppercase tracking-wide mb-2">Concrete Types (implement Shape)</p>
              <div className="grid grid-cols-2 gap-3">
                {state.concreteTypes.map(ct => (
                  <div
                    key={ct.name}
                    className="rounded-xl border-2 p-3 transition-all duration-300"
                    style={{
                      borderColor: ct.active ? ct.color : `${ct.color}50`,
                      backgroundColor: ct.active ? `${ct.color}10` : `${ct.color}06`,
                      boxShadow: ct.active ? `0 0 14px ${ct.color}30` : 'none',
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-mono text-sm" style={{ color: ct.color }}>
                        type {ct.name}
                      </p>
                      {/* Assertion badge */}
                      {ct.assertResult === 'ok' && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-[#3fb950]/20 text-[#3fb950]">✓ match</span>
                      )}
                      {ct.assertResult === 'fail' && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-[#f85149]/20 text-[#f85149]">✗ mismatch</span>
                      )}
                    </div>

                    {/* Fields */}
                    <div className="flex flex-wrap gap-1 mb-2">
                      {ct.fields.map(f => (
                        <span key={f.key} className="text-[10px] font-mono bg-[#0d1117] border border-[#30363d] px-1.5 py-0.5 rounded">
                          <span className="text-[#e6edf3]">{f.key}</span>
                          <span className="text-[#8b949e]">: </span>
                          <span className="text-[#79c0ff]">{f.val}</span>
                        </span>
                      ))}
                    </div>

                    {/* Method implementations */}
                    <div className="space-y-0.5">
                      {ct.methodImpls.map(m => (
                        <p key={m} className="text-[10px] font-mono text-[#8b949e]">
                          <span className="text-[#d2a8ff]">func</span> {m}
                        </p>
                      ))}
                    </div>

                    {/* Implements badge */}
                    <div
                      className="mt-2 text-center text-[10px] rounded py-0.5"
                      style={{ backgroundColor: `${ct.color}15`, color: ct.color }}
                    >
                      implements Shape ✓
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Polymorphic call */}
          {state.currentCall && (
            <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3">
              <p className="text-[#8b949e] text-xs uppercase tracking-wide mb-2">Dynamic Dispatch</p>
              <div className="flex items-center gap-2 font-mono text-xs flex-wrap">
                <span className="text-[#d2a8ff]">{state.currentCall.method}</span>
                <span className="text-[#8b949e]">→ receiver:</span>
                <span className="text-[#ffa657]">{state.currentCall.receiver}</span>
                <span className="text-[#8b949e]">→</span>
                <span className="text-[#3fb950]">{state.currentCall.result}</span>
              </div>
            </div>
          )}

          {/* Type assertion */}
          {state.assertion && (
            <div
              className="rounded-lg border-2 p-3 transition-all duration-300"
              style={{
                borderColor: state.assertion.ok ? '#3fb950' : '#f85149',
                backgroundColor: state.assertion.ok ? 'rgba(63,185,80,0.08)' : 'rgba(248,81,73,0.08)',
              }}
            >
              <p className="text-[#8b949e] text-xs uppercase tracking-wide mb-2">Type Assertion</p>
              <p className="font-mono text-sm text-[#e6edf3] mb-1">{state.assertion.expr}</p>
              <p
                className="text-xs font-mono"
                style={{ color: state.assertion.ok ? '#3fb950' : '#f85149' }}
              >
                → {state.assertion.result}
              </p>
              <p className="text-[#8b949e] text-xs mt-2">⚠️ {state.assertion.note}</p>
            </div>
          )}

          {/* Type switch */}
          {state.typeSwitch && (
            <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3">
              <p className="text-[#8b949e] text-xs uppercase tracking-wide mb-2">Type Switch</p>
              <p className="font-mono text-xs text-[#8b949e] mb-2">input: {state.typeSwitch.input}</p>
              <div className="space-y-1 mb-2">
                {state.typeSwitch.cases.map(c => (
                  <div
                    key={c.typeName}
                    className="flex items-center gap-2 px-2 py-1.5 rounded transition-all duration-300"
                    style={{
                      backgroundColor: c.matched ? `${c.color}20` : 'transparent',
                      borderLeft: c.matched ? `3px solid ${c.color}` : '3px solid transparent',
                    }}
                  >
                    <span className="text-[#ff7b72] font-mono text-xs">case</span>
                    <span className="font-mono text-xs" style={{ color: c.color }}>{c.typeName}</span>
                    {c.matched && <span className="ml-auto text-xs text-[#3fb950]">✓ matched</span>}
                  </div>
                ))}
              </div>
              <p className="font-mono text-xs text-[#3fb950]">→ {state.typeSwitch.result}</p>
            </div>
          )}

          {/* Output */}
          {state.output.length > 0 && (
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
              <p className="text-[#ffa657] text-xs">💡 {state.note}</p>
            </div>
          )}

          {/* Cheat sheet */}
          <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3">
            <p className="text-[#8b949e] text-xs uppercase tracking-wide mb-2">Interface Cheat Sheet</p>
            <div className="space-y-1 text-xs font-mono">
              {[
                { code: 'type I interface { M() }', color: '#79c0ff', desc: 'define interface' },
                { code: 'var i I = ConcreteType{}', color: '#3fb950', desc: 'implicit satisfy' },
                { code: 'v, ok := i.(T)', color: '#ffa657', desc: 'safe type assertion' },
                { code: 'switch v := i.(type)', color: '#d2a8ff', desc: 'type switch' },
              ].map(item => (
                <div key={item.code} className="flex items-center gap-2">
                  <span style={{ color: item.color }}>{item.code}</span>
                  <span className="text-[#8b949e] ml-auto text-[10px]">// {item.desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    />
  );
}
