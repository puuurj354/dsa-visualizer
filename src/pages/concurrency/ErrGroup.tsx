import { VisualizationLayout, type Step } from '../../components/VisualizationLayout';

// ─── State types ───────────────────────────────────────────────

type TaskStatus = 'pending' | 'running' | 'success' | 'failed';

interface Task {
    id: number;
    name: string;
    status: TaskStatus;
    err?: string;
}

interface ErrGroupState {
    tasks: Task[];
    groupDone: boolean;
    finalErr: string | null;
    note?: string;
}

// ─── Code ─────────────────────────────────────────────────────

const codeLines = [
    'package main',
    '',
    'import (',
    '    "context"',
    '    "fmt"',
    '    "golang.org/x/sync/errgroup"',
    ')',
    '',
    'func fetchUser(ctx context.Context) error {',
    '    // Simulate network call — succeeds',
    '    return nil',
    '}',
    '',
    'func fetchPosts(ctx context.Context) error {',
    '    // Simulate network call — fails!',
    '    return fmt.Errorf("posts API: 503 Service Unavailable")',
    '}',
    '',
    'func fetchComments(ctx context.Context) error {',
    '    // Simulate network call — succeeds',
    '    return nil',
    '}',
    '',
    'func main() {',
    '    g, ctx := errgroup.WithContext(context.Background())',
    '',
    '    g.Go(func() error { return fetchUser(ctx) })',
    '    g.Go(func() error { return fetchPosts(ctx) })',
    '    g.Go(func() error { return fetchComments(ctx) })',
    '',
    '    if err := g.Wait(); err != nil {',
    '        fmt.Println("Error:", err)',
    '        return',
    '    }',
    '    fmt.Println("All tasks succeeded!")',
    '}',
];

// ─── Steps ─────────────────────────────────────────────────────

const steps: Step<ErrGroupState>[] = [
    {
        description: '`errgroup` (golang.org/x/sync) manages a group of goroutines and collects the first non-nil error. It\'s the idiomatic way to run concurrent tasks that can fail.',
        highlightLines: [6],
        state: { tasks: [], groupDone: false, finalErr: null },
    },
    {
        description: '`errgroup.WithContext()` creates an errgroup `g` and a derived context `ctx`. If any goroutine returns an error, `ctx` is cancelled automatically.',
        highlightLines: [25],
        state: {
            tasks: [],
            groupDone: false,
            finalErr: null,
            note: 'WithContext: cancels ctx on first error',
        },
    },
    {
        description: '`g.Go(...)` launches 3 goroutines concurrently. Unlike `go func()`, errgroup tracks each goroutine\'s return value — no manual WaitGroup or error channel needed.',
        highlightLines: [27, 28, 29],
        state: {
            tasks: [
                { id: 1, name: 'fetchUser()', status: 'running' },
                { id: 2, name: 'fetchPosts()', status: 'running' },
                { id: 3, name: 'fetchComments()', status: 'running' },
            ],
            groupDone: false,
            finalErr: null,
        },
    },
    {
        description: '`fetchUser()` and `fetchComments()` succeed (return nil). `fetchPosts()` is still running — it will return an error.',
        highlightLines: [10, 11, 20, 21],
        state: {
            tasks: [
                { id: 1, name: 'fetchUser()', status: 'success' },
                { id: 2, name: 'fetchPosts()', status: 'running' },
                { id: 3, name: 'fetchComments()', status: 'success' },
            ],
            groupDone: false,
            finalErr: null,
        },
    },
    {
        description: '`fetchPosts()` returns an error. errgroup records it and immediately cancels `ctx`. Any goroutine checking `ctx.Err()` would detect cancellation.',
        highlightLines: [15, 16],
        state: {
            tasks: [
                { id: 1, name: 'fetchUser()', status: 'success' },
                { id: 2, name: 'fetchPosts()', status: 'failed', err: '503 Service Unavailable' },
                { id: 3, name: 'fetchComments()', status: 'success' },
            ],
            groupDone: false,
            finalErr: 'posts API: 503 Service Unavailable',
            note: 'ctx cancelled! Running goroutines can check ctx.Err()',
        },
    },
    {
        description: '`g.Wait()` blocks until ALL goroutines finish, then returns the FIRST non-nil error (or nil if all succeeded). Order of errors doesn\'t matter.',
        highlightLines: [31],
        state: {
            tasks: [
                { id: 1, name: 'fetchUser()', status: 'success' },
                { id: 2, name: 'fetchPosts()', status: 'failed', err: '503 Service Unavailable' },
                { id: 3, name: 'fetchComments()', status: 'success' },
            ],
            groupDone: true,
            finalErr: 'posts API: 503 Service Unavailable',
        },
    },
    {
        description: '`err != nil`, so we print the error and return. errgroup makes this pattern clean: launch N goroutines, wait for all, handle first error — 3 lines.',
        highlightLines: [32, 33],
        state: {
            tasks: [
                { id: 1, name: 'fetchUser()', status: 'success' },
                { id: 2, name: 'fetchPosts()', status: 'failed', err: '503 Service Unavailable' },
                { id: 3, name: 'fetchComments()', status: 'success' },
            ],
            groupDone: true,
            finalErr: 'posts API: 503 Service Unavailable',
            note: 'Real-world use: parallel DB queries, fan-out HTTP calls',
        },
    },
];

