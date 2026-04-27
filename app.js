import { categories, initialTemplates, blockTypes } from "./templates.js";
import { loadAllPrompts, persistAllPrompts, loadTheme, saveTheme } from "./storage.js";
import { exportAsTxt, exportAsJson, exportAsMarkdown } from "./export.js";

const views = ["dashboard", "library", "editor", "builder", "templates"];
const menu = document.getElementById("menu");
const toast = document.getElementById("toast");

const state = {
  prompts: [],
  currentId: null,
  query: "",
  category: "all",
  sortBy: "date",
  rightTab: "preview",
  builderBlocks: []
};

const uid = () => `prompt_${Date.now()}_${Math.random().toString(16).slice(2, 6)}`;
const clone = (v) => JSON.parse(JSON.stringify(v));

export function createPrompt() {
  return {
    id: uid(),
    title: "Nuevo Prompt",
    category: "ChatGPT",
    target_model: "GPT-5.5",
    complexity: "advanced",
    language: "Spanish",
    description: "",
    tags: [],
    variables: [{ name: "TOPIC", type: "string", required: true, default: "" }],
    prompt_structure: { role: "", context: "", objective: "", instructions: [], constraints: [], output_format: "Markdown", quality_criteria: [], examples: [] },
    final_prompt: "",
    versions: []
  };
}

export function loadPrompt(id) {
  state.currentId = id;
  renderAll();
}

export function savePrompt() {
  const p = currentPrompt();
  p.updatedAt = new Date().toISOString();
  const i = state.prompts.findIndex((x) => x.id === p.id);
  if (i >= 0) state.prompts[i] = clone(p);
  else state.prompts.unshift(clone(p));
  persistAllPrompts(state.prompts);
  pop("Prompt guardado");
  renderAll();
}

export function deletePrompt(id) {
  state.prompts = state.prompts.filter((p) => p.id !== id);
  persistAllPrompts(state.prompts);
  if (state.currentId === id) state.currentId = state.prompts[0]?.id || null;
  pop("Prompt eliminado");
  renderAll();
}

export function duplicatePrompt(id) {
  const base = state.prompts.find((p) => p.id === id);
  if (!base) return;
  const dup = { ...clone(base), id: uid(), title: `${base.title} (copia)`, updatedAt: new Date().toISOString() };
  state.prompts.unshift(dup);
  persistAllPrompts(state.prompts);
  state.currentId = dup.id;
  pop("Prompt duplicado");
  renderAll();
}

export function validatePromptJson(json) {
  const errors = [];
  const required = ["id", "title", "category", "target_model", "variables", "prompt_structure"];
  required.forEach((k) => { if (!(k in json)) errors.push(`Falta el campo '${k}'`); });
  if (!Array.isArray(json.variables)) errors.push("variables debe ser array");
  if (json.variables?.some((v) => !v.name || typeof v.required !== "boolean")) errors.push("Variables mal formadas");
  const ps = json.prompt_structure || {};
  ["role", "context", "objective", "output_format"].forEach((k) => { if (!(k in ps)) errors.push(`Estructura incompleta: ${k}`); });
  return { valid: errors.length === 0, errors };
}

const fillVars = (txt, variables) => (txt || "").replace(/\{\{(.*?)\}\}/g, (_, name) => {
  const v = variables.find((x) => x.name === name.trim());
  return v?.default ?? `{{${name}}}`;
});

export function compilePromptFromJson(json) {
  const ps = json.prompt_structure;
  const asList = (title, arr) => Array.isArray(arr) && arr.length ? `\n${title}:\n- ${arr.join("\n- ")}` : "";
  const examples = Array.isArray(ps.examples) && ps.examples.length ? `\nEjemplos:\n${ps.examples.map((e) => `Input: ${e.input}\nOutput esperado: ${e.expected_output}`).join("\n")}` : "";
  const raw = `Rol: ${ps.role}\nContexto: ${ps.context}\nObjetivo: ${ps.objective}${asList("Instrucciones", ps.instructions)}${asList("Restricciones", ps.constraints)}\nFormato de salida: ${ps.output_format}${asList("Criterios de calidad", ps.quality_criteria)}${examples}`;
  return fillVars(raw, json.variables || []);
}

