import { VisualizationLayout, type Step } from '../../components/VisualizationLayout';

interface LLNode { val: number; id: number }
interface LLState {
  nodes: LLNode[];
  highlightId?: number;
  action?: 'insert' | 'delete' | 'traverse';
  traverseId?: number;
  deletedId?: number;
}

const codeLines = [
  'package main',
  '',
  'import "fmt"',
  '',
  'type Node struct {',
  '    Val  int',
  '    Next *Node',
  '}',
  '',
  'type LinkedList struct {',
  '    Head *Node',
  '}',
  '',
  'func (l *LinkedList) Append(v int) {',
  '    newNode := &Node{Val: v}',
  '    if l.Head == nil {',
  '        l.Head = newNode',
  '        return',
  '    }',
  '    curr := l.Head',
  '    for curr.Next != nil {',
  '        curr = curr.Next',
  '    }',
  '    curr.Next = newNode',
  '}',
  '',
  'func (l *LinkedList) Delete(v int) {',
  '    if l.Head.Val == v {',
  '        l.Head = l.Head.Next',
  '        return',
  '    }',
  '    curr := l.Head',
  '    for curr.Next != nil {',
  '        if curr.Next.Val == v {',
  '            curr.Next = curr.Next.Next',
  '            return',
  '        }',
  '        curr = curr.Next',
  '    }',
  '}',
  '',
  'func main() {',
  '    list := LinkedList{}',
  '    list.Append(10)',
  '    list.Append(20)',
  '    list.Append(30)',
  '    list.Delete(20)',
  '}',
];

let idCounter = 0;
const n = (val: number): LLNode => ({ val, id: ++idCounter });

const steps: Step<LLState>[] = [
  { description: 'Create an empty linked list. Head is nil.', highlightLines: [44], state: { nodes: [] } },
  { description: 'Append(10) — Head is nil, so newNode becomes the Head.', highlightLines: [15, 16, 17], state: { nodes: [n(10)], highlightId: 1, action: 'insert' } },
  { description: 'Append(20) — traverse to the last node (10), then set curr.Next = &Node{20}', highlightLines: [20, 21, 22, 24], state: { nodes: [{ val: 10, id: 1 }, n(20)], highlightId: 2, action: 'insert' } },
  { description: 'Append(30) — traverse to node 20, then link node 30.', highlightLines: [20, 21, 22, 24], state: { nodes: [{ val: 10, id: 1 }, { val: 20, id: 2 }, n(30)], highlightId: 3, action: 'insert' } },
  { description: 'List is now: 10 → 20 → 30 → nil', highlightLines: [48], state: { nodes: [{ val: 10, id: 1 }, { val: 20, id: 2 }, { val: 30, id: 3 }] } },
  { description: 'Delete(20) — Head.Val is 10, not 20. Start traversal with curr = Head.', highlightLines: [28, 32], state: { nodes: [{ val: 10, id: 1 }, { val: 20, id: 2 }, { val: 30, id: 3 }], traverseId: 1, action: 'traverse' } },
  { description: 'curr.Next.Val == 20 → found! Set curr.Next = curr.Next.Next (skip node 20).', highlightLines: [34, 35], state: { nodes: [{ val: 10, id: 1 }, { val: 20, id: 2 }, { val: 30, id: 3 }], traverseId: 1, deletedId: 2, action: 'delete' } },
  { description: 'Node 20 is unlinked and garbage collected. List is now: 10 → 30 → nil', highlightLines: [49], state: { nodes: [{ val: 10, id: 1 }, { val: 30, id: 3 }] } },
];

