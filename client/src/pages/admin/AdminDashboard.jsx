// pages/admin/AdminDashboard.jsx
import React, { useState, useEffect } from "react";
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  useMediaQuery,
  useTheme,
  CircularProgress,
  Stack,
  Avatar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  LinearProgress,
  alpha,
  Alert,
  Button
} from "@mui/material";
import {
  Today as TodayIcon,
  AccessTime as AccessTimeIcon,
  CalendarMonth as CalendarMonthIcon,
  Storage as StorageIcon,
  Person as PersonIcon,
  EmojiEvents as EmojiEventsIcon,
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  TrendingFlat as TrendingFlatIcon,
  Refresh as RefreshIcon,
} from "@mui/icons-material";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const API_URL = `${import.meta.env.VITE_API_URL}/api/adminDashboard/stats`;

// Stat Card Component
const StatCard = ({ title, value, total, percentage, icon, color }) => (
  <Card sx={{ bgcolor: "#fff", borderRadius: 2, boxShadow: 1, height: "100%" }}>
    <CardContent>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
        <Box sx={{ flex: 1 }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            {title}
          </Typography>
          <Stack direction="row" alignItems="baseline" spacing={1}>
            <Typography variant="h4" fontWeight="bold" color={color}>
              {value}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              / {total}
            </Typography>
            <Chip
              label={`${percentage}%`}
              size="small"
              sx={{
                bgcolor: alpha(color, 0.1),
                color: color,
                fontWeight: 600,
                fontSize: "0.7rem",
              }}
            />
          </Stack>
          <LinearProgress
            variant="determinate"
            value={Math.min(percentage, 100)}
            sx={{
              mt: 1.5,
              height: 4,
              borderRadius: 2,
              bgcolor: alpha(color, 0.1),
              "& .MuiLinearProgress-bar": { bgcolor: color, borderRadius: 2 },
            }}
          />
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 0.5 }}>
            <Typography variant="caption" color="text.secondary">
              System: {total}
            </Typography>
            {percentage > 25 ? (
              <TrendingUpIcon sx={{ color: "#52c41a", fontSize: 16 }} />
            ) : percentage > 10 ? (
              <TrendingUpIcon sx={{ color: "#1890ff", fontSize: 16 }} />
            ) : percentage > 5 ? (
              <TrendingFlatIcon sx={{ color: "#faad14", fontSize: 16 }} />
            ) : (
              <TrendingDownIcon sx={{ color: "#ff4d4f", fontSize: 16 }} />
            )}
          </Stack>
        </Box>
        <Avatar
          sx={{
            bgcolor: `${color}15`,
            width: 48,
            height: 48,
            ml: 1,
          }}
        >
          {icon}
        </Avatar>
      </Stack>
    </CardContent>
  </Card>
);

// Status Helpers
const getStatusColor = (status) => {
  const colors = {
    'APPROVED': '#52c41a',
    'REJECTED': '#ff4d4f',
    'PENDING': '#faad14',
    'ACTIVE': '#1890ff',
    'INACTIVE': '#d9d9d9',
    'SUSPENDED': '#ff4d4f',
    'DRAFT': '#d9d9d9',
    'COMPLETED': '#52c41a'
  };
  return colors[status] || '#1890ff';
};

