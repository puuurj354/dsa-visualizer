import { VisualizationLayout, type Step } from '../../components/VisualizationLayout';
import { type ComplexityInfo } from '../../components/ComplexityCard';

interface TypeInstantiation {
    typeParam: string;
    color: string;
    inputValues: string[];
    outputValue: string;
    active: boolean;
}

interface GenericFunc {
    name: string;
    signature: string;
    constraint: string;
}

interface GenericsState {
    func: GenericFunc | null;
    instantiations: TypeInstantiation[];
    currentCall?: string;
    output: string[];
    note?: string;
}

const genericsComplexity: ComplexityInfo = {
    time: {
        best: 'O(same as T)', // identical to the concrete type version
        average: 'O(same as T)',
        worst: 'O(same as T)', // zero overhead — specialization at compile time
    },
    space: 'O(same as T)', // no boxing — values stored directly, not as interface{}
    notes: 'Go generics use compile-time monomorphization: one source, multiple compiled versions. Unlike Java generics (type erasure), no runtime overhead or boxing costs.',
};

const codeLines = [
    'package main',
    '',
    'import "fmt"',
    '',
    '// Map applies fn to every element of s.',
    '// T and R can be ANY type. The compiler generates',
    '// a concrete version for each type combo used.',
    'func Map[T, R any](s []T, fn func(T) R) []R {',
    '    result := make([]R, len(s))',
    '    for i, v := range s {',
    '        result[i] = fn(v)',
    '    }',
    '    return result',
    '}',
    '',
    '// Min accepts any Ordered type (int, float64, string...)',
    'func Min[T interface{ ~int | ~float64 | ~string }](a, b T) T {',
    '    if a < b { return a }',
    '    return b',
    '}',
    '',
    'func main() {',
    '    // T=int, R=string — type inferred by compiler',
    '    strs := Map([]int{1, 2, 3}, func(n int) string {',
    '        return fmt.Sprintf("item%d", n)',
    '    })',
    '    fmt.Println(strs) // [item1 item2 item3]',
    '',
    '    // T=float64, R=float64',
    '    doubled := Map([]float64{1.5, 2.5}, func(n float64) float64 {',
    '        return n * 2',
    '    })',
    '    fmt.Println(doubled) // [3 5]',
    '',
    '    fmt.Println(Min(3, 7))      // 3',
    '    fmt.Println(Min("b", "a")) // a',
    '}',
];

const steps: Step<GenericsState>[] = [
    {
        description: 'Go 1.18 added Generics (type parameters). A generic function works with ANY type — the compiler generates a concrete, fully type-checked version for each usage.',
        highlightLines: [8],
        state: { func: null, instantiations: [], output: [] },
    },
    {
        description: '`func Map[T, R any](...)` — `[T, R any]` are TYPE PARAMETERS. `any` means "any type". One function body covers ints, strings, structs, etc.',
        highlightLines: [8, 9, 10, 11, 12, 13],
        state: {
            func: { name: 'Map', signature: 'func Map[T, R any](s []T, fn func(T) R) []R', constraint: 'T, R: any' },
            instantiations: [],
            output: [],
            note: 'Type params [T, R] resolved at compile time — zero runtime cost',
        },
    },
    {
        description: '`Min[T interface{~int|~float64|~string}]` — a union constraint. `~int` means "int OR any type whose underlying type is int". More specific than `any`.',
        highlightLines: [17, 18, 19, 20],
        state: {
            func: { name: 'Min', signature: 'func Min[T ~int|~float64|~string](a, b T) T', constraint: 'T: int | float64 | string' },
            instantiations: [],
            output: [],
        },
    },
    {
        description: '`Map([]int{1,2,3}, ...)` — Go INFERS T=int from the slice and R=string from the func return type. No need to write `Map[int, string](...)`.',
        highlightLines: [24, 25, 26, 27],
        state: {
            func: { name: 'Map', signature: 'func Map[T, R any](s []T, fn func(T) R) []R', constraint: 'T, R: any' },
            instantiations: [
                { typeParam: 'T=int, R=string', color: '#3fb950', inputValues: ['1', '2', '3'], outputValue: '[item1 item2 item3]', active: true },
            ],
            currentCall: 'Map[int, string]([]int{1,2,3}, sprintf)',
            output: ['[item1 item2 item3]'],
        },
    },
    {
        description: 'Same `Map`, now with T=float64, R=float64. Compiler generates a SECOND specialization internally. One source file, multiple concrete implementations.',
        highlightLines: [30, 31, 32, 33],
        state: {
            func: { name: 'Map', signature: 'func Map[T, R any](s []T, fn func(T) R) []R', constraint: 'T, R: any' },
            instantiations: [
                { typeParam: 'T=int, R=string', color: '#3fb950', inputValues: ['1', '2', '3'], outputValue: '[item1 item2 item3]', active: false },
                { typeParam: 'T=float64, R=float64', color: '#00ACD7', inputValues: ['1.5', '2.5'], outputValue: '[3 5]', active: true },
            ],
            currentCall: 'Map[float64, float64]([]float64{1.5,2.5}, n*2)',
            output: ['[item1 item2 item3]', '[3 5]'],
        },
    },
    {
        description: '`Min(3, 7)` infers T=int. `Min("b","a")` infers T=string. Same function, two type instantiations. The constraint ensures `<` is valid for both.',
        highlightLines: [35, 36],
        state: {
            func: { name: 'Min', signature: 'func Min[T ~int|~float64|~string](a, b T) T', constraint: 'T: int | float64 | string' },
            instantiations: [
                { typeParam: 'T=int', color: '#ffa657', inputValues: ['3', '7'], outputValue: '3', active: true },
                { typeParam: 'T=string', color: '#d2a8ff', inputValues: ['"b"', '"a"'], outputValue: '"a"', active: true },
            ],
            currentCall: 'Min[int](3,7) → 3   |   Min[string]("b","a") → "a"',
            output: ['[item1 item2 item3]', '[3 5]', '3', 'a'],
            note: 'Zero runtime overhead — each instantiation is a compiled concrete function',
        },
    },
];

