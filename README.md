# PromptForge Studio v2.0

🚀 **[Accede a la aplicación en vivo aquí](https://oprbguitar.github.io/MiniApps/)**

Laboratorio interactivo y profesional para diseñar, organizar, auditar y exportar prompts avanzados para múltiples modelos de Inteligencia Artificial (ChatGPT, Claude, Gemini, Midjourney, etc).

## 🚀 Novedades en v2.0
- **Sistema de Favoritos**: Marca y filtra tus prompts más usados.
- **Backups Completos**: Importa y exporta colecciones completas en formato JSON.
- **Nuevas Exportaciones**: Exporta en TXT, JSON, Markdown y HTML estilizado.
- **Plantillas Extendidas**: Más de 20 plantillas iniciales cubriendo SEO, Data Science, UX/UI, Educación, DevOps, Legal y más.
- **Interfaz Renovada**: Diseño ultra-pulido, responsive, modo oscuro/claro y atajos de teclado (`Ctrl+S`, `Ctrl+N`).
- **Análisis Visual**: Panel de estadísticas actualizado con SVG sparklines y score circle.

## 📂 Estructura del Proyecto

```
MiniApps/
  index.html     # Shell principal e interfaz
  styles.css     # Diseño responsive, variables de color y animaciones
  app.js         # Lógica central, estado, navegación y renderizado
  templates.js   # Categorías, bloques de prompt y 20+ plantillas iniciales
  storage.js     # Persistencia local (localStorage), historial, y backups
  export.js      # Lógica de descarga (TXT, JSON, MD, HTML)
  README.md      # Esta documentación
```

## 🛠️ Ejecución Local

Este proyecto es **100% frontend** y no requiere de Node.js, dependencias ni backend. Toda la información se guarda localmente en el navegador, ofreciendo total privacidad.

### Opción 1 (Directa)
Simplemente abre `index.html` en cualquier navegador moderno (Chrome, Firefox, Safari, Edge).

### Opción 2 (Servidor Local)
Para evitar cualquier restricción de CORS al exportar/importar, puedes levantar un servidor HTTP simple:
```bash
# Python 3
python -m http.server 8080

# o con Node.js
npx http-server
```
Luego visita `http://localhost:8080`.

## ⚙️ Características Principales

1. **Dashboard Analítico**: Resumen visual de tu colección, uso de modelos y categorías, junto a un gráfico de actividad reciente.
2. **Biblioteca Organizada**: Búsqueda en tiempo real, filtros por categoría y favoritos.
3. **Editor Avanzado**: 
   - Soporte nativo para variables dinámicas (Ej. `{{TOPIC}}`).
   - Modo "Prompt Extremo" para autogenerar estructuras de alta complejidad.
   - Panel de evaluación en vivo que califica claridad, longitud y restricciones del prompt.
4. **Constructor Modular**: Arma prompts como si fueran bloques de Lego. Activa o desactiva "Contexto", "Rol", "Restricciones", etc.
5. **Control de Versiones**: Guarda snapshots de tu prompt y compara diferencias visualmente a medida que iteras.
6. **Panel JSON/SVG**: Edición avanzada directamente desde el código fuente JSON, y un diagrama de flujo en formato SVG generado en tiempo real.

## 💾 Gestión de Datos
Puedes descargar toda tu base de prompts desde **Ajustes > Descargar Backup** y luego restaurarlos en otro ordenador o navegador. 

*Nota: Dado que funciona Offline/Local, vaciar el caché del navegador eliminará los prompts que no tengan un backup exportado.*

## 🤝 Mejoras Futuras Sugeridas
- Integración opcional mediante API Key para probar los prompts directamente en la interfaz.
- Importación en bloque desde archivos CSV (para equipos).
- Diff palabra a palabra más granular para el control de versiones.
