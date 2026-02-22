import { useNavigate } from 'react-router';
import { Code2, Layers, BarChart2, Zap, ArrowRight } from 'lucide-react';

const categories = [
  {
    icon: <Code2 size={24} />,
    color: 'text-[#3fb950]',
    bg: 'bg-[#3fb950]/10',
    border: 'border-[#3fb950]/30',
    title: 'Basics',
    description: 'Variables, loops, functions, pointers, defer/panic/recover, interfaces, and error wrapping.',
    count: 8,
    items: ['Variables & Types', 'For Loop', 'If / Else', 'Functions', 'Pointers', 'Defer/Panic/Recover', 'Interfaces', 'Error Wrapping'],
    path: '/basics/variables',
  },
  {
    icon: <Layers size={24} />,
    color: 'text-[#79c0ff]',
    bg: 'bg-[#79c0ff]/10',
    border: 'border-[#79c0ff]/30',
    title: 'Data Structures',
    description: 'Slices, maps, stacks, queues, linked lists, and binary trees in Go.',
    count: 6,
    items: ['Arrays & Slices', 'Maps', 'Stack', 'Queue', 'Linked List', 'BST'],
    path: '/ds/arrays-slices',
  },
  {
    icon: <BarChart2 size={24} />,
    color: 'text-[#ffa657]',
    bg: 'bg-[#ffa657]/10',
    border: 'border-[#ffa657]/30',
    title: 'Algorithms',
    description: 'Sorting and searching algorithms — Bubble Sort, Binary Search, Merge Sort.',
    count: 3,
    items: ['Bubble Sort', 'Binary Search', 'Merge Sort'],
    path: '/algorithms/bubble-sort',
  },
  {
    icon: <Zap size={24} />,
    color: 'text-[#00ACD7]',
    bg: 'bg-[#00ACD7]/10',
    border: 'border-[#00ACD7]/30',
    title: 'Go Concurrency',
    description: 'Goroutines, channels, Mutex, RWMutex, Select, Scheduler, sync.Once, Context.',
    count: 10,
    items: ['Goroutines', 'Channels', 'Buffered Channels', 'WaitGroup', 'Mutex', 'RWMutex', 'Select', 'Scheduler', 'sync.Once', 'Context'],
    path: '/concurrency/goroutines',
  },
];

export function Home() {
  const navigate = useNavigate();

  return (
    <div className="h-full overflow-auto bg-[#0d1117]">
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Hero */}
        <div className="mb-12 text-center">
          <div className="inline-flex items-center gap-2 bg-[#00ACD7]/10 border border-[#00ACD7]/30 rounded-full px-4 py-1.5 mb-6">
            <span className="text-[#00ACD7] text-sm">Interactive Go Visualizer</span>
          </div>
          <h1 className="text-[#e6edf3] text-4xl mb-4">
            Learn Go Data Structures &<br />Algorithms Visually
          </h1>
          <p className="text-[#8b949e] text-lg max-w-2xl mx-auto">
            Step through Go code and watch data structures and algorithms come to life.
            Special focus on Go's powerful concurrency model — goroutines, channels, and more.
          </p>
        </div>

        {/* Go Concurrency highlight */}
        <div
          className="mb-8 p-6 rounded-xl bg-[#00ACD7]/5 border border-[#00ACD7]/20 cursor-pointer hover:bg-[#00ACD7]/10 transition-colors"
          onClick={() => navigate('/concurrency/goroutines')}
        >
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Zap size={20} className="text-[#00ACD7]" />
                <span className="text-[#00ACD7] text-sm uppercase tracking-wide">Featured</span>
              </div>
              <h2 className="text-[#e6edf3] text-xl mb-2">Go Concurrency Model</h2>
              <p className="text-[#8b949e]">
                Visualize goroutines running concurrently, data flowing through channels,
                WaitGroups synchronizing workers, Mutexes protecting shared state, and Select
                multiplexing channels.
              </p>
              <div className="flex flex-wrap gap-2 mt-4">
                {['Goroutines', 'Channels', 'Buffered Channels', 'WaitGroup', 'Mutex', 'RWMutex', 'Select', 'Scheduler (GMP)', 'sync.Once', 'Context'].map(t => (
                  <span key={t} className="text-xs bg-[#00ACD7]/10 text-[#00ACD7] px-2 py-1 rounded-md border border-[#00ACD7]/20">
                    {t}
                  </span>
                ))}
              </div>
            </div>
            <ArrowRight size={20} className="text-[#00ACD7] flex-shrink-0 mt-1" />
          </div>
        </div>

        {/* Category cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {categories.map(cat => (
            <div
              key={cat.title}
              onClick={() => navigate(cat.path)}
              className={`p-5 rounded-xl border ${cat.border} ${cat.bg} cursor-pointer hover:opacity-90 transition-opacity`}
            >
              <div className={`flex items-center gap-3 mb-3 ${cat.color}`}>
                {cat.icon}
                <h3 className="text-[#e6edf3] text-base">{cat.title}</h3>
                <span className={`ml-auto text-xs px-2 py-0.5 rounded-full ${cat.bg} border ${cat.border} ${cat.color}`}>
                  {cat.count} topics
                </span>
              </div>
              <p className="text-[#8b949e] text-sm mb-3">{cat.description}</p>
              <div className="flex flex-wrap gap-1.5">
                {cat.items.map(item => (
                  <span key={item} className="text-xs text-[#8b949e] bg-[#161b22] border border-[#30363d] px-2 py-0.5 rounded">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Go code sample */}
        <div className="mt-10 p-5 rounded-xl bg-[#161b22] border border-[#30363d]">
          <p className="text-[#8b949e] text-xs uppercase tracking-wide mb-3">Quick taste — Go concurrency in action</p>
          <pre className="text-sm font-mono text-[#e6edf3] overflow-x-auto">
            <span className="text-[#ff7b72]">package</span>{' '}
            <span className="text-[#e6edf3]">main</span>{'\n\n'}
            <span className="text-[#ff7b72]">func</span>{' '}
            <span className="text-[#d2a8ff]">main</span>
            <span className="text-[#e6edf3]">() {'{'}</span>{'\n'}
            {'    '}<span className="text-[#e6edf3]">ch </span>
            <span className="text-[#ff7b72]">:=</span>{' '}
            <span className="text-[#ffa657]">make</span>
            <span className="text-[#e6edf3]">(</span>
            <span className="text-[#ff7b72]">chan</span>{' '}
            <span className="text-[#79c0ff]">string</span>
            <span className="text-[#e6edf3]">)</span>{'\n'}
            {'    '}<span className="text-[#ff7b72]">go</span>{' '}
            <span className="text-[#ff7b72]">func</span>
            <span className="text-[#e6edf3]">() {'{'}</span>{'\n'}
            {'        '}<span className="text-[#e6edf3]">ch </span>
            <span className="text-[#ff7b72]">{'<-'}</span>{' '}
            <span className="text-[#a5d6ff]">"Hello, Gopher!"</span>{'\n'}
            {'    '}<span className="text-[#e6edf3]">{'}'}</span>
            <span className="text-[#e6edf3]">()</span>{'\n'}
            {'    '}<span className="text-[#d2a8ff]">fmt.Println</span>
            <span className="text-[#e6edf3]">({'<-'}ch)</span>{'\n'}
            <span className="text-[#e6edf3]">{'}'}</span>
          </pre>
        </div>
      </div>
    </div>
  );
}