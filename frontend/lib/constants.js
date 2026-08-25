// lib/constants.js
import colors from "./colors";
import { fontCode, fontDesc, fontMain } from "./fonts";

export const FONTS = {
  MAIN: fontMain.className,
  CODE: fontCode.className,
  DESC: fontDesc.className,
};

export const COLORS = colors;

export const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const ENDPOINTS = {
  LOGIN: `${API_URL}/auth/login`,
  FORGOT_PASSWORD_REQUEST: `${API_URL}/auth/forgot-password`,
  FORGOT_PASSWORD_VERIFY: `${API_URL}/auth/forgot-password/verify`,
  FORGOT_PASSWORD_RESET: `${API_URL}/auth/forgot-password/reset`,
  CATEGORIES: `${API_URL}/categories`,
  ASSETS: `${API_URL}/assets`,
  ADMINS: `${API_URL}/admins`,
  ADMIN_STATUS: (id) => `${API_URL}/admins/${id}/status`,
};

export const ROLES = {
  ADMIN: "admin",
  SUPER_ADMIN: "super_admin",
};

export const AUTH_TOKEN_KEY = "token";
export const AUTH_USER_KEY = "user";

export const OTP_LENGTH = 6;
export const OTP_EXPIRY_MINUTES = 5;
export const OTP_RESEND_COOLDOWN_SECONDS = 60;

export const VALIDATION = {
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PASSWORD_MIN_LENGTH: 8,
};

export const ERROR_MESSAGES = {
  EMAIL_REQUIRED: "Email wajib diisi.",
  EMAIL_INVALID: "Format email tidak valid.",
  EMAIL_NOT_REGISTERED: "Email tidak terdaftar.",
  PASSWORD_REQUIRED: "Password wajib diisi.",
  PASSWORD_TOO_SHORT: `Password minimal ${VALIDATION.PASSWORD_MIN_LENGTH} karakter.`,
  PASSWORD_MISMATCH: "Konfirmasi password tidak sama.",
  LOGIN_FAILED: "Login failed",
  OTP_INVALID: "Kode verifikasi salah atau sudah kedaluwarsa.",
  GENERIC_ERROR: "Terjadi kesalahan. Coba lagi.",
  CONNECTION_ERROR: "Unable to connect to server",
};

export const FORGOT_PASSWORD_STEP = {
  EMAIL: "email",
  VERIFY_CODE: "verify_code",
  NEW_PASSWORD: "new_password",
  SUCCESS: "success",
};