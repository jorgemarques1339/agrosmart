import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AppRoutes, ErrorBoundary } from './routes/AppRoutes';

const App = () => {
  return (
    <ErrorBoundary>
      <Toaster position="bottom-center" />
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </ErrorBoundary>
  );
};

export default App;

