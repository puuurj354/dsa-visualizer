import { VisualizationLayout, type Step } from '../../components/VisualizationLayout';

interface ChanState {
  senderStatus: 'idle' | 'sending' | 'blocked' | 'done';
  receiverStatus: 'idle' | 'waiting' | 'receiving' | 'done';
  channelState: 'empty' | 'transferring' | 'empty-after';
  value?: number;
  output: string[];
  arrow?: 'sender-to-chan' | 'chan-to-receiver' | null;
}

const codeLines = [
  'package main',
  '',
  'import "fmt"',
  '',
  'func producer(ch chan int) {',
  '    fmt.Println("Producer: sending 42")',
  '    ch <- 42  // BLOCKS until receiver is ready',
  '    fmt.Println("Producer: sent!")',
  '}',
  '',
  'func consumer(ch chan int) {',
  '    fmt.Println("Consumer: waiting...")',
  '    val := <-ch  // BLOCKS until sender sends',
  '    fmt.Printf("Consumer: received %d\\n", val)',
  '}',
  '',
  'func main() {',
  '    ch := make(chan int)  // unbuffered',
  '    go producer(ch)',
  '    go consumer(ch)',
  '',
  '    // Wait for goroutines',
  '    var input string',
  '    fmt.Scanln(&input)',
  '}',
];

const steps: Step<ChanState>[] = [
  {
    description: 'Create an UNBUFFERED channel with make(chan int). An unbuffered channel has NO capacity — it requires both sender and receiver to be ready simultaneously.',
    highlightLines: [18],
    state: { senderStatus: 'idle', receiverStatus: 'idle', channelState: 'empty', output: [] },
  },
  {
    description: '`go producer(ch)` — launch producer goroutine. It starts and prints "Producer: sending 42".',
    highlightLines: [19, 5, 6],
    state: { senderStatus: 'sending', receiverStatus: 'idle', channelState: 'empty', output: ['Producer: sending 42'] },
  },
  {
    description: 'Producer tries `ch <- 42` (send). BLOCKED! Unbuffered channel has no space — must wait for a receiver.',
    highlightLines: [7],
    state: { senderStatus: 'blocked', receiverStatus: 'idle', channelState: 'empty', value: 42, output: ['Producer: sending 42'], arrow: 'sender-to-chan' },
  },
  {
    description: '`go consumer(ch)` — launch consumer goroutine. It prints "Consumer: waiting...".',
    highlightLines: [20, 11, 12],
    state: { senderStatus: 'blocked', receiverStatus: 'waiting', channelState: 'empty', value: 42, output: ['Producer: sending 42', 'Consumer: waiting...'], arrow: 'sender-to-chan' },
  },
  {
    description: 'Consumer tries `<-ch` (receive). Both goroutines are now ready! The RENDEZVOUS happens — value 42 transfers atomically.',
    highlightLines: [13],
    state: { senderStatus: 'blocked', receiverStatus: 'receiving', channelState: 'transferring', value: 42, output: ['Producer: sending 42', 'Consumer: waiting...'], arrow: 'chan-to-receiver' },
  },
  {
    description: 'Transfer complete! Producer unblocks (send succeeded). Consumer receives val=42.',
    highlightLines: [8, 14],
    state: { senderStatus: 'done', receiverStatus: 'done', channelState: 'empty-after', value: 42, output: ['Producer: sending 42', 'Consumer: waiting...', 'Producer: sent!', 'Consumer: received 42'], arrow: null },
  },
  {
    description: 'Both goroutines finish. KEY INSIGHT: Unbuffered channels synchronize goroutines — they force a "handshake".',
    highlightLines: [17],
    state: { senderStatus: 'done', receiverStatus: 'done', channelState: 'empty-after', value: 42, output: ['Producer: sending 42', 'Consumer: waiting...', 'Producer: sent!', 'Consumer: received 42'] },
  },
];

