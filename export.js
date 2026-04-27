const download = (name, content, mime) => {
  const blob = new Blob([content], { type: mime });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  URL.revokeObjectURL(a.href);
};

export const exportAsTxt = (prompt) => download(`${prompt.title || "prompt"}.txt`, typeof prompt === 'string' ? prompt : prompt.final_prompt || '', "text/plain;charset=utf-8");

export const exportAsJson = (promptObject) => download(`${promptObject.title || "prompt"}.json`, JSON.stringify(promptObject, null, 2), "application/json");

export const exportAsMarkdown = (promptObject) => {
  const ps = promptObject.prompt_structure || {};
  const vars = (promptObject.variables || []).map(v => `| \`${v.name}\` | ${v.type} | ${v.required ? '✅' : '❌'} | ${v.default || '—'} |`).join('\n');
  const md = `# ${promptObject.title}

## Metadata
| Campo | Valor |
|-------|-------|
| Categoría | ${promptObject.category} |
| Modelo | ${promptObject.target_model} |
| Complejidad | ${promptObject.complexity || 'advanced'} |
| Idioma | ${promptObject.language || 'Spanish'} |

## Descripción
${promptObject.description || 'Sin descripción.'}

## Variables
| Nombre | Tipo | Requerida | Default |
|--------|------|-----------|---------|
${vars || '| — | — | — | — |'}

## Estructura del Prompt

### Rol
${ps.role || '—'}

### Contexto
${ps.context || '—'}

### Objetivo
${ps.objective || '—'}

### Instrucciones
${(ps.instructions || []).map(i => `- ${i}`).join('\n') || '—'}

### Restricciones
${(ps.constraints || []).map(c => `- ${c}`).join('\n') || '—'}

### Formato de Salida
${ps.output_format || '—'}

### Criterios de Calidad
${(ps.quality_criteria || []).map(q => `- ${q}`).join('\n') || '—'}

## Prompt Compilado
\`\`\`
${promptObject.final_prompt || '—'}
\`\`\`

---
*Exportado con PromptForge Studio — ${new Date().toISOString()}*
`;
  download(`${promptObject.title || "prompt"}.md`, md, "text/markdown;charset=utf-8");
};

export const exportAsHtml = (promptObject) => {
  const html = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>${promptObject.title}</title>
<style>body{font-family:Inter,sans-serif;max-width:800px;margin:2rem auto;padding:0 1rem;background:#0f1422;color:#edf2ff}
h1{color:#8a7dff}h2{color:#7c9bff;border-bottom:1px solid #2a3756;padding-bottom:.4rem}
pre{background:#171f33;padding:1rem;border-radius:12px;overflow-x:auto;border:1px solid #2a3756}
table{width:100%;border-collapse:collapse}th,td{border:1px solid #2a3756;padding:8px;text-align:left}th{background:#1a2440}
.pill{display:inline-block;background:#211f46;color:#8a7dff;padding:4px 10px;border-radius:99px;font-size:.85rem}
</style></head><body>
<h1>${promptObject.title}</h1>
<p><span class="pill">${promptObject.category}</span> <span class="pill">${promptObject.target_model}</span></p>
<p>${promptObject.description || ''}</p>
<h2>Prompt Compilado</h2><pre>${promptObject.final_prompt || ''}</pre>
<h2>Estructura</h2><pre>${JSON.stringify(promptObject.prompt_structure, null, 2)}</pre>
<p style="color:#6a7691;font-size:.85rem">Exportado con PromptForge Studio</p>
</body></html>`;
  download(`${promptObject.title || "prompt"}.html`, html, "text/html;charset=utf-8");
};

export const exportCollection = (prompts) => {
  const data = { version: 2, exportedAt: new Date().toISOString(), count: prompts.length, prompts };
  download(`promptforge_collection_${Date.now()}.json`, JSON.stringify(data, null, 2), "application/json");
};
