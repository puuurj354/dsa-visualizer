import { VisualizationLayout, type Step } from '../../components/VisualizationLayout';

// ─── State types ───────────────────────────────────────────────

type JobStatus = 'queued' | 'processing' | 'done';
type WorkerStatus = 'idle' | 'busy' | 'done';

interface Job {
    id: number;
    status: JobStatus;
    assignedTo?: number; // worker id
    result?: number;
}

interface Worker {
    id: number;
    status: WorkerStatus;
    currentJob?: number;
}

interface WorkerPoolState {
    jobs: Job[];
    workers: Worker[];
    results: string[];
    note?: string;
}

// ─── Code ─────────────────────────────────────────────────────

const codeLines = [
    'package main',
    '',
    'import (',
    '    "fmt"',
    '    "sync"',
    ')',
    '',
    'func worker(id int, jobs <-chan int, results chan<- int, wg *sync.WaitGroup) {',
    '    defer wg.Done()',
    '    for job := range jobs {',
    '        fmt.Printf("Worker %d processing job %d\\n", id, job)',
    '        results <- job * 2  // simulate work',
    '    }',
    '}',
    '',
    'func main() {',
    '    const numWorkers = 3',
    '    const numJobs   = 5',
    '',
    '    jobs    := make(chan int, numJobs)',
    '    results := make(chan int, numJobs)',
    '',
    '    var wg sync.WaitGroup',
    '    for w := 1; w <= numWorkers; w++ {',
    '        wg.Add(1)',
    '        go worker(w, jobs, results, &wg)',
    '    }',
    '',
    '    for j := 1; j <= numJobs; j++ {',
    '        jobs <- j',
    '    }',
    '    close(jobs)',
    '',
    '    go func() { wg.Wait(); close(results) }()',
    '',
    '    for r := range results {',
    '        fmt.Println("Result:", r)',
    '    }',
    '}',
];

// ─── Steps ─────────────────────────────────────────────────────

