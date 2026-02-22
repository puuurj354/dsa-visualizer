/**
 * VisualizationLayout.tsx
 * ─────────────────────────────────────────────────────────────
 * The single shared layout component powering every visualization
 * page. It orchestrates:
 *
 *  [D] Code Copy Button      — handled inside GoCode.tsx
 *  [E] Share / Permalink     — reads ?step=N on mount, writes on change
 *  [C] Complexity Card       — optional prop, rendered in header
 *  [A] Step Comparison Mode  — side-by-side Before / After panels
 *  [B] Editable Input        — optional prop, rendered below header
 *
 * All new props are OPTIONAL so existing pages work unchanged.
 * ─────────────────────────────────────────────────────────────
 */

import { type ReactNode, useState, useEffect, useRef, useCallback } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { toast } from 'sonner';
import { GoCode } from './GoCode';
import { VisualizationControls } from './VisualizationControls';
import { ComplexityCard, type ComplexityInfo } from './ComplexityCard';
import { EditableInputPanel, type EditableInputConfig } from './EditableInputPanel';

// ─── Public Types ─────────────────────────────────────────────

/**
 * Step<T>
 * Represents a single frame in a visualization.
 *
 * @template T - The shape of the algorithm/DS state at this step
 */
export interface Step<T = unknown> {
  description: string;      // Narration shown in the control bar
  highlightLines: number[]; // 1-based line numbers to highlight in GoCode
  state: T;                 // State snapshot rendered by renderVisual
}

/**
 * VisualizationLayoutProps<T>
 * Props for the shared layout. Optional props (marked with ?) allow
 * individual pages to opt in to advanced features without breaking others.
 */
interface VisualizationLayoutProps<T> {
  title: string;                              // Page heading
  description: string;                        // Short subtitle
  tag?: string;                               // Category badge text
  tagColor?: string;                          // Tailwind class for badge background
  steps: Step<T>[];                           // Pre-computed steps (required)
  renderVisual: (state: T, step: number) => ReactNode; // Visual renderer callback
  codeLines: string[];                        // Go source lines for GoCode panel

  // ── Feature C: Complexity Card ───────────────────────────────
  complexity?: ComplexityInfo;                // Opt-in complexity information

  // ── Feature B: Editable Input ────────────────────────────────
  editableInput?: EditableInputConfig<T>;     // Opt-in custom input panel config
  editableDefaultValue?: string;              // Opt-in default value for input field
}

// ─── URL helper ───────────────────────────────────────────────

/**
 * readStepFromURL
 * Reads the `?step=N` query parameter from the current browser URL.
 * Returns null if the param is absent or not a valid integer.
 */
function readStepFromURL(): number | null {
  const params = new URLSearchParams(window.location.search); // Parse query string
  const raw = params.get('step');                              // Read "step" param
  if (raw === null) return null;                               // Param absent
  const n = parseInt(raw, 10);                                 // Parse as base-10 integer
  return Number.isFinite(n) ? n : null;                        // Guard against NaN/Infinity
}

/**
 * writeStepToURL
 * Updates the `?step=N` query parameter in the browser history without
 * triggering a React re-render or navigation.
 *
 * @param step - 0-based step index to persist in the URL
 */
function writeStepToURL(step: number): void {
  const url = new URL(window.location.href);   // Clone the current URL object
  url.searchParams.set('step', String(step));  // Set or replace the step param
  window.history.replaceState(null, '', url);  // Rewrite URL bar without navigation
}

// ─── Component ────────────────────────────────────────────────

/**
 * VisualizationLayout<T>
 * Generic layout component. T is the state type for each step.
 *
 * Key state:
 *  - currentStep    : 0-based index of the displayed step
 *  - isPlaying      : whether the auto-advance timer is running
 *  - speed          : interval duration in milliseconds
 *  - dynamicSteps   : steps array, may be replaced by editable input
 *  - compareMode    : whether Before/After panels are shown
 *  - shareCopied    : temporary flag for the Share button's copied state
 */
