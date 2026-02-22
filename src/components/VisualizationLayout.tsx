

import { type ReactNode, useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { toast } from 'sonner';
import { GoCode } from './GoCode';
import { VisualizationControls } from './VisualizationControls';
import { ComplexityCard, type ComplexityInfo } from './ComplexityCard';
import { EditableInputPanel, type EditableInputConfig } from './EditableInputPanel';



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


interface VisualizationLayoutProps<T> {
  title: string;
  description: string;
  tag?: string;
  tagColor?: string;
  steps: Step<T>[];
  renderVisual: (state: T, step: number) => ReactNode;
  codeLines: string[];


  complexity?: ComplexityInfo;

  editableInput?: EditableInputConfig<T>;
  editableDefaultValue?: string;
}

function readStepFromURL(): number | null {
  const params = new URLSearchParams(window.location.search);
  const raw = params.get('step');
  if (raw === null) return null;
  const n = parseInt(raw, 10);
  return Number.isFinite(n) ? n : null;
}


function writeStepToURL(step: number): void {
  const url = new URL(window.location.href);
  url.searchParams.set('step', String(step));
  window.history.replaceState(null, '', url);
}




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

  const [dynamicSteps, setDynamicSteps] = useState<Step<T>[]>(initialSteps);

  const [currentStep, setCurrentStep] = useState<number>(() => {
    const fromURL = readStepFromURL();
    if (fromURL === null) return 0;

    return fromURL;
  });
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1000);

  const [compareMode, setCompareMode] = useState(false);

  const [shareCopied, setShareCopied] = useState(false);


  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  if (!dynamicSteps || dynamicSteps.length === 0) {
    return (
      <div className="flex items-center justify-center h-full bg-[#0d1117] text-[#8b949e]">
        <p>Error: No visualization steps provided.</p>
      </div>
    );
  }


  useEffect(() => {
    const maxStep = dynamicSteps.length - 1;
    if (currentStep > maxStep) {
      setCurrentStep(maxStep);
    }

  }, [dynamicSteps.length]);


  useEffect(() => {
    writeStepToURL(currentStep);
  }, [currentStep]);


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


  const handleReset = useCallback(() => {
    setIsPlaying(false);
    setCurrentStep(0);
  }, []);


  const handlePrev = useCallback(() => {
    setIsPlaying(false);
    setCurrentStep(p => Math.max(0, p - 1));
  }, []);


  const handleNext = useCallback(() => {
    setIsPlaying(false);
    setCurrentStep(p => Math.min(dynamicSteps.length - 1, p + 1));
  }, [dynamicSteps.length]);


  const handlePlayPause = useCallback(() => {
    setIsPlaying(p => !p);
  }, []);


  const handleToggleCompare = useCallback(() => {
    setCompareMode(prev => {
      if (prev) return false;
      if (currentStep >= dynamicSteps.length - 1) {
        setCurrentStep(dynamicSteps.length - 2);
      }
      setIsPlaying(false);
      return true;
    });
  }, [currentStep, dynamicSteps.length]);


  const handleShare = useCallback(() => {
    const shareURL = window.location.href;
    navigator.clipboard.writeText(shareURL)
      .catch(() => {

        toast.error('Could not copy link. Please copy the URL manually.');
      });
    setShareCopied(true);                          // Trigger copied state feedback
    setTimeout(() => setShareCopied(false), 2500); // Reset after 2.5s
  }, []);


  const handleEditableSubmit = useCallback((newSteps: Step<T>[]) => {
    if (!newSteps || newSteps.length === 0) return;
    setDynamicSteps(newSteps);
    setCurrentStep(0);
    setIsPlaying(false);
    setCompareMode(false);
  }, []);


  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      switch (e.code) {
        case 'Space':
          e.preventDefault();
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
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePlayPause, handleNext, handlePrev]);


  const step = dynamicSteps[currentStep];
  const nextStep = dynamicSteps[currentStep + 1] ?? step;
  const currentVisual = useMemo(
    () => renderVisual(step.state, currentStep),

    [step.state, currentStep],
  );

  const nextVisual = useMemo(
    () => compareMode ? renderVisual(nextStep.state, currentStep + 1) : null,

    [nextStep.state, currentStep, compareMode],
  );

  return (
    <div className="flex flex-col h-full bg-[#0d1117]">

      <div className="px-6 py-4 border-b border-[#30363d] bg-[#161b22] flex items-center gap-3 flex-wrap">
        {tag && (
          <span className={`text-xs px-2 py-0.5 rounded-full text-white shrink-0 ${tagColor}`}>
            {tag}
          </span>
        )}
        <div className="flex-1 min-w-0">
          <h1 className="text-[#e6edf3] text-lg leading-tight">{title}</h1>
          <p className="text-[#8b949e] text-sm truncate">{description}</p>
        </div>
        {complexity && <ComplexityCard complexity={complexity} />}
      </div>

      {editableInput && (
        <EditableInputPanel
          config={editableInput}
          defaultValue={editableDefaultValue}
          onSubmit={handleEditableSubmit}
        />
      )}

      <div className="flex-1 flex overflow-hidden">
        <PanelGroup direction="horizontal">

          <Panel defaultSize={42} minSize={20} className="border-r border-[#30363d] flex flex-col">
            <div className="px-3 py-2 border-b border-[#30363d] bg-[#161b22]">
              <span className="text-[#8b949e] text-xs uppercase tracking-wide">Go Code</span>
            </div>
            <div className="flex-1 overflow-auto p-3">
              <GoCode lines={codeLines} highlightLines={step.highlightLines} />
            </div>
          </Panel>

          <PanelResizeHandle className="w-1.5 bg-[#30363d] hover:bg-[#58a6ff] transition-colors cursor-col-resize flex flex-col items-center justify-center">
            <div className="w-0.5 h-8 bg-gray-500 rounded-full" />
          </PanelResizeHandle>
          <Panel defaultSize={58} minSize={30} className="flex flex-col">
            <div className="px-3 py-2 border-b border-[#30363d] bg-[#161b22] flex items-center justify-between">
              <span className="text-[#8b949e] text-xs uppercase tracking-wide">
                {compareMode ? 'Comparison — Before & After' : 'Visualization'}
              </span>
              {compareMode && (
                <span className="text-[10px] bg-[#d2a8ff]/10 text-[#d2a8ff] border border-[#d2a8ff]/30 px-2 py-0.5 rounded-full">
                  Compare Mode
                </span>
              )}
            </div>

            {compareMode ? (
              <div className="flex-1 overflow-auto flex divide-x divide-[#30363d]">
                <div className="flex-1 flex flex-col min-w-0">
                  <div className="px-3 py-1.5 bg-[#0d1117] border-b border-[#30363d] flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#8b949e]" />
                    <span className="text-[#8b949e] text-xs">Step {currentStep + 1} — Before</span>
                  </div>
                  <div className="flex-1 overflow-auto p-4 flex items-start justify-center">
                    {currentVisual}
                  </div>
                </div>
                <div className="flex-1 flex flex-col min-w-0">
                  <div className="px-3 py-1.5 bg-[#0d1117] border-b border-[#30363d] flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#00ACD7]" />
                    <span className="text-[#00ACD7] text-xs">Step {currentStep + 2} — After</span>
                  </div>
                  <div className="flex-1 overflow-auto p-4 flex items-start justify-center">
                    {nextVisual}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 overflow-auto p-4 flex items-start justify-center">
                {currentVisual}
              </div>
            )}
          </Panel>

        </PanelGroup>
      </div>

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
        description={step?.description ?? ''}
        compareMode={compareMode}
        onToggleCompare={handleToggleCompare}
        shareCopied={shareCopied}
        onShare={handleShare}
      />
    </div>
  );
}
