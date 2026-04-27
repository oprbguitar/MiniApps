import { categories, initialTemplates, blockTypes } from "./templates.js";
import { loadAllPrompts, persistAllPrompts, loadTheme, saveTheme, loadFavorites, saveFavorites, addHistory, exportFullBackup, importFullBackup } from "./storage.js";
import { exportAsTxt, exportAsJson, exportAsMarkdown, exportAsHtml, exportCollection } from "./export.js";

const views = ["dashboard", "library", "editor", "builder", "templates", "settings"];
const menu = document.getElementById("menu");
const toast = document.getElementById("toast");

const state = {
  prompts: [],
  favorites: [],
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
  addHistory({ action: 'load', promptId: id, title: currentPrompt().title });
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
  addHistory({ action: 'save', promptId: p.id, title: p.title });
  renderAll();
}

export function deletePrompt(id) {
  state.prompts = state.prompts.filter((p) => p.id !== id);
  state.favorites = state.favorites.filter((fid) => fid !== id);
  persistAllPrompts(state.prompts);
  saveFavorites(state.favorites);
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

export function toggleFavorite(id) {
  if (state.favorites.includes(id)) {
    state.favorites = state.favorites.filter((x) => x !== id);
  } else {
    state.favorites.push(id);
  }
  saveFavorites(state.favorites);
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
  const asList = (title, arr) => Array.isArray(arr) && arr.length ? `\n\n${title}:\n- ${arr.join("\n- ")}` : "";
  const examples = Array.isArray(ps.examples) && ps.examples.length ? `\n\nEjemplos:\n${ps.examples.map((e) => `Input: ${e.input}\nOutput esperado: ${e.expected_output}`).join("\n\n")}` : "";
  const raw = `Rol: ${ps.role}\nContexto: ${ps.context}\nObjetivo: ${ps.objective}${asList("Instrucciones", ps.instructions)}${asList("Restricciones", ps.constraints)}\n\nFormato de salida: ${ps.output_format}${asList("Criterios de calidad", ps.quality_criteria)}${examples}`;
  return fillVars(raw, json.variables || []);
}

function evaluatePrompt(prompt) {
  const p = prompt.prompt_structure;
  const score = {
    claridad: Math.min(100, (p.objective?.length || 0) * 1.3),
    especificidad: Math.min(100, ((p.instructions?.length || 0) + (p.constraints?.length || 0)) * 12),
    estructura: [p.role, p.context, p.objective, p.output_format].filter(Boolean).length * 25,
    longitud: Math.max(0, 100 - Math.abs((prompt.final_prompt?.length || 0) - 1200) / 12),
    restricciones: Math.min(100, (p.constraints?.length || 0) * 20),
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
    const conn = i < labels.length - 1 ? `<line x1="${x + nodeW}" y1="85" x2="${x + nodeW + gap}" y2="85" stroke="var(--accent)" stroke-width="2" marker-end="url(#arr)"/>` : "";
    const text = i === 0 ? promptObject.prompt_structure.role || l : l;
    return `<rect x="${x}" y="50" width="${nodeW}" height="70" rx="12" fill="var(--accent-soft)" stroke="var(--accent)"/><text x="${x + 8}" y="76" font-size="12" fill="var(--text)">${escapeHtml(text).slice(0, 14)}</text>${conn}`;
  }).join("")}<defs><marker id="arr" markerWidth="6" markerHeight="6" refX="6" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6" fill="var(--accent)"/></marker></defs></svg>`;
}

