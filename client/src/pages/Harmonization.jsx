// pages/superAdmin/AccountComparison.jsx
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
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
  Slide,
  Snackbar,
  TablePagination,
} from "@mui/material";
import {
  Search as SearchIcon,
  Download as DownloadIcon,
  Close as CloseIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  Badge as BadgeIcon,
  AccountBalance as AccountIcon,
  TableRows as TableRowsIcon,
  Refresh as RefreshIcon,
  ToggleOn as ToggleOnIcon,
  ToggleOff as ToggleOffIcon,
  Warning as WarningIcon,
} from "@mui/icons-material";
import axios from "axios";

const API_URL = `${import.meta.env.VITE_API_URL}/api/harmonization/compare-accounts`;

// Fields to compare between tables
const COMPARE_FIELDS = [
  "id",
  "customer_id",
  "full_name",
  "national_id",
  "gender",
  "phone",
  "account_number"
];

// Status constants - exact values expected by backend
const STATUS = {
  UPDATED: "UPDATED",
  UPDATEDS: "UPDATEDs"
};

// Transition for dialog
const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

// Custom scrollbar styles
const scrollbarStyles = {
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
};

const AccountComparison = () => {
  const [newData, setNewData] = useState([]);
  const [oldData, setOldData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchType, setSearchType] = useState("account_number");
  const [searchValue, setSearchValue] = useState("");
  const [error, setError] = useState(null);
  const [totalNew, setTotalNew] = useState(0);
  const [totalOld, setTotalOld] = useState(0);
  const [statusUpdateLoading, setStatusUpdateLoading] = useState(false);

  // Pagination for New Data Table
  const [page1, setPage1] = useState(0);
  const [rowsPerPage1, setRowsPerPage1] = useState(5);

  // Pagination for Old Data Table
  const [page2, setPage2] = useState(0);
  const [rowsPerPage2, setRowsPerPage2] = useState(5);

  // Confirmation Dialog State
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [currentStatus, setCurrentStatus] = useState("");
  const [newStatus, setNewStatus] = useState("");
  const [reason, setReason] = useState("");
  const [reasonError, setReasonError] = useState(false);

  // Snackbar State
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

  // Fetch data based on search
  const fetchComparisonData = async () => {
    if (!searchValue && searchType !== "all") {
      setError("Please enter a search value");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("token");

      let url = `${API_URL}`;
      const params = new URLSearchParams();

      if (searchType !== "all") {
        params.append('searchType', searchType);
        params.append('searchValue', searchValue);
      } else {
        params.append('searchType', 'all');
      }

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log("Comparison data:", response.data);
      setNewData(response.data.new_data || []);
      setOldData(response.data.old_data || []);
      setTotalNew(response.data.total_new || 0);
      setTotalOld(response.data.total_old || 0);
      setPage1(0);
      setPage2(0);
    } catch (error) {
      console.error("Error fetching comparison data:", error);
      setError(error.response?.data?.message || "Error fetching data");
      setNewData([]);
      setOldData([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle search submission
  const handleSearch = (e) => {
    if (e) e.preventDefault();
    fetchComparisonData();
  };

  // Handle enter key
  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSearch(e);
    }
  };

  // Reset search
  const handleReset = () => {
    setSearchValue("");
    setNewData([]);
    setOldData([]);
    setError(null);
    setTotalNew(0);
    setTotalOld(0);
    setPage1(0);
    setPage2(0);
  };

  // Open confirmation dialog for status update
  const handleStatusToggleClick = (record, currentStatus) => {
    // Toggle between exact status values expected by backend
    const newStatusValue = currentStatus === STATUS.UPDATED ? STATUS.UPDATEDS : STATUS.UPDATED;
    setSelectedRecord(record);
    setCurrentStatus(currentStatus);
    setNewStatus(newStatusValue);
    setReason("");
    setReasonError(false);
    setConfirmDialogOpen(true);
  };

  // Close confirmation dialog
  const handleConfirmDialogClose = () => {
    setConfirmDialogOpen(false);
    setSelectedRecord(null);
    setCurrentStatus("");
    setNewStatus("");
    setReason("");
    setReasonError(false);
  };

  // Confirm and update status
  const handleConfirmStatusUpdate = async () => {
    // Validate reason
    if (!reason.trim()) {
      setReasonError(true);
      return;
    }

    if (!selectedRecord) return;

    try {
      setStatusUpdateLoading(true);
      const token = localStorage.getItem("token");

      // Send both status and reason in the request body with exact values
      const response = await axios.put(
        `${import.meta.env.VITE_API_URL}/api/harmonization/new-core/${selectedRecord.id}/status`,
        { 
          status: newStatus, // Sends exactly "UPDATED" or "UPDATEDs"
          reason: reason.trim()
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        // Update the data in the state
        setNewData(prevData =>
          prevData.map(item => {
            if (item.id === selectedRecord.id) {
              return {
                ...item,
                status: newStatus, // Store exact value
                status_reason: reason.trim()
              };
            }
            return item;
          })
        );

        // Show success message
        setSnackbar({
          open: true,
          message: `Status updated from ${currentStatus} to ${newStatus} successfully!`,
          severity: "success"
        });
      }
    } catch (error) {
      console.error("Error updating status:", error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || "Failed to update status",
        severity: "error"
      });
    } finally {
      setStatusUpdateLoading(false);
      handleConfirmDialogClose();
    }
  };

  // Close snackbar
  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Check if field should be compared
  const shouldCompare = (fieldName) => {
    return COMPARE_FIELDS.includes(fieldName);
  };

  // Find matching record in other table
  const findMatchingRecord = (record, dataArray, matchKey = "account_number") => {
    return dataArray.find(item =>
      item[matchKey] === record[matchKey] ||
      item.customer_id === record.customer_id
    );
  };

  // Compare two values and return color
  const getComparisonColor = (newValue, oldValue) => {
    if (newValue === undefined || oldValue === undefined) return "inherit";
    const newStr = String(newValue || "").trim();
    const oldStr = String(oldValue || "").trim();
    if (newStr === oldStr) return "#4caf50"; // Green for match
    return "#f44336"; // Red for mismatch
  };

  // Paginate data for Table 1
  const paginatedNewData = newData.slice(
    page1 * rowsPerPage1,
    page1 * rowsPerPage1 + rowsPerPage1
  );

  // Paginate data for Table 2
  const paginatedOldData = oldData.slice(
    page2 * rowsPerPage2,
    page2 * rowsPerPage2 + rowsPerPage2
  );

  // Handle page change for Table 1
  const handleChangePage1 = (event, newPage) => {
    setPage1(newPage);
  };

  // Handle rows per page change for Table 1
  const handleChangeRowsPerPage1 = (event) => {
    setRowsPerPage1(parseInt(event.target.value, 10));
    setPage1(0);
  };

  // Handle page change for Table 2
  const handleChangePage2 = (event, newPage) => {
    setPage2(newPage);
  };

  // Handle rows per page change for Table 2
  const handleChangeRowsPerPage2 = (event) => {
    setRowsPerPage2(parseInt(event.target.value, 10));
    setPage2(0);
  };

  // Calculate table height
  const tableHeight = Math.max(window.innerHeight - 450, 300);

  // Render New Data Table
  const renderNewDataTable = () => {
    if (newData.length === 0) return null;

    // Get all columns from first row
    const columns = Object.keys(newData[0] || {});

    return (
      <Paper sx={{ borderRadius: 2, overflow: 'hidden', mb: 2 }}>
        <TableContainer
          sx={{
            maxHeight: tableHeight,
            overflow: 'auto',
            ...scrollbarStyles,
          }}
        >
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: "#fff8e1" }}>
                <TableCell colSpan={columns.length + 2} sx={{ fontWeight: "bold", color: "#DAA520", bgcolor: "#fff8e1", fontSize: '1.1rem' }}>
                  🆕 NEW CORE DATA ({newData.length} records)
                </TableCell>
              </TableRow>
              <TableRow sx={{ bgcolor: "#fff3e0" }}>
                <TableCell
                  sx={{
                    fontWeight: "bold",
                    minWidth: 60,
                    position: 'sticky',
                    left: 0,
                    bgcolor: '#fff3e0',
                    whiteSpace: 'nowrap'
                  }}
                >
                  <strong>#</strong>
                </TableCell>
                {columns.map(key => (
                  <TableCell
                    key={key}
                    sx={{
                      fontWeight: shouldCompare(key) ? "bold" : "normal",
                      minWidth: 120,
                      borderBottom: shouldCompare(key) ? '3px solid #DAA520' : '1px solid #e0e0e0',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {key.replace(/_/g, ' ').toUpperCase()}
                    {shouldCompare(key) && (
                      <Chip size="small" label="cmp" color="warning" sx={{ ml: 1, height: 18, fontSize: '0.6rem' }} />
                    )}
                  </TableCell>
                ))}
                <TableCell
                  sx={{
                    fontWeight: "bold",
                    minWidth: 100,
                    borderBottom: '3px solid #DAA520',
                    whiteSpace: 'nowrap',
                    textAlign: 'center'
                  }}
                >
                  STATUS
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedNewData.map((row, index) => {
                const match = findMatchingRecord(row, oldData);
                const actualIndex = page1 * rowsPerPage1 + index;

                return (
                  <TableRow
                    key={index}
                    sx={{
                      '&:hover': { bgcolor: '#fafafa' },
                      bgcolor: match ? '#f0faf0' : 'inherit'
                    }}
                  >
                    <TableCell sx={{
                      position: 'sticky',
                      left: 0,
                      bgcolor: 'white',
                      fontWeight: 'bold',
                      whiteSpace: 'nowrap'
                    }}>
                      {actualIndex + 1}
                      {match && (
                        <Chip size="small" label="✓" color="success" sx={{ ml: 1, height: 18, fontSize: '0.6rem' }} />
                      )}
                    </TableCell>
                    {columns.map(key => {
                      const value = row[key];
                      const oldValue = match ? match[key] : undefined;
                      const isCompared = shouldCompare(key);
                      const color = isCompared ? getComparisonColor(value, oldValue) : "inherit";

                      return (
                        <TableCell
                          key={key}
                          sx={{
                            color: color,
                            fontWeight: isCompared && color === '#4caf50' ? 'bold' : 'normal',
                            bgcolor: isCompared && color === '#4caf50' ? '#f0faf0' : 'inherit',
                            whiteSpace: 'nowrap',
                            maxWidth: 200,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}
                        >
                          {value || "—"}
                          {isCompared && oldValue !== undefined && (
                            <Typography
                              variant="caption"
                              sx={{
                                display: 'block',
                                color: '#666',
                                fontSize: '0.6rem',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              Old: {oldValue || "—"}
                            </Typography>
                          )}
                        </TableCell>
                      );
                    })}
                    <TableCell sx={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                      <Tooltip
                        title={`Click to change from ${row.status || STATUS.UPDATED} to ${row.status === STATUS.UPDATED ? STATUS.UPDATEDS : STATUS.UPDATED}`}
                      >
                        <IconButton
                          size="small"
                          onClick={() => handleStatusToggleClick(row, row.status || STATUS.UPDATED)}
                          disabled={statusUpdateLoading}
                          sx={{
                            color: row.status === STATUS.UPDATED ? "#4caf50" : "#ff9800",
                            '&:hover': {
                              bgcolor: row.status === STATUS.UPDATED ? 'rgba(76, 175, 80, 0.1)' : 'rgba(255, 152, 0, 0.1)'
                            }
                          }}
                        >
                          {row.status === STATUS.UPDATED ? (
                            <ToggleOnIcon sx={{ fontSize: 32 }} />
                          ) : (
                            <ToggleOffIcon sx={{ fontSize: 32 }} />
                          )}
                        </IconButton>
                      </Tooltip>
                      <Typography variant="caption" display="block" sx={{ fontSize: '0.6rem' }}>
                        {row.status || STATUS.UPDATED}
                      </Typography>
                      {row.status_reason && (
                        <Tooltip title={row.status_reason}>
                          <Typography variant="caption" display="block" sx={{ fontSize: '0.5rem', color: '#666', maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            📝 {row.status_reason}
                          </Typography>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Table 1 Pagination */}
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={newData.length}
          rowsPerPage={rowsPerPage1}
          page={page1}
          onPageChange={handleChangePage1}
          onRowsPerPageChange={handleChangeRowsPerPage1}
          sx={{
            borderTop: '1px solid #e0e0e0',
            '& .MuiTablePagination-select': {
              color: '#DAA520',
            },
            '& .MuiTablePagination-actions .MuiIconButton-root': {
              color: '#DAA520',
              '&:hover': {
                backgroundColor: 'rgba(218, 165, 32, 0.1)',
              },
            },
          }}
        />
      </Paper>
    );
  };

  // Render Old Data Table
  const renderOldDataTable = () => {
    if (oldData.length === 0) return null;

    // Get all columns from first row
    const columns = Object.keys(oldData[0] || {});

    return (
      <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <TableContainer
          sx={{
            maxHeight: tableHeight,
            overflow: 'auto',
            ...scrollbarStyles,
          }}
        >
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: "#e3f2fd" }}>
                <TableCell colSpan={columns.length + 1} sx={{ fontWeight: "bold", color: "#1976d2", bgcolor: "#e3f2fd", fontSize: '1.1rem' }}>
                  📊 OLD CORE DATA ({oldData.length} records)
                </TableCell>
              </TableRow>
              <TableRow sx={{ bgcolor: "#bbdefb" }}>
                <TableCell
                  sx={{
                    fontWeight: "bold",
                    minWidth: 60,
                    position: 'sticky',
                    left: 0,
                    bgcolor: '#bbdefb',
                    whiteSpace: 'nowrap'
                  }}
                >
                  <strong>#</strong>
                </TableCell>
                {columns.map(key => (
                  <TableCell
                    key={key}
                    sx={{
                      fontWeight: shouldCompare(key) ? "bold" : "normal",
                      minWidth: 120,
                      borderBottom: shouldCompare(key) ? '3px solid #1976d2' : '1px solid #e0e0e0',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {key.replace(/_/g, ' ').toUpperCase()}
                    {shouldCompare(key) && (
                      <Chip size="small" label="cmp" color="info" sx={{ ml: 1, height: 18, fontSize: '0.6rem' }} />
                    )}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedOldData.map((row, index) => {
                const match = findMatchingRecord(row, newData);
                const actualIndex = page2 * rowsPerPage2 + index;

                return (
                  <TableRow
                    key={index}
                    sx={{
                      '&:hover': { bgcolor: '#fafafa' },
                      bgcolor: match ? '#f0faf0' : 'inherit'
                    }}
                  >
                    <TableCell sx={{
                      position: 'sticky',
                      left: 0,
                      bgcolor: 'white',
                      fontWeight: 'bold',
                      whiteSpace: 'nowrap'
                    }}>
                      {actualIndex + 1}
                      {match && (
                        <Chip size="small" label="✓" color="success" sx={{ ml: 1, height: 18, fontSize: '0.6rem' }} />
                      )}
                    </TableCell>
                    {columns.map(key => {
                      const value = row[key];
                      const newValue = match ? match[key] : undefined;
                      const isCompared = shouldCompare(key);
                      const color = isCompared ? getComparisonColor(newValue, value) : "inherit";

                      return (
                        <TableCell
                          key={key}
                          sx={{
                            color: color,
                            fontWeight: isCompared && color === '#4caf50' ? 'bold' : 'normal',
                            bgcolor: isCompared && color === '#4caf50' ? '#f0faf0' : 'inherit',
                            whiteSpace: 'nowrap',
                            maxWidth: 200,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}
                        >
                          {value || "—"}
                          {isCompared && newValue !== undefined && (
                            <Typography
                              variant="caption"
                              sx={{
                                display: 'block',
                                color: '#666',
                                fontSize: '0.6rem',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              New: {newValue || "—"}
                            </Typography>
                          )}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Table 2 Pagination */}
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={oldData.length}
          rowsPerPage={rowsPerPage2}
          page={page2}
          onPageChange={handleChangePage2}
          onRowsPerPageChange={handleChangeRowsPerPage2}
          sx={{
            borderTop: '1px solid #e0e0e0',
            '& .MuiTablePagination-select': {
              color: '#1976d2',
            },
            '& .MuiTablePagination-actions .MuiIconButton-root': {
              color: '#1976d2',
              '&:hover': {
                backgroundColor: 'rgba(25, 118, 210, 0.1)',
              },
            },
          }}
        />
      </Paper>
    );
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
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
          <Typography
            variant={isMobile ? "h5" : "h4"}
            fontWeight="bold"
            color="#DAA520"
          >
            Harmonization
          </Typography>
        </Box>

        {/* Search Section */}
        <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
          <Grid container spacing={2} alignItems="flex-end">
            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Search By</InputLabel>
                <Select
                  value={searchType}
                  onChange={(e) => {
                    setSearchType(e.target.value);
                    if (e.target.value === "all") {
                      setSearchValue("");
                    }
                  }}
                  label="Search By"
                >
                  <MenuItem value="account_number">
                    <AccountIcon sx={{ mr: 1, fontSize: 18 }} />
                    Account Number
                  </MenuItem>
                  <MenuItem value="full_name">
                    <PersonIcon sx={{ mr: 1, fontSize: 18 }} />
                    Full Name
                  </MenuItem>
                  <MenuItem value="phone">
                    <PhoneIcon sx={{ mr: 1, fontSize: 18 }} />
                    Phone
                  </MenuItem>
                  <MenuItem value="national_id">
                    <BadgeIcon sx={{ mr: 1, fontSize: 18 }} />
                    National ID
                  </MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={5}>
              <TextField
                fullWidth
                size="small"
                placeholder={
                  searchType === "all"
                    ? "Fetching all records..."
                    : `Enter ${searchType.replace('_', ' ')}...`
                }
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={searchType === "all"}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            <Grid item xs={6} md={2}>
              <Button
                fullWidth
                variant="contained"
                onClick={handleSearch}
                disabled={loading || (searchType !== "all" && !searchValue)}
                sx={{
                  bgcolor: "#DAA520",
                  '&:hover': { bgcolor: '#b8860b' }
                }}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : "Search"}
              </Button>
            </Grid>

            <Grid item xs={6} md={2}>
              <Button
                fullWidth
                variant="outlined"
                onClick={handleReset}
                sx={{ borderColor: "#DAA520", color: "#DAA520" }}
              >
                Reset
              </Button>
            </Grid>
            <Button
              variant="outlined"
              onClick={fetchComparisonData}
              disabled={loading}
              sx={{
                minWidth: "40px",
                width: "40px",
                height: "36px",
                padding: "4px",
                borderColor: "#DAA520",
                color: "#DAA520",
                borderRadius: "8px",
              }}
            >
              <RefreshIcon sx={{ fontSize: 24 }} />
            </Button>
          </Grid>

          {error && (
            <Alert severity="error" sx={{ mt: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}
        </Paper>

        {/* Results Summary */}
        {(newData.length > 0 || oldData.length > 0) && (
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={6} sm={3}>
              <Paper sx={{ p: 2, textAlign: "center", bgcolor: "#fff8e1" }}>
                <Typography variant="h6" color="#DAA520">
                  {totalNew || newData.length}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  🆕 New Records
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Paper sx={{ p: 2, textAlign: "center", bgcolor: "#e3f2fd" }}>
                <Typography variant="h6" color="#1976d2">
                  {totalOld || oldData.length}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  📊 Old Records
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Paper sx={{ p: 2, textAlign: "center", bgcolor: "#f0faf0" }}>
                <Typography variant="h6" color="success.main">
                  {newData.filter(row => findMatchingRecord(row, oldData)).length}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  ✅ Matches Found
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        )}

        {/* Results - Two Separate Tables */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress sx={{ color: "#DAA520" }} />
          </Box>
        ) : newData.length === 0 && oldData.length === 0 ? (
          <Paper sx={{ p: 8, textAlign: 'center', borderRadius: 2 }}>
            <Typography variant="h6" color="text.secondary">
              {searchValue || searchType === "all"
                ? "No records found"
                : "Enter search criteria and click Search"}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Search by Account Number, Customer ID, Full Name, Phone, National ID, or fetch all records
            </Typography>
          </Paper>
        ) : (
          <>
            {/* New Data Table - On Top */}
            {renderNewDataTable()}

            {/* Spacer */}
            <Box sx={{ height: 24 }} />

            {/* Old Data Table - On Bottom */}
            {renderOldDataTable()}
          </>
        )}

        {/* Legend */}
        {(newData.length > 0 || oldData.length > 0) && (
          <Paper sx={{ p: 2, mt: 3, borderRadius: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Legend:
            </Typography>
            <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ width: 20, height: 20, bgcolor: '#4caf50', borderRadius: 1 }} />
                <Typography variant="caption">Green = Matching values</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ width: 20, height: 20, bgcolor: '#f44336', borderRadius: 1 }} />
                <Typography variant="caption">Red = Different values</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Chip size="small" label="cmp" color="warning" />
                <Typography variant="caption">Field is compared</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Chip size="small" label="✓" color="success" />
                <Typography variant="caption">Matching record found in other table</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <ToggleOnIcon sx={{ color: '#4caf50' }} />
                <Typography variant="caption">Click to toggle status</Typography>
              </Box>
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
              Compared fields: {COMPARE_FIELDS.join(', ')}
            </Typography>
          </Paper>
        )}

        {/* Confirmation Dialog with Reason */}
        <Dialog
          open={confirmDialogOpen}
          onClose={handleConfirmDialogClose}
          TransitionComponent={Transition}
          keepMounted
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <WarningIcon sx={{ color: '#ff9800', fontSize: 32 }} />
            <Typography variant="h6">Confirm Status Update</Typography>
          </DialogTitle>
          <DialogContent dividers>
            <Box sx={{ py: 2 }}>
              <Typography variant="body1" gutterBottom>
                Are you sure you want to update the status?
              </Typography>
              <Box sx={{
                mt: 3,
                p: 2,
                bgcolor: '#f5f5f5',
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 2,
                flexWrap: 'wrap'
              }}>
                <Typography variant="body2" color="text.secondary">
                  Current Status:
                </Typography>
                <Chip
                  label={currentStatus || STATUS.UPDATED}
                  color={currentStatus === STATUS.UPDATED ? "success" : "warning"}
                  sx={{ fontWeight: 'bold' }}
                />
                <Typography variant="h6" sx={{ color: '#666' }}>→</Typography>
                <Typography variant="body2" color="text.secondary">
                  New Status:
                </Typography>
                <Chip
                  label={newStatus || STATUS.UPDATEDS}
                  color={newStatus === STATUS.UPDATED ? "success" : "warning"}
                  sx={{ fontWeight: 'bold' }}
                />
              </Box>

              {/* Reason Field with Ticket Number */}
              <TextField
                fullWidth
                required
                multiline
                rows={4}
                label="Reason (Ticket Number)"
                placeholder="Please provide the reason for status change and include ticket/reference number..."
                value={reason}
                onChange={(e) => {
                  setReason(e.target.value);
                  if (e.target.value.trim()) {
                    setReasonError(false);
                  }
                }}
                error={reasonError}
                helperText={reasonError ? "Reason is required" : "Include reason and ticket number for tracking"}
                sx={{ mt: 3 }}
                variant="outlined"
              />

              {selectedRecord && (
                <Box sx={{ mt: 3, p: 2, bgcolor: '#fff8e1', borderRadius: 2 }}>
                  <Typography variant="caption" color="text.secondary" display="block">
                    Account: {selectedRecord.account_number || selectedRecord.customer_id}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block">
                    Customer: {selectedRecord.full_name || "—"}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block">
                    ID: {selectedRecord.id}
                  </Typography>
                </Box>
              )}
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 2, gap: 1 }}>
            <Button
              onClick={handleConfirmDialogClose}
              variant="outlined"
              sx={{ borderColor: '#666', color: '#666' }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmStatusUpdate}
              variant="contained"
              disabled={statusUpdateLoading}
              sx={{
                bgcolor: "#DAA520",
                '&:hover': { bgcolor: '#b8860b' }
              }}
            >
              {statusUpdateLoading ? <CircularProgress size={24} color="inherit" /> : "Confirm Update"}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar for notifications */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={handleSnackbarClose}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <Alert
            onClose={handleSnackbarClose}
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

export default AccountComparison;