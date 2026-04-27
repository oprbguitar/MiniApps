export const categories = [
  "ChatGPT", "Codex", "Imagen", "Video", "Música", "Investigación", "Tesis", "Automatización", "Marketing", "Programación", "Análisis de documentos", "Prompts JSON"
];

const base = {
  complexity: "advanced",
  language: "Spanish",
  tags: ["investigación"],
  variables: [{ name: "TOPIC", type: "string", required: true, default: "" }],
  prompt_structure: {
    role: "",
    context: "",
    objective: "",
    instructions: [],
    constraints: [],
    output_format: "Markdown",
    quality_criteria: [],
    examples: []
  },
  final_prompt: ""
};

export const initialTemplates = [
  { id: "advanced_chatgpt_prompt_template", title: "Prompt avanzado para ChatGPT", category: "ChatGPT", target_model: "GPT-5.5", description: "Plantilla extensa para construir prompts profesionales, reutilizables y auditables.", tags: ["académico", "análisis"], variables: [{ name: "TOPIC", type: "string", required: true, default: "Tema principal" }, { name: "AUDIENCE", type: "string", required: false, default: "Usuario general" }, { name: "OUTPUT_FORMAT", type: "string", required: false, default: "Markdown estructurado" }], prompt_structure: { role: "Actúa como un experto senior en {{TOPIC}}, con capacidad de análisis crítico, estructuración profesional y explicación clara.", context: "El usuario necesita una respuesta completa, precisa, verificable y útil para {{AUDIENCE}}.", objective: "Desarrollar una respuesta avanzada sobre {{TOPIC}}, evitando generalidades, errores no verificados o afirmaciones sin sustento.", instructions: ["Analiza el problema antes de responder.", "Separa hechos, interpretación y recomendaciones.", "Usa estructura clara con títulos y subtítulos.", "Incluye advertencias cuando exista incertidumbre.", "Evita inventar datos.", "Si se requieren fuentes actuales, indica que deben verificarse."], constraints: ["No usar relleno.", "No exagerar conclusiones.", "No asumir información no entregada.", "No mezclar formatos incompatibles.", "No omitir limitaciones relevantes."], output_format: "{{OUTPUT_FORMAT}}", quality_criteria: ["Claridad", "Precisión", "Profundidad", "Utilidad práctica", "Trazabilidad", "Consistencia"], examples: [{ input: "Analiza este proceso administrativo", expected_output: "Diagnóstico, problemas, causas, mejoras y formato de implementación." }] }, final_prompt: "", complexity: "expert", language: "Spanish" },
  { ...base, id: "tpl_academico", title: "Análisis académico", category: "Investigación", target_model: "Claude", description: "Revisión crítica de papers, hipótesis y metodología.", tags: ["académico", "investigación"] },
  { ...base, id: "tpl_codex", title: "Páginas web con Codex", category: "Codex", target_model: "Codex", description: "Especificación técnica full-stack con criterios de QA.", tags: ["código", "automatización"] },
  { ...base, id: "tpl_imagen", title: "Generación de imágenes", category: "Imagen", target_model: "Midjourney", description: "Prompt de arte visual por capas.", tags: ["creativo", "imagen"] },
  { ...base, id: "tpl_agentes", title: "Automatización con agentes", category: "Automatización", target_model: "Gemini", description: "Definición de flujos multiagente y validaciones.", tags: ["automatización"] },
  { ...base, id: "tpl_tesis", title: "Análisis de tesis", category: "Tesis", target_model: "ChatGPT", description: "Evaluación estructurada de tesis.", tags: ["académico", "análisis"] },
  { ...base, id: "tpl_dash", title: "Creación de dashboards", category: "Programación", target_model: "GPT-5", description: "Prompt para dashboard y métricas.", tags: ["código", "análisis"] },
  { ...base, id: "tpl_suno", title: "Música con Suno", category: "Música", target_model: "Suno", description: "Dirección musical con tempo y textura.", tags: ["audio", "creativo"] },
  { ...base, id: "tpl_json", title: "JSON generalista", category: "Prompts JSON", target_model: "ChatGPT", description: "Estructuras JSON reutilizables.", tags: ["análisis"] },
  { ...base, id: "tpl_legal", title: "Análisis legal/documental", category: "Análisis de documentos", target_model: "Claude", description: "Extracción de riesgos y matriz normativa.", tags: ["legal", "análisis"] },
  { ...base, id: "tpl_writing", title: "Escritura profesional", category: "Marketing", target_model: "Gemini", description: "Escritura business con tono y audiencia.", tags: ["creativo", "marketing"] }
];

export const blockTypes = ["role", "context", "objective", "instructions", "constraints", "output_format", "examples", "variables", "quality_criteria", "style", "validations", "final_notes"];
