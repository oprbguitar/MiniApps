const KEY = "promptforge_prompts_v1";
const FAV_KEY = "promptforge_favorites_v1";
const HISTORY_KEY = "promptforge_history_v1";

export const loadAllPrompts = () => {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
};

export const persistAllPrompts = (prompts) => {
  localStorage.setItem(KEY, JSON.stringify(prompts));
};

export const loadTheme = () => localStorage.getItem("promptforge_theme") || "dark";
export const saveTheme = (theme) => localStorage.setItem("promptforge_theme", theme);

export const loadFavorites = () => {
  try { return JSON.parse(localStorage.getItem(FAV_KEY) || "[]"); } catch { return []; }
};
export const saveFavorites = (favs) => localStorage.setItem(FAV_KEY, JSON.stringify(favs));

export const loadHistory = () => {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]"); } catch { return []; }
};
export const addHistory = (entry) => {
  const hist = loadHistory();
  hist.unshift({ ...entry, timestamp: new Date().toISOString() });
  if (hist.length > 50) hist.length = 50;
  localStorage.setItem(HISTORY_KEY, JSON.stringify(hist));
};

export const exportFullBackup = (prompts) => {
  const data = { version: 2, exportedAt: new Date().toISOString(), prompts, favorites: loadFavorites() };
  return JSON.stringify(data, null, 2);
};

export const importFullBackup = (jsonString) => {
  const data = JSON.parse(jsonString);
  if (data.version && Array.isArray(data.prompts)) {
    return { prompts: data.prompts, favorites: data.favorites || [] };
  }
  if (Array.isArray(data)) return { prompts: data, favorites: [] };
  throw new Error("Formato de backup no reconocido");
};
