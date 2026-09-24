// pages/Transactions.jsx
import React, { useState, useCallback, useEffect } from "react";
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
  CircularProgress,
  useMediaQuery,
  useTheme,
  Button,
  Tooltip,
  Alert,
  Snackbar,
  TablePagination,
  Badge,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
} from "@mui/material";
import {
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  AccountCircle as AccountCircleIcon,
  CalendarToday as CalendarIcon,
  Receipt as ReceiptIcon,
  Print as PrintIcon,
  Visibility as VisibilityIcon,
  Close as CloseIcon,
} from "@mui/icons-material";
import axios from "axios";
import { format } from "date-fns";

const Transactions = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  // Data states
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [totalRecords, setTotalRecords] = useState(0);

  // Filter states
  const [accountNumber, setAccountNumber] = useState("");
  const [selectedDate, setSelectedDate] = useState("");

  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Snackbar
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  // Preview dialog state
  const [receiptDialogOpen, setReceiptDialogOpen] = useState(false);
  const [selectedReceiptData, setSelectedReceiptData] = useState(null);
  const [receiptBlobUrl, setReceiptBlobUrl] = useState("");
  const [previewLoading, setPreviewLoading] = useState(false);

  const getContainerMargin = () => (isMobile ? "0px" : "84px");
  const getContainerWidth = () =>
    isMobile ? "100%" : "calc(100% - 96px)";

  const scrollbarStyles = {
    "&::-webkit-scrollbar": { width: "8px", height: "8px" },
    "&::-webkit-scrollbar-track": { backgroundColor: "#f1f1f1", borderRadius: "4px" },
    "&::-webkit-scrollbar-thumb": {
      backgroundColor: "#DAA520",
      borderRadius: "4px",
      "&:hover": { backgroundColor: "#b8860b" },
    },
  };

  const showSnackbar = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  // 🔥 Fetch transactions list
  const fetchTransactions = useCallback(async () => {
    if (!accountNumber) {
      setError("Please enter an Account Number");
      return;
    }
    if (!selectedDate) {
      setError("Please select a date");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("token");

      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/receipt/transactions`,
        {
          params: { accountNumber: accountNumber.trim(), date: selectedDate },
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        const data = response.data.data || [];
        setTransactions(data);
        setTotalRecords(data.length);

        if (data.length === 0) {
          showSnackbar(
            response.data.message ||
              "No transactions found for this account and date",
            "info"
          );
        } else {
          showSnackbar(`Found ${data.length} transactions`, "success");
        }
      } else {
        setError(response.data.message || "Failed to fetch transactions");
        setTransactions([]);
        setTotalRecords(0);
      }
    } catch (err) {
      console.error("Error fetching transactions:", err);
      setError(err.response?.data?.message || "Error fetching transactions");
      setTransactions([]);
      setTotalRecords(0);
    } finally {
      setLoading(false);
    }
  }, [accountNumber, selectedDate]);

  // 🔥 Log receipt download
  const logReceiptDownload = useCallback(async (transaction) => {
    if (!transaction || !transaction.referenceId) return false;

    try {
      const token = localStorage.getItem("token");
      const currentUser = JSON.parse(localStorage.getItem("user") || "{}");

      const logData = {
        referenceId: transaction.referenceId,
        accountNumber: transaction.AccountNumber,
        accountHolderName: transaction.AccountHolderName,
        creditedAccountNumber: transaction.CreditedAccountNumber,
        amount: transaction.amount,
        paymentType: transaction.paymentType,
        paymentScheme: transaction.paymentScheme,
        bankId: transaction.bankId,
        status: transaction.status,
        executionDate: transaction.requestedExecutionDate,
        downloadedBy: currentUser?.username || "unknown",
        userRole: currentUser?.role || "unknown",
        downloadedAt: new Date().toISOString(),
      };

      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/receipt/log`,
        logData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      return true;
    } catch (err) {
      console.error("❌ Failed to log receipt download:", err);
      return false;
    }
  }, []);

  // 🔥 Fetch the PDF as a Blob and return an object URL
  const fetchReceiptBlobUrl = useCallback(async (referenceId) => {
    const token = localStorage.getItem("token");

    const response = await axios.get(
      `${import.meta.env.VITE_API_URL}/api/receipt/view/${referenceId}`,
      {
        headers: { Authorization: `Bearer ${token}` },
        responseType: "blob",
      }
    );

    const blob = new Blob([response.data], { type: "application/pdf" });
    return URL.createObjectURL(blob);
  }, []);

  // 🔥 Download receipt
  const downloadReceipt = useCallback(
    async (transaction) => {
      if (!transaction || !transaction.referenceId) {
        showSnackbar("No reference ID available", "warning");
        return;
      }

      try {
        await logReceiptDownload(transaction);
        const url = await fetchReceiptBlobUrl(transaction.referenceId);

        const link = document.createElement("a");
        link.href = url;
        link.download = `${transaction.referenceId}.pdf`;
        document.body.appendChild(link);
        link.click();
        link.remove();

        setTimeout(() => URL.revokeObjectURL(url), 3000);

        showSnackbar(`Receipt ${transaction.referenceId} downloaded`, "success");
        setTimeout(() => fetchTransactions(), 1000);
      } catch (err) {
        console.error("Error downloading receipt:", err);
        const msg =
          err.response?.status === 404
            ? "Receipt PDF not found on server"
            : "Error downloading receipt";
        showSnackbar(msg, "error");
      }
    },
    [logReceiptDownload, fetchReceiptBlobUrl, fetchTransactions]
  );

  // 🔥 Close dialog + revoke blob URL
  const closeReceiptDialog = useCallback(() => {
    setReceiptDialogOpen(false);
    setPreviewLoading(false);
    if (receiptBlobUrl) {
      URL.revokeObjectURL(receiptBlobUrl);
      setReceiptBlobUrl("");
    }
    setSelectedReceiptData(null);
  }, [receiptBlobUrl]);

  // 🔥 Preview receipt (iframe in dialog)
  const previewReceipt = useCallback(
    async (transaction) => {
      if (!transaction || !transaction.referenceId) {
        showSnackbar("No reference ID available", "warning");
        return;
      }

      // open dialog immediately with loader
      setSelectedReceiptData(transaction);
      setReceiptBlobUrl("");
      setPreviewLoading(true);
      setReceiptDialogOpen(true);

      try {
        await logReceiptDownload(transaction);
        const url = await fetchReceiptBlobUrl(transaction.referenceId);

        // revoke any prior blob before setting new one
        setReceiptBlobUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return url;
        });
      } catch (err) {
        console.error("Error previewing receipt:", err);
        const msg =
          err.response?.status === 404
            ? "Receipt PDF not found on server"
            : "Error previewing receipt";
        showSnackbar(msg, "error");
        closeReceiptDialog();
      } finally {
        setPreviewLoading(false);
      }
    },
    [logReceiptDownload, fetchReceiptBlobUrl, closeReceiptDialog]
  );

  // 🔥 Download from preview dialog
  const downloadFromPreview = useCallback(async () => {
    if (!selectedReceiptData) return;
    await downloadReceipt(selectedReceiptData);
    closeReceiptDialog();
  }, [selectedReceiptData, downloadReceipt, closeReceiptDialog]);

  // Cleanup blob URL on unmount
  useEffect(() => {
    return () => {
      if (receiptBlobUrl) URL.revokeObjectURL(receiptBlobUrl);
    };
  }, [receiptBlobUrl]);

  // ---- Handlers ----
  const handleSearch = (e) => {
    if (e) e.preventDefault();
    setPage(0);
    fetchTransactions();
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") handleSearch(e);
  };

  const handleReset = () => {
    setAccountNumber("");
    setSelectedDate("");
    setError(null);
    setTransactions([]);
    setTotalRecords(0);
    setPage(0);
  };

  const handleChangePage = (event, newPage) => setPage(newPage);

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSnackbarClose = () =>
    setSnackbar((s) => ({ ...s, open: false }));

  const getStatusColor = (status) => {
    if (!status) return "default";
    switch (status.toLowerCase()) {
      case "completed":
      case "success":
      case "approved":
        return "success";
      case "pending":
      case "processing":
        return "warning";
      case "failed":
      case "rejected":
      case "cancelled":
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

  const paginatedTransactions = transactions.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

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
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 3,
            flexWrap: "wrap",
            gap: 2,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <ReceiptIcon sx={{ fontSize: 32, color: "#DAA520" }} />
            <Typography
              variant={isMobile ? "h5" : "h4"}
              fontWeight="bold"
              color="#DAA520"
            >
              Transaction History
            </Typography>
            <Badge badgeContent={totalRecords} color="warning" sx={{ ml: 1 }}>
              <Chip
                icon={<ReceiptIcon />}
                label="Transactions"
                color="warning"
                size="small"
                variant="outlined"
              />
            </Badge>
          </Box>
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={fetchTransactions}
              disabled={loading || !accountNumber || !selectedDate}
              sx={{ borderColor: "#DAA520", color: "#DAA520" }}
            >
              Refresh
            </Button>
          </Box>
        </Box>

        {/* Search Card */}
        <Paper sx={{ mb: 3, borderRadius: 2, p: 2 }}>
          <Grid container spacing={2} alignItems="flex-end">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                size="small"
                label="Account Number"
                placeholder="Enter account number..."
                value={accountNumber}
                onChange={(e) => {
                  setAccountNumber(e.target.value);
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

            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                size="small"
                type="date"
                label="Date"
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  setError(null);
                }}
                InputLabelProps={{ shrink: true }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <CalendarIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            <Grid item xs={6} md={2.5}>
              <Button
                fullWidth
                variant="contained"
                onClick={handleSearch}
                disabled={loading || !accountNumber || !selectedDate}
                sx={{
                  bgcolor: "#DAA520",
                  color: "#000",
                  "&:hover": { bgcolor: "#b8860b" },
                  "&:disabled": { bgcolor: "#ccc", color: "#666" },
                }}
              >
                {loading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  "Search"
                )}
              </Button>
            </Grid>
            <Grid item xs={6} md={2.5}>
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
        </Paper>

        {/* Results */}
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <CircularProgress sx={{ color: "#DAA520" }} />
          </Box>
        ) : transactions.length === 0 ? (
          <Paper sx={{ p: 8, textAlign: "center", borderRadius: 2 }}>
            <ReceiptIcon sx={{ fontSize: 64, color: "#ccc", mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              {error ? "Error loading data" : "No transactions found"}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Enter an account number and date to search for transactions
            </Typography>
          </Paper>
        ) : (
          <Paper sx={{ borderRadius: 2, overflow: "hidden" }}>
            <TableContainer
              sx={{ maxHeight: 600, overflow: "auto", ...scrollbarStyles }}
            >
              <Table stickyHeader size="medium">
                <TableHead>
                  <TableRow sx={{ bgcolor: "#fff8e1" }}>
                    {[
                      "#",
                      "Account #",
                      "Holder Name",
                      "Credited Account",
                      "Reference ID",
                      "Amount",
                      "Payment Type",
                      "Payment Scheme",
                      "Bank ID",
                      "Status",
                      "Execution Date",
                      "Receipt",
                    ].map((h) => (
                      <TableCell
                        key={h}
                        sx={{ fontWeight: "bold", whiteSpace: "nowrap" }}
                      >
                        {h}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedTransactions.map((t, index) => {
                    const actualIndex = page * rowsPerPage + index;
                    const hasReference =
                      t.referenceId && t.referenceId !== "N/A";
                    const isDownloaded = t.isDownloadedToday === true;

                    return (
                      <TableRow
                        key={t.referenceId || `row-${actualIndex}`}
                        sx={{
                          "&:hover": { bgcolor: "#fafafa" },
                          "&:nth-of-type(odd)": { bgcolor: "#fafafa" },
                        }}
                      >
                        <TableCell sx={{ whiteSpace: "nowrap" }}>
                          {actualIndex + 1}
                        </TableCell>
                        <TableCell sx={{ whiteSpace: "nowrap" }}>
                          {t.AccountNumber || "—"}
                        </TableCell>
                        <TableCell sx={{ whiteSpace: "nowrap" }}>
                          {t.AccountHolderName || "—"}
                        </TableCell>
                        <TableCell sx={{ whiteSpace: "nowrap" }}>
                          {t.CreditedAccountNumber || "—"}
                        </TableCell>
                        <TableCell sx={{ whiteSpace: "nowrap" }}>
                          <Chip
                            label={t.referenceId || "—"}
                            size="small"
                            variant="outlined"
                            sx={{ fontSize: "0.7rem" }}
                          />
                        </TableCell>
                        <TableCell sx={{ whiteSpace: "nowrap" }}>
                          <Typography
                            variant="body2"
                            fontWeight="bold"
                            color="#2e7d32"
                          >
                            ETB {t.amount}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ whiteSpace: "nowrap" }}>
                          <Chip
                            label={t.paymentType || "—"}
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell sx={{ whiteSpace: "nowrap" }}>
                          {t.paymentScheme || "—"}
                        </TableCell>
                        <TableCell sx={{ whiteSpace: "nowrap" }}>
                          {t.bankId || "—"}
                        </TableCell>
                        <TableCell sx={{ whiteSpace: "nowrap" }}>
                          <Chip
                            label={t.status || "Unknown"}
                            size="small"
                            color={getStatusColor(t.status)}
                            sx={{ fontWeight: "bold" }}
                          />
                        </TableCell>
                        <TableCell sx={{ whiteSpace: "nowrap" }}>
                          <Tooltip title={formatDate(t.requestedExecutionDate)}>
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 0.5,
                              }}
                            >
                              <CalendarIcon sx={{ fontSize: 16, color: "#666" }} />
                              <Typography variant="body2">
                                {formatDate(t.requestedExecutionDate)}
                              </Typography>
                            </Box>
                          </Tooltip>
                        </TableCell>
                        <TableCell sx={{ whiteSpace: "nowrap" }}>
                          <Box sx={{ display: "flex", gap: 0.5 }}>
                            {hasReference ? (
                              isDownloaded ? (
                                <Chip
                                  label="Downloaded Today"
                                  color="success"
                                  size="small"
                                  icon={<DownloadIcon sx={{ fontSize: 14 }} />}
                                  sx={{ fontWeight: "bold" }}
                                />
                              ) : (
                                <Tooltip title="Preview Receipt">
                                  <IconButton
                                    size="small"
                                    onClick={() => previewReceipt(t)}
                                    sx={{
                                      color: "#DAA520",
                                      "&:hover": {
                                        bgcolor: "rgba(218, 165, 32, 0.1)",
                                      },
                                    }}
                                  >
                                    <VisibilityIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              )
                            ) : (
                              <Typography variant="caption" color="text.secondary">
                                No receipt
                              </Typography>
                            )}
                          </Box>
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
                borderTop: "1px solid #e0e0e0",
                "& .MuiTablePagination-select": { color: "#DAA520" },
                "& .MuiTablePagination-actions .MuiIconButton-root": {
                  color: "#DAA520",
                  "&:hover": {
                    backgroundColor: "rgba(218, 165, 32, 0.1)",
                  },
                },
              }}
            />
          </Paper>
        )}

        {/* Receipt Preview Dialog (iframe) */}
        <Dialog
          open={receiptDialogOpen}
          onClose={closeReceiptDialog}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: { borderRadius: 2, height: "80vh" },
          }}
        >
          <DialogTitle
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              borderBottom: "1px solid #e0e0e0",
              bgcolor: "#f5f5f5",
            }}
          >
            <Typography variant="h6" fontWeight="bold" color="#DAA520">
              Receipt Preview
            </Typography>
            <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
              <Button
                variant="outlined"
                startIcon={<PrintIcon />}
                onClick={() => {
                  const iframe = document.getElementById("receipt-preview-iframe");
                  if (iframe?.contentWindow) iframe.contentWindow.print();
                }}
                size="small"
                disabled={previewLoading || !receiptBlobUrl}
                sx={{ borderColor: "#DAA520", color: "#DAA520" }}
              >
                Print
              </Button>
              <Button
                variant="contained"
                startIcon={<DownloadIcon />}
                onClick={downloadFromPreview}
                size="small"
                disabled={previewLoading || !selectedReceiptData}
                sx={{
                  bgcolor: "#DAA520",
                  color: "#000",
                  "&:hover": { bgcolor: "#b8860b" },
                }}
              >
                Download
              </Button>
              <Tooltip title="Close Preview">
                <IconButton
                  onClick={closeReceiptDialog}
                  sx={{
                    color: "#ff4444",
                    border: "1px solid #ff4444",
                    borderRadius: "50%",
                    width: 36,
                    height: 36,
                    "&:hover": {
                      bgcolor: "rgba(255, 68, 68, 0.1)",
                      borderColor: "#ff0000",
                    },
                  }}
                >
                  <CloseIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </DialogTitle>

          <DialogContent
            sx={{ p: 0, height: "calc(80vh - 64px)", position: "relative" }}
          >
            {previewLoading ? (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  height: "100%",
                }}
              >
                <CircularProgress sx={{ color: "#DAA520" }} />
              </Box>
            ) : receiptBlobUrl ? (
              <iframe
                id="receipt-preview-iframe"
                src={receiptBlobUrl}
                style={{ width: "100%", height: "100%", border: "none" }}
                title="Receipt Preview"
              />
            ) : (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  height: "100%",
                  color: "text.secondary",
                }}
              >
                <Typography>No preview available</Typography>
              </Box>
            )}
          </DialogContent>

          <DialogActions sx={{ borderTop: "1px solid #e0e0e0", p: 2 }}>
            <Button
              onClick={closeReceiptDialog}
              sx={{
                color: "#ff4444",
                "&:hover": { bgcolor: "rgba(255, 68, 68, 0.1)" },
              }}
            >
              Close
            </Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={handleSnackbarClose}
          anchorOrigin={{ vertical: "top", horizontal: "right" }}
        >
          <Alert
            onClose={handleSnackbarClose}
            severity={snackbar.severity}
            sx={{ width: "100%" }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Container>
    </Box>
  );
};

export default Transactions;