const steps: Step<WorkerPoolState>[] = [
    {
        description: 'A Worker Pool is one of the most common Go concurrency patterns. We create a fixed number of goroutines (workers) and feed them work via a buffered channel.',
        highlightLines: [17, 18],
        state: {
            jobs: [],
            workers: [],
            results: [],
        },
    },
    {
        description: '`make(chan int, numJobs)` — create a buffered `jobs` channel (capacity 5) and a `results` channel. Buffering means producers don\'t block.',
        highlightLines: [20, 21],
        state: {
            jobs: [],
            workers: [],
            results: [],
            note: 'Buffered channels: capacity 5',
        },
    },
    {
        description: '3 worker goroutines are launched. Each calls `wg.Add(1)` before starting. Workers block on `for job := range jobs`, waiting for work.',
        highlightLines: [24, 25, 26],
        state: {
            jobs: [],
            workers: [
                { id: 1, status: 'idle' },
                { id: 2, status: 'idle' },
                { id: 3, status: 'idle' },
            ],
            results: [],
            note: '3 workers idle, waiting for jobs',
        },
    },
    {
        description: 'All 5 jobs are sent into the `jobs` channel. Because it\'s buffered (capacity 5), this doesn\'t block — all jobs fit immediately.',
        highlightLines: [29, 30],
        state: {
            jobs: [
                { id: 1, status: 'queued' },
                { id: 2, status: 'queued' },
                { id: 3, status: 'queued' },
                { id: 4, status: 'queued' },
                { id: 5, status: 'queued' },
            ],
            workers: [
                { id: 1, status: 'idle' },
                { id: 2, status: 'idle' },
                { id: 3, status: 'idle' },
            ],
            results: [],
        },
    },
    {
        description: '`close(jobs)` — closes the channel. Workers\' `for range` loops will drain remaining jobs and then exit cleanly. This signals "no more work".',
        highlightLines: [31],
        state: {
            jobs: [
                { id: 1, status: 'queued' },
                { id: 2, status: 'queued' },
                { id: 3, status: 'queued' },
                { id: 4, status: 'queued' },
                { id: 5, status: 'queued' },
            ],
            workers: [
                { id: 1, status: 'idle' },
                { id: 2, status: 'idle' },
                { id: 3, status: 'idle' },
            ],
            results: [],
            note: 'close(jobs) signals: no more work',
        },
    },
    {
        description: 'Workers pick up jobs! Workers 1, 2, and 3 each grab a job from the channel simultaneously. 3 jobs are now being processed concurrently.',
        highlightLines: [10, 11],
        state: {
            jobs: [
                { id: 1, status: 'processing', assignedTo: 1 },
                { id: 2, status: 'processing', assignedTo: 2 },
                { id: 3, status: 'processing', assignedTo: 3 },
                { id: 4, status: 'queued' },
                { id: 5, status: 'queued' },
            ],
            workers: [
                { id: 1, status: 'busy', currentJob: 1 },
                { id: 2, status: 'busy', currentJob: 2 },
                { id: 3, status: 'busy', currentJob: 3 },
            ],
            results: [],
        },
    },
    {
        description: 'Workers complete jobs 1 and 2 and send results to the `results` channel. Then they immediately pick up jobs 4 and 5.',
        highlightLines: [12],
        state: {
            jobs: [
                { id: 1, status: 'done', assignedTo: 1, result: 2 },
                { id: 2, status: 'done', assignedTo: 2, result: 4 },
                { id: 3, status: 'processing', assignedTo: 3 },
                { id: 4, status: 'processing', assignedTo: 1 },
                { id: 5, status: 'processing', assignedTo: 2 },
            ],
            workers: [
                { id: 1, status: 'busy', currentJob: 4 },
                { id: 2, status: 'busy', currentJob: 5 },
                { id: 3, status: 'busy', currentJob: 3 },
            ],
            results: ['2', '4'],
        },
    },
    {
        description: 'All 5 jobs complete! Workers finish their last jobs and `wg.Done()` is called. `wg.Wait()` unblocks, closing the `results` channel.',
        highlightLines: [9, 33],
        state: {
            jobs: [
                { id: 1, status: 'done', result: 2 },
                { id: 2, status: 'done', result: 4 },
                { id: 3, status: 'done', result: 6 },
                { id: 4, status: 'done', result: 8 },
                { id: 5, status: 'done', result: 10 },
            ],
            workers: [
                { id: 1, status: 'done' },
                { id: 2, status: 'done' },
                { id: 3, status: 'done' },
            ],
            results: ['2', '4', '6', '8', '10'],
            note: 'wg.Wait() → close(results) → range results exits',
        },
    },
    {
        description: 'Final output printed. Key insight: the Worker Pool pattern bounds concurrency (prevents resource exhaustion) while keeping throughput high.',
        highlightLines: [35, 36],
        state: {
            jobs: [
                { id: 1, status: 'done', result: 2 },
                { id: 2, status: 'done', result: 4 },
                { id: 3, status: 'done', result: 6 },
                { id: 4, status: 'done', result: 8 },
                { id: 5, status: 'done', result: 10 },
            ],
            workers: [
                { id: 1, status: 'done' },
                { id: 2, status: 'done' },
                { id: 3, status: 'done' },
            ],
            results: ['Result: 2', 'Result: 4', 'Result: 6', 'Result: 8', 'Result: 10'],
        },
    },
];

// ─── Colors ────────────────────────────────────────────────────

const workerColors: Record<number, string> = {
    1: '#00ACD7',
    2: '#3fb950',
    3: '#ffa657',
};

const statusColor: Record<JobStatus, string> = {
    queued: '#8b949e',
    processing: '#ffa657',
    done: '#3fb950',
};

// ─── Component ─────────────────────────────────────────────────

