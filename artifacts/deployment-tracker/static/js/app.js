"use strict";

// ─── State ────────────────────────────────────────────────────────────────────
const API = "/projects";
let projects     = [];
let currentView  = "dashboard";
let filterStatus = "all";
let searchQuery  = "";

// ─── DOM refs ─────────────────────────────────────────────────────────────────
const addForm       = document.getElementById("addForm");
const projectName   = document.getElementById("projectName");
const submitBtn     = document.getElementById("submitBtn");
const formError     = document.getElementById("formError");
const alertEl       = document.getElementById("alert");
const spinnerEl     = document.getElementById("spinner");
const projectList   = document.getElementById("projectList");
const emptyState    = document.getElementById("emptyState");
const noResultsState= document.getElementById("noResultsState");
const listHeader    = document.getElementById("listHeader");
const listCount     = document.getElementById("listCount");
const filterBar     = document.getElementById("filterBar");
const searchInput   = document.getElementById("searchInput");
const totalVal      = document.getElementById("totalVal");
const devVal        = document.getElementById("devVal");
const testVal       = document.getElementById("testVal");
const deployedVal   = document.getElementById("deployedVal");

// Insights refs
const insightsSpinner   = document.getElementById("insightsSpinner");
const insightsEmpty     = document.getElementById("insightsEmpty");
const chartCard         = document.getElementById("chartCard");
const pipelineFlowCard  = document.getElementById("pipelineFlowCard");
const breakdownCard     = document.getElementById("breakdownCard");
const priorityCard      = document.getElementById("priorityCard");
const chart             = document.getElementById("chart");
const refreshedAt       = document.getElementById("refreshedAt");
const refreshBtn        = document.getElementById("refreshInsightsBtn");

// Nav buttons
const navBtns = document.querySelectorAll(".nav-btn");

// ─── Navigation ───────────────────────────────────────────────────────────────
function showView(viewName) {
  currentView = viewName;

  const dashboard = document.getElementById("view-dashboard");
  const insights  = document.getElementById("view-insights");

  if (viewName === "dashboard") {
    dashboard.style.display = "";
    insights.style.display  = "none";
  } else {
    dashboard.style.display = "none";
    insights.style.display  = "";
    loadInsights();
  }

  navBtns.forEach(btn => {
    const isActive = btn.dataset.view === viewName;
    btn.classList.toggle("active", isActive);
    btn.setAttribute("aria-current", isActive ? "page" : "false");
  });
}

navBtns.forEach(btn => {
  btn.addEventListener("click", () => showView(btn.dataset.view));
});