export function updatePreview() {
  const p = currentPrompt();
  p.final_prompt = compilePromptFromJson(p);
  document.getElementById("previewPanel").innerHTML = `<h3>Prompt final</h3><div class="code" style="max-height: 60vh; overflow-y: auto;">${escapeHtml(p.final_prompt)}</div>`;
  
  const jsonStr = JSON.stringify(p, null, 2);
  const highlightedJson = jsonStr
    .replace(/"([^"]+)":/g, '<span class="k">"$1"</span>:')
    .replace(/: "([^"]*)"/g, ': <span class="s">"$1"</span>')
    .replace(/: (\d+)/g, ': <span class="n">$1</span>');

  document.getElementById("jsonPanel").innerHTML = `<h3>JSON editable</h3><textarea id="jsonEditor" class="code json-highlight" style="min-height:320px; font-family: monospace;">${jsonStr}</textarea><div class="row" style="margin-top:8px;"><button id="applyJson" class="btn">Aplicar JSON</button><span class="small" id="jsonMsg"></span></div><div class="code json-highlight" style="margin-top:12px; max-height:40vh; overflow-y:auto;">${highlightedJson}</div>`;
  
  document.getElementById("svgPanel").innerHTML = `<h3>Flujo visual (SVG)</h3>${renderSvgFlow(p)}`;

  const evalRes = evaluatePrompt(p);
  document.getElementById("versionsPanel").innerHTML = `<h3>Análisis de Calidad</h3>
    <div class="score-circle" style="--pct: ${evalRes.total};"><span>${evalRes.total}</span></div>
    <div class="grid-2">
      ${Object.entries(evalRes.score).map(([k, v]) => `<div><div class="small" style="text-transform: capitalize;">${k}</div><div class="eval-bar"><span style="width:${v}%"></span></div></div>`).join("")}
    </div>
    <h3 style="margin-top:20px;">Versiones</h3>
    <div class="row" style="margin-top:8px"><button id="saveVersion" class="btn secondary">Guardar versión actual</button>${(p.versions || []).map((v, i) => `<button data-v="${i}" class="btn secondary">v${i + 1}</button>`).join("")}</div>
    <div id="diffBox" class="code small" style="margin-top:12px; min-height: 50px;">Selecciona una versión para comparar</div>`;

  hookRightPanelEvents();
}

const extremePrompt = (idea) => `Rol experto: Arquitecto senior en IA aplicada a ${idea}.\nContexto: entorno real con límites operativos y alta exigencia.\nPasos: analizar situación, diseñar solución, validar viabilidad, iterar propuesta, documentar resultado.\nValidaciones: consistencia interna, trazabilidad, riesgos, supuestos.\nFormato JSON o Markdown: resultados con campos claros y accionables.\nCriterios de calidad: claridad técnica, precisión metodológica, aplicabilidad directa.\nAnti-alucinación: declarar incertidumbre, no inventar datos y solicitar información faltante explícitamente.\nFuentes: basarse en principios verificables de la disciplina.\nEntrega: informe profesional, estructurado y sin redundancias.`;

function currentPrompt() {
  let p = state.prompts.find((x) => x.id === state.currentId);
  if (!p) {
    if (state.prompts.length > 0) {
      state.currentId = state.prompts[0].id;
      p = state.prompts[0];
    } else {
      p = createPrompt();
      state.prompts.unshift(p);
      state.currentId = p.id;
    }
  }
  return p;
}

function escapeHtml(v) {
  return String(v).replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[m]));
}

function pop(msg) {
  toast.textContent = msg;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2000);
}

function setupMenu() {
  const labels = { dashboard: "Dashboard", library: "Biblioteca", editor: "Editor", builder: "Constructor", templates: "Plantillas", settings: "Ajustes" };
  const icons = { dashboard: "📊", library: "📚", editor: "✏️", builder: "🧩", templates: "📋", settings: "⚙️" };
  
  menu.innerHTML = views.map((v) => `<button data-view="${v}" class="${v==='dashboard'?'active-view':''}">${icons[v]} ${labels[v]}</button>`).join("") + `<div style="height: 10px;"></div><button id="newPrompt" class="btn">+ Nuevo Prompt</button>`;
  
  menu.onclick = (e) => {
    const view = e.target.closest('button')?.dataset.view;
    if (view) {
      views.forEach((v) => document.getElementById(v).classList.toggle("hidden", v !== view));
      [...menu.querySelectorAll('button[data-view]')].forEach(btn => btn.classList.toggle('active-view', btn.dataset.view === view));
    }
    if (e.target.closest('button')?.id === "newPrompt") {
      const p = createPrompt();
      state.prompts.unshift(p);
      state.currentId = p.id;
      savePrompt();
      document.querySelector('[data-view="editor"]').click();
    }
  };
}

