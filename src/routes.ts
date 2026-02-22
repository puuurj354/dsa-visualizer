

import { lazy } from 'react';
import { createBrowserRouter } from 'react-router';
import { Layout } from './components/Layout';


const Home = lazy(() =>
  import('./pages/Home').then(m => ({ default: m.Home }))
);
const Variables = lazy(() =>
  import('./pages/basics/Variables').then(m => ({ default: m.Variables }))
);
const ForLoop = lazy(() =>
  import('./pages/basics/ForLoop').then(m => ({ default: m.ForLoop }))
);
const IfElse = lazy(() =>
  import('./pages/basics/IfElse').then(m => ({ default: m.IfElse }))
);
const Functions = lazy(() =>
  import('./pages/basics/Functions').then(m => ({ default: m.Functions }))
);
const Pointers = lazy(() =>
  import('./pages/basics/Pointers').then(m => ({ default: m.Pointers }))
);
const DeferPanicRecover = lazy(() =>
  import('./pages/basics/DeferPanicRecover').then(m => ({ default: m.DeferPanicRecover }))
);
const Interfaces = lazy(() =>
  import('./pages/basics/Interfaces').then(m => ({ default: m.Interfaces }))
);
const ErrorWrapping = lazy(() =>
  import('./pages/basics/ErrorWrapping').then(m => ({ default: m.ErrorWrapping }))
);


const ArraysSlices = lazy(() =>
  import('./pages/ds/ArraysSlices').then(m => ({ default: m.ArraysSlices }))
);
const Maps = lazy(() =>
  import('./pages/ds/Maps').then(m => ({ default: m.Maps }))
);
const Stack = lazy(() =>
  import('./pages/ds/Stack').then(m => ({ default: m.Stack }))
);
const Queue = lazy(() =>
  import('./pages/ds/Queue').then(m => ({ default: m.Queue }))
);
const LinkedList = lazy(() =>
  import('./pages/ds/LinkedList').then(m => ({ default: m.LinkedList }))
);
const BinarySearchTree = lazy(() =>
  import('./pages/ds/BinarySearchTree').then(m => ({ default: m.BinarySearchTree }))
);


const BubbleSort = lazy(() =>
  import('./pages/algorithms/BubbleSort').then(m => ({ default: m.BubbleSort }))
);
const BinarySearch = lazy(() =>
  import('./pages/algorithms/BinarySearch').then(m => ({ default: m.BinarySearch }))
);
const MergeSort = lazy(() =>
  import('./pages/algorithms/MergeSort').then(m => ({ default: m.MergeSort }))
);


const Goroutines = lazy(() =>
  import('./pages/concurrency/Goroutines').then(m => ({ default: m.Goroutines }))
);
const Channels = lazy(() =>
  import('./pages/concurrency/Channels').then(m => ({ default: m.Channels }))
);
const BufferedChannels = lazy(() =>
  import('./pages/concurrency/BufferedChannels').then(m => ({ default: m.BufferedChannels }))
);
const WaitGroup = lazy(() =>
  import('./pages/concurrency/WaitGroup').then(m => ({ default: m.WaitGroup }))
);
const Mutex = lazy(() =>
  import('./pages/concurrency/Mutex').then(m => ({ default: m.Mutex }))
);
const Select = lazy(() =>
  import('./pages/concurrency/Select').then(m => ({ default: m.Select }))
);
const GoroutineScheduler = lazy(() =>
  import('./pages/concurrency/GoroutineScheduler').then(m => ({ default: m.GoroutineScheduler }))
);
const SyncOnce = lazy(() =>
  import('./pages/concurrency/SyncOnce').then(m => ({ default: m.SyncOnce }))
);
const ContextCancel = lazy(() =>
  import('./pages/concurrency/ContextCancel').then(m => ({ default: m.ContextCancel }))
);
const RWMutex = lazy(() =>
  import('./pages/concurrency/RWMutex').then(m => ({ default: m.RWMutex }))
);

export const router = createBrowserRouter([
  {
    path: '/',
    Component: Layout,
    children: [
      { index: true, Component: Home },
      { path: 'basics/variables', Component: Variables },
      { path: 'basics/for-loop', Component: ForLoop },
      { path: 'basics/if-else', Component: IfElse },
      { path: 'basics/functions', Component: Functions },
      { path: 'basics/pointers', Component: Pointers },
      { path: 'basics/defer-panic-recover', Component: DeferPanicRecover },
      { path: 'basics/interfaces', Component: Interfaces },
      { path: 'basics/error-wrapping', Component: ErrorWrapping },
      { path: 'ds/arrays-slices', Component: ArraysSlices },
      { path: 'ds/maps', Component: Maps },
      { path: 'ds/stack', Component: Stack },
      { path: 'ds/queue', Component: Queue },
      { path: 'ds/linked-list', Component: LinkedList },
      { path: 'ds/binary-search-tree', Component: BinarySearchTree },
      { path: 'algorithms/bubble-sort', Component: BubbleSort },
      { path: 'algorithms/binary-search', Component: BinarySearch },
      { path: 'algorithms/merge-sort', Component: MergeSort },
      { path: 'concurrency/goroutines', Component: Goroutines },
      { path: 'concurrency/channels', Component: Channels },
      { path: 'concurrency/buffered-channels', Component: BufferedChannels },
      { path: 'concurrency/waitgroup', Component: WaitGroup },
      { path: 'concurrency/mutex', Component: Mutex },
      { path: 'concurrency/select', Component: Select },
      { path: 'concurrency/goroutine-scheduler', Component: GoroutineScheduler },
      { path: 'concurrency/sync-once', Component: SyncOnce },
      { path: 'concurrency/context', Component: ContextCancel },
      { path: 'concurrency/rwmutex', Component: RWMutex },
    ],
  },
]);