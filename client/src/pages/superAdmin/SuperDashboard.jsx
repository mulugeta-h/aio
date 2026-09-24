// pages/superAdmin/SuperDashboard.jsx
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
} from "@mui/material";
import {
  Storage as StorageIcon,
  Update as UpdateIcon,
  Male as MaleIcon,
  Female as FemaleIcon,
  People as PeopleIcon,
  AccountBalance as AccountBalanceIcon,
  Phone as PhoneIcon,
  Dashboard as DashboardIcon,
} from "@mui/icons-material";
import axios from "axios";

const API_URL = `${import.meta.env.VITE_API_URL}/api/superDashboard/dashboard`;

const StatCard = ({ title, value, icon, color = "#DAA520", subtitle }) => (
  <Card sx={{ bgcolor: "#fff", borderRadius: 2, boxShadow: 1, height: "100%" }}>
    <CardContent>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Box>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            {title}
          </Typography>
          <Typography variant="h4" fontWeight="bold" color={color}>
            {value?.toLocaleString() ?? "—"}
          </Typography>
          {subtitle && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
              {subtitle}
            </Typography>
          )}
        </Box>
        <Avatar
          sx={{
            bgcolor: `${color}15`,
            width: 48,
            height: 48,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {icon}
        </Avatar>
      </Stack>
    </CardContent>
  </Card>
);

const SectionTitle = ({ text, color = "#DAA520" }) => (
  <Typography
    variant="h6"
    fontWeight="bold"
    sx={{ mt: 3, mb: 2, color: color, borderLeft: `4px solid ${color}`, pl: 2 }}
  >
    {text}
  </Typography>
);

const SuperDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        const response = await axios.get(API_URL, {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log("Dashboard data:", response.data);
        setData(response.data);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <Box sx={{ minHeight: "100vh", bgcolor: "#f5f5f5", py: isMobile ? 1 : 2 }}>
        <Container
          maxWidth={false}
          sx={{
            width: getContainerWidth(),
            ml: getContainerMargin(),
            mr: isMobile ? 0 : "12px",
            px: { xs: 1, sm: 2, md: 0.5 },
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "400px",
          }}
        >
          <CircularProgress sx={{ color: "#DAA520" }} />
        </Container>
      </Box>
    );
  }

  if (!data) {
    return (
      <Box sx={{ minHeight: "100vh", bgcolor: "#f5f5f5", py: isMobile ? 1 : 2 }}>
        <Container
          maxWidth={false}
          sx={{
            width: getContainerWidth(),
            ml: getContainerMargin(),
            mr: isMobile ? 0 : "12px",
            px: { xs: 1, sm: 2, md: 0.5 },
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "400px",
          }}
        >
          <Typography color="error">No data available. Please check your connection.</Typography>
        </Container>
      </Box>
    );
  }

  const newCore = data.new_core_data;
  const oldCore = data.old_core_data;

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
        <Typography
          variant={isMobile ? "h5" : "h4"}
          fontWeight="bold"
          color="#DAA520"
          gutterBottom
          sx={{ mb: 3 }}
        >
          Super Admin Dashboard
        </Typography>

        {/* NEW CORE DATA SECTION */}
        <SectionTitle text="NEW CORE DATA" />
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Total Records"
              value={newCore?.total}
              icon={<StorageIcon sx={{ fontSize: 24, color: "#DAA520" }} />}
              color="#DAA520"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="UPDATED"
              value={newCore?.status?.updated}
              icon={<UpdateIcon sx={{ fontSize: 24, color: "#2e7d32" }} />}
              color="#2e7d32"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="UPDATEDs"
              value={newCore?.status?.updateds}
              icon={<UpdateIcon sx={{ fontSize: 24, color: "#0288d1" }} />}
              color="#0288d1"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Male"
              value={newCore?.gender?.male}
              icon={<MaleIcon sx={{ fontSize: 24, color: "#1976d2" }} />}
              color="#1976d2"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Female"
              value={newCore?.gender?.female}
              icon={<FemaleIcon sx={{ fontSize: 24, color: "#d32f2f" }} />}
              color="#d32f2f"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Unique Customers"
              value={newCore?.uniques?.customer_id}
              icon={<PeopleIcon sx={{ fontSize: 24, color: "#DAA520" }} />}
              color="#DAA520"
              subtitle="Customer IDs"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Unique Accounts"
              value={newCore?.uniques?.account_number}
              icon={<AccountBalanceIcon sx={{ fontSize: 24, color: "#DAA520" }} />}
              color="#DAA520"
              subtitle="Account Numbers"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Unique National IDs"
              value={newCore?.uniques?.national_id}
              icon={<DashboardIcon sx={{ fontSize: 24, color: "#DAA520" }} />}
              color="#DAA520"
              subtitle="National IDs"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Unique Phones"
              value={newCore?.uniques?.phone}
              icon={<PhoneIcon sx={{ fontSize: 24, color: "#DAA520" }} />}
              color="#DAA520"
              subtitle="Phone Numbers"
            />
          </Grid>
        </Grid>

        {/* OLD CORE DATA SECTION */}
        <SectionTitle text="OLD CORE DATA" color="#1976d2" />
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Total Records"
              value={oldCore?.total}
              icon={<StorageIcon sx={{ fontSize: 24, color: "#1976d2" }} />}
              color="#1976d2"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Male"
              value={oldCore?.gender?.male}
              icon={<MaleIcon sx={{ fontSize: 24, color: "#1976d2" }} />}
              color="#1976d2"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Female"
              value={oldCore?.gender?.female}
              icon={<FemaleIcon sx={{ fontSize: 24, color: "#d32f2f" }} />}
              color="#d32f2f"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Unique Customers"
              value={oldCore?.uniques?.customer_id}
              icon={<PeopleIcon sx={{ fontSize: 24, color: "#1976d2" }} />}
              color="#1976d2"
              subtitle="Customer IDs"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Unique Accounts"
              value={oldCore?.uniques?.account_number}
              icon={<AccountBalanceIcon sx={{ fontSize: 24, color: "#1976d2" }} />}
              color="#1976d2"
              subtitle="Account Numbers"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Unique National IDs"
              value={oldCore?.uniques?.national_id}
              icon={<DashboardIcon sx={{ fontSize: 24, color: "#1976d2" }} />}
              color="#1976d2"
              subtitle="National IDs"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Unique Phones"
              value={oldCore?.uniques?.phone}
              icon={<PhoneIcon sx={{ fontSize: 24, color: "#1976d2" }} />}
              color="#1976d2"
              subtitle="Phone Numbers"
            />
          </Grid>
        </Grid>

        {/* COMPARISON SECTION */}
        <SectionTitle text="COMPARISON (NEW vs OLD)" color="#ed6c02" />
        <Paper sx={{ p: 2, borderRadius: 2, overflow: "auto" }}>
          <Box sx={{ minWidth: 500 }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #DAA520" }}>
                  <th style={{ textAlign: "left", padding: "12px" }}>Metric</th>
                  <th style={{ textAlign: "right", padding: "12px" }}>New Core Data</th>
                  <th style={{ textAlign: "right", padding: "12px" }}>Old Core Data</th>
                  <th style={{ textAlign: "right", padding: "12px" }}>Difference</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: "1px solid #e0e0e0" }}>
                  <td style={{ padding: "12px", fontWeight: "bold" }}>Total Records</td>
                  <td style={{ padding: "12px", textAlign: "right", color: "#DAA520", fontWeight: "bold" }}>
                    {newCore?.total?.toLocaleString()}
                  </td>
                  <td style={{ padding: "12px", textAlign: "right" }}>{oldCore?.total?.toLocaleString()}</td>
                  <td style={{ padding: "12px", textAlign: "right", color: (newCore?.total - oldCore?.total) > 0 ? "#2e7d32" : "#d32f2f", fontWeight: "bold" }}>
                    {((newCore?.total - oldCore?.total) > 0 ? "+" : "")}
                    {(newCore?.total - oldCore?.total)?.toLocaleString()}
                  </td>
                </tr>
                <tr style={{ borderBottom: "1px solid #e0e0e0" }}>
                  <td style={{ padding: "12px", fontWeight: "bold" }}>Male</td>
                  <td style={{ padding: "12px", textAlign: "right", color: "#1976d2", fontWeight: "bold" }}>
                    {newCore?.gender?.male?.toLocaleString()}
                  </td>
                  <td style={{ padding: "12px", textAlign: "right" }}>{oldCore?.gender?.male?.toLocaleString()}</td>
                  <td style={{ padding: "12px", textAlign: "right", color: (newCore?.gender?.male - oldCore?.gender?.male) > 0 ? "#2e7d32" : "#d32f2f", fontWeight: "bold" }}>
                    {((newCore?.gender?.male - oldCore?.gender?.male) > 0 ? "+" : "")}
                    {(newCore?.gender?.male - oldCore?.gender?.male)?.toLocaleString()}
                  </td>
                </tr>
                <tr style={{ borderBottom: "1px solid #e0e0e0" }}>
                  <td style={{ padding: "12px", fontWeight: "bold" }}>Female</td>
                  <td style={{ padding: "12px", textAlign: "right", color: "#d32f2f", fontWeight: "bold" }}>
                    {newCore?.gender?.female?.toLocaleString()}
                  </td>
                  <td style={{ padding: "12px", textAlign: "right" }}>{oldCore?.gender?.female?.toLocaleString()}</td>
                  <td style={{ padding: "12px", textAlign: "right", color: (newCore?.gender?.female - oldCore?.gender?.female) > 0 ? "#2e7d32" : "#d32f2f", fontWeight: "bold" }}>
                    {((newCore?.gender?.female - oldCore?.gender?.female) > 0 ? "+" : "")}
                    {(newCore?.gender?.female - oldCore?.gender?.female)?.toLocaleString()}
                  </td>
                </tr>
                <tr style={{ borderBottom: "1px solid #e0e0e0" }}>
                  <td style={{ padding: "12px", fontWeight: "bold" }}>Unique Customers</td>
                  <td style={{ padding: "12px", textAlign: "right", color: "#DAA520", fontWeight: "bold" }}>
                    {newCore?.uniques?.customer_id?.toLocaleString()}
                  </td>
                  <td style={{ padding: "12px", textAlign: "right" }}>{oldCore?.uniques?.customer_id?.toLocaleString()}</td>
                  <td style={{ padding: "12px", textAlign: "right", color: (newCore?.uniques?.customer_id - oldCore?.uniques?.customer_id) > 0 ? "#2e7d32" : "#d32f2f", fontWeight: "bold" }}>
                    {((newCore?.uniques?.customer_id - oldCore?.uniques?.customer_id) > 0 ? "+" : "")}
                    {(newCore?.uniques?.customer_id - oldCore?.uniques?.customer_id)?.toLocaleString()}
                  </td>
                </tr>
                <tr style={{ borderBottom: "1px solid #e0e0e0" }}>
                  <td style={{ padding: "12px", fontWeight: "bold" }}>Unique Accounts</td>
                  <td style={{ padding: "12px", textAlign: "right", color: "#DAA520", fontWeight: "bold" }}>
                    {newCore?.uniques?.account_number?.toLocaleString()}
                  </td>
                  <td style={{ padding: "12px", textAlign: "right" }}>{oldCore?.uniques?.account_number?.toLocaleString()}</td>
                  <td style={{ padding: "12px", textAlign: "right", color: (newCore?.uniques?.account_number - oldCore?.uniques?.account_number) > 0 ? "#2e7d32" : "#d32f2f", fontWeight: "bold" }}>
                    {((newCore?.uniques?.account_number - oldCore?.uniques?.account_number) > 0 ? "+" : "")}
                    {(newCore?.uniques?.account_number - oldCore?.uniques?.account_number)?.toLocaleString()}
                  </td>
                </tr>
                <tr style={{ borderBottom: "1px solid #e0e0e0" }}>
                  <td style={{ padding: "12px", fontWeight: "bold" }}>Unique National IDs</td>
                  <td style={{ padding: "12px", textAlign: "right", color: "#DAA520", fontWeight: "bold" }}>
                    {newCore?.uniques?.national_id?.toLocaleString()}
                  </td>
                  <td style={{ padding: "12px", textAlign: "right" }}>{oldCore?.uniques?.national_id?.toLocaleString()}</td>
                  <td style={{ padding: "12px", textAlign: "right", color: (newCore?.uniques?.national_id - oldCore?.uniques?.national_id) > 0 ? "#2e7d32" : "#d32f2f", fontWeight: "bold" }}>
                    {((newCore?.uniques?.national_id - oldCore?.uniques?.national_id) > 0 ? "+" : "")}
                    {(newCore?.uniques?.national_id - oldCore?.uniques?.national_id)?.toLocaleString()}
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: "12px", fontWeight: "bold" }}>Unique Phones</td>
                  <td style={{ padding: "12px", textAlign: "right", color: "#DAA520", fontWeight: "bold" }}>
                    {newCore?.uniques?.phone?.toLocaleString()}
                  </td>
                  <td style={{ padding: "12px", textAlign: "right" }}>{oldCore?.uniques?.phone?.toLocaleString()}</td>
                  <td style={{ padding: "12px", textAlign: "right", color: (newCore?.uniques?.phone - oldCore?.uniques?.phone) > 0 ? "#2e7d32" : "#d32f2f", fontWeight: "bold" }}>
                    {((newCore?.uniques?.phone - oldCore?.uniques?.phone) > 0 ? "+" : "")}
                    {(newCore?.uniques?.phone - oldCore?.uniques?.phone)?.toLocaleString()}
                  </td>
                </tr>
              </tbody>
            </table>
          </Box>
        </Paper>

        {/* Footer */}
        <Box sx={{ mt: 3, pt: 2, borderTop: "1px solid #e0e0e0", textAlign: "center" }}>
          <Typography variant="caption" color="text.secondary">
            © 2024 Anbesa Bank. All rights reserved.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default SuperDashboard;