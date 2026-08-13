# ProjectFlow — Backend

Express + PostgreSQL API for a dynamic-RBAC project and task management application.

---

## Quick start

```bash
cd backend
npm install
```

Create `.env`:

```env
PORT=5000
FRONTEND_URL=http://localhost:5173
DATABASE_URL=postgresql://user:password@host:5432/dbname
ACCESS_TOKEN_SECRET=your-access-secret
REFRESH_TOKEN_SECRET=your-refresh-secret
ACCESS_TOKEN_EXPIRATION=15m
REFRESH_TOKEN_EXPIRATION=7d
```

```bash
npm run dev
```

Server runs at `http://localhost:5000`. On startup it creates tables (if missing) and seeds the permission catalog.

---

## Architecture

```
index.js
  ├── /api/auth      → authentication + user management
  ├── /api/rbac      → roles + permissions
  ├── /api/projects  → project CRUD
  └── /api/tasks     → task CRUD

src/
  controllers/   HTTP handlers
  services/      business logic + SQL
  routes/        route definitions + middleware
  middlewares/   verifyAuth, verifyRole, verifyPermission
  validations/   Zod schemas
  db/            initDb, seedPermissions
  utils/         tokens, cookies, user permissions
  constants/     ALL_APP_PERMISSIONS list
```

**Response envelope (all endpoints):**

```json
{
  "statusCode": 200,
  "message": "Human readable message",
  "data": { }
}
```

---

## Database model

| Table | Purpose |
|-------|---------|
| `users` | Accounts (`name`, `email`, `password_hash`, `is_active`) |
| `roles` | Named roles (`admin`, `developer`, …) |
| `permissions` | Permission catalog (`resource:action` strings) |
| `user_roles` | Many-to-many: user ↔ role |
| `role_permissions` | Many-to-many: role ↔ permission |
| `projects` | Projects with owner and status |
| `tasks` | Tasks linked to projects and assignees |

**Relationships**

```
User ──< user_roles >── Role ──< role_permissions >── Permission
User ── owns ──> Project
Project ──< Task
User ── assigned ──> Task
```

---

## Startup flow

1. Connect to PostgreSQL
2. `initDb()` — create tables if they don't exist
3. `seedPermissions()` — insert 16 default permissions (`ON CONFLICT DO NOTHING`)
4. Listen on `PORT`

**What is NOT seeded automatically:** roles (except `admin` on first user), users, role-permission assignments, projects, or tasks. You create those through the API or UI.

---

## Authentication flow

### Tokens

| Token | Storage | Lifetime |
|-------|---------|----------|
| Access token | HttpOnly cookie + returned in JSON body | 15 min (configurable) |
| Refresh token | HttpOnly cookie + returned in JSON body | 7 days (configurable) |

The frontend stores the access token **in memory** and sends it as `Authorization: Bearer <token>`. Cookies are also set for refresh.

JWT payload: `{ userId, email, roles: string[] }`

### Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/register` | Public | Register user |
| POST | `/api/auth/login` | Public | Login, set cookies, return tokens + user |
| POST | `/api/auth/refresh-token` | Public* | Refresh tokens (cookie or body) |
| GET | `/api/auth/me` | Yes | Current user + permissions + new tokens |
| DELETE | `/api/auth/logout` | Yes | Clear cookies |
| GET | `/api/auth/users` | `users:read` | List users |
| POST | `/api/auth/users` | `users:create` | Create user (admin UI) |
| PUT | `/api/auth/users/:userId` | `users:update` | Update user / roles / status |
| DELETE | `/api/auth/users/:userId` | `users:delete` | Delete user |

\*Refresh token required in cookie or body.

### Login / me response shape

```json
{
  "statusCode": 200,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "1",
      "name": "Prashant",
      "email": "user@example.com",
      "roles": ["admin"],
      "permissions": ["users:read", "projects:create", "..."]
    },
    "accessToken": "<jwt>",
    "refreshToken": "<jwt>"
  }
}
```

### First user rule

