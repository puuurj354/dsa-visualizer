import { VisualizationLayout, type Step } from '../../components/VisualizationLayout';

interface ErrorNode {
  id: string;
  typeName: string;
  message: string;
  color: string;
  wrappedById?: string;
  isTarget?: boolean;
  matched?: boolean;
}

interface IsAsResult {
  fn: 'errors.Is' | 'errors.As';
  target: string;
  result: boolean;
  extracted?: string;
  note: string;
}

interface ErrorState {
  phase: 'sentinel' | 'custom' | 'wrap' | 'unwrap-is' | 'unwrap-as';
  chain: ErrorNode[];
  isAsResults: IsAsResult[];
  output: string[];
  highlightChainId?: string;
  note?: string;
}

const codeLines = [
  'package main',
  '',
  'import (',
  '    "errors"',
  '    "fmt"',
  ')',
  '',
  '// Sentinel error — comparable with ==',
  'var ErrNotFound = errors.New("not found")',
  '',
  '// Custom error type with extra context',
  'type QueryError struct {',
  '    Query string',
  '    Err   error',
  '}',
  '',
  'func (e *QueryError) Error() string {',
  '    return fmt.Sprintf("query %q: %v", e.Query, e.Err)',
  '}',
  '',
  'func (e *QueryError) Unwrap() error { return e.Err }',
  '',
  'func findUser(id int) error {',
  '    // Wrap: add context without losing original error',
  '    return fmt.Errorf("findUser %d: %w",',
  '        id, &QueryError{',
  '            Query: "SELECT * FROM users",',
  '            Err:   ErrNotFound,',
  '        })',
  '}',
  '',
  'func main() {',
  '    err := findUser(42)',
  '',
  '    // errors.Is: checks entire chain for target',
  '    fmt.Println(errors.Is(err, ErrNotFound)) // true',
  '',
  '    // errors.As: extracts concrete type from chain',
  '    var qErr *QueryError',
  '    if errors.As(err, &qErr) {',
  '        fmt.Println("Query:", qErr.Query)',
  '    }',
  '',
  '    fmt.Println(err)',
  '}',
];

