// pages/superAdmin/AdminManagement.jsx
import React, { useState, useEffect } from "react";
import {
  Box,
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  InputAdornment,
  Chip,
  Grid,
  Pagination,
  CircularProgress,
  useMediaQuery,
  useTheme,
  Button,
  Tooltip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar,
  Switch,
  FormControlLabel,
  Avatar,
  Stack,
  TablePagination,
} from "@mui/material";
import {
  Search as SearchIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Close as CloseIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  ToggleOn as ToggleOnIcon,
  ToggleOff as ToggleOffIcon,
  LockReset as LockResetIcon,
  Download as DownloadIcon,
  History as HistoryIcon,
  AdminPanelSettings as AdminIcon,
  Security as SecurityIcon,
} from "@mui/icons-material";
import axios from "axios";

const API_URL = `${import.meta.env.VITE_API_URL}/api/admin`;

const AdminManagement = () => {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalAdmins, setTotalAdmins] = useState(0);
  const [error, setError] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [showSessions, setShowSessions] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  
  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState("create");
  const [formData, setFormData] = useState({
    username: "",
    name: "",
    password: "",
    enabled: true,
    role: "ADMIN",
  });
  
  // Password reset dialog
  const [resetPasswordOpen, setResetPasswordOpen] = useState(false);
  const [resetAdmin, setResetAdmin] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  
  // Delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteAdmin, setDeleteAdmin] = useState(null);
  
  // Snackbar
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success"
  });

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const getContainerMargin = () => {
    if (isMobile) return "0px";
    return "84px";
  };

  const getContainerWidth = () => {
    if (isMobile) return "100%";
    return "calc(100% - 96px)";
  };

  // Get current user from token
  const getCurrentUser = () => {
    try {
      const token = localStorage.getItem("token");
      if (token) {
        const user = JSON.parse(atob(token.split(".")[1]));
        setCurrentUser(user);
        return user;
      }
    } catch (err) {
      console.error("Error parsing token:", err);
    }
    return null;
  };

  // Check if admin is SUPER_ADMIN
  const isSuperAdmin = (admin) => {
    return admin?.role === "SUPER_ADMIN";
  };

  // Check if current user is SUPER_ADMIN
  const isCurrentUserSuperAdmin = () => {
    return currentUser?.role === "SUPER_ADMIN";
  };

  // Fetch admins
  const fetchAdmins = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("token");
      
      const response = await axios.get(
        `${API_URL}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      const adminData = response.data.data || [];
      setAdmins(adminData);
      setTotalAdmins(adminData.length);
    } catch (error) {
      console.error("Error fetching admins:", error);
      setError(error.response?.data?.message || "Failed to fetch admins");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getCurrentUser();
    fetchAdmins();
  }, []);

  // Handle search
  const filteredAdmins = admins.filter(admin => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      admin.username?.toLowerCase().includes(search) ||
      admin.name?.toLowerCase().includes(search) ||
      admin.role?.toLowerCase().includes(search)
    );
  });

  // Handle pagination change
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Handle form input change
  const handleFormChange = (e) => {
    const { name, value, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === "enabled" ? checked : value
    }));
  };

  // Open create dialog
  const handleOpenCreate = () => {
    setDialogMode("create");
    setFormData({
      username: "",
      name: "",
      password: "",
      enabled: true,
      role: "ADMIN",
    });
    setDialogOpen(true);
  };

  // Open edit dialog
  const handleOpenEdit = (admin) => {
    // Prevent editing SUPER_ADMIN
    if (isSuperAdmin(admin)) {
      setSnackbar({
        open: true,
        message: "Cannot edit SUPER_ADMIN accounts",
        severity: "warning"
      });
      return;
    }
    
    setDialogMode("edit");
    setFormData({
      username: admin.username || "",
      name: admin.name || "",
      enabled: admin.enabled !== undefined ? admin.enabled : true,
      role: admin.role || "ADMIN",
    });
    setSelectedAdmin(admin);
    setDialogOpen(true);
  };

  // Close dialog
  const handleDialogClose = () => {
    setDialogOpen(false);
    setFormData({
      username: "",
      name: "",
      password: "",
      enabled: true,
      role: "ADMIN",
    });
    setSelectedAdmin(null);
  };

  // Submit form (create/update)
  const handleSubmit = async () => {
    try {
      const token = localStorage.getItem("token");
      
      if (dialogMode === "create") {
        if (!formData.username || !formData.name || !formData.password) {
          setSnackbar({
            open: true,
            message: "Username, name, and password are required",
            severity: "error"
          });
          return;
        }
        
        await axios.post(
          API_URL,
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        setSnackbar({
          open: true,
          message: "Admin created successfully",
          severity: "success"
        });
      } else {
        await axios.put(
          `${API_URL}/${selectedAdmin.id}`,
          {
            username: formData.username,
            name: formData.name,
            enabled: formData.enabled,
            role: formData.role,
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        setSnackbar({
          open: true,
          message: "Admin updated successfully",
          severity: "success"
        });
      }
      
      handleDialogClose();
      fetchAdmins();
    } catch (error) {
      console.error("Error saving admin:", error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || "Failed to save admin",
        severity: "error"
      });
    }
  };

  // Toggle admin status
  const handleToggleStatus = async (admin) => {
    // Prevent toggling SUPER_ADMIN
    if (isSuperAdmin(admin)) {
      setSnackbar({
        open: true,
        message: "Cannot toggle status of SUPER_ADMIN accounts",
        severity: "warning"
      });
      return;
    }
    
    try {
      const token = localStorage.getItem("token");
      const response = await axios.patch(
        `${API_URL}/${admin.id}/toggle`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setSnackbar({
        open: true,
        message: `Admin ${response.data.data.enabled ? 'enabled' : 'disabled'} successfully`,
        severity: "success"
      });
      
      fetchAdmins();
    } catch (error) {
      console.error("Error toggling status:", error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || "Failed to toggle status",
        severity: "error"
      });
    }
  };

  // Open reset password dialog
  const handleOpenResetPassword = (admin) => {
    // Prevent resetting SUPER_ADMIN password
    if (isSuperAdmin(admin)) {
      setSnackbar({
        open: true,
        message: "Cannot reset password for SUPER_ADMIN accounts",
        severity: "warning"
      });
      return;
    }
    
    setResetAdmin(admin);
    setNewPassword("");
    setResetPasswordOpen(true);
  };

  // Reset password
  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      setSnackbar({
        open: true,
        message: "Password must be at least 6 characters",
        severity: "error"
      });
      return;
    }

    try {
      const token = localStorage.getItem("token");
      await axios.patch(
        `${API_URL}/${resetAdmin.id}/reset-password`,
        { newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setSnackbar({
        open: true,
        message: "Password reset successfully",
        severity: "success"
      });
      
      setResetPasswordOpen(false);
      setResetAdmin(null);
      setNewPassword("");
    } catch (error) {
      console.error("Error resetting password:", error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || "Failed to reset password",
        severity: "error"
      });
    }
  };

  // Open delete dialog
  const handleOpenDelete = (admin) => {
    // Prevent deleting SUPER_ADMIN
    if (isSuperAdmin(admin)) {
      setSnackbar({
        open: true,
        message: "Cannot delete SUPER_ADMIN accounts",
        severity: "warning"
      });
      return;
    }
    
    setDeleteAdmin(admin);
    setDeleteDialogOpen(true);
  };

  // Delete admin
  const handleDelete = async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(
        `${API_URL}/${deleteAdmin.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setSnackbar({
        open: true,
        message: "Admin deleted successfully",
        severity: "success"
      });
      
      setDeleteDialogOpen(false);
      setDeleteAdmin(null);
      fetchAdmins();
    } catch (error) {
      console.error("Error deleting admin:", error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || "Failed to delete admin",
        severity: "error"
      });
    }
  };

  // View sessions
  const handleViewSessions = async (admin) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${API_URL}/${admin.id}/sessions`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSessions(response.data.data || []);
      setSelectedAdmin(admin);
      setShowSessions(true);
    } catch (error) {
      console.error("Error fetching sessions:", error);
      setSnackbar({
        open: true,
        message: "Failed to fetch sessions",
        severity: "error"
      });
    }
  };

  // Export to CSV
  const exportToCSV = () => {
    if (admins.length === 0) return;
    
    const headers = [
      "ID",
      "Username",
      "Name",
      "Role",
      "Status",
      "Created By",
      "Created At"
    ];

    const rows = admins.map(admin => [
      admin.id,
      admin.username,
      admin.name,
      admin.role || "ADMIN",
      admin.enabled ? "Active" : "Disabled",
      admin.created_by_name || "",
      admin.created_at ? new Date(admin.created_at).toLocaleDateString() : ""
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `admins_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Get role chip
  const getRoleChip = (role) => {
    if (role === "SUPER_ADMIN") {
      return (
        <Chip 
          label="SUPER ADMIN" 
          color="error" 
          size="small" 
          icon={<SecurityIcon />}
          sx={{ fontWeight: 'bold' }}
        />
      );
    }
    return (
      <Chip 
        label="ADMIN" 
        color="primary" 
        size="small" 
        icon={<AdminIcon />}
      />
    );
  };

  // Get status chip
  const getStatusChip = (enabled) => {
    if (enabled) {
      return <Chip label="Active" color="success" size="small" icon={<CheckCircleIcon />} />;
    }
    return <Chip label="Disabled" color="error" size="small" icon={<CancelIcon />} />;
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f5f5f5", py: isMobile ? 1 : 2 }}>
      <Container
        maxWidth={false}
        sx={{
          width: getContainerWidth(),
          ml: getContainerMargin(),
          mr: isMobile ? 0 : "12px",
          px: { xs: 1, sm: 2, md: 0.5 },
        }}
      >
        {/* Header - Single Row */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          mb: 3, 
          flexWrap: 'wrap', 
          gap: 2,
          bgcolor: '#fff',
          p: 2,
          borderRadius: 2,
          boxShadow: 1,
        }}>
          <Typography
            variant={isMobile ? "h6" : "h5"}
            fontWeight="bold"
            color="#DAA520"
            sx={{ whiteSpace: 'nowrap' }}
          >
            Admin Management
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
            <TextField
              size="small"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(0);
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
              sx={{ width: isMobile ? 150 : 200 }}
            />
            
            <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
              Total: {totalAdmins}
            </Typography>
            
            <Tooltip title="Export CSV">
              <IconButton
                size="small"
                onClick={exportToCSV}
                disabled={admins.length === 0}
                sx={{ color: "#DAA520" }}
              >
                <DownloadIcon />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Refresh">
              <IconButton
                size="small"
                onClick={fetchAdmins}
                disabled={loading}
                sx={{ color: "#DAA520" }}
              >
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleOpenCreate}
              size="small"
              sx={{ 
                bgcolor: "#DAA520", 
                '&:hover': { bgcolor: '#b8860b' },
                whiteSpace: 'nowrap',
                minWidth: 'auto',
              }}
            >
              Add Admin
            </Button>
          </Box>
        </Box>

        {/* Admins Table */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress sx={{ color: "#DAA520" }} />
          </Box>
        ) : error ? (
          <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
            <Typography color="error">{error}</Typography>
            <Button onClick={fetchAdmins} sx={{ mt: 2 }}>Retry</Button>
          </Paper>
        ) : admins.length === 0 ? (
          <Paper sx={{ p: 8, textAlign: 'center', borderRadius: 2 }}>
            <Typography variant="h6" color="text.secondary">
              No admins found
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Click "Add Admin" to create a new admin
            </Typography>
          </Paper>
        ) : (
          <>
            {/* Table Container */}
            <TableContainer 
              component={Paper} 
              sx={{ 
                borderRadius: 2, 
                overflow: 'auto',
                maxHeight: '500px',
                '&::-webkit-scrollbar': {
                  width: '8px',
                  height: '8px',
                },
                '&::-webkit-scrollbar-track': {
                  backgroundColor: '#f1f1f1',
                  borderRadius: '4px',
                },
                '&::-webkit-scrollbar-thumb': {
                  backgroundColor: '#DAA520',
                  borderRadius: '4px',
                  '&:hover': {
                    backgroundColor: '#b8860b',
                  },
                },
              }}
            >
              <Table stickyHeader>
                <TableHead>
                  <TableRow sx={{ bgcolor: "#f5f5f5" }}>
                    <TableCell sx={{ fontWeight: "bold", minWidth: 60 }}>ID</TableCell>
                    <TableCell sx={{ fontWeight: "bold", minWidth: 120 }}>Username</TableCell>
                    <TableCell sx={{ fontWeight: "bold", minWidth: 150 }}>Name</TableCell>
                    <TableCell sx={{ fontWeight: "bold", minWidth: 130 }}>Role</TableCell>
                    <TableCell sx={{ fontWeight: "bold", minWidth: 100 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: "bold", minWidth: 150 }}>Created By</TableCell>
                    <TableCell sx={{ fontWeight: "bold", minWidth: 150 }}>Created At</TableCell>
                    <TableCell sx={{ fontWeight: "bold", minWidth: 280, textAlign: 'center' }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredAdmins
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((admin) => {
                      const isSuper = isSuperAdmin(admin);
                      return (
                        <TableRow 
                          key={admin.id}
                          sx={{ 
                            '&:hover': { bgcolor: '#fafafa' },
                            bgcolor: isSuper ? '#fff3e0' : (admin.enabled ? 'inherit' : '#fff5f5')
                          }}
                        >
                          <TableCell>{admin.id}</TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Avatar sx={{ 
                                width: 28, 
                                height: 28, 
                                bgcolor: isSuper ? '#f44336' : '#1976d2'
                              }}>
                                {admin.username?.charAt(0).toUpperCase()}
                              </Avatar>
                              <Typography variant="body2">{admin.username}</Typography>
                            </Box>
                          </TableCell>
                          <TableCell>{admin.name}</TableCell>
                          <TableCell>{getRoleChip(admin.role)}</TableCell>
                          <TableCell>{getStatusChip(admin.enabled)}</TableCell>
                          <TableCell>
                            {admin.created_by_name || "—"}
                          </TableCell>
                          <TableCell>
                            {admin.created_at ? new Date(admin.created_at).toLocaleDateString() : "—"}
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', justifyContent: 'center' }}>
                              <Tooltip title={isSuper ? "SUPER_ADMIN cannot be toggled" : (admin.enabled ? "Disable Admin" : "Enable Admin")}>
                                <span>
                                  <IconButton
                                    size="small"
                                    onClick={() => handleToggleStatus(admin)}
                                    disabled={isSuper}
                                    sx={{ 
                                      color: isSuper ? '#999' : (admin.enabled ? '#4caf50' : '#f44336'),
                                      '&:hover': { 
                                        bgcolor: isSuper ? 'transparent' : (admin.enabled ? 'rgba(76, 175, 80, 0.1)' : 'rgba(244, 67, 54, 0.1)')
                                      }
                                    }}
                                  >
                                    {admin.enabled ? <ToggleOnIcon /> : <ToggleOffIcon />}
                                  </IconButton>
                                </span>
                              </Tooltip>
                              
                              <Tooltip title={isSuper ? "SUPER_ADMIN cannot be edited" : "Edit Admin"}>
                                <span>
                                  <IconButton
                                    size="small"
                                    onClick={() => handleOpenEdit(admin)}
                                    disabled={isSuper}
                                    sx={{ 
                                      color: isSuper ? '#999' : '#1976d2',
                                      '&:hover': { bgcolor: isSuper ? 'transparent' : 'rgba(25, 118, 210, 0.1)' }
                                    }}
                                  >
                                    <EditIcon />
                                  </IconButton>
                                </span>
                              </Tooltip>
                              
                              <Tooltip title={isSuper ? "SUPER_ADMIN password cannot be reset" : "Reset Password"}>
                                <span>
                                  <IconButton
                                    size="small"
                                    onClick={() => handleOpenResetPassword(admin)}
                                    disabled={isSuper}
                                    sx={{ 
                                      color: isSuper ? '#999' : '#ff9800',
                                      '&:hover': { bgcolor: isSuper ? 'transparent' : 'rgba(255, 152, 0, 0.1)' }
                                    }}
                                  >
                                    <LockResetIcon />
                                  </IconButton>
                                </span>
                              </Tooltip>
                              
                              <Tooltip title="View Sessions">
                                <IconButton
                                  size="small"
                                  onClick={() => handleViewSessions(admin)}
                                  sx={{ color: "#9c27b0" }}
                                >
                                  <HistoryIcon />
                                </IconButton>
                              </Tooltip>
                              
                              <Tooltip title={isSuper ? "SUPER_ADMIN cannot be deleted" : "Delete Admin"}>
                                <span>
                                  <IconButton
                                    size="small"
                                    onClick={() => handleOpenDelete(admin)}
                                    disabled={isSuper}
                                    sx={{ 
                                      color: isSuper ? '#999' : '#f44336',
                                      '&:hover': { bgcolor: isSuper ? 'transparent' : 'rgba(244, 67, 54, 0.1)' }
                                    }}
                                  >
                                    <DeleteIcon />
                                  </IconButton>
                                </span>
                              </Tooltip>
                            </Box>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Table Pagination */}
            <TablePagination
              rowsPerPageOptions={[5, 10, 25, 50, 100]}
              component="div"
              count={filteredAdmins.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              sx={{
                borderTop: '1px solid #e0e0e0',
                '& .MuiTablePagination-selectIcon': { color: '#DAA520' },
                '& .MuiIconButton-root': { color: '#DAA520' },
                '& .MuiTablePagination-select': { color: '#000' },
                '& .MuiTablePagination-displayedRows': { color: '#000' },
              }}
            />
          </>
        )}

        {/* Create/Edit Dialog */}
        <Dialog 
          open={dialogOpen} 
          onClose={handleDialogClose}
          maxWidth="sm"
          fullWidth
          PaperProps={{ sx: { borderRadius: 2 } }}
        >
          <DialogTitle>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="h6">
                {dialogMode === "create" ? "Create New Admin" : "Edit Admin"}
              </Typography>
              <IconButton onClick={handleDialogClose}>
                <CloseIcon />
              </IconButton>
            </Box>
          </DialogTitle>
          <DialogContent dividers>
            <Stack spacing={2} sx={{ pt: 1 }}>
              <TextField
                fullWidth
                label="Username"
                name="username"
                value={formData.username}
                onChange={handleFormChange}
                required
                disabled={dialogMode === "edit"}
                size="small"
              />
              <TextField
                fullWidth
                label="Full Name"
                name="name"
                value={formData.name}
                onChange={handleFormChange}
                required
                size="small"
              />
              <TextField
                fullWidth
                select
                label="Role"
                name="role"
                value={formData.role}
                onChange={handleFormChange}
                size="small"
                disabled={true}
                SelectProps={{
                  native: true,
                }}
              >
                <option value="ADMIN" >ADMIN</option>
              </TextField>
              {dialogMode === "create" && (
                <TextField
                  fullWidth
                  label="Password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleFormChange}
                  required
                  size="small"
                  helperText="Password must be at least 6 characters"
                />
              )}
              <FormControlLabel
                control={
                  <Switch
                    name="enabled"
                    checked={formData.enabled}
                    onChange={handleFormChange}
                    color="success"
                  />
                }
                label={formData.enabled ? "Enabled" : "Disabled"}
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ p: 2, gap: 1 }}>
            <Button onClick={handleDialogClose} variant="outlined" sx={{ borderColor: '#666', color: '#666' }}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              variant="contained"
              sx={{ bgcolor: "#DAA520", '&:hover': { bgcolor: '#b8860b' } }}
            >
              {dialogMode === "create" ? "Create" : "Update"}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Reset Password Dialog */}
        <Dialog
          open={resetPasswordOpen}
          onClose={() => setResetPasswordOpen(false)}
          maxWidth="sm"
          fullWidth
          PaperProps={{ sx: { borderRadius: 2 } }}
        >
          <DialogTitle>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="h6">
                Reset Password
              </Typography>
              <IconButton onClick={() => setResetPasswordOpen(false)}>
                <CloseIcon />
              </IconButton>
            </Box>
          </DialogTitle>
          <DialogContent dividers>
            <Stack spacing={2} sx={{ pt: 1 }}>
              <Box sx={{ p: 2, bgcolor: '#fff3e0', borderRadius: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Resetting password for: <strong>{resetAdmin?.username}</strong>
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Name: <strong>{resetAdmin?.name}</strong>
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Role: <strong>{resetAdmin?.role}</strong>
                </Typography>
              </Box>
              <TextField
                fullWidth
                label="New Password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                size="small"
                helperText="Password must be at least 6 characters"
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ p: 2, gap: 1 }}>
            <Button onClick={() => setResetPasswordOpen(false)} variant="outlined" sx={{ borderColor: '#666', color: '#666' }}>
              Cancel
            </Button>
            <Button 
              onClick={handleResetPassword} 
              variant="contained"
              sx={{ bgcolor: "#ff9800", '&:hover': { bgcolor: '#f57c00' } }}
            >
              Reset Password
            </Button>
          </DialogActions>
        </Dialog>

        {/* Sessions Dialog */}
        <Dialog
          open={showSessions}
          onClose={() => setShowSessions(false)}
          maxWidth="md"
          fullWidth
          PaperProps={{ sx: { borderRadius: 2 } }}
        >
          <DialogTitle>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="h6">
                Sessions - {selectedAdmin?.username}
              </Typography>
              <IconButton onClick={() => setShowSessions(false)}>
                <CloseIcon />
              </IconButton>
            </Box>
          </DialogTitle>
          <DialogContent dividers>
            {sessions.length === 0 ? (
              <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                No active sessions found
              </Typography>
            ) : (
              <TableContainer 
                sx={{ 
                  maxHeight: sessions.length > 5 ? '300px' : 'auto',
                  '&::-webkit-scrollbar': {
                    width: '8px',
                    height: '8px',
                  },
                  '&::-webkit-scrollbar-track': {
                    backgroundColor: '#f1f1f1',
                    borderRadius: '4px',
                  },
                  '&::-webkit-scrollbar-thumb': {
                    backgroundColor: '#DAA520',
                    borderRadius: '4px',
                    '&:hover': {
                      backgroundColor: '#b8860b',
                    },
                  },
                }}
              >
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell><strong>Session ID</strong></TableCell>
                      <TableCell><strong>Last Activity</strong></TableCell>
                      <TableCell><strong>Status</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {sessions.map((session, index) => (
                      <TableRow key={index}>
                        <TableCell>{session.id}</TableCell>
                        <TableCell>
                          {session.last_activity ? new Date(session.last_activity).toLocaleString() : "—"}
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label="Active" 
                            color="success" 
                            size="small"
                            icon={<CheckCircleIcon />}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setShowSessions(false)} variant="contained" sx={{ bgcolor: "#DAA520" }}>
              Close
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={deleteDialogOpen}
          onClose={() => setDeleteDialogOpen(false)}
          maxWidth="sm"
          fullWidth
          PaperProps={{ sx: { borderRadius: 2 } }}
        >
          <DialogTitle>
            <Typography variant="h6" color="error">
              Confirm Delete
            </Typography>
          </DialogTitle>
          <DialogContent>
            <Box sx={{ py: 2 }}>
              <Alert severity="warning" sx={{ mb: 2 }}>
                Are you sure you want to delete this admin?
              </Alert>
              <Box sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: 2 }}>
                <Typography variant="body2">
                  <strong>Username:</strong> {deleteAdmin?.username}
                </Typography>
                <Typography variant="body2">
                  <strong>Name:</strong> {deleteAdmin?.name}
                </Typography>
                <Typography variant="body2">
                  <strong>Role:</strong> {deleteAdmin?.role}
                </Typography>
              </Box>
              <Typography variant="caption" color="error" sx={{ display: 'block', mt: 2 }}>
                This action cannot be undone!
              </Typography>
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 2, gap: 1 }}>
            <Button onClick={() => setDeleteDialogOpen(false)} variant="outlined" sx={{ borderColor: '#666', color: '#666' }}>
              Cancel
            </Button>
            <Button 
              onClick={handleDelete} 
              variant="contained"
              color="error"
            >
              Delete Admin
            </Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <Alert 
            onClose={() => setSnackbar({ ...snackbar, open: false })} 
            severity={snackbar.severity}
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Container>
    </Box>
  );
};

export default AdminManagement;