

import {
  type ReactNode,
  useState, useEffect, useRef, useCallback, useMemo,
} from 'react';
import { Code2, BarChart2 } from 'lucide-react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { toast } from 'sonner';
import { GoCode } from './GoCode';
import { VisualizationControls } from './VisualizationControls';
import { ComplexityCard, type ComplexityInfo } from './ComplexityCard';
import { EditableInputPanel, type EditableInputConfig } from './EditableInputPanel';



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


function useIsMobile(): boolean {
  const query = '(max-width: 767px)';                            // Tailwind md = 768px
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(query).matches
  );
  useEffect(() => {
    const mql = window.matchMedia(query);                        // Create media query list
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mql.addEventListener('change', handler);                     // Listen for viewport changes
    return () => mql.removeEventListener('change', handler);     // Cleanup on unmount
  }, []);
  return isMobile;
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


  const isMobile = useIsMobile();

  const [activeTab, setActiveTab] = useState<'code' | 'visual'>('visual');


  const [dynamicSteps, setDynamicSteps] = useState<Step<T>[]>(initialSteps);
  const [currentStep, setCurrentStep] = useState<number>(() => {
    const fromURL = readStepFromURL();
    return fromURL ?? 0;
  });
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1000);
  const [compareMode, setCompareMode] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);


  const touchStartX = useRef<number | null>(null);               // X position on touch start
  const touchStartY = useRef<number | null>(null);               // Y position (for axis guard)


  if (!dynamicSteps || dynamicSteps.length === 0) {
    return (
      <div
        className="flex items-center justify-center h-full bg-[#0d1117] text-[#8b949e]"
        role="alert"
      >
        <p>Error: No visualization steps provided.</p>
      </div>
    );
  }


  useEffect(() => {
    const maxStep = dynamicSteps.length - 1;
    if (currentStep > maxStep) setCurrentStep(maxStep);
  }, [dynamicSteps.length]);


  useEffect(() => {
    writeStepToURL(currentStep);
  }, [currentStep]);


  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setCurrentStep(prev => {
          if (prev >= dynamicSteps.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, speed);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
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
      if (currentStep >= dynamicSteps.length - 1) setCurrentStep(dynamicSteps.length - 2);
      setIsPlaying(false);
      return true;
    });
  }, [currentStep, dynamicSteps.length]);


  const handleShare = useCallback(() => {
    navigator.clipboard.writeText(window.location.href).catch(() => {
      toast.error('Could not copy link. Please copy the URL manually.');
    });
    setShareCopied(true);
    setTimeout(() => setShareCopied(false), 2500);
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
      if (isMobile) return;                                       // Skip shortcuts on mobile
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      switch (e.code) {
        case 'Space': e.preventDefault(); handlePlayPause(); break;
        case 'ArrowRight': e.preventDefault(); handleNext(); break;
        case 'ArrowLeft': e.preventDefault(); handlePrev(); break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobile, handlePlayPause, handleNext, handlePrev]);


  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }, []);


  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    const deltaY = e.changedTouches[0].clientY - touchStartY.current;
    touchStartX.current = null;
    touchStartY.current = null;
    const isHorizontal = Math.abs(deltaX) > Math.abs(deltaY);
    const isMinDistance = Math.abs(deltaX) > 50;
    if (!isHorizontal || !isMinDistance) return;
    if (deltaX < 0) handleNext();
    else handlePrev();
  }, [handleNext, handlePrev]);

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

  const visualAriaLabel = `Step ${currentStep + 1} of ${dynamicSteps.length}: ${step.description}`;

  return (
    <div className="flex flex-col h-full bg-[#0d1117]">


      <div className="px-4 md:px-6 py-3 md:py-4 border-b border-[#30363d] bg-[#161b22] flex items-center gap-3 flex-wrap">
        {tag && (
          <span className={`text-xs px-2 py-0.5 rounded-full text-white shrink-0 ${tagColor}`}>
            {tag}
          </span>
        )}
        <div className="flex-1 min-w-0">
          <h1 className="text-[#e6edf3] text-base md:text-lg leading-tight">{title}</h1>
          <p className="text-[#8b949e] text-xs md:text-sm truncate">{description}</p>
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


      {isMobile && (
        <div
          className="flex border-b border-[#30363d] bg-[#161b22]"
          role="tablist"
          aria-label="Switch between code and visualization panels"
        >
          {/* Code tab */}
          <button
            role="tab"
            aria-selected={activeTab === 'code'}
            aria-controls="panel-code"
            id="tab-code"
            onClick={() => setActiveTab('code')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs transition-colors
              border-b-2 ${activeTab === 'code'
                ? 'border-[#58a6ff] text-[#58a6ff]'       // Active: blue
                : 'border-transparent text-[#8b949e] hover:text-[#e6edf3]'
              }`}
          >
            <Code2 size={14} aria-hidden="true" />
            Go Code
          </button>

          {/* Visual tab */}
          <button
            role="tab"
            aria-selected={activeTab === 'visual'}
            aria-controls="panel-visual"
            id="tab-visual"
            onClick={() => setActiveTab('visual')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs transition-colors
              border-b-2 ${activeTab === 'visual'
                ? 'border-[#00ACD7] text-[#00ACD7]'        // Active: cyan
                : 'border-transparent text-[#8b949e] hover:text-[#e6edf3]'
              }`}
          >
            <BarChart2 size={14} aria-hidden="true" />
            Visualization
          </button>
        </div>
      )}


      <div className="flex-1 flex overflow-hidden">


        {isMobile ? (
          <>
            {/* Code panel — shown when code tab is active */}
            <div
              id="panel-code"
              role="tabpanel"
              aria-labelledby="tab-code"
              hidden={activeTab !== 'code'}
              className="flex-1 overflow-auto p-3"
            >
              <GoCode lines={codeLines} highlightLines={step.highlightLines} />
            </div>


            <section
              id="panel-visual"
              role="tabpanel"
              aria-labelledby="tab-visual"
              aria-live="polite"
              aria-atomic="true"
              aria-label={visualAriaLabel}
              hidden={activeTab !== 'visual'}
              className="flex-1 overflow-auto p-4 flex items-start justify-center"
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              {currentVisual}
            </section>
          </>
        ) : (

          <PanelGroup direction="horizontal">

            <Panel defaultSize={42} minSize={20} className="border-r border-[#30363d] flex flex-col">
              <div className="px-3 py-2 border-b border-[#30363d] bg-[#161b22]">
                <span className="text-[#8b949e] text-xs uppercase tracking-wide">Go Code</span>
              </div>
              <div className="flex-1 overflow-auto p-3">
                <GoCode lines={codeLines} highlightLines={step.highlightLines} />
              </div>
            </Panel>

            <PanelResizeHandle
              className="w-1.5 bg-[#30363d] hover:bg-[#58a6ff] transition-colors cursor-col-resize flex flex-col items-center justify-center"
              aria-label="Drag to resize panels"
            >
              <div className="w-0.5 h-8 bg-gray-500 rounded-full" aria-hidden="true" />
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
                      <span className="w-2 h-2 rounded-full bg-[#8b949e]" aria-hidden="true" />
                      <span className="text-[#8b949e] text-xs">Step {currentStep + 1} — Before</span>
                    </div>
                    <section
                      aria-label={`Before: ${step.description}`}
                      aria-live="polite"
                      className="flex-1 overflow-auto p-4 flex items-start justify-center"
                    >
                      {currentVisual}
                    </section>
                  </div>
                  <div className="flex-1 flex flex-col min-w-0">
                    <div className="px-3 py-1.5 bg-[#0d1117] border-b border-[#30363d] flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#00ACD7]" aria-hidden="true" />
                      <span className="text-[#00ACD7] text-xs">Step {currentStep + 2} — After</span>
                    </div>
                    <section
                      aria-label={`After: ${nextStep.description}`}
                      className="flex-1 overflow-auto p-4 flex items-start justify-center"
                    >
                      {nextVisual}
                    </section>
                  </div>
                </div>
              ) : (
                <section
                  aria-live="polite"
                  aria-atomic="true"
                  aria-label={visualAriaLabel}
                  className="flex-1 overflow-auto p-4 flex items-start justify-center"
                >
                  {currentVisual}
                </section>
              )}
            </Panel>

          </PanelGroup>
        )}
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
        isMobile={isMobile}
      />
    </div>
  );
}
