import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { WorkspaceProvider } from "@/contexts/WorkspaceContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { useEffect, useState } from "react";
import LoginPage from "@/pages/Login";
import Onboarding from "@/pages/onboarding";
import Success from "@/pages/success";
import DashboardMain from "@/pages/dashboard-main";
import DashboardOverview from "@/pages/dashboard-overview";
import AppointmentsPage from "@/pages/AppointmentsNew";
import CalendarPage from "@/pages/calendar";
import TeamMembersPage from "@/pages/team-members";
import TeamAttendancePage from "@/pages/team-attendance";
import TeamReportsPage from "@/pages/team-reports";
import BookingPagesPage from "@/pages/booking-pages";
import ServicesPage from "@/pages/services";
import ProductsPage from "@/pages/products";
import CustomersPage from "@/pages/customers";
import AdminCenterPage from "@/pages/admin";
import SalespersonsPage from "@/pages/salespersons";
import PublicBookingPage from "@/pages/public-booking";
import WorkflowsPage from "@/pages/workflows";
import AccountPage from "@/pages/Account";
import SubscriptionPage from "@/pages/Subscription";
import InvoicesPage from "@/pages/Invoices";
import POSPage from "@/pages/POS";
import POSRegister from "@/pages/POSRegister";
import CustomersManagementPage from '@/pages/LeadsSimple';
import TimeSlotsPage from '@/pages/time-slots';
import HelpSupportPage from '@/pages/help-support';
import StaffKPIPage from '@/pages/staff-kpi';
import VendorManagementPage from '@/pages/vendor-management';
import IncomePage from '@/pages/income';
import ExpensesPage from '@/pages/expenses';
import BalanceSheetPage from '@/pages/balance-sheet';
import MembershipsPage from '@/pages/memberships';
import SubscriptionPlansPage from '@/pages/subscription-plans';
import UniversalBookingPage from '@/pages/universal-booking';
import Workspaces from '@/pages/admin/Workspaces';
import WorkspaceView from "@/pages/admin/WorkspaceView";
import Resources from "@/pages/admin/Resources";
import NotFound from "@/pages/not-found";
import TopProgressBar from "@/components/TopProgressBar";
import TeamLogin from "@/pages/team/TeamLogin";
import TeamDashboard from "@/pages/team/TeamDashboard";
import TeamPublicView from "@/pages/team/TeamPublicView";
import FeedbackForm from "@/pages/feedback-form";
import ErrorBoundary from "@/components/ErrorBoundary";

