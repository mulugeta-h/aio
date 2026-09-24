// pages/superAdmin/ReceiptHistory.jsx
import React, { useState, useEffect, useRef } from "react";
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
  CircularProgress,
  useMediaQuery,
  useTheme,
  Button,
  Tooltip,
  Alert,
  Snackbar,
  TablePagination,
  Avatar,
  Tabs,
  Tab,
  Badge,
} from "@mui/material";
import {
  Refresh as RefreshIcon,
  History as HistoryIcon,
  CalendarToday as CalendarIcon,
  Receipt as ReceiptIcon,
  AccountCircle as AccountCircleIcon,
  Today as TodayIcon,
  FilterList as FilterListIcon,
  Person as PersonIcon,
  DateRange as DateRangeIcon,
  Download as DownloadIcon,
  Print as PrintIcon,
} from "@mui/icons-material";
import axios from "axios";
import { format } from "date-fns";

const ReceiptHistory = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [totalRecords, setTotalRecords] = useState(0);
  const [activeTab, setActiveTab] = useState(0);
  const [filterType, setFilterType] = useState("today");
  
  // Filter states for FILTERED tab
  const [searchType, setSearchType] = useState("all");
  const [searchValue, setSearchValue] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedBank, setSelectedBank] = useState("");
  
  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Snackbar
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success"
  });

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isFirstMount = useRef(true);
  const searchTimeout = useRef(null);

  const getContainerMargin = () => {
    if (isMobile) return "0px";
    return "84px";
  };

  const getContainerWidth = () => {
    if (isMobile) return "100%";
    return "calc(100% - 96px)";
  };

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

  const showSnackbar = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  // Fetch receipt history
  const fetchReceiptHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("token");

      let endpoint = '';
      let params = new URLSearchParams();

      if (filterType === "today") {
        endpoint = '/api/receipt-history/today';
      } else if (filterType === "filtered") {
        endpoint = '/api/receipt-history/filtered';
        
        if (searchType === 'referenceId' && searchValue) {
          params.append('referenceId', searchValue);
        } else if (searchType === 'accountNumber' && searchValue) {
          params.append('accountNumber', searchValue);
        } else if (searchType === 'date' && startDate && endDate) {
          params.append('startDate', startDate);
          params.append('endDate', endDate);
        } else if (searchType === 'status' && selectedStatus) {
          params.append('status', selectedStatus);
        } else if (searchType === 'bank' && selectedBank) {
          params.append('bankId', selectedBank);
        }
      } else {
        endpoint = '/api/receipt-history/all';
      }

      const url = params.toString() 
        ? `${import.meta.env.VITE_API_URL}${endpoint}?${params.toString()}`
        : `${import.meta.env.VITE_API_URL}${endpoint}`;

      console.log("Fetching URL:", url);

      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setHistory(response.data.data || []);
        setTotalRecords(response.data.count || (response.data.data ? response.data.data.length : 0));
      } else {
        setError(response.data.message || "Error fetching receipt history");
        setHistory([]);
        setTotalRecords(0);
      }
    } catch (err) {
      console.error("Error fetching receipt history:", err);
      setError(err.response?.data?.message || "Error fetching receipt history");
      setHistory([]);
      setTotalRecords(0);
    } finally {
      setLoading(false);
    }
  };

  // Debounced search function
  const debouncedSearch = () => {
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }
    searchTimeout.current = setTimeout(() => {
      if (filterType === "filtered") {
        fetchReceiptHistory();
      }
    }, 500);
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    setError(null);
    setPage(0);
    
    // Reset filters when switching tabs
    if (newValue !== 1) {
      setSearchValue("");
      setStartDate("");
      setEndDate("");
      setSelectedStatus("");
      setSelectedBank("");
    }
    
    switch(newValue) {
      case 0:
        setFilterType("today");
        break;
      case 1:
        setFilterType("filtered");
        break;
      case 2:
        setFilterType("all");
        break;
      default:
        setFilterType("today");
    }
  };

  const handleSearch = (e) => {
    if (e) e.preventDefault();
    setPage(0);
    
    if (searchType === 'referenceId' && !searchValue) {
      setError("Please enter a Reference ID");
      return;
    } else if (searchType === 'accountNumber' && !searchValue) {
      setError("Please enter an Account Number");
      return;
    } else if (searchType === 'date' && (!startDate || !endDate)) {
      setError("Please select both Start Date and End Date");
      return;
    } else if (searchType === 'status' && !selectedStatus) {
      setError("Please select a status");
      return;
    } else if (searchType === 'bank' && !selectedBank) {
      setError("Please select a bank");
      return;
    }
    setError(null);
    fetchReceiptHistory();
  };

  const handleReset = () => {
    setSearchValue("");
    setStartDate("");
    setEndDate("");
    setSelectedStatus("");
    setSelectedBank("");
    setError(null);
    setHistory([]);
    setTotalRecords(0);
    setPage(0);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSearch(e);
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const getStatusColor = (status) => {
    if (!status) return "default";
    switch (status.toLowerCase()) {
      case 'completed':
      case 'success':
      case 'approved':
        return "success";
      case 'pending':
      case 'processing':
        return "warning";
      case 'failed':
      case 'rejected':
      case 'cancelled':
        return "error";
      default:
        return "default";
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "—";
    try {
      return format(new Date(dateString), "MMM dd, yyyy HH:mm:ss");
    } catch {
      return dateString;
    }
  };

  const getFilterLabel = () => {
    switch(filterType) {
      case "today": return "Today's Downloads";
      case "filtered": return "Filtered Results";
      case "all": return "All Records";
      default: return "Today's Downloads";
    }
  };

  const getFilterIcon = () => {
    switch(filterType) {
      case "today": return <TodayIcon />;
      case "filtered": return <FilterListIcon />;
      case "all": return <HistoryIcon />;
      default: return <TodayIcon />;
    }
  };

  const paginatedHistory = history.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  // Auto-search when any filter changes in filtered tab
  useEffect(() => {
    if (filterType === "filtered" && !isFirstMount.current) {
      debouncedSearch();
    }
  }, [searchType, searchValue, startDate, endDate, selectedStatus, selectedBank]);

  // Fetch on initial mount and when filterType changes
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      fetchReceiptHistory();
      return;
    }

    if (filterType !== "filtered") {
      fetchReceiptHistory();
    }
  }, [filterType]);

  // Background refresh
  useEffect(() => {
    if (history.length > 0 && filterType !== "filtered") {
      const interval = setInterval(() => {
        fetchReceiptHistory();
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [filterType, history.length]);

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
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <ReceiptIcon sx={{ fontSize: 32, color: '#DAA520' }} />
            <Typography variant={isMobile ? "h5" : "h4"} fontWeight="bold" color="#DAA520">
              Receipt Download History
            </Typography>
            <Badge badgeContent={totalRecords} color="warning" sx={{ ml: 1 }}>
              <Chip
                icon={getFilterIcon()}
                label={getFilterLabel()}
                color="warning"
                size="small"
                variant="outlined"
              />
            </Badge>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={fetchReceiptHistory}
              disabled={loading}
              sx={{ borderColor: "#DAA520", color: "#DAA520" }}
            >
              Refresh
            </Button>
          </Box>
        </Box>

        {/* Tabs */}
        <Paper sx={{ mb: 3, borderRadius: 2 }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant={isMobile ? "scrollable" : "fullWidth"}
            scrollButtons="auto"
            sx={{
              '& .MuiTab-root': {
                minHeight: 56,
                fontWeight: 500,
                '&.Mui-selected': {
                  color: '#DAA520',
                },
              },
              '& .MuiTabs-indicator': {
                backgroundColor: '#DAA520',
              },
            }}
          >
            <Tab icon={<TodayIcon />} label="Today" iconPosition="start" />
            <Tab icon={<FilterListIcon />} label="Filtered" iconPosition="start" />
            <Tab icon={<HistoryIcon />} label="All" iconPosition="start" />
          </Tabs>

          {/* Advanced Filters - Only show for Filtered tab */}
          {activeTab === 1 && (
            <Box sx={{ p: 2, borderTop: '1px solid #e0e0e0' }}>
              <Grid container spacing={2} alignItems="flex-end">
                {/* Search Type Dropdown */}
                <Grid item xs={12} md={2}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Search By</InputLabel>
                    <Select
                      value={searchType}
                      onChange={(e) => {
                        setSearchType(e.target.value);
                        setSearchValue("");
                        setStartDate("");
                        setEndDate("");
                        setSelectedStatus("");
                        setSelectedBank("");
                        setError(null);
                      }}
                      label="Search By"
                      size="small"
                    >
                      <MenuItem value="referenceId">
                        <ReceiptIcon sx={{ mr: 1, fontSize: 18 }} />
                        Reference ID
                      </MenuItem>
                      <MenuItem value="accountNumber">
                        <AccountCircleIcon sx={{ mr: 1, fontSize: 18 }} />
                        Account Number
                      </MenuItem>
                      <MenuItem value="date">
                        <DateRangeIcon sx={{ mr: 1, fontSize: 18 }} />
                        Date Range
                      </MenuItem>
                      <MenuItem value="status">
                        <PersonIcon sx={{ mr: 1, fontSize: 18 }} />
                        Status
                      </MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                {/* Dynamic Search Fields */}
                {searchType === 'referenceId' && (
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="Enter Reference ID..."
                      value={searchValue}
                      onChange={(e) => {
                        setSearchValue(e.target.value);
                        setError(null);
                      }}
                      onKeyPress={handleKeyPress}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <ReceiptIcon />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                )}

                {searchType === 'accountNumber' && (
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="Enter Account Number..."
                      value={searchValue}
                      onChange={(e) => {
                        setSearchValue(e.target.value);
                        setError(null);
                      }}
                      onKeyPress={handleKeyPress}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <AccountCircleIcon />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                )}

                {searchType === 'date' && (
                  <>
                    <Grid item xs={12} sm={6} md={2}>
                      <TextField
                        fullWidth
                        size="small"
                        type="date"
                        label="Start Date"
                        value={startDate}
                        onChange={(e) => {
                          setStartDate(e.target.value);
                          setError(null);
                        }}
                        InputLabelProps={{ shrink: true }}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <DateRangeIcon fontSize="small" />
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6} md={2}>
                      <TextField
                        fullWidth
                        size="small"
                        type="date"
                        label="End Date"
                        value={endDate}
                        onChange={(e) => {
                          setEndDate(e.target.value);
                          setError(null);
                        }}
                        InputLabelProps={{ shrink: true }}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <DateRangeIcon fontSize="small" />
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>
                  </>
                )}

                {searchType === 'status' && (
                  <Grid item xs={12} md={4}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Select Status</InputLabel>
                      <Select
                        value={selectedStatus}
                        onChange={(e) => {
                          setSelectedStatus(e.target.value);
                          setError(null);
                        }}
                        label="Select Status"
                        size="small"
                      >
                        <MenuItem value="completed">Completed</MenuItem>
                        <MenuItem value="pending">Pending</MenuItem>
                        <MenuItem value="failed">Failed</MenuItem>
                        <MenuItem value="processing">Processing</MenuItem>
                        <MenuItem value="approved">Approved</MenuItem>
                        <MenuItem value="rejected">Rejected</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                )}

                {/* Search & Clear Buttons */}
                <Grid item xs={6} md={2}>
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={handleSearch}
                    disabled={loading}
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
                    Clear
                  </Button>
                </Grid>
              </Grid>

              {error && (
                <Alert severity="error" sx={{ mt: 2 }} onClose={() => setError(null)}>
                  {error}
                </Alert>
              )}
            </Box>
          )}
        </Paper>

        {/* Results */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress sx={{ color: "#DAA520" }} />
          </Box>
        ) : history.length === 0 ? (
          <Paper sx={{ p: 8, textAlign: 'center', borderRadius: 2 }}>
            <ReceiptIcon sx={{ fontSize: 64, color: '#ccc', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              {error ? "Error loading data" : "No receipt history found"}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {activeTab === 0 && "No receipts downloaded today"}
              {activeTab === 1 && "Select a search type and enter your criteria above"}
              {activeTab === 2 && "No receipt history records available"}
            </Typography>
          </Paper>
        ) : (
          <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
            <TableContainer sx={{ maxHeight: 600, overflow: 'auto', ...scrollbarStyles }}>
              <Table stickyHeader size="medium">
                <TableHead>
                  <TableRow sx={{ bgcolor: "#fff8e1" }}>
                    <TableCell sx={{ fontWeight: "bold", minWidth: 50 }}>#</TableCell>
                    <TableCell sx={{ fontWeight: "bold", minWidth: 150 }}>Reference ID</TableCell>
                    <TableCell sx={{ fontWeight: "bold", minWidth: 130 }}>Account #</TableCell>
                    <TableCell sx={{ fontWeight: "bold", minWidth: 150 }}>Credited Account</TableCell>
                    <TableCell sx={{ fontWeight: "bold", minWidth: 100 }}>Amount</TableCell>
                    <TableCell sx={{ fontWeight: "bold", minWidth: 100 }}>Bank ID</TableCell>
                    <TableCell sx={{ fontWeight: "bold", minWidth: 100 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: "bold", minWidth: 150 }}>Downloaded By</TableCell>
                    <TableCell sx={{ fontWeight: "bold", minWidth: 180 }}>Downloaded At</TableCell>
                    <TableCell sx={{ fontWeight: "bold", minWidth: 100 }}>Role</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedHistory.map((record, index) => {
                    const actualIndex = page * rowsPerPage + index;
                    
                    return (
                      <TableRow
                        key={record.id || `row-${actualIndex}`}
                        sx={{
                          '&:hover': { bgcolor: '#fafafa' },
                          '&:nth-of-type(odd)': { bgcolor: '#fafafa' },
                        }}
                      >
                        <TableCell>{actualIndex + 1}</TableCell>
                        
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {record.reference_id || "—"}
                          </Typography>
                        </TableCell>
                        
                        <TableCell>
                          <Typography variant="body2">
                            {record.account_number || "—"}
                          </Typography>
                        </TableCell>
                        
                        <TableCell>
                          <Typography variant="body2">
                            {record.credited_account_number || "—"}
                          </Typography>
                        </TableCell>
                        
                        <TableCell>
                          <Typography variant="body2" fontWeight="bold" color="#2e7d32">
                            ETB {record.amount || 0}
                          </Typography>
                        </TableCell>
                        
                        <TableCell>
                          <Typography variant="body2">
                            {record.bank_id || "—"}
                          </Typography>
                        </TableCell>
                        
                        <TableCell>
                          <Chip
                            label={record.status || "—"}
                            size="small"
                            color={getStatusColor(record.status)}
                            sx={{ fontWeight: 'bold' }}
                          />
                        </TableCell>
                        
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Avatar sx={{ 
                              width: 24, 
                              height: 24, 
                              bgcolor: '#1976d2', 
                              fontSize: '0.7rem' 
                            }}>
                              {(record.downloaded_by || 'U').charAt(0).toUpperCase()}
                            </Avatar>
                            <Typography variant="body2">
                              {record.downloaded_by || "Unknown"}
                            </Typography>
                          </Box>
                        </TableCell>
                        
                        <TableCell>
                          <Tooltip title={formatDate(record.downloaded_at)}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <CalendarIcon sx={{ fontSize: 16, color: '#666' }} />
                              <Typography variant="body2">
                                {formatDate(record.downloaded_at)}
                              </Typography>
                            </Box>
                          </Tooltip>
                        </TableCell>
                        
                        <TableCell>
                          <Chip
                            label={record.user_role || "User"}
                            size="small"
                            variant="outlined"
                            sx={{ fontSize: '0.7rem' }}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>

            <TablePagination
              rowsPerPageOptions={[5, 10, 25, 50, 100]}
              component="div"
              count={totalRecords}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
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
        )}

        {/* Snackbar */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={handleSnackbarClose}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: '100%' }}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Container>
    </Box>
  );
};

export default ReceiptHistory;