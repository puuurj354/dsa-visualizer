import React from 'react';

const GO_KEYWORDS = new Set([
  'var','const','func','package','import','type','struct','interface',
  'if','else','for','range','switch','case','default','break','continue',
  'return','go','chan','select','defer','nil','true','false','map','fallthrough',
]);

const GO_TYPES = new Set([
  'int','int8','int16','int32','int64','uint','uint8','uint16','uint32','uint64',
  'float32','float64','complex64','complex128','bool','string','byte','rune','error',
]);

const GO_BUILTINS = new Set([
  'len','cap','append','copy','delete','close','print','println','panic','recover',
  'make','new','real','imag','complex',
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
    if (line[i] === '<' && line[i+1] === '-') {
      result.push(<span key={k++} className="text-[#ff7b72]">{'<-'}</span>);
      i += 2; continue;
    }
    if (line[i] === ':' && line[i+1] === '=') {
      result.push(<span key={k++} className="text-[#ff7b72]">{':='}</span>);
      i += 2; continue;
    }
    if (['+','-','*','/','%','=','!','<','>','&','|','^','~'].includes(line[i])) {
      result.push(<span key={k++} className="text-[#c9d1d9]">{line[i]}</span>);
      i++; continue;
    }
    result.push(<span key={k++} className="text-[#e6edf3]">{line[i]}</span>);
    i++;
  }
  return result;
}

interface GoCodeProps {
  lines: string[];
  highlightLines?: number[]; // 1-based
  className?: string;
}

export function GoCode({ lines, highlightLines = [], className = '' }: GoCodeProps) {
  return (
    <div className={`bg-[#0d1117] rounded-lg border border-[#30363d] overflow-auto ${className}`}>
      <div className="flex items-center gap-2 px-4 py-2 border-b border-[#30363d] bg-[#161b22]">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-[#f85149]" />
          <div className="w-3 h-3 rounded-full bg-[#d29922]" />
          <div className="w-3 h-3 rounded-full bg-[#3fb950]" />
        </div>
        <span className="text-[#8b949e] text-xs ml-2">main.go</span>
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