const steps: Step<ErrorState>[] = [
  {
    description: '`errors.New("not found")` creates a SENTINEL error — a package-level variable used as a well-known error value. Can be compared with `==` but wrapping breaks that comparison.',
    highlightLines: [9],
    state: {
      phase: 'sentinel',
      chain: [
        { id: 'sentinel', typeName: 'errors.New', message: '"not found"', color: '#ffa657' },
      ],
      isAsResults: [],
      output: [],
      note: 'Sentinel errors: var ErrNotFound = errors.New("not found")',
    },
  },
  {
    description: '`QueryError` is a CUSTOM error type implementing the `error` interface via `Error() string`. It also implements `Unwrap() error` — this is the key to the error chain!',
    highlightLines: [12, 13, 14, 15, 17, 18, 19, 21],
    state: {
      phase: 'custom',
      chain: [
        { id: 'sentinel', typeName: 'errors.New', message: '"not found"', color: '#ffa657' },
        {
          id: 'query',
          typeName: '*QueryError',
          message: 'query "SELECT * FROM users": not found',
          color: '#d2a8ff',
          wrappedById: 'sentinel',
        },
      ],
      isAsResults: [],
      output: [],
      note: 'Unwrap() error lets errors.Is/As traverse the chain',
    },
  },
  {
    description: '`fmt.Errorf("findUser %d: %w", id, qErr)` — the `%w` verb WRAPS the error. The outer error message adds context; the inner error is preserved and accessible via Unwrap().',
    highlightLines: [25, 26, 27, 28, 29],
    state: {
      phase: 'wrap',
      chain: [
        { id: 'sentinel', typeName: 'errors.New', message: '"not found"', color: '#ffa657' },
        { id: 'query', typeName: '*QueryError', message: 'query "SELECT * FROM users": not found', color: '#d2a8ff', wrappedById: 'sentinel' },
        { id: 'top', typeName: 'fmt.Errorf (%w)', message: 'findUser 42: query "SELECT * FROM users": not found', color: '#00ACD7', wrappedById: 'query' },
      ],
      isAsResults: [],
      output: [],
      note: '%w wraps — %v embeds message only (no chain). Always use %w!',
    },
  },
  {
    description: '`errors.Is(err, ErrNotFound)` — traverses the ENTIRE error chain by calling Unwrap() repeatedly. Checks if any error in the chain == ErrNotFound. Returns true!',
    highlightLines: [35],
    state: {
      phase: 'unwrap-is',
      chain: [
        { id: 'sentinel', typeName: 'errors.New', message: '"not found"', color: '#ffa657', isTarget: true, matched: true },
        { id: 'query', typeName: '*QueryError', message: 'query "SELECT * FROM users": not found', color: '#d2a8ff', wrappedById: 'sentinel' },
        { id: 'top', typeName: 'fmt.Errorf (%w)', message: 'findUser 42: ...', color: '#00ACD7', wrappedById: 'query' },
      ],
      isAsResults: [
        {
          fn: 'errors.Is',
          target: 'ErrNotFound',
          result: true,
          note: 'top → Unwrap() → *QueryError → Unwrap() → ErrNotFound ✓ match!',
        },
      ],
      highlightChainId: 'sentinel',
      output: ['true'],
      note: 'errors.Is walks: top → query → sentinel. Found ErrNotFound!',
    },
  },
  {
    description: 'errors.Is traversal: top → Unwrap() → *QueryError → Unwrap() → ErrNotFound. Match found at the bottom of the chain. Comparison uses `==`.',
    highlightLines: [35],
    state: {
      phase: 'unwrap-is',
      chain: [
        { id: 'sentinel', typeName: 'errors.New', message: '"not found"', color: '#ffa657', matched: true },
        { id: 'query', typeName: '*QueryError', message: 'query "SELECT * FROM users": not found', color: '#d2a8ff', wrappedById: 'sentinel', matched: true },
        { id: 'top', typeName: 'fmt.Errorf (%w)', message: 'findUser 42: ...', color: '#00ACD7', wrappedById: 'query', matched: true },
      ],
      isAsResults: [
        {
          fn: 'errors.Is',
          target: 'ErrNotFound',
          result: true,
          note: 'Chain traversed: 3 levels deep. Found at level 3.',
        },
      ],
      output: ['true'],
    },
  },
  {
    description: '`errors.As(err, &qErr)` — searches the chain for an error that can be ASSIGNED to `*QueryError`. If found, sets the variable and returns true. Extracts the concrete type!',
    highlightLines: [38, 39, 40, 41],
    state: {
      phase: 'unwrap-as',
      chain: [
        { id: 'sentinel', typeName: 'errors.New', message: '"not found"', color: '#ffa657' },
        { id: 'query', typeName: '*QueryError', message: 'query "SELECT * FROM users": not found', color: '#d2a8ff', wrappedById: 'sentinel', isTarget: true, matched: true },
        { id: 'top', typeName: 'fmt.Errorf (%w)', message: 'findUser 42: ...', color: '#00ACD7', wrappedById: 'query' },
      ],
      isAsResults: [
        {
          fn: 'errors.Is',
          target: 'ErrNotFound',
          result: true,
          note: 'Found in chain',
        },
        {
          fn: 'errors.As',
          target: '*QueryError',
          result: true,
          extracted: 'qErr.Query = "SELECT * FROM users"',
          note: 'top → Unwrap() → *QueryError ✓ assignable!',
        },
      ],
      highlightChainId: 'query',
      output: ['true', 'Query: SELECT * FROM users'],
      note: 'errors.As extracts the concrete *QueryError — access its Query field!',
    },
  },
  {
    description: 'Final output: the full error string is printed. `fmt.Println(err)` shows the complete wrapped message — all 3 levels concatenated with context.',
    highlightLines: [43],
    state: {
      phase: 'unwrap-as',
      chain: [
        { id: 'sentinel', typeName: 'errors.New', message: '"not found"', color: '#ffa657' },
        { id: 'query', typeName: '*QueryError', message: 'query "SELECT * FROM users": not found', color: '#d2a8ff', wrappedById: 'sentinel' },
        { id: 'top', typeName: 'fmt.Errorf (%w)', message: 'findUser 42: query "SELECT * FROM users": not found', color: '#00ACD7', wrappedById: 'query' },
      ],
      isAsResults: [
        { fn: 'errors.Is', target: 'ErrNotFound', result: true, note: 'Found in chain' },
        { fn: 'errors.As', target: '*QueryError', result: true, extracted: 'qErr.Query = "SELECT * FROM users"', note: 'Extracted concrete type' },
      ],
      output: [
        'true',
        'Query: SELECT * FROM users',
        'findUser 42: query "SELECT * FROM users": not found',
      ],
      note: '✅ Error chain: context preserved, original error inspectable',
    },
  },
];

