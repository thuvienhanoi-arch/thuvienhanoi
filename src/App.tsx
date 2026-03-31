import LibraryUIPro from './components/LibraryUIPro';
import { ErrorBoundary } from './components/ErrorBoundary';

export default function App() {
  return (
    <ErrorBoundary>
      <LibraryUIPro />
    </ErrorBoundary>
  );
}
