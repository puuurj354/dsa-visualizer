import { VisualizationLayout, type Step } from '../../components/VisualizationLayout';

interface BufferState {
  buffer: (number | null)[];
  capacity: number;
  len: number;
  senderStatus: 'idle' | 'sending' | 'blocked' | 'done';
  receiverStatus: 'idle' | 'receiving' | 'blocked' | 'done';
  lastAction?: string;
  output: string[];
}

const codeLines = [
  'package main',
  '',
  'import "fmt"',
  '',
  'func main() {',
  '    // Buffered channel with capacity 3',
  '    ch := make(chan int, 3)',
  '',
  '    // Can send WITHOUT a receiver (up to cap)',
  '    ch <- 1',
  '    ch <- 2',
  '    ch <- 3',
  '',
  '    // Buffer is FULL — this would BLOCK',
  '    // ch <- 4  // deadlock if no receiver!',
  '',
  '    // Receive from buffer',
  '    fmt.Println(<-ch) // 1',
  '    fmt.Println(<-ch) // 2',
  '    fmt.Println(<-ch) // 3',
  '',
  '    // Check channel length and capacity',
  '    fmt.Println(len(ch), cap(ch)) // 0 3',
  '}',
];

const steps: Step<BufferState>[] = [
  {
    description: 'make(chan int, 3) — create a BUFFERED channel with capacity 3. Unlike unbuffered, a sender can send up to 3 values without blocking!',
    highlightLines: [7],
    state: { buffer: [null, null, null], capacity: 3, len: 0, senderStatus: 'idle', receiverStatus: 'idle', output: [] },
  },
  {
    description: 'ch <- 1 — send 1. Buffer has space, so the sender does NOT block. Value stored in slot [0].',
    highlightLines: [10],
    state: { buffer: [1, null, null], capacity: 3, len: 1, senderStatus: 'sending', receiverStatus: 'idle', lastAction: 'sent 1', output: [] },
  },
  {
    description: 'ch <- 2 — send 2. Buffer still has space (slots 1 and 2 free). No blocking.',
    highlightLines: [11],
    state: { buffer: [1, 2, null], capacity: 3, len: 2, senderStatus: 'sending', receiverStatus: 'idle', lastAction: 'sent 2', output: [] },
  },
  {
    description: 'ch <- 3 — send 3. Buffer is now FULL! len=cap=3. Any further send will block until someone receives.',
    highlightLines: [12],
    state: { buffer: [1, 2, 3], capacity: 3, len: 3, senderStatus: 'done', receiverStatus: 'idle', lastAction: 'sent 3 (FULL!)', output: [] },
  },
  {
    description: 'ch <- 4 would BLOCK (buffer full). This is commented out to avoid deadlock. Sender must wait for receiver.',
    highlightLines: [15],
    state: { buffer: [1, 2, 3], capacity: 3, len: 3, senderStatus: 'blocked', receiverStatus: 'idle', lastAction: 'ch <- 4 BLOCKED', output: [] },
  },
  {
    description: '<-ch — receive from buffer. FIFO: gets oldest value = 1. Buffer shifts. len goes from 3 to 2.',
    highlightLines: [18],
    state: { buffer: [2, 3, null], capacity: 3, len: 2, senderStatus: 'idle', receiverStatus: 'receiving', lastAction: 'received 1', output: ['1'] },
  },
  {
    description: '<-ch — receive again. Gets 2. Buffer: [3, _, _]. len=1.',
    highlightLines: [19],
    state: { buffer: [3, null, null], capacity: 3, len: 1, senderStatus: 'idle', receiverStatus: 'receiving', lastAction: 'received 2', output: ['1', '2'] },
  },
  {
    description: '<-ch — receive again. Gets 3. Buffer empty now. len=0.',
    highlightLines: [20],
    state: { buffer: [null, null, null], capacity: 3, len: 0, senderStatus: 'idle', receiverStatus: 'done', lastAction: 'received 3', output: ['1', '2', '3'] },
  },
  {
    description: 'len(ch)=0, cap(ch)=3. Buffer is empty but channel still exists with capacity 3. Buffered channels decouple senders from receivers!',
    highlightLines: [23],
    state: { buffer: [null, null, null], capacity: 3, len: 0, senderStatus: 'done', receiverStatus: 'done', output: ['1', '2', '3', '0 3'] },
  },
];

