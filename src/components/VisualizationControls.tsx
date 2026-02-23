

import { useCallback } from 'react';
import {
  Play, Pause, SkipBack, SkipForward, RotateCcw,
  Columns2, Link, Check,
} from 'lucide-react';
import { toast } from 'sonner';

interface VisualizationControlsProps {
  onPrev: () => void;
  onNext: () => void;
  onPlayPause: () => void;
  onReset: () => void;
  isPlaying: boolean;
  currentStep: number;
  totalSteps: number;
  speed: number;
  onSpeedChange: (s: number) => void;
  description: string;
  compareMode: boolean;
  onToggleCompare: () => void;
  shareCopied: boolean;
  onShare: () => void;
  isMobile?: boolean; // Hides compare mode on mobile (not relevant for tab layout)
}

export function VisualizationControls({
  onPrev, onNext, onPlayPause, onReset,
  isPlaying, currentStep, totalSteps,
  speed, onSpeedChange, description,
  compareMode, onToggleCompare,
  shareCopied, onShare,
  isMobile = false,
}: VisualizationControlsProps) {

  const handleShare = useCallback(() => {
    onShare();
    toast.success('Link copied! Share this step with anyone.', { duration: 2500 });
  }, [onShare]);

  // Progress percentage for the visual fill bar
  const progressPct = ((currentStep + 1) / totalSteps) * 100;

  return (
    <div className="bg-[#161b22] border-t border-[#30363d] px-4 py-3 flex flex-col gap-3">

      <div className="flex items-center gap-3">
        <span className="text-[#8b949e] text-xs whitespace-nowrap" aria-hidden="true">
          Step {currentStep + 1} / {totalSteps}
        </span>

        <div
          className="flex-1 bg-[#30363d] rounded-full h-1.5"
          role="progressbar"
          aria-valuenow={currentStep + 1}
          aria-valuemin={1}
          aria-valuemax={totalSteps}
          aria-label={`Visualization progress: step ${currentStep + 1} of ${totalSteps}`}
        >
          <div
            className="bg-[#00ACD7] h-1.5 rounded-full transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>


      <div className="min-h-[2rem] flex items-center">
        <p
          className="text-[#e6edf3] text-sm leading-relaxed"
          aria-live="polite"
          aria-atomic="true"
        >
          {description}
        </p>
      </div>


      <div className="flex items-center gap-2 flex-wrap">

        <button
          onClick={onReset}
          aria-label="Reset to first step"
          title="Reset"
          className="p-2 rounded-md text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#30363d] transition-colors"
        >
          <RotateCcw size={16} aria-hidden="true" />
        </button>


        <button
          onClick={onPrev}
          disabled={currentStep === 0}
          aria-label="Go to previous step"
          title="Previous step (←)"
          className="p-2 rounded-md text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#30363d] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <SkipBack size={16} aria-hidden="true" />
        </button>


        <button
          onClick={onPlayPause}
          aria-label={isPlaying ? 'Pause auto-play' : 'Start auto-play'}
          aria-pressed={isPlaying}
          title="Play / Pause (Space)"
          className="flex items-center gap-2 px-4 py-2 rounded-md bg-[#00ACD7] hover:bg-[#00ACD7]/80 text-white text-sm transition-colors"
        >
          {isPlaying ? <Pause size={16} aria-hidden="true" /> : <Play size={16} aria-hidden="true" />}
          {isPlaying ? 'Pause' : 'Play'}
        </button>


        <button
          onClick={onNext}
          disabled={currentStep === totalSteps - 1}
          aria-label="Go to next step"
          title="Next step (→)"
          className="p-2 rounded-md text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#30363d] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <SkipForward size={16} aria-hidden="true" />
        </button>


        <div className="w-px h-5 bg-[#30363d] mx-1" aria-hidden="true" />


        {!isMobile && (
          <button
            onClick={onToggleCompare}
            aria-label={compareMode ? 'Exit compare mode' : 'Enter Before/After compare mode'}
            aria-pressed={compareMode}
            title={compareMode ? 'Exit compare mode' : 'Compare: Before & After'}
            disabled={totalSteps < 2}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs transition-all duration-200 ${compareMode
              ? 'bg-[#d2a8ff]/15 text-[#d2a8ff] border border-[#d2a8ff]/30'
              : 'text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#30363d]'
              } disabled:opacity-30 disabled:cursor-not-allowed`}
          >
            <Columns2 size={14} aria-hidden="true" />
            <span className="hidden sm:inline">Compare</span>
          </button>
        )}


        <button
          onClick={handleShare}
          aria-label={shareCopied ? 'Link copied to clipboard' : 'Copy shareable link to this step'}
          title="Share this step"
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs transition-all duration-200 ${shareCopied
            ? 'text-[#3fb950] bg-[#3fb950]/10'
            : 'text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#30363d]'
            }`}
        >
          {shareCopied ? <Check size={14} aria-hidden="true" /> : <Link size={14} aria-hidden="true" />}
          <span className="hidden sm:inline">{shareCopied ? 'Copied!' : 'Share'}</span>
        </button>


        <div className="ml-auto flex items-center gap-2">
          <span className="text-[#8b949e] text-xs" id="speed-label">Speed</span>
          <select
            value={speed}
            onChange={e => onSpeedChange(Number(e.target.value))}
            aria-labelledby="speed-label"
            className="bg-[#0d1117] border border-[#30363d] text-[#e6edf3] text-xs rounded px-2 py-1 cursor-pointer"
          >
            <option value={2000}>0.5×</option>
            <option value={1000}>1×</option>
            <option value={600}>1.5×</option>
            <option value={400}>2×</option>
            <option value={200}>4×</option>
          </select>
        </div>
      </div>
    </div>
  );
}
