/**
 * EditableInputPanel.tsx
 * ─────────────────────────────────────────────────────────────
 * A flexible input bar that lets users supply custom data to
 * drive visualizations. Each visualization page can define its
 * own `EditableInputConfig` with a validator and step generator.
 *
 * Design goals:
 *  - Validation is synchronous and returns a human-readable error
 *  - Step generation is decoupled from the UI (passed as config)
 *  - Submission is blocked while input is invalid
 *  - The panel is fully keyboard-accessible (Enter to submit)
 * ─────────────────────────────────────────────────────────────
 */

import { useState, useCallback, type KeyboardEvent } from 'react';
import { Play, AlertCircle } from 'lucide-react';
import type { Step } from './VisualizationLayout';

// ─── Public Interface ──────────────────────────────────────────

/**
 * EditableInputConfig<T>
 * Configuration object supplied by each visualization page that
 * supports custom user input.  T must match the page's state type.
 *
 * @template T - The state type used in that page's Step<T>
 */
export interface EditableInputConfig<T> {
    /** Short label shown to the left of the input field */
    label: string;

    /** Placeholder text shown inside the empty input field */
    placeholder: string;

    /**
     * validate — synchronously checks the raw input string.
     * @param raw - The string currently in the input field
     * @returns   - A human-readable error string, or null if valid
     */
    validate: (raw: string) => string | null;

    /**
     * generateSteps — converts a valid input string into an array
     * of visualization steps.  Only called after validate passes.
     * @param raw - The validated input string
     * @returns   - Array of Step<T> to replace the current steps
     */
    generateSteps: (raw: string) => Step<T>[];
}

interface EditableInputPanelProps<T> {
    config: EditableInputConfig<T>;          // Per-page configuration
    defaultValue: string;                    // Initial value shown on mount
    onSubmit: (steps: Step<T>[]) => void;   // Called with new steps on valid submit
}

// ─── Component ────────────────────────────────────────────────

/**
 * EditableInputPanel
 * Renders an input row with real-time validation and a "Visualize" button.
 * Pressing Enter inside the input also triggers submission.
 *
 * @param config       - Validation and step-generation config from the page
 * @param defaultValue - Pre-filled input value (the page's original dataset)
 * @param onSubmit     - Callback receiving the new Step<T>[] on valid submit
 */
export function EditableInputPanel<T>({
    config,
    defaultValue,
    onSubmit,
}: EditableInputPanelProps<T>) {
    // The current raw string value the user has typed
    const [value, setValue] = useState(defaultValue);

    // Validation error message; null = currently valid
    const [error, setError] = useState<string | null>(null);

    /**
     * handleChange — updates raw value and re-validates on every keystroke.
     * Real-time validation gives immediate feedback without requiring submit.
     */
    const handleChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const raw = e.target.value;   // Get the new input string
            setValue(raw);                // Update controlled value
            setError(config.validate(raw)); // Re-validate and update error state
        },
        [config], // Re-memoize if config changes (e.g. page navigation)
    );

    /**
     * handleSubmit — runs final validation then calls onSubmit with new steps.
     * Defensively re-validates even though handleChange already validates,
     * because the user might submit an empty field without typing anything.
     */
    const handleSubmit = useCallback(() => {
        const validationError = config.validate(value); // Defensive re-validate
        if (validationError) {
            setError(validationError); // Show error and block submission
            return;
        }
        // Validation passed: generate steps and bubble them up to the parent
        const newSteps = config.generateSteps(value);
        onSubmit(newSteps); // Trigger step update and step-counter reset in parent
    }, [value, config, onSubmit]);

    /**
     * handleKeyDown — allows submitting via Enter key for accessibility.
     */
    const handleKeyDown = useCallback(
        (e: KeyboardEvent<HTMLInputElement>) => {
            if (e.key === 'Enter') handleSubmit(); // Enter key triggers submit
        },
        [handleSubmit],
    );

    const hasError = error !== null && error.length > 0; // Boolean shorthand for error state

    return (
        /* Container: subtle background strip below the page header */
        <div className="px-6 py-2.5 bg-[#0d1117] border-b border-[#30363d] flex flex-col gap-1.5">
            <div className="flex items-center gap-3">
                {/* Label */}
                <span className="text-[#8b949e] text-xs whitespace-nowrap shrink-0">
                    {config.label}
                </span>

                {/* Text input — controlled, real-time validated */}
                <input
                    type="text"
                    value={value}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    placeholder={config.placeholder}
                    aria-label={config.label}             /* Accessibility: readable label */
                    aria-invalid={hasError}               /* Accessibility: announce invalid */
                    aria-describedby={hasError ? 'editable-input-error' : undefined}
                    spellCheck={false}                    /* Disable browser spell-check for code */
                    className={`flex-1 bg-[#161b22] border rounded px-3 py-1.5 text-sm text-[#e6edf3] font-mono
            placeholder-[#8b949e] outline-none transition-colors duration-150 ${hasError
                            ? 'border-[#f85149]/60 focus:border-[#f85149]' /* Red border on error */
                            : 'border-[#30363d] focus:border-[#00ACD7]'    /* Blue border on valid focus */
                        }`}
                />

                {/* Submit button — disabled when input is invalid */}
                <button
                    onClick={handleSubmit}
                    disabled={hasError}                   /* Block submit when error exists */
                    aria-label="Visualize with custom input"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#00ACD7] hover:bg-[#00ACD7]/80
            disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs transition-colors shrink-0"
                >
                    <Play size={12} />
                    <span>Visualize</span>
                </button>
            </div>

            {/* Inline error message — only rendered when there is an error */}
            {hasError && (
                <div
                    id="editable-input-error"             /* Referenced by aria-describedby */
                    role="alert"                           /* a11y: live region for screen readers */
                    className="flex items-center gap-1.5 text-[#f85149] text-xs"
                >
                    <AlertCircle size={11} />
                    <span>{error}</span>
                </div>
            )}
        </div>
    );
}
