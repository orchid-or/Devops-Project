import os
from datetime import datetime, timezone
from flask import Flask, request, jsonify, render_template

app = Flask(__name__)

projects = []
_next_id = 1

VALID_STATUSES   = {"Development", "Testing", "Deployed"}
VALID_PRIORITIES = {"Low", "Medium", "High"}


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _find(project_id: int):
    for i, p in enumerate(projects):
        if p["id"] == project_id:
            return i, p
    return None, None


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/projects", methods=["GET"])
def list_projects():
    return jsonify(list(reversed(projects)))


@app.route("/projects", methods=["POST"])
def create_project():
    global _next_id

    data     = request.get_json(silent=True) or {}
    name     = (data.get("name") or "").strip()
    status   = (data.get("status") or "Development").strip()
    priority = (data.get("priority") or "Medium").strip()
    notes    = (data.get("notes") or "").strip()

    if not name:
        return jsonify({"error": "Project name is required"}), 400
    if status not in VALID_STATUSES:
        return jsonify({"error": f"Invalid status. Choose: {', '.join(sorted(VALID_STATUSES))}"}), 400
    if priority not in VALID_PRIORITIES:
        return jsonify({"error": f"Invalid priority. Choose: {', '.join(sorted(VALID_PRIORITIES))}"}), 400

    now = _now()
    project = {
        "id": _next_id,
        "name": name,
        "status": status,
        "priority": priority,
        "notes": notes,
        "created_at": now,
        "updated_at": now,
    }
    projects.append(project)
    _next_id += 1
    return jsonify(project), 201


@app.route("/projects/<int:project_id>", methods=["PUT"])
def update_project(project_id):
    idx, project = _find(project_id)
    if project is None:
        return jsonify({"error": "Project not found"}), 404

    data     = request.get_json(silent=True) or {}
    name     = (data.get("name")     or project["name"]).strip()
    status   = (data.get("status")   or project["status"]).strip()
    priority = (data.get("priority") or project.get("priority", "Medium")).strip()
    notes    = data.get("notes", project.get("notes", ""))
    if notes is None:
        notes = ""
    notes = notes.strip()

    if not name:
        return jsonify({"error": "Project name cannot be empty"}), 400
    if status not in VALID_STATUSES:
        return jsonify({"error": f"Invalid status. Choose: {', '.join(sorted(VALID_STATUSES))}"}), 400
    if priority not in VALID_PRIORITIES:
        return jsonify({"error": f"Invalid priority. Choose: {', '.join(sorted(VALID_PRIORITIES))}"}), 400

    projects[idx].update({
        "name": name, "status": status,
        "priority": priority, "notes": notes,
        "updated_at": _now()
    })
    return jsonify(projects[idx])


@app.route("/projects/<int:project_id>", methods=["DELETE"])
def delete_project(project_id):
    idx, project = _find(project_id)
    if project is None:
        return jsonify({"error": "Project not found"}), 404

    projects.pop(idx)
    return jsonify({"message": "Project deleted successfully"})


@app.route("/stats", methods=["GET"])
def get_stats():
    total       = len(projects)
    development = sum(1 for p in projects if p["status"] == "Development")
    testing     = sum(1 for p in projects if p["status"] == "Testing")
    deployed    = sum(1 for p in projects if p["status"] == "Deployed")

    high_priority   = sum(1 for p in projects if p.get("priority") == "High")
    medium_priority = sum(1 for p in projects if p.get("priority") == "Medium")
    low_priority    = sum(1 for p in projects if p.get("priority") == "Low")

    completion_rate = round((deployed / total * 100)) if total > 0 else 0

    return jsonify({
        "total": total,
        "development": development,
        "testing": testing,
        "deployed": deployed,
        "high_priority": high_priority,
        "medium_priority": medium_priority,
        "low_priority": low_priority,
        "completion_rate": completion_rate,
        "refreshed_at": _now(),
    })


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=False)