export function WorkerPool() {
    return (
        <VisualizationLayout
            title="Worker Pool"
            description="Fan-out concurrency: fixed goroutines draining a shared jobs channel"
            tag="Concurrency"
            tagColor="bg-[#00ACD7]"
            steps={steps}
            codeLines={codeLines}
            renderVisual={(state: WorkerPoolState) => (
                <div className="w-full max-w-xl space-y-4">

                    {/* Workers */}
                    <div>
                        <p className="text-[#8b949e] text-xs uppercase tracking-wide mb-2">Workers (goroutines)</p>
                        <div className="space-y-2">
                            {state.workers.map(w => (
                                <div
                                    key={w.id}
                                    className="flex items-center gap-3 p-3 rounded-lg border transition-all duration-300"
                                    style={{
                                        borderColor: w.status === 'done' ? '#3fb950' : w.status === 'busy' ? workerColors[w.id] : '#30363d',
                                        backgroundColor: w.status === 'idle' ? '#161b22' : w.status === 'done' ? 'rgba(63,185,80,0.07)' : `${workerColors[w.id]}10`,
                                    }}
                                >
                                    <div
                                        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                                        style={{ backgroundColor: workerColors[w.id], color: '#0d1117' }}
                                    >
                                        W{w.id}
                                    </div>
                                    <div className="flex-1 flex items-center justify-between">
                                        <span className="text-[#e6edf3] text-sm font-mono">worker({w.id})</span>
                                        <div className="flex items-center gap-2">
                                            {w.currentJob != null && (
                                                <span className="text-xs font-mono" style={{ color: workerColors[w.id] }}>
                                                    job #{w.currentJob}
                                                </span>
                                            )}
                                            <span
                                                className="text-xs px-2 py-0.5 rounded-full"
                                                style={{
                                                    color: w.status === 'done' ? '#3fb950' : w.status === 'busy' ? workerColors[w.id] : '#8b949e',
                                                    backgroundColor: w.status === 'done' ? 'rgba(63,185,80,0.15)' : w.status === 'busy' ? `${workerColors[w.id]}20` : 'rgba(139,148,158,0.15)',
                                                }}
                                            >
                                                {w.status}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {state.workers.length === 0 && (
                                <div className="border border-dashed border-[#30363d] rounded-lg p-4 text-center text-[#8b949e] text-sm">
                                    Workers not started yet
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Jobs channel */}
                    <div>
                        <p className="text-[#8b949e] text-xs uppercase tracking-wide mb-2">
                            Jobs Channel <span className="normal-case text-[#30363d]">← buffered, cap 5</span>
                        </p>
                        <div className="flex gap-1.5 flex-wrap">
                            {state.jobs.length === 0 && (
                                <div className="border border-dashed border-[#30363d] rounded px-4 py-2 text-[#8b949e] text-xs">empty</div>
                            )}
                            {state.jobs.map(job => (
                                <div
                                    key={job.id}
                                    className="flex flex-col items-center gap-1 px-3 py-2 rounded-lg border transition-all duration-300"
                                    style={{
                                        borderColor: statusColor[job.status],
                                        backgroundColor: `${statusColor[job.status]}12`,
                                    }}
                                >
                                    <span className="text-xs font-mono" style={{ color: statusColor[job.status] }}>
                                        #{job.id}
                                    </span>
                                    <span className="text-[10px]" style={{ color: statusColor[job.status] }}>
                                        {job.status}
                                        {job.assignedTo != null && job.status === 'processing' && ` →W${job.assignedTo}`}
                                        {job.result != null && ` =${job.result}`}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Results */}
                    {state.results.length > 0 && (
                        <div className="bg-[#0d1117] border border-[#30363d] rounded-lg p-3">
                            <p className="text-[#8b949e] text-xs uppercase tracking-wide mb-2">Results Channel</p>
                            <div className="flex flex-wrap gap-2">
                                {state.results.map((r, i) => (
                                    <span key={i} className="text-[#3fb950] font-mono text-xs bg-[#3fb950]/10 px-2 py-1 rounded">
                                        {r}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

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