export function Channels() {
  return (
    <VisualizationLayout
      title="Channels (Unbuffered)"
      description="Go channels — type-safe communication between goroutines"
      tag="Concurrency"
      tagColor="bg-[#00ACD7]"
      steps={steps}
      codeLines={codeLines}
      renderVisual={(state: ChanState) => (
        <div className="w-full max-w-xl space-y-5">
          {/* Main visualization */}
          <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-6">
            <div className="flex items-center gap-3">
              {/* Producer */}
              <div
                className="flex-1 rounded-xl border-2 p-4 text-center transition-all duration-300"
                style={{
                  borderColor: state.senderStatus === 'blocked' ? '#f85149' : state.senderStatus === 'done' ? '#3fb950' : state.senderStatus === 'sending' ? '#ffa657' : '#30363d',
                  backgroundColor: state.senderStatus === 'blocked' ? 'rgba(248,81,73,0.08)' : state.senderStatus === 'done' ? 'rgba(63,185,80,0.08)' : 'rgba(255,166,87,0.05)',
                }}
              >
                <div className="text-2xl mb-2">📤</div>
                <p className="text-[#e6edf3] text-sm font-mono">producer</p>
                <div
                  className="mt-2 text-xs px-2 py-1 rounded-full"
                  style={{
                    backgroundColor: state.senderStatus === 'blocked' ? 'rgba(248,81,73,0.2)' : state.senderStatus === 'done' ? 'rgba(63,185,80,0.2)' : 'rgba(255,166,87,0.2)',
                    color: state.senderStatus === 'blocked' ? '#f85149' : state.senderStatus === 'done' ? '#3fb950' : '#ffa657',
                  }}
                >
                  {state.senderStatus === 'idle' ? 'idle' : state.senderStatus === 'sending' ? 'sending...' : state.senderStatus === 'blocked' ? '⏸ BLOCKED' : '✓ done'}
                </div>
                {state.senderStatus === 'sending' || state.senderStatus === 'blocked' ? (
                  <div className="mt-2 bg-[#ffa657]/10 border border-[#ffa657]/30 rounded-lg px-3 py-1.5 font-mono text-[#ffa657]">
                    ch ← {state.value}
                  </div>
                ) : null}
              </div>

              {/* Channel */}
              <div className="flex flex-col items-center gap-2">
                {/* Arrow from producer */}
                {state.arrow === 'sender-to-chan' && (
                  <div className="flex items-center">
                    <div className="w-6 h-0.5 bg-[#ffa657]" />
                    <div className="w-0 h-0" style={{ borderTop: '4px solid transparent', borderBottom: '4px solid transparent', borderLeft: '8px solid #ffa657' }} />
                  </div>
                )}

                {/* Channel box */}
                <div
                  className="w-16 h-16 rounded-lg border-2 flex flex-col items-center justify-center transition-all duration-300"
                  style={{
                    borderColor: state.channelState === 'transferring' ? '#00ACD7' : '#30363d',
                    backgroundColor: state.channelState === 'transferring' ? 'rgba(0,172,215,0.2)' : '#0d1117',
                    boxShadow: state.channelState === 'transferring' ? '0 0 20px rgba(0,172,215,0.4)' : undefined,
                  }}
                >
                  <span className="text-lg">{state.channelState === 'transferring' ? '📦' : '⬡'}</span>
                  <span className="text-[10px] text-[#8b949e]">chan int</span>
                  {state.channelState === 'transferring' && (
                    <span className="text-[10px] text-[#00ACD7]">{state.value}</span>
                  )}
                </div>
                <span className="text-[#8b949e] text-[10px]">unbuffered</span>
                <span className="text-[#8b949e] text-[10px]">cap=0</span>

                {/* Arrow to receiver */}
                {state.arrow === 'chan-to-receiver' && (
                  <div className="flex items-center">
                    <div className="w-6 h-0.5 bg-[#00ACD7]" />
                    <div className="w-0 h-0" style={{ borderTop: '4px solid transparent', borderBottom: '4px solid transparent', borderLeft: '8px solid #00ACD7' }} />
                  </div>
                )}
              </div>

              {/* Consumer */}
              <div
                className="flex-1 rounded-xl border-2 p-4 text-center transition-all duration-300"
                style={{
                  borderColor: state.receiverStatus === 'waiting' ? '#ffa657' : state.receiverStatus === 'receiving' ? '#00ACD7' : state.receiverStatus === 'done' ? '#3fb950' : '#30363d',
                  backgroundColor: state.receiverStatus === 'receiving' ? 'rgba(0,172,215,0.08)' : state.receiverStatus === 'done' ? 'rgba(63,185,80,0.08)' : 'transparent',
                }}
              >
                <div className="text-2xl mb-2">📥</div>
                <p className="text-[#e6edf3] text-sm font-mono">consumer</p>
                <div
                  className="mt-2 text-xs px-2 py-1 rounded-full"
                  style={{
                    backgroundColor: state.receiverStatus === 'waiting' ? 'rgba(255,166,87,0.2)' : state.receiverStatus === 'done' ? 'rgba(63,185,80,0.2)' : state.receiverStatus === 'receiving' ? 'rgba(0,172,215,0.2)' : 'rgba(139,148,158,0.2)',
                    color: state.receiverStatus === 'waiting' ? '#ffa657' : state.receiverStatus === 'done' ? '#3fb950' : state.receiverStatus === 'receiving' ? '#00ACD7' : '#8b949e',
                  }}
                >
                  {state.receiverStatus === 'idle' ? 'idle' : state.receiverStatus === 'waiting' ? '⏸ waiting' : state.receiverStatus === 'receiving' ? '⚡ receiving!' : `✓ got ${state.value}`}
                </div>
              </div>
            </div>
          </div>

          {/* Channel rules */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#f85149]/8 border border-[#f85149]/25 rounded-lg p-3">
              <p className="text-[#f85149] text-xs font-mono mb-1">ch &lt;- val</p>
              <p className="text-[#8b949e] text-xs">SEND: blocks until receiver is ready</p>
            </div>
            <div className="bg-[#3fb950]/8 border border-[#3fb950]/25 rounded-lg p-3">
              <p className="text-[#3fb950] text-xs font-mono mb-1">val := &lt;-ch</p>
              <p className="text-[#8b949e] text-xs">RECEIVE: blocks until sender sends</p>
            </div>
          </div>

          {/* Output */}
          {state.output.length > 0 && (
            <div className="bg-[#0d1117] border border-[#30363d] rounded-lg p-3">
              <p className="text-[#8b949e] text-xs uppercase tracking-wide mb-2">Output</p>
              {state.output.map((line, i) => (
                <p key={i} className="text-[#3fb950] font-mono text-xs">{line}</p>
              ))}
            </div>
          )}
        </div>
      )}
    />
  );
}
