import { VisualizationLayout, type Step } from '../../components/VisualizationLayout';

interface ChanInfo { name: string; color: string; hasValue: boolean; value?: string; sending: boolean }
interface SelectState {
  channels: ChanInfo[];
  selectedCase?: number; // index of chosen case
  defaultFired?: boolean;
  output: string[];
  note?: string;
}

const codeLines = [
  'package main',
  '',
  'import (',
  '    "fmt"',
  '    "time"',
  ')',
  '',
  'func main() {',
  '    ch1 := make(chan string)',
  '    ch2 := make(chan string)',
  '',
  '    go func() {',
  '        time.Sleep(1 * time.Second)',
  '        ch1 <- "one"',
  '    }()',
  '',
  '    go func() {',
  '        time.Sleep(2 * time.Second)',
  '        ch2 <- "two"',
  '    }()',
  '',
  '    for i := 0; i < 2; i++ {',
  '        select {',
  '        case msg1 := <-ch1:',
  '            fmt.Println("ch1:", msg1)',
  '        case msg2 := <-ch2:',
  '            fmt.Println("ch2:", msg2)',
  '        }',
  '    }',
  '',
  '    // Select with default (non-blocking)',
  '    select {',
  '    case v := <-ch1:',
  '        fmt.Println("got:", v)',
  '    default:',
  '        fmt.Println("no value ready")',
  '    }',
  '}',
];

const chColors = { ch1: '#00ACD7', ch2: '#ffa657', ch3: '#d2a8ff' };

const steps: Step<SelectState>[] = [
  {
    description: 'Create two unbuffered channels ch1 and ch2. Launch goroutines to send on each after different delays.',
    highlightLines: [9, 10, 12, 17],
    state: {
      channels: [
        { name: 'ch1', color: chColors.ch1, hasValue: false, sending: true },
        { name: 'ch2', color: chColors.ch2, hasValue: false, sending: true },
      ],
      output: [],
    },
  },
  {
    description: 'SELECT statement waits on multiple channels simultaneously. It BLOCKS until at least one case is ready. Unlike if/else, select is non-deterministic.',
    highlightLines: [23],
    state: {
      channels: [
        { name: 'ch1', color: chColors.ch1, hasValue: false, sending: true },
        { name: 'ch2', color: chColors.ch2, hasValue: false, sending: true },
      ],
      output: [],
      note: 'select blocks, monitoring all channels...',
    },
  },
  {
    description: 'After ~1 second, goroutine 1 sends "one" to ch1. ch1 is now ready!',
    highlightLines: [14],
    state: {
      channels: [
        { name: 'ch1', color: chColors.ch1, hasValue: true, value: '"one"', sending: false },
        { name: 'ch2', color: chColors.ch2, hasValue: false, sending: true },
      ],
      output: [],
    },
  },
  {
    description: 'SELECT picks the ch1 case (it\'s ready!). msg1 = "one". ch2 case is ignored this iteration.',
    highlightLines: [24, 25],
    state: {
      channels: [
        { name: 'ch1', color: chColors.ch1, hasValue: true, value: '"one"', sending: false },
        { name: 'ch2', color: chColors.ch2, hasValue: false, sending: true },
      ],
      selectedCase: 0,
      output: ['ch1: one'],
    },
  },
  {
    description: 'Loop iteration 2: SELECT waits again. After ~2s total, goroutine 2 sends "two" to ch2.',
    highlightLines: [19],
    state: {
      channels: [
        { name: 'ch1', color: chColors.ch1, hasValue: false, sending: false },
        { name: 'ch2', color: chColors.ch2, hasValue: true, value: '"two"', sending: false },
      ],
      selectedCase: undefined,
      output: ['ch1: one'],
    },
  },
  {
    description: 'SELECT picks ch2 case. msg2 = "two". Both iterations complete.',
    highlightLines: [26, 27],
    state: {
      channels: [
        { name: 'ch1', color: chColors.ch1, hasValue: false, sending: false },
        { name: 'ch2', color: chColors.ch2, hasValue: true, value: '"two"', sending: false },
      ],
      selectedCase: 1,
      output: ['ch1: one', 'ch2: two'],
    },
  },
  {
    description: 'SELECT with DEFAULT — makes select non-blocking! If no channel is ready, the default case runs immediately.',
    highlightLines: [32, 35, 36],
    state: {
      channels: [
        { name: 'ch1', color: chColors.ch1, hasValue: false, sending: false },
        { name: 'ch2', color: chColors.ch2, hasValue: false, sending: false },
      ],
      defaultFired: true,
      output: ['ch1: one', 'ch2: two', 'no value ready'],
      note: 'default case: no blocking!',
    },
  },
];

