/**
 * VisualizationControls.tsx
 * ─────────────────────────────────────────────────────────────
 * Bottom control bar shared by all visualization pages.
 * Renders: progress bar, step description, playback controls,
 * speed selector, Compare Mode toggle, and Share button.
 * ─────────────────────────────────────────────────────────────
 */

import { useCallback } from 'react';
import {
  Play, Pause, SkipBack, SkipForward, RotateCcw,
  Columns2, Link, Check,
} from 'lucide-react';
import { toast } from 'sonner';

// ─── Props ────────────────────────────────────────────────────

interface VisualizationControlsProps {
  onPrev: () => void;                 // Callback: go to previous step
  onNext: () => void;                 // Callback: go to next step
  onPlayPause: () => void;            // Callback: toggle auto-play
  onReset: () => void;                // Callback: jump to step 0
  isPlaying: boolean;                 // Whether auto-play is active
  currentStep: number;                // 0-based index of the current step
  totalSteps: number;                 // Total number of steps in the visualization
  speed: number;                      // Interval duration in ms (lower = faster)
  onSpeedChange: (s: number) => void; // Callback: update playback speed
  description: string;                // Narration text for the current step
  compareMode: boolean;               // Whether Before/After comparison is active
  onToggleCompare: () => void;        // Callback: toggle compare mode
  shareCopied: boolean;               // Whether the share URL was just copied
  onShare: () => void;                // Callback: copy current step URL to clipboard
}

// ─── Component ────────────────────────────────────────────────

/**
 * VisualizationControls
 * Renders the full bottom control strip including:
 *  - Progress bar (percentage based on currentStep / totalSteps)
 *  - Step description narration
 *  - Reset, Prev, Play/Pause, Next buttons
 *  - Speed selector
 *  - Compare Mode toggle
 *  - Share (permalink) button
 *
 * @param props - See VisualizationControlsProps for full documentation
 */
