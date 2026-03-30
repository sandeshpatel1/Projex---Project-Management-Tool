# Projex — Mini Project Management System

A full-stack project management app built with **Node.js + Express**, **MongoDB**, and **React**.

---

## Tech Stack

| Layer     | Technology                          |
|-----------|-------------------------------------|
| Backend   | Node.js, Express.js                 |
| Database  | MongoDB + Mongoose                  |
| Frontend  | React 18, React Query, React Router |
| Styling   | Custom CSS (no UI framework)        |

---

## Project Structure

```
project-management/
├── backend/
│   ├── controllers/
│   │   ├── projectController.js
│   │   └── taskController.js
│   ├── middleware/
│   │   ├── errorHandler.js
│   │   └── validate.js
│   ├── models/
│   │   ├── Project.js
│   │   └── Task.js
│   ├── routes/
│   │   ├── projects.js
│   │   └── tasks.js
│   ├── .env.example
│   ├── package.json
│   └── server.js
└── frontend/
    ├── public/
    │   └── index.html
    ├── src/
    │   ├── components/
    │   │   ├── ConfirmModal.js
    │   │   ├── Pagination.js
    │   │   ├── ProjectModal.js
    │   │   ├── Sidebar.js
    │   │   └── TaskModal.js
    │   ├── pages/
    │   │   ├── DashboardPage.js
    │   │   ├── ProjectDetailPage.js
    │   │   └── ProjectsPage.js
    │   ├── utils/
    │   │   └── api.js
    │   ├── App.js
    │   ├── index.css
    │   └── index.js
    ├── .env.example
    └── package.json
```

---

## Prerequisites