// ─── Alert banner ─────────────────────────────────────────────────────────────
let alertTimer = null;
function showAlert(message, type = "success") {
  alertEl.className = `alert alert-${type}`;
  alertEl.textContent = message;
  alertEl.hidden = false;
  clearTimeout(alertTimer);
  alertTimer = setTimeout(() => { alertEl.hidden = true; }, 3800);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatDate(isoString) {
  if (!isoString) return "—";
  return new Date(isoString).toLocaleString(undefined, {
    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
  });
}

function badgeClass(status) {
  switch (status) {
    case "Development": return "badge-dev";
    case "Testing":     return "badge-test";
    case "Deployed":    return "badge-dep";
    default:            return "";
  }
}

function priorityClass(priority) {
  switch (priority) {
    case "High":   return "priority-high";
    case "Medium": return "priority-medium";
    case "Low":    return "priority-low";
    default:       return "priority-medium";
  }
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

// ─── Header stat chips ────────────────────────────────────────────────────────
function updateHeaderStats() {
  totalVal.textContent    = projects.length;
  devVal.textContent      = projects.filter(p => p.status === "Development").length;
  testVal.textContent     = projects.filter(p => p.status === "Testing").length;
  deployedVal.textContent = projects.filter(p => p.status === "Deployed").length;
}

// ─── Filter logic ─────────────────────────────────────────────────────────────
function getFilteredProjects() {
  return projects.filter(p => {
    const matchesStatus = filterStatus === "all" || p.status === filterStatus;
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q ||
      p.name.toLowerCase().includes(q) ||
      (p.notes || "").toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });
}

// ─── Dashboard render ─────────────────────────────────────────────────────────
function render() {
  projectList.innerHTML = "";
  updateHeaderStats();

  const filtered = getFilteredProjects();
  const isEmpty  = projects.length === 0;
  const noMatch  = !isEmpty && filtered.length === 0;

  emptyState.hidden    = !isEmpty;
  noResultsState.hidden= !noMatch;
  filterBar.hidden     = isEmpty;
  listHeader.hidden    = isEmpty;

  if (!isEmpty) {
    listCount.textContent = filtered.length === projects.length
      ? `${projects.length} project${projects.length !== 1 ? "s" : ""}`
      : `${filtered.length} of ${projects.length} project${projects.length !== 1 ? "s" : ""}`;

    filtered.forEach(p => projectList.appendChild(buildCard(p)));
  }
}

function buildCard(project) {
  const card = document.createElement("article");
  card.className = "project-card";
  card.dataset.id = project.id;

  const bClass   = badgeClass(project.status);
  const pClass   = priorityClass(project.priority || "Medium");
  const priority = project.priority || "Medium";
  const notes    = project.notes || "";

  const options = ["Development", "Testing", "Deployed"]
    .map(s => `<option value="${s}"${s === project.status ? " selected" : ""}>${s}</option>`)
    .join("");

  const priorityOptions = ["Low", "Medium", "High"]
    .map(s => `<option value="${s}"${s === priority ? " selected" : ""}>${s}</option>`)
    .join("");

  card.innerHTML = `
    <div class="card-top">
      <span class="project-name">${escapeHtml(project.name)}</span>
      <div class="card-badges">
        <span class="badge ${bClass}">${escapeHtml(project.status)}</span>
        <span class="priority-badge ${pClass}">${escapeHtml(priority)}</span>
      </div>
    </div>
    ${notes ? `<p class="card-notes">${escapeHtml(notes)}</p>` : ""}
    <div class="card-meta">
      <span>Created: ${formatDate(project.created_at)}</span>
      <span>Updated: ${formatDate(project.updated_at)}</span>
    </div>
    <div class="card-actions">
      <select class="card-select status-select" aria-label="Change status">${options}</select>
      <select class="card-select priority-select" aria-label="Change priority">${priorityOptions}</select>
      <button class="btn btn-ghost update-btn" title="Save changes">
        <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
        Save
      </button>
      <button class="btn btn-danger delete-btn" title="Delete project">
        <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/></svg>
        Delete
      </button>
    </div>
  `;

  card.querySelector(".update-btn").addEventListener("click", () => {
    updateProject(
      project.id,
      card.querySelector(".status-select").value,
      card.querySelector(".priority-select").value,
      card
    );
  });
  card.querySelector(".delete-btn").addEventListener("click", () => {
    deleteProject(project.id, card);
  });

  return card;
}

// ─── API: fetch projects ──────────────────────────────────────────────────────
async function fetchProjects() {
  spinnerEl.hidden = false;
  try {
    const res = await fetch(API);
    if (!res.ok) throw new Error(`Server error: ${res.status}`);
    projects = await res.json();
    render();
  } catch (err) {
    showAlert("Failed to load projects. " + err.message, "error");
    emptyState.hidden = false;
  } finally {
    spinnerEl.hidden = true;
  }
}

// ─── API: create project ──────────────────────────────────────────────────────
async function createProject(name, status, priority, notes) {
  const res = await fetch(API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, status, priority, notes }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to create project");
  return data;
}

// ─── API: update project ──────────────────────────────────────────────────────
async function updateProject(id, status, priority, cardEl) {
  const btn = cardEl.querySelector(".update-btn");
  btn.disabled = true;
  btn.textContent = "Saving…";
  try {
    const res = await fetch(`${API}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, priority }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to update");
    const idx = projects.findIndex(p => p.id === id);
    if (idx !== -1) projects[idx] = data;
    render();
    showAlert(`"${data.name}" updated successfully.`);
  } catch (err) {
    showAlert(err.message, "error");
    btn.disabled = false;
    btn.innerHTML = `<svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg> Save`;
  }
}

// ─── API: delete project ──────────────────────────────────────────────────────
async function deleteProject(id, cardEl) {
  const name = cardEl.querySelector(".project-name").textContent;
  if (!confirm(`Delete "${name}"?`)) return;

  const btn = cardEl.querySelector(".delete-btn");
  btn.disabled = true;
  btn.textContent = "Deleting…";
  try {
    const res = await fetch(`${API}/${id}`, { method: "DELETE" });
    if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Failed to delete"); }
    cardEl.style.transition = "opacity .2s, transform .2s";
    cardEl.style.opacity = "0";
    cardEl.style.transform = "scale(.95)";
    setTimeout(() => {
      projects = projects.filter(p => p.id !== id);
      render();
      showAlert(`"${name}" deleted.`);
    }, 200);
  } catch (err) {
    showAlert(err.message, "error");
    btn.disabled = false;
    btn.innerHTML = `<svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/></svg> Delete`;
  }
}

// ─── Form submission ──────────────────────────────────────────────────────────
addForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  formError.hidden = true;

  const name     = projectName.value.trim();
  const status   = document.getElementById("projectStatus").value;
  const priority = document.getElementById("projectPriority").value;
  const notes    = document.getElementById("projectNotes").value.trim();

  if (!name) {
    formError.textContent = "Project name is required.";
    formError.hidden = false;
    projectName.focus();
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = "Adding…";
  try {
    const project = await createProject(name, status, priority, notes);
    projects.unshift(project);
    render();
    addForm.reset();
    showAlert(`"${project.name}" added successfully!`);
    projectName.focus();
  } catch (err) {
    formError.textContent = err.message;
    formError.hidden = false;
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = `<svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> Add Project`;
  }
});

// ─── Filter pill clicks ───────────────────────────────────────────────────────
document.querySelectorAll(".filter-pill").forEach(pill => {
  pill.addEventListener("click", () => {
    document.querySelectorAll(".filter-pill").forEach(p => p.classList.remove("active"));
    pill.classList.add("active");
    filterStatus = pill.dataset.filter;
    render();
  });
});

// ─── Search input ─────────────────────────────────────────────────────────────
searchInput.addEventListener("input", () => {
  searchQuery = searchInput.value.trim();
  render();
});

// ═════════════════════════════════════════════════════════════════════════════
//  INSIGHTS PAGE
// ═════════════════════════════════════════════════════════════════════════════

async function loadInsights() {
  insightsSpinner.hidden = false;
  insightsEmpty.hidden   = true;
  chartCard.hidden       = true;
  pipelineFlowCard.hidden= true;
  breakdownCard.hidden   = true;
  priorityCard.hidden    = true;
  refreshedAt.textContent = "";

  try {
    const res = await fetch("/stats");
    if (!res.ok) throw new Error(`Server error: ${res.status}`);
    const data = await res.json();
    renderInsights(data);
  } catch (err) {
    showAlert("Failed to load insights. " + err.message, "error");
    insightsEmpty.hidden = false;
  } finally {
    insightsSpinner.hidden = true;
  }
}

function renderInsights(data) {
  const { total, development, testing, deployed,
          high_priority, medium_priority, low_priority,
          completion_rate, refreshed_at } = data;

  document.getElementById("si-total").textContent    = total;
  document.getElementById("si-dev").textContent      = development;
  document.getElementById("si-test").textContent     = testing;
  document.getElementById("si-deployed").textContent = deployed;
  document.getElementById("si-rate").textContent     = total > 0 ? completion_rate + "%" : "—";

  if (total === 0) {
    insightsEmpty.hidden = false;
    return;
  }

  insightsEmpty.hidden    = true;
  chartCard.hidden        = false;
  pipelineFlowCard.hidden = false;
  breakdownCard.hidden    = false;
  priorityCard.hidden     = false;

  buildChart({ development, testing, deployed }, total);
  buildPipelineFlow({ development, testing, deployed }, total);
  buildBreakdown({ development, testing, deployed }, total);
  buildPriorityBreakdown({ high: high_priority, medium: medium_priority, low: low_priority });

  if (refreshed_at) {
    refreshedAt.textContent = "Last refreshed: " + formatDate(refreshed_at);
  }
}

function buildPipelineFlow(counts, total) {
  const el = document.getElementById("pipelineFlow");
  el.innerHTML = "";

  const stages = [
    { label: "Development", count: counts.development, cls: "dev-icon",    bg: "var(--dev-bg)",  color: "var(--dev-text)"  },
    { label: "Testing",     count: counts.testing,     cls: "test-icon",   bg: "var(--test-bg)", color: "var(--test-text)" },
    { label: "Deployed",    count: counts.deployed,    cls: "deploy-icon", bg: "var(--dep-bg)",  color: "var(--dep-text)"  },
  ];

  stages.forEach((s, i) => {
    const pct = total > 0 ? Math.round(s.count / total * 100) : 0;
    const item = document.createElement("div");
    item.className = "flow-item";
    item.innerHTML = `
      <div class="flow-stage">
        <div class="flow-icon ${s.cls}">
          ${stageIcon(s.label)}
        </div>
        <div class="flow-info">
          <span class="flow-label">${s.label}</span>
          <span class="flow-count">${s.count} project${s.count !== 1 ? "s" : ""}</span>
        </div>
        <span class="flow-pct">${pct}%</span>
      </div>
    `;
    el.appendChild(item);

    if (i < stages.length - 1) {
      const arrow = document.createElement("div");
      arrow.className = "flow-arrow";
      arrow.innerHTML = `<svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>`;
      el.appendChild(arrow);
    }
  });
}

function stageIcon(label) {
  if (label === "Development")
    return `<svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>`;
  if (label === "Testing")
    return `<svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v11m0 0a5 5 0 0 0 10 0M9 14a5 5 0 0 0-5 5"/></svg>`;
  return `<svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`;
}

function buildBreakdown(counts, total) {
  const el = document.getElementById("breakdownList");
  el.innerHTML = "";

  const bars = [
    { label: "Development", count: counts.development, color: "var(--dev-ring)"  },
    { label: "Testing",     count: counts.testing,     color: "var(--test-ring)" },
    { label: "Deployed",    count: counts.deployed,    color: "var(--dep-ring)"  },
  ];

  bars.forEach(b => {
    const pct = total > 0 ? Math.round(b.count / total * 100) : 0;
    const row = document.createElement("div");
    row.className = "breakdown-row";
    row.innerHTML = `
      <div class="breakdown-label-row">
        <span class="breakdown-label">${b.label}</span>
        <span class="breakdown-meta">${b.count} project${b.count !== 1 ? "s" : ""} &mdash; ${pct}%</span>
      </div>
      <div class="breakdown-track">
        <div class="breakdown-bar" style="width:${pct}%;background:${b.color}"></div>
      </div>
    `;
    el.appendChild(row);
  });
}

function buildPriorityBreakdown(counts) {
  const el = document.getElementById("priorityList");
  el.innerHTML = "";

  const total = (counts.high || 0) + (counts.medium || 0) + (counts.low || 0);
  const bars = [
    { label: "High",   count: counts.high   || 0, color: "#ef4444" },
    { label: "Medium", count: counts.medium || 0, color: "#f59e0b" },
    { label: "Low",    count: counts.low    || 0, color: "#22c55e" },
  ];

  bars.forEach(b => {
    const pct = total > 0 ? Math.round(b.count / total * 100) : 0;
    const row = document.createElement("div");
    row.className = "breakdown-row";
    row.innerHTML = `
      <div class="breakdown-label-row">
        <span class="breakdown-label">${b.label} Priority</span>
        <span class="breakdown-meta">${b.count} project${b.count !== 1 ? "s" : ""} &mdash; ${pct}%</span>
      </div>
      <div class="breakdown-track">
        <div class="breakdown-bar" style="width:${pct}%;background:${b.color}"></div>
      </div>
    `;
    el.appendChild(row);
  });
}

function buildChart(counts, total) {
  chart.innerHTML = "";

  const bars = [
    { label: "Development", count: counts.development, cls: "chart-bar--dev"  },
    { label: "Testing",     count: counts.testing,     cls: "chart-bar--test" },
    { label: "Deployed",    count: counts.deployed,    cls: "chart-bar--dep"  },
  ];

  const MAX_BAR_PX = 140;

  bars.forEach(b => {
    const pct  = total > 0 ? b.count / total : 0;
    const hPx  = Math.max(pct * MAX_BAR_PX, b.count > 0 ? 6 : 0);
    const pctLabel = total > 0 ? Math.round(pct * 100) + "%" : "0%";

    const group = document.createElement("div");
    group.className = "chart-bar-group";
    group.setAttribute("role", "img");
    group.setAttribute("aria-label", `${b.label}: ${b.count} project${b.count !== 1 ? "s" : ""} (${pctLabel})`);

    group.innerHTML = `
      <span class="chart-count">${b.count}</span>
      <div class="chart-bar-wrap">
        <div class="chart-bar ${b.cls}" style="height:${hPx}px" title="${b.label}: ${b.count} (${pctLabel})"></div>
      </div>
      <span class="chart-label">${b.label}</span>
    `;

    chart.appendChild(group);
  });
}

// Refresh button
refreshBtn.addEventListener("click", loadInsights);

// ─── Boot ─────────────────────────────────────────────────────────────────────
fetchProjects();