export function BufferedChannels() {
  return (
    <VisualizationLayout
      title="Buffered Channels"
      description="Channels with capacity — send without blocking up to the buffer size"
      tag="Concurrency"
      tagColor="bg-[#00ACD7]"
      steps={steps}
      codeLines={codeLines}
      renderVisual={(state: BufferState) => (
        <div className="w-full max-w-xl space-y-5">
          {/* Channel visualization */}
          <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-5">
            <div className="flex items-center gap-4">
              {/* Sender */}
              <div
                className="w-20 rounded-lg border p-2 text-center transition-all duration-300 flex-shrink-0"
                style={{
                  borderColor: state.senderStatus === 'blocked' ? '#f85149' : state.senderStatus === 'sending' ? '#ffa657' : state.senderStatus === 'done' ? '#3fb950' : '#30363d',
                  backgroundColor: state.senderStatus === 'blocked' ? 'rgba(248,81,73,0.1)' : state.senderStatus === 'sending' ? 'rgba(255,166,87,0.1)' : 'transparent',
                }}
              >
                <div className="text-xl mb-1">📤</div>
                <p className="text-[#e6edf3] text-xs font-mono">sender</p>
                <p className="text-xs mt-1" style={{ color: state.senderStatus === 'blocked' ? '#f85149' : state.senderStatus === 'sending' ? '#ffa657' : '#8b949e' }}>
                  {state.senderStatus === 'blocked' ? '⏸ blocked' : state.senderStatus === 'sending' ? 'sending' : state.senderStatus === 'done' ? 'done' : 'idle'}
                </p>
              </div>

              {/* Arrow in */}
              <div className="flex items-center">
                <div className="w-4 h-0.5 bg-[#00ACD7]" />
                <div className="w-0 h-0" style={{ borderTop: '4px solid transparent', borderBottom: '4px solid transparent', borderLeft: '6px solid #00ACD7' }} />
              </div>

              {/* Buffer */}
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[#00ACD7] text-xs font-mono">chan int (cap={state.capacity})</span>
                  <span className="text-[#8b949e] text-xs">len={state.len}/{state.capacity}</span>
                </div>
                <div className="flex gap-2">
                  {state.buffer.map((val, idx) => (
                    <div
                      key={idx}
                      className="flex-1 h-14 rounded-lg border-2 flex flex-col items-center justify-center transition-all duration-300"
                      style={{
                        borderColor: val !== null ? '#00ACD7' : '#30363d',
                        backgroundColor: val !== null ? 'rgba(0,172,215,0.15)' : '#0d1117',
                      }}
                    >
                      {val !== null ? (
                        <>
                          <span className="text-[#00ACD7] font-mono text-lg">{val}</span>
                          <span className="text-[10px] text-[#8b949e]">[{idx}]</span>
                        </>
                      ) : (
                        <span className="text-[#30363d] text-lg">·</span>
                      )}
                    </div>
                  ))}
                </div>
                {/* Fill bar */}
                <div className="mt-2 h-1.5 bg-[#0d1117] rounded-full">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${(state.len / state.capacity) * 100}%`,
                      backgroundColor: state.len === state.capacity ? '#f85149' : '#00ACD7',
                    }}
                  />
                </div>
                {state.len === state.capacity && (
                  <p className="text-[#f85149] text-xs text-center mt-1">BUFFER FULL</p>
                )}
              </div>

              {/* Arrow out */}
              <div className="flex items-center">
                <div className="w-4 h-0.5 bg-[#3fb950]" />
                <div className="w-0 h-0" style={{ borderTop: '4px solid transparent', borderBottom: '4px solid transparent', borderLeft: '6px solid #3fb950' }} />
              </div>

              {/* Receiver */}
              <div
                className="w-20 rounded-lg border p-2 text-center transition-all duration-300 flex-shrink-0"
                style={{
                  borderColor: state.receiverStatus === 'receiving' ? '#3fb950' : state.receiverStatus === 'done' ? '#3fb950' : '#30363d',
                  backgroundColor: state.receiverStatus === 'receiving' ? 'rgba(63,185,80,0.1)' : 'transparent',
                }}
              >
                <div className="text-xl mb-1">📥</div>
                <p className="text-[#e6edf3] text-xs font-mono">receiver</p>
                <p className="text-xs mt-1" style={{ color: state.receiverStatus === 'receiving' ? '#3fb950' : state.receiverStatus === 'done' ? '#3fb950' : '#8b949e' }}>
                  {state.receiverStatus === 'receiving' ? 'receiving' : state.receiverStatus === 'done' ? 'done' : 'idle'}
                </p>
              </div>
            </div>
          </div>

          {/* Comparison: buffered vs unbuffered */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#f85149]/8 border border-[#f85149]/25 rounded-lg p-3">
              <p className="text-[#f85149] text-xs font-mono mb-1">make(chan int) // unbuffered</p>
              <p className="text-[#8b949e] text-xs">Send BLOCKS until receiver is ready. Synchronous rendezvous.</p>
            </div>
            <div className="bg-[#00ACD7]/8 border border-[#00ACD7]/25 rounded-lg p-3">
              <p className="text-[#00ACD7] text-xs font-mono mb-1">make(chan int, 3) // buffered</p>
              <p className="text-[#8b949e] text-xs">Send only blocks when buffer is FULL. Asynchronous up to capacity.</p>
            </div>
          </div>

          {/* Last action */}
          {state.lastAction && (
            <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3 text-center">
              <span className="text-[#ffa657] font-mono text-sm">{state.lastAction}</span>
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
        </div>
      )}
    />
  );
}