When the `users` table is **empty**, the first registered user:

1. Auto-creates the `admin` role (if missing)
2. Is assigned the `admin` role

All subsequent users get **no roles** unless you pass `roles: ["roleName"]` in the request body.

---

## RBAC (dynamic role-based access control)

### Permission format

All permissions use `resource:action`:

```
users:read    users:create    users:update    users:delete
roles:read    roles:create    roles:update    roles:delete
projects:read projects:create projects:update projects:delete
tasks:read    tasks:create    tasks:update    tasks:delete
```

These 16 permissions are seeded on every server start.

### How permissions reach the user

```
User
  └── roles[]          (from user_roles)
        └── permissions[]   (union from role_permissions)
              └── returned in login / me / refresh
```

For users with the **`admin` role name**, the backend returns all catalog permissions (seeded list + anything in DB).

### Middleware

| Middleware | Used for |
|------------|----------|
| `verifyAuth` | Validates JWT from cookie or Bearer header |
| `verifyPermission([...])` | Checks user has at least one required permission. **Admin role bypasses all checks.** |
| `verifyRole(["admin"])` | Checks JWT role names. Used only for role CRUD. |

**Important:** API authorization uses **permissions**, not role names (except role CUD and admin bypass). The frontend also gates UI by permission strings — never by hardcoded role names.

### RBAC endpoints

| Method | Path | Gate | Description |
|--------|------|------|-------------|
| GET | `/api/rbac/permissions` | `roles:read` | List all permissions |
| GET | `/api/rbac/roles` | `roles:read` | List roles with permission counts |
| GET | `/api/rbac/roles/:roleId` | `roles:read` | Get single role |
| GET | `/api/rbac/roles/:roleId/permissions` | Auth only | Permissions for a role |
| GET | `/api/rbac/users/:userId/roles` | Auth only | Roles for a user |
| POST | `/api/rbac/roles` | **admin role** | Create role + assign permissions |
| PUT | `/api/rbac/roles/:roleId` | **admin role** | Update role + replace permissions |
| DELETE | `/api/rbac/roles/:roleId` | **admin role** | Delete role |

**Create / update role body:**

```json
{
  "name": "Project Manager",
  "description": "Manages projects and tasks",
  "permissions": ["projects:read", "projects:create", "tasks:read"]
}
```

Permissions must already exist in the seeded catalog.

---

## Domain APIs

### Projects — `/api/projects`

| Method | Permission | Description |
|--------|------------|-------------|
| GET `/` | `projects:read` | List (search, status, sort, pagination) |
| GET `/:id` | `projects:read` | Get by ID |
| POST `/` | `projects:create` | Create (owner defaults to current user) |
| PUT `/:id` | `projects:update` | Update |
| DELETE `/:id` | `projects:delete` | Delete |

Status values: `active`, `on_hold`, `completed`

### Tasks — `/api/tasks`

| Method | Permission | Description |
|--------|------------|-------------|
| GET `/` | `tasks:read` | List (search, status, priority, project, assignee) |
| GET `/:id` | `tasks:read` | Get by ID |
| POST `/` | `tasks:create` | Create |
| PUT `/:id` | `tasks:update` | Update |
| DELETE `/:id` | `tasks:delete` | Delete |

Status: `todo`, `in_progress`, `done`  
Priority: `low`, `medium`, `high`

---

## End-to-end setup flow

Typical bootstrap sequence for a fresh database:

```
1. POST /api/auth/register     → first user becomes admin
2. POST /api/auth/login        → get tokens + full permissions
3. POST /api/rbac/roles        → create roles (admin only), pick permissions
4. POST /api/auth/users        → create team members
5. PUT  /api/auth/users/:id     → assign roles to users
6. POST /api/projects          → create projects
7. POST /api/tasks             → create tasks
```

Or use the React frontend for steps 3–7.

---

## CORS

Configured for the frontend origin with credentials:

```js
cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE"],
})
```

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start with nodemon |
| `npm start` | Start production server |