export function LinkedList() {
  return (
    <VisualizationLayout
      title="Linked List"
      description="Singly linked list with append, delete, and traversal"
      tag="Data Structures"
      tagColor="bg-[#79c0ff]"
      steps={steps}
      codeLines={codeLines}
      renderVisual={(state: LLState) => (
        <div className="w-full space-y-6">
          <p className="text-[#8b949e] text-xs uppercase tracking-wide">Linked List</p>

          {/* Node visualization */}
          <div className="flex items-center gap-0 flex-wrap">
            {/* HEAD pointer */}
            <div className="flex flex-col items-center mr-2">
              <div className="bg-[#00ACD7]/10 border border-[#00ACD7]/40 rounded px-2 py-1 text-[#00ACD7] text-xs mb-1">HEAD</div>
              <div className="w-0.5 h-4 bg-[#00ACD7]/40" />
              <div className="w-0 h-0" style={{ borderLeft: '4px solid transparent', borderRight: '4px solid transparent', borderTop: '6px solid rgba(0,172,215,0.4)' }} />
            </div>

            {state.nodes.length === 0 && (
              <div className="flex items-center gap-2">
                <div className="px-4 py-3 rounded-lg bg-[#161b22] border-2 border-dashed border-[#30363d] text-[#8b949e] text-sm">nil</div>
              </div>
            )}

            {state.nodes.map((node, idx) => {
              const isTraversed = state.traverseId === node.id;
              const isDeleted = state.deletedId === node.id;
              const isNew = state.highlightId === node.id && state.action === 'insert';
              const isLast = idx === state.nodes.length - 1;
              return (
                <div key={node.id} className="flex items-center">
                  {/* Node box */}
                  <div
                    className="relative rounded-lg border-2 overflow-hidden transition-all duration-300"
                    style={{
                      borderColor: isDeleted ? '#f85149' : isTraversed ? '#ffa657' : isNew ? '#3fb950' : '#30363d',
                      backgroundColor: isDeleted ? 'rgba(248,81,73,0.1)' : isTraversed ? 'rgba(255,166,87,0.1)' : isNew ? 'rgba(63,185,80,0.1)' : '#161b22',
                      opacity: isDeleted ? 0.5 : 1,
                    }}
                  >
                    <div className="flex">
                      {/* Val */}
                      <div
                        className="px-5 py-3 font-mono text-lg border-r"
                        style={{
                          color: isDeleted ? '#f85149' : isTraversed ? '#ffa657' : isNew ? '#3fb950' : '#e6edf3',
                          borderColor: isDeleted ? '#f85149' : '#30363d',
                        }}
                      >
                        {node.val}
                      </div>
                      {/* Next pointer */}
                      <div className="px-3 py-3 flex items-center justify-center text-[#8b949e]">
                        <div className="w-3 h-3 rounded-full border-2 border-current" />
                      </div>
                    </div>
                    <div className="px-1 pb-1 flex gap-1">
                      <span className="flex-1 text-center text-[10px] text-[#8b949e]">val</span>
                      <span className="flex-1 text-center text-[10px] text-[#8b949e]">next</span>
                    </div>
                    {isDeleted && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-full h-0.5 bg-[#f85149] rotate-12" />
                      </div>
                    )}
                  </div>

                  {/* Arrow */}
                  {!isLast ? (
                    <div className="flex items-center mx-1">
                      <div className="w-6 h-0.5 bg-[#30363d]" />
                      <div className="w-0 h-0" style={{ borderTop: '4px solid transparent', borderBottom: '4px solid transparent', borderLeft: '6px solid #30363d' }} />
                    </div>
                  ) : (
                    <div className="flex items-center ml-2">
                      <div className="w-4 h-0.5 bg-[#30363d]" />
                      <span className="text-[#8b949e] text-xs ml-1">nil</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Info */}
          <div className="grid grid-cols-2 gap-3 max-w-sm">
            <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3 text-center">
              <p className="text-[#8b949e] text-xs mb-1">length</p>
              <p className="text-[#e6edf3] font-mono text-xl">{state.nodes.length}</p>
            </div>
            <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3">
              <p className="text-[#8b949e] text-xs mb-2">Complexities</p>
              <div className="text-xs space-y-0.5">
                <div className="flex justify-between"><span className="text-[#8b949e]">Append</span><span className="text-[#ffa657]">O(n)</span></div>
                <div className="flex justify-between"><span className="text-[#8b949e]">Delete</span><span className="text-[#ffa657]">O(n)</span></div>
                <div className="flex justify-between"><span className="text-[#8b949e]">Search</span><span className="text-[#ffa657]">O(n)</span></div>
              </div>
            </div>
          </div>
        </div>
      )}
    />
  );
}
