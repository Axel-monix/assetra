"use client";

import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
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
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            password,
          }),
        },
      );

      const result = await response.json();

      if (!response.ok) {
        setError(result.message || "Login failed");
        return;
      }

      console.log("Login successful:", result);

      const { token, user } = result.data;

      if (rememberMe) {
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(user));
      } else {
        sessionStorage.setItem("token", token);
        sessionStorage.setItem("user", JSON.stringify(user));
      }

      if (user.role === "super_admin") {
        window.location.href = "/dashboard";
      } else if (user.role === "admin") {
        window.location.href = "/dashboard";
      }
    } catch (error) {
      console.error("Login error:", error);
      setError("Unable to connect to server");
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
          {/* Email */}
          <div className="mb-7">
            <label
              htmlFor="email"
              className="mb-2 block text-[11px] font-semibold uppercase tracking-wide text-[#A1A1AA]"
            >
              Username or Email
            </label>

            <div className="flex items-center rounded-lg border border-[#272D3D] bg-[#0D0D15] px-3">
              <span className="mr-3 text-[#8D8FA0]">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 21c0-4 3.5-7 8-7s8 3 8 7" />
                </svg>
              </span>

              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Enter your username or email"
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
              <span className="mr-3 text-[#8D8FA0]">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <rect x="5" y="10" width="14" height="10" rx="2" />
                  <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                </svg>
              </span>

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
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          {/* Remember + Forgot */}
          <div className="mb-7 flex items-center justify-between text-xs">
            <label className="flex cursor-pointer items-center gap-2 text-[#A1A1AA]">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(event) => setRememberMe(event.target.checked)}
                className="h-4 w-4 rounded border-[#272D3D] bg-[#0D0D15]"
              />
              Remember me
            </label>

            <button
              type="button"
              className="text-[#A5A7FF] hover:text-[#8083FF]"
            >
              Forgot password?
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-400">
              {error}
            </div>
          )}

          {/* Login Button */}
          <button
            type="submit"
            disabled={loading}
            className="h-11 w-full rounded-lg bg-[#8083FF] font-semibold text-[#111323] transition hover:bg-[#9295FF] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Sign In →"}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-6 border-t border-[#272D3D] pt-5 text-center text-xs text-[#71717A]">
          🛡 Access restricted to authorized Assetra users.
        </div>
      </div>
    </main>
  );
}
