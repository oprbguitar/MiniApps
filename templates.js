export const categories = [
  "ChatGPT", "Codex", "Imagen", "Video", "Música", "Investigación", "Tesis",
  "Automatización", "Marketing", "Programación", "Análisis de documentos",
  "Prompts JSON", "SEO", "Data Science", "Educación", "UX/UI", "DevOps", "Legal"
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
  {
    id: "advanced_chatgpt_prompt_template",
    title: "Prompt avanzado para ChatGPT",
    category: "ChatGPT",
    target_model: "GPT-5.5",
    description: "Plantilla extensa para construir prompts profesionales, reutilizables y auditables.",
    tags: ["académico", "análisis"],
    variables: [
      { name: "TOPIC", type: "string", required: true, default: "Tema principal" },
      { name: "AUDIENCE", type: "string", required: false, default: "Usuario general" },
      { name: "OUTPUT_FORMAT", type: "string", required: false, default: "Markdown estructurado" }
    ],
    prompt_structure: {
      role: "Actúa como un experto senior en {{TOPIC}}, con capacidad de análisis crítico, estructuración profesional y explicación clara.",
      context: "El usuario necesita una respuesta completa, precisa, verificable y útil para {{AUDIENCE}}.",
      objective: "Desarrollar una respuesta avanzada sobre {{TOPIC}}, evitando generalidades, errores no verificados o afirmaciones sin sustento.",
      instructions: ["Analiza el problema antes de responder.", "Separa hechos, interpretación y recomendaciones.", "Usa estructura clara con títulos y subtítulos.", "Incluye advertencias cuando exista incertidumbre.", "Evita inventar datos.", "Si se requieren fuentes actuales, indica que deben verificarse."],
      constraints: ["No usar relleno.", "No exagerar conclusiones.", "No asumir información no entregada.", "No mezclar formatos incompatibles.", "No omitir limitaciones relevantes."],
      output_format: "{{OUTPUT_FORMAT}}",
      quality_criteria: ["Claridad", "Precisión", "Profundidad", "Utilidad práctica", "Trazabilidad", "Consistencia"],
      examples: [{ input: "Analiza este proceso administrativo", expected_output: "Diagnóstico, problemas, causas, mejoras y formato de implementación." }]
    },
    final_prompt: "",
    complexity: "expert",
    language: "Spanish"
  },
  {
    ...base, id: "tpl_academico", title: "Análisis académico", category: "Investigación", target_model: "Claude",
    description: "Revisión crítica de papers, hipótesis y metodología.",
    tags: ["académico", "investigación"],
    prompt_structure: { ...base.prompt_structure, role: "Investigador académico senior con experiencia en revisión por pares.", context: "Revisión de artículo o tesis en {{TOPIC}}.", objective: "Evaluar rigor metodológico, validez de hipótesis y calidad de evidencia.", instructions: ["Identificar fortalezas y debilidades.", "Evaluar metodología.", "Verificar coherencia argumentativa.", "Sugerir mejoras concretas."], constraints: ["No inventar referencias.", "Mantener tono académico."], quality_criteria: ["Rigor", "Objetividad", "Profundidad"] }
  },
  {
    ...base, id: "tpl_codex", title: "Páginas web con Codex", category: "Codex", target_model: "Codex",
    description: "Especificación técnica full-stack con criterios de QA.",
    tags: ["código", "automatización"],
    prompt_structure: { ...base.prompt_structure, role: "Desarrollador full-stack senior.", context: "Creación de aplicación web sobre {{TOPIC}}.", objective: "Generar código limpio, modular y bien documentado.", instructions: ["Usar HTML semántico.", "CSS responsive.", "JavaScript modular.", "Incluir accesibilidad."], constraints: ["Sin frameworks pesados.", "Código auto-documentado."], quality_criteria: ["Funcionalidad", "Legibilidad", "Performance"] }
  },
  {
    ...base, id: "tpl_imagen", title: "Generación de imágenes", category: "Imagen", target_model: "Midjourney",
    description: "Prompt de arte visual por capas con estilos detallados.",
    tags: ["creativo", "imagen"],
    prompt_structure: { ...base.prompt_structure, role: "Director de arte visual y fotógrafo profesional.", context: "Generación de imagen artística sobre {{TOPIC}}.", objective: "Crear descripción visual ultra-detallada por capas.", instructions: ["Definir composición principal.", "Especificar iluminación.", "Detallar paleta cromática.", "Incluir estilo artístico.", "Definir textura y materiales."], constraints: ["Sin texto en la imagen.", "Estilo coherente."], quality_criteria: ["Impacto visual", "Coherencia estilística", "Detalle técnico"] }
  },
  {
    ...base, id: "tpl_agentes", title: "Automatización con agentes", category: "Automatización", target_model: "Gemini",
    description: "Definición de flujos multiagente y validaciones.",
    tags: ["automatización"],
    prompt_structure: { ...base.prompt_structure, role: "Arquitecto de sistemas multiagente.", context: "Diseño de pipeline automatizado para {{TOPIC}}.", objective: "Definir agentes, roles, comunicación y validaciones.", instructions: ["Definir cada agente y su responsabilidad.", "Especificar flujo de datos.", "Incluir manejo de errores.", "Documentar puntos de decisión."], constraints: ["Agentes independientes.", "Validación en cada paso."], quality_criteria: ["Modularidad", "Robustez", "Trazabilidad"] }
  },
  {
    ...base, id: "tpl_tesis", title: "Análisis de tesis", category: "Tesis", target_model: "ChatGPT",
    description: "Evaluación estructurada de tesis académicas.",
    tags: ["académico", "análisis"],
    prompt_structure: { ...base.prompt_structure, role: "Director de tesis doctoral con 20 años de experiencia.", context: "Evaluación de tesis sobre {{TOPIC}}.", objective: "Análisis completo de estructura, metodología y conclusiones.", instructions: ["Evaluar planteamiento del problema.", "Revisar marco teórico.", "Analizar metodología.", "Validar conclusiones.", "Sugerir mejoras."], constraints: ["Feedback constructivo.", "Basarse en evidencia presentada."], quality_criteria: ["Profundidad", "Utilidad", "Claridad"] }
  },
  {
    ...base, id: "tpl_dash", title: "Creación de dashboards", category: "Programación", target_model: "GPT-5",
    description: "Prompt para dashboard interactivo con métricas y gráficos.",
    tags: ["código", "análisis"],
    prompt_structure: { ...base.prompt_structure, role: "Especialista en visualización de datos y BI.", context: "Dashboard para monitorear {{TOPIC}}.", objective: "Diseñar dashboard con KPIs, gráficos y filtros interactivos.", instructions: ["Definir KPIs principales.", "Diseñar layout responsive.", "Incluir gráficos interactivos.", "Agregar filtros dinámicos."], constraints: ["Datos en tiempo real.", "Accesible en móvil."], quality_criteria: ["Usabilidad", "Claridad visual", "Performance"] }
  },
  {
    ...base, id: "tpl_suno", title: "Música con Suno", category: "Música", target_model: "Suno",
    description: "Dirección musical detallada con tempo, textura y estructura.",
    tags: ["audio", "creativo"],
    prompt_structure: { ...base.prompt_structure, role: "Productor musical y compositor profesional.", context: "Composición musical sobre {{TOPIC}}.", objective: "Generar directrices musicales precisas para IA.", instructions: ["Definir género y subgénero.", "Especificar BPM y tonalidad.", "Detallar instrumentación.", "Describir estructura (intro, verso, coro).", "Indicar mood y energía."], constraints: ["Duración máxima 4 minutos.", "Estilo consistente."], quality_criteria: ["Coherencia musical", "Originalidad", "Producción"] }
  },
  {
    ...base, id: "tpl_json", title: "JSON generalista", category: "Prompts JSON", target_model: "ChatGPT",
    description: "Estructuras JSON reutilizables para cualquier dominio.",
    tags: ["análisis"],
    prompt_structure: { ...base.prompt_structure, role: "Arquitecto de datos JSON/API.", context: "Modelado de datos para {{TOPIC}}.", objective: "Diseñar esquema JSON limpio, tipado y extensible.", instructions: ["Definir tipos de datos.", "Incluir validaciones.", "Documentar cada campo.", "Proveer ejemplo completo."], constraints: ["JSON válido.", "Campos autodescriptivos."], quality_criteria: ["Completitud", "Consistencia", "Extensibilidad"] }
  },
  {
    ...base, id: "tpl_legal", title: "Análisis legal/documental", category: "Legal", target_model: "Claude",
    description: "Extracción de riesgos, cláusulas críticas y matriz normativa.",
    tags: ["legal", "análisis"],
    prompt_structure: { ...base.prompt_structure, role: "Abogado corporativo senior especializado en compliance.", context: "Análisis de documento legal sobre {{TOPIC}}.", objective: "Identificar riesgos, obligaciones y recomendaciones.", instructions: ["Extraer cláusulas críticas.", "Identificar riesgos potenciales.", "Crear matriz de cumplimiento.", "Sugerir modificaciones."], constraints: ["No constituye asesoría legal.", "Citar normativa aplicable."], quality_criteria: ["Precisión legal", "Completitud", "Accionabilidad"] }
  },
  {
    ...base, id: "tpl_writing", title: "Escritura profesional", category: "Marketing", target_model: "Gemini",
    description: "Escritura business con control de tono, audiencia y CTA.",
    tags: ["creativo", "marketing"],
    prompt_structure: { ...base.prompt_structure, role: "Copywriter senior y estratega de contenido.", context: "Creación de contenido profesional sobre {{TOPIC}}.", objective: "Generar texto persuasivo y orientado a conversión.", instructions: ["Definir tono de voz.", "Identificar pain points.", "Incluir CTA claro.", "Optimizar para lectura rápida."], constraints: ["Sin jerga innecesaria.", "Mantener autenticidad."], quality_criteria: ["Persuasión", "Claridad", "Engagement"] }
  },
  {
    ...base, id: "tpl_seo", title: "Estrategia SEO completa", category: "SEO", target_model: "GPT-5.5",
    description: "Auditoría SEO, keywords, contenido optimizado y link building.",
    tags: ["SEO", "marketing", "digital"],
    variables: [{ name: "TOPIC", type: "string", required: true, default: "" }, { name: "WEBSITE", type: "string", required: false, default: "" }],
    prompt_structure: { ...base.prompt_structure, role: "Consultor SEO senior con 10+ años en posicionamiento orgánico.", context: "Estrategia de posicionamiento web para {{TOPIC}} en {{WEBSITE}}.", objective: "Crear plan SEO integral con keywords, on-page, off-page y medición.", instructions: ["Realizar análisis de keywords primarias y long-tail.", "Auditar estructura técnica del sitio.", "Proponer calendario de contenidos.", "Diseñar estrategia de link building.", "Definir KPIs y herramientas de seguimiento."], constraints: ["Solo técnicas white-hat.", "Priorizar intent del usuario.", "No prometer posiciones específicas."], output_format: "Informe con secciones, tablas de keywords y plan de acción.", quality_criteria: ["Accionabilidad", "Datos verificables", "ROI estimado"] }
  },
  {
    ...base, id: "tpl_datascience", title: "Pipeline de Data Science", category: "Data Science", target_model: "Claude",
    description: "Diseño de pipeline completo: EDA, features, modelo, evaluación.",
    tags: ["data", "ML", "analytics"],
    prompt_structure: { ...base.prompt_structure, role: "Data Scientist senior especializado en ML aplicado.", context: "Proyecto de análisis de datos y modelado predictivo sobre {{TOPIC}}.", objective: "Diseñar pipeline end-to-end desde datos crudos hasta modelo desplegado.", instructions: ["Definir exploración de datos (EDA).", "Proponer feature engineering.", "Seleccionar y justificar algoritmos.", "Diseñar validación cruzada.", "Definir métricas de evaluación.", "Planificar despliegue."], constraints: ["Documentar supuestos.", "Explicar trade-offs.", "Considerar sesgo en datos."], quality_criteria: ["Reproducibilidad", "Interpretabilidad", "Escalabilidad"] }
  },
  {
    ...base, id: "tpl_education", title: "Diseño instruccional", category: "Educación", target_model: "GPT-5.5",
    description: "Creación de cursos, módulos y evaluaciones pedagógicas.",
    tags: ["educación", "pedagogía"],
    variables: [{ name: "TOPIC", type: "string", required: true, default: "" }, { name: "LEVEL", type: "string", required: false, default: "Intermedio" }],
    prompt_structure: { ...base.prompt_structure, role: "Diseñador instruccional con experiencia en e-learning y pedagogía activa.", context: "Diseño de curso/módulo educativo sobre {{TOPIC}} para nivel {{LEVEL}}.", objective: "Crear estructura pedagógica completa con objetivos, actividades y evaluaciones.", instructions: ["Definir objetivos de aprendizaje (taxonomía de Bloom).", "Diseñar secuencia de contenidos.", "Crear actividades prácticas.", "Proponer evaluaciones formativas y sumativas.", "Incluir recursos complementarios."], constraints: ["Aprendizaje activo, no pasivo.", "Accesible para diferentes estilos de aprendizaje.", "Duración realista."], quality_criteria: ["Alineamiento pedagógico", "Engagement", "Medibilidad"] }
  },
  {
    ...base, id: "tpl_ux", title: "Research y diseño UX", category: "UX/UI", target_model: "Gemini",
    description: "Investigación de usuario, wireframes, tests de usabilidad.",
    tags: ["diseño", "UX", "producto"],
    prompt_structure: { ...base.prompt_structure, role: "UX Researcher y Product Designer senior.", context: "Mejora de experiencia de usuario para {{TOPIC}}.", objective: "Realizar research, definir personas, diseñar flujos y proponer mejoras.", instructions: ["Crear user personas.", "Mapear customer journey.", "Identificar pain points.", "Proponer wireframes.", "Diseñar tests de usabilidad."], constraints: ["Decisiones basadas en datos.", "Accesibilidad WCAG 2.1.", "Mobile-first."], quality_criteria: ["Empatía con usuario", "Viabilidad técnica", "Impacto en métricas"] }
  },
  {
    ...base, id: "tpl_devops", title: "Arquitectura DevOps/Cloud", category: "DevOps", target_model: "Claude",
    description: "CI/CD, infraestructura como código, monitoreo y seguridad.",
    tags: ["infraestructura", "cloud", "CI/CD"],
    prompt_structure: { ...base.prompt_structure, role: "Arquitecto DevOps/SRE senior con certificaciones cloud.", context: "Diseño de infraestructura y pipeline para {{TOPIC}}.", objective: "Crear arquitectura cloud-native con CI/CD, monitoreo y seguridad.", instructions: ["Diseñar pipeline CI/CD.", "Definir infraestructura como código.", "Configurar monitoreo y alertas.", "Implementar estrategias de seguridad.", "Planificar disaster recovery."], constraints: ["Principio de mínimo privilegio.", "Infraestructura reproducible.", "Costos optimizados."], quality_criteria: ["Disponibilidad (SLA)", "Automatización", "Seguridad"] }
  },
  {
    ...base, id: "tpl_video", title: "Guión de video/YouTube", category: "Video", target_model: "GPT-5",
    description: "Guión completo con hook, estructura narrativa y CTA.",
    tags: ["video", "contenido", "YouTube"],
    prompt_structure: { ...base.prompt_structure, role: "Guionista de video y estratega de contenido audiovisual.", context: "Creación de guión de video sobre {{TOPIC}}.", objective: "Generar guión con hook potente, narrativa envolvente y CTA efectivo.", instructions: ["Crear hook de 5 segundos.", "Estructurar en intro, desarrollo y cierre.", "Incluir B-roll suggestions.", "Escribir diálogo/narración natural.", "Definir pantallas de texto o gráficos."], constraints: ["Duración 8-12 minutos.", "Lenguaje conversacional.", "Retención en primer minuto."], quality_criteria: ["Retención de audiencia", "Valor educativo", "Producción"] }
  },
  {
    ...base, id: "tpl_api", title: "Diseño de API REST", category: "Programación", target_model: "Claude",
    description: "Especificación OpenAPI, endpoints, autenticación y versionado.",
    tags: ["API", "backend", "arquitectura"],
    prompt_structure: { ...base.prompt_structure, role: "Arquitecto de APIs y backend senior.", context: "Diseño de API RESTful para {{TOPIC}}.", objective: "Crear especificación completa con endpoints, modelos y documentación.", instructions: ["Definir recursos y endpoints.", "Diseñar esquemas de datos.", "Implementar autenticación/autorización.", "Documentar con OpenAPI 3.0.", "Incluir manejo de errores.", "Planificar versionado."], constraints: ["RESTful estricto.", "Paginación en colecciones.", "Rate limiting."], quality_criteria: ["Consistencia", "Documentación", "Seguridad"] }
  },
  {
    ...base, id: "tpl_email_mkt", title: "Campañas de email marketing", category: "Marketing", target_model: "GPT-5.5",
    description: "Secuencias de email con segmentación, A/B testing y automatización.",
    tags: ["email", "marketing", "automatización"],
    prompt_structure: { ...base.prompt_structure, role: "Email Marketing Strategist con experiencia en automatización.", context: "Campaña de email marketing sobre {{TOPIC}}.", objective: "Diseñar secuencia de emails con alta tasa de apertura y conversión.", instructions: ["Definir segmentos de audiencia.", "Crear secuencia de nurturing.", "Escribir subject lines A/B.", "Diseñar CTAs por etapa.", "Definir triggers de automatización."], constraints: ["Cumplir GDPR/CAN-SPAM.", "Sin spam words.", "Mobile-responsive."], quality_criteria: ["Open rate", "Click-through rate", "Conversión"] }
  },
  {
    ...base, id: "tpl_pitch", title: "Pitch deck para startups", category: "Marketing", target_model: "GPT-5",
    description: "Estructura de presentación para inversores con storytelling.",
    tags: ["startup", "inversión", "presentación"],
    prompt_structure: { ...base.prompt_structure, role: "Asesor de startups y experto en pitch para inversores.", context: "Preparación de pitch deck para startup sobre {{TOPIC}}.", objective: "Crear narrativa persuasiva con datos, problema, solución y proyecciones.", instructions: ["Definir problema y tamaño de mercado.", "Presentar solución y diferenciador.", "Mostrar tracción y métricas.", "Proyectar financieros a 3 años.", "Definir ask y uso de fondos."], constraints: ["Máximo 12 slides.", "Datos verificables.", "1 idea por slide."], quality_criteria: ["Persuasión", "Credibilidad", "Claridad del ask"] }
  },
  {
    ...base, id: "tpl_debug", title: "Debugging sistemático", category: "Programación", target_model: "Claude",
    description: "Metodología paso a paso para diagnosticar y resolver bugs.",
    tags: ["debug", "código", "QA"],
    prompt_structure: { ...base.prompt_structure, role: "Senior Software Engineer especializado en debugging y troubleshooting.", context: "Diagnóstico y resolución de bug en {{TOPIC}}.", objective: "Identificar causa raíz y proponer fix con mínimo impacto.", instructions: ["Reproducir el problema.", "Aislar el componente afectado.", "Analizar logs y stack trace.", "Identificar causa raíz.", "Proponer fix y alternativas.", "Definir tests de regresión."], constraints: ["No parches temporales.", "Documentar la solución.", "Considerar side effects."], quality_criteria: ["Precisión del diagnóstico", "Calidad del fix", "Prevención futura"] }
  },
  {
    ...base, id: "tpl_social", title: "Estrategia de redes sociales", category: "Marketing", target_model: "Gemini",
    description: "Plan de contenido multi-plataforma con calendario editorial.",
    tags: ["social media", "contenido", "branding"],
    prompt_structure: { ...base.prompt_structure, role: "Social Media Strategist con experiencia multi-plataforma.", context: "Estrategia de redes sociales para {{TOPIC}}.", objective: "Crear plan integral de contenidos con calendario y métricas.", instructions: ["Analizar audiencia por plataforma.", "Definir pilares de contenido.", "Crear calendario editorial mensual.", "Diseñar formatos por red.", "Definir KPIs y herramientas de medición."], constraints: ["Contenido original.", "Adaptado a cada plataforma.", "Frecuencia sostenible."], quality_criteria: ["Engagement", "Crecimiento orgánico", "Consistencia de marca"] }
  },
  {
    ...base, id: "tpl_security", title: "Auditoría de seguridad", category: "DevOps", target_model: "Claude",
    description: "Pentesting, análisis de vulnerabilidades y hardening.",
    tags: ["seguridad", "pentesting", "compliance"],
    prompt_structure: { ...base.prompt_structure, role: "Consultor de ciberseguridad y pentester certificado.", context: "Auditoría de seguridad para {{TOPIC}}.", objective: "Identificar vulnerabilidades, evaluar riesgos y proponer mitigaciones.", instructions: ["Enumerar superficie de ataque.", "Clasificar vulnerabilidades (CVSS).", "Realizar análisis de impacto.", "Proponer remediaciones priorizadas.", "Definir plan de hardening."], constraints: ["Uso ético.", "OWASP Top 10.", "Sin explotar vulnerabilidades reales."], quality_criteria: ["Cobertura", "Priorización", "Accionabilidad"] }
  },
  {
    ...base, id: "tpl_product", title: "Product Requirements Document", category: "UX/UI", target_model: "GPT-5.5",
    description: "PRD completo con user stories, criterios de aceptación y roadmap.",
    tags: ["producto", "PM", "agile"],
    prompt_structure: { ...base.prompt_structure, role: "Product Manager senior con experiencia en productos digitales.", context: "Definición de producto digital para {{TOPIC}}.", objective: "Crear PRD completo con visión, user stories y plan de desarrollo.", instructions: ["Definir visión y objetivos del producto.", "Crear user stories con criterios de aceptación.", "Priorizar con framework MoSCoW.", "Diseñar roadmap trimestral.", "Identificar riesgos y dependencias."], constraints: ["User stories verificables.", "Scope realista.", "Métricas de éxito definidas."], quality_criteria: ["Completitud", "Viabilidad", "Alineamiento con negocio"] }
  }
];

export const blockTypes = ["role", "context", "objective", "instructions", "constraints", "output_format", "examples", "variables", "quality_criteria", "style", "validations", "final_notes"];