function ProtectedRoute({ component: Component, ...rest }: any) {
  const [, setLocation] = useLocation();
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = () => {
      const auth = localStorage.getItem('zervos_is_authenticated');
      const user = localStorage.getItem('zervos_current_user');
      
      if (auth === 'true' && user) {
        setIsAuthenticated(true);
      } else {
        setLocation('/login');
      }
      setIsChecking(false);
    };

    checkAuth();
  }, [setLocation]);

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-600 border-t-transparent"></div>
      </div>
    );
  }

  return isAuthenticated ? <Component {...rest} /> : null;
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={LoginPage} />
      <Route path="/">{() => <ProtectedRoute component={Onboarding} />}</Route>
      <Route path="/success">{() => <ProtectedRoute component={Success} />}</Route>
      <Route path="/feedback" component={FeedbackForm} />
      <Route path="/book/:serviceId" component={PublicBookingPage} />
      <Route path="/booking/:workspaceId" component={PublicBookingPage} />
  <Route path="/team/login" component={TeamLogin} />
  <Route path="/team" component={TeamDashboard} />
  <Route path="/team/public/:memberId" component={TeamPublicView} />
      <Route path="/dashboard">{() => <ProtectedRoute component={DashboardOverview} />}</Route>
      <Route path="/dashboard/appointments">{() => <ProtectedRoute component={AppointmentsPage} />}</Route>
      <Route path="/dashboard/workflows">{() => <ProtectedRoute component={WorkflowsPage} />}</Route>
      <Route path="/dashboard/calendar">{() => <ProtectedRoute component={CalendarPage} />}</Route>
      <Route path="/dashboard/time-slots">{() => <ProtectedRoute component={TimeSlotsPage} />}</Route>
      <Route path="/dashboard/subscription-plans">{() => <ProtectedRoute component={SubscriptionPlansPage} />}</Route>
      <Route path="/dashboard/help-support">{() => <ProtectedRoute component={HelpSupportPage} />}</Route>
      <Route path="/dashboard/team-members">{() => <ProtectedRoute component={TeamMembersPage} />}</Route>
      <Route path="/dashboard/team-attendance">{() => <ProtectedRoute component={TeamAttendancePage} />}</Route>
      <Route path="/dashboard/team-reports">{() => <ProtectedRoute component={TeamReportsPage} />}</Route>
      <Route path="/dashboard/booking-pages">{() => <ProtectedRoute component={BookingPagesPage} />}</Route>
      <Route path="/dashboard/services">{() => <ProtectedRoute component={ServicesPage} />}</Route>
      <Route path="/dashboard/products">{() => <ProtectedRoute component={ProductsPage} />}</Route>
      <Route path="/dashboard/customers">{() => <ProtectedRoute component={CustomersManagementPage} />}</Route>
      <Route path="/dashboard/admin-center">{() => <ProtectedRoute component={AdminCenterPage} />}</Route>
      <Route path="/dashboard/admin-center/workspaces">{() => <ProtectedRoute component={Workspaces} />}</Route>
      <Route path="/dashboard/admin-center/resources">{() => <ProtectedRoute component={Resources} />}</Route>
      <Route path="/dashboard/workspace/:id">{() => <ProtectedRoute component={WorkspaceView} />}</Route>
      <Route path="/dashboard/salespersons">{() => <ProtectedRoute component={SalespersonsPage} />}</Route>
  <Route path="/dashboard/invoices">{() => <ProtectedRoute component={InvoicesPage} />}</Route>
  <Route path="/dashboard/pos">{() => <ProtectedRoute component={POSPage} />}</Route>
  <Route path="/pos-register">{() => <ProtectedRoute component={POSRegister} />}</Route>
  <Route path="/dashboard/staff-kpi">{() => <ProtectedRoute component={StaffKPIPage} />}</Route>
  <Route path="/dashboard/vendor-management">{() => <ProtectedRoute component={VendorManagementPage} />}</Route>
  <Route path="/dashboard/income">{() => <ProtectedRoute component={IncomePage} />}</Route>
  <Route path="/dashboard/expenses">{() => <ProtectedRoute component={ExpensesPage} />}</Route>
  <Route path="/dashboard/balance-sheet">{() => <ProtectedRoute component={BalanceSheetPage} />}</Route>
  <Route path="/dashboard/memberships">{() => <ProtectedRoute component={MembershipsPage} />}</Route>
      <Route path="/dashboard/account">{() => <ProtectedRoute component={AccountPage} />}</Route>
      <Route path="/dashboard/subscription">{() => <ProtectedRoute component={SubscriptionPage} />}</Route>
      <Route component={NotFound} />
    </Switch>
  );
}function App() {
  useEffect(() => {
    // Global error handler to catch unhandled promise rejections
    const handleError = (event: ErrorEvent) => {
      console.error('❌ GLOBAL ERROR CAUGHT:');
      console.error('Message:', event.message);
      console.error('Error:', event.error);
      console.error('Filename:', event.filename);
      console.error('Line:', event.lineno, 'Column:', event.colno);
      console.error('Stack:', event.error?.stack);
      event.preventDefault(); // Prevent default browser error handling
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('❌ UNHANDLED PROMISE REJECTION:');
      console.error('Reason:', event.reason);
      console.error('Promise:', event.promise);
      event.preventDefault();
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <WorkspaceProvider>
        <NotificationProvider>
          <TooltipProvider>
            <ErrorBoundary>
              <Toaster />
              <TopProgressBar />
              <Router />
            </ErrorBoundary>
          </TooltipProvider>
        </NotificationProvider>
      </WorkspaceProvider>
    </QueryClientProvider>
  );
}

export default App;