function renderDashboard() {
  const el = document.getElementById("dashboard");
  const recent = [...state.prompts].sort((a, b) => (b.updatedAt || "").localeCompare(a.updatedAt || "")).slice(0, 5);
  const cats = [...new Set(state.prompts.map((p) => p.category))];
  const models = [...new Set(state.prompts.map((p) => p.target_model))];
  
  el.innerHTML = `<div class="fade-in">
    <h2>Dashboard</h2>
    <div class="grid-4" style="margin-bottom: 24px;">
      <div class="stat"><div class="small">Total Prompts</div><strong>${state.prompts.length}</strong></div>
      <div class="stat"><div class="small">Favoritos</div><strong>${state.favorites.length}</strong></div>
      <div class="stat"><div class="small">Categorías</div><strong>${cats.length}</strong></div>
      <div class="stat"><div class="small">Modelos</div><strong>${models.length}</strong></div>
    </div>
    
    <div class="grid-2">
      <div>
        <h3>Última Actividad</h3>
        ${recent.length > 0 ? `<div class="list">${recent.map((p) => `<div class="item" style="display:flex; justify-content:space-between; cursor:pointer;" onclick="window.loadAndEdit('${p.id}')"><div><strong>${p.title}</strong><div class="small">${p.category}</div></div><span class="pill">${p.target_model}</span></div>`).join("")}</div>` : '<div class="empty-state">No hay actividad reciente.</div>'}
      </div>
      <div>
        <h3>Frecuencia de Creación (SVG)</h3>
        <div class="card" style="padding: 20px;">${sparkline(state.prompts.map((_, i) => i + 1))}</div>
        <h3 style="margin-top: 20px;">Atajos útiles</h3>
        <div style="display:flex; gap: 10px; flex-wrap: wrap;">
          <button class="btn secondary" onclick="document.querySelector('[data-view=\\'templates\\']').click()">Explorar Plantillas</button>
          <button class="btn secondary" onclick="document.querySelector('[data-view=\\'library\\']').click()">Ir a Biblioteca</button>
        </div>
      </div>
    </div>
  </div>`;
}

window.loadAndEdit = (id) => {
  loadPrompt(id);
  document.querySelector('[data-view="editor"]').click();
};

function sparkline(values) {
  if (!values.length) return `<svg viewBox="0 0 280 70" width="100%"><line x1="0" y1="62" x2="280" y2="62" stroke="var(--border)"/></svg>`;
  const max = Math.max(...values, 1);
  const points = values.map((v, i) => `${i * 28 + 8},${60 - (v / max) * 48}`).join(" ");
  return `<svg viewBox="0 0 280 70" width="100%"><polyline fill="none" stroke="var(--accent)" stroke-width="2" points="${points}"/><line x1="0" y1="62" x2="280" y2="62" stroke="var(--border)"/><circle cx="${(values.length-1)*28+8}" cy="${60 - (values[values.length-1]/max)*48}" r="4" fill="var(--accent)"/></svg>`;
}

