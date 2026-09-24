import { Navigate } from "react-router-dom";
import { getUserFromToken } from "../api/authApi";

const RequirePasswordChange = ({ user, children }) => {
  const tokenUser = getUserFromToken();
  const mustChange =
    user?.mustChangePassword || tokenUser?.mustChangePassword;

  if (mustChange) {
    return <Navigate to="/change-password" replace />;
  }

  return children;
};

export default RequirePasswordChange;