import { VisualizationLayout, type Step } from '../../components/VisualizationLayout';

interface QueueState {
  items: number[];
  action?: 'enqueue' | 'dequeue';
  actionVal?: number;
}

const codeLines = [
  'package main',
  '',
  'import "fmt"',
  '',
  '// Queue implemented using a slice',
  'type Queue struct {',
  '    data []int',
  '}',
  '',
  'func (q *Queue) Enqueue(v int) {',
  '    q.data = append(q.data, v)',
  '}',
  '',
  'func (q *Queue) Dequeue() (int, bool) {',
  '    if len(q.data) == 0 {',
  '        return 0, false',
  '    }',
  '    front := q.data[0]',
  '    q.data = q.data[1:]',
  '    return front, true',
  '}',
  '',
  'func (q *Queue) Front() int {',
  '    return q.data[0]',
  '}',
  '',
  'func main() {',
  '    q := Queue{}',
  '    q.Enqueue(10)',
  '    q.Enqueue(20)',
  '    q.Enqueue(30)',
  '    front, _ := q.Dequeue() // 10',
  '    fmt.Println(front)',
  '    fmt.Println(q.Front()) // 20',
  '}',
];

const steps: Step<QueueState>[] = [
  { description: 'Create an empty Queue. Elements enter from the back and leave from the front — FIFO!', highlightLines: [28], state: { items: [] } },
  { description: 'Enqueue(10) — append 10 to the back. 10 enters the queue.', highlightLines: [10, 11], state: { items: [10], action: 'enqueue', actionVal: 10 } },
  { description: 'Enqueue(20) — append 20 to the back. Queue: [10, 20]', highlightLines: [30], state: { items: [10, 20], action: 'enqueue', actionVal: 20 } },
  { description: 'Enqueue(30) — append 30 to the back. Queue: [10, 20, 30]', highlightLines: [31], state: { items: [10, 20, 30], action: 'enqueue', actionVal: 30 } },
  { description: 'Dequeue() — take from the FRONT. front = q.data[0] = 10.', highlightLines: [18], state: { items: [10, 20, 30], action: 'dequeue', actionVal: 10 } },
  { description: 'q.data = q.data[1:] — slice off the first element. Queue: [20, 30]', highlightLines: [19], state: { items: [20, 30], action: 'dequeue', actionVal: 10 } },
  { description: 'Dequeue() returned (10, true). Print 10. First in, first out!', highlightLines: [32, 33], state: { items: [20, 30], actionVal: 10 } },
  { description: 'Front() — peek at q.data[0] = 20 without removing. Print 20.', highlightLines: [34], state: { items: [20, 30], action: 'dequeue', actionVal: 20 } },
];

const itemColors = ['#00ACD7', '#3fb950', '#ffa657', '#d2a8ff', '#79c0ff', '#f85149'];

