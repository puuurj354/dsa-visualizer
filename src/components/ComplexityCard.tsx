/**
 * ComplexityCard.tsx
 * ─────────────────────────────────────────────────────────────
 * Displays a collapsible complexity information card in the
 * VisualizationLayout header. Shows Time (Best / Avg / Worst)
 * and Space complexity with colour-coded badges.
 *
 * Colour coding convention:
 *   Green  (#3fb950) → optimal   e.g. O(1), O(log n)
 *   Orange (#ffa657) → moderate  e.g. O(n log n)
 *   Red    (#f85149) → expensive e.g. O(n²)
 * ─────────────────────────────────────────────────────────────
 */

import { useState, useCallback } from 'react';
import { ChevronDown, ChevronUp, Gauge } from 'lucide-react';

// ─── Public Interface ──────────────────────────────────────────

/**
 * ComplexityInfo describes the asymptotic complexity of an algorithm or
 * data-structure operation set. Every field is a display string
 * (e.g. "O(n²)") so callers are in full control of formatting.
 */
export interface ComplexityInfo {
    time: {
        best: string;     // Best-case time complexity  (e.g. "O(n)")
        average: string;  // Average-case time          (e.g. "O(n²)")
        worst: string;    // Worst-case time            (e.g. "O(n²)")
    };
    space: string;      // Auxiliary space complexity (e.g. "O(1)")
    notes?: string;     // Optional human-readable footnote
}

interface ComplexityCardProps {
    complexity: ComplexityInfo; // Complexity data to display
}

// ─── Helper: colour-code a complexity string ──────────────────

/**
 * complexityColor
 * Maps a complexity expression to a Tailwind-compatible hex colour.
 * Uses a simple heuristic based on common notations.
 *
 * @param expr - Complexity string such as "O(n²)" or "O(log n)"
 * @returns    - A hex colour string
 */
function complexityColor(expr: string): string {
    const s = expr.toLowerCase(); // Normalise to lower-case for comparison
    if (s === 'o(1)') return '#3fb950';            // Constant  → green
    if (s.includes('log')) return '#3fb950';       // Log       → green
    if (s.includes('n log') || s === 'o(n log n)') return '#ffa657'; // n log n → orange
    if (s.includes('n²') || s.includes('n^2')) return '#f85149';     // Quadratic → red
    if (s.includes('2^') || s.includes('n!')) return '#f85149';       // Exponential/Factorial → red
    if (s === 'o(n)') return '#ffa657';            // Linear    → orange
    return '#e6edf3';                              // Unknown   → neutral
}

// ─── Component ────────────────────────────────────────────────

/**
 * ComplexityCard
 * A toggle-able badge that expands into a complexity table.
 * Starts collapsed so it does not consume header space by default.
 *
 * @param complexity - ComplexityInfo object with time and space fields
 */
export function ComplexityCard({ complexity }: ComplexityCardProps) {
    // Controls whether the detailed table is visible
    const [open, setOpen] = useState(false);

    /**
     * toggleOpen — flips the open/closed state.
     * Wrapped in useCallback to prevent recreation on each render.
     */
    const toggleOpen = useCallback(() => setOpen(prev => !prev), []);

    // ─── Row data for the time complexity table ─────────────────
    const rows = [
        { label: 'Best', value: complexity.time.best },
        { label: 'Average', value: complexity.time.average },
        { label: 'Worst', value: complexity.time.worst },
        { label: 'Space', value: complexity.space },
    ];

    return (
        <div className="relative">
            {/* ── Toggle button (always visible) ─────────────────── */}
            <button
                onClick={toggleOpen}
                aria-expanded={open}                          /* a11y: announce open state */
                aria-label="Toggle complexity information"
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border transition-all duration-200 ${open
                        ? 'bg-[#ffa657]/15 border-[#ffa657]/40 text-[#ffa657]' /* Active: orange */
                        : 'bg-[#161b22] border-[#30363d] text-[#8b949e] hover:border-[#ffa657]/40 hover:text-[#ffa657]'
                    }`}
            >
                <Gauge size={12} />             {/* Complexity meter icon */}
                <span>Complexity</span>
                {/* Chevron rotates to indicate open/closed */}
                {open ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
            </button>

            {/* ── Expanded detail panel ──────────────────────────── */}
            {open && (
                <div
                    className="absolute top-full right-0 mt-1.5 z-20 bg-[#161b22] border border-[#30363d] rounded-xl shadow-xl p-3 min-w-[220px]"
                    role="tooltip"                           /* semantic role for overlay */
                >
                    {/* Table: one row per complexity dimension */}
                    <table className="w-full text-xs border-collapse">
                        <thead>
                            <tr>
                                <th className="text-left text-[#8b949e] pb-1.5 font-normal pr-4">Case</th>
                                <th className="text-left text-[#8b949e] pb-1.5 font-normal">Complexity</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((row, i) => (
                                <tr key={row.label} className={i < rows.length - 1 ? 'border-b border-[#30363d]/50' : ''}>
                                    {/* Case label */}
                                    <td className="py-1.5 pr-4 text-[#8b949e]">{row.label}</td>
                                    {/* Complexity badge, colour-coded by value */}
                                    <td className="py-1.5">
                                        <span
                                            className="font-mono font-semibold"
                                            style={{ color: complexityColor(row.value) }} /* Dynamic colour */
                                        >
                                            {row.value}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Optional footnote below the table */}
                    {complexity.notes && (
                        <p className="mt-2 pt-2 border-t border-[#30363d] text-[10px] text-[#8b949e] leading-relaxed">
                            {complexity.notes}
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}
