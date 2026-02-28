import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import { Lock, Shield } from 'lucide-react';

import { useStore } from './store/useStore';
import { useWeatherSync } from './hooks/useWeatherSync';
import { useAppSync } from './hooks/useAppSync';
import { UserProfile } from './types';

// Core Components (Eager loaded)
import { Login } from './components/Login';
import AppSkeleton from './components/AppSkeleton';
import { MainLayout } from './components/MainLayout';
import { PublicClockInPortal } from './features/team/PublicClockInPortal';

// Lazy Loaded Components
const DashboardHome = React.lazy(() => import('./features/dashboard/DashboardHome'));
const AnimalCard = React.lazy(() => import('./features/animals/AnimalCard'));
const StockManager = React.lazy(() => import('./features/inventory/StockManager'));
const MachineManager = React.lazy(() => import('./features/machines/MachineManager'));
const FinanceManager = React.lazy(() => import('./features/finance/FinanceManager'));
const CultivationView = React.lazy(() => import('./features/cultivation/CultivationView'));
const CarbonDashboard = React.lazy(() => import('./features/dashboard/CarbonDashboard'));
const PublicProductPage = React.lazy(() => import('./features/traceability/PublicProductPage'));

/**
 * Internal helper component for restricted access sections.
 */
const AccessDenied = ({ title }: { title: string }) => (
  <div className="flex flex-col items-center justify-center p-8 text-center bg-gray-50 dark:bg-neutral-800 rounded-[2.5rem] mt-8 animate-fade-in shadow-sm border border-gray-100 dark:border-neutral-700/50">
    <div className="w-20 h-20 bg-red-100 dark:bg-red-900/20 rounded-3xl flex items-center justify-center mb-6 shadow-inner">
      <Lock className="text-red-500" size={40} strokeWidth={1.5} />
    </div>
    <h3 className="text-2xl font-black dark:text-white mb-3 tracking-tight">{title}</h3>
    <p className="text-gray-500 dark:text-neutral-400 text-sm max-w-xs leading-relaxed font-medium">
      Apenas administradores têm permissão para aceder a esta secção. Contacte o gestor da exploração se necessitar de acesso.
    </p>
  </div>
);


// --- ERROR BOUNDARY ---
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error: any, errorInfo: any) { console.error("[ErrorBoundary] Caught error:", error, errorInfo); }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center bg-white dark:bg-black">
          <div className="w-20 h-20 bg-red-100 dark:bg-red-900/20 rounded-3xl flex items-center justify-center mb-6">
            <Shield size={40} className="text-red-500" />
          </div>
          <h2 className="text-2xl font-black dark:text-white mb-2">Ops! Algo correu mal.</h2>
          <p className="text-gray-500 dark:text-neutral-400 text-sm max-w-xs mb-8">
            Ocorreu um erro ao carregar esta secção. Tente atualizar a página ou limpar os dados locais.
          </p>
          <div className="flex flex-col gap-3 w-full max-w-xs">
            <button
              onClick={() => window.location.reload()}
              className="w-full py-4 bg-gray-900 dark:bg-white text-white dark:text-black rounded-2xl font-black text-sm uppercase tracking-widest active:scale-95 transition-all"
            >
              Recarregar Aplicação
            </button>
            <button
              onClick={async () => {
                const { db } = await import('./services/db');
                await db.delete();
                localStorage.clear();
                window.location.reload();
              }}
              className="w-full py-4 bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 rounded-2xl font-black text-sm uppercase tracking-widest active:scale-95 transition-all"
            >
              Limpar Tudo e Reiniciar
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// Protected Route Wrapper
const ProtectedRoute = ({ children, requireAdmin = false }: { children: React.ReactNode, requireAdmin?: boolean }) => {
  const { isAuthenticated, currentUserId, users } = useStore();

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  const currentUser = useMemo(() => {
    if (!users) return { id: 'guest', name: 'Convidado', role: 'operator', avatar: 'C' } as UserProfile;
    return users.find(u => u && u.id === currentUserId) || { id: 'guest', name: 'Convidado', role: 'operator', avatar: 'C' } as UserProfile;
  }, [users, currentUserId]);

  if (requireAdmin && currentUser.role !== 'admin') {
    return <AccessDenied title="Acesso Negado" />;
  }

  return <>{children}</>;
};

// Global Data Provider (Initializes core syncs used everywhere)
const GlobalProvider = ({ children }: { children: React.ReactNode }) => {
  const { isHydrated } = useAppSync();
  useWeatherSync();

  if (!isHydrated) return <AppSkeleton />;

  return <>{children}</>;
};

const AppRoutes = () => {
  const fields = useStore(state => state.fields);
  const harvests = useStore(state => state.harvests);

  // Public intercepters
  const params = new URLSearchParams(window.location.search);
  const isPublicClockIn = params.get('clockin') === 'true';
  const publicBatchId = params.get('batchId');

  if (publicBatchId) {
    return (
      <Suspense fallback={<AppSkeleton />}>
        <PublicProductPage batchId={publicBatchId} harvests={harvests} fields={fields} />
      </Suspense>
    );
  }

  if (isPublicClockIn) {
    return (
      <ErrorBoundary>
        <PublicClockInPortal />
      </ErrorBoundary>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route path="/" element={
        <GlobalProvider>
          <ProtectedRoute><MainLayout /></ProtectedRoute>
        </GlobalProvider>
      }>
        <Route index element={
          <DashboardHome />
        } />

        <Route path="cultivation" element={
          <CultivationView />
        } />

        <Route path="animal" element={
          <AnimalCard />
        } />

        <Route path="stocks" element={
          <ProtectedRoute requireAdmin>
            <StockManager />
          </ProtectedRoute>
        } />

        <Route path="machines" element={
          <MachineManager />
        } />

        <Route path="finance" element={
          <ProtectedRoute requireAdmin>
            <FinanceManager />
          </ProtectedRoute>
        } />

        <Route path="carbon" element={<CarbonDashboard />} />
      </Route>
    </Routes>
  );
};

const App = () => {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </ErrorBoundary>
  );
};

export default App;
