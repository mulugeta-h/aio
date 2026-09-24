import React from "react";
import { Outlet } from "react-router-dom";
import DashboardLayout from "./DashboardLayout";

import HubIcon from "@mui/icons-material/Hub";
import MonitorHeartIcon from "@mui/icons-material/MonitorHeart";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import ConfirmationNumberIcon from "@mui/icons-material/ConfirmationNumber";
import DashboardIcon from "@mui/icons-material/Dashboard";
import NetworkCheckIcon from "@mui/icons-material/NetworkCheck";
import SpeedIcon from "@mui/icons-material/Speed";

const companyMenu = [
  { name: "Dashboard", path: "/companyAdmin", icon: <DashboardIcon /> },
  { name: "Branches", path: "/branch", icon: <HubIcon /> },
  { name: "Network Monitor", path: "/network", icon: <NetworkCheckIcon /> },
  { name: "Status", path: "/status", icon: <MonitorHeartIcon /> },
  { name: "Events", path: "/event", icon: <SpeedIcon /> },
  { name: "Tickets", path: "/ticketCreation", icon: <ConfirmationNumberIcon /> },
];

const CompanyWrapper = () => {
  console.log("CompanyWrapper rendering with menu:", companyMenu);
  return (
    <DashboardLayout menu={companyMenu} title="Company Admin Dashboard">
      <Outlet />
    </DashboardLayout>
  );
};

export default CompanyWrapper;