function renderLibrary() {
  const el = document.getElementById("library");
  const list = state.prompts
    .filter((p) => (state.category === "all" || p.category === state.category || (state.category === "favorites" && state.favorites.includes(p.id))) && `${p.title} ${p.description} ${(p.tags || []).join(" ")}`.toLowerCase().includes(state.query.toLowerCase()))
    .sort((a, b) => state.sortBy === "name" ? a.title.localeCompare(b.title) : state.sortBy === "complexity" ? (a.complexity || "").localeCompare(b.complexity || "") : state.sortBy === "model" ? (a.target_model || "").localeCompare(b.target_model || "") : (b.updatedAt || "").localeCompare(a.updatedAt || ""));

  el.innerHTML = `<div class="fade-in">
    <h2>Biblioteca de Prompts</h2>
    <div class="row" style="background: var(--card); padding: 12px; border-radius: 12px; margin-bottom: 16px; border: 1px solid var(--border);">
      <input id="search" placeholder="🔍 Buscar por título, tag o contenido" value="${state.query}" style="flex: 1; min-width: 200px; border-color: transparent; background: color-mix(in oklab, var(--bg), #fff 20%);"/>
      <select id="catFilter">
        <option value="all">Todas las categorías</option>
        <option value="favorites" ${state.category === "favorites" ? "selected" : ""}>⭐ Favoritos</option>
        ${categories.map((c) => `<option ${state.category === c ? "selected" : ""}>${c}</option>`).join("")}
      </select>
      <select id="sortBy">
        <option value="date">Ordenar por Fecha</option>
        <option value="name">Ordenar por Nombre</option>
        <option value="complexity">Ordenar por Complejidad</option>
        <option value="model">Ordenar por Modelo</option>
      </select>
    </div>
    
    <div class="list" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 12px;">
      ${list.map((p) => `
        <div class="item" style="display:flex; flex-direction:column; justify-content:space-between;">
          <div>
            <div style="display:flex; justify-content:space-between; align-items:flex-start;">
              <strong style="font-size:1.05rem; display:block; margin-bottom:4px; padding-right:24px; position:relative;">
                ${escapeHtml(p.title)}
                <button class="fav-btn ${state.favorites.includes(p.id) ? 'active' : ''}" data-fav="${p.id}" style="position:absolute; right: -6px; top:-4px;">★</button>
              </strong>
            </div>
            <div class="row" style="margin-bottom:8px;">
              <span class="pill">${p.category}</span>
              <span class="pill" style="background:var(--border); color:var(--text);">${p.target_model}</span>
            </div>
            <p class="small" style="display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; margin-bottom:12px;">${escapeHtml(p.description || "Sin descripción")}</p>
          </div>
          <div class="row" style="margin-top:auto; padding-top:12px; border-top:1px solid var(--border);">
            <button class="btn secondary" data-open="${p.id}" style="flex:1;">Abrir Editor</button>
            <button class="btn secondary" data-dup="${p.id}" title="Duplicar">📑</button>
            <button class="btn danger" data-del="${p.id}" title="Eliminar">🗑️</button>
          </div>
        </div>
      `).join("") || '<div class="empty-state" style="grid-column: 1 / -1;"><div class="icon">🔍</div><h3>No se encontraron prompts</h3><p>Prueba ajustando los filtros de búsqueda.</p></div>'}
    </div>
  </div>`;

  el.querySelector("#search").oninput = (e) => { state.query = e.target.value; renderLibrary(); };
  el.querySelector("#catFilter").onchange = (e) => { state.category = e.target.value; renderLibrary(); };
  el.querySelector("#sortBy").value = state.sortBy;
  el.querySelector("#sortBy").onchange = (e) => { state.sortBy = e.target.value; renderLibrary(); };
  
  el.onclick = (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    if (btn.dataset.open) { loadPrompt(btn.dataset.open); document.querySelector('[data-view="editor"]').click(); }
    if (btn.dataset.dup) duplicatePrompt(btn.dataset.dup);
    if (btn.dataset.del) { if (confirm("¿Estás seguro de eliminar este prompt?")) deletePrompt(btn.dataset.del); }
    if (btn.dataset.fav) { toggleFavorite(btn.dataset.fav); renderLibrary(); }
  };
}