// ─── Colors ────────────────────────────────────────────────────

const taskStatusColor: Record<TaskStatus, string> = {
    pending: '#8b949e',
    running: '#ffa657',
    success: '#3fb950',
    failed: '#ff7b72',
};

// ─── Component ─────────────────────────────────────────────────

export function ErrGroup() {
    return (
        <VisualizationLayout
            title="errgroup"
            description="golang.org/x/sync/errgroup — concurrent goroutines with structured error handling"
            tag="Concurrency"
            tagColor="bg-[#00ACD7]"
            steps={steps}
            codeLines={codeLines}
            renderVisual={(state: ErrGroupState) => (
                <div className="w-full max-w-xl space-y-4">

                    {/* Tasks */}
                    <div>
                        <p className="text-[#8b949e] text-xs uppercase tracking-wide mb-2">Goroutines in group</p>
                        {state.tasks.length === 0 ? (
                            <div className="border border-dashed border-[#30363d] rounded-lg p-6 text-center text-[#8b949e] text-sm">
                                No goroutines launched yet
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {state.tasks.map(t => (
                                    <div
                                        key={t.id}
                                        className="flex items-center gap-3 p-3 rounded-lg border transition-all duration-300"
                                        style={{
                                            borderColor: taskStatusColor[t.status],
                                            backgroundColor: `${taskStatusColor[t.status]}0d`,
                                        }}
                                    >
                                        <div
                                            className="w-2 h-2 rounded-full flex-shrink-0 transition-all duration-300"
                                            style={{ backgroundColor: taskStatusColor[t.status] }}
                                        />
                                        <span className="flex-1 font-mono text-sm text-[#e6edf3]">{t.name}</span>
                                        <span
                                            className="text-xs px-2 py-0.5 rounded-full"
                                            style={{
                                                color: taskStatusColor[t.status],
                                                backgroundColor: `${taskStatusColor[t.status]}20`,
                                            }}
                                        >
                                            {t.status}
                                        </span>
                                        {t.err && (
                                            <span className="text-xs text-[#ff7b72] font-mono truncate max-w-[120px]" title={t.err}>
                                                {t.err}
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* g.Wait() result */}
                    {state.groupDone && (
                        <div
                            className="rounded-lg border p-4 transition-all duration-500"
                            style={{
                                borderColor: state.finalErr ? '#ff7b72' : '#3fb950',
                                backgroundColor: state.finalErr ? 'rgba(255,123,114,0.07)' : 'rgba(63,185,80,0.07)',
                            }}
                        >
                            <p className="text-xs uppercase tracking-wide mb-2" style={{ color: state.finalErr ? '#ff7b72' : '#3fb950' }}>
                                g.Wait() returned
                            </p>
                            <p className="font-mono text-sm" style={{ color: state.finalErr ? '#ff7b72' : '#3fb950' }}>
                                {state.finalErr ? `error: "${state.finalErr}"` : 'nil — all succeeded!'}
                            </p>
                        </div>
                    )}

                    {/* errgroup vs WaitGroup comparison */}
                    <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3">
                        <p className="text-[#8b949e] text-xs uppercase tracking-wide mb-2">errgroup vs WaitGroup</p>
                        <div className="grid grid-cols-2 gap-3 text-xs">
                            <div>
                                <p className="text-[#8b949e] mb-1">WaitGroup</p>
                                <p className="font-mono text-[#e6edf3]/70">wg.Add / wg.Done</p>
                                <p className="font-mono text-[#e6edf3]/70">wg.Wait()</p>
                                <p className="font-mono text-[#ff7b72]">manual error channel</p>
                            </div>
                            <div>
                                <p className="text-[#3fb950] mb-1">errgroup ✓</p>
                                <p className="font-mono text-[#e6edf3]/70">g.Go(func)</p>
                                <p className="font-mono text-[#e6edf3]/70">err := g.Wait()</p>
                                <p className="font-mono text-[#3fb950]">built-in error return</p>
                            </div>
                        </div>
                    </div>

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
