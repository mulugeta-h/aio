// src/api/authApi.js
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import { getDeviceId } from "../utils/deviceId";

// VITE: Changed from process.env.REACT_APP_API_URL to import.meta.env.VITE_API_URL
const API_BASE = import.meta.env.VITE_API_URL;

// Debug log (remove after confirming)
console.log('API_BASE URL:', API_BASE);

export const login = async ({ username, password }) => {
  try {
    let res;

    const url = `${API_BASE}/api/user/login`;
    console.log('Login URL:', url); // Debug
    
    res = await axios.post(url, {
      username,
      password,
      deviceId: getDeviceId(),
    });

    console.log('Login response:', res.data); // Debug
    return res.data;
  } catch (err) {
    console.error('Login error:', err); // Debug
    return { error: err.response?.data?.msg || err.message };
  }
};

export const logout = async () => {
  try {
    const token = localStorage.getItem("token");
    if (token) {
      await axios.post(
        `${API_BASE}/api/user/logout`,
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      );
    }
  } catch {
    // still clear local session even if server call fails
  }
};

export const changePassword = async ({ oldPassword, newPassword }) => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      return { error: "No authentication token found" };
    }

    const res = await axios.patch(
      `${API_BASE}/api/user/change-password`,
      { oldPassword, newPassword },
      { headers: { Authorization: `Bearer ${token}` } },
    );
    return res.data;
  } catch (err) {
    return { error: err.response?.data?.msg || err.message };
  }
};

export const getUserFromToken = () => {
  const token = localStorage.getItem("token");
  if (!token) return null;

  try {
    const decoded = jwtDecode(token);
    console.log('Decoded token:', decoded); // Debug - see what's in your token
    return decoded;
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
};