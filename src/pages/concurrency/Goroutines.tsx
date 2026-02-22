import {
  VisualizationLayout,
  Step,
} from "../../components/VisualizationLayout";

interface GRoutine {
  id: number;
  name: string;
  status: "waiting" | "running" | "done";
  output?: string;
  progress: number; // 0-100
  color: string;
}

interface GoroutineState {
  goroutines: GRoutine[];
  mainStatus: "running" | "waiting" | "done";
  output: string[];
  note?: string;
}

const codeLines = [
  "package main",
  "",
  "import (",
  '    "fmt"',
  '    "time"',
  ")",
  "",
  "func worker(id int) {",
  '    fmt.Printf("Worker %d starting\\n", id)',
  "    time.Sleep(time.Millisecond * 100)",
  '    fmt.Printf("Worker %d done\\n", id)',
  "}",
  "",
  "func main() {",
  '    fmt.Println("Main: starting")',
  "",
  "    go worker(1)  // launch goroutine",
  "    go worker(2)  // launch goroutine",
  "    go worker(3)  // launch goroutine",
  "",
  "    // Without sync, main may exit before workers!",
  "    time.Sleep(time.Second)",
  '    fmt.Println("Main: done")',
  "}",
];

const goroutineColors = ["#00ACD7", "#3fb950", "#ffa657", "#d2a8ff"];

