"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ENDPOINTS,
  AUTH_TOKEN_KEY,
  AUTH_USER_KEY,
  ERROR_MESSAGES,
} from "@/lib/constants";

function EyeIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M1.5 12S5 5 12 5s10.5 7 10.5 7-3.5 7-10.5 7S1.5 12 1.5 12Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M3 3l18 18"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M10.6 5.1A10.7 10.7 0 0 1 12 5c7 0 10.5 7 10.5 7a13.3 13.3 0 0 1-3.1 3.9M6.6 6.6C3.4 8.6 1.5 12 1.5 12S5 19 12 19a10.3 10.3 0 0 0 4.4-.9"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9.9 9.9a3 3 0 0 0 4.2 4.2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (event) => {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await fetch(ENDPOINTS.LOGIN, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          identifier: identifier.trim(),
          email: identifier.trim(),
          password,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        setError(result.message || ERROR_MESSAGES.LOGIN_FAILED);
        return;
      }

      // Guard: pastikan data yang diharapkan benar-benar ada sebelum dipakai.
      if (!result.data?.token || !result.data?.user) {
        setError(ERROR_MESSAGES.GENERIC_ERROR);
        return;
      }

      const { token, user } = result.data;

      // remember me ON  -> localStorage   (tetap login walau tab/browser ditutup)
      // remember me OFF -> sessionStorage (logout otomatis begitu tab ditutup)
      const storage = rememberMe ? window.localStorage : window.sessionStorage;
      storage.setItem(AUTH_TOKEN_KEY, token);
      storage.setItem(AUTH_USER_KEY, JSON.stringify(user));

      // super_admin dan admin sama-sama menuju satu dashboard yang sama;
      // tampilan di dalamnya nanti dibedakan berdasarkan role (lihat AuthContext/dashboard).
      router.push("/dashboard");
    } catch (err) {
      console.error("Login error:", err);
      setError(ERROR_MESSAGES.CONNECTION_ERROR);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#0B0F17] text-[#E5E7EB] font-sans flex flex-col items-center justify-center px-4">
      {/* Logo */}
      <div className="mb-12 text-2xl font-semibold">Assetra</div>

      {/* Login Card */}
      <div className="w-full max-w-[405px] rounded-xl border border-[#272D3D] bg-[#131824] p-7 shadow-2xl">
        <div className="mb-8">
          <h1 className="text-xl font-semibold">Welcome back</h1>

          <p className="mt-1 text-sm text-[#A1A1AA]">
            Sign in to continue to your Assetra account.
          </p>
        </div>

        <form onSubmit={handleLogin}>
          {/* Username or Email */}
          <div className="mb-7">
            <label
              htmlFor="identifier"
              className="mb-2 block text-[11px] font-semibold uppercase tracking-wide text-[#A1A1AA]"
            >
              Username or Email
            </label>

            <div className="flex items-center rounded-lg border border-[#272D3D] bg-[#0D0D15] px-3">
              <input
                id="identifier"
                type="text"
                value={identifier}
                onChange={(event) => setIdentifier(event.target.value)}
                placeholder="Enter your username or email"
                autoComplete="username"
                className="h-11 w-full bg-transparent text-sm text-white outline-none placeholder:text-[#555866]"
                required
              />
            </div>
          </div>

          {/* Password */}
          <div className="mb-4">
            <label
              htmlFor="password"
              className="mb-2 block text-[11px] font-semibold uppercase tracking-wide text-[#A1A1AA]"
            >
              Password
            </label>

            <div className="flex items-center rounded-lg border border-[#272D3D] bg-[#0D0D15] px-3">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your password"
                className="h-11 w-full bg-transparent text-sm text-white outline-none placeholder:text-[#555866]"
                required
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="ml-2 text-[#8D8FA0] hover:text-white"
                aria-label={
                  showPassword ? "Sembunyikan password" : "Tampilkan password"
                }
                aria-pressed={showPassword}
              >
                {showPassword ? <EyeIcon /> : <EyeOffIcon />}
              </button>
            </div>
          </div>

          {/* Remember Me */}
          <div className="mb-7 flex items-center justify-between text-xs">
            <label className="flex cursor-pointer items-center gap-2 text-[#A1A1AA]">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(event) => setRememberMe(event.target.checked)}
              />
              Remember me
            </label>

            <Link
              href="/forgot-password"
              className="text-[#A5A7FF] hover:text-[#8083FF]"
            >
              Forgot password?
            </Link>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-400">
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="h-11 w-full rounded-lg bg-[#8083FF] font-semibold text-[#111323] transition hover:bg-[#9295FF] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Sign In →"}
          </button>
        </form>

        <div className="mt-6 border-t border-[#272D3D] pt-5 text-center text-xs text-[#71717A]">
          🛡 Access restricted to authorized Assetra users.
        </div>
      </div>
    </main>
  );
}
