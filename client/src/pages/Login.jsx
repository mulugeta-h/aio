import React, { useState, useContext, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../context/UserContext";

import {
  TextField,
  InputAdornment,
  IconButton,
  Button,
  Box,
  Avatar,
  Typography,
  Fade,
  Modal,
  Stack,
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import LockIcon from "@mui/icons-material/Lock";
import LoginIcon from "@mui/icons-material/Login";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import CircleIcon from "@mui/icons-material/Circle";
import CloseIcon from "@mui/icons-material/Close";
import PersonIcon from "@mui/icons-material/Person";
import KeyIcon from "@mui/icons-material/Key";

import { login } from "../api/authApi";

const Login = () => {
  const navigate = useNavigate();
  const { setUser } = useContext(UserContext);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);

  const slides = [
    {
      img: "https://images.unsplash.com/photo-1501167786227-4cba60f6d58f?w=1200&q=80",
      title: "SECURE BANKING",
      desc: "Enterprise-grade security for all your financial transactions and data protection.",
    },
    {
      img: "https://images.unsplash.com/photo-1556742031-c6961e8560b0?w=1200&q=80",
      title: "REAL-TIME TRANSACTIONS",
      desc: "Instant payment processing with real-time monitoring and fraud detection.",
    },
    {
      img: "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=1200&q=80",
      title: "FRAUD PROTECTION",
      desc: "Advanced AI-powered fraud detection system protecting your assets 24/7.",
    },
    {
      img: "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=1200&q=80",
      title: "DIGITAL BANKING",
      desc: "Seamless online banking experience with mobile and web platforms.",
    },
    {
      img: "https://images.unsplash.com/photo-1553729459-efe14ef6055d?w=1200&q=80",
      title: "INVESTMENT SOLUTIONS",
      desc: "Smart investment tools and portfolio management for maximum returns.",
    },
    {
      img: "https://images.unsplash.com/photo-1462206092226-f46025ffe607?w=1200&q=80",
      title: "GLOBAL BANKING",
      desc: "International wire transfers and multi-currency accounts for global business.",
    },
  ];

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  }, [slides.length]);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  }, [slides.length]);

  const togglePasswordVisibility = useCallback(() => {
    setShowPassword((prev) => !prev);
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await login({ username, password });

      console.log("Login response:", res);

      if (res.error) {
        toast.error(res.error);
        setLoading(false);
        return;
      }

      if (!res.token) {
        toast.error("No token received from server");
        setLoading(false);
        return;
      }

      localStorage.setItem("token", res.token);

      const tokenPayload = JSON.parse(atob(res.token.split(".")[1]));

      console.log("Token payload:", tokenPayload);

      const userData = {
        id: tokenPayload.id,
        name: tokenPayload.name,
        username: tokenPayload.username,
        role: tokenPayload.role,
        token: res.token,
        mustChangePassword: tokenPayload.mustChangePassword || false,
      };

      console.log("Setting user data:", userData);
      setUser(userData);

      if (tokenPayload.mustChangePassword) {
        toast.info("Please change your password before continuing.");
        setModalOpen(false);
        navigate("/change-password", { replace: true });
        return;
      }

      toast.success(`Welcome ${userData.name || userData.username}!`);

      const routes = {
        SUPER_ADMIN: "/dashboard",
        ADMIN: "/dashboard",
      };

      const targetRoute = routes[tokenPayload.role] || "/dashboard";
      navigate(targetRoute, { replace: true });
      setModalOpen(false);
    } catch (error) {
      console.error("Login error:", error);
      toast.error(error.message || "Auth System Failure");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    window.history.pushState(null, "", window.location.href);
    const handlePopState = () => {
      window.history.pushState(null, "", window.location.href);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: { xs: "column", md: "row" },
        minHeight: "100vh",
        backgroundColor: "#FFFFFF",
      }}
    >
      {/* Slider - Fullscreen on mobile, 60% on desktop */}
      <Box
        sx={{
          width: { xs: "100%", md: "60%" },
          height: { xs: "100vh", md: "auto" },
          backgroundColor: "#FFFFFF",
          position: "relative",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          display: "flex",
        }}
      >
        {slides.map((slide, index) => (
          <Fade in={currentSlide === index} key={index} timeout={800}>
            <Box
              sx={{
                position: "absolute",
                inset: 0,
                backgroundImage: `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url(${slide.img})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            />
          </Fade>
        ))}

        {/* Navigation arrows */}
        <IconButton
          onClick={prevSlide}
          sx={{
            position: "absolute",
            left: { xs: 8, md: 20 },
            top: "50%",
            transform: "translateY(-50%)",
            color: "#fff",
            bgcolor: "rgba(0,0,0,0.5)",
            "&:hover": { bgcolor: "#DAA520", color: "#000" },
            zIndex: 10,
          }}
        >
          <ArrowBackIosNewIcon fontSize="small" />
        </IconButton>
        <IconButton
          onClick={nextSlide}
          sx={{
            position: "absolute",
            right: { xs: 8, md: 20 },
            top: "50%",
            transform: "translateY(-50%)",
            color: "#fff",
            bgcolor: "rgba(0,0,0,0.5)",
            "&:hover": { bgcolor: "#DAA520", color: "#000" },
            zIndex: 10,
          }}
        >
          <ArrowForwardIosIcon fontSize="small" />
        </IconButton>

        {/* Slide Content */}
        <Box
          sx={{
            position: "relative",
            zIndex: 2,
            maxWidth: 600,
            p: { xs: 2, md: 6 },
            pt: { xs: 8, md: 6 },
            borderRadius: { xs: "16px", md: "24px" },
            backgroundColor: "rgba(255,255,255,0.9)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(255, 255, 255, 0.5)",
            boxShadow: "0 15px 35px rgba(0,0,0,0.1)",
            textAlign: "center",
            mx: { xs: 2, md: 0 },
            mt: { xs: -4, md: 0 },
          }}
        >
          <Typography
            variant="overline"
            sx={{
              color: { xs: "#333", md: "#888" },
              fontWeight: 800,
              letterSpacing: { xs: 4, md: 6 },
              display: "block",
              mb: 1,
              fontSize: { xs: "0.6rem", md: "0.9rem" },
            }}
          >
            ANBESA BANK S.C.
          </Typography>

          <Typography
            variant="h2"
            fontWeight={900}
            sx={{
              color: "#111",
              mb: 1.5,
              textTransform: "uppercase",
              lineHeight: 1.1,
              fontSize: { xs: "1.4rem", md: "2.8rem" },
            }}
          >
            {slides[currentSlide].title}
          </Typography>

          <Typography
            variant="body1"
            sx={{
              color: "#333",
              mb: { xs: 2.5, md: 4 },
              fontWeight: 500,
              lineHeight: 1.4,
              fontSize: { xs: "0.75rem", md: "1rem" },
            }}
          >
            {slides[currentSlide].desc}
          </Typography>

          {/* Dot indicators */}
          <Box
            sx={{
              display: "flex",
              gap: 1.5,
              justifyContent: "center",
              mb: { xs: 2.5, md: 0 },
            }}
          >
            {slides.map((_, index) => (
              <CircleIcon
                key={index}
                onClick={() => setCurrentSlide(index)}
                sx={{
                  fontSize: { xs: 7, md: 10 },
                  cursor: "pointer",
                  color:
                    currentSlide === index ? "#DAA520" : "rgba(0,0,0,0.2)",
                  transition: "0.3s",
                  "&:hover": { color: "#DAA520" },
                }}
              />
            ))}
          </Box>

          {/* SIGN IN BUTTON - Only visible on mobile */}
          <Button
            variant="contained"
            fullWidth
            onClick={() => setModalOpen(true)}
            endIcon={<LoginIcon />}
            sx={{
              display: { xs: "flex", md: "none" },
              mt: 1.5,
              py: 1.5,
              borderRadius: "50px",
              fontSize: "0.9rem",
              fontWeight: "900",
              color: "#000",
              backgroundColor: "#DAA520",
              boxShadow: "0 8px 20px rgba(218, 165, 32, 0.4)",
              "&:hover": {
                backgroundColor: "#B8860B",
              },
            }}
          >
            SIGN IN
          </Button>
        </Box>
      </Box>

      {/* Login Form - Desktop */}
      <Box
        sx={{
          display: { xs: "none", md: "flex" },
          width: "40%",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#FFFFFF",
          p: { md: 6 },
        }}
      >
        <Fade in timeout={1000}>
          <Box sx={{ width: "100%", maxWidth: 420, textAlign: "center" }}>
            <Avatar
              sx={{
                width: 90,
                height: 90,
                margin: "0 auto 28px",
                border: "4px solid #DAA520",
                background: "#DAA520",
                color: "#000000",
                fontSize: "2rem",
                fontWeight: "bold",
              }}
            >
              አንበሳ
            </Avatar>
            <Typography
              variant="h4"
              fontWeight={900}
              sx={{
                color: "#000",
                mb: 1,
                letterSpacing: -1,
                fontSize: "2.2rem",
              }}
            >
              WELCOME BACK
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: "#BBB",
                fontWeight: 700,
                mb: 5,
                letterSpacing: 1.5,
                fontSize: "0.8rem",
              }}
            >
              SIGN IN TO YOUR ACCOUNT
            </Typography>

            <form onSubmit={handleLogin}>
              <TextField
                fullWidth
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase())}
                margin="normal"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonIcon sx={{ color: "#DAA520", fontSize: 24 }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <PersonIcon sx={{ color: "#DAA520", fontSize: 20, opacity: 0.3 }} />
                    </InputAdornment>
                  ),
                }}
                sx={inputTheme}
              />

              {/* Password field with icon outside */}
              <Box sx={{ position: "relative", mt: 1 }}>
                <TextField
                  fullWidth
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  margin="normal"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <KeyIcon sx={{ color: "#DAA520", fontSize: 24 }} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <KeyIcon sx={{ color: "#DAA520", fontSize: 20, opacity: 0.3 }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    ...inputTheme,
                    "& .MuiOutlinedInput-root": {
                      ...inputTheme["& .MuiOutlinedInput-root"],
                      paddingRight: "56px !important",
                    },
                  }}
                />
                <IconButton
                  onClick={togglePasswordVisibility}
                  onMouseDown={(e) => e.preventDefault()}
                  sx={{
                    position: "absolute",
                    right: 12,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#DAA520",
                    zIndex: 1,
                  }}
                >
                  {showPassword ? (
                    <VisibilityOffIcon sx={{ color: "#DAA520" }} />
                  ) : (
                    <VisibilityIcon sx={{ color: "#DAA520" }} />
                  )}
                </IconButton>
              </Box>

              {/* Login Button - Sharp corners, small, aligned right */}
              <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 4 }}>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={loading}
                  sx={{
                    py: 1.2,
                    px: 4,
                    borderRadius: 0,
                    fontSize: "0.85rem",
                    fontWeight: "700",
                    color: "#000",
                    backgroundColor: "#DAA520",
                    minWidth: 120,
                    textTransform: "uppercase",
                    letterSpacing: 1,
                    "&:hover": {
                      backgroundColor: "#B8860B",
                    },
                  }}
                >
                  {loading ? "..." : "Login"}
                </Button>
              </Box>
            </form>
          </Box>
        </Fade>
      </Box>

      {/* Mobile Login Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          p: { xs: 2, sm: 3, md: 4 },
        }}
      >
        <Box
          sx={{
            position: "relative",
            width: "100%",
            maxWidth: 450,
            bgcolor: "#FFFFFF",
            borderRadius: 5,
            boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
            p: { xs: 3, sm: 4, md: 5 },
            outline: "none",
            maxHeight: { xs: "90vh", sm: "85vh" },
            overflowY: "auto",
            mx: { xs: 2, sm: 3 },
            my: { xs: 2, sm: 3 },
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Close Button */}
          <IconButton
            onClick={() => setModalOpen(false)}
            sx={{
              position: "absolute",
              right: 8,
              top: 8,
              color: "#666",
              zIndex: 1,
              "&:hover": {
                color: "#DAA520",
              },
            }}
          >
            <CloseIcon sx={{ fontSize: { xs: 22, sm: 26 } }} />
          </IconButton>

          <Box
            sx={{
              textAlign: "center",
              mt: { xs: 1, sm: 2 },
              flex: 1,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
            }}
          >
            <Avatar
              sx={{
                width: { xs: 80, sm: 90, md: 100 },
                height: { xs: 80, sm: 90, md: 100 },
                margin: "0 auto 20px",
                border: "4px solid #DAA520",
                background: "#DAA520",
                color: "#000000",
                fontSize: { xs: "2rem", sm: "2.5rem" },
                fontWeight: "bold",
                display: "flex",
              }}
            >
              አ
            </Avatar>
            <Typography
              variant="h5"
              fontWeight={900}
              sx={{
                color: "#000",
                mb: 1,
                letterSpacing: -0.5,
                fontSize: { xs: "1.6rem", sm: "1.8rem", md: "2rem" },
                mt: 0,
              }}
            >
              WELCOME BACK
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: "#BBB",
                fontWeight: 700,
                mb: { xs: 3, sm: 4, md: 5 },
                display: "block",
                letterSpacing: 1.5,
                fontSize: { xs: "0.7rem", sm: "0.75rem", md: "0.8rem" },
              }}
            >
              SIGN IN TO YOUR ACCOUNT
            </Typography>

            <form onSubmit={handleLogin} style={{ flex: 1 }}>
              <TextField
                fullWidth
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase())}
                margin="normal"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonIcon
                        sx={{
                          color: "#DAA520",
                          fontSize: { xs: 22, sm: 24 },
                        }}
                      />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <PersonIcon
                        sx={{
                          color: "#DAA520",
                          fontSize: { xs: 18, sm: 20 },
                          opacity: 0.3,
                        }}
                      />
                    </InputAdornment>
                  ),
                }}
                sx={mobileInputTheme}
              />

              {/* Mobile Password field with icon outside */}
              <Box sx={{ position: "relative", mt: 1 }}>
                <TextField
                  fullWidth
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  margin="normal"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <KeyIcon
                          sx={{
                            color: "#DAA520",
                            fontSize: { xs: 22, sm: 24 },
                          }}
                        />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <KeyIcon
                          sx={{
                            color: "#DAA520",
                            fontSize: { xs: 18, sm: 20 },
                            opacity: 0.3,
                          }}
                        />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    ...mobileInputTheme,
                    "& .MuiOutlinedInput-root": {
                      ...mobileInputTheme["& .MuiOutlinedInput-root"],
                      paddingRight: "52px !important",
                    },
                  }}
                />
                <IconButton
                  onClick={togglePasswordVisibility}
                  onMouseDown={(e) => e.preventDefault()}
                  sx={{
                    position: "absolute",
                    right: 10,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#DAA520",
                    zIndex: 1,
                  }}
                >
                  {showPassword ? (
                    <VisibilityOffIcon
                      sx={{
                        color: "#DAA520",
                        fontSize: { xs: 18, sm: 20 },
                      }}
                    />
                  ) : (
                    <VisibilityIcon
                      sx={{
                        color: "#DAA520",
                        fontSize: { xs: 18, sm: 20 },
                      }}
                    />
                  )}
                </IconButton>
              </Box>

              {/* Mobile Login Button - Sharp corners, small, right aligned */}
              <Box sx={{ display: "flex", justifyContent: "flex-end", mt: { xs: 3, sm: 4 } }}>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={loading}
                  sx={{
                    py: { xs: 1.2, sm: 1.5 },
                    px: { xs: 3, sm: 4 },
                    borderRadius: 0,
                    fontSize: { xs: "0.8rem", sm: "0.85rem" },
                    fontWeight: "700",
                    color: "#000",
                    backgroundColor: "#DAA520",
                    minWidth: { xs: 100, sm: 120 },
                    textTransform: "uppercase",
                    letterSpacing: 1,
                    "&:hover": {
                      backgroundColor: "#B8860B",
                    },
                  }}
                >
                  {loading ? "..." : "Login"}
                </Button>
              </Box>
            </form>
          </Box>
        </Box>
      </Modal>
    </Box>
  );
};

const inputTheme = {
  "& .MuiOutlinedInput-root": {
    color: "#000",
    backgroundColor: "#FDFDFD",
    borderRadius: "50px",
    fontWeight: "bold",
    fontSize: "1rem",
    "& fieldset": { borderColor: "#EEE" },
    "&:hover fieldset": { borderColor: "#DAA520" },
    "&.Mui-focused fieldset": { borderColor: "#DAA520", borderWidth: "2px" },
  },
};

const mobileInputTheme = {
  "& .MuiOutlinedInput-root": {
    color: "#000",
    backgroundColor: "#FDFDFD",
    borderRadius: "50px",
    fontWeight: "bold",
    fontSize: { xs: "0.9rem", sm: "1rem", md: "1.1rem" },
    "& fieldset": { borderColor: "#EEE" },
    "&:hover fieldset": { borderColor: "#DAA520" },
    "&.Mui-focused fieldset": { borderColor: "#DAA520", borderWidth: "2px" },
  },
};

export default Login;