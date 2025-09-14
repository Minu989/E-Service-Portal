import React, { useState, useCallback } from 'react';
import WelcomePage from './components/auth/WelcomePage';
import AuthFlow from './components/auth/AuthFlow';
import TechnicianPortal from './components/technician/TechnicianPortal';
import CustomerPortal from './components/customer/CustomerPortal';
import { AppProvider } from './contexts/AppContext';
import { auth } from './services/firebase';
import { signOut } from 'firebase/auth';
import { SpinnerIcon } from './components/common/icons';
import { useAuth } from './contexts/AuthContext'; // NEW: Import our custom hook

type AuthRoute = 'welcome' | 'technician' | 'customer';

const App: React.FC = () => {
  // NEW: Get all user and loading info from our centralized AuthContext.
  const { userProfile, loading } = useAuth();

  // This state is still needed to navigate the logged-out experience.
  const [authRoute, setAuthRoute] = useState<AuthRoute>('welcome');

  // UPDATED: The handleLogout function is now much simpler.
  const handleLogout = useCallback(async () => {
    try {
      await signOut(auth);
      // The AuthContext will detect the sign-out and update the state automatically.
      // We just reset the navigation route for when the user is logged out.
      setAuthRoute('welcome');
    } catch (error) {
      console.error("Error signing out from App.tsx: ", error);
    }
  }, []);

  // These handlers are still needed for the logged-out flow.
  const handleRoleSelect = useCallback((role: AuthRoute) => {
    setAuthRoute(role);
  }, []);

  const handleBackToWelcome = useCallback(() => {
    setAuthRoute('welcome');
  }, []);
  
  const renderApp = () => {
    // Step 1: Use the 'loading' state from our AuthContext.
    if (loading) {
      return (
        <div className="min-h-screen bg-slate-100 flex justify-center items-center">
          <SpinnerIcon className="w-12 h-12 text-indigo-600 animate-spin" />
        </div>
      );
    }

    // Step 2: If a userProfile exists, they are logged in. Render the correct portal based on their role.
    if (userProfile) {
       switch (userProfile.role) {
        case 'technician':
          return <TechnicianPortal onLogout={handleLogout} />;
        case 'customer':
          return <CustomerPortal onLogout={handleLogout} />;
        default:
          // This is a safety net in case a user has a profile but an invalid role.
          console.error("App.tsx: User profile has an invalid role:", userProfile.role);
          return <WelcomePage onSelectRole={handleRoleSelect} />;
      }
    }

    // Step 3: If not loading and no userProfile, the user is logged out. Show the welcome/auth flow.
    switch (authRoute) {
        case 'technician':
            // The onLogin prop is no longer needed.
            return <AuthFlow userType="technician" onBack={handleBackToWelcome} />;
        case 'customer':
             return <AuthFlow userType="customer" onBack={handleBackToWelcome} />;
        case 'welcome':
        default:
            return <WelcomePage onSelectRole={handleRoleSelect} />;
    }
  }

  return (
    // AppProvider remains for handling app data (requests, messages etc.)
    <AppProvider>
      {renderApp()}
    </AppProvider>
  )
};

export default App;
