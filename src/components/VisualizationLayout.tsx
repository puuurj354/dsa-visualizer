import type { ReactNode } from 'react';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { GoCode } from './GoCode';
import { VisualizationControls } from './VisualizationControls';


// Step interface defines the shape of a single step in any visualization.
export interface Step<T = unknown> {
  description: string;
  highlightLines: number[];
  state: T;
}

// Props for the VisualizationLayout component.
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
  // STATE MANAGEMENT
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1000);

  // Ref to hold the interval timer ID for cleanup and reference
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // DEFENSIVE CHECK: Ensure steps array exists and has at least one item before continuing.
  // If no steps are provided, we render an early fallback UI to prevent crashes.
  if (!steps || steps.length === 0) {
    return (
      <div className="flex items-center justify-center h-full bg-[#0d1117] text-[#8b949e]">
        <p>Error: No visualization steps provided.</p>
      </div>
    );
  }

  // Safe to access the current step now.
  const step = steps[currentStep];


  useEffect(() => {
    // If playing, set up the interval
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setCurrentStep((prev) => {
          // If we are at the last step, stop playing and return the same step
          if (prev >= steps.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          // Increment step safely
          return prev + 1;
        });
      }, speed);
    }

    // Cleanup function runs on unmount or when dependencies (isPlaying, speed) change
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying, speed, steps.length]);


  const handleReset = useCallback(() => {
    setIsPlaying(false); // Always pause when manually navigating
    setCurrentStep(0);
  }, []);

  const handlePrev = useCallback(() => {
    setIsPlaying(false);
    setCurrentStep((p) => Math.max(0, p - 1)); // Bound to 0 minimum
  }, []);

  const handleNext = useCallback(() => {
    setIsPlaying(false);
    setCurrentStep((p) => Math.min(steps.length - 1, p + 1)); // Bound to max length
  }, [steps.length]);

  const handlePlayPause = useCallback(() => {
    // Toggle play state. The useEffect will handle starting/stopping the actual timer.
    setIsPlaying((p) => !p);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore key events if the user is typing in an input or textarea
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.code) {
        case 'Space':
          e.preventDefault(); // Prevent page scrolling
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

    // Attach listener
    window.addEventListener('keydown', handleKeyDown);

    // Clean up listener
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePlayPause, handleNext, handlePrev]);

  return (
    <div className="flex flex-col h-full bg-[#0d1117]">
      {/* Header Bar */}
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

      {/* Main content: Wrapped in Resizable Panel Group */}
      <div className="flex-1 flex overflow-hidden">
        <PanelGroup direction="horizontal">

          {/* Panel 1: Code View */}
          <Panel defaultSize={42} minSize={20} className="border-r border-[#30363d] flex flex-col">
            <div className="px-3 py-2 border-b border-[#30363d] bg-[#161b22]">
              <span className="text-[#8b949e] text-xs uppercase tracking-wide">
                Go Code
              </span>
            </div>
            <div className="flex-1 overflow-auto p-3">
              <GoCode lines={codeLines} highlightLines={step.highlightLines} />
            </div>
          </Panel>

          {/* Draggable Handle between panels */}
          <PanelResizeHandle className="w-1.5 bg-[#30363d] hover:bg-[#58a6ff] transition-colors cursor-col-resize flex flex-col items-center justify-center">
            {/* Visual indicator for draggability */}
            <div className="w-0.5 h-8 bg-gray-500 rounded-full" />
          </PanelResizeHandle>

          {/* Panel 2: Live Visualization */}
          <Panel defaultSize={58} minSize={30} className="flex flex-col">
            <div className="px-3 py-2 border-b border-[#30363d] bg-[#161b22]">
              <span className="text-[#8b949e] text-xs uppercase tracking-wide">
                Visualization
              </span>
            </div>
            <div className="flex-1 overflow-auto p-4 flex items-start justify-center">
              {renderVisual(step.state, currentStep)}
            </div>
          </Panel>

        </PanelGroup>
      </div>

      {/* Footer Controls Component */}
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
        description={step?.description || ""} // Defensive fallback string
      />
    </div>
  );
}