- [Node.js](https://nodejs.org/) v18+
- [MongoDB](https://www.mongodb.com/try/download/community) running locally **OR** a [MongoDB Atlas](https://www.mongodb.com/atlas) connection string
- npm v9+

---

## Setup & Running

### 1. Clone / Extract the project

```bash
# If using git
git clone <your-repo-url>
cd project-management
```

---

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create your .env file
cp .env.example .env
```

Edit `backend/.env`:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/project_management
NODE_ENV=development
```

> For MongoDB Atlas, use:
> `MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/project_management`

```bash
# Start the backend (development with auto-reload)
npm run dev

# OR start without nodemon
npm start
```

Backend runs at: `http://localhost:5000`

Health check: `GET http://localhost:5000/api/health`

---

### 3. Frontend Setup

Open a **new terminal**:

```bash
cd frontend

# Install dependencies
npm install

# Create your .env file
cp .env.example .env
```

Edit `frontend/.env`:

```env
REACT_APP_API_URL=http://localhost:5000/api
```

```bash
# Start the React dev server
npm start
```

Frontend runs at: `http://localhost:3000`

---

### 4. Build for Production

```bash
# Build the frontend
cd frontend
npm run build

# The /build folder can be served statically
# You can serve it from Express too — add to server.js:
# app.use(express.static(path.join(__dirname, '../frontend/build')));
```

---

## API Reference

### Base URL
```
http://localhost:5000/api
```

---

### Projects

#### Create a project
```
POST /projects
Content-Type: application/json

{
  "name": "Website Redesign",        // required, max 100 chars
  "description": "Revamp the site",  // optional, max 500 chars
  "status": "active",                // active | completed | archived
  "color": "#6366f1"                 // hex color
}
```

#### List projects (with pagination, search, filter)
```
GET /projects?page=1&limit=10&search=web&status=active&sortBy=created_at&sortOrder=desc
```

| Param      | Default      | Options                          |
|------------|--------------|----------------------------------|
| page       | 1            | any integer                      |
| limit      | 10           | any integer                      |
| search     | —            | searches project name            |
| status     | —            | active, completed, archived      |
| sortBy     | created_at   | created_at, name                 |
| sortOrder  | desc         | asc, desc                        |

#### Get project by ID
```
GET /projects/:id
```

#### Update project
```
PUT /projects/:id
Content-Type: application/json

{ "name": "...", "description": "...", "status": "completed", "color": "#10b981" }
```

#### Delete project (cascades to all tasks)
```
DELETE /projects/:id
```

---

### Tasks

#### Create a task
```
POST /projects/:project_id/tasks
Content-Type: application/json

{
  "title": "Design homepage",        // required, max 200 chars
  "description": "Mobile first",     // optional
  "status": "todo",                  // todo | in-progress | done
  "priority": "high",                // low | medium | high
  "due_date": "2025-03-15",          // ISO date, optional
  "assignee": "john.doe",            // optional
  "tags": ["design", "frontend"]     // optional array
}
```

#### List tasks for a project (pagination + filter + sort)
```
GET /projects/:project_id/tasks?page=1&limit=15&status=todo&priority=high&sortBy=due_date&sortOrder=asc&search=homepage
```

| Param      | Default      | Options                         |
|------------|--------------|---------------------------------|
| page       | 1            | any integer                     |
| limit      | 20           | any integer                     |
| status     | —            | todo, in-progress, done         |
| priority   | —            | low, medium, high               |
| sortBy     | created_at   | due_date, created_at, priority  |
| sortOrder  | desc         | asc, desc                       |
| search     | —            | searches task title             |

#### Get task by ID
```
GET /tasks/:id
```

#### Update task
```
PUT /tasks/:id
Content-Type: application/json

{ "title": "...", "status": "done", "priority": "low", "due_date": "2025-04-01" }
```

#### Quick status update
```
PATCH /tasks/:id/status
Content-Type: application/json

{ "status": "in-progress" }
```

#### Delete task
```
DELETE /tasks/:id
```

---

## Features


- ✅ **CRUD** for Projects and Tasks
- ✅ **Pagination** on all list endpoints (`?page=1&limit=10`)
- ✅ **Filter tasks** by status and priority
- ✅ **Sort tasks** by `due_date`, `created_at`, `priority`
- ✅ **Input validation** with `express-validator`
- ✅ **Error handling** — global error middleware with Mongoose error mapping
- ✅ **Kanban Board** view — switch between list and kanban per project
- ✅ **Project progress bar** — visual completion tracking
- ✅ **Task stats** — per-project todo / in-progress / done counts
- ✅ **Color-coded projects** — assign a color to each project
- ✅ **Cascade delete** — deleting a project removes all its tasks
- ✅ **Tags** on tasks (add multiple tags, filter-ready)
- ✅ **Assignee field** on tasks
- ✅ **Due date indicators** — overdue shown in red, due soon in amber
- ✅ **One-click status cycling** — click the circle to cycle todo → in-progress → done
- ✅ **Quick status move in Kanban** — move cards between columns
- ✅ **Project search** and **task search** in UI
- ✅ **React Query** caching — instant UI updates with optimistic invalidation
- ✅ **Toast notifications** for all mutations
- ✅ **Responsive sidebar** with recent projects list
- ✅ **Dashboard** with project stats at a glance

---

## Environment Variables

### Backend (`backend/.env`)
| Variable     | Default                                          | Description         |
|--------------|--------------------------------------------------|---------------------|
| PORT         | 5000                                             | Express server port |
| MONGODB_URI  | mongodb://localhost:27017/project_management     | MongoDB connection   |
| NODE_ENV     | development                                      | Environment mode    |

### Frontend (`frontend/.env`)
| Variable             | Default                        | Description     |
|----------------------|--------------------------------|-----------------|
| REACT_APP_API_URL    | http://localhost:5000/api      | Backend API URL |

---

## Common Issues

**MongoDB connection error**
- Make sure MongoDB is running: `mongod` or check your Atlas URI

**CORS errors**
- Backend already has `cors()` middleware. If needed, configure origins in `server.js`

**Port conflicts**
- Change `PORT` in `backend/.env` and update `REACT_APP_API_URL` in `frontend/.env`

**`npm install` fails**
- Use Node.js v18+: `node --version`