export function Generics() {
    return (
        <VisualizationLayout
            title="Generics (Go 1.18+)"
            description="Type parameters — write once, the compiler generates type-specific code"
            tag="Basics"
            tagColor="bg-[#3fb950]"
            steps={steps}
            complexity={genericsComplexity}
            codeLines={codeLines}
            renderVisual={(state: GenericsState) => (
                <div className="w-full max-w-xl space-y-4">
                    {state.func && (
                        <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
                            <p className="text-[#8b949e] text-xs uppercase tracking-wide mb-2">Generic function</p>
                            <p className="font-mono text-sm text-[#e6edf3] break-all">{state.func.signature}</p>
                            <p className="font-mono text-xs text-[#ffa657] mt-1">constraint: {state.func.constraint}</p>
                        </div>
                    )}

                    {state.currentCall && (
                        <div className="bg-[#00ACD7]/10 border border-[#00ACD7]/30 rounded-lg p-3">
                            <p className="text-[#8b949e] text-xs uppercase tracking-wide mb-1">Current instantiation</p>
                            <p className="font-mono text-sm text-[#00ACD7]">{state.currentCall}</p>
                        </div>
                    )}

                    {state.instantiations.length > 0 && (
                        <div>
                            <p className="text-[#8b949e] text-xs uppercase tracking-wide mb-2">Compiler generates</p>
                            <div className="space-y-2">
                                {state.instantiations.map((inst, i) => (
                                    <div
                                        key={i}
                                        className="flex items-center gap-3 p-3 rounded-lg border transition-all duration-300"
                                        style={{
                                            borderColor: inst.active ? inst.color : '#30363d',
                                            backgroundColor: inst.active ? `${inst.color}0f` : '#161b22',
                                        }}
                                    >
                                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: inst.color }} />
                                        <div className="flex-1">
                                            <p className="font-mono text-xs" style={{ color: inst.color }}>{inst.typeParam}</p>
                                            <p className="text-[#8b949e] text-xs mt-0.5">
                                                [{inst.inputValues.join(', ')}] → {inst.outputValue}
                                            </p>
                                        </div>
                                        <span className="text-xs px-2 py-0.5 rounded-full"
                                            style={{ color: inst.active ? inst.color : '#8b949e', backgroundColor: inst.active ? `${inst.color}20` : 'transparent' }}>
                                            {inst.active ? 'active' : 'compiled'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {state.output.length > 0 && (
                        <div className="bg-[#0d1117] border border-[#30363d] rounded-lg p-3">
                            <p className="text-[#8b949e] text-xs uppercase tracking-wide mb-2">Output</p>
                            {state.output.map((line, i) => (
                                <p key={i} className="text-[#3fb950] font-mono text-xs">{line}</p>
                            ))}
                        </div>
                    )}

                    {!state.func && (
                        <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3">
                            <p className="text-[#8b949e] text-xs uppercase tracking-wide mb-2">Generics vs interface{'{}'}</p>
                            <div className="grid grid-cols-2 gap-3 text-xs">
                                <div>
                                    <p className="text-[#ff7b72] mb-1">interface{'{}'} (before 1.18)</p>
                                    <p className="text-[#8b949e]">runtime type assertions</p>
                                    <p className="text-[#ff7b72]">no compile-time safety</p>
                                </div>
                                <div>
                                    <p className="text-[#3fb950] mb-1">Generics ✓</p>
                                    <p className="text-[#8b949e]">resolved at compile time</p>
                                    <p className="text-[#3fb950]">fully type-safe</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {state.note && (
                        <div className="bg-[#3fb950]/10 border border-[#3fb950]/30 rounded-lg p-3">
                            <p className="text-[#3fb950] text-xs">✓ {state.note}</p>
                        </div>
                    )}
                </div>
            )}
        />
    );
}
