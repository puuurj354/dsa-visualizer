import React, { useState, useCallback } from 'react';
import { Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

const GO_KEYWORDS = new Set([
  'var', 'const', 'func', 'package', 'import', 'type', 'struct', 'interface',
  'if', 'else', 'for', 'range', 'switch', 'case', 'default', 'break', 'continue',
  'return', 'go', 'chan', 'select', 'defer', 'nil', 'true', 'false', 'map', 'fallthrough',
]);

const GO_TYPES = new Set([
  'int', 'int8', 'int16', 'int32', 'int64', 'uint', 'uint8', 'uint16', 'uint32', 'uint64',
  'float32', 'float64', 'complex64', 'complex128', 'bool', 'string', 'byte', 'rune', 'error',
]);

const GO_BUILTINS = new Set([
  'len', 'cap', 'append', 'copy', 'delete', 'close', 'print', 'println', 'panic', 'recover',
  'make', 'new', 'real', 'imag', 'complex',
]);

function tokenizeLine(line: string): React.ReactNode[] {
  const result: React.ReactNode[] = [];
  let i = 0;
  let k = 0;

  while (i < line.length) {
    // Comment
    if (line[i] === '/' && line[i + 1] === '/') {
      result.push(<span key={k++} className="text-[#8b949e] italic">{line.slice(i)}</span>);
      break;
    }
    // Double-quote string
    if (line[i] === '"') {
      let j = i + 1;
      while (j < line.length && line[j] !== '"') { if (line[j] === '\\') j++; j++; }
      j++;
      result.push(<span key={k++} className="text-[#a5d6ff]">{line.slice(i, j)}</span>);
      i = j; continue;
    }
    // Backtick string
    if (line[i] === '`') {
      let j = i + 1;
      while (j < line.length && line[j] !== '`') j++;
      j++;
      result.push(<span key={k++} className="text-[#a5d6ff]">{line.slice(i, j)}</span>);
      i = j; continue;
    }
    // Rune literal
    if (line[i] === "'") {
      let j = i + 1;
      while (j < line.length && line[j] !== "'") { if (line[j] === '\\') j++; j++; }
      j++;
      result.push(<span key={k++} className="text-[#a5d6ff]">{line.slice(i, j)}</span>);
      i = j; continue;
    }
    // Number
    if (/[0-9]/.test(line[i])) {
      let j = i;
      while (j < line.length && /[0-9._xXaAbBcCdDeEfF]/.test(line[j])) j++;
      result.push(<span key={k++} className="text-[#ffa657]">{line.slice(i, j)}</span>);
      i = j; continue;
    }
    // Identifier or keyword
    if (/[a-zA-Z_]/.test(line[i])) {
      let j = i;
      while (j < line.length && /[a-zA-Z0-9_]/.test(line[j])) j++;
      const word = line.slice(i, j);
      if (GO_KEYWORDS.has(word)) {
        result.push(<span key={k++} className="text-[#ff7b72] font-medium">{word}</span>);
      } else if (GO_TYPES.has(word)) {
        result.push(<span key={k++} className="text-[#79c0ff]">{word}</span>);
      } else if (GO_BUILTINS.has(word)) {
        result.push(<span key={k++} className="text-[#ffa657]">{word}</span>);
      } else {
        // Check if exported (starts uppercase) or function call
        const rest = line.slice(j).trimStart();
        if (/^[A-Z]/.test(word)) {
          result.push(<span key={k++} className="text-[#d2a8ff]">{word}</span>);
        } else if (rest[0] === '(') {
          result.push(<span key={k++} className="text-[#d2a8ff]">{word}</span>);
        } else {
          result.push(<span key={k++} className="text-[#e6edf3]">{word}</span>);
        }
      }
      i = j; continue;
    }
    // Channel arrow and other operators
    if (line[i] === '<' && line[i + 1] === '-') {
      result.push(<span key={k++} className="text-[#ff7b72]">{'<-'}</span>);
      i += 2; continue;
    }
    if (line[i] === ':' && line[i + 1] === '=') {
      result.push(<span key={k++} className="text-[#ff7b72]">{':='}</span>);
      i += 2; continue;
    }
    if (['+', '-', '*', '/', '%', '=', '!', '<', '>', '&', '|', '^', '~'].includes(line[i])) {
      result.push(<span key={k++} className="text-[#c9d1d9]">{line[i]}</span>);
      i++; continue;
    }
    result.push(<span key={k++} className="text-[#e6edf3]">{line[i]}</span>);
    i++;
  }
  return result;
}

interface GoCodeProps {
  lines: string[];         // Array of source code lines to render
  highlightLines?: number[]; // 1-based line numbers to highlight
  className?: string;      // Optional extra CSS classes for the outer container
}

/**
 * GoCode — syntax-highlighted Go source code viewer with copy-to-clipboard.
 *
 * @param lines          - Array of code lines to display
 * @param highlightLines - 1-based line numbers that should be highlighted (active step)
 * @param className      - Optional extra Tailwind classes for the container
 */
export function GoCode({ lines, highlightLines = [], className = '' }: GoCodeProps) {
  // Tracks whether the copy action just succeeded (for 2s feedback animation)
  const [copied, setCopied] = useState(false);

  /**
   * handleCopy — copies all code lines to the clipboard.
   * Strategy:
   *   1. Try the modern async Clipboard API (works in secure contexts)
   *   2. Fall back to the legacy `document.execCommand('copy')` via a textarea
   *   3. If both fail, show a sonner error toast so the user knows
   */
  const handleCopy = useCallback(async () => {
    const text = lines.join('\n'); // Join all lines into a single string

    try {
      // --- Primary path: async Clipboard API ---
      await navigator.clipboard.writeText(text); // Write to system clipboard
      setCopied(true);                            // Trigger the "Copied!" feedback state
      setTimeout(() => setCopied(false), 2000);   // Reset back after 2 seconds
    } catch {
      // --- Fallback path: legacy execCommand ---
      try {
        const textarea = document.createElement('textarea'); // Create a hidden textarea
        textarea.value = text;                               // Populate it with the code
        textarea.style.position = 'fixed';                   // Prevent viewport scroll jump
        textarea.style.opacity = '0';                        // Make it invisible
        document.body.appendChild(textarea);                 // Must be in DOM for execCommand
        textarea.focus();
        textarea.select();                                   // Select all text
        document.execCommand('copy');                        // Trigger the system copy command
        document.body.removeChild(textarea);                 // Clean up DOM
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        // --- Both methods failed: notify user via sonner toast ---
        toast.error('Copy failed. Please select the code manually.');
      }
    }
  }, [lines]); // Re-memoize only when lines array changes

  return (
    <div className={`bg-[#0d1117] rounded-lg border border-[#30363d] overflow-auto ${className}`}>
      {/* Header bar: traffic-light dots, filename, and copy button */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-[#30363d] bg-[#161b22]">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-[#f85149]" /> {/* macOS-style red dot */}
          <div className="w-3 h-3 rounded-full bg-[#d29922]" /> {/* macOS-style yellow dot */}
          <div className="w-3 h-3 rounded-full bg-[#3fb950]" /> {/* macOS-style green dot */}
        </div>
        <span className="text-[#8b949e] text-xs ml-2 flex-1">main.go</span>

        {/* Copy button — shows Check icon + "Copied!" text for 2s after success */}
        <button
          onClick={handleCopy}                /* Trigger the clipboard copy logic */
          aria-label="Copy code to clipboard"  /* Accessibility label for screen readers */
          title={copied ? 'Copied!' : 'Copy code'}
          className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-all duration-200 ${copied
              ? 'text-[#3fb950] bg-[#3fb950]/10'  /* Green success state */
              : 'text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#30363d]' /* Default hover state */
            }`}
        >
          {/* Toggle between Copy and Check icons based on copied state */}
          {copied ? <Check size={13} /> : <Copy size={13} />}
          <span>{copied ? 'Copied!' : 'Copy'}</span>
        </button>
      </div>
      <pre className="text-sm font-mono p-0 m-0 leading-6">
        {lines.map((line, idx) => {
          const lineNum = idx + 1;
          const isHighlighted = highlightLines.includes(lineNum);
          return (
            <div
              key={idx}
              className={`flex transition-colors duration-200 ${isHighlighted ? 'bg-[#00ACD7]/15 border-l-2 border-[#00ACD7]' : 'border-l-2 border-transparent'}`}
            >
              <span className="select-none text-[#8b949e] text-right px-3 py-0 min-w-[3rem] text-xs leading-6">
                {lineNum}
              </span>
              <span className="px-3 py-0 flex-1 leading-6 whitespace-pre">
                {tokenizeLine(line)}
              </span>
            </div>
          );
        })}
      </pre>
    </div>
  );
}