function renderEditor() {
  const p = currentPrompt();
  const el = document.getElementById("editor");
  const words = p.final_prompt.trim() ? p.final_prompt.trim().split(/\s+/).length : 0;
  
  el.innerHTML = `<div class="fade-in">
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 16px;">
      <h2>Editor: ${escapeHtml(p.title)}</h2>
      <button class="fav-btn ${state.favorites.includes(p.id) ? 'active' : ''}" data-fav-ed="${p.id}" style="font-size:1.5rem;">★</button>
    </div>
    
    <div class="grid-2">
      <label>Título<input id="title" value="${escapeHtml(p.title)}"></label>
      <label>Modelo objetivo<input id="target" value="${escapeHtml(p.target_model || "")}"></label>
      <label>Categoría
        <select id="category">
          ${categories.map((c) => `<option ${c === p.category ? "selected" : ""}>${c}</option>`).join("")}
        </select>
      </label>
      <label>Tags (separados por coma)<input id="tags" value="${(p.tags || []).join(",")}"></label>
    </div>
    <div style="margin-top: 12px;">
      <label>Descripción breve<textarea id="description" style="min-height: 60px;">${escapeHtml(p.description || "")}</textarea></label>
    </div>
    
    <div class="card" style="padding:16px; margin: 16px 0; background: color-mix(in oklab, var(--accent-glow) 30%, transparent);">
      <h3 style="margin-top:0; color:var(--accent);">Generador Express</h3>
      <label>Describe tu idea en lenguaje natural para autocompletar el prompt:<textarea id="simpleIdea" placeholder="Ej: Quiero un asistente de ventas que sea empático y cierre tratos..."></textarea></label>
      <div class="row" style="margin-top:10px;"><button id="extreme" class="btn">⚡ Generar Modo Experto</button></div>
    </div>
    
    <label>Prompt principal (Compilado)<textarea id="mainPromptInput" style="font-family: monospace;">${escapeHtml(p.final_prompt || "")}</textarea></label>
    
    <h3 style="margin-top: 24px; border-bottom: 1px solid var(--border); padding-bottom: 8px;">Variables dinámicas ({{VAR_NAME}})</h3>
    <div id="vars" class="list" style="margin-bottom: 16px;">
      ${(p.variables || []).map((v, i) => `
        <div class="row" style="background: var(--card); padding: 8px; border-radius: 8px; border: 1px solid var(--border);">
          <input data-vn="${i}" value="${v.name}" placeholder="NOMBRE_VAR" style="width: 150px; font-family: monospace; font-weight: 600; color: var(--accent);">
          <input data-vd="${i}" value="${escapeHtml(v.default || "")}" placeholder="Valor por defecto" style="flex:1;">
          <button data-vr="${i}" class="btn danger" style="padding: 6px 12px;">✕</button>
        </div>
      `).join("")}
      ${(p.variables?.length || 0) === 0 ? '<div class="small" style="padding:8px 0;">No hay variables definidas. Usa {{NOMBRE}} en tu prompt para que sean dinámicas.</div>' : ''}
    </div>
    <button id="addVar" class="btn secondary">+ Añadir Variable</button>
    
    <div class="card" style="margin-top: 24px; padding: 16px; background: var(--card);">
      <div class="row" style="justify-content: space-between;">
        <div class="row">
          <button id="saveBtn" class="btn success">Guardar Cambios</button>
          <button id="copyBtn" class="btn secondary">Copiar al Portapapeles</button>
        </div>
        <div class="row">
          <select id="exportFormat" style="padding: 7px 10px;">
            <option value="txt">TXT</option>
            <option value="md">Markdown</option>
            <option value="json">JSON</option>
            <option value="html">HTML</option>
          </select>
          <button id="exportBtn" class="btn secondary">Exportar</button>
        </div>
      </div>
    </div>
    <div class="row" style="margin-top:12px; justify-content:space-between;">
      <div class="small">Estadísticas: <strong>${p.final_prompt.length}</strong> caracteres · <strong>${words}</strong> palabras</div>
      <button id="clearBtn" class="btn danger" style="padding: 4px 10px; font-size: 0.8rem;">Vaciar Prompt</button>
    </div>
  </div>`;

  el.oninput = (e) => {
    if (["title", "target", "category", "description", "tags", "mainPromptInput"].includes(e.target.id) || e.target.hasAttribute('data-vn') || e.target.hasAttribute('data-vd')) {
      p.title = el.querySelector("#title").value;
      p.target_model = el.querySelector("#target").value;
      p.category = el.querySelector("#category").value;
      p.description = el.querySelector("#description").value;
      p.tags = el.querySelector("#tags").value.split(",").map((x) => x.trim()).filter(Boolean);
      p.final_prompt = el.querySelector("#mainPromptInput").value;
      [...el.querySelectorAll("[data-vn]")].forEach((inp) => { p.variables[Number(inp.dataset.vn)].name = inp.value; });
      [...el.querySelectorAll("[data-vd]")].forEach((inp) => { p.variables[Number(inp.dataset.vd)].default = inp.value; });
      updatePreview();
    }
  };

  el.onclick = (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    
    if (btn.id === "addVar") { p.variables.push({ name: "NEW_VAR", type: "string", required: false, default: "" }); renderEditor(); }
    if (btn.dataset.vr) { p.variables.splice(Number(btn.dataset.vr), 1); renderEditor(); }
    if (btn.id === "saveBtn") savePrompt();
    if (btn.id === "copyBtn") navigator.clipboard.writeText(p.final_prompt).then(() => pop("Prompt copiado al portapapeles"));
    
    if (btn.id === "exportBtn") {
      const format = el.querySelector("#exportFormat").value;
      if (format === "txt") exportAsTxt(p.final_prompt);
      if (format === "json") exportAsJson(p);
      if (format === "md") exportAsMarkdown(p);
      if (format === "html") exportAsHtml(p);
      pop(`Exportado como ${format.toUpperCase()}`);
    }
    
    if (btn.id === "clearBtn") { 
      if(confirm("¿Estás seguro de limpiar todo el texto del prompt?")) {
        p.final_prompt = ""; renderEditor(); updatePreview(); 
      }
    }
    if (btn.id === "extreme") {
      p.prompt_structure.role = extremePrompt(el.querySelector("#simpleIdea").value || "la tarea solicitada");
      p.final_prompt = compilePromptFromJson(p);
      renderEditor();
      updatePreview();
      pop("¡Estructura de Modo Experto generada!");
    }
    if (btn.dataset.favEd) {
      toggleFavorite(btn.dataset.favEd);
      renderEditor();
    }
  };
}