export function ErrorWrapping() {
  return (
    <VisualizationLayout
      title="Error Wrapping"
      description="fmt.Errorf %w, errors.Is chain traversal, and errors.As type extraction"
      tag="Basics"
      tagColor="bg-[#3fb950]"
      steps={steps}
      codeLines={codeLines}
      renderVisual={(state: ErrorState) => (
        <div className="w-full max-w-2xl space-y-4">

          {/* Error chain */}
          <div>
            <p className="text-[#8b949e] text-xs uppercase tracking-wide mb-2">Error Chain (Unwrap tree)</p>
            <div className="space-y-0">
              {[...state.chain].reverse().map((node, i, arr) => {
                const isHighlighted = state.highlightChainId === node.id;
                return (
                  <div key={node.id}>
                    {/* Node */}
                    <div
                      className="rounded-xl border-2 p-3 transition-all duration-300"
                      style={{
                        borderColor: node.matched ? '#3fb950' : isHighlighted ? node.color : `${node.color}60`,
                        backgroundColor: node.matched ? 'rgba(63,185,80,0.08)' : isHighlighted ? `${node.color}12` : `${node.color}06`,
                        boxShadow: (node.matched || isHighlighted) ? `0 0 14px ${node.matched ? '#3fb950' : node.color}30` : 'none',
                      }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span
                              className="font-mono text-xs px-2 py-0.5 rounded"
                              style={{
                                backgroundColor: `${node.color}20`,
                                color: node.matched ? '#3fb950' : node.color,
                              }}
                            >
                              {node.typeName}
                            </span>
                            {node.isTarget && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#3fb950]/20 text-[#3fb950]">← target</span>
                            )}
                            {node.matched && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#3fb950]/20 text-[#3fb950]">✓ match</span>
                            )}
                          </div>
                          <p className="font-mono text-xs text-[#e6edf3] break-all">{node.message}</p>
                        </div>
                      </div>
                    </div>

                    {/* Arrow connector (Unwrap) */}
                    {i < arr.length - 1 && (
                      <div className="flex items-center gap-2 ml-4 my-1">
                        <div className="flex flex-col items-center">
                          <div className="w-px h-3 bg-[#30363d]" />
                          <span className="text-[#8b949e] text-[10px]">Unwrap()</span>
                          <div className="w-px h-3 bg-[#30363d]" />
                          <span className="text-[#30363d]">↓</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* errors.Is / errors.As results */}
          {state.isAsResults.length > 0 && (
            <div className="space-y-2">
              <p className="text-[#8b949e] text-xs uppercase tracking-wide">Inspection Results</p>
              {state.isAsResults.map((r, i) => (
                <div
                  key={i}
                  className="rounded-lg border-2 p-3 transition-all duration-300"
                  style={{
                    borderColor: r.result ? '#3fb950' : '#f85149',
                    backgroundColor: r.result ? 'rgba(63,185,80,0.07)' : 'rgba(248,81,73,0.07)',
                  }}
                >
                  <div className="flex items-center gap-3 mb-1.5 flex-wrap">
                    <span
                      className="font-mono text-xs px-2 py-0.5 rounded"
                      style={{
                        backgroundColor: r.fn === 'errors.Is' ? 'rgba(0,172,215,0.2)' : 'rgba(210,168,255,0.2)',
                        color: r.fn === 'errors.Is' ? '#00ACD7' : '#d2a8ff',
                      }}
                    >
                      {r.fn}
                    </span>
                    <span className="font-mono text-xs text-[#8b949e]">target: <span style={{ color: '#ffa657' }}>{r.target}</span></span>
                    <span
                      className="ml-auto font-mono text-sm px-3 py-0.5 rounded-full"
                      style={{
                        backgroundColor: r.result ? 'rgba(63,185,80,0.2)' : 'rgba(248,81,73,0.2)',
                        color: r.result ? '#3fb950' : '#f85149',
                      }}
                    >
                      {String(r.result)}
                    </span>
                  </div>
                  {r.extracted && (
                    <p className="font-mono text-xs text-[#d2a8ff] mb-1">→ extracted: {r.extracted}</p>
                  )}
                  <p className="text-[#8b949e] text-xs">{r.note}</p>
                </div>
              ))}
            </div>
          )}

          {/* Output */}
          {state.output.length > 0 && (
            <div className="bg-[#0d1117] border border-[#30363d] rounded-lg p-3">
              <p className="text-[#8b949e] text-xs uppercase tracking-wide mb-2">Output</p>
              {state.output.map((line, i) => (
                <p key={i} className="font-mono text-xs text-[#3fb950]">{line}</p>
              ))}
            </div>
          )}

          {/* Note */}
          {state.note && (
            <div
              className="border rounded-lg p-3"
              style={{
                backgroundColor: state.note.startsWith('✅') ? 'rgba(63,185,80,0.08)' : 'rgba(0,172,215,0.08)',
                borderColor: state.note.startsWith('✅') ? 'rgba(63,185,80,0.4)' : 'rgba(0,172,215,0.4)',
              }}
            >
              <p className="text-xs" style={{ color: state.note.startsWith('✅') ? '#3fb950' : '#00ACD7' }}>
                💡 {state.note}
              </p>
            </div>
          )}

          {/* Cheat sheet */}
          <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3">
            <p className="text-[#8b949e] text-xs uppercase tracking-wide mb-2">Error Wrapping Cheat Sheet</p>
            <div className="space-y-1.5 text-xs font-mono">
              {[
                { code: 'errors.New("msg")', color: '#ffa657', desc: 'sentinel error, comparable with ==' },
                { code: 'fmt.Errorf("ctx: %w", err)', color: '#00ACD7', desc: '%w wraps, preserves chain' },
                { code: 'fmt.Errorf("ctx: %v", err)', color: '#8b949e', desc: '%v embeds string only, no chain!' },
                { code: 'errors.Is(err, target)', color: '#3fb950', desc: 'walks chain with == checks' },
                { code: 'errors.As(err, &target)', color: '#d2a8ff', desc: 'walks chain, type-asserts & assigns' },
                { code: 'func (e *T) Unwrap() error', color: '#79c0ff', desc: 'required for chain traversal' },
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
