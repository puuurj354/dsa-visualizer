import { VisualizationLayout, type Step } from '../../components/VisualizationLayout';

interface BSTNode { val: number; left?: BSTNode; right?: BSTNode }
interface BSTState {
  root?: BSTNode;
  highlight?: number;
  searchPath?: number[];
  action?: 'insert' | 'search';
  found?: boolean;
}

const codeLines = [
  'package main',
  '',
  'import "fmt"',
  '',
  'type BSTNode struct {',
  '    Val   int',
  '    Left  *BSTNode',
  '    Right *BSTNode',
  '}',
  '',
  'func insert(root *BSTNode, v int) *BSTNode {',
  '    if root == nil {',
  '        return &BSTNode{Val: v}',
  '    }',
  '    if v < root.Val {',
  '        root.Left = insert(root.Left, v)',
  '    } else {',
  '        root.Right = insert(root.Right, v)',
  '    }',
  '    return root',
  '}',
  '',
  'func search(root *BSTNode, v int) bool {',
  '    if root == nil { return false }',
  '    if root.Val == v { return true }',
  '    if v < root.Val {',
  '        return search(root.Left, v)',
  '    }',
  '    return search(root.Right, v)',
  '}',
  '',
  'func main() {',
  '    var root *BSTNode',
  '    root = insert(root, 50)',
  '    root = insert(root, 30)',
  '    root = insert(root, 70)',
  '    root = insert(root, 20)',
  '    root = insert(root, 40)',
  '    fmt.Println(search(root, 40)) // true',
  '    fmt.Println(search(root, 45)) // false',
  '}',
];

function ins(root: BSTNode | undefined, v: number): BSTNode {
  if (!root) return { val: v };
  if (v < root.val) return { ...root, left: ins(root.left, v) };
  return { ...root, right: ins(root.right, v) };
}

const steps: Step<BSTState>[] = [
  { description: 'Start with an empty BST. root = nil', highlightLines: [33], state: {} },
  { description: 'insert(root, 50) — root is nil, create first node. 50 becomes the root.', highlightLines: [34, 12, 13], state: { root: { val: 50 }, highlight: 50, action: 'insert' } },
  { description: 'insert(root, 30) — 30 < 50, go LEFT. Left is nil → insert here.', highlightLines: [35, 15, 16], state: { root: ins({ val: 50 }, 30), highlight: 30, action: 'insert', searchPath: [50, 30] } },
  { description: 'insert(root, 70) — 70 > 50, go RIGHT. Right is nil → insert here.', highlightLines: [36, 17, 18], state: { root: ins(ins({ val: 50 }, 30), 70), highlight: 70, action: 'insert', searchPath: [50, 70] } },
  { description: 'insert(root, 20) — 20 < 50 → left → 20 < 30 → left of 30. Insert here.', highlightLines: [37, 15, 16], state: { root: [50,30,70,20].reduce((r,v) => ins(r,v), undefined as unknown as BSTNode), highlight: 20, action: 'insert', searchPath: [50, 30, 20] } },
  { description: 'insert(root, 40) — 40 < 50 → left → 40 > 30 → right of 30. Insert here.', highlightLines: [38, 15, 16, 17, 18], state: { root: [50,30,70,20,40].reduce((r,v) => ins(r,v), undefined as unknown as BSTNode), highlight: 40, action: 'insert', searchPath: [50, 30, 40] } },
  { description: 'BST built! Property: every left child < parent < every right child.', highlightLines: [38], state: { root: [50,30,70,20,40].reduce((r,v) => ins(r,v), undefined as unknown as BSTNode) } },
  { description: 'search(root, 40) — Start at root(50). 40 < 50 → go LEFT.', highlightLines: [39, 23, 26], state: { root: [50,30,70,20,40].reduce((r,v) => ins(r,v), undefined as unknown as BSTNode), action: 'search', searchPath: [50] } },
  { description: 'At 30. 40 > 30 → go RIGHT.', highlightLines: [28, 29], state: { root: [50,30,70,20,40].reduce((r,v) => ins(r,v), undefined as unknown as BSTNode), action: 'search', searchPath: [50, 30] } },
  { description: 'At 40. 40 == 40 → FOUND! Return true.', highlightLines: [25], state: { root: [50,30,70,20,40].reduce((r,v) => ins(r,v), undefined as unknown as BSTNode), action: 'search', searchPath: [50, 30, 40], found: true, highlight: 40 } },
  { description: 'search(root, 45) — 45 < 50 → LEFT, 45 > 30 → RIGHT, 45 > 40 → RIGHT. Right of 40 is nil → return false.', highlightLines: [40, 23, 24], state: { root: [50,30,70,20,40].reduce((r,v) => ins(r,v), undefined as unknown as BSTNode), action: 'search', searchPath: [50, 30, 40], found: false } },
];

