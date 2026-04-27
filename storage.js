const KEY = "promptforge_prompts_v1";

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

export const loadTheme = () => localStorage.getItem("promptforge_theme") || "light";
export const saveTheme = (theme) => localStorage.setItem("promptforge_theme", theme);