const steps: Step<GoroutineState>[] = [
  {
    description:
      "Program starts. The main goroutine is the entry point — it's always the first goroutine.",
    highlightLines: [14, 15],
    state: {
      goroutines: [],
      mainStatus: "running",
      output: ["Main: starting"],
      note: "Only main goroutine exists",
    },
  },
  {
    description:
      "`go worker(1)` — the `go` keyword launches a NEW goroutine concurrently. main() continues immediately without waiting!",
    highlightLines: [17],
    state: {
      goroutines: [
        {
          id: 1,
          name: "worker(1)",
          status: "running",
          progress: 10,
          color: goroutineColors[0],
        },
      ],
      mainStatus: "running",
      output: ["Main: starting", "Worker 1 starting"],
    },
  },
  {
    description:
      "`go worker(2)` — another goroutine launched. Now 3 goroutines exist simultaneously (main + 2 workers).",
    highlightLines: [18],
    state: {
      goroutines: [
        {
          id: 1,
          name: "worker(1)",
          status: "running",
          progress: 20,
          color: goroutineColors[0],
        },
        {
          id: 2,
          name: "worker(2)",
          status: "running",
          progress: 10,
          color: goroutineColors[1],
        },
      ],
      mainStatus: "running",
      output: ["Main: starting", "Worker 1 starting", "Worker 2 starting"],
    },
  },
  {
    description:
      "`go worker(3)` — third worker goroutine launched! All 3 workers run CONCURRENTLY with main.",
    highlightLines: [19],
    state: {
      goroutines: [
        {
          id: 1,
          name: "worker(1)",
          status: "running",
          progress: 30,
          color: goroutineColors[0],
        },
        {
          id: 2,
          name: "worker(2)",
          status: "running",
          progress: 20,
          color: goroutineColors[1],
        },
        {
          id: 3,
          name: "worker(3)",
          status: "running",
          progress: 10,
          color: goroutineColors[2],
        },
      ],
      mainStatus: "running",
      output: [
        "Main: starting",
        "Worker 1 starting",
        "Worker 2 starting",
        "Worker 3 starting",
      ],
      note: "4 goroutines active!",
    },
  },
  {
    description:
      "All goroutines are executing concurrently. The Go scheduler multiplexes them across OS threads. Worker 1 progresses.",
    highlightLines: [9, 10],
    state: {
      goroutines: [
        {
          id: 1,
          name: "worker(1)",
          status: "running",
          progress: 60,
          color: goroutineColors[0],
        },
        {
          id: 2,
          name: "worker(2)",
          status: "running",
          progress: 40,
          color: goroutineColors[1],
        },
        {
          id: 3,
          name: "worker(3)",
          status: "running",
          progress: 25,
          color: goroutineColors[2],
        },
      ],
      mainStatus: "waiting",
      output: [
        "Main: starting",
        "Worker 1 starting",
        "Worker 2 starting",
        "Worker 3 starting",
      ],
      note: "Go scheduler runs goroutines concurrently",
    },
  },
  {
    description:
      'Worker 1 finishes! It prints "Worker 1 done". Goroutines can complete in ANY order — no guarantee.',
    highlightLines: [11],
    state: {
      goroutines: [
        {
          id: 1,
          name: "worker(1)",
          status: "done",
          progress: 100,
          color: goroutineColors[0],
          output: "Worker 1 done",
        },
        {
          id: 2,
          name: "worker(2)",
          status: "running",
          progress: 65,
          color: goroutineColors[1],
        },
        {
          id: 3,
          name: "worker(3)",
          status: "running",
          progress: 50,
          color: goroutineColors[2],
        },
      ],
      mainStatus: "waiting",
      output: [
        "Main: starting",
        "Worker 1 starting",
        "Worker 2 starting",
        "Worker 3 starting",
        "Worker 1 done",
      ],
    },
  },
  {
    description:
      "Worker 2 finishes! Note: execution order is non-deterministic — concurrency means we cannot predict which finishes first.",
    highlightLines: [11],
    state: {
      goroutines: [
        {
          id: 1,
          name: "worker(1)",
          status: "done",
          progress: 100,
          color: goroutineColors[0],
          output: "Worker 1 done",
        },
        {
          id: 2,
          name: "worker(2)",
          status: "done",
          progress: 100,
          color: goroutineColors[1],
          output: "Worker 2 done",
        },
        {
          id: 3,
          name: "worker(3)",
          status: "running",
          progress: 75,
          color: goroutineColors[2],
        },
      ],
      mainStatus: "waiting",
      output: [
        "Main: starting",
        "Worker 1 starting",
        "Worker 2 starting",
        "Worker 3 starting",
        "Worker 1 done",
        "Worker 2 done",
      ],
    },
  },
  {
    description:
      "Worker 3 finishes! All workers done. main() was sleeping — this is a BAD synchronization approach. See WaitGroup for the right way!",
    highlightLines: [11, 22],
    state: {
      goroutines: [
        {
          id: 1,
          name: "worker(1)",
          status: "done",
          progress: 100,
          color: goroutineColors[0],
          output: "Worker 1 done",
        },
        {
          id: 2,
          name: "worker(2)",
          status: "done",
          progress: 100,
          color: goroutineColors[1],
          output: "Worker 2 done",
        },
        {
          id: 3,
          name: "worker(3)",
          status: "done",
          progress: 100,
          color: goroutineColors[2],
          output: "Worker 3 done",
        },
      ],
      mainStatus: "running",
      output: [
        "Main: starting",
        "Worker 1 starting",
        "Worker 2 starting",
        "Worker 3 starting",
        "Worker 1 done",
        "Worker 2 done",
        "Worker 3 done",
        "Main: done",
      ],
      note: "Use WaitGroup for proper sync!",
    },
  },
];

