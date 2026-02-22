

import { Suspense } from 'react';
import { RouterProvider } from 'react-router';
import { router } from './routes';


function PageLoadingFallback() {
  return (
    <div
      className="flex h-screen w-full bg-[#0d1117] animate-pulse"
      role="status"
      aria-label="Loading page…"
    >
      <div className="w-52 shrink-0 h-full bg-[#161b22] border-r border-[#30363d]" />
      <div className="flex-1 flex flex-col p-8 gap-4">
        <div className="h-7 w-64 rounded-md bg-[#30363d]" />
        <div className="h-4 w-96 rounded-md bg-[#21262d]" />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Suspense fallback={<PageLoadingFallback />}>
      <RouterProvider router={router} />
    </Suspense>
  );
}