function TreeViz({ node, highlight, searchPath, found }: { node?: BSTNode; highlight?: number; searchPath?: number[]; found?: boolean }) {
  if (!node) return null;
  const isHighlighted = highlight === node.val;
  const inPath = searchPath?.includes(node.val);
  const isFound = found && inPath && searchPath?.[searchPath.length - 1] === node.val;

  return (
    <div className="flex flex-col items-center">
      <div
        className="w-10 h-10 rounded-full border-2 flex items-center justify-center font-mono text-sm transition-all duration-300 z-10"
        style={{
          borderColor: isFound ? '#3fb950' : isHighlighted ? '#00ACD7' : inPath ? '#ffa657' : '#30363d',
          backgroundColor: isFound ? 'rgba(63,185,80,0.2)' : isHighlighted ? 'rgba(0,172,215,0.2)' : inPath ? 'rgba(255,166,87,0.2)' : '#161b22',
          color: isFound ? '#3fb950' : isHighlighted ? '#00ACD7' : inPath ? '#ffa657' : '#e6edf3',
          boxShadow: isFound ? '0 0 12px rgba(63,185,80,0.4)' : isHighlighted ? '0 0 12px rgba(0,172,215,0.4)' : undefined,
        }}
      >
        {node.val}
      </div>
      {(node.left || node.right) && (
        <div className="flex items-start mt-0">
          {/* Left subtree */}
          <div className="flex flex-col items-end">
            {node.left ? (
              <>
                <div className="w-8 h-4 border-b-2 border-l-2 border-[#30363d] rounded-bl-lg" />
                <TreeViz node={node.left} highlight={highlight} searchPath={searchPath} found={found} />
              </>
            ) : <div className="w-8" />}
          </div>
          {/* Right subtree */}
          <div className="flex flex-col items-start">
            {node.right ? (
              <>
                <div className="w-8 h-4 border-b-2 border-r-2 border-[#30363d] rounded-br-lg" />
                <TreeViz node={node.right} highlight={highlight} searchPath={searchPath} found={found} />
              </>
            ) : <div className="w-8" />}
          </div>
        </div>
      )}
    </div>
  );
}

export function BinarySearchTree() {
  return (
    <VisualizationLayout
      title="Binary Search Tree"
      description="BST insertion and O(log n) search via recursive structure"
      tag="Data Structures"
      tagColor="bg-[#79c0ff]"
      steps={steps}
      codeLines={codeLines}
      renderVisual={(state: BSTState) => (
        <div className="w-full space-y-4">
          {/* Tree */}
          <div className="flex justify-center p-4 bg-[#161b22] rounded-xl border border-[#30363d] min-h-[200px] items-center">
            {state.root ? (
              <TreeViz node={state.root} highlight={state.highlight} searchPath={state.searchPath} found={state.found} />
            ) : (
              <p className="text-[#8b949e]">Empty BST</p>
            )}
          </div>

          {/* Search result */}
          {state.found !== undefined && (
            <div
              className="p-3 rounded-lg border text-center"
              style={{
                borderColor: state.found ? '#3fb950' : '#f85149',
                backgroundColor: state.found ? 'rgba(63,185,80,0.08)' : 'rgba(248,81,73,0.08)',
              }}
            >
              <span className="font-mono" style={{ color: state.found ? '#3fb950' : '#f85149' }}>
                search() = {String(state.found)}
              </span>
            </div>
          )}

          {/* BST property */}
          <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
            <p className="text-[#8b949e] text-xs uppercase tracking-wide mb-2">BST Property</p>
            <div className="flex items-center gap-2 text-sm font-mono">
              <span className="text-[#ffa657]">left.val</span>
              <span className="text-[#c9d1d9]">&lt;</span>
              <span className="text-[#00ACD7]">root.val</span>
              <span className="text-[#c9d1d9]">&lt;</span>
              <span className="text-[#d2a8ff]">right.val</span>
            </div>
            <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
              {[['Insert', 'O(log n)', 'O(n) worst'], ['Search', 'O(log n)', 'O(n) worst'], ['Delete', 'O(log n)', 'O(n) worst']].map(([op, avg, worst]) => (
                <div key={op} className="bg-[#0d1117] rounded p-2 text-center">
                  <p className="text-[#e6edf3]">{op}</p>
                  <p className="text-[#3fb950]">{avg}</p>
                  <p className="text-[#8b949e]">{worst}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    />
  );
}
