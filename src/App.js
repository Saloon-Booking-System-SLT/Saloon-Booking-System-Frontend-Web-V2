// App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import CustomerRoute from './Components/CustomerRoute';
import OwnerRoute from './Components/OwnerRoute';
import AdminRoute from './Components/AdminRoute';
import Unauthorized from './Components/Unauthorized';
import 'leaflet/dist/leaflet.css';

// Customer Components
import Home from './Components/Customer/HomePage';
import CustomerLogin from './Components/Customer/Login';
import Searchsalon from './Components/Customer/searchsalon';
import Profile from './Components/Customer/Profile';
import SelectServicesPage from './Components/Customer/SelectServicesPage';
import SelectProfessionalPage from './Components/Customer/SelectProfessionalPage';
import SelectTimePage from './Components/Customer/SelectTimePage';
import MyAppointmentsPage from "./Components/Customer/MyAppointmentsPage";
import FamilyBooking from './Components/Customer/FamilyBooking';
import FamilyBookingSelectService from './Components/Customer/FamilyBookingSelectService';
import FamilyBookingSelectProfessional from './Components/Customer/FamilyBookingSelectProfessional';
import FamilyBookingSelectTimePage from './Components/Customer/FamilyBookingSelectTimePage';
import BookSelectionPage from './Components/Customer/BookSelectionPage';
import CheckoutPage from './Components/Customer/CheckoutPage';
import ConfirmationPage from './Components/Customer/ConfirmationPage';

// Owner Components
import OwnerLogin from "./Components/Owner/OwnerLogin";
import RegisterPage1 from "./Components/Owner/RegisterPage1";
import BusinessSetupWizard from "./Components/Owner/BusinessSetupWizard";
import ModernDashboard from "./Components/Owner/ModernDashboard";
import SalonCalendar from "./Components/Owner/SalonCalendar";
import SalonServices from "./Components/Owner/SalonServices";
import SalonProfessionals from "./Components/Owner/SalonProfessionals";
import SalonTimeSlots from "./Components/Owner/SalonTimeSlots";
import OwnerFeedbackPage from "./Components/Owner/OwnerFeedbackPage";
import SalonProfile from "./Components/Owner/SalonProfile";

// Admin Components
import AdminDashboard from "./Components/Admin/AdminDashboard";
import SalonsManagement from "./Components/Admin/SalonsManagement";
import ReportsPage from "./Components/Admin/ReportsPage";
import CalendarPage from "./Components/Admin/CalendarPage";
import CustomersPage from "./Components/Admin/CustomersPage";
import FeedbackModerationPage from "./Components/Admin/FeedbackModerationPage";
import PromotionsPage from "./Components/Admin/PromotionsPage";
import LoyaltyPage from "./Components/Admin/LoyaltyPage";
import FinancialInsights from "./Components/Admin/FinancialInsights";
import SettingsPage from "./Components/Admin/SettingsPage";
import AdminLogin from "./Components/Admin/AdminLogin";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login/customer" element={<CustomerLogin />} />
          <Route path="/OwnerLogin" element={<OwnerLogin />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* Customer Protected Routes */}
          <Route path="/searchsalon" element={<CustomerRoute><Searchsalon /></CustomerRoute>} />
          <Route path="/profile" element={<CustomerRoute><Profile /></CustomerRoute>} />
          <Route path="/select-services/:salonId" element={<CustomerRoute><SelectServicesPage /></CustomerRoute>} />
          <Route path="/select-professional/:salonId" element={<CustomerRoute><SelectProfessionalPage /></CustomerRoute>} />
          <Route path="/select-time" element={<CustomerRoute><SelectTimePage /></CustomerRoute>} />
          <Route path="/appointments" element={<CustomerRoute><MyAppointmentsPage /></CustomerRoute>} />
          <Route path="/familybooking" element={<CustomerRoute><FamilyBooking /></CustomerRoute>} />
          <Route path="/familybookingselectservice/:salonId" element={<CustomerRoute><FamilyBookingSelectService /></CustomerRoute>} />
          <Route path="/familybookingselectprofessional/:salonId" element={<CustomerRoute><FamilyBookingSelectProfessional /></CustomerRoute>} />
          <Route path="/familybookingselecttimepage" element={<CustomerRoute><FamilyBookingSelectTimePage /></CustomerRoute>} />
          <Route path="/bookselectionpage" element={<CustomerRoute><BookSelectionPage /></CustomerRoute>} />
          <Route path="/checkoutpage" element={<CustomerRoute><CheckoutPage /></CustomerRoute>} />
          <Route path="/confirmationpage" element={<CustomerRoute><ConfirmationPage /></CustomerRoute>} />

          {/* Owner Routes */}
          {/* Public Owner Routes */}
          <Route path="/register" element={<RegisterPage1 />} />
          <Route path="/register-step-2" element={<BusinessSetupWizard />} />
          
          {/* Protected Owner Routes */}
          <Route path="/dashboard" element={<OwnerRoute><ModernDashboard /></OwnerRoute>} />
          <Route path="/calendar" element={<OwnerRoute><SalonCalendar /></OwnerRoute>} />
          <Route path="/services" element={<OwnerRoute><SalonServices /></OwnerRoute>} />
          <Route path="/professionals" element={<OwnerRoute><SalonProfessionals /></OwnerRoute>} />
          <Route path="/timeslots" element={<OwnerRoute><SalonTimeSlots /></OwnerRoute>} />
          <Route path="/feedbacks" element={<OwnerRoute><OwnerFeedbackPage /></OwnerRoute>} />
          <Route path="/profile/:id" element={<OwnerRoute><SalonProfile /></OwnerRoute>} />

          {/* Admin Protected Routes */}
          <Route path="/AdminDashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
          <Route path="/admin-dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
          <Route path="/salons" element={<AdminRoute><SalonsManagement /></AdminRoute>} />
          <Route path="/reports" element={<AdminRoute><ReportsPage /></AdminRoute>} />
          <Route path="/admincalendar" element={<AdminRoute><CalendarPage /></AdminRoute>} />
          <Route path="/customers" element={<AdminRoute><CustomersPage /></AdminRoute>} />
          <Route path="/feedback" element={<AdminRoute><FeedbackModerationPage /></AdminRoute>} />
          <Route path="/promotions" element={<AdminRoute><PromotionsPage /></AdminRoute>} />

<Route path="/loyalty" element={<AdminRoute><LoyaltyPage /></AdminRoute>} />
          <Route path="/financial" element={<AdminRoute><FinancialInsights /></AdminRoute>} />
          <Route path="/settings" element={<AdminRoute><SettingsPage /></AdminRoute>} />
          {/* Admin Routes */}
          <Route path="/admin-login" element={<AdminLogin />} />

          {/* Catch all route - redirect to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;