
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import NotFound from "./pages/NotFound";
import TenantDashboard from "./pages/tenant/Dashboard";
import TenantPayments from "./pages/tenant/Payments";
import TenantPaymentHistory from "./pages/tenant/PaymentHistory";
import TenantMaintenance from "./pages/tenant/Maintenance";
import TenantDocuments from "./pages/tenant/Documents";
import TenantMoveOut from "./pages/tenant/MoveOut";
import TenantMessages from "./pages/tenant/Messages";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminProperties from "./pages/admin/Properties";
import AdminTenants from "./pages/admin/Tenants";
import AdminPayments from "./pages/admin/Payments";
import AdminMaintenance from "./pages/admin/Maintenance";
import AdminMoveOut from "./pages/admin/MoveOut";
import AdminDocuments from "./pages/admin/Documents";
import AdminMessages from "./pages/admin/Messages";
import AdminAnalytics from "./pages/admin/Analytics";
import { SupabaseAuthProvider } from "./contexts/SupabaseAuthContext";
import { AuthProvider } from "./contexts/AuthContext";

// Protected route wrapper
const ProtectedRoute = ({ children, requiredRole }: { children: JSX.Element, requiredRole?: 'admin' | 'tenant' }) => {
  // Logic will be handled inside the specific layout components
  return children;
};

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <AuthProvider>
        <SupabaseAuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              
              {/* Tenant Routes */}
              <Route path="/tenant" element={<ProtectedRoute requiredRole="tenant"><TenantDashboard /></ProtectedRoute>} />
              <Route path="/tenant/payments" element={<ProtectedRoute requiredRole="tenant"><TenantPayments /></ProtectedRoute>} />
              <Route path="/tenant/payment-history" element={<ProtectedRoute requiredRole="tenant"><TenantPaymentHistory /></ProtectedRoute>} />
              <Route path="/tenant/maintenance" element={<ProtectedRoute requiredRole="tenant"><TenantMaintenance /></ProtectedRoute>} />
              <Route path="/tenant/documents" element={<ProtectedRoute requiredRole="tenant"><TenantDocuments /></ProtectedRoute>} />
              <Route path="/tenant/move-out" element={<ProtectedRoute requiredRole="tenant"><TenantMoveOut /></ProtectedRoute>} />
              <Route path="/tenant/messages" element={<ProtectedRoute requiredRole="tenant"><TenantMessages /></ProtectedRoute>} />
              
              {/* Admin Routes */}
              <Route path="/admin" element={<ProtectedRoute requiredRole="admin"><AdminDashboard /></ProtectedRoute>} />
              <Route path="/admin/properties" element={<ProtectedRoute requiredRole="admin"><AdminProperties /></ProtectedRoute>} />
              <Route path="/admin/tenants" element={<ProtectedRoute requiredRole="admin"><AdminTenants /></ProtectedRoute>} />
              <Route path="/admin/payments" element={<ProtectedRoute requiredRole="admin"><AdminPayments /></ProtectedRoute>} />
              <Route path="/admin/maintenance" element={<ProtectedRoute requiredRole="admin"><AdminMaintenance /></ProtectedRoute>} />
              <Route path="/admin/move-out" element={<ProtectedRoute requiredRole="admin"><AdminMoveOut /></ProtectedRoute>} />
              <Route path="/admin/documents" element={<ProtectedRoute requiredRole="admin"><AdminDocuments /></ProtectedRoute>} />
              <Route path="/admin/messages" element={<ProtectedRoute requiredRole="admin"><AdminMessages /></ProtectedRoute>} />
              <Route path="/admin/analytics" element={<ProtectedRoute requiredRole="admin"><AdminAnalytics /></ProtectedRoute>} />
              
              {/* Catch-all route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </TooltipProvider>
        </SupabaseAuthProvider>
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