function evaluatePrompt(prompt) {
  const p = prompt.prompt_structure;
  const score = {
    claridad: Math.min(100, p.objective.length * 1.3),
    especificidad: Math.min(100, (p.instructions.length + p.constraints.length) * 12),
    estructura: [p.role, p.context, p.objective, p.output_format].filter(Boolean).length * 25,
    longitud: Math.max(0, 100 - Math.abs((prompt.final_prompt.length || 0) - 1200) / 12),
    restricciones: Math.min(100, p.constraints.length * 20),
    formato: p.output_format ? 100 : 30,
    reutilizacion: Math.min(100, (prompt.variables?.length || 0) * 20),
    detalle: Math.min(100, ((p.quality_criteria?.length || 0) + (p.examples?.length || 0)) * 20)
  };
  const total = Math.round(Object.values(score).reduce((a, b) => a + b, 0) / Object.keys(score).length);
  return { score, total };
}

export function renderSvgFlow(promptObject) {
  const labels = ["Rol", "Contexto", "Objetivo", "Instrucciones", "Salida"];
  const w = 780;
  const h = 180;
  const nodeW = 130;
  const gap = 20;
  return `<svg viewBox="0 0 ${w} ${h}" width="100%" role="img" aria-label="Flujo prompt">${labels.map((l, i) => {
    const x = 20 + i * (nodeW + gap);
    const y = 50;
    const conn = i < labels.length - 1 ? `<line x1="${x + nodeW}" y1="85" x2="${x + nodeW + gap}" y2="85" stroke="var(--accent)" stroke-width="2" marker-end="url(#arr)"/>` : "";
    const text = i === 0 ? promptObject.prompt_structure.role || l : l;
    return `<rect x="${x}" y="50" width="${nodeW}" height="70" rx="12" fill="var(--accent-soft)" stroke="var(--accent)"/><text x="${x + 8}" y="76" font-size="12" fill="var(--text)">${escapeHtml(text).slice(0, 14)}</text>${conn}`;
  }).join("")}<defs><marker id="arr" markerWidth="6" markerHeight="6" refX="6" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6" fill="var(--accent)"/></marker></defs></svg>`;
}

export function updatePreview() {
  const p = currentPrompt();
  p.final_prompt = compilePromptFromJson(p);
  document.getElementById("previewPanel").innerHTML = `<h3>Prompt final</h3><div class="code">${escapeHtml(p.final_prompt)}</div>`;
  const json = JSON.stringify(p, null, 2)
    .replace(/"([^"]+)":/g, '<span class="k">"$1"</span>:')
    .replace(/: "([^"]*)"/g, ': <span class="s">"$1"</span>')
    .replace(/: (\d+)/g, ': <span class="n">$1</span>');
  document.getElementById("jsonPanel").innerHTML = `<h3>JSON editable</h3><textarea id="jsonEditor" class="code json-highlight" style="min-height:320px">${JSON.stringify(p, null, 2)}</textarea><div class="row"><button id="applyJson" class="btn">Aplicar JSON</button><span class="small" id="jsonMsg"></span></div><div class="code json-highlight">${json}</div>`;
  document.getElementById("svgPanel").innerHTML = `<h3>Flujo SVG</h3>${renderSvgFlow(p)}`;

  const evalRes = evaluatePrompt(p);
  document.getElementById("versionsPanel").innerHTML = `<h3>Comparador de versiones</h3><div class="small">Total: ${evalRes.total}/100</div>${Object.entries(evalRes.score).map(([k, v]) => `<div class="small">${k}</div><div class="eval-bar"><span style="width:${v}%"></span></div>`).join("")}<div class="row" style="margin-top:8px"><button id="saveVersion" class="btn secondary">Guardar versión</button>${(p.versions || []).map((v, i) => `<button data-v="${i}" class="btn secondary">v${i + 1}</button>`).join("")}</div><div id="diffBox" class="code small"></div>`;

  hookRightPanelEvents();
}

const extremePrompt = (idea) => `Rol experto: Arquitecto senior en IA aplicada a ${idea}.\nContexto: entorno real con límites operativos.\nPasos: analizar, diseñar, validar, iterar, documentar.\nValidaciones: consistencia, trazabilidad, riesgos, supuestos.\nFormato JSON: resultados con campos claros.\nCriterios de calidad: claridad, precisión, aplicabilidad.\nAnti-alucinación: declarar incertidumbre y solicitar datos faltantes.\nFuentes: pedir fuentes verificables cuando aplique.\nEntrega: informe profesional accionable.`;

