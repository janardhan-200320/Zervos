import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { WorkspaceProvider } from "@/contexts/WorkspaceContext";
import Onboarding from "@/pages/onboarding";
import Success from "@/pages/success";
import DashboardMain from "@/pages/dashboard-main";
import DashboardOverview from "@/pages/dashboard-overview";
import AppointmentsPage from "@/pages/AppointmentsNew";
import SessionsPage from "@/pages/sessions";
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
import LeadsPage from "@/pages/LeadsSimple";
import TimeSlotsPage from "@/pages/time-slots";
import HelpSupportPage from "@/pages/help-support";
import SubscriptionPlansPage from "@/pages/subscription-plans";
import Workspaces from "@/pages/admin/Workspaces";
import WorkspaceView from "@/pages/admin/WorkspaceView";
import Resources from "@/pages/admin/Resources";
import NotFound from "@/pages/not-found";
import TopProgressBar from "@/components/TopProgressBar";
import TeamLogin from "@/pages/team/TeamLogin";
import TeamDashboard from "@/pages/team/TeamDashboard";
import TeamPublicView from "@/pages/team/TeamPublicView";
import FeedbackForm from "@/pages/feedback-form";
import ErrorBoundary from "@/components/ErrorBoundary";
import { useEffect } from "react";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Onboarding} />
      <Route path="/success" component={Success} />
      <Route path="/feedback" component={FeedbackForm} />
      <Route path="/book/:serviceId" component={PublicBookingPage} />
  <Route path="/team/login" component={TeamLogin} />
  <Route path="/team" component={TeamDashboard} />
  <Route path="/team/public/:memberId" component={TeamPublicView} />
      <Route path="/dashboard" component={DashboardOverview} />
      <Route path="/dashboard/appointments" component={AppointmentsPage} />
      <Route path="/dashboard/workflows" component={WorkflowsPage} />
      <Route path="/dashboard/sessions" component={SessionsPage} />
      <Route path="/dashboard/calendar" component={CalendarPage} />
      <Route path="/dashboard/time-slots" component={TimeSlotsPage} />
      <Route path="/dashboard/subscription-plans" component={SubscriptionPlansPage} />
      <Route path="/dashboard/help-support" component={HelpSupportPage} />
      <Route path="/dashboard/team-members" component={TeamMembersPage} />
      <Route path="/dashboard/team-attendance" component={TeamAttendancePage} />
      <Route path="/dashboard/team-reports" component={TeamReportsPage} />
      <Route path="/dashboard/booking-pages" component={BookingPagesPage} />
      <Route path="/dashboard/services" component={ServicesPage} />
      <Route path="/dashboard/products" component={ProductsPage} />
      <Route path="/dashboard/customers" component={CustomersPage} />
      <Route path="/dashboard/admin-center" component={AdminCenterPage} />
      <Route path="/dashboard/admin-center/workspaces" component={Workspaces} />
      <Route path="/dashboard/admin-center/resources" component={Resources} />
      <Route path="/dashboard/workspace/:id" component={WorkspaceView} />
      <Route path="/dashboard/salespersons" component={SalespersonsPage} />
      <Route path="/dashboard/leads" component={LeadsPage} />
  <Route path="/dashboard/invoices" component={InvoicesPage} />
  <Route path="/dashboard/pos" component={POSPage} />
  <Route path="/pos-register" component={POSRegister} />
      <Route path="/dashboard/account" component={AccountPage} />
      <Route path="/dashboard/subscription" component={SubscriptionPage} />
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
        <TooltipProvider>
          <ErrorBoundary>
            <Toaster />
            <TopProgressBar />
            <Router />
          </ErrorBoundary>
        </TooltipProvider>
      </WorkspaceProvider>
    </QueryClientProvider>
  );
}

export default App;
