import { Play, Pause, SkipBack, SkipForward, RotateCcw } from 'lucide-react';

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
}

export function VisualizationControls({
  onPrev, onNext, onPlayPause, onReset,
  isPlaying, currentStep, totalSteps,
  speed, onSpeedChange, description,
}: VisualizationControlsProps) {
  return (
    <div className="bg-[#161b22] border-t border-[#30363d] px-4 py-3 flex flex-col gap-3">
      {/* Progress bar */}
      <div className="flex items-center gap-3">
        <span className="text-[#8b949e] text-xs whitespace-nowrap">
          Step {currentStep + 1} / {totalSteps}
        </span>
        <div className="flex-1 bg-[#30363d] rounded-full h-1.5">
          <div
            className="bg-[#00ACD7] h-1.5 rounded-full transition-all duration-300"
            style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      {/* Description */}
      <div className="min-h-[2rem] flex items-center">
        <p className="text-[#e6edf3] text-sm leading-relaxed">{description}</p>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3">
        <button
          onClick={onReset}
          className="p-2 rounded-md text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#30363d] transition-colors"
          title="Reset"
        >
          <RotateCcw size={16} />
        </button>
        <button
          onClick={onPrev}
          disabled={currentStep === 0}
          className="p-2 rounded-md text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#30363d] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          title="Previous step"
        >
          <SkipBack size={16} />
        </button>
        <button
          onClick={onPlayPause}
          className="flex items-center gap-2 px-4 py-2 rounded-md bg-[#00ACD7] hover:bg-[#00ACD7]/80 text-white text-sm transition-colors"
        >
          {isPlaying ? <Pause size={16} /> : <Play size={16} />}
          {isPlaying ? 'Pause' : 'Play'}
        </button>
        <button
          onClick={onNext}
          disabled={currentStep === totalSteps - 1}
          className="p-2 rounded-md text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#30363d] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          title="Next step"
        >
          <SkipForward size={16} />
        </button>

        {/* Speed */}
        <div className="ml-auto flex items-center gap-2">
          <span className="text-[#8b949e] text-xs">Speed</span>
          <select
            value={speed}
            onChange={e => onSpeedChange(Number(e.target.value))}
            className="bg-[#0d1117] border border-[#30363d] text-[#e6edf3] text-xs rounded px-2 py-1"
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