function currentPrompt() {
  let p = state.prompts.find((x) => x.id === state.currentId);
  if (!p) {
    p = createPrompt();
    state.prompts.unshift(p);
    state.currentId = p.id;
  }
  return p;
}

function escapeHtml(v) {
  return String(v).replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[m]));
}

function pop(msg) {
  toast.textContent = msg;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 1600);
}

function setupMenu() {
  const labels = { dashboard: "Dashboard", library: "Biblioteca", editor: "Editor", builder: "Constructor", templates: "Plantillas" };
  menu.innerHTML = views.map((v) => `<button data-view="${v}" class="btn secondary">${labels[v]}</button>`).join("") + `<button id="newPrompt" class="btn">+ Nuevo prompt</button>`;
  menu.onclick = (e) => {
    const view = e.target.dataset.view;
    if (view) {
      views.forEach((v) => document.getElementById(v).classList.toggle("hidden", v !== view));
    }
    if (e.target.id === "newPrompt") {
      const p = createPrompt();
      state.prompts.unshift(p);
      state.currentId = p.id;
      savePrompt();
    }
  };
}

function renderDashboard() {
  const el = document.getElementById("dashboard");
  const recent = [...state.prompts].sort((a, b) => (b.updatedAt || "").localeCompare(a.updatedAt || "")).slice(0, 4);
  const cats = [...new Set(state.prompts.map((p) => p.category))];
  el.innerHTML = `<h2>Dashboard principal</h2><div class="grid-3"><div class="stat"><div class="small">Prompts</div><strong>${state.prompts.length}</strong></div><div class="stat"><div class="small">Categorías</div><strong>${cats.length}</strong></div><div class="stat"><div class="small">Modelos</div><strong>${new Set(state.prompts.map((p) => p.target_model)).size}</strong></div></div><h3>Últimos editados</h3><div class="list">${recent.map((p) => `<div class="item"><strong>${p.title}</strong><div class="small">${p.category} · ${p.target_model}</div></div>`).join("")}</div><h3>Actividad (SVG)</h3>${sparkline(state.prompts.map((_, i) => i + 1))}`;
}

function sparkline(values) {
  const max = Math.max(...values, 1);
  const points = values.map((v, i) => `${i * 28 + 8},${60 - (v / max) * 48}`).join(" ");
  return `<svg viewBox="0 0 280 70" width="100%"><polyline fill="none" stroke="var(--accent)" stroke-width="2" points="${points}"/><line x1="0" y1="62" x2="280" y2="62" stroke="var(--border)"/></svg>`;
}

function renderLibrary() {
  const el = document.getElementById("library");
  const list = state.prompts
    .filter((p) => (state.category === "all" || p.category === state.category) && `${p.title} ${p.description} ${(p.tags || []).join(" ")}`.toLowerCase().includes(state.query.toLowerCase()))
    .sort((a, b) => state.sortBy === "name" ? a.title.localeCompare(b.title) : state.sortBy === "complexity" ? (a.complexity || "").localeCompare(b.complexity || "") : state.sortBy === "model" ? (a.target_model || "").localeCompare(b.target_model || "") : (b.updatedAt || "").localeCompare(a.updatedAt || ""));

  el.innerHTML = `<h2>Biblioteca de prompts</h2><div class="row"><input id="search" placeholder="Buscar por palabra clave" value="${state.query}"/><select id="catFilter"><option value="all">Todas</option>${categories.map((c) => `<option ${state.category === c ? "selected" : ""}>${c}</option>`).join("")}</select><select id="sortBy"><option value="date">Fecha</option><option value="name">Nombre</option><option value="complexity">Complejidad</option><option value="model">Modelo</option></select></div><div class="list">${list.map((p) => `<div class="item"><div class="row"><strong>${p.title}</strong><span class="pill">${p.category}</span></div><div class="small">${p.description || "Sin descripción"}</div><div class="row"><button class="btn secondary" data-open="${p.id}">Abrir</button><button class="btn secondary" data-dup="${p.id}">Duplicar</button><button class="btn danger" data-del="${p.id}">Eliminar</button></div></div>`).join("") || '<div class="small">Sin resultados</div>'}</div>`;

  el.querySelector("#search").oninput = (e) => { state.query = e.target.value; renderLibrary(); };
  el.querySelector("#catFilter").onchange = (e) => { state.category = e.target.value; renderLibrary(); };
  el.querySelector("#sortBy").value = state.sortBy;
  el.querySelector("#sortBy").onchange = (e) => { state.sortBy = e.target.value; renderLibrary(); };
  el.onclick = (e) => {
    if (e.target.dataset.open) loadPrompt(e.target.dataset.open);
    if (e.target.dataset.dup) duplicatePrompt(e.target.dataset.dup);
    if (e.target.dataset.del) deletePrompt(e.target.dataset.del);
  };
}

