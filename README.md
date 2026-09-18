# Assetra

Monorepo containing the **frontend** (Next.js) and **backend** (Express / Node.js) applications.

---

## Quick Start

### 1. Run Both Projects in One Command

From the root directory:

```bash
npm run dev
```

This starts:
- **Backend**: Express API server on [http://localhost:5000](http://localhost:5000) (with auto-reload on changes)
- **Frontend**: Next.js development server on [http://localhost:3000](http://localhost:3000)

Output from each service is clearly prefixed with `[backend]` (blue) and `[frontend]` (green).

---

## Additional Commands

| Command | Description |
| :--- | :--- |
| `npm run dev` | Run both frontend and backend concurrently |
| `npm run dev:backend` | Run only the backend server with auto-reload |
| `npm run dev:frontend` | Run only the frontend Next.js dev server |
| `npm run install:all` | Install dependencies for root, backend, and frontend |