export function Select() {
  return (
    <VisualizationLayout
      title="Select Statement"
      description="Multiplex multiple channel operations — like switch but for channels"
      tag="Concurrency"
      tagColor="bg-[#00ACD7]"
      steps={steps}
      codeLines={codeLines}
      renderVisual={(state: SelectState) => (
        <div className="w-full max-w-xl space-y-5">
          {/* Select visualization */}
          <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-5">
            <p className="text-[#8b949e] text-xs uppercase tracking-wide mb-4">select {'{'} ... {'}'}</p>

            {/* Channels feeding into select */}
            <div className="flex gap-4">
              {/* Channel boxes */}
              <div className="flex-1 space-y-2">
                {state.channels.map((ch, idx) => (
                  <div
                    key={ch.name}
                    className="flex items-center gap-2 p-3 rounded-lg border-2 transition-all duration-300"
                    style={{
                      borderColor: state.selectedCase === idx ? ch.color : ch.hasValue ? `${ch.color}80` : '#30363d',
                      backgroundColor: state.selectedCase === idx ? `${ch.color}15` : ch.hasValue ? `${ch.color}08` : 'transparent',
                      boxShadow: state.selectedCase === idx ? `0 0 12px ${ch.color}40` : undefined,
                    }}
                  >
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center font-mono text-xs flex-shrink-0 border-2 transition-all"
                      style={{
                        borderColor: ch.hasValue ? ch.color : '#30363d',
                        backgroundColor: ch.hasValue ? `${ch.color}20` : '#0d1117',
                        color: ch.hasValue ? ch.color : '#30363d',
                      }}
                    >
                      {ch.hasValue ? ch.value : '·'}
                    </div>
                    <div className="flex-1">
                      <p className="font-mono text-sm" style={{ color: ch.color }}>{ch.name}</p>
                      <p className="text-xs text-[#8b949e]">
                        {ch.sending ? '⏳ waiting for value...' : ch.hasValue ? `value: ${ch.value}` : 'empty'}
                      </p>
                    </div>
                    {state.selectedCase === idx && (
                      <div className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: `${ch.color}20`, color: ch.color }}>
                        ✓ selected!
                      </div>
                    )}
                  </div>
                ))}

                {/* Default case */}
                {state.defaultFired !== undefined && (
                  <div
                    className="flex items-center gap-2 p-3 rounded-lg border-2 transition-all duration-300"
                    style={{
                      borderColor: state.defaultFired ? '#3fb950' : '#30363d',
                      backgroundColor: state.defaultFired ? 'rgba(63,185,80,0.1)' : 'transparent',
                    }}
                  >
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center text-lg bg-[#0d1117] border border-[#30363d]">
                      ⚡
                    </div>
                    <div className="flex-1">
                      <p className="font-mono text-sm text-[#3fb950]">default:</p>
                      <p className="text-xs text-[#8b949e]">no channel is ready</p>
                    </div>
                    {state.defaultFired && (
                      <div className="text-xs px-2 py-0.5 rounded bg-[#3fb950]/20 text-[#3fb950]">
                        ✓ fired!
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Select box */}
              <div className="flex flex-col items-center justify-center w-24">
                <div
                  className="w-20 h-20 rounded-xl border-2 flex flex-col items-center justify-center transition-all duration-300"
                  style={{
                    borderColor: state.selectedCase !== undefined ? state.channels[state.selectedCase]?.color ?? '#30363d' : '#30363d',
                    backgroundColor: state.selectedCase !== undefined ? `${state.channels[state.selectedCase]?.color}10` : '#0d1117',
                  }}
                >
                  <span className="text-2xl">🔀</span>
                  <span className="text-[#8b949e] text-[10px]">select</span>
                </div>
                <p className="text-[#8b949e] text-xs text-center mt-2">
                  {state.selectedCase !== undefined
                    ? `picked ${state.channels[state.selectedCase]?.name}`
                    : state.defaultFired ? 'default' : 'waiting...'}
                </p>
              </div>
            </div>
          </div>

          {/* Note */}
          {state.note && (
            <div className="bg-[#00ACD7]/10 border border-[#00ACD7]/30 rounded-lg p-3">
              <p className="text-[#00ACD7] text-xs">⚡ {state.note}</p>
            </div>
          )}

          {/* Output */}
          {state.output.length > 0 && (
            <div className="bg-[#0d1117] border border-[#30363d] rounded-lg p-3">
              <p className="text-[#8b949e] text-xs uppercase tracking-wide mb-2">Output</p>
              {state.output.map((line, i) => (
                <p key={i} className="text-[#3fb950] font-mono text-sm">{line}</p>
              ))}
            </div>
          )}

          {/* Key facts */}
          <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4 space-y-2 text-xs text-[#8b949e]">
            <p className="text-[#e6edf3] text-sm mb-2">Select Key Points</p>
            {[
              { icon: '🎲', text: 'If multiple cases ready, one is chosen at random (non-deterministic).' },
              { icon: '⏸', text: 'Without default: blocks until any case is ready.' },
              { icon: '⚡', text: 'With default: never blocks — like a non-blocking channel check.' },
              { icon: '🔄', text: 'Common pattern: fan-in multiple goroutines into one channel.' },
            ].map(f => (
              <div key={f.icon} className="flex gap-2">
                <span>{f.icon}</span>
                <p>{f.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    />
  );
}