function renderBuilder() {
  const p = currentPrompt();
  if (!state.builderBlocks.length || state.builderBlocks[0].promptId !== p.id) {
    state.builderBlocks = blockTypes.map((key, idx) => ({ id: uid(), promptId: p.id, key, enabled: true, value: key in p.prompt_structure ? p.prompt_structure[key] : "", order: idx }));
  }
  const el = document.getElementById("builder");
  
  el.innerHTML = `<div class="fade-in">
    <div style="display:flex; justify-content:space-between; align-items:flex-end; margin-bottom: 16px;">
      <div>
        <h2>Constructor Visual Modular</h2>
        <p class="small">Arma el prompt mediante bloques estructurados. Útil para modelos grandes (GPT-4, Claude 3).</p>
      </div>
      <button id="syncBuilder" class="btn success" style="padding: 10px 20px;">Sincronizar hacia el Prompt →</button>
    </div>
    
    <div style="background: var(--card); padding: 16px; border-radius: 12px; border: 1px solid var(--border);">
      ${state.builderBlocks.sort((a,b)=>a.order-b.order).map((b, i) => `
        <div class="builder-block ${!b.enabled ? 'disabled' : ''}" style="${!b.enabled ? 'opacity: 0.6; background: var(--bg);' : ''}">
          <div class="builder-head">
            <div class="row">
              <label class="small" style="flex-direction:row; align-items:center; cursor:pointer;">
                <input type="checkbox" data-en="${i}" ${b.enabled ? "checked" : ""} style="width:16px; height:16px;"/> 
                <strong style="font-size:1.05rem;">${b.key.replace('_', ' ')}</strong>
              </label>
            </div>
            <div class="row">
              <button data-up="${i}" class="btn secondary" style="padding:4px 8px;" title="Subir">↑</button>
              <button data-down="${i}" class="btn secondary" style="padding:4px 8px;" title="Bajar">↓</button>
            </div>
          </div>
          <textarea data-val="${i}" placeholder="Escribe el contenido para ${b.key}..." style="font-family:monospace; min-height:60px;" ${!b.enabled ? 'disabled' : ''}>${Array.isArray(b.value) ? b.value.join("\n") : escapeHtml(b.value || "")}</textarea>
        </div>
      `).join("")}
    </div>
  </div>`;

  el.oninput = (e) => {
    if (e.target.dataset.val) {
      const b = state.builderBlocks[Number(e.target.dataset.val)];
      b.value = ["instructions", "constraints", "quality_criteria"].includes(b.key) ? e.target.value.split("\n").filter(Boolean) : e.target.value;
    }
    if (e.target.dataset.en) {
      state.builderBlocks[Number(e.target.dataset.en)].enabled = e.target.checked;
      renderBuilder();
    }
  };

  el.onclick = (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    
    const swap = (a,b) => ([state.builderBlocks[a].order, state.builderBlocks[b].order] = [state.builderBlocks[b].order, state.builderBlocks[a].order]);
    if (btn.dataset.up && Number(btn.dataset.up) > 0) { swap(Number(btn.dataset.up), Number(btn.dataset.up)-1); renderBuilder(); }
    if (btn.dataset.down && Number(btn.dataset.down) < state.builderBlocks.length - 1) { swap(Number(btn.dataset.down), Number(btn.dataset.down)+1); renderBuilder(); }
    
    if (btn.id === "syncBuilder") {
      state.builderBlocks.filter((b) => b.enabled).forEach((b) => {
        if (["style", "validations", "final_notes", "variables"].includes(b.key)) return;
        p.prompt_structure[b.key] = b.value;
      });
      p.final_prompt = compilePromptFromJson(p);
      savePrompt();
      updatePreview();
      pop("Sincronización completada con éxito");
    }
  };
}

