import './App.css';
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import useMediaQuery from '@mui/material/useMediaQuery';

import { UserContext } from './context/UserContext';
import { getUserFromToken } from './api/authApi';

// Pages
import Login from './pages/Login';
import ChangePassword from './pages/ChangePassword';
import SessionManager from './components/SessionManager';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminHarmonization from './pages/Harmonization';
import AdminRecipts from './pages/Receipt';
import AdminStatusHistory from './pages/StatusHistory';
import AdminReceiptHistory from './pages/ReceiptHistory';

// Super Admin Pages
import SuperDashboard from './pages/superAdmin/SuperDashboard';
import SuperAdminAdmin from './pages/superAdmin/Admin';
import SuperAdminHarmonization from './pages/Harmonization';
import SuperAdminRecipts from './pages/Receipt';
import SuperAdminStatusHistory from './pages/StatusHistory';
import SuperAdminReceiptHistory from './pages/ReceiptHistory';

// Layout Components
import DashboardLayout from './components/layout/DashboardLayout';

// Icons
import DashboardIcon from "@mui/icons-material/Dashboard";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import SyncAltIcon from "@mui/icons-material/SyncAlt";
import ReceiptIcon from "@mui/icons-material/Receipt";
import LogoutIcon from "@mui/icons-material/Logout";
import HistoryIcon from "@mui/icons-material/History";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import RestoreIcon from "@mui/icons-material/Restore";

const theme = createTheme({
  palette: {
    primary: {
      main: '#DAA520', // Dark yellow/gold for Anbesa Bank
    },
    secondary: {
      main: '#000000',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
        },
      },
    },
  },
});

// Common menu items shared across all roles
const commonMenuItems = [
  { name: "Harmonization", path: "/harmonization", icon: <SyncAltIcon /> },
  { name: "Receipts", path: "/recipts", icon: <ReceiptIcon /> },
  { name: "Harmo_History", path: "/status-history", icon: <HistoryIcon /> },
  { name: "Receipt History", path: "/receipt-history", icon: <ReceiptLongIcon /> },
  { name: "Logout", path: "/logout", icon: <LogoutIcon />, isLogout: true },
];

// Role-specific menu items
const roleMenuConfig = {
  SUPER_ADMIN: [
    { name: "Dashboard", path: "/superDashboard", icon: <DashboardIcon /> },
    { name: "Admins", path: "/admin", icon: <AdminPanelSettingsIcon /> },
  ],
  ADMIN: [
    { name: "Dashboard", path: "/dashboard", icon: <DashboardIcon /> },
  ],
};

// Helper to get complete menu for a role
const getMenuByRole = (role) => {
  const roleSpecific = roleMenuConfig[role] || roleMenuConfig.ADMIN;
  return [...roleSpecific, ...commonMenuItems];
};

// Helper to get dashboard title
const getTitleByRole = (role) => {
  const titles = {
    SUPER_ADMIN: "Super Admin Dashboard",
    ADMIN: "Admin Dashboard",
  };
  return titles[role] || "Dashboard";
};

// Helper to get default route
const getDefaultRoute = (role) => {
  const routes = {
    SUPER_ADMIN: "/superDashboard",
    ADMIN: "/dashboard",
  };
  return routes[role] || "/dashboard";
};

// Protected Route Component
const PrivateRoute = ({ children, allowedRoles = null, allowPasswordChange = false }) => {
  const { user } = React.useContext(UserContext);
  
  if (!user) return <Navigate to="/login" replace />;
  
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={getDefaultRoute(user.role)} replace />;
  }
  
  if (!allowPasswordChange && user.mustChangePassword) {
    return <Navigate to="/change-password" replace />;
  }
  
  return children;
};

// Route wrapper for role-based access
const RoleBasedRoute = ({ children, allowedRoles }) => (
  <PrivateRoute allowedRoles={allowedRoles}>
    {children}
  </PrivateRoute>
);

