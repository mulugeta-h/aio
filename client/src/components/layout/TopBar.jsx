import React, { useContext, useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Avatar,
  Box,
  useTheme,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Alert,
  Stack,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew';
import LockResetIcon from '@mui/icons-material/LockReset';
import PersonIcon from '@mui/icons-material/Person';
import BadgeIcon from '@mui/icons-material/Badge';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';

import { useNavigate } from 'react-router-dom';
import { UserContext } from '../../context/UserContext';
import axios from 'axios';

// VITE: Changed from process.env.REACT_APP_API_URL to import.meta.env.VITE_API_URL
const BASE_URL = `${import.meta.env.VITE_API_URL}/api/user`;

// White Dialog Style
const whiteDialog = {
  "& .MuiPaper-root": {
    bgcolor: "#ffffff",
    border: "2px solid #DAA520",
    color: "#000000",
    minWidth: "400px",
    borderRadius: "12px",
  },
};

const whiteInput = {
  mb: 2,
  "& .MuiOutlinedInput-root": {
    color: "#000000",
    backgroundColor: "#ffffff",
    "& fieldset": { borderColor: "#e0e0e0" },
    "&:hover fieldset": { borderColor: "#DAA520" },
    "&.Mui-focused fieldset": { borderColor: "#DAA520" },
  },
  "& .MuiInputLabel-root": { color: "#666666" },
};

// Scrollbar styles
const scrollbarStyles = `
  /* width */
  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  /* Track */
  ::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 4px;
  }

  /* Handle */
  ::-webkit-scrollbar-thumb {
    background: #DAA520;
    border-radius: 4px;
  }

  /* Handle on hover */
  ::-webkit-scrollbar-thumb:hover {
    background: #B8860B;
  }
`;

const TopBar = ({ title, isMobile, onMenuClick, sidebarWidth = 0 }) => {
  const { user, setUser } = useContext(UserContext);
  const navigate = useNavigate();
  const theme = useTheme();

  const [anchorEl, setAnchorEl] = useState(null);
  const [openPwdDialog, setOpenPwdDialog] = useState(false);
  const [pwdForm, setPwdForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
    setTimeout(() => setSnackbar({ open: false, message: '', severity: 'success' }), 3000);
  };

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setUser(null);
    navigate('/login', { replace: true });
    handleMenuClose();
  };

  const handleChangePassword = async () => {
    const { oldPassword, newPassword, confirmPassword } = pwdForm;

    if (!oldPassword || !newPassword || !confirmPassword) {
      showSnackbar('All security fields are required', 'error');
      return;
    }

    if (newPassword !== confirmPassword) {
      showSnackbar('Key mismatch: Verification failed', 'error');
      return;
    }

    if (newPassword.length < 6) {
      showSnackbar('Password must be at least 6 characters', 'error');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const res = await axios.patch(
        `${BASE_URL}/change-password`,
        { oldPassword, newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      showSnackbar(res.data.msg || 'Security Key Updated', 'success');
      setOpenPwdDialog(false);
      setPwdForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      showSnackbar(err.response?.data?.msg || 'Protocol Failure: Change Rejected', 'error');
    }
  };

  // Get user data from context
  const userName = user?.name || user?.fullName || 'N/A';
  const userUsername = user?.username || user?.userName || 'N/A';
  const userRole = user?.role || user?.userRole || 'User';

  return (
    <>
      <style>{scrollbarStyles}</style>

      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          bgcolor: '#ffffff',
          borderBottom: `1px solid ${theme.palette.primary.main}`,
          color: '#000000',
          width: '100%',
        }}
      >
        <Toolbar
          sx={{
            minHeight: 60,
            height: 60,
            px: { xs: 2, sm: 3 },
            position: 'relative',
          }}
        >
          {/* Mobile menu button */}
          {isMobile && (
            <IconButton
              edge="start"
              onClick={onMenuClick}
              sx={{
                color: theme.palette.primary.main,
                mr: 2,
                width: 40,
                height: 40,
                p: 0,
              }}
            >
              <MenuIcon sx={{ fontSize: 24 }} />
            </IconButton>
          )}

          {/* Title */}
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              color: '#000000',
              lineHeight: 1.2,
              ...(!isMobile && {
                ml: `${sidebarWidth}px`,
                transition: 'margin-left 0.25s ease-in-out',
              }),
              flexGrow: 1,
            }}
          >
            {title}
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {/* Profile Icon with Menu */}
            <IconButton
              onClick={handleMenuOpen}
              sx={{
                p: 0,
              }}
            >
              <Avatar
                sx={{
                  bgcolor: '#DAA520',
                  color: '#000000',
                  width: 40,
                  height: 40,
                }}
              >
                {userUsername !== 'N/A' ? userUsername.charAt(0).toUpperCase() : <AccountCircleIcon />}
              </Avatar>
            </IconButton>

            {/* Username - show display name */}
            <Typography
              variant="body1"
              sx={{
                color: '#000000',
                fontWeight: 500,
                display: { xs: 'none', sm: 'block' }
              }}
            >
              {userUsername !== 'N/A' ? `(${userUsername})` : '(User)'}
            </Typography>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Profile Menu - White with Black Text */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        PaperProps={{
          sx: {
            mt: 1,
            width: 320,
            bgcolor: '#ffffff',
            border: `1px solid #DAA520`,
            borderRadius: 2,
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          }
        }}
      >
        {/* User Info Header */}
        <Box sx={{ px: 2, py: 2, bgcolor: '#f5f5f5', borderBottom: '1px solid #e0e0e0' }}>
          <Box display="flex" alignItems="center" gap={2} mb={1.5}>
            <Avatar sx={{ bgcolor: '#DAA520', color: '#000000', width: 50, height: 50 }}>
              {userUsername !== 'N/A' ? userUsername.charAt(0).toUpperCase() : <AccountCircleIcon sx={{ fontSize: 30 }} />}
            </Avatar>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#000000' }}>
                {userName !== 'N/A' ? userName : userUsername}
              </Typography>
              <Typography variant="caption" sx={{ color: '#DAA520', fontWeight: 500 }}>
                {userRole}
              </Typography>
            </Box>
          </Box>
          
          <Divider sx={{ my: 1.5, borderColor: '#e0e0e0' }} />
          
          <Box display="flex" flexDirection="column" gap={1}>
            {/* Username */}
            <Box display="flex" alignItems="center" gap={1}>
              <BadgeIcon sx={{ color: '#DAA520', fontSize: 16 }} />
              <Typography variant="caption" sx={{ color: '#666666' }}>
                Username: <span style={{ color: '#000000', fontWeight: 600 }}>{userUsername}</span>
              </Typography>
            </Box>
            
            {/* Name */}
            <Box display="flex" alignItems="center" gap={1}>
              <PersonIcon sx={{ color: '#DAA520', fontSize: 16 }} />
              <Typography variant="caption" sx={{ color: '#666666' }}>
                Name: <span style={{ color: '#000000', fontWeight: 600 }}>{userName}</span>
              </Typography>
            </Box>
            
            {/* Role */}
            <Box display="flex" alignItems="center" gap={1}>
              <PersonIcon sx={{ color: '#DAA520', fontSize: 16 }} />
              <Typography variant="caption" sx={{ color: '#666666' }}>
                Role: <span style={{ color: '#000000', fontWeight: 600 }}>{userRole}</span>
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Menu Items */}
        <MenuItem
          onClick={() => { handleMenuClose(); setOpenPwdDialog(true); }}
          sx={{
            py: 1.5,
            '&:hover': { bgcolor: 'rgba(218, 165, 32, 0.1)' }
          }}
        >
          <ListItemIcon>
            <LockResetIcon sx={{ color: '#DAA520' }} />
          </ListItemIcon>
          <ListItemText
            primary="Change Password"
            primaryTypographyProps={{ sx: { color: '#000000', fontWeight: 500 } }}
          />
        </MenuItem>

        <Divider sx={{ borderColor: '#e0e0e0' }} />

        <MenuItem
          onClick={handleLogout}
          sx={{
            py: 1.5,
            '&:hover': { bgcolor: 'rgba(255, 68, 68, 0.1)' }
          }}
        >
          <ListItemIcon>
            <PowerSettingsNewIcon sx={{ color: '#ff4444' }} />
          </ListItemIcon>
          <ListItemText
            primary="Logout"
            primaryTypographyProps={{ sx: { color: '#ff4444', fontWeight: 500 } }}
          />
        </MenuItem>
      </Menu>

      {/* Security Dialog - White Body, Black Text */}
      <Dialog open={openPwdDialog} onClose={() => setOpenPwdDialog(false)} sx={whiteDialog}>
        <DialogTitle sx={{ color: "#DAA520", bgcolor: "#ffffff", fontWeight: "bold", borderBottom: "1px solid #e0e0e0" }}>
          CHANGE YOUR PASSWORD
        </DialogTitle>
        <DialogContent sx={{ mt: 2, bgcolor: "#ffffff" }}>
          <Stack spacing={2} mt={1}>
            <TextField
              label="Old Password"
              type="password"
              fullWidth
              size="small"
              sx={whiteInput}
              value={pwdForm.oldPassword}
              onChange={(e) => setPwdForm({ ...pwdForm, oldPassword: e.target.value })}
            />
            <TextField
              label="New Password"
              type="password"
              fullWidth
              size="small"
              sx={whiteInput}
              value={pwdForm.newPassword}
              onChange={(e) => setPwdForm({ ...pwdForm, newPassword: e.target.value })}
            />
            <TextField
              label="Verify Password"
              type="password"
              fullWidth
              size="small"
              sx={whiteInput}
              value={pwdForm.confirmPassword}
              onChange={(e) => setPwdForm({ ...pwdForm, confirmPassword: e.target.value })}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3, gap: 2, bgcolor: "#ffffff", borderTop: "1px solid #e0e0e0" }}>
          <Button
            onClick={() => {
              setOpenPwdDialog(false);
              setPwdForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
            }}
            sx={{ color: "#666666", textTransform: "none" }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleChangePassword}
            sx={{ bgcolor: "#DAA520", color: "#000000", textTransform: "none", fontWeight: "bold", "&:hover": { bgcolor: "#B8860B" } }}
          >
            Update Password
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      {snackbar.open && (
        <Alert
          severity={snackbar.severity}
          sx={{
            position: 'fixed',
            bottom: 20,
            right: 20,
            zIndex: 9999,
            bgcolor: '#ffffff',
            color: '#000000',
            border: `1px solid ${snackbar.severity === 'success' ? '#DAA520' : '#ff4444'}`,
          }}
        >
          {snackbar.message}
        </Alert>
      )}
    </>
  );
};

export default TopBar;