export function VisualizationLayout<T>({
  title,
  description,
  tag,
  tagColor = 'bg-[#00ACD7]',
  steps: initialSteps,
  renderVisual,
  codeLines,
  complexity,
  editableInput,
  editableDefaultValue = '',
}: VisualizationLayoutProps<T>) {

  // ── Feature B: Dynamic steps (replaced when user submits custom input) ──
  const [dynamicSteps, setDynamicSteps] = useState<Step<T>[]>(initialSteps);

  // ── Playback state ──────────────────────────────────────────
  const [currentStep, setCurrentStep] = useState<number>(() => {
    // Feature E: initialize from URL param, clamped safely below
    const fromURL = readStepFromURL();
    if (fromURL === null) return 0; // No URL param → start at step 0
    // Clamp will be applied after mount once we know steps.length;
    // for now store raw value — the clamp useEffect below handles it.
    return fromURL;
  });
  const [isPlaying, setIsPlaying] = useState(false);           // Auto-play ticker active
  const [speed, setSpeed] = useState(1000);                    // Interval ms (default 1s)

  // ── Feature A: Compare Mode ──────────────────────────────────
  const [compareMode, setCompareMode] = useState(false);       // Before/After toggle

  // ── Feature E: Share URL ─────────────────────────────────────
  const [shareCopied, setShareCopied] = useState(false);       // Share button feedback state

  // Ref to hold the setInterval ID so we can clear it on cleanup
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ─── DEFENSIVE CHECK ─────────────────────────────────────────
  // Guard against empty steps arrays (should not happen, but defensive)
  if (!dynamicSteps || dynamicSteps.length === 0) {
    return (
      <div className="flex items-center justify-center h-full bg-[#0d1117] text-[#8b949e]">
        <p>Error: No visualization steps provided.</p>
      </div>
    );
  }

  // ─── Feature E: Clamp step from URL to valid range ────────────
  // This effect runs once on mount to clamp a URL step that may exceed
  // the actual number of steps (e.g. user manually typed ?step=999).
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    const maxStep = dynamicSteps.length - 1;          // Highest valid step index
    if (currentStep > maxStep) {
      setCurrentStep(maxStep);                        // Clamp to valid max
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dynamicSteps.length]); // Only run when steps count changes

  // ─── Feature E: Sync URL on every step change ─────────────────
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    writeStepToURL(currentStep); // Keep URL in sync with the current step
  }, [currentStep]);

  // ─── Auto-play timer ──────────────────────────────────────────
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    if (isPlaying) {
      // Set up the auto-advance interval
      intervalRef.current = setInterval(() => {
        setCurrentStep(prev => {
          if (prev >= dynamicSteps.length - 1) {
            setIsPlaying(false); // Stop at the last step — do not loop
            return prev;
          }
          return prev + 1;       // Advance one step
        });
      }, speed);
    }
    // Cleanup: clear timer when play stops, speed changes, or component unmounts
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying, speed, dynamicSteps.length]);

  // ─── Navigation callbacks ─────────────────────────────────────

  /** handleReset — jump to step 0 and stop playback */
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const handleReset = useCallback(() => {
    setIsPlaying(false);   // Always pause on manual navigation
    setCurrentStep(0);
  }, []);

  /** handlePrev — move one step back, clamped at 0 */
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const handlePrev = useCallback(() => {
    setIsPlaying(false);
    setCurrentStep(p => Math.max(0, p - 1));          // Guard: never below 0
  }, []);

  /** handleNext — move one step forward, clamped at last step */
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const handleNext = useCallback(() => {
    setIsPlaying(false);
    setCurrentStep(p => Math.min(dynamicSteps.length - 1, p + 1)); // Guard: never past end
  }, [dynamicSteps.length]);

  /** handlePlayPause — toggle the auto-play timer via isPlaying state */
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const handlePlayPause = useCallback(() => {
    setIsPlaying(p => !p); // Toggle: the useEffect manages the actual interval
  }, []);

  /** handleToggleCompare — Feature A: flip compare mode on/off */
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const handleToggleCompare = useCallback(() => {
    setCompareMode(prev => {
      if (prev) return false; // Turning off — simple toggle
      // Turning on: if on last step, move back one so we always have a "next" step
      if (currentStep >= dynamicSteps.length - 1) {
        setCurrentStep(dynamicSteps.length - 2);
      }
      setIsPlaying(false); // Pause playback when entering compare mode
      return true;
    });
  }, [currentStep, dynamicSteps.length]);

  /** handleShare — Feature E: copy the current step's permalink to clipboard */
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const handleShare = useCallback(() => {
    const shareURL = window.location.href; // URL already has ?step=N via writeStepToURL
    navigator.clipboard.writeText(shareURL)
      .catch(() => {
        // Clipboard API failed — show fallback error via sonner
        toast.error('Could not copy link. Please copy the URL manually.');
      });
    setShareCopied(true);                          // Trigger copied state feedback
    setTimeout(() => setShareCopied(false), 2500); // Reset after 2.5s
  }, []);

  /** handleEditableSubmit — Feature B: replace steps with user-generated ones */
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const handleEditableSubmit = useCallback((newSteps: Step<T>[]) => {
    if (!newSteps || newSteps.length === 0) return; // Defensive: ignore empty arrays
    setDynamicSteps(newSteps);  // Replace the current step sequence
    setCurrentStep(0);          // Always restart from step 0 on new input
    setIsPlaying(false);        // Pause so user can review the new visualization
    setCompareMode(false);      // Exit compare mode to start fresh
  }, []);

  // ─── Keyboard shortcuts ───────────────────────────────────────
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore shortcuts when user is typing in a form field
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      switch (e.code) {
        case 'Space':
          e.preventDefault();    // Prevent page scroll
          handlePlayPause();
          break;
        case 'ArrowRight':
          e.preventDefault();
          handleNext();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          handlePrev();
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);   // Attach global listener
    return () => window.removeEventListener('keydown', handleKeyDown); // Cleanup
  }, [handlePlayPause, handleNext, handlePrev]);

  // ─── Derived values ───────────────────────────────────────────
  const step = dynamicSteps[currentStep];                        // Current step object
  const nextStep = dynamicSteps[currentStep + 1] ?? step;        // Next step (or same if last)

  // ─── Render ───────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full bg-[#0d1117]">

      {/* ── Header Bar ──────────────────────────────────────── */}
      <div className="px-6 py-4 border-b border-[#30363d] bg-[#161b22] flex items-center gap-3 flex-wrap">
        {/* Category badge (e.g. "Algorithms", "Data Structures") */}
        {tag && (
          <span className={`text-xs px-2 py-0.5 rounded-full text-white shrink-0 ${tagColor}`}>
            {tag}
          </span>
        )}
        {/* Title and description */}
        <div className="flex-1 min-w-0">
          <h1 className="text-[#e6edf3] text-lg leading-tight">{title}</h1>
          <p className="text-[#8b949e] text-sm truncate">{description}</p>
        </div>

        {/* Feature C: Complexity Card — only rendered when prop is provided */}
        {complexity && <ComplexityCard complexity={complexity} />}
      </div>

      {/* ── Feature B: Editable Input Panel ─────────────────── */}
      {/* Rendered below header only if the page opts in via editableInput prop */}
      {editableInput && (
        <EditableInputPanel
          config={editableInput}
          defaultValue={editableDefaultValue}
          onSubmit={handleEditableSubmit}
        />
      )}

      {/* ── Main Content Area ─────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden">
        <PanelGroup direction="horizontal">

          {/* Panel 1: Go Code viewer */}
          <Panel defaultSize={42} minSize={20} className="border-r border-[#30363d] flex flex-col">
            <div className="px-3 py-2 border-b border-[#30363d] bg-[#161b22]">
              <span className="text-[#8b949e] text-xs uppercase tracking-wide">Go Code</span>
            </div>
            <div className="flex-1 overflow-auto p-3">
              <GoCode lines={codeLines} highlightLines={step.highlightLines} />
            </div>
          </Panel>

          {/* Drag handle — visual indicator between panels */}
          <PanelResizeHandle className="w-1.5 bg-[#30363d] hover:bg-[#58a6ff] transition-colors cursor-col-resize flex flex-col items-center justify-center">
            <div className="w-0.5 h-8 bg-gray-500 rounded-full" />
          </PanelResizeHandle>

          {/* Panel 2: Visualization (or Before/After split in compare mode) */}
          <Panel defaultSize={58} minSize={30} className="flex flex-col">
            <div className="px-3 py-2 border-b border-[#30363d] bg-[#161b22] flex items-center justify-between">
              <span className="text-[#8b949e] text-xs uppercase tracking-wide">
                {/* Label changes when compare mode is active */}
                {compareMode ? 'Comparison — Before & After' : 'Visualization'}
              </span>
              {/* Small purple badge when compare mode is active */}
              {compareMode && (
                <span className="text-[10px] bg-[#d2a8ff]/10 text-[#d2a8ff] border border-[#d2a8ff]/30 px-2 py-0.5 rounded-full">
                  Compare Mode
                </span>
              )}
            </div>

            {/* ── Feature A: Compare Mode layout ───────────── */}
            {compareMode ? (
              /* Side-by-side Before / After panels */
              <div className="flex-1 overflow-auto flex divide-x divide-[#30363d]">
                {/* "Before" panel — current step N */}
                <div className="flex-1 flex flex-col min-w-0">
                  <div className="px-3 py-1.5 bg-[#0d1117] border-b border-[#30363d] flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#8b949e]" />
                    <span className="text-[#8b949e] text-xs">Step {currentStep + 1} — Before</span>
                  </div>
                  <div className="flex-1 overflow-auto p-4 flex items-start justify-center">
                    {renderVisual(step.state, currentStep)}
                  </div>
                </div>
                {/* "After" panel — next step N+1 */}
                <div className="flex-1 flex flex-col min-w-0">
                  <div className="px-3 py-1.5 bg-[#0d1117] border-b border-[#30363d] flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#00ACD7]" />
                    <span className="text-[#00ACD7] text-xs">Step {currentStep + 2} — After</span>
                  </div>
                  <div className="flex-1 overflow-auto p-4 flex items-start justify-center">
                    {renderVisual(nextStep.state, currentStep + 1)}
                  </div>
                </div>
              </div>
            ) : (
              /* Normal single-panel visualization */
              <div className="flex-1 overflow-auto p-4 flex items-start justify-center">
                {renderVisual(step.state, currentStep)}
              </div>
            )}
          </Panel>

        </PanelGroup>
      </div>

      {/* ── Footer Controls ──────────────────────────────────── */}
      <VisualizationControls
        onPrev={handlePrev}
        onNext={handleNext}
        onPlayPause={handlePlayPause}
        onReset={handleReset}
        isPlaying={isPlaying}
        currentStep={currentStep}
        totalSteps={dynamicSteps.length}
        speed={speed}
        onSpeedChange={setSpeed}
        description={step?.description ?? ''}   /* Defensive fallback */
        compareMode={compareMode}
        onToggleCompare={handleToggleCompare}
        shareCopied={shareCopied}
        onShare={handleShare}
      />
    </div>
  );
}
