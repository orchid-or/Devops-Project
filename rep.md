# Workspace

## Overview

pnpm workspace monorepo using TypeScript for shared libraries, with a Python Flask web application as the main artifact.

## Main App: Project Deployment Tracker

**Location:** `artifacts/deployment-tracker/`

A DevOps lifecycle dashboard built with:
- **Backend:** Python 3.11 + Flask with SQLite (no external DB)
- **Frontend:** Pure HTML5 + CSS3 + Vanilla JavaScript (no frameworks)
- **CI/CD:** GitHub Actions workflow at `.github/workflows/main.yml`

### Key Files

| File | Purpose |
|------|---------|
| `artifacts/deployment-tracker/app.py` | Flask app + REST API |
| `artifacts/deployment-tracker/templates/index.html` | Dashboard HTML |
| `artifacts/deployment-tracker/static/css/style.css` | Styles |
| `artifacts/deployment-tracker/static/js/app.js` | Frontend Fetch API logic |
| `artifacts/deployment-tracker/database/` | SQLite DB directory (auto-created) |
| `artifacts/deployment-tracker/requirements.txt` | Python dependencies |
| `artifacts/deployment-tracker/.github/workflows/main.yml` | CI/CD pipeline |

### API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/projects` | List all projects |
| `POST` | `/projects` | Create a project |
| `PUT` | `/projects/<id>` | Update status/name |
| `DELETE` | `/projects/<id>` | Delete a project |

### Running

The Flask app reads `PORT` from environment (default 5000). In Replit it runs on port 25631.

## Shared TypeScript Infrastructure (unused by main app)

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5 (api-server artifact — unused)
- **Database**: PostgreSQL + Drizzle ORM (unused)
