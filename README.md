# PromptForge Advanced Studio

Laboratorio interactivo para diseñar, organizar y exportar prompts avanzados para múltiples modelos de IA.

## Estructura

```
MiniApps/
  index.html
  styles.css
  app.js
  templates.js
  storage.js
  export.js
  README.md
```

## Ejecución local

No requiere backend.

### Opción 1 (rápida)
Abre `index.html` directamente en un navegador moderno.

### Opción 2 (recomendada)
Servir estáticos para evitar restricciones de algunos navegadores:

```bash
python3 -m http.server 8080
```

Luego visita `http://localhost:8080`.

## Módulos

- `app.js`: estado global, renderizado de secciones, editor, constructor visual por bloques, validación JSON, compilación de prompt, SVG flow, evaluador, comparador de versiones, modo Prompt Extremo.
- `templates.js`: categorías, bloques soportados y plantillas iniciales (incluida la plantilla avanzada de ChatGPT y 10 plantillas adicionales).
- `storage.js`: persistencia en `localStorage` para prompts y tema.
- `export.js`: exportación a TXT, JSON y Markdown.
- `styles.css`: diseño responsive tipo SaaS, dark/light mode, layout de tres paneles, resaltado JSON básico, microinteracciones.
- `index.html`: shell principal con sidebar, vistas centrales y panel derecho (preview / JSON / SVG / versiones).

## Funciones clave implementadas

- `createPrompt()`
- `savePrompt()`
- `loadPrompt(id)`
- `deletePrompt(id)`
- `duplicatePrompt(id)`
- `compilePromptFromJson(json)`
- `validatePromptJson(json)`
- `exportAsTxt(prompt)`
- `exportAsJson(promptObject)`
- `exportAsMarkdown(promptObject)`
- `renderSvgFlow(promptObject)`
- `updatePreview()`

## Mejoras futuras sugeridas

1. Diff semántico de versiones (palabra a palabra).
2. Editor JSON con linting y autocomplete.
3. Presets de evaluador por dominio (legal, investigación, coding).
4. Import/export de colecciones completas (`.zip`).
5. Modo colaboración (cuando se agregue backend opcional).