const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const navigate = useNavigate();

  const getContainerMargin = () => isMobile ? "0px" : "84px";
  const getContainerWidth = () => isMobile ? "100%" : "calc(100% - 96px)";

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem("token");
      
      if (!token) {
        setError("No authentication token found. Please login again.");
        setLoading(false);
        return;
      }

      console.log("Fetching dashboard data...");
      const response = await axios.get(API_URL, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log("Dashboard response:", response.data);
      
      // Check if response is successful
      if (response.data.success) {
        setData(response.data.data);
      } else {
        setError(response.data.message || "Failed to load dashboard data");
      }
      
    } catch (error) {
      console.error("Error fetching dashboard:", error);
      
      if (error.response) {
        console.error("Response error:", error.response.data);
        console.error("Status:", error.response.status);
        
        if (error.response.status === 401) {
          setError("Session expired. Please login again.");
          localStorage.removeItem("token");
          setTimeout(() => {
            navigate("/login");
          }, 2000);
        } else {
          setError(error.response.data?.message || "Failed to load dashboard data");
        }
      } else if (error.request) {
        setError("Network error. Please check your connection.");
      } else {
        setError(error.message || "An unexpected error occurred");
      }
      
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleRetry = () => {
    fetchData();
  };

  if (loading) {
    return (
      <Box sx={{ minHeight: "100vh", bgcolor: "#f5f5f5", py: 2 }}>
        <Container maxWidth={false} sx={{ width: getContainerWidth(), ml: getContainerMargin() }}>
          <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "400px" }}>
            <CircularProgress sx={{ color: "#DAA520" }} />
          </Box>
        </Container>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ minHeight: "100vh", bgcolor: "#f5f5f5", py: 2 }}>
        <Container maxWidth={false} sx={{ width: getContainerWidth(), ml: getContainerMargin() }}>
          <Paper sx={{ p: 4, textAlign: "center" }}>
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
            <Button
              variant="contained"
              startIcon={<RefreshIcon />}
              onClick={handleRetry}
              sx={{ bgcolor: "#DAA520", "&:hover": { bgcolor: "#b8860b" } }}
            >
              Retry
            </Button>
          </Paper>
        </Container>
      </Box>
    );
  }

  if (!data) {
    return (
      <Box sx={{ minHeight: "100vh", bgcolor: "#f5f5f5", py: 2 }}>
        <Container maxWidth={false} sx={{ width: getContainerWidth(), ml: getContainerMargin() }}>
          <Paper sx={{ p: 4, textAlign: "center" }}>
            <Typography color="text.secondary">No data available</Typography>
            <Button
              variant="contained"
              startIcon={<RefreshIcon />}
              onClick={handleRetry}
              sx={{ mt: 2, bgcolor: "#DAA520", "&:hover": { bgcolor: "#b8860b" } }}
            >
              Refresh
            </Button>
          </Paper>
        </Container>
      </Box>
    );
  }

  const { admin, stats, system, percentages, ranking, recent, statusDistribution } = data;

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
        <Typography variant={isMobile ? "h5" : "h4"} fontWeight="bold" color="#DAA520" gutterBottom>
          Admin Dashboard
        </Typography>

        {/* Welcome */}
        <Paper sx={{ p: 3, mb: 3, borderRadius: 2, background: "linear-gradient(135deg, #DAA520, #b8860b)", color: "white" }}>
          <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems="center" spacing={2}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Avatar sx={{ width: 56, height: 56, bgcolor: "rgba(255,255,255,0.2)" }}>
                <PersonIcon sx={{ fontSize: 32 }} />
              </Avatar>
              <Box>
                <Typography variant="h6" fontWeight="bold">Welcome, {admin?.name || "Admin"}!</Typography>
                <Typography variant="body2" sx={{ opacity: 0.85 }}>
                  {admin?.username || "admin"} • {admin?.role || "ADMIN"}
                </Typography>
              </Box>
            </Stack>
            <Stack direction="row" spacing={1}>
              <Chip
                icon={<EmojiEventsIcon />}
                label={`Rank #${ranking?.rank || 0} of ${ranking?.total || 1}`}
                sx={{ bgcolor: "rgba(255,255,255,0.2)", color: "white", "& .MuiChip-icon": { color: "white" } }}
              />
              <Chip
                icon={<CheckCircleIcon />}
                label="Active"
                sx={{ bgcolor: "rgba(255,255,255,0.2)", color: "white", "& .MuiChip-icon": { color: "white" } }}
              />
            </Stack>
          </Stack>
        </Paper>

        {/* Stats */}
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Today"
              value={stats?.today || 0}
              total={system?.today || 0}
              percentage={percentages?.today || 0}
              icon={<TodayIcon sx={{ color: "#52c41a" }} />}
              color="#52c41a"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="This Week"
              value={stats?.week || 0}
              total={system?.week || 0}
              percentage={percentages?.week || 0}
              icon={<AccessTimeIcon sx={{ color: "#1890ff" }} />}
              color="#1890ff"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="This Month"
              value={stats?.month || 0}
              total={system?.month || 0}
              percentage={percentages?.month || 0}
              icon={<CalendarMonthIcon sx={{ color: "#722ed1" }} />}
              color="#722ed1"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Total"
              value={stats?.total || 0}
              total={system?.total || 0}
              percentage={percentages?.total || 0}
              icon={<StorageIcon sx={{ color: "#cf1322" }} />}
              color="#cf1322"
            />
          </Grid>
        </Grid>

        {/* Summary */}
        <Paper sx={{ p: 2, mt: 2, borderRadius: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={4}><Box textAlign="center">
              <Typography variant="caption" color="text.secondary">My Changes</Typography>
              <Typography variant="h5" fontWeight="bold">{stats?.total || 0}</Typography>
            </Box></Grid>
            <Grid item xs={4}><Box textAlign="center">
              <Typography variant="caption" color="text.secondary">System Changes</Typography>
              <Typography variant="h5" fontWeight="bold">{system?.total || 0}</Typography>
            </Box></Grid>
            <Grid item xs={4}><Box textAlign="center">
              <Typography variant="caption" color="text.secondary">Contribution</Typography>
              <Typography variant="h5" fontWeight="bold" color="#52c41a">{percentages?.total || 0}%</Typography>
            </Box></Grid>
          </Grid>
        </Paper>

        {/* Recent & Distribution */}
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 2, borderRadius: 2 }}>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                <AssignmentIcon sx={{ color: "#DAA520" }} />
                <Typography variant="h6" fontWeight="bold">Recent Activity</Typography>
                <Chip label={recent?.length || 0} size="small" sx={{ bgcolor: "#DAA520", color: "white" }} />
              </Stack>
              {recent && recent.length > 0 ? (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Account</TableCell>
                        <TableCell>Status Change</TableCell>
                        <TableCell>Time</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {recent.map((row, i) => (
                        <TableRow key={i}>
                          <TableCell><Typography variant="body2" fontWeight={600}>{row.account_number}</Typography></TableCell>
                          <TableCell>
                            <Stack direction="row" alignItems="center" spacing={0.5}>
                              <Chip label={row.old_status} size="small" sx={{ bgcolor: alpha(getStatusColor(row.old_status), 0.1), color: getStatusColor(row.old_status), fontSize: "0.7rem" }} />
                              <Typography variant="body2">→</Typography>
                              <Chip label={row.new_status} size="small" sx={{ bgcolor: alpha(getStatusColor(row.new_status), 0.1), color: getStatusColor(row.new_status), fontSize: "0.7rem" }} />
                            </Stack>
                          </TableCell>
                          <TableCell><Typography variant="caption" color="text.secondary">{new Date(row.created_at).toLocaleString()}</Typography></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Box textAlign="center" py={3}><Typography color="text.secondary">No recent activity</Typography></Box>
              )}
            </Paper>
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2, borderRadius: 2 }}>
              <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>Today's Distribution</Typography>
              {statusDistribution && statusDistribution.length > 0 ? (
                <Stack spacing={1}>
                  {statusDistribution.map((item) => (
                    <Card key={item.new_status} variant="outlined" sx={{ borderRadius: 1 }}>
                      <CardContent sx={{ py: 1, "&:last-child": { pb: 1 } }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                          <Typography variant="body2" fontWeight={500}>{item.new_status}</Typography>
                          <Chip label={item.count} size="small" sx={{ bgcolor: alpha(getStatusColor(item.new_status), 0.1), color: getStatusColor(item.new_status), fontWeight: 600 }} />
                        </Stack>
                      </CardContent>
                    </Card>
                  ))}
                </Stack>
              ) : (
                <Box textAlign="center" py={3}><Typography color="text.secondary">No changes today</Typography></Box>
              )}
            </Paper>
          </Grid>
        </Grid>

      </Container>
    </Box>
  );
};

export default AdminDashboard;