export function Queue() {
  return (
    <VisualizationLayout
      title="Queue"
      description="FIFO data structure — first in, first out"
      tag="Data Structures"
      tagColor="bg-[#79c0ff]"
      steps={steps}
      codeLines={codeLines}
      renderVisual={(state: QueueState) => (
        <div className="w-full max-w-xl space-y-5">
          {/* Queue horizontal visualization */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[#f85149] text-xs">FRONT (dequeue)</span>
              <span className="text-[#3fb950] text-xs">(enqueue) BACK</span>
            </div>

            <div className="flex items-center gap-1 min-h-[80px]">
              {/* Left arrow (dequeue side) */}
              <div className="flex flex-col items-center">
                <div className="w-8 h-1 bg-[#f85149]" />
                <div
                  className="w-0 h-0"
                  style={{
                    borderTop: '6px solid transparent',
                    borderBottom: '6px solid transparent',
                    borderRight: '10px solid #f85149',
                  }}
                />
                <span className="text-[#f85149] text-[10px] mt-1">OUT</span>
              </div>

              {/* Queue items */}
              <div className="flex-1 flex gap-1.5 min-h-[64px] items-center bg-[#161b22] border-2 border-[#30363d] rounded-xl px-3 py-2">
                {state.items.length === 0 && (
                  <div className="flex-1 text-center text-[#8b949e] text-sm">empty queue</div>
                )}
                {state.items.map((item, idx) => {
                  const isFront = idx === 0;
                  const isBack = idx === state.items.length - 1;
                  const color = itemColors[item % itemColors.length] || '#00ACD7';
                  const isDequeuing = isFront && state.action === 'dequeue';
                  const isEnqueuing = isBack && state.action === 'enqueue';
                  return (
                    <div
                      key={`${item}-${idx}`}
                      className="flex-1 h-12 flex flex-col items-center justify-center rounded-lg border-2 transition-all duration-300"
                      style={{
                        borderColor: isDequeuing ? '#f85149' : isEnqueuing ? '#3fb950' : '#30363d',
                        backgroundColor: isDequeuing ? 'rgba(248,81,73,0.1)' : isEnqueuing ? 'rgba(63,185,80,0.1)' : `${color}15`,
                        color: isDequeuing ? '#f85149' : isEnqueuing ? '#3fb950' : color,
                        transform: isDequeuing ? 'translateX(-4px)' : isEnqueuing ? 'translateX(4px)' : 'none',
                      }}
                    >
                      <span className="font-mono text-lg">{item}</span>
                      {isFront && <span className="text-[10px] opacity-70">front</span>}
                    </div>
                  );
                })}
              </div>

              {/* Right arrow (enqueue side) */}
              <div className="flex flex-col items-center">
                <div
                  className="w-0 h-0"
                  style={{
                    borderTop: '6px solid transparent',
                    borderBottom: '6px solid transparent',
                    borderLeft: '10px solid #3fb950',
                  }}
                />
                <div className="w-8 h-1 bg-[#3fb950]" />
                <span className="text-[#3fb950] text-[10px] mt-1">IN</span>
              </div>
            </div>
          </div>

          {/* Info */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3 text-center">
              <p className="text-[#8b949e] text-xs mb-1">size</p>
              <p className="text-[#e6edf3] font-mono text-xl">{state.items.length}</p>
            </div>
            {state.action === 'dequeue' && state.actionVal !== undefined && (
              <div className="bg-[#f85149]/10 border border-[#f85149]/30 rounded-lg p-3 text-center">
                <p className="text-[#f85149] text-xs mb-1">dequeued</p>
                <p className="text-[#f85149] font-mono text-xl">{state.actionVal}</p>
              </div>
            )}
            {state.action === 'enqueue' && state.actionVal !== undefined && (
              <div className="bg-[#3fb950]/10 border border-[#3fb950]/30 rounded-lg p-3 text-center">
                <p className="text-[#3fb950] text-xs mb-1">enqueued</p>
                <p className="text-[#3fb950] font-mono text-xl">{state.actionVal}</p>
              </div>
            )}
          </div>

          {/* Operations guide */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { op: 'Enqueue(v)', desc: 'Add to back', color: '#3fb950', complexity: 'O(1)' },
              { op: 'Dequeue()', desc: 'Remove front', color: '#f85149', complexity: 'O(n)*' },
              { op: 'Front()', desc: 'View front', color: '#00ACD7', complexity: 'O(1)' },
            ].map(o => (
              <div key={o.op} className="bg-[#161b22] border border-[#30363d] rounded-lg p-2 text-center">
                <p className="font-mono text-xs" style={{ color: o.color }}>{o.op}</p>
                <p className="text-[#8b949e] text-xs">{o.desc}</p>
                <p className="text-[#ffa657] text-xs">{o.complexity}</p>
              </div>
            ))}
          </div>
          <p className="text-[#8b949e] text-xs">* Use container/list for O(1) Dequeue in Go</p>
        </div>
      )}
    />
  );
}