function renderEditor() {
  const p = currentPrompt();
  const el = document.getElementById("editor");
  const words = p.final_prompt.trim() ? p.final_prompt.trim().split(/\s+/).length : 0;
  const complexityPct = Math.min(100, (p.final_prompt.length / 2500) * 100);
  el.innerHTML = `<h2>Editor avanzado</h2>
    <div class="grid-2">
      <label>Título<input id="title" value="${escapeHtml(p.title)}"></label>
      <label>Modelo objetivo<input id="target" value="${escapeHtml(p.target_model || "")}"></label>
      <label>Categoría<select id="category">${categories.map((c) => `<option ${c === p.category ? "selected" : ""}>${c}</option>`).join("")}</select></label>
      <label>Tags (coma)<input id="tags" value="${(p.tags || []).join(",")}"></label>
    </div>
    <label>Descripción<textarea id="description">${escapeHtml(p.description || "")}</textarea></label>
    <label>Idea rápida<textarea id="simpleIdea" placeholder="Describe una idea simple..."></textarea></label>
    <div class="row"><button id="extreme" class="btn secondary">⚡ Prompt Extremo</button></div>
    <label>Prompt principal<textarea id="mainPromptInput">${escapeHtml(p.final_prompt || "")}</textarea></label>
    <h3>Variables dinámicas</h3>
    <div id="vars" class="list">${(p.variables || []).map((v, i) => `<div class="row"><input data-vn="${i}" value="${v.name}"><input data-vd="${i}" value="${escapeHtml(v.default || "")}" placeholder="valor"><button data-vr="${i}" class="btn danger">x</button></div>`).join("")}</div>
    <button id="addVar" class="btn secondary">+ Variable</button>
    <div class="row" style="margin-top:10px"><button id="saveBtn" class="btn">Guardar</button><button id="copyBtn" class="btn secondary">Copiar</button><button id="exportTxt" class="btn secondary">Exportar TXT</button><button id="exportJson" class="btn secondary">Exportar JSON</button><button id="exportMd" class="btn secondary">Exportar Markdown</button><button id="clearBtn" class="btn danger">Limpiar</button></div>
    <div class="small">Caracteres: ${p.final_prompt.length} · Palabras: ${words}</div>
    <div class="small">Complejidad</div><div class="eval-bar"><span style="width:${complexityPct}%"></span></div>`;

  el.oninput = (e) => {
    p.title = el.querySelector("#title").value;
    p.target_model = el.querySelector("#target").value;
    p.category = el.querySelector("#category").value;
    p.description = el.querySelector("#description").value;
    p.tags = el.querySelector("#tags").value.split(",").map((x) => x.trim()).filter(Boolean);
    p.final_prompt = el.querySelector("#mainPromptInput").value;
    [...el.querySelectorAll("[data-vn]")].forEach((inp) => { p.variables[Number(inp.dataset.vn)].name = inp.value; });
    [...el.querySelectorAll("[data-vd]")].forEach((inp) => { p.variables[Number(inp.dataset.vd)].default = inp.value; });
    updatePreview();
  };

  el.onclick = (e) => {
    if (e.target.id === "addVar") { p.variables.push({ name: "NEW_VAR", type: "string", required: false, default: "" }); renderEditor(); }
    if (e.target.dataset.vr) { p.variables.splice(Number(e.target.dataset.vr), 1); renderEditor(); }
    if (e.target.id === "saveBtn") savePrompt();
    if (e.target.id === "copyBtn") navigator.clipboard.writeText(p.final_prompt).then(() => pop("Prompt copiado"));
    if (e.target.id === "exportTxt") exportAsTxt(p.final_prompt);
    if (e.target.id === "exportJson") exportAsJson(p);
    if (e.target.id === "exportMd") exportAsMarkdown(p);
    if (e.target.id === "clearBtn") { p.final_prompt = ""; renderEditor(); updatePreview(); }
    if (e.target.id === "extreme") {
      p.prompt_structure.role = extremePrompt(el.querySelector("#simpleIdea").value || "la tarea");
      p.final_prompt = compilePromptFromJson(p);
      renderEditor();
      updatePreview();
      pop("Modo Prompt Extremo aplicado");
    }
  };
}

