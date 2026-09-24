import { useEffect, useCallback, useContext, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { UserContext } from "../context/UserContext";
import { logout as logoutApi, getUserFromToken } from "../api/authApi";
import { setUnauthorizedHandler } from "../api/axiosSetup";
import { useInactivityLogout } from "../hooks/useInactivityLogout";

const SessionManager = ({ children }) => {
  const { user, setUser } = useContext(UserContext);
  const navigate = useNavigate();
  const clearingRef = useRef(false);

  const clearSession = useCallback(
    async (message) => {
      if (clearingRef.current) return;
      clearingRef.current = true;
      try {
        await logoutApi();
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setUser(null);
        if (message) toast.warning(message);
        navigate("/login", { replace: true });
      } finally {
        clearingRef.current = false;
      }
    },
    [navigate, setUser],
  );

  const clearSessionRef = useRef(clearSession);
  clearSessionRef.current = clearSession;

  // Handle 401 unauthorized responses
  useEffect(() => {
    setUnauthorizedHandler((msg) => {
      clearSessionRef.current(msg || "Session expired. Please log in again.");
    });
  }, []);

  // FIXED: Removed the sessionId check that was causing immediate logout
  // Now only check if token exists and is not expired
  useEffect(() => {
    if (!user) return;
    
    const token = localStorage.getItem("token");
    if (!token) {
      clearSessionRef.current("Session expired. Please log in again.");
      return;
    }
    
    try {
      // Check if token is expired
      const payload = JSON.parse(atob(token.split(".")[1]));
      const expired = payload.exp * 1000 < Date.now();
      if (expired) {
        clearSessionRef.current("Session expired. Please log in again.");
      }
    } catch (err) {
      console.error("Token validation error:", err);
      // Don't logout on decode error - token might still be valid
      // clearSessionRef.current("Invalid session. Please log in again.");
    }
  }, [user]);

  // Only enable inactivity logout for authenticated users
  useInactivityLogout(Boolean(user), () => {
    clearSessionRef.current("Logged out due to 15 minutes of inactivity.");
  });

  return children;
};

export default SessionManager;