import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';

// Public pages
import Home from './pages/Home';
import Explorer from './pages/Explorer';
import Compare from './pages/Compare';
import Dashboard from './pages/Dashboard';

// Admin pages
import AdminLayout from './components/admin/AdminLayout';
import PipelineHealth from './pages/admin/PipelineHealth';
import ReviewQueue from './pages/admin/ReviewQueue';
import SalaryRecords from './pages/admin/SalaryRecords';
import ReferenceData from './pages/admin/ReferenceData';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-secondary border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Home />} />
      <Route path="/explorer" element={<Explorer />} />
      <Route path="/compare" element={<Compare />} />
      <Route path="/dashboard" element={<Dashboard />} />

      {/* Admin routes */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<PipelineHealth />} />
        <Route path="review" element={<ReviewQueue />} />
        <Route path="records" element={<SalaryRecords />} />
        <Route path="companies" element={<ReferenceData />} />
        <Route path="roles" element={<ReferenceData />} />
        <Route path="levels" element={<ReferenceData />} />
      </Route>

      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;