function renderTemplates() {
  const el = document.getElementById("templates");
  
  el.innerHTML = `<div class="fade-in">
    <h2>Sistema de Plantillas</h2>
    <p class="small" style="margin-bottom: 20px;">Utiliza una de nuestras ${initialTemplates.length} plantillas predefinidas optimizadas para diferentes casos de uso.</p>
    
    <div class="list" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 14px;">
      ${initialTemplates.map((t) => `
        <div class="item" style="display:flex; flex-direction:column;">
          <div style="flex:1;">
            <strong style="font-size:1.05rem; display:block; margin-bottom:6px;">${t.title}</strong>
            <div class="row" style="margin-bottom:8px;">
              <span class="pill" style="background:var(--card); border:1px solid var(--border);">${t.category}</span>
            </div>
            <p class="small" style="margin-bottom:12px;">${t.description}</p>
          </div>
          <button data-use="${t.id}" class="btn secondary" style="width:100%;">Usar esta plantilla</button>
        </div>
      `).join("")}
    </div>
    
    <div class="card" style="margin-top: 32px; padding: 20px;">
      <h3>Importar Prompt desde JSON</h3>
      <textarea id="importJson" placeholder='{"title": "Mi Prompt", "category": "General", ... }' style="font-family:monospace; min-height:120px; margin-bottom:12px;"></textarea>
      <div class="row">
        <button id="importBtn" class="btn">Procesar e Importar</button>
        <span id="importMsg" class="small" style="font-weight:600;"></span>
      </div>
    </div>
  </div>`;
  
  el.onclick = (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    
    if (btn.dataset.use) {
      const tpl = clone(initialTemplates.find((t) => t.id === btn.dataset.use));
      tpl.id = uid();
      tpl.title = `${tpl.title} (nuevo)`;
      tpl.updatedAt = new Date().toISOString();
      tpl.versions = [];
      tpl.final_prompt = compilePromptFromJson(tpl);
      state.prompts.unshift(tpl);
      state.currentId = tpl.id;
      savePrompt();
      document.querySelector('[data-view="editor"]').click();
      pop("Plantilla cargada correctamente");
    }
    
    if (btn.id === "importBtn") {
      const msg = el.querySelector("#importMsg");
      try {
        const parsed = JSON.parse(el.querySelector("#importJson").value);
        const check = validatePromptJson(parsed);
        if (!check.valid) {
          msg.textContent = `Error: ${check.errors.join(" | ")}`;
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
        msg.textContent = "Prompt importado exitosamente";
        msg.style.color = "var(--success)";
        el.querySelector("#importJson").value = "";
        setTimeout(() => document.querySelector('[data-view="editor"]').click(), 1000);
      } catch {
        msg.textContent = "El texto no es un JSON válido";
        msg.style.color = "var(--danger)";
      }
    }
  };
}

function renderSettings() {
  const el = document.getElementById("settings");
  el.innerHTML = `<div class="fade-in">
    <h2>Ajustes y Datos</h2>
    <div class="card" style="padding: 20px; margin-bottom: 20px;">
      <h3>Gestión de Datos (Copias de Seguridad)</h3>
      <p class="small" style="margin-bottom: 16px;">Tus prompts se guardan localmente en tu navegador. Si limpias el historial o cambias de navegador, los perderás. ¡Haz copias de seguridad regulares!</p>
      
      <div class="grid-2">
        <div style="border: 1px solid var(--border); padding: 16px; border-radius: 12px;">
          <h4>Exportar Colección</h4>
          <p class="small">Descarga todos tus prompts y favoritos en un archivo JSON.</p>
          <button id="backupExport" class="btn" style="margin-top: 10px; width: 100%;">Descargar Backup</button>
        </div>
        <div style="border: 1px solid var(--border); padding: 16px; border-radius: 12px;">
          <h4>Importar Colección</h4>
          <p class="small">Restaura un archivo JSON de respaldo previo.</p>
          <input type="file" id="backupInput" accept=".json" style="display:none;" />
          <button id="backupImport" class="btn secondary" style="margin-top: 10px; width: 100%;">Seleccionar Archivo JSON</button>
        </div>
      </div>
    </div>
    
    <div class="card" style="padding: 20px; border-color: var(--danger);">
      <h3 style="color: var(--danger);">Zona de Peligro</h3>
      <p class="small" style="margin-bottom: 16px;">Estas acciones no se pueden deshacer.</p>
      <button id="deleteAll" class="btn danger">Borrar Todos los Prompts Locales</button>
    </div>
  </div>`;
  
  el.onclick = (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    
    if (btn.id === "backupExport") {
      exportCollection(state.prompts);
      pop("Backup descargado");
    }
    
    if (btn.id === "backupImport") {
      el.querySelector("#backupInput").click();
    }
    
    if (btn.id === "deleteAll") {
      if (confirm("⚠️ ADVERTENCIA: Se eliminarán TODOS tus prompts permanentemente. ¿Estás absolutamente seguro?")) {
        if (confirm("Por favor, confirma una vez más. Esto no se puede deshacer.")) {
          state.prompts = [];
          state.favorites = [];
          state.currentId = null;
          persistAllPrompts([]);
          saveFavorites([]);
          pop("Todos los prompts han sido eliminados");
          renderAll();
        }
      }
    }
  };
  
  el.querySelector("#backupInput").onchange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = importFullBackup(ev.target.result);
        if (confirm(`Se han encontrado ${data.prompts.length} prompts. ¿Deseas reemplazar tu colección actual (Reemplazar) o añadir a la actual (Añadir)?\n\nAceptar = Añadir\nCancelar = Reemplazar`)) {
          // Merge (avoid duplicate IDs)
          const existingIds = new Set(state.prompts.map(p => p.id));
          const newPrompts = data.prompts.filter(p => !existingIds.has(p.id));
          state.prompts = [...newPrompts, ...state.prompts];
          state.favorites = [...new Set([...state.favorites, ...data.favorites])];
          pop(`Se añadieron ${newPrompts.length} prompts nuevos`);
        } else {
          // Replace
          state.prompts = data.prompts;
          state.favorites = data.favorites;
          pop("Colección reemplazada exitosamente");
        }
        state.currentId = state.prompts[0]?.id || null;
        persistAllPrompts(state.prompts);
        saveFavorites(state.favorites);
        renderAll();
      } catch (err) {
        alert("Error al importar: " + err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = ""; // Reset
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
        msg.textContent = "JSON aplicado y guardado";
        msg.style.color = "var(--success)";
        savePrompt();
      } catch {
        msg.textContent = "Sintaxis JSON inválida";
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
      pop("Nueva versión registrada");
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
      const diffHtml = curr.map((line, i) => {
        if (line === old[i]) return `  ${escapeHtml(line)}`;
        return `<span style="color:var(--danger)">- ${escapeHtml(old[i] || "")}</span>\n<span style="color:var(--success)">+ ${escapeHtml(line)}</span>`;
      }).join("\n");
      
      document.getElementById("diffBox").innerHTML = `<strong>Comparando con v${idx+1} (${new Date(v.timestamp).toLocaleTimeString()})</strong>\n\n${diffHtml}`;
      document.querySelectorAll("[data-v]").forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
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

function setupKeyboard() {
  window.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey) {
      if (e.key === 's') {
        e.preventDefault();
        if (!document.getElementById("editor").classList.contains("hidden")) {
          savePrompt();
        }
      } else if (e.key === 'n') {
        e.preventDefault();
        document.getElementById("newPrompt").click();
      }
    }
  });
}

function renderAll() {
  renderDashboard();
  renderLibrary();
  renderEditor();
  renderBuilder();
  renderTemplates();
  renderSettings();
  updatePreview();
}

function init() {
  setupMenu();
  setupTabs();
  setupTheme();
  setupKeyboard();
  
  state.prompts = loadAllPrompts();
  state.favorites = loadFavorites();
  
  if (!state.prompts.length) {
    state.prompts = initialTemplates.slice(0, 4).map((t) => ({ ...clone(t), id: uid(), updatedAt: new Date().toISOString(), versions: [] }));
    persistAllPrompts(state.prompts);
  }
  
  state.currentId = state.prompts[0].id;
  state.prompts.forEach((p) => { p.final_prompt = p.final_prompt || compilePromptFromJson(p); });
  
  renderAll();
}

init();
