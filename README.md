# TaskFlow

Full-stack task management app with project collaboration.

## Tech Stack

- **Frontend:** React 18, React Router 6, Vite
- **Backend:** Express.js, better-sqlite3
- **Auth:** JWT + bcryptjs

## Local Development

```bash
# Backend
cd backend
npm install
npm run dev       # starts on :5000

# Frontend (separate terminal)
cd frontend
npm install
npm run dev       # starts on :3000, proxies /api to :5000
```

## Features

- User auth (signup/login)
- Project CRUD with member management
- Task CRUD with assignees, priorities, statuses
- Dashboard with project/task stats
- Role-based access (admin/member)

## Deploy to Railway

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/new)

1. Push this repo to GitHub
2. On Railway, create a **New Project** → **Deploy from GitHub repo**
3. Add these environment variables:

   | Variable | Required | Default | Description |
   |---|---|---|---|
   | `JWT_SECRET` | **Yes** | — | Secret key for signing tokens |
   | `PORT` | No | 5000 | Server port |
   | `DB_PATH` | No | `backend/data.db` | SQLite database path |

4. Railway auto-detects Node.js. The build runs `npm run build` (installs deps + builds frontend), and `npm start` boots the server which serves both the API and the built frontend.

### ⚠️ SQLite on Railway

Railway's filesystem is ephemeral — the SQLite database resets on each deploy. For persistent data, either:
- **Add Railway PostgreSQL** and migrate the app to use it, or
- **Set `DB_PATH`** to a Railway volume path

## API Endpoints

### Auth
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/signup` | No | Create account |
| POST | `/api/auth/login` | No | Sign in |
| GET | `/api/auth/me` | Yes | Get current user |

### Projects
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/projects` | Yes | List user's projects |
| POST | `/api/projects` | Yes | Create project |
| GET | `/api/projects/:id` | Yes | Get project detail |
| PUT | `/api/projects/:id` | Yes | Update project |
| DELETE | `/api/projects/:id` | Yes | Delete project |
| POST | `/api/projects/:id/members` | Yes | Add member by email |
| DELETE | `/api/projects/:id/members/:userId` | Yes | Remove member |

### Tasks
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/tasks?project=X` | Yes | List tasks (filter by project) |
| POST | `/api/tasks` | Yes | Create task |
| GET | `/api/tasks/:id` | Yes | Get task |
| PUT | `/api/tasks/:id` | Yes | Update task |
| DELETE | `/api/tasks/:id` | Yes | Delete task |

### Dashboard
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/dashboard` | Yes | Stats and overdue tasks |

## Known Issues

- Forgot Password page shows a success screen but makes no actual API call
- Sidebar uses `<a href>` instead of `<Link>`, causing full page reloads on navigation
- Several validation middleware checks are registered but never executed (tasks routes)
- Hardcoded JWT secret fallback in source — **set `JWT_SECRET` env var in production**
- No rate limiting on auth endpoints
- `data.db` was previously tracked in git and may contain test data in commit history
