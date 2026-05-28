import { BrowserRouter } from 'react-router-dom';
import AppRoutes from './routes/AppRoutes';
import { Toaster } from 'react-hot-toast';
import ErrorBoundary from './core/components/ErrorBoundary';
import ScrollToTop from './core/components/ScrollToTop';
import './index.css';

import { CategoryProvider } from './core/contexts/CategoryContext';
import { SearchProvider } from './core/contexts/SearchContext';

function App() {
  return (
    <ErrorBoundary>
      <SearchProvider>
        <CategoryProvider>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <ScrollToTop />
          <AppRoutes />
          <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
        </BrowserRouter>
      </CategoryProvider>
     </SearchProvider>
    </ErrorBoundary>
  );
}

export default App;