function renderBuilder() {
  const p = currentPrompt();
  if (!state.builderBlocks.length) {
    state.builderBlocks = blockTypes.map((key, idx) => ({ id: uid(), key, enabled: true, value: key in p.prompt_structure ? p.prompt_structure[key] : "", order: idx }));
  }
  const el = document.getElementById("builder");
  el.innerHTML = `<h2>Constructor visual de prompts</h2>${state.builderBlocks.sort((a,b)=>a.order-b.order).map((b, i) => `<div class="builder-block"><div class="builder-head"><strong>${b.key}</strong><div class="row"><button data-up="${i}" class="btn secondary">↑</button><button data-down="${i}" class="btn secondary">↓</button><button data-dup="${i}" class="btn secondary">Duplicar</button><button data-del="${i}" class="btn danger">Eliminar</button><label class="small"><input type="checkbox" data-en="${i}" ${b.enabled ? "checked" : ""}/> Activo</label></div></div><textarea data-val="${i}">${Array.isArray(b.value) ? b.value.join("\n") : escapeHtml(b.value || "")}</textarea></div>`).join("")}<button id="syncBuilder" class="btn">Sincronizar al prompt</button>`;
  el.oninput = (e) => {
    if (e.target.dataset.val) {
      const b = state.builderBlocks[Number(e.target.dataset.val)];
      b.value = ["instructions", "constraints", "quality_criteria"].includes(b.key) ? e.target.value.split("\n").filter(Boolean) : e.target.value;
    }
    if (e.target.dataset.en) state.builderBlocks[Number(e.target.dataset.en)].enabled = e.target.checked;
  };
  el.onclick = (e) => {
    const swap = (a,b) => ([state.builderBlocks[a].order, state.builderBlocks[b].order] = [state.builderBlocks[b].order, state.builderBlocks[a].order]);
    if (e.target.dataset.up && Number(e.target.dataset.up) > 0) swap(Number(e.target.dataset.up), Number(e.target.dataset.up)-1);
    if (e.target.dataset.down && Number(e.target.dataset.down) < state.builderBlocks.length - 1) swap(Number(e.target.dataset.down), Number(e.target.dataset.down)+1);
    if (e.target.dataset.del) state.builderBlocks.splice(Number(e.target.dataset.del), 1);
    if (e.target.dataset.dup) state.builderBlocks.push({ ...clone(state.builderBlocks[Number(e.target.dataset.dup)]), id: uid(), order: state.builderBlocks.length + 1 });
    if (e.target.id === "syncBuilder") {
      state.builderBlocks.filter((b) => b.enabled).forEach((b) => {
        if (["style", "validations", "final_notes", "variables"].includes(b.key)) return;
        p.prompt_structure[b.key] = b.value;
      });
      p.final_prompt = compilePromptFromJson(p);
      updatePreview();
      pop("Constructor sincronizado");
    }
    renderBuilder();
  };
}