function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("user");
    const parsed = saved ? JSON.parse(saved) : null;
    const tokenUser = getUserFromToken();
    if (parsed && tokenUser?.mustChangePassword) {
      parsed.mustChangePassword = true;
    }
    return parsed;
  });
  const isMobile = useMediaQuery('(max-width:900px)');

  // Token validation and cleanup
  useEffect(() => {
    if (!user) {
      localStorage.removeItem("user");
      return;
    }

    localStorage.setItem("user", JSON.stringify(user));

    try {
      const token = user.token;
      if (!token) {
        setUser(null);
        return;
      }
      const payload = JSON.parse(atob(token.split(".")[1]));
      const expired = payload.exp * 1000 < Date.now();
      if (expired) {
        localStorage.removeItem("user");
        setUser(null);
      }
    } catch (err) {
      localStorage.removeItem("user");
      setUser(null);
    }
  }, [user]);

  // Memoize user context value
  const userContextValue = React.useMemo(() => ({ user, setUser }), [user]);

  // If user is logged in, show DashboardLayout with role-specific sidebar
  if (user) {
    const userRole = user.role || 'ADMIN';
    const currentMenu = getMenuByRole(userRole);
    const dashboardTitle = getTitleByRole(userRole);

    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Router>
          <UserContext.Provider value={userContextValue}>
            <SessionManager>
              <ToastContainer 
                position="top-right"
                autoClose={3000}
                hideProgressBar={false}
                newestOnTop
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="colored"
                limit={3}
              />
              <Routes>
                {/* Public routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/change-password" element={<PrivateRoute allowPasswordChange><ChangePassword /></PrivateRoute>} />
                
                {/* Main dashboard layout */}
                <Route path="/" element={<DashboardLayout menu={currentMenu} title={dashboardTitle} isMobile={isMobile} />}>
                  <Route index element={<Navigate to={getDefaultRoute(userRole)} replace />} />
                  
                  {/* SUPER_ADMIN specific routes */}
                  <Route 
                    path="superDashboard" 
                    element={
                      <RoleBasedRoute allowedRoles={['SUPER_ADMIN']}>
                        <SuperDashboard />
                      </RoleBasedRoute>
                    } 
                  />
                  
                  <Route 
                    path="admin" 
                    element={
                      <RoleBasedRoute allowedRoles={['SUPER_ADMIN']}>
                        <SuperAdminAdmin />
                      </RoleBasedRoute>
                    } 
                  />
                  
                  {/* ADMIN specific routes */}
                  <Route 
                    path="dashboard" 
                    element={
                      <RoleBasedRoute allowedRoles={['ADMIN']}>
                        <AdminDashboard />
                      </RoleBasedRoute>
                    } 
                  />
                  
                  {/* Harmonization - Common */}
                  <Route 
                    path="harmonization" 
                    element={
                      <PrivateRoute>
                        {userRole === 'SUPER_ADMIN' ? <SuperAdminHarmonization /> : <AdminHarmonization />}
                      </PrivateRoute>
                    } 
                  />
                  
                  {/* Receipts - Common */}
                  <Route 
                    path="recipts" 
                    element={
                      <PrivateRoute>
                        {userRole === 'SUPER_ADMIN' ? <SuperAdminRecipts /> : <AdminRecipts />}
                      </PrivateRoute>
                    } 
                  />
                  
                  {/* 🔥 STATUS HISTORY - Separate from Receipt History */}
                  <Route 
                    path="status-history" 
                    element={
                      <PrivateRoute>
                        {userRole === 'SUPER_ADMIN' ? <SuperAdminStatusHistory /> : <AdminStatusHistory />}
                      </PrivateRoute>
                    } 
                  />
                  
                  {/* 🔥 RECEIPT HISTORY - Separate from Status History */}
                  <Route 
                    path="receipt-history" 
                    element={
                      <PrivateRoute>
                        {userRole === 'SUPER_ADMIN' ? <SuperAdminReceiptHistory /> : <AdminReceiptHistory />}
                      </PrivateRoute>
                    } 
                  />
                </Route>
                
                {/* Catch all */}
                <Route path="*" element={<Navigate to={getDefaultRoute(userRole)} replace />} />
              </Routes>
            </SessionManager>
          </UserContext.Provider>
        </Router>
      </ThemeProvider>
    );
  }

  // If no user, show login page
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <UserContext.Provider value={userContextValue}>
          <SessionManager>
            <ToastContainer 
              position="top-right"
              autoClose={3000}
              hideProgressBar={false}
              newestOnTop
              closeOnClick
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover
              theme="colored"
              limit={3}
            />
            <Routes>
              <Route path="/" element={<Login />} />
              <Route path="/login" element={<Login />} />
              <Route path="/change-password" element={<ChangePassword />} />
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </SessionManager>
        </UserContext.Provider>
      </Router>
    </ThemeProvider>
  );
}

export default App;