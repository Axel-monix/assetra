"use client";

import { useState } from "react";
import { X } from "lucide-react";

export default function AddAdminModal({ onClose, onSubmit }) {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!form.name.trim() || !form.email.trim() || !form.password) {
      setError("Semua field wajib diisi.");
      return;
    }
    if (form.password.length < 8) {
      setError("Password minimal 8 karakter.");
      return;
    }

    setLoading(true);
    try {
      await onSubmit(form); // TODO (di parent): POST /api/admins
      onClose();
    } catch (err) {
      setError(err.message || "Gagal menambahkan admin.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-sm rounded-xl border border-[#272D3D] bg-[#131824] p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold">Add New Admin</h2>
          <button type="button" onClick={onClose} className="text-[#A1A1AA] hover:text-white">
            <X size={18} strokeWidth={1.75} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-[#A1A1AA]">
              Nama
            </label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Nama lengkap"
              className="h-11 w-full rounded-lg border border-[#272D3D] bg-[#0D0D15] px-3 text-sm text-white outline-none placeholder:text-[#555866] focus:border-[#8083FF]"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-[#A1A1AA]">
              Email
            </label>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="nama@perusahaan.com"
              className="h-11 w-full rounded-lg border border-[#272D3D] bg-[#0D0D15] px-3 text-sm text-white outline-none placeholder:text-[#555866] focus:border-[#8083FF]"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-[#A1A1AA]">
              Password Sementara
            </label>
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Minimal 8 karakter"
              className="h-11 w-full rounded-lg border border-[#272D3D] bg-[#0D0D15] px-3 text-sm text-white outline-none placeholder:text-[#555866] focus:border-[#8083FF]"
            />
          </div>

          {error && (
            <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-400">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="h-11 w-full rounded-lg bg-[#8083FF] font-semibold text-[#111323] transition hover:bg-[#9295FF] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Menambahkan..." : "Add Admin"}
          </button>
        </form>
      </div>
    </div>
  );
}