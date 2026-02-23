

import { useState } from "react";
import { Outlet, NavLink } from "react-router";
import {
  ChevronDown, ChevronRight,
  Code2, Layers, Zap, Home,
  BarChart2, Binary, Menu, X,
} from "lucide-react";

interface NavItem {
  label: string;
  path: string;
}

interface NavCategory {
  label: string;
  icon: React.ReactNode;
  color: string;
  items: NavItem[];
}

const navCategories: NavCategory[] = [
  {
    label: "Basics",
    icon: <Code2 size={15} aria-hidden="true" />,
    color: "text-[#3fb950]",
    items: [
      { label: "Variables & Types", path: "/basics/variables" },
      { label: "For Loop", path: "/basics/for-loop" },
      { label: "If / Else", path: "/basics/if-else" },
      { label: "Functions", path: "/basics/functions" },
      { label: "Pointers", path: "/basics/pointers" },
      { label: "Defer / Panic / Recover", path: "/basics/defer-panic-recover" },
      { label: "Interfaces & Type Assert", path: "/basics/interfaces" },
      { label: "Error Wrapping", path: "/basics/error-wrapping" },
    ],
  },
  {
    label: "Data Structures",
    icon: <Layers size={15} aria-hidden="true" />,
    color: "text-[#79c0ff]",
    items: [
      { label: "Arrays & Slices", path: "/ds/arrays-slices" },
      { label: "Maps", path: "/ds/maps" },
      { label: "Stack", path: "/ds/stack" },
      { label: "Queue", path: "/ds/queue" },
      { label: "Linked List", path: "/ds/linked-list" },
      { label: "Binary Search Tree", path: "/ds/binary-search-tree" },
    ],
  },
  {
    label: "Algorithms",
    icon: <BarChart2 size={15} aria-hidden="true" />,
    color: "text-[#ffa657]",
    items: [
      { label: "Bubble Sort", path: "/algorithms/bubble-sort" },
      { label: "Binary Search", path: "/algorithms/binary-search" },
      { label: "Merge Sort", path: "/algorithms/merge-sort" },
    ],
  },
  {
    label: "Go Concurrency",
    icon: <Zap size={15} aria-hidden="true" />,
    color: "text-[#00ACD7]",
    items: [
      { label: "Goroutines", path: "/concurrency/goroutines" },
      { label: "Channels", path: "/concurrency/channels" },
      { label: "Buffered Channels", path: "/concurrency/buffered-channels" },
      { label: "WaitGroup", path: "/concurrency/waitgroup" },
      { label: "Mutex", path: "/concurrency/mutex" },
      { label: "RWMutex", path: "/concurrency/rwmutex" },
      { label: "Select", path: "/concurrency/select" },
      { label: "Goroutine Scheduler", path: "/concurrency/goroutine-scheduler" },
      { label: "sync.Once", path: "/concurrency/sync-once" },
      { label: "Context Cancellation", path: "/concurrency/context" },
    ],
  },
];



function SidebarContent({ onClose }: { onClose?: () => void }) {
  const [expanded, setExpanded] = useState<string[]>(["Basics", "Go Concurrency"]);

  const toggle = (label: string) => {
    setExpanded(prev =>
      prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label]
    );
  };
  const isExpanded = (label: string) => expanded.includes(label);

  
  const sectionId = (label: string) =>
    `nav-section-${label.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <div className="flex flex-col h-full bg-[#0d1117]">

     
      <div className="px-4 py-4 border-b border-[#30363d] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#00ACD7] flex items-center justify-center">
            <Binary size={16} className="text-white" aria-hidden="true" />
          </div>
          <div>
            <p className="text-[#e6edf3] text-sm leading-tight">Go DSA</p>
            <p className="text-[#8b949e] text-xs">Visualizer</p>
          </div>
        </div>
 
        {onClose && (
          <button
            onClick={onClose}
            aria-label="Close navigation menu"
            className="text-[#8b949e] hover:text-white p-1 rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#58a6ff]"
          >
            <X size={18} aria-hidden="true" />
          </button>
        )}
      </div>

      
      <nav className="flex-1 overflow-y-auto py-3 px-2" aria-label="Main navigation">

        
        <NavLink
          to="/"
          end
          aria-label="Home"
          className={({ isActive }) =>
            `flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors mb-1 ${isActive
              ? "bg-[#00ACD7]/15 text-[#00ACD7]"
              : "text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#161b22]"
            }`
          }
          onClick={onClose}
        >
          <Home size={15} aria-hidden="true" />
          Home
        </NavLink>

        {navCategories.map(cat => (
          <div key={cat.label} className="mb-1">
          
            <button
              onClick={() => toggle(cat.label)}
              aria-expanded={isExpanded(cat.label)}
              aria-controls={sectionId(cat.label)}
              className="w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors hover:bg-[#161b22] group focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#58a6ff]"
            >
              <div className={`flex items-center gap-2 ${cat.color}`}>
                {cat.icon}
                <span className="text-[#c9d1d9]">{cat.label}</span>
              </div>
              {isExpanded(cat.label)
                ? <ChevronDown size={14} className="text-[#8b949e]" aria-hidden="true" />
                : <ChevronRight size={14} className="text-[#8b949e]" aria-hidden="true" />
              }
            </button>

           
            {isExpanded(cat.label) && (
              <div
                id={sectionId(cat.label)}
                className="ml-3 pl-3 border-l border-[#30363d] mt-1 space-y-0.5"
              >
                {cat.items.map(item => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) =>
                      `flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors ${isActive
                        ? "text-[#00ACD7] bg-[#00ACD7]/10"
                        : "text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#161b22]"
                      }`
                    }
                    onClick={onClose}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60" aria-hidden="true" />
                    {item.label}
                  </NavLink>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>

    
      <div className="px-4 py-3 border-t border-[#30363d]">
        <p className="text-[#8b949e] text-xs">Built with Go concepts</p>
      </div>
    </div>
  );
}



export function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-[#0d1117] overflow-hidden">

      {/* Desktop sidebar */}
      <div className="hidden md:flex w-64 flex-shrink-0 border-r border-[#30363d]">
        <SidebarContent />
      </div>

     
      {sidebarOpen && (
        <div
          className="md:hidden fixed inset-0 z-50 flex"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation"
        >
          <div className="w-64 flex-shrink-0 border-r border-[#30363d]">
            <SidebarContent onClose={() => setSidebarOpen(false)} />
          </div>
         
          <div
            className="flex-1 bg-black/50"
            aria-hidden="true"             
            onClick={() => setSidebarOpen(false)}
          />
        </div>
      )}

  
      <div className="flex-1 flex flex-col overflow-hidden">

       
        <div className="md:hidden flex items-center gap-3 px-4 py-3 border-b border-[#30363d] bg-[#161b22]">
         
          <button
            onClick={() => setSidebarOpen(true)}
            aria-label="Open navigation menu"
            aria-expanded={sidebarOpen}
            aria-controls="mobile-nav-dialog"
            className="text-[#8b949e] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#58a6ff] rounded"
          >
            <Menu size={20} aria-hidden="true" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-[#00ACD7] flex items-center justify-center">
              <Binary size={12} className="text-white" aria-hidden="true" />
            </div>
            <span className="text-[#e6edf3] text-sm">Go DSA Visualizer</span>
          </div>
        </div>

      
        <div className="flex-1 overflow-hidden">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
