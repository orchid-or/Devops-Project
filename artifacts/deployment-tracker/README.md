# Project Deployment Tracker – DevOps Lifecycle Dashboard

![CI/CD]

A clean, professional web application for tracking software projects across DevOps lifecycle stages: **Development → Testing → Deployed**.

---

## Features

- **Dashboard** – Add, update, and delete projects in real time
- **Insights page** – Live stat cards and CSS bar chart of project distribution
- **DevOps pipeline** – Three color-coded stages (Development → Testing → Deployed)
- **Header stats** – Live project counts per stage, always visible
- **In-memory storage** – No database required; data resets on restart (intentional)
- **Responsive UI** – Works on desktop and mobile
- **Smooth UX** – Hover effects, card animations, success/error alerts, loading spinner
- **CI/CD pipeline** – GitHub Actions workflow included

---

## Tech Stack

| Layer    | Technology                |
|----------|---------------------------|
| Backend  | Python 3 + Flask          |
| Storage  | In-memory Python list     |
| Frontend | HTML5 + CSS3 + Vanilla JS |
| CI/CD    | GitHub Actions            |

> No database. No ORM. No React. No Node.js. Pure Flask + static frontend.

---

## Project Structure

```
deployment-tracker/
├── app.py                  # Flask application & REST API (in-memory storage)
├── requirements.txt        # Python dependencies (Flask only)
├── .gitignore
├── README.md
├── templates/
│   └── index.html          # Dashboard + Insights single-page HTML
├── static/
│   ├── css/
│   │   └── style.css       # All styles (navbar, cards, bar chart, responsive)
│   └── js/
│       └── app.js          # Frontend logic (navigation, Fetch API, chart)
└── .github/
    └── workflows/
        └── main.yml        # CI/CD pipeline
```

---

## Setup & Running Locally

### Prerequisites

- Python 3.9+
- pip

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd deployment-tracker

# (Optional) Create a virtual environment
python -m venv venv
source venv/bin/activate        # macOS/Linux
venv\Scripts\activate           # Windows

# Install dependencies
pip install -r requirements.txt

# Run the app
python app.py
```

The app will be available at **http://localhost:5000**

### Environment Variables

| Variable | Default | Description           |
|----------|---------|-----------------------|
| `PORT`   | `5000`  | Port Flask listens on |

---

## API Endpoints

### `GET /projects`
Returns all projects, newest first.

**Response** `200 OK`
```json
[
  {
    "id": 1,
    "name": "user-auth-service",
    "status": "Development",
    "created_at": "2024-01-01T12:00:00+00:00",
    "updated_at": "2024-01-01T12:00:00+00:00"
  }
]
```

---

### `POST /projects`
Create a new project.

**Body**
```json
{ "name": "my-api", "status": "Development" }
```

**Response** `201 Created` – the created project object

**Errors**
- `400` – name is missing or blank
- `400` – invalid status value

---

### `PUT /projects/<id>`
Update a project's name and/or status.

**Body**
```json
{ "status": "Testing" }
```

**Response** `200 OK` – updated project object

**Errors**
- `404` – project not found
- `400` – invalid status value

---

### `DELETE /projects/<id>`
Delete a project.

**Response** `200 OK`
```json
{ "message": "Project deleted successfully" }
```

**Errors**
- `404` – project not found

---

### `GET /stats`
Returns project counts grouped by status.

**Response** `200 OK`
```json
{
  "total": 3,
  "development": 1,
  "testing": 1,
  "deployed": 1,
  "refreshed_at": "2024-01-01T12:00:00+00:00"
}
```

---

## CI/CD Pipeline

The `.github/workflows/main.yml` runs on every push and pull request:

1. **Checkout** source code
2. **Set up Python 3.11** with pip cache
3. **Install dependencies** from `requirements.txt`
4. **Lint** with `flake8` (syntax errors and undefined names)
5. **Start Flask** and run a health check with `curl`

---

## Deployment

Works on any Python-capable platform:

- **Heroku / Railway / Fly.io** – `Procfile`: `web: python app.py`
- **Docker** – `CMD ["python", "app.py"]`
- **Cloud VMs** – Run behind Nginx + Gunicorn

### Docker (single container)

From `artifacts/deployment-tracker`:

```bash
docker build -t deployment-tracker:latest .
docker run --rm -p 5000:5000 -e PORT=5000 deployment-tracker:latest
```

Open: **http://localhost:5000**

### Docker Compose (from workspace root)

From workspace root:

```bash
docker compose up -d --build
```

Check logs:

```bash
docker compose logs -f deployment-tracker
```

Stop:

```bash
docker compose down
```

### Gunicorn (production)

```bash
pip install gunicorn
gunicorn -b 0.0.0.0:${PORT:-5000} app:app
```

---

## License

MIT
