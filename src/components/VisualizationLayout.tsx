import type { ReactNode } from 'react';
import { useState, useEffect, useRef } from 'react';
import { GoCode } from './GoCode';
import { VisualizationControls } from './VisualizationControls';

export interface Step<T = unknown> {
  description: string;
  highlightLines: number[];
  state: T;
}

interface VisualizationLayoutProps<T> {
  title: string;
  description: string;
  tag?: string;
  tagColor?: string;
  steps: Step<T>[];
  renderVisual: (state: T, step: number) => ReactNode;
  codeLines: string[];
}

export function VisualizationLayout<T>({
  title,
  description,
  tag,
  tagColor = "bg-[#00ACD7]",
  steps,
  renderVisual,
  codeLines,
}: VisualizationLayoutProps<T>) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1000);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const step = steps[currentStep];

  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setCurrentStep((prev) => {
          if (prev >= steps.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, speed);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying, speed, steps.length]);

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentStep(0);
  };
  const handlePrev = () => {
    setIsPlaying(false);
    setCurrentStep((p) => Math.max(0, p - 1));
  };
  const handleNext = () => {
    setIsPlaying(false);
    setCurrentStep((p) => Math.min(steps.length - 1, p + 1));
  };
  const handlePlayPause = () => setIsPlaying((p) => !p);

  return (
    <div className="flex flex-col h-full bg-[#0d1117]">
      {/* Header */}
      <div className="px-6 py-4 border-b border-[#30363d] bg-[#161b22] flex items-center gap-3">
        {tag && (
          <span
            className={`text-xs px-2 py-0.5 rounded-full text-white ${tagColor}`}
          >
            {tag}
          </span>
        )}
        <div>
          <h1 className="text-[#e6edf3] text-lg">{title}</h1>
          <p className="text-[#8b949e] text-sm">{description}</p>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Code panel */}
        <div className="w-[42%] border-r border-[#30363d] flex flex-col overflow-hidden">
          <div className="px-3 py-2 border-b border-[#30363d] bg-[#161b22]">
            <span className="text-[#8b949e] text-xs uppercase tracking-wide">
              Go Code
            </span>
          </div>
          <div className="flex-1 overflow-auto p-3">
            <GoCode lines={codeLines} highlightLines={step.highlightLines} />
          </div>
        </div>

        {/* Visual panel */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="px-3 py-2 border-b border-[#30363d] bg-[#161b22]">
            <span className="text-[#8b949e] text-xs uppercase tracking-wide">
              Visualization
            </span>
          </div>
          <div className="flex-1 overflow-auto p-4 flex items-start justify-center">
            {renderVisual(step.state, currentStep)}
          </div>
        </div>
      </div>

      {/* Controls */}
      <VisualizationControls
        onPrev={handlePrev}
        onNext={handleNext}
        onPlayPause={handlePlayPause}
        onReset={handleReset}
        isPlaying={isPlaying}
        currentStep={currentStep}
        totalSteps={steps.length}
        speed={speed}
        onSpeedChange={setSpeed}
        description={step.description}
      />
    </div>
  );
}
