import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './components/ThemeProvider';
import { Toaster } from 'sonner';
import { WifiOff } from 'lucide-react';
import pb from './lib/pocketbaseClient';

// Pages
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import DashboardPage from './pages/DashboardPage';
import CustomersPage from './pages/CustomersPage';
import ItemsPage from './pages/ItemsPage';
import PackagesPage from './pages/PackagesPage';
import QuotationsPage from './pages/QuotationsPage';
import CreateQuotationPage from './pages/CreateQuotationPage';
import EditQuotationPage from './pages/EditQuotationPage';
import QuotationViewPage from './pages/QuotationViewPage';
import QuotationLinkPage from './pages/QuotationLinkPage';
import SettingsPage from './pages/SettingsPage';
import ProfilePage from './pages/ProfilePage';
import ProfileOverviewPage from './pages/ProfileOverviewPage';
import SubscriptionPlansPage from './pages/SubscriptionPlansPage';
import InviteEarnPage from './pages/InviteEarnPage';
import AboutAppPage from './pages/AboutAppPage';
import CustomFieldsPage from './pages/CustomFieldsPage';
import HomePage from './pages/HomePage';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminUserDetail from './pages/admin/AdminUserDetail';
import AdminPlansPage from './pages/admin/AdminPlansPage';
import AdminPlanDetail from './pages/admin/AdminPlanDetail';
import AdminSettingsPage from './pages/admin/AdminSettingsPage';
import AdminPhotographersList from './pages/admin/AdminPhotographersList';
import AdminPhotographerDetail from './pages/admin/AdminPhotographerDetail';
import AdminCustomersList from './pages/admin/AdminCustomersList';
import AdminQuotationsList from './pages/admin/AdminQuotationsList';
import AdminAnalyticsPage from './pages/admin/AdminAnalyticsPage';
import AdminFeedbackPage from './pages/admin/AdminFeedbackPage';
import AdminItemsPage from './pages/admin/AdminItemsPage';
import AdminUniversalPackagesPage from './pages/admin/AdminUniversalPackagesPage';
import AdminUniversalItemsPage from './pages/admin/AdminUniversalItemsPage';

// Components
import ProtectedRoute from './components/ProtectedRoute';
import ProtectedAdminRoute from './components/ProtectedAdminRoute';
import ScrollToTop from './components/ScrollToTop';

const OfflineScreen = () => (
  <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-background p-6 text-center animate-in fade-in duration-300">
    <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-6">
      <WifiOff className="w-10 h-10 text-muted-foreground" />
    </div>
    <h2 className="text-2xl font-black text-foreground mb-3 tracking-tight">You are offline</h2>
    <p className="text-muted-foreground max-w-sm mb-8 leading-relaxed">
      Pixora Studio requires an active internet connection to securely load and save your data. Please check your network connection to continue.
    </p>
    <button 
      onClick={() => window.location.reload()} 
      className="bg-primary text-primary-foreground font-bold px-6 py-3 rounded-xl hover:bg-primary/90 transition-all active:scale-95 shadow-sm"
    >
      Retry Connection
    </button>
  </div>
);

