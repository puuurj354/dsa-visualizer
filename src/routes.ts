import { createBrowserRouter } from 'react-router';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Variables } from './pages/basics/Variables';
import { ForLoop } from './pages/basics/ForLoop';
import { IfElse } from './pages/basics/IfElse';
import { Functions } from './pages/basics/Functions';
import { ArraysSlices } from './pages/ds/ArraysSlices';
import { Maps } from './pages/ds/Maps';
import { Stack } from './pages/ds/Stack';
import { Queue } from './pages/ds/Queue';
import { LinkedList } from './pages/ds/LinkedList';
import { BinarySearchTree } from './pages/ds/BinarySearchTree';
import { BubbleSort } from './pages/algorithms/BubbleSort';
import { BinarySearch } from './pages/algorithms/BinarySearch';
import { Goroutines } from './pages/concurrency/Goroutines';
import { Channels } from './pages/concurrency/Channels';
import { BufferedChannels } from './pages/concurrency/BufferedChannels';
import { WaitGroup } from './pages/concurrency/WaitGroup';
import { Mutex } from './pages/concurrency/Mutex';
import { Select } from './pages/concurrency/Select';
import { Pointers } from './pages/basics/Pointers';
import { DeferPanicRecover } from './pages/basics/DeferPanicRecover';
import { GoroutineScheduler } from './pages/concurrency/GoroutineScheduler';
import { Interfaces } from './pages/basics/Interfaces';
import { SyncOnce } from './pages/concurrency/SyncOnce';
import { ContextCancel } from './pages/concurrency/ContextCancel';
import { MergeSort } from './pages/algorithms/MergeSort';
import { RWMutex } from './pages/concurrency/RWMutex';
import { ErrorWrapping } from './pages/basics/ErrorWrapping';

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