export function VisualizationControls({
  onPrev, onNext, onPlayPause, onReset,
  isPlaying, currentStep, totalSteps,
  speed, onSpeedChange, description,
  compareMode, onToggleCompare,
  shareCopied, onShare,
}: VisualizationControlsProps) {

  /**
   * handleShare — delegates to the parent's onShare callback.
   * The parent handles the URL manipulation; we just trigger it.
   * Wrapped here for potential future local side-effects.
   */
  const handleShare = useCallback(() => {
    onShare(); // Bubble up to VisualizationLayout
    // Parent sets shareCopied=true; we show an inline icon change instead of toast
    // to avoid redundant feedback. If URL copy fails, parent will toast via sonner.
    toast.success('Link copied! Share this step with anyone.', { duration: 2500 });
  }, [onShare]);

  // ─── Derived values ─────────────────────────────────────────
  // Progress percentage for the progress bar fill
  const progressPct = ((currentStep + 1) / totalSteps) * 100;

  return (
    <div className="bg-[#161b22] border-t border-[#30363d] px-4 py-3 flex flex-col gap-3">

      {/* ── Progress bar ─────────────────────────────────── */}
      <div className="flex items-center gap-3">
        {/* Step counter text */}
        <span className="text-[#8b949e] text-xs whitespace-nowrap">
          Step {currentStep + 1} / {totalSteps}
        </span>
        {/* Track */}
        <div className="flex-1 bg-[#30363d] rounded-full h-1.5">
          {/* Fill — animated via CSS transition */}
          <div
            className="bg-[#00ACD7] h-1.5 rounded-full transition-all duration-300"
            style={{ width: `${progressPct}%` }}   /* Dynamic width from step progress */
          />
        </div>
      </div>

      {/* ── Step description ─────────────────────────────── */}
      <div className="min-h-[2rem] flex items-center">
        <p className="text-[#e6edf3] text-sm leading-relaxed">{description}</p>
      </div>

      {/* ── Controls row ─────────────────────────────────── */}
      <div className="flex items-center gap-2 flex-wrap">

        {/* Reset button */}
        <button
          onClick={onReset}
          aria-label="Reset to first step"
          title="Reset"
          className="p-2 rounded-md text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#30363d] transition-colors"
        >
          <RotateCcw size={16} />
        </button>

        {/* Previous button — disabled on first step */}
        <button
          onClick={onPrev}
          disabled={currentStep === 0}             /* Cannot go before step 0 */
          aria-label="Previous step"
          title="Previous step (←)"
          className="p-2 rounded-md text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#30363d] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <SkipBack size={16} />
        </button>

        {/* Play/Pause — primary CTA button */}
        <button
          onClick={onPlayPause}
          aria-label={isPlaying ? 'Pause' : 'Play'}
          title="Play / Pause (Space)"
          className="flex items-center gap-2 px-4 py-2 rounded-md bg-[#00ACD7] hover:bg-[#00ACD7]/80 text-white text-sm transition-colors"
        >
          {isPlaying ? <Pause size={16} /> : <Play size={16} />}  {/* Icon toggles with state */}
          {isPlaying ? 'Pause' : 'Play'}                          {/* Label toggles with state */}
        </button>

        {/* Next button — disabled on last step */}
        <button
          onClick={onNext}
          disabled={currentStep === totalSteps - 1}  /* Cannot go past last step */
          aria-label="Next step"
          title="Next step (→)"
          className="p-2 rounded-md text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#30363d] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <SkipForward size={16} />
        </button>

        {/* ── Separator ──────────────────────────────────── */}
        <div className="w-px h-5 bg-[#30363d] mx-1" aria-hidden="true" />

        {/* Compare Mode toggle */}
        <button
          onClick={onToggleCompare}
          aria-label={compareMode ? 'Exit compare mode' : 'Enter compare mode (Before/After)'}
          title={compareMode ? 'Exit compare mode' : 'Compare: Before & After'}
          disabled={totalSteps < 2}                /* Needs at least 2 steps to compare */
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs transition-all duration-200 ${compareMode
              ? 'bg-[#d2a8ff]/15 text-[#d2a8ff] border border-[#d2a8ff]/30' /* Active: purple */
              : 'text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#30363d]'    /* Inactive: grey */
            } disabled:opacity-30 disabled:cursor-not-allowed`}
        >
          <Columns2 size={14} />
          <span className="hidden sm:inline">Compare</span> {/* Hide text on tiny screens */}
        </button>

        {/* Share / Permalink button */}
        <button
          onClick={handleShare}
          aria-label="Copy shareable link to this step"
          title="Share this step"
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs transition-all duration-200 ${shareCopied
              ? 'text-[#3fb950] bg-[#3fb950]/10'                              /* Copied: green */
              : 'text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#30363d]'     /* Default: grey */
            }`}
        >
          {shareCopied ? <Check size={14} /> : <Link size={14} />} {/* Icon toggle */}
          <span className="hidden sm:inline">{shareCopied ? 'Copied!' : 'Share'}</span>
        </button>

        {/* ── Speed selector (pushed to the right) ─────── */}
        <div className="ml-auto flex items-center gap-2">
          <span className="text-[#8b949e] text-xs">Speed</span>
          <select
            value={speed}
            onChange={e => onSpeedChange(Number(e.target.value))}  /* Parse string → number */
            aria-label="Playback speed"
            className="bg-[#0d1117] border border-[#30363d] text-[#e6edf3] text-xs rounded px-2 py-1 cursor-pointer"
          >
            <option value={2000}>0.5×</option>  {/* Slowest */}
            <option value={1000}>1×</option>    {/* Default */}
            <option value={600}>1.5×</option>
            <option value={400}>2×</option>
            <option value={200}>4×</option>     {/* Fastest */}
          </select>
        </div>
      </div>
    </div>
  );
}