function renderTemplates() {
  const el = document.getElementById("templates");
  el.innerHTML = `<h2>Sistema de plantillas</h2><div class="list">${initialTemplates.map((t) => `<div class="item"><strong>${t.title}</strong><div class="small">${t.description}</div><div class="row"><span class="pill">${t.category}</span><button data-use="${t.id}" class="btn secondary">Usar plantilla</button></div></div>`).join("")}</div><h3>Importar JSON</h3><textarea id="importJson" placeholder="Pega tu JSON aquí"></textarea><button id="importBtn" class="btn">Importar prompt</button><div id="importMsg" class="small"></div>`;
  el.onclick = (e) => {
    if (e.target.dataset.use) {
      const tpl = clone(initialTemplates.find((t) => t.id === e.target.dataset.use));
      tpl.id = uid();
      tpl.updatedAt = new Date().toISOString();
      tpl.versions = [];
      tpl.final_prompt = compilePromptFromJson(tpl);
      state.prompts.unshift(tpl);
      state.currentId = tpl.id;
      savePrompt();
    }
    if (e.target.id === "importBtn") {
      const msg = el.querySelector("#importMsg");
      try {
        const parsed = JSON.parse(el.querySelector("#importJson").value);
        const check = validatePromptJson(parsed);
        if (!check.valid) {
          msg.textContent = check.errors.join(" | ");
          msg.style.color = "var(--danger)";
          return;
        }
        parsed.id = uid();
        parsed.updatedAt = new Date().toISOString();
        parsed.versions = parsed.versions || [];
        parsed.final_prompt = compilePromptFromJson(parsed);
        state.prompts.unshift(parsed);
        state.currentId = parsed.id;
        savePrompt();
        msg.textContent = "Importado correctamente";
        msg.style.color = "var(--success)";
      } catch {
        msg.textContent = "JSON inválido";
        msg.style.color = "var(--danger)";
      }
    }
  };
}

function hookRightPanelEvents() {
  const apply = document.getElementById("applyJson");
  if (apply) {
    apply.onclick = () => {
      const raw = document.getElementById("jsonEditor").value;
      const msg = document.getElementById("jsonMsg");
      try {
        const parsed = JSON.parse(raw);
        const check = validatePromptJson(parsed);
        if (!check.valid) {
          msg.textContent = check.errors.join(" | ");
          msg.style.color = "var(--danger)";
          return;
        }
        parsed.id = currentPrompt().id;
        parsed.updatedAt = new Date().toISOString();
        const idx = state.prompts.findIndex((x) => x.id === state.currentId);
        state.prompts[idx] = parsed;
        msg.textContent = "JSON aplicado";
        msg.style.color = "var(--success)";
        renderAll();
      } catch {
        msg.textContent = "JSON inválido";
        msg.style.color = "var(--danger)";
      }
    };
  }

  const saveVersion = document.getElementById("saveVersion");
  if (saveVersion) {
    saveVersion.onclick = () => {
      const p = currentPrompt();
      p.versions = p.versions || [];
      p.versions.push({ timestamp: new Date().toISOString(), snapshot: p.final_prompt });
      savePrompt();
    };
  }

  document.querySelectorAll("[data-v]").forEach((btn) => {
    btn.onclick = () => {
      const p = currentPrompt();
      const idx = Number(btn.dataset.v);
      const v = p.versions?.[idx];
      if (!v) return;
      const curr = p.final_prompt.split("\n");
      const old = v.snapshot.split("\n");
      const diff = curr.map((line, i) => line === old[i] ? `  ${line}` : `- ${old[i] || ""}\n+ ${line}`).join("\n");
      document.getElementById("diffBox").textContent = diff;
    };
  });
}

function setupTabs() {
  document.querySelectorAll(".tab").forEach((t) => {
    t.onclick = () => {
      state.rightTab = t.dataset.rightTab;
      document.querySelectorAll(".tab").forEach((x) => x.classList.toggle("active", x === t));
      ["preview", "json", "svg", "versions"].forEach((name) => {
        document.getElementById(`${name}Panel`).classList.toggle("hidden", name !== state.rightTab);
      });
    };
  });
}

function setupTheme() {
  const th = loadTheme();
  document.body.classList.toggle("dark", th === "dark");
  document.getElementById("themeToggle").onclick = () => {
    const dark = !document.body.classList.contains("dark");
    document.body.classList.toggle("dark", dark);
    saveTheme(dark ? "dark" : "light");
  };
}

function renderAll() {
  renderDashboard();
  renderLibrary();
  renderEditor();
  renderBuilder();
  renderTemplates();
  updatePreview();
}

function init() {
  setupMenu();
  setupTabs();
  setupTheme();
  state.prompts = loadAllPrompts();
  if (!state.prompts.length) {
    state.prompts = initialTemplates.slice(0, 3).map((t) => ({ ...clone(t), id: uid(), updatedAt: new Date().toISOString(), versions: [] }));
    persistAllPrompts(state.prompts);
  }
  state.currentId = state.prompts[0].id;
  state.prompts.forEach((p) => { p.final_prompt = p.final_prompt || compilePromptFromJson(p); });
  renderAll();
}

init();
