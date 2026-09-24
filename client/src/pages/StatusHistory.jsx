// pages/superAdmin/StatusHistory.jsx
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
  Comment as CommentIcon,
  AccountCircle as AccountCircleIcon,
  Today as TodayIcon,
  People as PeopleIcon,
  Autorenew as AutorenewIcon,
  FilterList as FilterListIcon,
  Person as PersonIcon,
  DateRange as DateRangeIcon,
} from "@mui/icons-material";
import axios from "axios";
import { format } from "date-fns";

const StatusHistory = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [totalRecords, setTotalRecords] = useState(0);
  const [activeTab, setActiveTab] = useState(0);
  const [filterType, setFilterType] = useState("today");
  
  // Filter states for FILTERED tab
  const [searchType, setSearchType] = useState("today");
  const [searchValue, setSearchValue] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedChangedBy, setSelectedChangedBy] = useState("");
  const [admins, setAdmins] = useState([]);
  const [loadingAdmins, setLoadingAdmins] = useState(false);
  
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

  // Fetch admins for dropdown
  const fetchAdmins = async () => {
    try {
      setLoadingAdmins(true);
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/harmonizationHistory/admins`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      console.log("Admins response:", response.data);
      
      if (response.data.success && response.data.data) {
        setAdmins(response.data.data);
      } else {
        setAdmins([]);
      }
    } catch (err) {
      console.error("Error fetching admins:", err);
      setAdmins([]);
    } finally {
      setLoadingAdmins(false);
    }
  };

  // Fetch status history
  const fetchStatusHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("token");

      let endpoint = '';
      let params = new URLSearchParams();

      if (filterType === "today") {
        endpoint = '/api/harmonizationHistory/today';
      } else if (filterType === "manual") {
        endpoint = '/api/harmonizationHistory/except-auto';
      } else if (filterType === "filtered") {
        endpoint = '/api/harmonizationHistory/filtered';
        params.append('searchType', searchType);
        
        if (searchType === 'account' && searchValue) {
          params.append('searchValue', searchValue);
        } else if (searchType === 'date' && startDate && endDate) {
          params.append('startDate', startDate);
          params.append('endDate', endDate);
        } else if (searchType === 'changedBy' && selectedChangedBy) {
          params.append('changedBy', selectedChangedBy);
        }
      } else {
        endpoint = '/api/harmonizationHistory/all';
      }

      const url = params.toString() 
        ? `${import.meta.env.VITE_API_URL}${endpoint}?${params.toString()}`
        : `${import.meta.env.VITE_API_URL}${endpoint}`;

      console.log("Fetching URL:", url);

      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setHistory(response.data.data || []);
      setTotalRecords(response.data.count || (response.data.data ? response.data.data.length : 0));
    } catch (err) {
      console.error("Error fetching status history:", err);
      setError(err.response?.data?.message || "Error fetching status history");
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
        // Validate before searching
        if (searchType === 'account' && !searchValue) {
          setError("Please enter an Account Number");
          return;
        } else if (searchType === 'date' && (!startDate || !endDate)) {
          setError("Please select both Start Date and End Date");
          return;
        } else if (searchType === 'changedBy' && !selectedChangedBy) {
          setError("Please select an admin");
          return;
        }
        setError(null);
        fetchStatusHistory();
      }
    }, 500);
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    setError(null);
    setPage(0);
    
    // Reset filters when switching tabs
    if (newValue !== 2) {
      setSearchValue("");
      setStartDate("");
      setEndDate("");
      setSelectedChangedBy("");
    }
    
    switch(newValue) {
      case 0:
        setFilterType("today");
        break;
      case 1:
        setFilterType("manual");
        break;
      case 2:
        setFilterType("filtered");
        break;
      case 3:
        setFilterType("all");
        break;
      default:
        setFilterType("today");
    }
  };

  const handleSearch = (e) => {
    if (e) e.preventDefault();
    setPage(0);
    
    if (searchType === 'account' && !searchValue) {
      setError("Please enter an Account Number");
      return;
    } else if (searchType === 'date' && (!startDate || !endDate)) {
      setError("Please select both Start Date and End Date");
      return;
    } else if (searchType === 'changedBy' && !selectedChangedBy) {
      setError("Please select an admin");
      return;
    }
    setError(null);
    fetchStatusHistory();
  };

  const handleReset = () => {
    setSearchValue("");
    setStartDate("");
    setEndDate("");
    setSelectedChangedBy("");
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
    if (status === "UPDATED") return "success";
    if (status === "UPDATEDs") return "warning";
    return "default";
  };

  const formatDate = (dateString) => {
    if (!dateString) return "—";
    try {
      return format(new Date(dateString), "MMM dd, yyyy HH:mm:ss");
    } catch {
      return dateString;
    }
  };

  const getInitial = (name) => {
    if (!name) return "S";
    return name.charAt(0).toUpperCase();
  };

  const getFilterLabel = () => {
    switch(filterType) {
      case "today": return "Today's Changes";
      case "manual": return "Manual Changes";
      case "filtered": return "Filtered Results";
      case "all": return "All Records";
      default: return "Today's Changes";
    }
  };

  const getFilterIcon = () => {
    switch(filterType) {
      case "today": return <TodayIcon />;
      case "manual": return <PeopleIcon />;
      case "filtered": return <FilterListIcon />;
      case "all": return <HistoryIcon />;
      default: return <TodayIcon />;
    }
  };

  const paginatedHistory = history.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  // Load admins when filtered tab is active
  useEffect(() => {
    if (activeTab === 2) {
      fetchAdmins();
    }
  }, [activeTab]);

  // Auto-search when any filter changes in filtered tab
  useEffect(() => {
    if (filterType === "filtered" && !isFirstMount.current) {
      debouncedSearch();
    }
  }, [searchType, searchValue, startDate, endDate, selectedChangedBy]);

  // Unified pipeline execution on initial layout mounting and state mutations
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      fetchStatusHistory();
      return;
    }

    if (filterType !== "filtered") {
      fetchStatusHistory();
    }
  }, [filterType]);

  // Background Sync Worker Loop
  useEffect(() => {
    if (history.length > 0 && filterType !== "filtered") {
      const interval = setInterval(() => {
        fetchStatusHistory();
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
            <HistoryIcon sx={{ fontSize: 32, color: '#DAA520' }} />
            <Typography variant={isMobile ? "h5" : "h4"} fontWeight="bold" color="#DAA520">
              Status History
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
              onClick={fetchStatusHistory}
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
            <Tab icon={<PeopleIcon />} label="Manual Changes(1000)" iconPosition="start" />
            <Tab icon={<FilterListIcon />} label="Filtered" iconPosition="start" />
            <Tab icon={<HistoryIcon />} label="All(1000)" iconPosition="start" />
          </Tabs>

          {/* Advanced Filters - Only show for Filtered tab */}
          {activeTab === 2 && (
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
                        setSelectedChangedBy("");
                        setError(null);
                      }}
                      label="Search By"
                      size="small"
                    >
                      <MenuItem value="today">
                        <TodayIcon sx={{ mr: 1, fontSize: 18 }} />
                        Today
                      </MenuItem>
                      <MenuItem value="account">
                        <AccountCircleIcon sx={{ mr: 1, fontSize: 18 }} />
                        Account Number
                      </MenuItem>
                      <MenuItem value="date">
                        <DateRangeIcon sx={{ mr: 1, fontSize: 18 }} />
                        Date Range
                      </MenuItem>
                      <MenuItem value="changedBy">
                        <PersonIcon sx={{ mr: 1, fontSize: 18 }} />
                        Changed By
                      </MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                {/* Dynamic Search Fields */}
                {searchType === 'account' && (
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

                {searchType === 'changedBy' && (
                  <Grid item xs={12} md={4} sx={{ minWidth: 250 }}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Select Admin</InputLabel>
                      <Select
                        value={selectedChangedBy}
                        onChange={(e) => {
                          setSelectedChangedBy(e.target.value);
                          setError(null);
                        }}
                        label="Select Admin"
                        disabled={loadingAdmins}
                        size="small"
                        sx={{ minWidth: 200 }}
                      >
                        {admins.map((admin) => (
                          <MenuItem key={admin.id} value={admin.username}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Avatar sx={{ width: 20, height: 20, bgcolor: '#DAA520', fontSize: '0.6rem' }}>
                                {admin.username.charAt(0).toUpperCase()}
                              </Avatar>
                              {admin.username}
                            </Box>
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                )}

                {searchType === 'today' && (
                  <Grid item xs={12} md={4}>
                    <Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>
                      <TodayIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                      Showing today's changes
                    </Typography>
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
            <HistoryIcon sx={{ fontSize: 64, color: '#ccc', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              {error ? "Error loading data" : "No status history found"}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {activeTab === 0 && "No changes recorded today"}
              {activeTab === 1 && "No manual changes found"}
              {activeTab === 2 && "Select a search type and enter your criteria above"}
              {activeTab === 3 && "No history records available"}
            </Typography>
          </Paper>
        ) : (
          <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
            <TableContainer sx={{ maxHeight: 600, overflow: 'auto', ...scrollbarStyles }}>
              <Table stickyHeader size="medium">
                <TableHead>
                  <TableRow sx={{ bgcolor: "#fff8e1" }}>
                    <TableCell sx={{ fontWeight: "bold", minWidth: 50 }}>#</TableCell>
                    <TableCell sx={{ fontWeight: "bold", minWidth: 130 }}>Account #</TableCell>
                    <TableCell sx={{ fontWeight: "bold", minWidth: 150 }}>Customer Name</TableCell>
                    <TableCell sx={{ fontWeight: "bold", minWidth: 120 }}>Customer ID</TableCell>
                    <TableCell sx={{ fontWeight: "bold", minWidth: 120 }}>Previous Status</TableCell>
                    <TableCell sx={{ fontWeight: "bold", minWidth: 120 }}>New Status</TableCell>
                    <TableCell sx={{ fontWeight: "bold", minWidth: 150 }}>Changed By</TableCell>
                    <TableCell sx={{ fontWeight: "bold", minWidth: 180 }}>Changed At</TableCell>
                    <TableCell sx={{ fontWeight: "bold", minWidth: 200 }}>Reason / Ticket</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedHistory.map((record, index) => {
                    const actualIndex = page * rowsPerPage + index;
                    const isAuto = !record.changed_by;
                    
                    return (
                      <TableRow
                        key={record.id || `row-${actualIndex}`}
                        sx={{
                          '&:hover': { bgcolor: '#fafafa' },
                          '&:nth-of-type(odd)': { bgcolor: '#fafafa' },
                          bgcolor: isAuto ? '#f5f5f5' : 'inherit',
                        }}
                      >
                        <TableCell>{actualIndex + 1}</TableCell>
                        
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {record.account_number || record.account_id || "—"}
                          </Typography>
                          {isAuto && (
                            <Chip 
                              label="Auto" 
                              size="small" 
                              color="default" 
                              sx={{ fontSize: '0.6rem', height: 18, mt: 0.5 }}
                            />
                          )}
                        </TableCell>
                        
                        <TableCell>
                          <Typography variant="body2">
                            {record.full_name || "—"}
                          </Typography>
                        </TableCell>
                        
                        <TableCell>
                          <Typography variant="body2">
                            {record.customer_id || "—"}
                          </Typography>
                        </TableCell>
                        
                        <TableCell>
                          <Chip
                            label={record.old_status || "—"}
                            size="small"
                            color={getStatusColor(record.old_status)}
                          />
                        </TableCell>
                        
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Chip
                              label={record.new_status || "—"}
                              size="small"
                              color={getStatusColor(record.new_status)}
                            />
                            {record.old_status !== record.new_status && (
                              <AutorenewIcon sx={{ fontSize: 14, color: '#666' }} />
                            )}
                          </Box>
                        </TableCell>
                        
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Avatar sx={{ 
                              width: 24, 
                              height: 24, 
                              bgcolor: isAuto ? '#999' : '#1976d2', 
                              fontSize: '0.7rem' 
                            }}>
                              {getInitial(record.changed_by_name)}
                            </Avatar>
                            <Typography variant="body2">
                              {record.changed_by_name || "System"}
                            </Typography>
                          </Box>
                        </TableCell>
                        
                        <TableCell>
                          <Tooltip title={formatDate(record.created_at)}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <CalendarIcon sx={{ fontSize: 16, color: '#666' }} />
                              <Typography variant="body2">
                                {formatDate(record.created_at)}
                              </Typography>
                            </Box>
                          </Tooltip>
                        </TableCell>
                        
                        <TableCell>
                          <Tooltip title={record.reason || "No reason provided"}>
                            <Box sx={{ 
                              display: 'flex',
                              alignItems: 'flex-start',
                              gap: 0.5
                            }}>
                              <CommentIcon sx={{ fontSize: 14, color: '#666', mt: 0.3 }} />
                              <Typography variant="body2" sx={{ 
                                wordBreak: 'break-word',
                                maxHeight: 60,
                                overflow: 'auto',
                                ...scrollbarStyles,
                              }}>
                                {record.reason || "—"}
                              </Typography>
                            </Box>
                          </Tooltip>
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

export default StatusHistory;