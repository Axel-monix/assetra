# Assetra

Monorepo containing the **frontend** (Next.js) and **backend** (Express / Node.js) applications.

---

## Prasyarat

- Node.js (LTS) dan npm
- PostgreSQL
- Akun Gmail + App Password (untuk email OTP)

---

## Setup & Menjalankan

```bash
git clone https://github.com/Axel-monix/assetra.git
cd assetra
npm run install:all      # install dependency root, backend, frontend
```

1. Buat database PostgreSQL, lalu jalankan file migrasi SQL (urutan sesuai tanggal/penamaan file migrasi di repo).
2. Salin `.env.example` ke `.env` di folder `backend/` dan `frontend/`, lalu isi nilainya (daftar variabel ada di [Technical Documentation](./docs/technical-documentation.md#environment-variables)).
3. Jalankan dari root:

```bash
npm run dev
```

Ini menjalankan:

- **Backend**: Express API di [http://localhost:5000](http://localhost:5000) (auto-reload)
- **Frontend**: Next.js di [http://localhost:3000](http://localhost:3000)

Output tiap service diberi prefix `[backend]` (biru) dan `[frontend]` (hijau).

### Command lain

| Command                | Description                                          |
| :--------------------- | :--------------------------------------------------- |
| `npm run dev`          | Run both frontend and backend concurrently           |
| `npm run dev:backend`  | Run only the backend server with auto-reload         |
| `npm run dev:frontend` | Run only the frontend Next.js dev server             |
| `npm run install:all`  | Install dependencies for root, backend, and frontend |

---

## Dokumentasi

- [User Manual](./docs/user-manual.md): panduan pemakaian untuk Admin, Super Admin, dan Guest
- [Technical Documentation](./docs/technical-documentation.md): arsitektur, database, API, setup, dan deployment