const AppContent = () => {
  const { currentUser, loading } = useAuth();
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOnline) {
    return <OfflineScreen />;
  }

  if (loading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-background">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <Router>
      <ScrollToTop />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={currentUser ? <Navigate to="/dashboard" /> : <HomePage />} />
        <Route path="/login" element={currentUser ? <Navigate to="/dashboard" /> : <LoginPage />} />
        <Route path="/signup" element={currentUser ? <Navigate to="/dashboard" /> : <SignupPage />} />
        <Route path="/forgot-password" element={currentUser ? <Navigate to="/dashboard" /> : <ForgotPasswordPage />} />
        <Route path="/reset-password" element={currentUser ? <Navigate to="/dashboard" /> : <ResetPasswordPage />} />
        
        {/* Public Quotation View */}
        <Route path="/q/:shortId" element={<QuotationLinkPage />} />
        <Route path="/quotation/:shortId" element={<QuotationViewPage />} />

        {/* Protected User Routes */}
        <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/customers" element={<ProtectedRoute><CustomersPage /></ProtectedRoute>} />
        <Route path="/items" element={<ProtectedRoute><ItemsPage /></ProtectedRoute>} />
        <Route path="/packages" element={<ProtectedRoute><PackagesPage /></ProtectedRoute>} />
        <Route path="/quotations" element={<ProtectedRoute><QuotationsPage /></ProtectedRoute>} />
        <Route path="/quotations/create" element={<ProtectedRoute><CreateQuotationPage /></ProtectedRoute>} />
        <Route path="/quotations/edit/:id" element={<ProtectedRoute><EditQuotationPage /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path="/profile/overview" element={<ProtectedRoute><ProfileOverviewPage /></ProtectedRoute>} />
        <Route path="/subscription-plans" element={<ProtectedRoute><SubscriptionPlansPage /></ProtectedRoute>} />
        <Route path="/invite-earn" element={<ProtectedRoute><InviteEarnPage /></ProtectedRoute>} />
        <Route path="/about" element={<ProtectedRoute><AboutAppPage /></ProtectedRoute>} />
        <Route path="/custom-fields" element={<ProtectedRoute><CustomFieldsPage /></ProtectedRoute>} />

        {/* Protected Admin Routes */}
        <Route path="/admin" element={<ProtectedAdminRoute><AdminDashboard /></ProtectedAdminRoute>} />
        <Route path="/admin/users" element={<ProtectedAdminRoute><AdminUsersPage /></ProtectedAdminRoute>} />
        <Route path="/admin/users/:id" element={<ProtectedAdminRoute><AdminUserDetail /></ProtectedAdminRoute>} />
        <Route path="/admin/plans" element={<ProtectedAdminRoute><AdminPlansPage /></ProtectedAdminRoute>} />
        <Route path="/admin/plans/:id" element={<ProtectedAdminRoute><AdminPlanDetail /></ProtectedAdminRoute>} />
        <Route path="/admin/settings" element={<ProtectedAdminRoute><AdminSettingsPage /></ProtectedAdminRoute>} />
        <Route path="/admin/photographers" element={<ProtectedAdminRoute><AdminPhotographersList /></ProtectedAdminRoute>} />
        <Route path="/admin/photographers/:id" element={<ProtectedAdminRoute><AdminPhotographerDetail /></ProtectedAdminRoute>} />
        <Route path="/admin/customers" element={<ProtectedAdminRoute><AdminCustomersList /></ProtectedAdminRoute>} />
        <Route path="/admin/quotations" element={<ProtectedAdminRoute><AdminQuotationsList /></ProtectedAdminRoute>} />
        <Route path="/admin/analytics" element={<ProtectedAdminRoute><AdminAnalyticsPage /></ProtectedAdminRoute>} />
        <Route path="/admin/feedback" element={<ProtectedAdminRoute><AdminFeedbackPage /></ProtectedAdminRoute>} />
        <Route path="/admin/items" element={<ProtectedAdminRoute><AdminItemsPage /></ProtectedAdminRoute>} />
        <Route path="/admin/universal-packages" element={<ProtectedAdminRoute><AdminUniversalPackagesPage /></ProtectedAdminRoute>} />
        <Route path="/admin/universal-items" element={<ProtectedAdminRoute><AdminUniversalItemsPage /></ProtectedAdminRoute>} />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
};

function App() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const refCode = params.get('ref');
    if (refCode) {
      sessionStorage.setItem('referralCode', refCode);
    }
  }, []);

  return (
    <ThemeProvider defaultTheme="light" storageKey="pixora-theme">
      <AuthProvider>
        <AppContent />
        <Toaster position="top-center" richColors />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;