import React, { useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Stack,
  InputAdornment,
  IconButton,
  Alert,
  useTheme,
  useMediaQuery,
  FormHelperText,
  Fade,
} from "@mui/material";
import LockIcon from "@mui/icons-material/Lock";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import { UserContext } from "../context/UserContext";
import { changePassword } from "../api/authApi";
import {
  DEFAULT_PASSWORD,
  PASSWORD_REQUIREMENTS,
  validateComplexPassword,
} from "../utils/passwordValidation";

const getRoleRoute = (role) => {
  const routes = {
    SUPER_ADMIN: "/companySuper",
    ADMIN: "/dashboard",
  };
  return routes[role] || "/login";
};

const ChangePassword = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const { user, setUser } = useContext(UserContext);
  const forced = Boolean(user?.mustChangePassword);

  const inputTheme = {
    "& .MuiOutlinedInput-root": {
      color: "#000",
      backgroundColor: "#FDFDFD",
      borderRadius: isMobile ? "8px" : "10px",
      fontSize: isMobile ? "0.8rem" : "0.85rem",
      transition: "all 0.2s ease",
      "& fieldset": { borderColor: "#E8E8E8" },
      "&:hover fieldset": { borderColor: "#FFD600", borderWidth: "1.5px" },
      "&.Mui-focused fieldset": { borderColor: "#FFD600", borderWidth: "2px" },
    },
    "& .MuiInputLabel-root": {
      fontSize: isMobile ? "0.75rem" : "0.8rem",
    },
  };

  const [oldPassword, setOldPassword] = useState(forced ? DEFAULT_PASSWORD : "");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState([]);
  const [touched, setTouched] = useState({
    newPassword: false,
    confirmPassword: false,
  });

  // Validate password in real-time
  useEffect(() => {
    if (touched.newPassword && newPassword) {
      const validation = validateComplexPassword(newPassword);
      if (!validation.valid) {
        const errors = validation.msg.split(", ");
        setValidationErrors(errors);
      } else {
        setValidationErrors([]);
      }
    } else if (touched.newPassword && !newPassword) {
      setValidationErrors(["Password is required"]);
    } else {
      setValidationErrors([]);
    }
  }, [newPassword, touched.newPassword]);

  // Check if update button should be disabled
  const isUpdateDisabled = () => {
    if (loading) return true;
    if (!oldPassword || !newPassword || !confirmPassword) return true;
    if (newPassword !== confirmPassword) return true;
    if (validationErrors.length > 0) return true;
    if (!forced && oldPassword === newPassword) return true;
    return false;
  };

  const handleCancel = () => {
    if (forced) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setUser(null);
      navigate("/login", { replace: true });
    } else {
      const roleRoute = getRoleRoute(user?.role);
      navigate(roleRoute, { replace: true });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!oldPassword || !newPassword || !confirmPassword) {
      toast.error("All fields are required.");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match.");
      return;
    }

    const validation = validateComplexPassword(newPassword);
    if (!validation.valid) {
      toast.error(validation.msg);
      return;
    }

    if (!forced && oldPassword === newPassword) {
      toast.error("New password cannot be the same as old password.");
      return;
    }

    setLoading(true);
    try {
      const res = await changePassword({ oldPassword, newPassword });

      if (res.error) {
        toast.error(res.error);
        return;
      }

      if (res.token) {
        localStorage.setItem("token", res.token);
      }

      const updatedUser = {
        ...user,
        token: res.token || user?.token,
        mustChangePassword: false,
      };
      setUser(updatedUser);

      toast.success(res.msg || "Password updated successfully!");
      navigate(getRoleRoute(updatedUser.role), { replace: true });
    } catch (err) {
      toast.error(err.message || "Failed to change password.");
    } finally {
      setLoading(false);
    }
  };

  // Calculate password strength
  const getPasswordStrength = () => {
    if (!newPassword) return 0;
    let strength = 0;
    if (newPassword.length >= 8) strength++;
    if (/[A-Z]/.test(newPassword)) strength++;
    if (/[a-z]/.test(newPassword)) strength++;
    if (/[0-9]/.test(newPassword)) strength++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(newPassword)) strength++;
    return strength;
  };

  const strength = getPasswordStrength();
  const strengthColor = 
    strength <= 2 ? "#f44336" : 
    strength <= 3 ? "#ff9800" : 
    strength <= 4 ? "#2196f3" : "#4caf50";
  const strengthText = 
    strength <= 2 ? "Weak" : 
    strength <= 3 ? "Fair" : 
    strength <= 4 ? "Good" : "Strong";

  return (
    <Fade in timeout={300}>
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #e2a706 0%, #ff9633 100%)",
          p: isMobile ? 1 : 2,
        }}
      >
        <Paper
          elevation={8}
          sx={{
            width: "100%",
            maxWidth: isMobile ? 340 : 400,
            p: isMobile ? 2 : 3,
            borderRadius: isMobile ? 3 : 4,
            background: "linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)",
            position: "relative",
            overflow: "hidden",
            "&::before": {
              content: '""',
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: "4px",
              background: "linear-gradient(90deg, #FFD600, #FF9800)",
            },
          }}
        >
          {/* Decorative circles */}
          <Box
            sx={{
              position: "absolute",
              top: -30,
              right: -30,
              width: 100,
              height: 100,
              borderRadius: "50%",
              background: "rgba(255, 214, 0, 0.1)",
              pointerEvents: "none",
            }}
          />
          <Box
            sx={{
              position: "absolute",
              bottom: -40,
              left: -40,
              width: 120,
              height: 120,
              borderRadius: "50%",
              background: "rgba(255, 152, 0, 0.08)",
              pointerEvents: "none",
            }}
          />

          <Stack spacing={isMobile ? 1.5 : 2} textAlign="center">
            <Box sx={{ position: "relative", display: "inline-block", mx: "auto" }}>
              <Box
                sx={{
                  width: isMobile ? 50 : 60,
                  height: isMobile ? 50 : 60,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #FFD600, #FF9800)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 4px 14px rgba(255, 214, 0, 0.4)",
                }}
              >
                <LockIcon
                  sx={{
                    fontSize: isMobile ? 26 : 32,
                    color: "#fff",
                  }}
                />
              </Box>
            </Box>

            <Box>
              <Typography
                variant={isMobile ? "subtitle1" : "h6"}
                fontWeight={800}
                sx={{
                  fontSize: isMobile ? "1rem" : "1.1rem",
                  background: "linear-gradient(135deg, #FFD600, #FF9800)",
                  backgroundClip: "text",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                {forced ? "Set New Password" : "Change Password"}
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{
                  fontSize: isMobile ? "0.65rem" : "0.7rem",
                  mt: 0.5,
                  display: "block",
                }}
              >
                Secure your account with a strong password
              </Typography>
            </Box>

            {forced && (
              <Alert
                severity="warning"
                icon={false}
                sx={{
                  textAlign: "center",
                  py: 0.75,
                  px: 1,
                  fontSize: isMobile ? "0.7rem" : "0.75rem",
                  borderRadius: 2,
                  bgcolor: "rgba(255, 152, 0, 0.1)",
                  color: "#e65100",
                  "& .MuiAlert-message": { width: "100%" },
                }}
              >
                ⚡ First login — set a new password to continue
              </Alert>
            )}
          </Stack>

          <form onSubmit={handleSubmit}>
            <Stack spacing={isMobile ? 1.5 : 2} sx={{ mt: isMobile ? 1.5 : 2 }}>
              <TextField
                fullWidth
                size="small"
                label="Current Password"
                type={showOld ? "text" : "password"}
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                disabled={forced}
                sx={inputTheme}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        size="small"
                        onClick={() => setShowOld(!showOld)}
                        edge="end"
                      >
                        {showOld ? (
                          <VisibilityOffIcon sx={{ fontSize: 18 }} />
                        ) : (
                          <VisibilityIcon sx={{ fontSize: 18 }} />
                        )}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              
              <Box>
                <TextField
                  fullWidth
                  size="small"
                  label="New Password"
                  type={showNew ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  onBlur={() => setTouched(prev => ({ ...prev, newPassword: true }))}
                  error={touched.newPassword && validationErrors.length > 0}
                  sx={inputTheme}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          size="small"
                          onClick={() => setShowNew(!showNew)}
                          edge="end"
                        >
                          {showNew ? (
                            <VisibilityOffIcon sx={{ fontSize: 18 }} />
                          ) : (
                            <VisibilityIcon sx={{ fontSize: 18 }} />
                          )}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
                
                {/* Password strength indicator */}
                {newPassword && (
                  <Box sx={{ mt: 0.75, display: "flex", alignItems: "center", gap: 1 }}>
                    <Box sx={{ flex: 1, height: 3, bgcolor: "#e0e0e0", borderRadius: 2, overflow: "hidden" }}>
                      <Box 
                        sx={{ 
                          width: `${(strength / 5) * 100}%`, 
                          height: "100%", 
                          bgcolor: strengthColor,
                          transition: "width 0.3s ease"
                        }} 
                      />
                    </Box>
                    <Typography variant="caption" sx={{ fontSize: "0.65rem", color: strengthColor, fontWeight: 600, minWidth: 35 }}>
                      {strengthText}
                    </Typography>
                  </Box>
                )}
                
                {touched.newPassword && validationErrors.length > 0 && (
                  <FormHelperText error sx={{ mt: 0.5, fontSize: "0.65rem", display: "flex", alignItems: "center", gap: 0.5, flexWrap: "wrap" }}>
                    <CancelIcon sx={{ fontSize: 14 }} />
                    {validationErrors.map((err, idx) => (
                      <span key={idx}>
                        {idx > 0 ? " • " : ""}
                        {err}
                      </span>
                    ))}
                  </FormHelperText>
                )}
                {touched.newPassword && newPassword && validationErrors.length === 0 && (
                  <FormHelperText sx={{ mt: 0.5, fontSize: "0.65rem", color: "#4caf50", display: "flex", alignItems: "center", gap: 0.5 }}>
                    <CheckCircleIcon sx={{ fontSize: 14 }} />
                    Strong password!
                  </FormHelperText>
                )}
              </Box>
              
              <TextField
                fullWidth
                size="small"
                label="Confirm Password"
                type={showConfirm ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onBlur={() => setTouched(prev => ({ ...prev, confirmPassword: true }))}
                error={touched.confirmPassword && confirmPassword !== "" && newPassword !== confirmPassword}
                helperText={touched.confirmPassword && confirmPassword !== "" && newPassword !== confirmPassword ? "✗ Passwords don't match" : " "}
                sx={inputTheme}
                FormHelperTextProps={{ sx: { fontSize: "0.65rem", mx: 0 } }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        size="small"
                        onClick={() => setShowConfirm(!showConfirm)}
                        edge="end"
                      >
                        {showConfirm ? (
                          <VisibilityOffIcon sx={{ fontSize: 18 }} />
                        ) : (
                          <VisibilityIcon sx={{ fontSize: 18 }} />
                        )}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <Stack direction="row" spacing={1.5} sx={{ mt: 0.5 }}>
                <Button
                  type="button"
                  variant="outlined"
                  fullWidth
                  onClick={handleCancel}
                  sx={{
                    py: 0.75,
                    borderRadius: "40px",
                    fontWeight: 600,
                    fontSize: isMobile ? "0.75rem" : "0.8rem",
                    borderColor: "#FFD600",
                    color: "#666",
                    textTransform: "none",
                    "&:hover": {
                      borderColor: "#e6c400",
                      bgcolor: "rgba(255, 214, 0, 0.08)",
                    },
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  disabled={isUpdateDisabled()}
                  sx={{
                    py: 0.75,
                    borderRadius: "40px",
                    fontWeight: 700,
                    fontSize: isMobile ? "0.75rem" : "0.8rem",
                    background: "linear-gradient(135deg, #FFD600, #FF9800)",
                    color: "#000",
                    textTransform: "none",
                    boxShadow: "0 2px 8px rgba(255, 214, 0, 0.3)",
                    "&:hover": {
                      background: "linear-gradient(135deg, #e6c400, #e68900)",
                      boxShadow: "0 4px 12px rgba(255, 214, 0, 0.4)",
                    },
                    "&.Mui-disabled": {
                      background: "#e0e0e0",
                      color: "#999",
                    },
                  }}
                >
                  {loading ? "Updating..." : "Update Password"}
                </Button>
              </Stack>
            </Stack>
          </form>
        </Paper>
      </Box>
    </Fade>
  );
};

export default ChangePassword;