export function Goroutines() {
  return (
    <VisualizationLayout
      title="Goroutines"
      description="Go's lightweight concurrent execution units — the `go` keyword"
      tag="Concurrency"
      tagColor="bg-[#00ACD7]"
      steps={steps}
      codeLines={codeLines}
      renderVisual={(state: GoroutineState) => (
        <div className="w-full max-w-xl space-y-4">
          {/* Main goroutine */}
          <div>
            <p className="text-[#8b949e] text-xs uppercase tracking-wide mb-2">
              Goroutines
            </p>
            <div
              className="flex items-center gap-3 p-3 rounded-lg border-2 transition-all duration-300 mb-2"
              style={{
                borderColor:
                  state.mainStatus === "done"
                    ? "#3fb950"
                    : state.mainStatus === "waiting"
                      ? "#ffa657"
                      : "#d2a8ff",
                backgroundColor:
                  state.mainStatus === "done"
                    ? "rgba(63,185,80,0.1)"
                    : state.mainStatus === "waiting"
                      ? "rgba(255,166,87,0.05)"
                      : "rgba(210,168,255,0.1)",
              }}
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                style={{ backgroundColor: "#d2a8ff", color: "#0d1117" }}
              >
                M
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[#e6edf3] text-sm font-mono">
                    main()
                  </span>
                  <span
                    className="text-xs px-2 py-0.5 rounded-full"
                    style={{
                      backgroundColor:
                        state.mainStatus === "done"
                          ? "rgba(63,185,80,0.2)"
                          : state.mainStatus === "waiting"
                            ? "rgba(255,166,87,0.2)"
                            : "rgba(210,168,255,0.2)",
                      color:
                        state.mainStatus === "done"
                          ? "#3fb950"
                          : state.mainStatus === "waiting"
                            ? "#ffa657"
                            : "#d2a8ff",
                    }}
                  >
                    {state.mainStatus}
                  </span>
                </div>
                <div className="h-2 bg-[#0d1117] rounded-full">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width:
                        state.mainStatus === "done"
                          ? "100%"
                          : state.mainStatus === "waiting"
                            ? "60%"
                            : "30%",
                      backgroundColor: "#d2a8ff",
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Worker goroutines */}
            {state.goroutines.map((g) => (
              <div
                key={g.id}
                className="flex items-center gap-3 p-3 rounded-lg border transition-all duration-300 mb-2"
                style={{
                  borderColor:
                    g.status === "done"
                      ? "#3fb950"
                      : g.status === "running"
                        ? g.color
                        : "#30363d",
                  backgroundColor:
                    g.status === "done"
                      ? "rgba(63,185,80,0.05)"
                      : `${g.color}08`,
                }}
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                  style={{ backgroundColor: g.color, color: "#0d1117" }}
                >
                  G{g.id}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[#e6edf3] text-sm font-mono">
                      {g.name}
                    </span>
                    <span
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{
                        backgroundColor:
                          g.status === "done"
                            ? "rgba(63,185,80,0.2)"
                            : `${g.color}25`,
                        color: g.status === "done" ? "#3fb950" : g.color,
                      }}
                    >
                      {g.status}
                    </span>
                  </div>
                  <div className="h-2 bg-[#0d1117] rounded-full">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${g.progress}%`,
                        backgroundColor:
                          g.status === "done" ? "#3fb950" : g.color,
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Concurrency diagram */}
          {state.goroutines.length > 0 && (
            <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3">
              <p className="text-[#8b949e] text-xs mb-2 uppercase tracking-wide">
                Timeline (concurrent execution)
              </p>
              <div className="relative h-16">
                {[
                  { label: "main", color: "#d2a8ff", start: 0, width: 100 },
                  ...state.goroutines.map((g, i) => ({
                    label: `G${g.id}`,
                    color: g.color,
                    start: (i + 1) * 8,
                    width: g.progress,
                  })),
                ].map((row, i) => (
                  <div key={row.label} className="flex items-center gap-2 mb-1">
                    <span
                      className="text-[10px] w-8 text-right flex-shrink-0"
                      style={{ color: row.color }}
                    >
                      {row.label}
                    </span>
                    <div className="flex-1 h-4 bg-[#0d1117] rounded-sm overflow-hidden">
                      <div
                        className="h-full rounded-sm transition-all duration-500 opacity-70"
                        style={{
                          marginLeft: `${row.start}%`,
                          width: `${Math.min(row.width, 100 - row.start)}%`,
                          backgroundColor: row.color,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Output */}
          {state.output.length > 0 && (
            <div className="bg-[#0d1117] border border-[#30363d] rounded-lg p-3 max-h-32 overflow-auto">
              <p className="text-[#8b949e] text-xs uppercase tracking-wide mb-2">
                Output (order may vary!)
              </p>
              {state.output.map((line, i) => (
                <p key={i} className="text-[#3fb950] font-mono text-xs">
                  {line}
                </p>
              ))}
            </div>
          )}

          {/* Note */}
          {state.note && (
            <div className="bg-[#ffa657]/10 border border-[#ffa657]/30 rounded-lg p-3">
              <p className="text-[#ffa657] text-xs">⚡ {state.note}</p>
            </div>
          )}
        </div>
      )}
    />
  );
}
